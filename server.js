const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ollama configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://192.168.10.181:11434';

// Database setup
const db = new Database(path.join(__dirname, 'db', 'app.db'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    chat_id TEXT UNIQUE NOT NULL,
    title TEXT,
    model TEXT DEFAULT 'llama3',
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

// Passport-like session management
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

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
      email: user.email
    };
    
    res.json({ user: { id: user.id, username: user.username, email: user.email } });
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
      email: user.email
    };
    
    res.json({ user: { id: user.id, username: user.username, email: user.email } });
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
    res.json({ message: 'Logged out successfully' });
  });
});

// Chat routes
app.get('/api/chats', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const chats = db.prepare(`
      SELECT * FROM chats 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.session.user.id);
    
    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

app.post('/api/chats', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { model = 'llama3', title = 'New Chat' } = req.body;
    const chatId = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO chats (user_id, chat_id, title, model) 
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(req.session.user.id, chatId, title, model);
    
    const chat = db.prepare('SELECT * FROM chats WHERE chat_id = ?').get(chatId);
    
    res.json({ chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

app.get('/api/chats/:chatId/messages', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
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
    
    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/api/chats/:chatId/messages', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { content, model } = req.body;
    const chatId = req.params.chatId;
    
    const chat = db.prepare('SELECT * FROM chats WHERE chat_id = ? AND user_id = ?')
      .get(chatId, req.session.user.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const userMsgStmt = db.prepare(`
      INSERT INTO messages (chat_id, role, content) 
      VALUES (?, 'user', ?)
    `);
    userMsgStmt.run(chatId, content);
    
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/chat`,
      {
        model: model || chat.model,
        messages: [
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
    
    const assistantMsgStmt = db.prepare(`
      INSERT INTO messages (chat_id, role, content) 
      VALUES (?, 'assistant', ?)
    `);
    assistantMsgStmt.run(chatId, assistantMessage);
    
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
    
    res.json({ messages });
  } catch (error) {
    console.error('Send message error:', error);
    
    const errorMsgStmt = db.prepare(`
      INSERT INTO messages (chat_id, role, content) 
      VALUES (?, 'assistant', ?)
    `);
    errorMsgStmt.run(req.params.chatId, `Error: ${error.message}`);
    
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

app.delete('/api/chats/:chatId', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const chat = db.prepare('SELECT * FROM chats WHERE chat_id = ? AND user_id = ?')
      .get(req.params.chatId, req.session.user.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    db.prepare('DELETE FROM messages WHERE chat_id = ?').run(req.params.chatId);
    db.prepare('DELETE FROM chats WHERE chat_id = ?').run(req.params.chatId);
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Models route
app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    const models = response.data.models.map(m => m.name);
    res.json({ models });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ 
      error: 'Failed to get models',
      models: ['llama3', 'llama3.2', 'mistral', 'phi3']
    });
  }
});

// Session check
app.get('/api/session', (req, res) => {
  res.json({ user: req.session.user || null });
});

// Serve the main page for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Ollama URL: ${OLLAMA_BASE_URL}`);
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
