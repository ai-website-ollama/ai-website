# Zig - Local AI Code Assistant

A self-hosted Claude-style AI chat application powered by a local Ollama LLM backend. Designed for privacy-conscious users who want a chat interface without sending data outside their network.

## Features

- Claude-inspired dark theme UI with sidebar and chat history
- Per-chat system prompts
- Code blocks with syntax highlighting and copy buttons
- Web search via DuckDuckGo
- User authentication with bcrypt-hashed passwords
- Admin panel for user management
- Rate limiting and jailbreak filtering
- Responsive design with resizable sidebar

## Requirements

- Node.js v18+
- Ollama running with a model (default: llama3.2)
- Recommended: 2GB+ RAM for the web app (LLM runs separately)

## Setup

```bash
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
