#!/bin/bash

# BreakingCID Worker Monitor Script
# Monitor worker status and logs in real-time

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
WORKER_SERVICE="breakingcid-worker"
LOG_FILE="/opt/breakingcid-worker/logs/worker.log"

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║         BreakingCID Worker Monitor                           ║
║         Real-time status and log monitoring                  ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to check service status
check_service_status() {
    echo -e "${BLUE}[*] Service Status:${NC}"
    if systemctl is-active --quiet $WORKER_SERVICE; then
        echo -e "${GREEN}[+] Service is RUNNING${NC}"
        systemctl status $WORKER_SERVICE --no-pager | grep -E "Active|Main PID"
    else
        echo -e "${RED}[!] Service is STOPPED${NC}"
        echo -e "${YELLOW}[*] Start with: systemctl start $WORKER_SERVICE${NC}"
    fi
    echo ""
}

# Function to check worker connectivity
check_connectivity() {
    echo -e "${BLUE}[*] Checking Backend Connectivity:${NC}"
    
    # Read backend URL from config
    if [ -f "/opt/breakingcid-worker/.env" ]; then
        BACKEND_URL=$(grep "^BACKEND_URL=" /opt/breakingcid-worker/.env | cut -d'=' -f2)
        
        if curl -s -m 5 "$BACKEND_URL/api/worker/health" > /dev/null 2>&1; then
            echo -e "${GREEN}[+] Backend is reachable${NC}"
        else
            echo -e "${RED}[!] Backend is unreachable${NC}"
            echo -e "${YELLOW}[*] Check BACKEND_URL in .env configuration${NC}"
        fi
    else
        echo -e "${RED}[!] Configuration file not found${NC}"
    fi
    echo ""
}

# Function to show recent logs
show_logs() {
    echo -e "${BLUE}[*] Recent Logs (last 20 lines):${NC}"
    if [ -f "$LOG_FILE" ]; then
        tail -20 "$LOG_FILE" | sed 's/^/  /'
    else
        echo -e "${YELLOW}[*] No logs found yet${NC}"
    fi
    echo ""
}

# Function to show active scans
show_active_scans() {
    echo -e "${BLUE}[*] Process Information:${NC}"
    if pgrep -f "worker_client.py" > /dev/null; then
        ps aux | grep "worker_client.py" | grep -v grep | awk '{print "  PID: " $2 ", Memory: " $6 "KB, CPU: " $3 "%"}'
    else
        echo -e "${YELLOW}[*] No worker process found${NC}"
    fi
    echo ""
}

# Function to show disk usage
show_disk_usage() {
    echo -e "${BLUE}[*] Disk Usage:${NC}"
    WORKER_DIR="/opt/breakingcid-worker"
    if [ -d "$WORKER_DIR" ]; then
        du -sh "$WORKER_DIR" | awk '{print "  Total: " $1}'
        du -sh "$WORKER_DIR/logs" 2>/dev/null | awk '{print "  Logs: " $1}' || echo "  Logs: 0B"
        du -sh "$WORKER_DIR/results" 2>/dev/null | awk '{print "  Results: " $1}' || echo "  Results: 0B"
    fi
    echo ""
}

# Function to show system resources
show_system_resources() {
    echo -e "${BLUE}[*] System Resources:${NC}"
    echo "  CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "  Memory Usage: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
    echo "  Uptime: $(uptime -p)"
    echo ""
}

# Function to show menu
show_menu() {
    echo -e "${YELLOW}[*] Options:${NC}"
    echo "  1. Refresh all information"
    echo "  2. View full logs (tail -f)"
    echo "  3. Restart service"
    echo "  4. Stop service"
    echo "  5. View configuration"
    echo "  6. Exit"
    echo ""
}

# Main loop
while true; do
    clear
    
    # Display all information
    check_service_status
    check_connectivity
    show_logs
    show_active_scans
    show_disk_usage
    show_system_resources
    show_menu
    
    read -p "Select option (1-6): " choice
    
    case $choice in
        1)
            continue
            ;;
        2)
            echo -e "${BLUE}[*] Following logs (Ctrl+C to exit)...${NC}"
            tail -f "$LOG_FILE"
            ;;
        3)
            echo -e "${YELLOW}[*] Restarting service...${NC}"
            systemctl restart $WORKER_SERVICE
            echo -e "${GREEN}[+] Service restarted${NC}"
            sleep 2
            ;;
        4)
            echo -e "${YELLOW}[*] Stopping service...${NC}"
            systemctl stop $WORKER_SERVICE
            echo -e "${GREEN}[+] Service stopped${NC}"
            sleep 2
            ;;
        5)
            echo -e "${BLUE}[*] Configuration:${NC}"
            if [ -f "/opt/breakingcid-worker/.env" ]; then
                cat /opt/breakingcid-worker/.env | sed 's/^/  /'
            else
                echo -e "${RED}[!] Configuration file not found${NC}"
            fi
            read -p "Press Enter to continue..."
            ;;
        6)
            echo -e "${GREEN}[+] Exiting...${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}[!] Invalid option${NC}"
            sleep 1
            ;;
    esac
done
