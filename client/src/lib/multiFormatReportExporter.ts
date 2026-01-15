import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  scanId: number;
  target: string;
  scanType: string;
  status: string;
  createdAt: Date;
  duration?: number | null;
  vulnerabilities: Array<{
    id: number;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string | null;
    evidence: string | null;
    payload: string | null;
    createdAt: Date;
  }>;
}

export async function exportToPDF(reportData: ReportData, filename: string): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text with wrapping
  const addWrappedText = (text: string, fontSize: number, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize / 2.5) + 2;

    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Header
  pdf.setFillColor(20, 184, 82); // Green
  pdf.rect(0, 0, pageWidth, 30, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BREAKINGCID', margin, 20);
  pdf.setTextColor(0, 0, 0);
  yPosition = 40;

  // Scan Information
  addWrappedText('SCAN INFORMATION', 14, true);
  yPosition += 2;
  addWrappedText(`Scan ID: ${reportData.scanId}`, 11);
  addWrappedText(`Target: ${reportData.target}`, 11);
  addWrappedText(`Scan Type: ${reportData.scanType.toUpperCase().replace('_', ' ')}`, 11);
  addWrappedText(`Status: ${reportData.status.toUpperCase()}`, 11);
  addWrappedText(`Started: ${new Date(reportData.createdAt).toLocaleString()}`, 11);
  if (reportData.duration) {
    addWrappedText(`Duration: ${reportData.duration} seconds`, 11);
  }
  yPosition += 5;

  // Vulnerability Summary
  const criticalCount = reportData.vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = reportData.vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = reportData.vulnerabilities.filter(v => v.severity === 'medium').length;
  const lowCount = reportData.vulnerabilities.filter(v => v.severity === 'low').length;

  addWrappedText('VULNERABILITY SUMMARY', 14, true);
  yPosition += 2;
  addWrappedText(`Total Vulnerabilities: ${reportData.vulnerabilities.length}`, 11);
  addWrappedText(`Critical: ${criticalCount}`, 11);
  addWrappedText(`High: ${highCount}`, 11);
  addWrappedText(`Medium: ${mediumCount}`, 11);
  addWrappedText(`Low: ${lowCount}`, 11);
  yPosition += 5;

  // Detailed Findings
  if (reportData.vulnerabilities.length > 0) {
    addWrappedText('DETAILED FINDINGS', 14, true);
    yPosition += 2;

    reportData.vulnerabilities.forEach((vuln, index) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      addWrappedText(`${index + 1}. ${vuln.title}`, 12, true);
      addWrappedText(`Type: ${vuln.type}`, 10);
      addWrappedText(`Severity: ${vuln.severity.toUpperCase()}`, 10);

      if (vuln.description) {
        addWrappedText(`Description: ${vuln.description}`, 10);
      }

      if (vuln.payload) {
        addWrappedText(`Payload: ${vuln.payload}`, 10);
      }

      if (vuln.evidence) {
        const evidencePreview = vuln.evidence.substring(0, 100);
        addWrappedText(`Evidence: ${evidencePreview}${vuln.evidence.length > 100 ? '...' : ''}`, 10);
      }

      yPosition += 3;
    });
  }

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  pdf.save(filename);
}

export function exportToJSON(reportData: ReportData, filename: string): void {
  const jsonData = {
    metadata: {
      exportDate: new Date().toISOString(),
      platform: 'BreakingCID',
      version: '1.0',
    },
    scan: {
      id: reportData.scanId,
      target: reportData.target,
      scanType: reportData.scanType,
      status: reportData.status,
      createdAt: reportData.createdAt.toISOString(),
      duration: reportData.duration,
    },
    summary: {
      totalVulnerabilities: reportData.vulnerabilities.length,
      critical: reportData.vulnerabilities.filter(v => v.severity === 'critical').length,
      high: reportData.vulnerabilities.filter(v => v.severity === 'high').length,
      medium: reportData.vulnerabilities.filter(v => v.severity === 'medium').length,
      low: reportData.vulnerabilities.filter(v => v.severity === 'low').length,
    },
    vulnerabilities: reportData.vulnerabilities.map(v => ({
      id: v.id,
      type: v.type,
      severity: v.severity,
      title: v.title,
      description: v.description,
      evidence: v.evidence,
      payload: v.payload,
      discoveredAt: v.createdAt.toISOString(),
    })),
  };

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(reportData: ReportData, filename: string): void {
  const headers = ['ID', 'Type', 'Severity', 'Title', 'Description', 'Payload', 'Evidence', 'Discovered'];
  const rows = reportData.vulnerabilities.map(v => [
    v.id,
    v.type,
    v.severity,
    v.title,
    v.description || '',
    v.payload || '',
    v.evidence ? v.evidence.substring(0, 50) : '',
    new Date(v.createdAt).toLocaleString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToXML(reportData: ReportData, filename: string): void {
  const escapeXml = (str: string) => {
    return String(str).replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<breakingcid>\n';
  xml += '  <metadata>\n';
  xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
  xml += '    <platform>BreakingCID</platform>\n';
  xml += '    <version>1.0</version>\n';
  xml += '  </metadata>\n';
  xml += '  <scan>\n';
  xml += `    <id>${reportData.scanId}</id>\n`;
  xml += `    <target>${escapeXml(reportData.target)}</target>\n`;
  xml += `    <scanType>${reportData.scanType}</scanType>\n`;
  xml += `    <status>${reportData.status}</status>\n`;
  xml += `    <createdAt>${reportData.createdAt.toISOString()}</createdAt>\n`;
  if (reportData.duration) {
    xml += `    <duration>${reportData.duration}</duration>\n`;
  }
  xml += '  </scan>\n';
  xml += '  <vulnerabilities>\n';

  reportData.vulnerabilities.forEach(v => {
    xml += '    <vulnerability>\n';
    xml += `      <id>${v.id}</id>\n`;
    xml += `      <type>${escapeXml(v.type)}</type>\n`;
    xml += `      <severity>${v.severity}</severity>\n`;
    xml += `      <title>${escapeXml(v.title)}</title>\n`;
    if (v.description) {
      xml += `      <description>${escapeXml(v.description)}</description>\n`;
    }
    if (v.payload) {
      xml += `      <payload>${escapeXml(v.payload)}</payload>\n`;
    }
    if (v.evidence) {
      xml += `      <evidence>${escapeXml(v.evidence)}</evidence>\n`;
    }
    xml += `      <discoveredAt>${v.createdAt.toISOString()}</discoveredAt>\n`;
    xml += '    </vulnerability>\n';
  });

  xml += '  </vulnerabilities>\n';
  xml += '</breakingcid>\n';

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
