import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Shield, Activity, CheckCircle, XCircle, Loader2, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.scans.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: scans, isLoading: scansLoading } = trpc.scans.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

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

  const recentScans = scans?.slice(0, 5) || [];

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
              <Button variant="ghost" className="text-primary">Dashboard</Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" className="text-foreground hover:text-primary">History</Button>
            </Link>
            <Link href="/scan/new">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Scan
              </Button>
            </Link>
            <Button variant="ghost" onClick={() => logout()} className="text-muted-foreground hover:text-foreground">
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, <span className="text-primary">{user?.name || 'User'}</span>
            </h2>
            <p className="text-muted-foreground">Monitor your security scans and vulnerabilities</p>
          </div>

          {/* Stats Grid */}
          {statsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats?.scans.total || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.scans.running || 0} running
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vulnerabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{stats?.vulnerabilities.total || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.vulnerabilities.critical || 0} critical
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">{stats?.scans.completed || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.scans.failed || 0} failed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Critical Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{stats?.vulnerabilities.critical || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.vulnerabilities.high || 0} high severity
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Scans */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Scans</CardTitle>
              <CardDescription className="text-muted-foreground">Your latest security assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {scansLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : recentScans.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No scans yet</p>
                  <Link href="/scan/new">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Start Your First Scan
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentScans.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
                      onClick={() => setLocation(`/scan/${scan.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        {scan.status === 'completed' && <CheckCircle className="w-5 h-5 text-secondary" />}
                        {scan.status === 'running' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                        {scan.status === 'failed' && <XCircle className="w-5 h-5 text-destructive" />}
                        {scan.status === 'pending' && <Activity className="w-5 h-5 text-muted-foreground" />}
                        
                        <div>
                          <p className="font-medium text-foreground">{scan.target}</p>
                          <p className="text-sm text-muted-foreground">
                            {scan.scanType.replace('_', ' ').toUpperCase()} • {new Date(scan.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          scan.status === 'completed' ? 'bg-secondary/20 text-secondary' :
                          scan.status === 'running' ? 'bg-primary/20 text-primary' :
                          scan.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {scan.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <Link href="/history">
                    <Button variant="outline" className="w-full">
                      View All Scans
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
