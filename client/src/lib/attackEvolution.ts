export interface AttackPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  details: string[];
  startTime?: Date;
  endTime?: Date;
}

export interface AttackEvolution {
  scanId: number;
  scanType: string;
  target: string;
  phases: AttackPhase[];
  totalProgress: number;
  currentPhase: string;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export const SCAN_PHASES: Record<string, AttackPhase[]> = {
  xss: [
    {
      id: 'reconnaissance',
      name: 'RECONNAISSANCE',
      description: 'Gathering target information and analyzing structure',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'scanning',
      name: 'SCANNING',
      description: 'Scanning for potential XSS injection points',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'analysis',
      name: 'ANALYSIS',
      description: 'Analyzing and filtering results',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'exploitation',
      name: 'EXPLOITATION',
      description: 'Testing payloads and confirming vulnerabilities',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'reporting',
      name: 'REPORTING',
      description: 'Generating comprehensive security report',
      status: 'pending',
      progress: 0,
      details: [],
    },
  ],
  subdomain_enum: [
    {
      id: 'reconnaissance',
      name: 'RECONNAISSANCE',
      description: 'Gathering initial target information',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'passive_enum',
      name: 'PASSIVE ENUMERATION',
      description: 'Passive subdomain discovery (DNS, WHOIS, certificates)',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'active_enum',
      name: 'ACTIVE ENUMERATION',
      description: 'Active subdomain brute-forcing and verification',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'analysis',
      name: 'ANALYSIS',
      description: 'Analyzing discovered subdomains and filtering duplicates',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'reporting',
      name: 'REPORTING',
      description: 'Generating discovery report',
      status: 'pending',
      progress: 0,
      details: [],
    },
  ],
  http_smuggling: [
    {
      id: 'reconnaissance',
      name: 'RECONNAISSANCE',
      description: 'Analyzing target HTTP implementation',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'scanning',
      name: 'SCANNING',
      description: 'Testing HTTP smuggling techniques (CL.TE, TE.CL, TE.TE)',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'analysis',
      name: 'ANALYSIS',
      description: 'Analyzing responses and identifying vulnerabilities',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'exploitation',
      name: 'EXPLOITATION',
      description: 'Testing exploitation scenarios',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'reporting',
      name: 'REPORTING',
      description: 'Generating technical report',
      status: 'pending',
      progress: 0,
      details: [],
    },
  ],
  ssrf: [
    {
      id: 'reconnaissance',
      name: 'RECONNAISSANCE',
      description: 'Identifying potential SSRF endpoints',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'scanning',
      name: 'SCANNING',
      description: 'Testing SSRF payloads and URL schemes',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'analysis',
      name: 'ANALYSIS',
      description: 'Analyzing server responses and filtering results',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'exploitation',
      name: 'EXPLOITATION',
      description: 'Testing internal network access and data exfiltration',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'reporting',
      name: 'REPORTING',
      description: 'Generating exploitation report',
      status: 'pending',
      progress: 0,
      details: [],
    },
  ],
  comprehensive: [
    {
      id: 'reconnaissance',
      name: 'RECONNAISSANCE',
      description: 'Comprehensive target analysis and mapping',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'subdomain_enum',
      name: 'SUBDOMAIN ENUMERATION',
      description: 'Discovering all subdomains and hosts',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'port_scanning',
      name: 'PORT SCANNING',
      description: 'Scanning for open ports and services',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'service_detection',
      name: 'SERVICE DETECTION',
      description: 'Identifying services and versions',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'vulnerability_scanning',
      name: 'VULNERABILITY SCANNING',
      description: 'Scanning for known vulnerabilities',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'exploitation',
      name: 'EXPLOITATION',
      description: 'Testing and confirming vulnerabilities',
      status: 'pending',
      progress: 0,
      details: [],
    },
    {
      id: 'reporting',
      name: 'REPORTING',
      description: 'Generating comprehensive security assessment',
      status: 'pending',
      progress: 0,
      details: [],
    },
  ],
};

export function getPhases(scanType: string): AttackPhase[] {
  return SCAN_PHASES[scanType] || SCAN_PHASES.comprehensive;
}

export function calculateTotalProgress(phases: AttackPhase[]): number {
  if (phases.length === 0) return 0;
  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
  return Math.round(totalProgress / phases.length);
}

export function parseAttackLog(log: string, scanType: string): Partial<AttackPhase> | null {
  // Parse different log formats and extract phase information
  const phaseKeywords = {
    reconnaissance: ['reconnaissance', 'gathering', 'analyzing', 'mapping', 'target info'],
    passive_enum: ['passive', 'dns', 'whois', 'certificate', 'shodan', 'crt.sh'],
    active_enum: ['brute', 'wordlist', 'active', 'resolving', 'verifying'],
    scanning: ['scanning', 'probing', 'testing', 'sending requests', 'payloads'],
    port_scanning: ['port scan', 'nmap', 'open ports', 'service'],
    service_detection: ['service', 'version', 'banner', 'fingerprint'],
    vulnerability_scanning: ['vulnerability', 'cve', 'exploit', 'weakness'],
    analysis: ['analyzing', 'filtering', 'processing', 'results', 'duplicates'],
    exploitation: ['exploit', 'confirming', 'testing payload', 'vulnerable'],
    reporting: ['report', 'generating', 'summary', 'final'],
  };

  for (const [phase, keywords] of Object.entries(phaseKeywords)) {
    if (keywords.some(keyword => log.toLowerCase().includes(keyword))) {
      return {
        id: phase,
        name: phase.toUpperCase().replace('_', ' '),
        status: 'running',
        progress: 50,
      };
    }
  }

  return null;
}

export function extractProgressFromLog(log: string): number {
  // Extract percentage from log messages like "Progress: 45%"
  const match = log.match(/(\d+)%/);
  if (match) {
    return parseInt(match[1]);
  }

  // Extract progress from "X of Y" format
  const ofMatch = log.match(/(\d+)\s+of\s+(\d+)/i);
  if (ofMatch) {
    const current = parseInt(ofMatch[1]);
    const total = parseInt(ofMatch[2]);
    return Math.round((current / total) * 100);
  }

  return 0;
}

export function extractDetailsFromLog(log: string): string {
  // Extract meaningful details from log messages
  // Remove timestamps and severity prefixes
  let detail = log.replace(/^\[\*\]|\[\+\]|\[!\]|\[VERBOSE\]/g, '').trim();
  
  // Remove common prefixes
  detail = detail.replace(/^(Scan|Job|Worker|Status|Found|Discovered):\s*/i, '');
  
  return detail.substring(0, 200); // Limit to 200 chars
}
