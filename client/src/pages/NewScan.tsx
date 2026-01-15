import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Shield, Loader2, Target, Zap, Activity } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function NewScan() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState<"http_smuggling" | "ssrf" | "xss" | "comprehensive">("http_smuggling");
  const [scope, setScope] = useState("");

  const createScan = trpc.scans.create.useMutation({
    onSuccess: (data) => {
      toast.success("Scan started successfully!", {
        description: `Scan ID: ${data.scanId}`,
      });
      setLocation(`/scan/${data.scanId}`);
    },
    onError: (error) => {
      toast.error("Failed to start scan", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!target) {
      toast.error("Target URL is required");
      return;
    }

    try {
      new URL(target);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    createScan.mutate({ target, scanType, scope });
  };

  if (loading) {
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
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              <span className="text-primary">New Security Scan</span>
            </h2>
            <p className="text-muted-foreground">Configure and launch a vulnerability assessment</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Scan Configuration</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter target details and select scan type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target URL */}
                <div className="space-y-2">
                  <Label htmlFor="target" className="text-foreground">Target URL *</Label>
                  <Input
                    id="target"
                    type="url"
                    placeholder="https://example.com"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    required
                    className="bg-input border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Full URL of the target application
                  </p>
                </div>

                {/* Scan Type */}
                <div className="space-y-3">
                  <Label className="text-foreground">Scan Type *</Label>
                  <RadioGroup value={scanType} onValueChange={(value: any) => setScanType(value)}>
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all">
                      <RadioGroupItem value="http_smuggling" id="http_smuggling" />
                      <Label htmlFor="http_smuggling" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">HTTP Request Smuggling</p>
                            <p className="text-sm text-muted-foreground">Test CL.TE, TE.CL, and TE.TE techniques</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-secondary transition-all">
                      <RadioGroupItem value="ssrf" id="ssrf" />
                      <Label htmlFor="ssrf" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-secondary" />
                          <div>
                            <p className="font-medium text-foreground">SSRF Detection</p>
                            <p className="text-sm text-muted-foreground">Detect Server-Side Request Forgery vulnerabilities</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-accent transition-all">
                      <RadioGroupItem value="xss" id="xss" />
                      <Label htmlFor="xss" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-accent" />
                          <div>
                            <p className="font-medium text-foreground">XSS Scanner</p>
                            <p className="text-sm text-muted-foreground">Test for Cross-Site Scripting vulnerabilities (Reflected, DOM, Template Injection)</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-all">
                      <RadioGroupItem value="comprehensive" id="comprehensive" />
                      <Label htmlFor="comprehensive" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-accent" />
                          <div>
                            <p className="font-medium text-foreground">Comprehensive Scan</p>
                            <p className="text-sm text-muted-foreground">Run all available security tests</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Scope */}
                <div className="space-y-2">
                  <Label htmlFor="scope" className="text-foreground">Scope (Optional)</Label>
                  <Textarea
                    id="scope"
                    placeholder="api.example.com, *.example.com"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    rows={3}
                    className="bg-input border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional domains or endpoints to include in the scan
                  </p>
                </div>

                {/* Warning */}
                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                  <p className="text-sm text-destructive font-medium">⚠️ Authorization Required</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only scan targets you have explicit permission to test. Unauthorized testing is illegal.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Link href="/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={createScan.isPending}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {createScan.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting Scan...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Start Scan
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
    </div>
  );
}
