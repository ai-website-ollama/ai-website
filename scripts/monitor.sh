#!/bin/bash

# Monitor Script for Ollama AI Website
# This script provides monitoring and management commands

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default container name
CONTAINER_NAME="ollama-ai-website"

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  start           Start the application (development mode)"
    echo "  stop            Stop the application"
    echo "  restart         Restart the application"
    echo "  status          Show application status"
    echo "  logs            Show application logs"
    echo "  logs -f         Follow application logs"
    echo "  shell           Open shell in container"
    echo "  backup          Backup the database"
    echo "  restore <file>  Restore database from backup"
    echo "  stats           Show memory and CPU usage"
    echo "  help            Show this help message"
    echo
    echo "Container Commands (if using LXC):"
    echo "  lxc-start       Start the LXC container"
    echo "  lxc-stop        Stop the LXC container"
    echo "  lxc-restart     Restart the LXC container"
    echo "  lxc-shell       Open shell in LXC container"
    exit 0
}

# Function to check if container exists
container_exists() {
    if command -v lxc &> /dev/null; then
        lxc list | grep -q "$CONTAINER_NAME"
        return $?
    fi
    return 1
}

# Function to execute in container
exec_in_container() {
    if container_exists; then
        lxc exec "$CONTAINER_NAME" -- bash -c "$1"
    else
        bash -c "cd $PROJECT_DIR && $1"
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}=== Application Status ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Container: $CONTAINER_NAME${NC}"
        CONTAINER_STATE=$(lxc list -c s --format csv "$CONTAINER_NAME" | grep -v "STATE" | head -1)
        echo -e "${YELLOW}Container State: $CONTAINER_STATE${NC}"
        SERVICE_STATE=$(exec_in_container "systemctl is-active ollama-ai-website" 2>/dev/null || echo "unknown")
        echo -e "${YELLOW}Service State: $SERVICE_STATE${NC}"
        CONTAINER_IP=$(lxc list -c s --format csv "$CONTAINER_NAME" | grep -oE "([0-9]{1,3}\.){3}[0-9]{1,3}" | head -1)
        echo -e "${YELLOW}Container IP: $CONTAINER_IP${NC}"
        PORT=$(exec_in_container "grep PORT /opt/ollama-ai-website/.env 2>/dev/null | cut -d'=' -f2 || echo '3000')"
        echo -e "${YELLOW}Application Port: $PORT${NC}"
        
        if [ "$SERVICE_STATE" = "active" ]; then
            echo -e "${GREEN}Application URL: http://$CONTAINER_IP:$PORT${NC}"
        fi
    else
        if pgrep -f "node.*server.js" > /dev/null; then
            echo -e "${GREEN}Application is running locally${NC}"
            PORT=$(grep PORT .env 2>/dev/null | cut -d'=' -f2 || echo '3000')
            echo -e "${YELLOW}Port: $PORT${NC}"
            echo -e "${GREEN}Application URL: http://localhost:$PORT${NC}"
        else
            echo -e "${RED}Application is not running${NC}"
        fi
    fi
    echo
}

# Function to show logs
show_logs() {
    FOLLOW=""
    if [ "$1" = "-f" ]; then
        FOLLOW="-f"
        shift
    fi
    
    echo -e "${BLUE}=== Application Logs ===${NC}"
    
    if container_exists; then
        exec_in_container "journalctl -u ollama-ai-website $FOLLOW $@"
    else
        if [ -f "$PROJECT_DIR/app.log" ]; then
            if [ "$FOLLOW" = "-f" ]; then
                tail -f "$PROJECT_DIR/app.log"
            else
                cat "$PROJECT_DIR/app.log"
            fi
        else
            echo -e "${YELLOW}No log file found. Application may not be running.${NC}"
        fi
    fi
}

