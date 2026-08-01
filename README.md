
# Zig AI Website (Ollama)

A Claude-style web chat app powered by Ollama, with SQLite persistence, admin controls, settings, and coding-focused UX.

Repository: <https://github.com/ai-website-ollama/ai-website.git>
=======
# Zig — Code Assistant Website

Zig is a student-focused coding assistant web app that connects to a local Ollama model. Built with Node.js, Express, SQLite3, and vanilla JavaScript, Zig helps users learn programming with step-by-step explanations, runnable examples, and safe guidance for schoolwork.
>>>>>>> origin/main

## Key Features

<<<<<<< HEAD
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
=======
- User authentication (register/login/logout)
- Chat management (create, view, delete chats)
- Zig system prompt tuned for teaching coding and preventing academic cheating
- Safety heuristics to reduce jailbreaks and unsafe requests
- Web search (DuckDuckGo instant answers proxy)
- User settings & integrations (store endpoints/toggles for Spotify, Home Assistant, Canva)
- Responsive UI with resizable sidebar and polished chat UX
- Messages and chats persisted to SQLite3
>>>>>>> origin/main

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
=======
- Node.js (v18+ recommended)
- npm or yarn
- Ollama running and reachable (configurable via OLLAMA_URL)

## Quick Start

1. Install dependencies

```bash
>>>>>>> origin/main
npm install
```

2. Copy environment template and edit

```bash
cp .env.example .env
<<<<<<< HEAD
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
=======
# edit .env: set OLLAMA_URL, PORT, SESSION_SECRET
```

3. Start the app

```bash
npm start
```

Open: http://localhost:3000 (or the PORT you set)

## Environment Variables

Create a `.env` file and set:

```env
OLLAMA_URL=http://localhost:11434    # Ollama instance URL
PORT=3000
SESSION_SECRET=your-secret
NODE_ENV=production
```

Security note: do not commit secrets to source control. Integration credentials are user-provided in UI settings and are not encrypted by this app.

## Project Structure

```
Zig/
├── server.js           # Express server and API
├── package.json
├── public/             # Frontend assets (index.html, app.js, styles.css)
├── db/app.db           # SQLite database (created on first run)
├── scripts/            # setup/start/monitor helpers
└── README.md
```

## Notable Behavior & Design

- Zig uses a global SYSTEM_PROMPT (tunable via environment) tailored to be a coding tutor and to discourage cheating. The server applies a simple heuristic filter to block obvious jailbreaks and disallowed system prompt edits.
- Per-chat system_prompt column exists for future use but is not editable from the UI to avoid misuse.
- Model selection is intentionally not exposed in the UI; the server uses a configured default model.
- Web search is available at `/api/search?q=...` and returns lightweight instant-answer data.
- User settings (integrations/preferences) are stored as JSON in `users.settings`.

## API Endpoints

Authentication
- POST /api/register
- POST /api/login
- POST /api/logout
- GET /api/session

Chats & Messages
- GET /api/chats
- POST /api/chats
- DELETE /api/chats/:chatId
- GET /api/chats/:chatId/messages
- POST /api/chats/:chatId/messages

Utilities
- GET /api/models        # read-only listing from Ollama (UI doesn't expose model selection)
- GET /api/search?q=...  # simple web search proxy (DuckDuckGo instant answer)

User Settings
- GET /api/user/settings
- POST /api/user/settings  (stores allowed keys only: integrations, preferences)

## Integrations

Settings UI supports toggling and storing endpoints/toggles for third-party services (Spotify, Home Assistant, Canva). This repo does NOT implement OAuth or private-key storage — adding full connectors requires implementing secure credential storage and OAuth flows.

## Database Migration

On first run the server creates required tables. The app will add `system_prompt` on `chats` and `settings` on `users` if missing.

## Troubleshooting

- Ollama: verify `OLLAMA_URL` and that the Ollama API is reachable.
- Database: ensure `db` directory is writable by the app user.
- Sessions: in production set secure cookies + HTTPS and a strong SESSION_SECRET.

## Testing & Development

- Dev: `npm run dev` (requires nodemon)
- Start: `npm start`

## Security & Privacy

- Passwords are hashed with bcrypt.
- Do not store API secrets in the settings UI unless you understand the risks—this app stores them as plain JSON in the database.
- The jailbreak filter is heuristic. For production use, integrate a vetted content-safety layer.

## Next improvements (ideas)

- OAuth connectors for Spotify / Home Assistant / Canva
- Stronger safety policies and structured refusal templates
- Summarization of web search results into the chat
- Optional encrypted credential storage for integrations

## License

MIT License
>>>>>>> origin/main
