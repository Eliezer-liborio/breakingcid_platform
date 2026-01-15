import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Shield, Zap, Target, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Activity className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

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
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-foreground hover:text-primary">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/scan/new">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    New Scan
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign In
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-6xl font-bold text-foreground leading-tight">
              Offensive Security
              <br />
              <span className="text-primary">Testing Platform</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Execute advanced vulnerability scans with HTTP Request Smuggling and SSRF detection. 
              Professional-grade security testing powered by cutting-edge research.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    <Activity className="w-5 h-5 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/scan/new">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8">
                    <Zap className="w-5 h-5 mr-2" />
                    Start Scan
                  </Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8">
                  <Shield className="w-5 h-5 mr-2" />
                  Get Started
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl mx-auto">
          <div className="p-6 rounded-lg border border-border bg-card hover:border-primary transition-all">
            <Target className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2 text-foreground">HTTP Smuggling</h3>
            <p className="text-muted-foreground">
              Detect CL.TE, TE.CL, and TE.TE vulnerabilities based on James Kettle's research
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-secondary transition-all">
            <Zap className="w-12 h-12 text-secondary mb-4" />
            <h3 className="text-xl font-bold mb-2 text-foreground">SSRF Detection</h3>
            <p className="text-muted-foreground">
              Identify Server-Side Request Forgery with cloud metadata and internal service detection
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card hover:border-accent transition-all">
            <Activity className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-bold mb-2 text-foreground">Real-time Reports</h3>
            <p className="text-muted-foreground">
              Generate detailed markdown reports with severity ratings and remediation guidance
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>BreakingCID - Professional Offensive Security Testing Platform</p>
          <p className="text-sm mt-2">For authorized testing only</p>
        </div>
      </footer>
    </div>
  );
}