# Function to start application
start_app() {
    echo -e "${BLUE}=== Starting Application ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Starting service in container...${NC}"
        exec_in_container "systemctl start ollama-ai-website"
        echo -e "${GREEN}Service started${NC}"
    else
        echo -e "${YELLOW}Starting locally...${NC}"
        cd "$PROJECT_DIR"
        
        if [ ! -f ".env" ]; then
            echo -e "${YELLOW}Creating .env file...${NC}"
            cat > .env << 'EOF'
OLLAMA_URL=http://192.168.10.181:11434
PORT=3000
SESSION_SECRET=$(openssl rand -hex 32)
NODE_ENV=development
EOF
        fi
        
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}Installing dependencies...${NC}"
            npm install
        fi
        
        nohup node server.js > app.log 2>&1 &
        echo -e "${GREEN}Application started in background${NC}"
        echo -e "${YELLOW}Logs are being written to: $PROJECT_DIR/app.log${NC}"
    fi
    echo
}

# Function to stop application
stop_app() {
    echo -e "${BLUE}=== Stopping Application ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Stopping service in container...${NC}"
        exec_in_container "systemctl stop ollama-ai-website"
        echo -e "${GREEN}Service stopped${NC}"
    else
        echo -e "${YELLOW}Stopping local process...${NC}"
        pkill -f "node.*server.js" || echo -e "${YELLOW}No running process found${NC}"
        echo -e "${GREEN}Application stopped${NC}"
    fi
    echo
}

# Function to restart application
restart_app() {
    echo -e "${BLUE}=== Restarting Application ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Restarting service in container...${NC}"
        exec_in_container "systemctl restart ollama-ai-website"
        echo -e "${GREEN}Service restarted${NC}"
    else
        stop_app
        sleep 2
        start_app
    fi
    echo
}

# Function to backup database
backup_db() {
    echo -e "${BLUE}=== Backing Up Database ===${NC}"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$PROJECT_DIR/db/backup/app_db_$TIMESTAMP.sqlite"
    
    if container_exists; then
        echo -e "${YELLOW}Backing up database from container...${NC}"
        exec_in_container "cp /opt/ollama-ai-website/db/app.db /opt/ollama-ai-website/db/backup/app_db_$TIMESTAMP.sqlite"
        lxc file pull "$CONTAINER_NAME"/opt/ollama-ai-website/db/backup/app_db_$TIMESTAMP.sqlite "$BACKUP_FILE"
    else
        mkdir -p "$PROJECT_DIR/db/backup"
        cp "$PROJECT_DIR/db/app.db" "$BACKUP_FILE"
    fi
    
    echo -e "${GREEN}Backup created: $BACKUP_FILE${NC}"
    echo
}

# Function to restore database
restore_db() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Please specify a backup file${NC}"
        echo "Usage: $0 restore <backup-file>"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}=== Restoring Database ===${NC}"
    echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Restoring to container...${NC}"
        lxc file push "$BACKUP_FILE" "$CONTAINER_NAME"/opt/ollama-ai-website/db/app.db
        exec_in_container "chmod 644 /opt/ollama-ai-website/db/app.db"
        echo -e "${GREEN}Database restored. Please restart the application.${NC}"
    else
        cp "$BACKUP_FILE" "$PROJECT_DIR/db/app.db"
        chmod 644 "$PROJECT_DIR/db/app.db"
        echo -e "${GREEN}Database restored. Please restart the application.${NC}"
    fi
    echo
}

