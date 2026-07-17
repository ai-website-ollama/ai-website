#!/bin/bash

# Ollama AI Website Setup Script
# This script sets up the website in an LXC container with 2GB RAM
# and connects to your Ollama instance at http://192.168.10.181:11434

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CONTAINER_NAME="ollama-ai-website"
MEMORY_LIMIT="2GB"
CPU_LIMIT="2"
OLLAMA_URL="http://192.168.10.181:11434"
APP_PORT="3000"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root${NC}"
    exit 1
fi

# Function to print header
echo_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to print step
echo_step() {
    echo -e "${YELLOW}-> $1${NC}"
}

# Function to print success
echo_success() {
    echo -e "${GREEN}[OK] $1${NC}"
}

# Function to print error
echo_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Check if LXC is installed
echo_header "Checking LXC Installation"
if ! command -v lxc &> /dev/null; then
    echo_error "LXC is not installed. Installing..."
    
    if command -v apt-get &> /dev/null; then
        apt-get update
        apt-get install -y lxc lxcfs lxc-templates bridge-utils
    elif command -v yum &> /dev/null; then
        yum install -y lxc lxcfs lxc-templates bridge-utils
    elif command -v dnf &> /dev/null; then
        dnf install -y lxc lxcfs lxc-templates bridge-utils
    else
        echo_error "Package manager not found. Please install LXC manually."
        exit 1
    fi
    
    echo_success "LXC installed successfully"
else
    echo_success "LXC is already installed"
fi

# Check if container already exists
echo_header "Checking for Existing Container"
if lxc list | grep -q "$CONTAINER_NAME"; then
    echo_step "Container '$CONTAINER_NAME' already exists"
    read -p "Do you want to delete and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo_step "Deleting existing container..."
        lxc stop -f "$CONTAINER_NAME" 2>/dev/null || true
        lxc delete "$CONTAINER_NAME"
        echo_success "Container deleted"
    else
        echo "Using existing container"
    fi
fi

# Create the container
echo_header "Creating LXC Container"
echo_step "Creating container '$CONTAINER_NAME' with $MEMORY_LIMIT RAM..."

if grep -qi ubuntu /etc/os-release || grep -qi debian /etc/os-release; then
    lxc launch ubuntu:22.04 "$CONTAINER_NAME" --config limits.memory="$MEMORY_LIMIT" --config limits.cpu="$CPU_LIMIT"
else
    lxc launch images:ubuntu/22.04 "$CONTAINER_NAME" --config limits.memory="$MEMORY_LIMIT" --config limits.cpu="$CPU_LIMIT"
fi

echo_success "Container created"

# Wait for container to be ready
echo_step "Waiting for container to initialize..."
sleep 10

# Configure container networking
echo_header "Configuring Container Networking"

CONTAINER_IP=$(lxc list -c s --format csv "$CONTAINER_NAME" | grep -oE "([0-9]{1,3}\.){3}[0-9]{1,3}" | head -1)

if [ -z "$CONTAINER_IP" ]; then
    echo_error "Could not determine container IP. Please check your network configuration."
    echo "You may need to configure LXC networking manually."
    exit 1
fi

echo_success "Container IP: $CONTAINER_IP"

# Configure container
echo_header "Configuring Container"

echo_step "Installing dependencies..."
lxc exec "$CONTAINER_NAME" -- bash -c "apt-get update && apt-get install -y curl git nodejs npm sqlite3"

echo_success "Dependencies installed"

# Copy application files
echo_header "Deploying Application"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo_step "Copying application files to container..."
lxc file push "$PROJECT_DIR/" "$CONTAINER_NAME"/opt/ollama-ai-website/ --recursive

echo_success "Files copied"

# Set up environment variables
echo_step "Configuring environment..."

lxc exec "$CONTAINER_NAME" -- bash -c "cat > /opt/ollama-ai-website/.env << 'EOF'
OLLAMA_URL=$OLLAMA_URL
PORT=$APP_PORT
SESSION_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
EOF"

echo_success "Environment configured"

# Install Node.js dependencies
echo_step "Installing Node.js dependencies..."
lxc exec "$CONTAINER_NAME" -- bash -c "cd /opt/ollama-ai-website && npm install --production"

echo_success "Dependencies installed"

# Create systemd service
echo_header "Creating Systemd Service"

SERVICE_FILE="/etc/systemd/system/ollama-ai-website.service"

lxc exec "$CONTAINER_NAME" -- bash -c "cat > $SERVICE_FILE << 'EOF'
[Unit]
Description=Ollama AI Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ollama-ai-website
EnvironmentFile=/opt/ollama-ai-website/.env
ExecStart=/usr/bin/node /opt/ollama-ai-website/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF"

echo_success "Service file created"

# Enable and start service
echo_step "Enabling and starting service..."
lxc exec "$CONTAINER_NAME" -- bash -c "systemctl daemon-reload && systemctl enable ollama-ai-website && systemctl start ollama-ai-website"

echo_success "Service started"

# Check if service is running
echo_step "Checking service status..."
sleep 3
SERVICE_STATUS=$(lxc exec "$CONTAINER_NAME" -- bash -c "systemctl is-active ollama-ai-website" 2>/dev/null || echo "inactive")

if [ "$SERVICE_STATUS" = "active" ]; then
    echo_success "Service is running"
else
    echo_error "Service failed to start. Check logs with:"
    echo "  lxc exec $CONTAINER_NAME -- bash -c 'journalctl -u ollama-ai-website -f'"
fi

# Display final information
echo_header "Setup Complete!"

echo_success "Container: $CONTAINER_NAME"
echo_success "IP Address: $CONTAINER_IP"
echo_success "Port: $APP_PORT"
echo_success "Ollama URL: $OLLAMA_URL"
echo

echo "Access your website at: http://$CONTAINER_IP:$APP_PORT"
echo

echo "To manage the container:"
echo "  Start:  lxc start $CONTAINER_NAME"
echo "  Stop:   lxc stop $CONTAINER_NAME"
echo "  Restart: lxc restart $CONTAINER_NAME"
echo "  Shell:  lxc exec $CONTAINER_NAME -- bash"
echo

echo "To view logs:"
echo "  lxc exec $CONTAINER_NAME -- bash -c 'journalctl -u ollama-ai-website -f'"
echo

echo "To update the application:"
echo "  1. Make changes to your local files"
echo "  2. Push to container: lxc file push <local-path> $CONTAINER_NAME/opt/ollama-ai-website/<path>"
echo "  3. Restart service: lxc exec $CONTAINER_NAME -- bash -c 'systemctl restart ollama-ai-website'"

echo_header "Done!"
