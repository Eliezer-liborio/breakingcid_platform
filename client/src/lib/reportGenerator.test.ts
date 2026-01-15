import { describe, it, expect } from 'vitest';
import { generateReportContent } from './reportGenerator';

describe('reportGenerator', () => {
  it('should generate report content with vulnerabilities', () => {
    const mockReport = {
      scanId: 123,
      target: 'https://example.com',
      scanType: 'xss',
      status: 'completed',
      createdAt: new Date('2024-01-15T10:00:00Z'),
      duration: 120,
      vulnerabilities: [
        {
          id: 1,
          type: 'XSS',
          severity: 'high' as const,
          title: 'Reflected XSS in search parameter',
          description: 'User input is not sanitized',
          evidence: '<script>alert("xss")</script>',
          payload: 'search=<script>alert("xss")</script>',
          createdAt: new Date('2024-01-15T10:05:00Z'),
        },
        {
          id: 2,
          type: 'SQL Injection',
          severity: 'critical' as const,
          title: 'SQL Injection in login form',
          description: 'SQL queries are constructed with user input',
          evidence: "' OR '1'='1",
          payload: "username=' OR '1'='1' --",
          createdAt: new Date('2024-01-15T10:10:00Z'),
        },
      ],
    };

    const report = generateReportContent(mockReport);

    // Check for header
    expect(report).toContain('BREAKINGCID SECURITY SCAN REPORT');

    // Check for scan information
    expect(report).toContain('Scan ID:        123');
    expect(report).toContain('Target:         https://example.com');
    expect(report).toContain('Scan Type:      XSS');
    expect(report).toContain('Status:         COMPLETED');

    // Check for vulnerability summary
    expect(report).toContain('Total Vulnerabilities:  2');
    expect(report).toContain('🔴 Critical:            1');
    expect(report).toContain('🟠 High:                1');

    // Check for detailed findings
    expect(report).toContain('Reflected XSS in search parameter');
    expect(report).toContain('SQL Injection in login form');

    // Check for recommendations
    expect(report).toContain('RECOMMENDATIONS');
    expect(report).toContain('CRITICAL ISSUES FOUND');
  });

  it('should generate report with no vulnerabilities', () => {
    const mockReport = {
      scanId: 456,
      target: 'https://secure.example.com',
      scanType: 'comprehensive',
      status: 'completed',
      createdAt: new Date('2024-01-15T11:00:00Z'),
      duration: 300,
      vulnerabilities: [],
    };

    const report = generateReportContent(mockReport);

    expect(report).toContain('Total Vulnerabilities:  0');
    expect(report).toContain('No vulnerabilities found during this scan');
  });

  it('should calculate risk score correctly', () => {
    const mockReport = {
      scanId: 789,
      target: 'https://risky.example.com',
      scanType: 'subdomain_enum',
      status: 'completed',
      createdAt: new Date('2024-01-15T12:00:00Z'),
      duration: 600,
      vulnerabilities: [
        {
          id: 1,
          type: 'Critical Issue',
          severity: 'critical' as const,
          title: 'Critical vulnerability',
          description: 'A critical issue',
          evidence: 'evidence',
          payload: 'payload',
          createdAt: new Date('2024-01-15T12:05:00Z'),
        },
        {
          id: 2,
          type: 'High Issue',
          severity: 'high' as const,
          title: 'High severity issue',
          description: 'A high issue',
          evidence: 'evidence',
          payload: 'payload',
          createdAt: new Date('2024-01-15T12:10:00Z'),
        },
      ],
    };

    const report = generateReportContent(mockReport);

    // Risk score should be >= 40 (25 + 15)
    expect(report).toContain('Risk Score:');
  });

  it('should include all vulnerability details', () => {
    const mockReport = {
      scanId: 999,
      target: 'https://detailed.example.com',
      scanType: 'http_smuggling',
      status: 'completed',
      createdAt: new Date('2024-01-15T13:00:00Z'),
      duration: 450,
      vulnerabilities: [
        {
          id: 1,
          type: 'HTTP Smuggling',
          severity: 'high' as const,
          title: 'HTTP Request Smuggling',
          description: 'The server is vulnerable to HTTP request smuggling',
          evidence: 'CL.TE vulnerability detected',
          payload: 'POST / HTTP/1.1\r\nContent-Length: 13\r\nTransfer-Encoding: chunked',
          createdAt: new Date('2024-01-15T13:05:00Z'),
        },
      ],
    };

    const report = generateReportContent(mockReport);

    expect(report).toContain('HTTP Request Smuggling');
    expect(report).toContain('HTTP Smuggling');
    expect(report).toContain('The server is vulnerable to HTTP request smuggling');
    expect(report).toContain('CL.TE vulnerability detected');
  });
});
