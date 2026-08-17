# Zig - Local AI Code Assistant

A self-hosted Claude-style AI chat application powered by a local Ollama LLM backend. Designed for privacy-conscious users who want a chat interface without sending data outside their network.

## Features

### Chat
- Claude-inspired dark theme UI with pink accent and sidebar chat history
- Per-chat system prompts and model selection
- Code blocks with syntax highlighting and copy buttons
- Auto-create chat on first message (no need to click "New Chat")
- Welcome screen with example prompts that auto-send
- File uploads (PDF, TXT, CSV, JSON, MD, code files) with text extraction
- Markdown rendering in responses
- Typing indicators and auto-scroll

### AI-Powered Web Search
- DuckDuckGo web search with page content fetching
- Auto-search: AI detects when it needs current info and searches automatically
- User-triggered search via the search button
- Results include titles, URLs, and article content previews

### User Management
- Email verification with 6-digit codes
- Verification codes rotate every 30 minutes
- Age-based content filtering (under 18 = filtered, 18+ = unrestricted)
- User self-service password change (requires current password + verification code)
- Admin can change user passwords without seeing them (bcrypt hashed)
- Admin can set user ages
- User settings: appearance (compact mode, timestamps), voice input toggles

### Admin Panel
- **Dashboard** - User/chat/message counts, 24h activity, Ollama connection status
- **User Management** - Create/delete users, set ages, change passwords, resend verification
- **Chat Management** - View/delete all user chats across the system
- **Activity Logs** - Filterable feed of logins, messages, errors, admin actions
- **Announcements** - Send markdown messages to all users

### Security
- bcrypt-hashed passwords (never exposed in any API)
- Rate limiting (20 messages/minute)
- Jailbreak/injection filtering
- Session-based authentication with secure cookies
- Admin-only routes with role checks
- File upload size limits (10MB) and type restrictions

## Requirements

- Node.js v18+
- Ollama running with a model (default: llama3.2)
- Recommended: 2GB+ RAM for the web app (LLM runs separately)

## Setup

```bash
# Clone the repo
git clone git@github.com:ai-website-ollama/ai-website.git
cd ai-website

# Install dependencies
npm install

# Create .env from example
cp .env.example .env

# Edit .env with your values
nano .env
```

### .env Variables

```
OLLAMA_URL=http://192.168.10.181:11434
PORT=3000
SESSION_SECRET=your-secure-random-string
MODEL=llama3.2
NODE_ENV=production
HARRY_PASSWORD=your-admin-password
```

## Running

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Then visit `http://<your-ip>:3000`

## Default Admin

A `harry` admin user is auto-created on first run. Default password: `change-me-now` (change via `HARRY_PASSWORD` in .env).

## File Upload

Supported file types: PDF, TXT, CSV, JSON, MD, LOG, XML, HTML, JS, PY, Java, C/C++, CSS, SQL, Shell, YAML, TOML, INI, CFG, CONF, ENV

Text is extracted from files (PDF via pdf-parse) and prepended to your message. Max 10MB, 30k characters.

## Age-Based Content Filtering

Users under 18 get a filtered system prompt that avoids mature content. Ages auto-increment yearly on server startup.

## Architecture

```
ai-website/
├── server.js          # Express server, API routes, DB migrations
├── public/
│   ├── index.html     # Main chat page
│   ├── admin.html     # Admin panel
│   ├── login.html     # Login page
│   ├── styles.css     # Theme (pink accent)
│   └── app.js         # Frontend JavaScript
├── db/
│   └── app.db         # SQLite database (auto-created)
├── logs/
│   └── app.log        # File logs
├── .env               # Environment config
└── package.json
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | Admin | Create user |
| POST | `/api/login` | - | Login |
| POST | `/api/logout` | - | Logout |
| GET | `/api/session` | - | Get current session |
| POST | `/api/verify` | User | Verify email |
| POST | `/api/chats` | User | Create chat |
| GET | `/api/chats` | User | List user's chats |
| DELETE | `/api/chats` | User | Delete all user chats |
| DELETE | `/api/chats/:id` | User | Delete one chat |
| GET | `/api/chats/:id/messages` | User | Get chat messages |
| POST | `/api/chats/:id/messages` | User | Send message |
| POST | `/api/upload` | User | Upload file |
| GET | `/api/search` | User | Web search |
| GET | `/api/user/settings` | User | Get settings |
| POST | `/api/user/settings` | User | Save settings |
| POST | `/api/user/change-password` | User | Change own password |
| GET | `/api/user/verification-code` | User | Get verification code |
| GET | `/api/admin/users` | Admin | List all users |
| DELETE | `/api/admin/users/:id` | Admin | Delete user |
| POST | `/api/admin/set-age` | Admin | Set user age |
| POST | `/api/admin/change-password` | Admin | Change user password |
| POST | `/api/admin/make-admin` | Admin | Toggle admin |
| POST | `/api/admin/resend-verification` | Admin | Resend code |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/logs` | Admin | Activity logs |
| GET | `/api/admin/chats-all` | Admin | All chats |
| DELETE | `/api/admin/chats-all/:id` | Admin | Delete any chat |
| POST | `/api/admin/announce` | Admin | Send announcement |
