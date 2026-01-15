import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, CheckCircle, XCircle, Activity, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function History() {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: scans, isLoading } = trpc.scans.list.useQuery(undefined, {
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

  const filteredScans = scans?.filter(scan => 
    scan.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scan.scanType.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusIcon = (status: string) => {
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
              <Button variant="ghost" className="text-primary">History</Button>
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
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              <span className="text-primary">Scan History</span>
            </h2>
            <p className="text-muted-foreground">View all your security scans</p>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by target or scan type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border text-foreground"
            />
          </div>

          {/* Scans List */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">All Scans</CardTitle>
              <CardDescription className="text-muted-foreground">
                {filteredScans.length} scan{filteredScans.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : filteredScans.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'No scans match your search' : 'No scans yet'}
                  </p>
                  {!searchQuery && (
                    <Link href="/scan/new">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Start Your First Scan
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredScans.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
                      onClick={() => setLocation(`/scan/${scan.id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {getStatusIcon(scan.status)}
                        
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{scan.target}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{scan.scanType.replace('_', ' ').toUpperCase()}</span>
                            <span>•</span>
                            <span>{new Date(scan.startedAt).toLocaleString()}</span>
                            {scan.duration && (
                              <>
                                <span>•</span>
                                <span>{Math.floor(scan.duration / 60)}m {scan.duration % 60}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