# Function to show stats
show_stats() {
    echo -e "${BLUE}=== System Statistics ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Container: $CONTAINER_NAME${NC}"
        MEM_USAGE=$(exec_in_container "free -m | grep Mem | awk '{print \$3 \"/\" \$2 \"MB (\" int(\$3/\$2*100) \"%)}'")
        echo -e "${YELLOW}Memory Usage: $MEM_USAGE${NC}"
        CPU_USAGE=$(exec_in_container "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\([0-9.]*\)%* id.*/\1/' | awk '{print 100 - \$1}'")
        echo -e "${YELLOW}CPU Usage: ${CPU_USAGE:-0}%${NC}"
        DISK_USAGE=$(exec_in_container "df -h / | tail -1 | awk '{print \$5 \" of \" \$2}'")
        echo -e "${YELLOW}Disk Usage: $DISK_USAGE${NC}"
        NODE_PROCESS=$(exec_in_container "ps aux | grep node | grep -v grep | awk '{print \$2 \" - CPU: \" \$3 \"%, MEM: \" \$4 \"%}'")
        if [ -n "$NODE_PROCESS" ]; then
            echo -e "${YELLOW}Node.js Process: $NODE_PROCESS${NC}"
        fi
    else
        echo -e "${YELLOW}Local System${NC}"
        MEM_USAGE=$(free -m | grep Mem | awk '{print $3 "/" $2 "MB (" int($3/$2*100) "%)"}')
        echo -e "${YELLOW}Memory Usage: $MEM_USAGE${NC}"
        CPU_USAGE=$(top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\([0-9.]*\)%* id.*/\1/' | awk '{print 100 - $1}')
        echo -e "${YELLOW}CPU Usage: ${CPU_USAGE:-0}%${NC}"
        NODE_PROCESS=$(ps aux | grep node | grep -v grep | awk '{print $2 " - CPU: " $3 "%, MEM: " $4 "%"}')
        if [ -n "$NODE_PROCESS" ]; then
            echo -e "${YELLOW}Node.js Process: $NODE_PROCESS${NC}"
        fi
    fi
    echo
}

# Function to open shell
open_shell() {
    echo -e "${BLUE}=== Opening Shell ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Opening shell in container $CONTAINER_NAME...${NC}"
        lxc exec "$CONTAINER_NAME" -- bash
    else
        echo -e "${YELLOW}Opening shell in project directory...${NC}"
        cd "$PROJECT_DIR"
        bash
    fi
}

# Function to start LXC container
start_lxc() {
    echo -e "${BLUE}=== Starting LXC Container ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Starting container $CONTAINER_NAME...${NC}"
        lxc start "$CONTAINER_NAME"
        echo -e "${GREEN}Container started${NC}"
    else
        echo -e "${RED}Container $CONTAINER_NAME does not exist${NC}"
        echo -e "${YELLOW}Use the setup script to create it: ./scripts/setup.sh${NC}"
    fi
    echo
}

# Function to stop LXC container
stop_lxc() {
    echo -e "${BLUE}=== Stopping LXC Container ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Stopping container $CONTAINER_NAME...${NC}"
        lxc stop "$CONTAINER_NAME"
        echo -e "${GREEN}Container stopped${NC}"
    else
        echo -e "${RED}Container $CONTAINER_NAME does not exist${NC}"
    fi
    echo
}

# Function to restart LXC container
restart_lxc() {
    echo -e "${BLUE}=== Restarting LXC Container ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Restarting container $CONTAINER_NAME...${NC}"
        lxc restart "$CONTAINER_NAME"
        echo -e "${GREEN}Container restarted${NC}"
    else
        echo -e "${RED}Container $CONTAINER_NAME does not exist${NC}"
    fi
    echo
}

# Function to open shell in LXC container
shell_lxc() {
    echo -e "${BLUE}=== Opening Shell in LXC Container ===${NC}"
    
    if container_exists; then
        echo -e "${YELLOW}Opening shell in container $CONTAINER_NAME...${NC}"
        lxc exec "$CONTAINER_NAME" -- bash
    else
        echo -e "${RED}Container $CONTAINER_NAME does not exist${NC}"
    fi
}

# Main command handling
COMMAND="$1"
shift

case "$COMMAND" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    shell)
        open_shell
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$@"
        ;;
    stats)
        show_stats
        ;;
    lxc-start)
        start_lxc
        ;;
    lxc-stop)
        stop_lxc
        ;;
    lxc-restart)
        restart_lxc
        ;;
    lxc-shell)
        shell_lxc
        ;;
    help|--help|-h|"")
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo
        show_usage
        ;;
esac
