#!/bin/bash
# BreakingCID Worker Setup Script
# Instala e configura worker automaticamente

set -e

echo "========================================="
echo "BreakingCID Worker Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (sudo ./setup.sh)"
    exit 1
fi

# Get configuration
read -p "Backend URL (e.g., https://your-backend.com): " BACKEND_URL
read -p "Worker API Key: " WORKER_API_KEY
read -p "Worker ID [worker-$(hostname)]: " WORKER_ID
WORKER_ID=${WORKER_ID:-worker-$(hostname)}

echo ""
echo "Installing dependencies..."
apt update
apt install -y python3 python3-pip curl jq dnsutils

echo ""
echo "Installing Python libraries..."
pip3 install requests beautifulsoup4 dnspython

echo ""
echo "Creating worker directory..."
WORKER_DIR="/opt/breakingcid-worker"
mkdir -p "$WORKER_DIR"
cp -r "$(dirname "$0")"/* "$WORKER_DIR/"
chmod +x "$WORKER_DIR/worker_client.py"
chmod +x "$WORKER_DIR/scripts"/*.sh

echo ""
echo "Creating environment file..."
cat > /etc/systemd/system/breakingcid-worker.env <<EOF
BACKEND_URL=$BACKEND_URL
WORKER_API_KEY=$WORKER_API_KEY
WORKER_ID=$WORKER_ID
POLL_INTERVAL=5
EOF

echo ""
echo "Creating systemd service..."
cat > /etc/systemd/system/breakingcid-worker.service <<EOF
[Unit]
Description=BreakingCID Worker Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$WORKER_DIR
EnvironmentFile=/etc/systemd/system/breakingcid-worker.env
ExecStart=/usr/bin/python3 $WORKER_DIR/worker_client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "Enabling and starting service..."
systemctl daemon-reload
systemctl enable breakingcid-worker
systemctl start breakingcid-worker

echo ""
echo "========================================="
echo "✅ Worker installed successfully!"
echo "========================================="
echo ""
echo "Status: systemctl status breakingcid-worker"
echo "Logs:   journalctl -u breakingcid-worker -f"
echo ""
echo "Worker ID: $WORKER_ID"
echo "Backend:   $BACKEND_URL"
echo ""
