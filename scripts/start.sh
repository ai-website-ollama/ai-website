#!/bin/bash

# Start Script for Ollama AI Website
# This script starts the application directly (for development or manual runs)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo -e "${YELLOW}Starting Ollama AI Website...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install npm first.${NC}"
    exit 1
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << 'EOF'
OLLAMA_URL=http://192.168.10.181:11434
PORT=3000
SESSION_SECRET=$(openssl rand -hex 32)
NODE_ENV=development
EOF
    echo -e "${GREEN}.env file created. You can edit it to change the configuration.${NC}"
fi

# Start the server
echo -e "${GREEN}Starting server...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server.${NC}"
echo

# Load environment variables
set -a
source .env
set +a

# Start the application
node server.js
