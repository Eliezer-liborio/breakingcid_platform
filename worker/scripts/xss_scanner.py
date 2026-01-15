#!/usr/bin/env python3
"""
XSS Scanner - Simplified version for BreakingCID Platform
Based on advanced XSS techniques and Google's $250k bug research
"""

import sys
import json
import requests
import urllib.parse
from bs4 import BeautifulSoup
import warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

class XSSScanner:
    def __init__(self, target, verbose=False):
        self.target = target
        self.verbose = verbose
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        })
        self.vulnerabilities = []
    
    def log(self, message):
        """Print verbose logs to stderr"""
        if self.verbose:
            print(f"[VERBOSE] {message}", file=sys.stderr, flush=True)
        
    def generate_payloads(self):
        """Generate XSS test payloads"""
        return [
            # Reflected XSS
            {"type": "reflected", "payload": "<script>alert(1)</script>", "severity": "high"},
            {"type": "reflected", "payload": "<img src=x onerror=alert(1)>", "severity": "high"},
            {"type": "reflected", "payload": "<svg onload=alert(1)>", "severity": "high"},
            {"type": "reflected", "payload": "'-alert(1)-'", "severity": "medium"},
            {"type": "reflected", "payload": "\";alert(1);//", "severity": "medium"},
            
            # DOM-based XSS
            {"type": "dom", "payload": "javascript:alert(1)", "severity": "high"},
            {"type": "dom", "payload": "#<img src=x onerror=alert(1)>", "severity": "high"},
            
            # Template Injection
            {"type": "template", "payload": "{{7*7}}", "severity": "critical"},
            {"type": "template", "payload": "${7*7}", "severity": "critical"},
            {"type": "template", "payload": "{{constructor.constructor('alert(1)')()}}", "severity": "critical"},
            
            # WAF Bypass
            {"type": "bypass", "payload": "<img src=x onerror=&#97;&#108;&#101;&#114;&#116;&#40;&#49;&#41;>", "severity": "medium"},
            {"type": "bypass", "payload": "<svg/onload=alert(1)>", "severity": "medium"},
            {"type": "bypass", "payload": "<iframe srcdoc='<script>alert(1)</script>'>", "severity": "high"},
        ]
    
    def test_reflected_xss(self):
        """Test for reflected XSS"""
        print(f"[*] Testing Reflected XSS on {self.target}", file=sys.stderr)
        self.log(f"Starting Reflected XSS tests with {len([p for p in self.generate_payloads() if p['type'] in ['reflected', 'bypass']])} payloads")
        
        payloads = [p for p in self.generate_payloads() if p['type'] in ['reflected', 'bypass']]
        
        # Parse URL to get parameters
        parsed = urllib.parse.urlparse(self.target)
        base_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        self.log(f"Base URL: {base_url}")
        
        # Test with sample parameters if no params exist
        test_params = ['q', 'search', 'query', 'id', 'page', 'name']
        self.log(f"Testing parameters: {', '.join(test_params)}")
        
        for param in test_params:
            self.log(f"Testing parameter: {param}")
            for payload_obj in payloads[:5]:  # Test first 5 payloads per param
                test_url = f"{base_url}?{param}={urllib.parse.quote(payload_obj['payload'])}"
                self.log(f"  → Testing payload: {payload_obj['payload'][:50]}...")
                
                try:
                    response = self.session.get(test_url, timeout=10, verify=False)
                    self.log(f"    Response: {response.status_code} ({len(response.text)} bytes)")
                    
                    if payload_obj['payload'] in response.text or \
                       payload_obj['payload'].replace('<', '&lt;').replace('>', '&gt;') in response.text:
                        self.log(f"    ✓ VULNERABILITY FOUND!")
                        self.vulnerabilities.append({
                            'type': 'Reflected XSS',
                            'severity': payload_obj['severity'],
                            'parameter': param,
                            'payload': payload_obj['payload'],
                            'url': test_url,
                            'description': f'Reflected XSS found in parameter "{param}"'
                        })
                        print(f"[!] Reflected XSS found: {param}", file=sys.stderr)
                        break  # Found vulnerability, move to next param
                        
                except Exception as e:
                    print(f"[!] Error testing {test_url}: {e}", file=sys.stderr)
                    continue
    
    def test_dom_xss(self):
        """Test for DOM-based XSS"""
        print(f"[*] Testing DOM-based XSS on {self.target}", file=sys.stderr)
        
        try:
            response = self.session.get(self.target, timeout=10, verify=False)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for dangerous JavaScript patterns
            scripts = soup.find_all('script')
            dangerous_patterns = [
                'innerHTML', 'outerHTML', 'document.write',
                'eval(', 'location.href', 'location.hash',
                'document.URL', 'window.name'
            ]
            
            for script in scripts:
                if script.string:
                    script_content = script.string.lower()
                    for pattern in dangerous_patterns:
                        if pattern.lower() in script_content:
                            self.vulnerabilities.append({
                                'type': 'Potential DOM-based XSS',
                                'severity': 'medium',
                                'sink': pattern,
                                'description': f'Dangerous sink "{pattern}" found in JavaScript',
                                'url': self.target
                            })
                            print(f"[!] Potential DOM XSS sink found: {pattern}", file=sys.stderr)
                            break
                            
        except Exception as e:
            print(f"[!] Error testing DOM XSS: {e}", file=sys.stderr)
    
    def test_template_injection(self):
        """Test for template injection"""
        print(f"[*] Testing Template Injection on {self.target}", file=sys.stderr)
        
        template_payloads = [
            {"payload": "{{7*7}}", "expected": "49"},
            {"payload": "${7*7}", "expected": "49"},
            {"payload": "#{7*7}", "expected": "49"},
        ]
        
        parsed = urllib.parse.urlparse(self.target)
        base_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
        test_params = ['q', 'search', 'query', 'name']
        
        for param in test_params:
            for payload_obj in template_payloads:
                test_url = f"{base_url}?{param}={urllib.parse.quote(payload_obj['payload'])}"
                
                try:
                    response = self.session.get(test_url, timeout=10, verify=False)
                    
                    # Check if template was executed (7*7 = 49)
                    if payload_obj['expected'] in response.text and payload_obj['payload'] not in response.text:
                        self.vulnerabilities.append({
                            'type': 'Template Injection',
                            'severity': 'critical',
                            'parameter': param,
                            'payload': payload_obj['payload'],
                            'url': test_url,
                            'description': f'Template injection found - expression evaluated to {payload_obj["expected"]}'
                        })
                        print(f"[!] Template Injection found: {param}", file=sys.stderr)
                        break
                        
                except Exception as e:
                    continue
    
    def scan(self):
        """Run comprehensive XSS scan"""
        print(f"[*] Starting XSS scan on {self.target}", file=sys.stderr)
        
        try:
            # Test different XSS types
            self.test_reflected_xss()
            self.test_dom_xss()
            self.test_template_injection()
            
            # Generate summary
            summary = {
                'total': len(self.vulnerabilities),
                'critical': len([v for v in self.vulnerabilities if v.get('severity') == 'critical']),
                'high': len([v for v in self.vulnerabilities if v.get('severity') == 'high']),
                'medium': len([v for v in self.vulnerabilities if v.get('severity') == 'medium']),
                'low': len([v for v in self.vulnerabilities if v.get('severity') == 'low']),
            }
            
            result = {
                'success': True,
                'target': self.target,
                'vulnerabilities': self.vulnerabilities,
                'summary': summary
            }
            
            print(f"[+] XSS scan completed: {summary['total']} vulnerabilities found", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"[!] Scan failed: {e}", file=sys.stderr)
            return {
                'success': False,
                'error': str(e),
                'vulnerabilities': [],
                'summary': {'total': 0, 'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
            }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Target URL required'}))
        sys.exit(1)
    
    target = sys.argv[1]
    verbose = '--verbose' in sys.argv or '-v' in sys.argv
    
    try:
        scanner = XSSScanner(target, verbose=verbose)
        result = scanner.scan()
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'vulnerabilities': [],
            'summary': {'total': 0, 'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
