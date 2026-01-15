#!/bin/bash
#
# BreakingCID - Offensive Security Scanner
# Main script for running security scans
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULES_DIR="$SCRIPT_DIR/modules"
CONFIG_DIR="$SCRIPT_DIR/config"
LOGS_DIR="$SCRIPT_DIR/logs"
RESULTS_DIR="$SCRIPT_DIR/results"
UTILS_DIR="$SCRIPT_DIR/utils"

# Create directories if they don't exist
mkdir -p "$LOGS_DIR" "$RESULTS_DIR"

# Banner
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║                                                      ║"
    echo "║   ██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗██╗███╗   ██╗ ██████╗  ██████╗██╗██████╗  ║"
    echo "║   ██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝██║████╗  ██║██╔════╝ ██╔════╝██║██╔══██╗ ║"
    echo "║   ██████╔╝██████╔╝█████╗  ███████║█████╔╝ ██║██╔██╗ ██║██║  ███╗██║     ██║██║  ██║ ║"
    echo "║   ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗ ██║██║╚██╗██║██║   ██║██║     ██║██║  ██║ ║"
    echo "║   ██████╔╝██║  ██║███████╗██║  ██║██║  ██╗██║██║ ╚████║╚██████╔╝╚██████╗██║██████╔╝ ║"
    echo "║   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝╚═╝╚═════╝  ║"
    echo "║                                                      ║"
    echo "║           ${RED}Offensive Security Scanner v2.0${CYAN}           ║"
    echo "║         ${YELLOW}Professional Bug Bounty Platform${CYAN}          ║"
    echo "║                                                      ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Usage
usage() {
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [OPTIONS]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  -t, --target TARGET      Target URL or domain"
    echo "  -s, --scan TYPE          Scan type (xss, ssrf, smuggling, subdomain, comprehensive)"
    echo "  -v, --verbose            Verbose output"
    echo "  -o, --output FILE        Output file (default: results/report_TIMESTAMP.md)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 -t https://example.com -s xss"
    echo "  $0 -t example.com -s subdomain -v"
    echo "  $0 -t https://example.com -s comprehensive -o my_report.md"
    exit 1
}

# Parse arguments
TARGET=""
SCAN_TYPE=""
VERBOSE=0
OUTPUT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--target)
            TARGET="$2"
            shift 2
            ;;
        -s|--scan)
            SCAN_TYPE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=1
            shift
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -h|--help)
            print_banner
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Validate arguments
if [ -z "$TARGET" ]; then
    echo -e "${RED}Error: Target is required${NC}"
    usage
fi

if [ -z "$SCAN_TYPE" ]; then
    echo -e "${RED}Error: Scan type is required${NC}"
    usage
fi

# Set default output
if [ -z "$OUTPUT" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    OUTPUT="$RESULTS_DIR/report_${TIMESTAMP}.md"
fi

# Print banner
print_banner

# Log file
LOG_FILE="$LOGS_DIR/scan_$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}[*]${NC} Target: $TARGET"
echo -e "${BLUE}[*]${NC} Scan Type: $SCAN_TYPE"
echo -e "${BLUE}[*]${NC} Output: $OUTPUT"
echo -e "${BLUE}[*]${NC} Log: $LOG_FILE"
echo ""

# Run scan
case $SCAN_TYPE in
    xss)
        echo -e "${CYAN}[*] Running XSS Scanner...${NC}"
        python3 "$MODULES_DIR/xss_scanner.py" "$TARGET" $([ $VERBOSE -eq 1 ] && echo "--verbose") | tee -a "$LOG_FILE"
        ;;
    ssrf)
        echo -e "${CYAN}[*] Running SSRF Scanner...${NC}"
        python3 "$MODULES_DIR/ssrf_scanner.py" "$TARGET" $([ $VERBOSE -eq 1 ] && echo "--verbose") | tee -a "$LOG_FILE"
        ;;
    smuggling)
        echo -e "${CYAN}[*] Running HTTP Smuggling Scanner...${NC}"
        python3 "$MODULES_DIR/http_smuggling.py" "$TARGET" $([ $VERBOSE -eq 1 ] && echo "--verbose") | tee -a "$LOG_FILE"
        ;;
    subdomain)
        echo -e "${CYAN}[*] Running Subdomain Enumeration...${NC}"
        python3 "$MODULES_DIR/subdomain_enum.py" "$TARGET" $([ $VERBOSE -eq 1 ] && echo "--verbose") | tee -a "$LOG_FILE"
        ;;
    comprehensive)
        echo -e "${CYAN}[*] Running Comprehensive Scan...${NC}"
        echo -e "${YELLOW}[!] This will run all scanners sequentially${NC}"
        echo ""
        
        echo -e "${BLUE}[1/4] XSS Scanner${NC}"
        python3 "$MODULES_DIR/xss_scanner.py" "$TARGET" $([ $VERBOSE -eq 1 ] && echo "--verbose") | tee -a "$LOG_FILE"
        
        echo -e "${BLUE}[2/4] SSRF Scanner${NC}"
        python3 "$MODULES_DIR/ssrf_scanner.py" "$TARGET" $([ $VERBOSE -eq 1 ] && echo "--verbose") | tee -a "$LOG_FILE"
        
        echo -e "${BLUE}[3/4] HTTP Smuggling${NC}"
        python3 "$MODULES_DIR/http_smuggling.py" "$TARGET" $([ $VERBOSE -eq 1 ] && echo "--verbose") | tee -a "$LOG_FILE"
        
        echo -e "${BLUE}[4/4] Subdomain Enumeration${NC}"
        python3 "$MODULES_DIR/subdomain_enum.py" "$TARGET" $([ $VERBOSE -eq 1 ] && echo "--verbose") | tee -a "$LOG_FILE"
        ;;
    *)
        echo -e "${RED}Error: Unknown scan type: $SCAN_TYPE${NC}"
        usage
        ;;
esac

echo ""
echo -e "${GREEN}[+] Scan completed!${NC}"
echo -e "${BLUE}[*] Results saved to: $OUTPUT${NC}"
echo -e "${BLUE}[*] Log saved to: $LOG_FILE${NC}"
