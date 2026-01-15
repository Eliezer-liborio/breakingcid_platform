#!/bin/bash

# BreakingCID Worker Deploy Script
# Automated installation and configuration for Kali Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
 ██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗██╗███╗   ██╗ ██████╗  ██████╗██╗██████╗ 
 ██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝██║████╗  ██║██╔════╝ ██╔════╝██║██╔══██╗
 ██████╔╝██████╔╝█████╗  ███████║█████╔╝ ██║██╔██╗ ██║██║  ███╗██║     ██║██║  ██║
 ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗ ██║██║╚██╗██║██║   ██║██║     ██║██║  ██║
 ██████╔╝██║  ██║███████╗██║  ██║██║  ██╗██║██║ ╚████║╚██████╔╝╚██████╗██║██████╔╝
 ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝╚═╝╚═════╝ 

 WORKER DEPLOYMENT SCRIPT
EOF
echo -e "${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[!] This script must be run as root${NC}"
   exit 1
fi

echo -e "${YELLOW}[*] Starting BreakingCID Worker deployment...${NC}"

# Step 1: Update system
echo -e "${BLUE}[1/7] Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

# Step 2: Install dependencies
echo -e "${BLUE}[2/7] Installing dependencies...${NC}"
apt-get install -y -qq \
    python3.10 \
    python3.10-dev \
    python3-pip \
    git \
    curl \
    wget \
    dnsutils \
    nmap \
    amass \
    subfinder \
    assetfinder \
    jq

# Step 3: Install Python packages
echo -e "${BLUE}[3/7] Installing Python packages...${NC}"
python3.10 -m pip install --upgrade pip setuptools wheel -q
python3.10 -m pip install \
    requests \
    beautifulsoup4 \
    dnspython \
    pycurl \
    -q

# Step 4: Create worker directory structure
echo -e "${BLUE}[4/7] Creating worker directory structure...${NC}"
WORKER_DIR="/opt/breakingcid-worker"
mkdir -p "$WORKER_DIR"
mkdir -p "$WORKER_DIR/logs"
mkdir -p "$WORKER_DIR/results"

# Step 5: Copy worker files
echo -e "${BLUE}[5/7] Copying worker files...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp -r "$SCRIPT_DIR"/* "$WORKER_DIR/" 2>/dev/null || true
chmod +x "$WORKER_DIR/worker_client.py"
chmod +x "$WORKER_DIR/breakingcid.sh"

# Step 6: Create configuration file
echo -e "${BLUE}[6/7] Creating configuration file...${NC}"
cat > "$WORKER_DIR/.env" << 'ENVFILE'
# BreakingCID Worker Configuration

# Backend API Configuration
BACKEND_URL=http://localhost:3000
WORKER_API_KEY=your-secret-api-key-here
WORKER_ID=worker-001
WORKER_NAME=Kali-Worker-01

# Polling Configuration
POLL_INTERVAL=5
MAX_RETRIES=3
RETRY_DELAY=2

# Logging
LOG_LEVEL=INFO
LOG_FILE=/opt/breakingcid-worker/logs/worker.log

# Timeout Settings (in seconds)
SCAN_TIMEOUT=300
HTTP_TIMEOUT=30

# Concurrent Scans
MAX_CONCURRENT_SCANS=2

# Verbose Output
VERBOSE=true
ENVFILE

echo -e "${YELLOW}[!] IMPORTANT: Edit $WORKER_DIR/.env and configure:${NC}"
echo -e "${YELLOW}    - BACKEND_URL: Your BreakingCID backend URL${NC}"
echo -e "${YELLOW}    - WORKER_API_KEY: API key for authentication${NC}"

# Step 7: Create systemd service
echo -e "${BLUE}[7/7] Creating systemd service...${NC}"
cat > /etc/systemd/system/breakingcid-worker.service << 'SERVICEFILE'
[Unit]
Description=BreakingCID Worker Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/breakingcid-worker
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/usr/bin/python3.10 /opt/breakingcid-worker/worker_client.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEFILE

systemctl daemon-reload
systemctl enable breakingcid-worker.service

echo -e "${GREEN}[+] Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}[*] Next steps:${NC}"
echo -e "${YELLOW}    1. Edit configuration: nano $WORKER_DIR/.env${NC}"
echo -e "${YELLOW}    2. Set BACKEND_URL and WORKER_API_KEY${NC}"
echo -e "${YELLOW}    3. Start the worker: systemctl start breakingcid-worker${NC}"
echo -e "${YELLOW}    4. Check status: systemctl status breakingcid-worker${NC}"
echo -e "${YELLOW}    5. View logs: journalctl -u breakingcid-worker -f${NC}"
echo ""
echo -e "${GREEN}[+] Worker deployment ready!${NC}"
