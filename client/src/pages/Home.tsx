import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Terminal, Download, Play, Loader2, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useLocation } from "wouter";
import { VulnerabilitiesTable } from "@/components/VulnerabilitiesTable";
import { generateReportContent, downloadReport } from "@/lib/reportGenerator";

interface TerminalLine {
  text: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'verbose' | 'header';
  timestamp: Date;
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState<"http_smuggling" | "ssrf" | "xss" | "subdomain_enum" | "comprehensive">("xss");
  const [verbose, setVerbose] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<number | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { isConnected, logs, subscribeScan, unsubscribeScan } = useWebSocket();

  const createScan = trpc.scans.create.useMutation({
    onSuccess: (data) => {
      setCurrentScanId(data.scanId);
      addTerminalLine(`[+] Scan initiated with ID: ${data.scanId}`, 'success');
      addTerminalLine(`[*] Status: ${data.status}`, 'info');
      addTerminalLine(`[*] Waiting for worker to pick up job...`, 'info');
      subscribeScan(data.scanId);
    },
    onError: (error) => {
      addTerminalLine(`[!] ERROR: ${error.message}`, 'error');
      toast.error("Scan failed", { description: error.message });
    },
  });

  const { data: scanData, refetch } = trpc.scans.get.useQuery(
    { id: currentScanId! },
    { 
      enabled: currentScanId !== null,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data?.scan.status === 'running' || data?.scan.status === 'pending') {
          return 2000;
        }
        return false;
      }
    }
  );

  const { data: logsData } = trpc.scans.getLogs.useQuery(
    { scanId: currentScanId! },
    { 
      enabled: currentScanId !== null,
      refetchInterval: (query) => {
        const scanStatus = scanData?.scan.status;
        if (scanStatus === 'running' || scanStatus === 'pending') {
          return 1000;
        }
        return false;
      }
    }
  );

  useEffect(() => {
    if (scanData) {
      if (scanData.scan.status === 'completed') {
        addTerminalLine(`[+] Scan completed successfully!`, 'success');
        addTerminalLine(`[+] Found ${scanData.vulnerabilities.length} vulnerabilities`, 'success');
        
        const summary = scanData.report?.summary;
        if (summary) {
          addTerminalLine(`[*] Critical: ${summary.critical} | High: ${summary.high} | Medium: ${summary.medium} | Low: ${summary.low}`, 'info');
        }
      } else if (scanData.scan.status === 'failed') {
        addTerminalLine(`[!] Scan failed`, 'error');
      } else if (scanData.scan.status === 'running') {
        if (terminalLines[terminalLines.length - 1]?.text !== '[*] Scan in progress...') {
          addTerminalLine(`[*] Scan in progress...`, 'info');
        }
      }
    }
  }, [scanData]);

  useEffect(() => {
    if (logsData && logsData.length > 0) {
      const logMessages = logsData.map(log => ({
        text: log.message,
        level: (log.message.startsWith('[+]') ? 'success' : 
                log.message.startsWith('[!]') ? 'error' :
                log.message.startsWith('[VERBOSE]') ? 'verbose' : 'info') as any,
        timestamp: new Date(log.timestamp)
      }));
      setTerminalLines(logMessages);
    }
  }, [logsData]);

  // WebSocket logs
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[logs.length - 1];
      addTerminalLine(latestLog.message, latestLog.level);
    }
  }, [logs]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const addTerminalLine = (text: string, level: TerminalLine['level'] = 'info') => {
    setTerminalLines(prev => [...prev, { text, level, timestamp: new Date() }]);
  };

  const handleExecute = () => {
    if (!target) {
      toast.error("Target URL required");
      return;
    }

    try {
      new URL(target);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    setTerminalLines([]);
    addTerminalLine(`╔═══════════════════════════════════════════════════════════════╗`, 'header');
    addTerminalLine(`║              BREAKINGCID SECURITY SCANNER v2.0              ║`, 'header');
    addTerminalLine(`╚═══════════════════════════════════════════════════════════════╝`, 'header');
    addTerminalLine(``, 'info');
    addTerminalLine(`[*] Target: ${target}`, 'info');
    addTerminalLine(`[*] Scan Type: ${scanType.toUpperCase().replace('_', ' ')}`, 'info');
    addTerminalLine(`[*] Verbose Mode: ${verbose ? 'ENABLED' : 'DISABLED'}`, 'info');
    addTerminalLine(`[*] WebSocket: ${isConnected ? 'CONNECTED' : 'CONNECTING'}`, 'info');
    addTerminalLine(`[*] Initializing scanner modules...`, 'info');
    addTerminalLine(``, 'info');

    createScan.mutate({ target, scanType });
  };

  const handleDownloadReport = () => {
    if (!scanData) {
      toast.error("No scan data available");
      return;
    }

    const reportContent = generateReportContent({
      scanId: scanData.scan.id,
      target: scanData.scan.target,
      scanType: scanData.scan.scanType,
      status: scanData.scan.status,
      createdAt: new Date(scanData.scan.createdAt),
      duration: scanData.scan.duration,
      vulnerabilities: scanData.vulnerabilities,
    });

    downloadReport(reportContent, `breakingcid_scan_${currentScanId}_${Date.now()}.txt`);
    addTerminalLine(`[+] Report downloaded successfully`, 'success');
    toast.success("Report downloaded");
  };

  const handleNewScan = () => {
    if (currentScanId) {
      unsubscribeScan(currentScanId);
    }
    setCurrentScanId(null);
    setTerminalLines([]);
    setTarget("");
  };

  const getTerminalLineColor = (level: TerminalLine['level']) => {
    switch (level) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'verbose': return 'text-cyan-400';
      case 'header': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900 border-green-500/30 p-8">
          <div className="text-center space-y-6">
            <div className="font-mono text-green-500 text-sm">
              <pre className="text-left">
{`
 ██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗██╗███╗   ██╗ ██████╗  ██████╗██╗██████╗ 
 ██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝██║████╗  ██║██╔════╝ ██╔════╝██║██╔══██╗
 ██████╔╝██████╔╝█████╗  ███████║█████╔╝ ██║██╔██╗ ██║██║  ███╗██║     ██║██║  ██║
 ██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗ ██║██║╚██╗██║██║   ██║██║     ██║██║  ██║
 ██████╔╝██║  ██║███████╗██║  ██║██║  ██╗██║██║ ╚████║╚██████╔╝╚██████╗██║██████╔╝
 ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝╚═╝╚═════╝ 
`}
              </pre>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-green-500 font-mono">OFFENSIVE SECURITY PLATFORM</h2>
              <p className="text-gray-400 font-mono text-sm">Authentication Required</p>
            </div>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-green-600 hover:bg-green-700 text-black font-mono font-bold"
            >
              &gt; LOGIN
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6" />
            <h1 className="text-2xl font-bold">BREAKINGCID</h1>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <Zap className="w-3 h-3" />
              {isConnected ? 'WEBSOCKET CONNECTED' : 'WEBSOCKET DISCONNECTED'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Button
                onClick={() => setLocation('/admin')}
                variant="outline"
                className="border-green-500/30 text-green-500 hover:bg-green-500/10 text-sm"
              >
                ADMIN
              </Button>
            )}
            <div className="text-sm text-gray-400">
              USER: {user?.name || user?.email} | ROLE: {user?.role?.toUpperCase()}
            </div>
          </div>
        </div>
        <div className="h-px bg-green-500/30"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 border-green-500/30 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">&gt;</span> CONTROL PANEL
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">TARGET URL</label>
                <Input
                  type="url"
                  placeholder="https://target.com"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="bg-black border-green-500/30 text-green-500 font-mono placeholder:text-gray-600"
                  disabled={createScan.isPending || (scanData?.scan.status === 'running')}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">SCAN TYPE</label>
                <Select value={scanType} onValueChange={(value: any) => setScanType(value)} disabled={createScan.isPending || (scanData?.scan.status === 'running')}>
                  <SelectTrigger className="bg-black border-green-500/30 text-green-500 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-green-500/30">
                    <SelectItem value="http_smuggling" className="text-green-500 font-mono">HTTP SMUGGLING</SelectItem>
                    <SelectItem value="ssrf" className="text-green-500 font-mono">SSRF DETECTION</SelectItem>
                    <SelectItem value="xss" className="text-green-500 font-mono">XSS SCANNER</SelectItem>
                    <SelectItem value="subdomain_enum" className="text-green-500 font-mono">SUBDOMAIN ENUM</SelectItem>
                    <SelectItem value="comprehensive" className="text-green-500 font-mono">COMPREHENSIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-black/50 rounded-lg border border-green-500/20">
                <div>
                  <Label htmlFor="verbose-mode" className="text-xs text-gray-400 cursor-pointer">VERBOSE MODE</Label>
                  <p className="text-xs text-gray-600 mt-0.5">Show detailed scan output</p>
                </div>
                <Switch
                  id="verbose-mode"
                  checked={verbose}
                  onCheckedChange={setVerbose}
                  disabled={createScan.isPending || (scanData?.scan.status === 'running')}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              <div className="pt-4 space-y-2">
                {!currentScanId || scanData?.scan.status === 'completed' || scanData?.scan.status === 'failed' ? (
                  <Button
                    onClick={handleExecute}
                    disabled={createScan.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-black font-bold"
                  >
                    {createScan.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> INITIALIZING...</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" /> EXECUTE SCAN</>
                    )}
                  </Button>
                ) : (
                  <Button disabled className="w-full bg-gray-700 text-gray-400 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> SCAN IN PROGRESS...
                  </Button>
                )}

                {/* Worker Status Alert */}
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs">
                  <div className="text-yellow-500 font-bold mb-1">[!] WORKER REQUIRED</div>
                  <div className="text-gray-400">
                    Scans are executed by external worker servers. Configure a worker following <code className="text-green-500">worker/README.md</code>
                  </div>
                </div>

                {scanData?.scan.status === 'completed' && (
                  <>
                    <Button
                      onClick={handleDownloadReport}
                      variant="outline"
                      className="w-full border-green-500/30 text-green-500 hover:bg-green-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" /> DOWNLOAD REPORT
                    </Button>
                    <Button
                      onClick={handleNewScan}
                      variant="outline"
                      className="w-full border-green-500/30 text-green-500 hover:bg-green-500/10"
                    >
                      NEW SCAN
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            {scanData && (
              <div className="mt-6 pt-6 border-t border-green-500/30">
                <h3 className="text-xs text-gray-400 mb-3">SCAN STATISTICS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={
                      scanData.scan.status === 'completed' ? 'text-green-500' :
                      scanData.scan.status === 'failed' ? 'text-red-500' :
                      'text-yellow-500'
                    }>
                      {scanData.scan.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vulnerabilities:</span>
                    <span className="text-green-500">{scanData.vulnerabilities.length}</span>
                  </div>
                  {scanData.scan.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-green-500">{scanData.scan.duration}s</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Terminal Output */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-green-500/30 p-6 h-[calc(100vh-12rem)]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">&gt;</span> TERMINAL OUTPUT
            </h2>
            
            <div 
              ref={terminalRef}
              className="bg-black border border-green-500/30 rounded p-4 h-[calc(100%-3rem)] overflow-y-auto font-mono text-sm"
            >
              {terminalLines.length === 0 ? (
                <div className="text-gray-600">
                  <p>&gt; Awaiting command...</p>
                  <p className="mt-2">&gt; Select scan type, enter target URL, and execute.</p>
                </div>
              ) : (
                terminalLines.map((line, index) => (
                  <div key={index} className="mb-1">
                    <span className={getTerminalLineColor(line.level)}>
                      {line.text}
                    </span>
                  </div>
                ))
              )}
              
              {(createScan.isPending || scanData?.scan.status === 'running') && (
                <div className="mt-2 text-yellow-500 animate-pulse">
                  &gt; _
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Vulnerabilities Section */}
      {scanData && scanData.vulnerabilities.length > 0 && (
        <div className="max-w-7xl mx-auto mt-6">
          <VulnerabilitiesTable vulnerabilities={scanData.vulnerabilities.map((v, idx) => ({
            id: idx,
            type: v.type,
            severity: v.severity as any,
            title: v.title,
            description: v.description || '',
            evidence: v.evidence || '',
            payload: v.payload || '',
            timestamp: v.createdAt,
          }))} />
        </div>
      )}
    </div>
  );
}
