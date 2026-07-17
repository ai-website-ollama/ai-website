# Ollama AI Website

A complete AI chat website that connects to your local Ollama instance. Built with Node.js, Express, SQLite3, and vanilla JavaScript.

## Features

- **User Authentication**: Register, login, and logout with secure password hashing
- **Chat Management**: Create, view, and delete chat conversations
- **Model Selection**: Choose from available Ollama models
- **Persistent Storage**: All chats and messages stored in SQLite3 database
- **Responsive Design**: Works on desktop and mobile devices
- **Modal UI**: Clean modal dialogs for authentication and chat creation
- **Memory Efficient**: Designed to run in an LXC container with 2GB RAM

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Ollama running at `http://192.168.10.181:11434` (configurable)
- LXC (for containerized deployment)

## Quick Start

### Option 1: Run Locally (Development)

```bash
cd ollama-ai-website
npm install
cp .env.example .env
# Edit .env to set your Ollama URL
nano .env
npm start
```

Or use the start script:
```bash
./scripts/start.sh
```

Access the website at: `http://localhost:3000`

### Option 2: Deploy in LXC Container (Recommended)

```bash
chmod +x scripts/*.sh
sudo ./scripts/setup.sh
```

The script will:
1. Install LXC if not already installed
2. Create a container with 2GB RAM limit
3. Install Node.js and dependencies
4. Copy application files
5. Set up a systemd service
6. Start the application

Access the website at: `http://<container-ip>:3000`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
OLLAMA_URL=http://192.168.10.181:11434
PORT=3000
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
```

### Customizing Ollama URL

If your Ollama instance is running on a different host or port, update the `OLLAMA_URL` in the `.env` file.

## Project Structure

```
ollama-ai-website/
├── server.js              # Express server with API routes
├── package.json           # Node.js dependencies
├── .env.example           # Environment configuration template
├── .gitignore             # Git ignore rules
├── public/
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── app.js             # Frontend JavaScript
├── db/
│   └── app.db             # SQLite3 database (created on first run)
├── scripts/
│   ├── setup.sh           # LXC container setup script
│   ├── start.sh            # Start script for development
│   └── monitor.sh          # Monitoring and management script
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/session` - Check current session

### Chats
- `GET /api/chats` - List all chats for current user
- `POST /api/chats` - Create a new chat
- `DELETE /api/chats/:chatId` - Delete a chat

### Messages
- `GET /api/chats/:chatId/messages` - Get messages for a chat
- `POST /api/chats/:chatId/messages` - Send a message and get AI response

### Models
- `GET /api/models` - List available Ollama models

## Management Commands

Use the `monitor.sh` script to manage the application:

```bash
./scripts/monitor.sh start
./scripts/monitor.sh stop
./scripts/monitor.sh restart
./scripts/monitor.sh status
./scripts/monitor.sh logs
./scripts/monitor.sh logs -f
./scripts/monitor.sh shell
./scripts/monitor.sh backup
./scripts/monitor.sh restore /path/to/backup.sqlite
./scripts/monitor.sh stats
```

### LXC Container Commands

```bash
./scripts/monitor.sh lxc-start
./scripts/monitor.sh lxc-stop
./scripts/monitor.sh lxc-restart
./scripts/monitor.sh lxc-shell
```

## Database

The application uses SQLite3 for data storage. The database file is located at `db/app.db` and contains:

- **users**: User accounts with hashed passwords
- **chats**: Chat conversations
- **messages**: Individual messages in chats

### Backup and Restore

```bash
# Manual backup
cp db/app.db db/backup/app_db_$(date +%Y%m%d_%H%M%S).sqlite

# Manual restore
cp db/backup/app_db_*.sqlite db/app.db
```

## Security

- Passwords are hashed using bcrypt
- Session cookies are secure (in production, use HTTPS)
- SQLite3 database is stored locally
- No external dependencies beyond Node.js and SQLite3

## Customization

### Changing the Theme

Edit the CSS variables in `public/styles.css`:

```css
:root {
    --primary-color: #7b68ee;
    --background-color: #0f172a;
    --surface-color: #1e293b;
    /* ... */
}
```

### Adding More Models

The application automatically fetches available models from your Ollama instance.

## Troubleshooting

### Ollama Connection Issues

1. Verify Ollama is running: `curl http://192.168.10.181:11434/api/tags`
2. Check the URL in your `.env` file
3. Ensure your LXC container can reach the Ollama host

### Database Issues

1. Check file permissions: `chmod 644 db/app.db`
2. Verify the `db` directory exists
3. Check for write permissions in the application directory

### Port Conflicts

1. Change the `PORT` in your `.env` file
2. Ensure the port is not blocked by a firewall

### Memory Issues

The application is designed to run with 2GB RAM. If you experience memory issues:

1. Reduce the number of concurrent users
2. Limit the model size in Ollama
3. Increase the container memory limit in the setup script

## License

MIT License
