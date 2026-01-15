import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, AlertTriangle, CheckCircle, XCircle, Activity, ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { getLoginUrl } from "@/const";
import { Streamdown } from "streamdown";

export default function ScanDetails() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const params = useParams<{ id: string }>();
  const scanId = parseInt(params.id || "0");

  const { data, isLoading, refetch } = trpc.scans.get.useQuery(
    { id: scanId },
    {
      enabled: isAuthenticated && scanId > 0,
      refetchInterval: (query) => {
        const status = query.state.data?.scan.status;
        return status === 'running' || status === 'pending' ? 3000 : false;
      },
    }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const scan = data?.scan;
  const vulnerabilities = data?.vulnerabilities || [];
  const report = data?.report;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive';
      case 'high': return 'bg-accent/20 text-accent border-accent';
      case 'medium': return 'bg-secondary/20 text-secondary border-secondary';
      case 'low': return 'bg-primary/20 text-primary border-primary';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-secondary" />;
      case 'running': return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'failed': return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">BreakingCID</h1>
          </div>
          
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-foreground hover:text-primary">Dashboard</Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" className="text-foreground hover:text-primary">History</Button>
            </Link>
            <Button variant="ghost" onClick={() => logout()} className="text-muted-foreground hover:text-foreground">
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : !scan ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Scan Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested scan does not exist or you don't have access to it.</p>
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <Link href="/dashboard">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>

            {/* Scan Header */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(scan.status)}
                      <CardTitle className="text-2xl text-foreground">{scan.target}</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      {scan.scanType.replace('_', ' ').toUpperCase()} • Started {new Date(scan.startedAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge className={`${
                    scan.status === 'completed' ? 'bg-secondary/20 text-secondary border-secondary' :
                    scan.status === 'running' ? 'bg-primary/20 text-primary border-primary' :
                    scan.status === 'failed' ? 'bg-destructive/20 text-destructive border-destructive' :
                    'bg-muted text-muted-foreground border-muted'
                  } border`}>
                    {scan.status}
                  </Badge>
                </div>
              </CardHeader>
              {scan.duration && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Duration: {Math.floor(scan.duration / 60)}m {scan.duration % 60}s
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Vulnerabilities Summary */}
            {scan.status === 'completed' && report?.summary && (
              <div className="grid md:grid-cols-5 gap-4">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{report.summary.total}</div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">{report.summary.critical}</div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">High</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">{report.summary.high}</div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Medium</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">{report.summary.medium}</div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Low</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{report.summary.low}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Vulnerabilities List */}
            {scan.status === 'completed' && vulnerabilities.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Vulnerabilities Found</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Detailed findings from the security scan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="p-4 rounded-lg border border-border space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground mb-1">{vuln.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{vuln.type}</p>
                        </div>
                        <Badge className={`${getSeverityColor(vuln.severity)} border`}>
                          {vuln.severity}
                        </Badge>
                      </div>
                      
                      {vuln.description && (
                        <p className="text-sm text-foreground">{vuln.description}</p>
                      )}
                      
                      {vuln.cvss && (
                        <p className="text-xs text-muted-foreground">CVSS Score: {vuln.cvss}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Report */}
            {scan.status === 'completed' && report && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Full Report</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Comprehensive security assessment report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <Streamdown>{report.content}</Streamdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Running Status */}
            {(scan.status === 'running' || scan.status === 'pending') && (
              <Card className="border-border bg-card">
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Scan in Progress</h3>
                  <p className="text-muted-foreground">
                    The security scan is currently running. This page will automatically update when complete.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Failed Status */}
            {scan.status === 'failed' && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="py-12 text-center">
                  <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Scan Failed</h3>
                  <p className="text-muted-foreground mb-6">
                    The security scan encountered an error and could not complete.
                  </p>
                  <Link href="/scan/new">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Start New Scan
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
