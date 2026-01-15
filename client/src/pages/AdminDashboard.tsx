import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Terminal, 
  Loader2, 
  Activity, 
  Users, 
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface WorkerStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'idle' | 'busy';
  lastSeen: Date;
  scansCompleted: number;
  successRate: number;
  uptime: number;
  latency: number;
}

interface JobMetrics {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  totalTime: number;
  averageTime: number;
}

interface PerformanceData {
  timestamp: Date;
  scansPerHour: number;
  vulnerabilitiesFound: number;
  averageTime: number;
}

export default function AdminDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [metrics, setMetrics] = useState<JobMetrics>({
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    totalTime: 0,
    averageTime: 0,
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  // Mock data - em produção, isso viria de endpoints tRPC
  useEffect(() => {
    // Simular dados de workers
    setWorkers([
      {
        id: 'worker-001',
        name: 'Kali-Worker-01',
        status: 'online',
        lastSeen: new Date(),
        scansCompleted: 156,
        successRate: 98.5,
        uptime: 99.2,
        latency: 45,
      },
      {
        id: 'worker-002',
        name: 'Kali-Worker-02',
        status: 'online',
        lastSeen: new Date(Date.now() - 5000),
        scansCompleted: 142,
        successRate: 97.8,
        uptime: 98.9,
        latency: 52,
      },
      {
        id: 'worker-003',
        name: 'Kali-Worker-03',
        status: 'idle',
        lastSeen: new Date(Date.now() - 30000),
        scansCompleted: 89,
        successRate: 96.5,
        uptime: 95.3,
        latency: 78,
      },
      {
        id: 'worker-004',
        name: 'Kali-Worker-04',
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000),
        scansCompleted: 0,
        successRate: 0,
        uptime: 0,
        latency: 0,
      },
    ]);

    // Simular métricas de jobs
    setMetrics({
      pending: 12,
      running: 3,
      completed: 387,
      failed: 8,
      totalTime: 45600,
      averageTime: 118,
    });

    // Simular dados de performance
    const now = new Date();
    setPerformanceData([
      { timestamp: new Date(now.getTime() - 6 * 3600000), scansPerHour: 24, vulnerabilitiesFound: 156, averageTime: 125 },
      { timestamp: new Date(now.getTime() - 5 * 3600000), scansPerHour: 28, vulnerabilitiesFound: 189, averageTime: 118 },
      { timestamp: new Date(now.getTime() - 4 * 3600000), scansPerHour: 31, vulnerabilitiesFound: 212, averageTime: 115 },
      { timestamp: new Date(now.getTime() - 3 * 3600000), scansPerHour: 26, vulnerabilitiesFound: 178, averageTime: 122 },
      { timestamp: new Date(now.getTime() - 2 * 3600000), scansPerHour: 29, vulnerabilitiesFound: 195, averageTime: 119 },
      { timestamp: new Date(now.getTime() - 1 * 3600000), scansPerHour: 32, vulnerabilitiesFound: 218, averageTime: 114 },
      { timestamp: now, scansPerHour: 27, vulnerabilitiesFound: 185, averageTime: 120 },
    ]);
  }, []);

  const getWorkerStatusColor = (status: WorkerStatus['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'offline': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'idle': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'busy': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getWorkerStatusIcon = (status: WorkerStatus['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'offline': return <AlertCircle className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'busy': return <Activity className="w-4 h-4 animate-pulse" />;
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

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900 border-red-500/30 p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-red-500 font-mono">ACCESS DENIED</h2>
            <p className="text-gray-400 font-mono text-sm">Admin access required</p>
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-green-600 hover:bg-green-700 text-black font-mono font-bold"
            >
              Back to Home
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
            <BarChart3 className="w-6 h-6" />
            <h1 className="text-2xl font-bold">ADMIN DASHBOARD</h1>
          </div>
          <div className="text-sm text-gray-400">
            ADMIN: {user?.name || user?.email}
          </div>
        </div>
        <div className="h-px bg-green-500/30"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-green-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">PENDING JOBS</p>
                <p className="text-2xl font-bold text-yellow-500">{metrics.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500/50" />
            </div>
          </Card>

          <Card className="bg-gray-900 border-green-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">RUNNING JOBS</p>
                <p className="text-2xl font-bold text-blue-400">{metrics.running}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400/50 animate-pulse" />
            </div>
          </Card>

          <Card className="bg-gray-900 border-green-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">COMPLETED</p>
                <p className="text-2xl font-bold text-green-500">{metrics.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/50" />
            </div>
          </Card>

          <Card className="bg-gray-900 border-green-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">FAILED</p>
                <p className="text-2xl font-bold text-red-500">{metrics.failed}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500/50" />
            </div>
          </Card>
        </div>

        {/* Workers Status */}
        <Card className="bg-gray-900 border-green-500/30 p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-green-500">&gt;</span> ACTIVE WORKERS
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-500/30">
                  <th className="text-left py-2 text-gray-400">WORKER ID</th>
                  <th className="text-left py-2 text-gray-400">STATUS</th>
                  <th className="text-left py-2 text-gray-400">SCANS</th>
                  <th className="text-left py-2 text-gray-400">SUCCESS RATE</th>
                  <th className="text-left py-2 text-gray-400">UPTIME</th>
                  <th className="text-left py-2 text-gray-400">LATENCY</th>
                  <th className="text-left py-2 text-gray-400">LAST SEEN</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="border-b border-green-500/10 hover:bg-green-500/5">
                    <td className="py-3 text-green-500">{worker.name}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${getWorkerStatusColor(worker.status)}`}>
                        {getWorkerStatusIcon(worker.status)}
                        {worker.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{worker.scansCompleted}</td>
                    <td className="py-3">
                      <span className={worker.successRate >= 98 ? 'text-green-500' : 'text-yellow-500'}>
                        {worker.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={worker.uptime >= 99 ? 'text-green-500' : 'text-yellow-500'}>
                        {worker.uptime.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={worker.latency < 100 ? 'text-green-500' : worker.latency < 200 ? 'text-yellow-500' : 'text-red-500'}>
                        {worker.latency}ms
                      </span>
                    </td>
                    <td className="py-3 text-gray-400 text-xs">
                      {worker.lastSeen.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scans Per Hour */}
          <Card className="bg-gray-900 border-green-500/30 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">&gt;</span> SCANS PER HOUR
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981/20" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#10b981"
                  tickFormatter={(date) => new Date(date).toLocaleTimeString()}
                />
                <YAxis stroke="#10b981" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #10b981' }}
                  labelStyle={{ color: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scansPerHour" 
                  stroke="#10b981" 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Average Scan Time */}
          <Card className="bg-gray-900 border-green-500/30 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">&gt;</span> AVERAGE SCAN TIME (seconds)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#10b981/20" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#10b981"
                  tickFormatter={(date) => new Date(date).toLocaleTimeString()}
                />
                <YAxis stroke="#10b981" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #10b981' }}
                  labelStyle={{ color: '#10b981' }}
                />
                <Bar 
                  dataKey="averageTime" 
                  fill="#10b981"
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Job Queue Status */}
        <Card className="bg-gray-900 border-green-500/30 p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-green-500">&gt;</span> JOB QUEUE DISTRIBUTION
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: metrics.pending },
                      { name: 'Running', value: metrics.running },
                      { name: 'Completed', value: metrics.completed },
                      { name: 'Failed', value: metrics.failed },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#10b981"
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    <Cell fill="#eab308" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #10b981' }}
                    labelStyle={{ color: '#10b981' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-black/50 rounded border border-green-500/20">
                <p className="text-xs text-gray-400 mb-1">TOTAL JOBS</p>
                <p className="text-2xl font-bold text-green-500">
                  {metrics.pending + metrics.running + metrics.completed + metrics.failed}
                </p>
              </div>
              <div className="p-3 bg-black/50 rounded border border-green-500/20">
                <p className="text-xs text-gray-400 mb-1">AVERAGE TIME PER SCAN</p>
                <p className="text-2xl font-bold text-green-500">{metrics.averageTime}s</p>
              </div>
              <div className="p-3 bg-black/50 rounded border border-green-500/20">
                <p className="text-xs text-gray-400 mb-1">SUCCESS RATE</p>
                <p className="text-2xl font-bold text-green-500">
                  {((metrics.completed / (metrics.completed + metrics.failed)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* System Logs */}
        <Card className="bg-gray-900 border-green-500/30 p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-green-500">&gt;</span> SYSTEM LOGS
          </h2>
          <div className="bg-black border border-green-500/30 rounded p-4 h-48 overflow-y-auto font-mono text-xs space-y-1">
            <div className="text-green-500">[+] All workers connected and operational</div>
            <div className="text-blue-400">[*] Processing 3 concurrent scans</div>
            <div className="text-green-500">[+] Average response time: 45ms</div>
            <div className="text-blue-400">[*] Database connection stable</div>
            <div className="text-green-500">[+] Last backup completed 2 hours ago</div>
            <div className="text-yellow-500">[!] Worker-04 offline for 1 hour</div>
            <div className="text-blue-400">[*] Monitoring active - no alerts</div>
            <div className="text-green-500">[+] System health: EXCELLENT</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
