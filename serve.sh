#!/bin/bash
# Serve the robot vacuum game on your local network
# Your iPad and this machine must be on the same Wi-Fi

PORT=8080
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "  ======================================"
echo "  🤖 Robot Vacuum Puzzle Game Server"
echo "  ======================================"
echo ""
echo "  Open on iPad:"
echo "  http://$IP:$PORT/game/"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

cd "$(dirname "$0")"
python3 -m http.server $PORT
