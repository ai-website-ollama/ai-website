# Zig AI Website (Ollama)

A Claude-style web chat app powered by Ollama, with SQLite persistence, admin controls, settings, and coding-focused UX.

Repository: <https://github.com/ai-website-ollama/ai-website.git>

## Features

- Zig-branded chat UI with sidebar + chat history
- Code-friendly replies with copy buttons on code blocks
- Enter-to-send (`Shift+Enter` for newline)
- Persistent sessions + remembers last selected chat on reload
- SQLite database for users, chats, messages, and logs
- File logging to `logs/app.log`
- Per-user message rate limiting and max input length limits
- Admin panel + admin-only user creation API
- User settings modal for OAuth fields and UI colors
- Ollama backend configurable by environment variables

## Tech Stack

- Node.js + Express
- better-sqlite3
- express-session
- bcrypt
- Vanilla HTML/CSS/JS

## Quick Start

```bash
git clone https://github.com/ai-website-ollama/ai-website.git
cd ai-website
mkdir -p db logs
npm install
cp .env.example .env
```

Edit `.env` (minimum):

```env
PORT=8080
OLLAMA_URL=http://192.168.10.181:11434
SESSION_SECRET=replace-with-a-strong-random-secret
MODEL=llama3.2
NODE_ENV=production
```

Then run:

```bash
npm start
```

Open: `http://<server-ip>:8080`

## Default Admin Bootstrap (`harry`)

On startup, the app ensures a `harry` user exists as admin **if total users are under 10**.

- Username: `harry`
- Password: from `HARRY_PASSWORD` env var (default: `change-me-now`)
- Email: from `HARRY_EMAIL` env var (default: `harry@local`)

Set these in `.env` before first run:

```env
HARRY_PASSWORD=your-strong-password
HARRY_EMAIL=harry@example.com
```

## Auth Behavior

- `/signup` route is disabled (redirects to `/login`)
- Login is available at `/login`
- `POST /api/register` is **admin-only** (requires logged-in admin session)

## Configuration

### Core

```env
PORT=8080
OLLAMA_URL=http://192.168.10.181:11434
MODEL=llama3.2
SYSTEM_PROMPT=You are a helpful AI assistant.
SESSION_SECRET=replace-me
NODE_ENV=production
```

### Limits

```env
MAX_INPUT_CHARS=12000
MESSAGE_LIMIT_PER_MINUTE=20
```

### OAuth / Integration Fields (stored via settings UI)

```env
SPOTIFY_CLIENT_ID=
SPOTIFY_REDIRECT_URI=
HA_URL=
CANVA_CLIENT_ID=
```

## Logging

### File logs

- Path: `logs/app.log`
- Includes login, registration, chat/message events, rate-limit events, errors

### Database logs

- Table: `app_logs`
- Includes `user_id`, `chat_id`, `event_type`, `details`, `ip`, `user_agent`, `created_at`

## API Overview

### Session/Auth

- `GET /api/session`
- `POST /api/login`
- `POST /api/logout`
- `POST /api/register` (admin only)

### Chats/Messages

- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/messages`
- `DELETE /api/chats/:chatId`

### Settings

- `GET /api/user/settings`
- `POST /api/user/settings`

### Models

- `GET /api/models`

## LXC Notes

If running in LXC and native module builds fail:

```bash
apt update
apt install -y build-essential python3 make g++
npm rebuild bcrypt better-sqlite3 --build-from-source
```

## Production Notes

- Use HTTPS in front of the app
- Set a strong `SESSION_SECRET`
- Keep `NODE_ENV=production`
- Rotate bootstrap default password immediately

## Scripts

```bash
npm start
npm run dev
```
