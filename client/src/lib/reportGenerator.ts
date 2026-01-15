interface Vulnerability {
  id: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string | null;
  evidence: string | null;
  payload: string | null;
  createdAt: Date;
}

interface ScanReport {
  scanId: number;
  target: string;
  scanType: string;
  status: string;
  createdAt: Date;
  duration?: number | null;
  vulnerabilities: Vulnerability[];
}

export function generateReportContent(report: ScanReport): string {
  const lines: string[] = [];

  // ASCII Art Header
  lines.push('╔════════════════════════════════════════════════════════════════════════╗');
  lines.push('║                    BREAKINGCID SECURITY SCAN REPORT                    ║');
  lines.push('╚════════════════════════════════════════════════════════════════════════╝');
  lines.push('');

  // Scan Information
  lines.push('┌─ SCAN INFORMATION ─────────────────────────────────────────────────────┐');
  lines.push(`│ Scan ID:        ${report.scanId}`);
  lines.push(`│ Target:         ${report.target}`);
  lines.push(`│ Scan Type:      ${report.scanType.toUpperCase().replace('_', ' ')}`);
  lines.push(`│ Status:         ${report.status.toUpperCase()}`);
  lines.push(`│ Started:        ${new Date(report.createdAt).toLocaleString()}`);
  if (report.duration) {
    lines.push(`│ Duration:       ${report.duration} seconds`);
  }
  lines.push('└────────────────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Vulnerability Summary
  const criticalCount = report.vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = report.vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = report.vulnerabilities.filter(v => v.severity === 'medium').length;
  const lowCount = report.vulnerabilities.filter(v => v.severity === 'low').length;

  lines.push('┌─ VULNERABILITY SUMMARY ────────────────────────────────────────────────┐');
  lines.push(`│ Total Vulnerabilities:  ${report.vulnerabilities.length}`);
  lines.push(`│ 🔴 Critical:            ${criticalCount}`);
  lines.push(`│ 🟠 High:                ${highCount}`);
  lines.push(`│ 🟡 Medium:              ${mediumCount}`);
  lines.push(`│ 🔵 Low:                 ${lowCount}`);
  lines.push('└────────────────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Risk Assessment
  const riskScore = calculateRiskScore(report.vulnerabilities);
  lines.push('┌─ RISK ASSESSMENT ──────────────────────────────────────────────────────┐');
  lines.push(`│ Overall Risk Level:     ${getRiskLevel(riskScore)}`);
  lines.push(`│ Risk Score:             ${riskScore}/100`);
  lines.push('└────────────────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Detailed Vulnerabilities
  if (report.vulnerabilities.length > 0) {
    lines.push('┌─ DETAILED FINDINGS ────────────────────────────────────────────────────┐');
    lines.push('');

    report.vulnerabilities.forEach((vuln, index) => {
      const severityIcon = getSeverityIcon(vuln.severity);
      lines.push(`${severityIcon} [${index + 1}] ${vuln.title}`);
      lines.push(`    Type:        ${vuln.type}`);
      lines.push(`    Severity:    ${vuln.severity.toUpperCase()}`);
      
      if (vuln.description) {
        lines.push(`    Description: ${vuln.description}`);
      }
      
      if (vuln.payload) {
        lines.push(`    Payload:     ${vuln.payload}`);
      }
      
      if (vuln.evidence) {
        lines.push(`    Evidence:    ${vuln.evidence.substring(0, 200)}${vuln.evidence.length > 200 ? '...' : ''}`);
      }
      
      lines.push(`    Found:       ${new Date(vuln.createdAt).toLocaleString()}`);
      lines.push('');
    });

    lines.push('└────────────────────────────────────────────────────────────────────────┘');
    lines.push('');
  }

  // Recommendations
  lines.push('┌─ RECOMMENDATIONS ──────────────────────────────────────────────────────┐');
  
  if (criticalCount > 0) {
    lines.push('│ ⚠️  CRITICAL ISSUES FOUND');
    lines.push('│    - Address critical vulnerabilities immediately');
    lines.push('│    - These issues pose significant security risks');
    lines.push('│    - Implement fixes before deploying to production');
    lines.push('│');
  }

  if (highCount > 0) {
    lines.push('│ ⚠️  HIGH SEVERITY ISSUES FOUND');
    lines.push('│    - Prioritize fixing high-severity vulnerabilities');
    lines.push('│    - These issues should be addressed in the near term');
    lines.push('│');
  }

  if (report.vulnerabilities.length === 0) {
    lines.push('│ ✓ No vulnerabilities found during this scan');
    lines.push('│   Continue monitoring and perform regular security assessments');
    lines.push('│');
  } else {
    lines.push('│ • Perform code review for affected components');
    lines.push('│ • Implement security best practices');
    lines.push('│ • Conduct follow-up testing after remediation');
    lines.push('│ • Monitor for similar issues in the future');
    lines.push('│');
  }

  lines.push('└────────────────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Footer
  lines.push('═════════════════════════════════════════════════════════════════════════');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('BreakingCID - Offensive Security Platform');
  lines.push('═════════════════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

function calculateRiskScore(vulnerabilities: Vulnerability[]): number {
  let score = 0;
  vulnerabilities.forEach(v => {
    switch (v.severity) {
      case 'critical':
        score += 25;
        break;
      case 'high':
        score += 15;
        break;
      case 'medium':
        score += 8;
        break;
      case 'low':
        score += 3;
        break;
    }
  });
  return Math.min(score, 100);
}

function getRiskLevel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'MINIMAL';
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    default: return '⚪';
  }
}

export function downloadReport(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
