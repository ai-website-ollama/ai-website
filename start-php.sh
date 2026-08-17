#!/bin/bash
# Start Zig with PHP backend
# Usage: ./start-php.sh [port]
set -e

PORT="${1:-3000}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Zig PHP server on port $PORT..."
echo "URL: http://localhost:$PORT"
echo "Press Ctrl+C to stop"

exec php -S "0.0.0.0:$PORT" -t "$DIR/public" "$DIR/api.php"
