#!/usr/bin/env python3
"""
Banner Utility
"""

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_banner():
    banner = f"""{Colors.CYAN}{Colors.BOLD}
    ╔══════════════════════════════════════════════════════╗
    ║                                                      ║
    ║   ██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗██╗███╗   ██╗ ██████╗  ██████╗██╗██████╗  ║
    ║   ██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝██║████╗  ██║██╔════╝ ██╔════╝██║██╔══██╗ ║
    ║   ██████╔╝██████╔╝█████╗  ███████║█████╔╝ ██║██╔██╗ ██║██║  ███╗██║     ██║██║  ██║ ║
    ║   ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗ ██║██║╚██╗██║██║   ██║██║     ██║██║  ██║ ║
    ║   ██████╔╝██║  ██║███████╗██║  ██║██║  ██╗██║██║ ╚████║╚██████╔╝╚██████╗██║██████╔╝ ║
    ║   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝╚═╝╚═════╝  ║
    ║                                                      ║
    ║           {Colors.RED}Offensive Security Scanner v2.0{Colors.CYAN}           ║
    ║         {Colors.YELLOW}Professional Bug Bounty Platform{Colors.CYAN}          ║
    ║                                                      ║
    ╚══════════════════════════════════════════════════════╝
    {Colors.END}"""
    print(banner)

def print_section(title):
    """Print section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}  {title}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}[+]{Colors.END} {message}")

def print_info(message):
    """Print info message"""
    print(f"{Colors.BLUE}[*]{Colors.END} {message}")

def print_warning(message):
    """Print warning message"""
    print(f"{Colors.YELLOW}[!]{Colors.END} {message}")

def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}[-]{Colors.END} {message}")

def print_vuln(severity, message):
    """Print vulnerability message"""
    colors = {
        "critical": Colors.RED,
        "high": Colors.PURPLE,
        "medium": Colors.YELLOW,
        "low": Colors.CYAN,
        "info": Colors.BLUE
    }
    color = colors.get(severity.lower(), Colors.WHITE)
    print(f"{color}[{severity.upper()}]{Colors.END} {message}")

if __name__ == "__main__":
    # Test
    print_banner()
    print_section("Testing Banner Utilities")
    print_success("This is a success message")
    print_info("This is an info message")
    print_warning("This is a warning message")
    print_error("This is an error message")
    print_vuln("critical", "Critical vulnerability found!")
    print_vuln("high", "High severity issue detected")
    print_vuln("medium", "Medium risk vulnerability")
    print_vuln("low", "Low priority finding")
