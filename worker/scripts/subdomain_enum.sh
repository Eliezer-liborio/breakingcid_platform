#!/bin/bash
# Subdomain Enumeration Script
# Usage: ./subdomain_enum.sh <domain>

TARGET=$1

if [ -z "$TARGET" ]; then
    echo "Usage: $0 <domain>" >&2
    exit 1
fi

# Extract domain from URL
DOMAIN=$(echo "$TARGET" | sed -E 's#https?://##' | sed -E 's#/.*##')

echo "[*] Starting subdomain enumeration for: $DOMAIN" >&2

# Temporary files
TEMP_DIR=$(mktemp -d)
ALL_SUBS="$TEMP_DIR/all_subs.txt"

# Certificate Transparency (crt.sh)
echo "[*] Querying Certificate Transparency logs..." >&2
curl -s "https://crt.sh/?q=%25.$DOMAIN&output=json" 2>/dev/null | \
    jq -r '.[].name_value' 2>/dev/null | \
    sed 's/\*\.//g' | \
    sort -u >> "$ALL_SUBS"

# Common subdomains bruteforce
echo "[*] Testing common subdomains..." >&2
COMMON_SUBS="www mail ftp admin api dev staging test blog shop app portal vpn remote secure cloud cdn static assets images media files docs support help forum wiki dashboard panel cpanel webmail smtp pop imap ns ns1 ns2 mx"

for sub in $COMMON_SUBS; do
    echo "[VERBOSE] Testing: $sub.$DOMAIN" >&2
    if host "$sub.$DOMAIN" >/dev/null 2>&1; then
        echo "$sub.$DOMAIN" >> "$ALL_SUBS"
        echo "[+] Found: $sub.$DOMAIN" >&2
    fi
done

# Deduplicate and validate
echo "[*] Validating discovered subdomains..." >&2
sort -u "$ALL_SUBS" > "$TEMP_DIR/unique_subs.txt"

SUBDOMAINS_JSON="[]"
ACTIVE_COUNT=0

while read -r subdomain; do
    if [ -n "$subdomain" ]; then
        echo "[VERBOSE] Validating: $subdomain" >&2
        
        # Check if subdomain resolves
        IP=$(host "$subdomain" 2>/dev/null | grep "has address" | head -1 | awk '{print $4}')
        
        if [ -n "$IP" ]; then
            ACTIVE_COUNT=$((ACTIVE_COUNT + 1))
            echo "[+] Active: $subdomain ($IP)" >&2
            
            # Add to JSON array
            SUBDOMAIN_JSON=$(cat <<EOF
{
  "subdomain": "$subdomain",
  "ip": "$IP",
  "active": true
}
EOF
)
            SUBDOMAINS_JSON=$(echo "$SUBDOMAINS_JSON" | jq --argjson item "$SUBDOMAIN_JSON" '. += [$item]')
        fi
    fi
done < "$TEMP_DIR/unique_subs.txt"

# Cleanup
rm -rf "$TEMP_DIR"

# Output JSON result
cat <<EOF
{
  "scan_type": "subdomain_enum",
  "target": "$DOMAIN",
  "subdomains": $SUBDOMAINS_JSON,
  "total_found": $(echo "$SUBDOMAINS_JSON" | jq 'length'),
  "active_count": $ACTIVE_COUNT,
  "vulnerabilities": [],
  "report": {
    "content": "# Subdomain Enumeration Report\\n\\n**Target:** $DOMAIN\\n**Total Found:** $(echo "$SUBDOMAINS_JSON" | jq 'length')\\n**Active:** $ACTIVE_COUNT\\n\\n## Discovered Subdomains\\n\\n$(echo "$SUBDOMAINS_JSON" | jq -r '.[] | "- \\(.subdomain) (\\(.ip))"')\\n",
    "summary": {
      "total": 0,
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0,
      "info": 0
    }
  }
}
EOF

echo "[+] Subdomain enumeration completed: $ACTIVE_COUNT active subdomains found" >&2
