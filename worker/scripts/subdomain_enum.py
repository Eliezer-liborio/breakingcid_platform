#!/usr/bin/env python3
"""
Subdomain Enumeration Scanner - BreakingCID Platform
Discovers subdomains using multiple techniques
"""

import sys
import json
import requests
import dns.resolver
import socket
from urllib.parse import urlparse
import warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

class SubdomainEnumerator:
    def __init__(self, domain):
        self.domain = domain
        self.subdomains = set()
        self.active_subdomains = []
        
    def extract_domain(self, url):
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            if parsed.netloc:
                return parsed.netloc
            return url
        except:
            return url
    
    def certificate_transparency(self):
        """Discover subdomains via Certificate Transparency logs"""
        print(f"[*] Searching Certificate Transparency logs...", file=sys.stderr)
        
        try:
            # crt.sh API
            url = f"https://crt.sh/?q=%.{self.domain}&output=json"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                for entry in data:
                    name_value = entry.get('name_value', '')
                    # Split by newlines (multiple domains in one cert)
                    for subdomain in name_value.split('\n'):
                        subdomain = subdomain.strip().lower()
                        # Remove wildcards
                        subdomain = subdomain.replace('*.', '')
                        if subdomain.endswith(self.domain) and subdomain not in self.subdomains:
                            self.subdomains.add(subdomain)
                            print(f"[+] Found via CT: {subdomain}", file=sys.stderr)
                            
        except Exception as e:
            print(f"[!] CT logs error: {e}", file=sys.stderr)
    
    def dns_enumeration(self):
        """Enumerate subdomains via DNS queries"""
        print(f"[*] Performing DNS enumeration...", file=sys.stderr)
        
        # Common subdomains wordlist
        common_subs = [
            'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'webdisk',
            'ns2', 'cpanel', 'whm', 'autodiscover', 'autoconfig', 'mx', 'mx1', 'mx2',
            'api', 'dev', 'staging', 'test', 'admin', 'portal', 'blog', 'shop', 'store',
            'vpn', 'remote', 'secure', 'cloud', 'cdn', 'static', 'assets', 'images',
            'dashboard', 'app', 'mobile', 'beta', 'alpha', 'demo', 'sandbox', 'prod',
            'production', 'internal', 'intranet', 'extranet', 'git', 'svn', 'repo',
            'jenkins', 'ci', 'cd', 'build', 'deploy', 'docker', 'k8s', 'kubernetes',
            'db', 'database', 'sql', 'mysql', 'postgres', 'mongo', 'redis', 'cache',
            'backup', 'backups', 'old', 'new', 'legacy', 'v1', 'v2', 'v3', 'api-v1',
            'api-v2', 'status', 'monitor', 'monitoring', 'metrics', 'logs', 'analytics'
        ]
        
        resolver = dns.resolver.Resolver()
        resolver.timeout = 2
        resolver.lifetime = 2
        
        for sub in common_subs:
            subdomain = f"{sub}.{self.domain}"
            try:
                answers = resolver.resolve(subdomain, 'A')
                if answers:
                    self.subdomains.add(subdomain)
                    print(f"[+] Found via DNS: {subdomain}", file=sys.stderr)
            except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.Timeout):
                continue
            except Exception:
                continue
    
    def check_active(self):
        """Check which subdomains are actively responding"""
        print(f"[*] Checking active subdomains...", file=sys.stderr)
        
        for subdomain in self.subdomains:
            # Try HTTP and HTTPS
            for protocol in ['https', 'http']:
                url = f"{protocol}://{subdomain}"
                try:
                    response = requests.get(
                        url, 
                        timeout=5, 
                        verify=False, 
                        allow_redirects=True,
                        headers={'User-Agent': 'Mozilla/5.0'}
                    )
                    
                    # Get IP address
                    try:
                        ip = socket.gethostbyname(subdomain)
                    except:
                        ip = "Unknown"
                    
                    self.active_subdomains.append({
                        'subdomain': subdomain,
                        'url': url,
                        'status_code': response.status_code,
                        'ip': ip,
                        'title': self.extract_title(response.text),
                        'server': response.headers.get('Server', 'Unknown'),
                        'active': True
                    })
                    
                    print(f"[+] Active: {url} [{response.status_code}]", file=sys.stderr)
                    break  # Found active, no need to try other protocol
                    
                except requests.exceptions.SSLError:
                    # SSL error on HTTPS, might work on HTTP
                    continue
                except:
                    continue
    
    def extract_title(self, html):
        """Extract page title from HTML"""
        try:
            import re
            match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
            if match:
                return match.group(1).strip()[:100]
        except:
            pass
        return "No title"
    
    def enumerate(self):
        """Run complete enumeration"""
        print(f"[*] Starting subdomain enumeration for {self.domain}", file=sys.stderr)
        
        try:
            # Phase 1: Certificate Transparency
            self.certificate_transparency()
            
            # Phase 2: DNS Enumeration
            self.dns_enumeration()
            
            # Phase 3: Check active subdomains
            self.check_active()
            
            # Generate vulnerabilities from findings
            vulnerabilities = []
            
            for sub in self.active_subdomains:
                severity = 'info'
                
                # Check for interesting subdomains
                interesting_keywords = ['admin', 'test', 'dev', 'staging', 'internal', 'backup', 'old', 'api', 'jenkins', 'git']
                if any(keyword in sub['subdomain'].lower() for keyword in interesting_keywords):
                    severity = 'medium'
                
                vulnerabilities.append({
                    'type': 'Subdomain Discovery',
                    'severity': severity,
                    'title': f"Active subdomain: {sub['subdomain']}",
                    'description': f"Discovered active subdomain at {sub['url']}",
                    'payload': sub['url'],
                    'evidence': f"Status: {sub['status_code']}, IP: {sub['ip']}, Server: {sub['server']}, Title: {sub['title']}",
                    'remediation': 'Review exposed subdomains and ensure sensitive services are not publicly accessible',
                    'cvss': 'N/A'
                })
            
            result = {
                'success': True,
                'domain': self.domain,
                'total_found': len(self.subdomains),
                'active_count': len(self.active_subdomains),
                'subdomains': list(self.subdomains),
                'active_subdomains': self.active_subdomains,
                'vulnerabilities': vulnerabilities,
                'summary': {
                    'total': len(vulnerabilities),
                    'critical': 0,
                    'high': 0,
                    'medium': len([v for v in vulnerabilities if v['severity'] == 'medium']),
                    'low': 0,
                    'info': len([v for v in vulnerabilities if v['severity'] == 'info'])
                }
            }
            
            print(f"[+] Enumeration complete: {len(self.subdomains)} subdomains found, {len(self.active_subdomains)} active", file=sys.stderr)
            return result
            
        except Exception as e:
            print(f"[!] Enumeration failed: {e}", file=sys.stderr)
            return {
                'success': False,
                'error': str(e),
                'vulnerabilities': [],
                'summary': {'total': 0, 'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
            }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Domain required'}))
        sys.exit(1)
    
    # Extract domain from URL if needed
    input_domain = sys.argv[1]
    try:
        parsed = urlparse(input_domain)
        domain = parsed.netloc if parsed.netloc else input_domain
        # Remove www. prefix
        domain = domain.replace('www.', '')
    except:
        domain = input_domain
    
    try:
        enumerator = SubdomainEnumerator(domain)
        result = enumerator.enumerate()
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'vulnerabilities': [],
            'summary': {'total': 0, 'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
