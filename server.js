require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://192.168.10.181:11434';
const DEFAULT_MODEL = process.env.MODEL || 'llama3.2';
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 'You are a helpful AI assistant.';

// Database setup
const db = new Database(path.join(__dirname, 'db', 'app.db'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chat_id TEXT UNIQUE NOT NULL,
    title TEXT,
    model TEXT DEFAULT '${DEFAULT_MODEL}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id)
  );

  CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
`);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Check if user is authenticated
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  next();
}

// Check if user is admin
function isAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
}

// Routes

// Authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?')
      .get(username, email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    const info = stmt.run(username, email, hashedPassword);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin === 1
    };
    
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        isAdmin: user.is_admin === 1 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin === 1
    };
    
    res.json({ 
      success: true,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        isAdmin: user.is_admin === 1 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Admin routes
app.post('/api/admin/make-admin', isAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const stmt = db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?');
    stmt.run(userId);
    
    res.json({ success: true, message: 'User promoted to admin' });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

app.post('/api/admin/change-password', isAdmin, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
    
    res.json({ success: true, message: 'Password changed' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.get('/api/admin/users', isAdmin, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, is_admin, created_at FROM users').all();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.delete('/api/admin/users/:userId', isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM chats WHERE user_id = ?').run(req.params.userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.userId);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Chat routes

// Voice-to-text endpoint
app.post('/api/stt', async (req, res) => {
  try {
    const { audio } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio data provided' });
    }
    
    // Forward to your voice-to-text server
    const response = await axios.post(
      'http://192.168.10.182:5006/stt',
      { file: audio },
      {
        headers: {
          'X-API-Key': 'jonathan-tts-secret',
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      }
    );
    
    res.json({ success: true, text: response.data.text });
  } catch (error) {
    console.error('STT error:', error);
    res.status(500).json({ error: 'Voice recognition failed', details: error.message });
  }
});
app.get('/api/chats', isAuthenticated, (req, res) => {
  try {
    const chats = db.prepare(`
      SELECT * FROM chats 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.session.user.id);
    
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

app.post('/api/chats', isAuthenticated, (req, res) => {
  try {
    const { model = DEFAULT_MODEL, title = 'New Chat' } = req.body;
    const chatId = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO chats (user_id, chat_id, title, model) 
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(req.session.user.id, chatId, title, model);
    
    const chat = db.prepare('SELECT * FROM chats WHERE chat_id = ?').get(chatId);
    
    res.json({ success: true, chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

app.get('/api/chats/:chatId/messages', isAuthenticated, (req, res) => {
  try {
    const chat = db.prepare('SELECT * FROM chats WHERE chat_id = ? AND user_id = ?')
      .get(req.params.chatId, req.session.user.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC
    `).all(req.params.chatId);
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/api/chats/:chatId/messages', isAuthenticated, async (req, res) => {
  try {
    const { content, model } = req.body;
    const chatId = req.params.chatId;
    
    const chat = db.prepare('SELECT * FROM chats WHERE chat_id = ? AND user_id = ?')
      .get(chatId, req.session.user.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Save user message
    const userMsgStmt = db.prepare(`
      INSERT INTO messages (chat_id, role, content) 
      VALUES (?, 'user', ?)
    `);
    userMsgStmt.run(chatId, content);
    
    // Call Ollama API with system prompt
    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: model || chat.model || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: content }
        ],
        stream: false
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000
      }
    );
    
    const assistantMessage = response.data.message.content;
    
    // Save assistant message
    const assistantMsgStmt = db.prepare(`
      INSERT INTO messages (chat_id, role, content) 
      VALUES (?, 'assistant', ?)
    `);
    assistantMsgStmt.run(chatId, assistantMessage);
    
    // Update chat title if it's the first message
    if (chat.title === 'New Chat') {
      const updateStmt = db.prepare(`
        UPDATE chats SET title = ? WHERE chat_id = ?
      `);
      updateStmt.run(content.substring(0, 50), chatId);
    }
    
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE chat_id = ? 
      ORDER BY created_at ASC
    `).all(chatId);
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Send message error:', error);
    
    // Save error message
    const errorMsgStmt = db.prepare(`
      INSERT INTO messages (chat_id, role, content) 
      VALUES (?, 'assistant', ?)
    `);
    errorMsgStmt.run(req.params.chatId, `Error: ${error.message}`);
    
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

app.delete('/api/chats/:chatId', isAuthenticated, (req, res) => {
  try {
    const chat = db.prepare('SELECT * FROM chats WHERE chat_id = ? AND user_id = ?')
      .get(req.params.chatId, req.session.user.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    db.prepare('DELETE FROM messages WHERE chat_id = ?').run(req.params.chatId);
    db.prepare('DELETE FROM chats WHERE chat_id = ?').run(req.params.chatId);
    
    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Models route
app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    const models = response.data.models.map(m => m.name);
    res.json({ success: true, models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ 
      error: 'Failed to get models',
      models: [DEFAULT_MODEL]
    });
  }
});

// Session check
app.get('/api/session', (req, res) => {
  res.json({ success: true, user: req.session.user || null });
});

// Serve pages
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/admin', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve the main page for all other routes
app.get('*', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Ollama URL: ${OLLAMA_URL}`);
  console.log(`Model: ${DEFAULT_MODEL}`);
  console.log(`Access at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  db.close();
  process.exit(0);
});
