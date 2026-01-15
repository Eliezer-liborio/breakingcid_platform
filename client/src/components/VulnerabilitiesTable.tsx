import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronDown, Filter } from 'lucide-react';

interface Vulnerability {
  id: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence?: string;
  parameter?: string;
  payload?: string;
  response?: string;
  timestamp: Date;
}

interface VulnerabilitiesTableProps {
  vulnerabilities: Vulnerability[];
  isLoading?: boolean;
}

export function VulnerabilitiesTable({ vulnerabilities, isLoading = false }: VulnerabilitiesTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

  const getSeverityColor = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getSeverityIcon = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
    }
  };

  const filteredVulnerabilities = filterSeverity
    ? vulnerabilities.filter(v => v.severity === filterSeverity)
    : vulnerabilities;

  const severityCounts = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-green-500/30 p-6">
        <div className="text-center text-gray-400">
          <p>Loading vulnerabilities...</p>
        </div>
      </Card>
    );
  }

  if (vulnerabilities.length === 0) {
    return (
      <Card className="bg-gray-900 border-green-500/30 p-6">
        <div className="text-center text-gray-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No vulnerabilities found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-green-500/30 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="text-green-500">&gt;</span> VULNERABILITIES FOUND
          </h2>
          <span className="text-sm text-gray-400">
            Total: <span className="text-green-500 font-bold">{vulnerabilities.length}</span>
          </span>
        </div>

        {/* Severity Summary */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setFilterSeverity(filterSeverity === 'critical' ? null : 'critical')}
            className={`p-2 rounded text-xs font-mono ${
              filterSeverity === 'critical'
                ? 'bg-red-500/30 border border-red-500 text-red-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
            }`}
          >
            🔴 Critical: {severityCounts.critical}
          </button>
          <button
            onClick={() => setFilterSeverity(filterSeverity === 'high' ? null : 'high')}
            className={`p-2 rounded text-xs font-mono ${
              filterSeverity === 'high'
                ? 'bg-orange-500/30 border border-orange-500 text-orange-400'
                : 'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
            }`}
          >
            🟠 High: {severityCounts.high}
          </button>
          <button
            onClick={() => setFilterSeverity(filterSeverity === 'medium' ? null : 'medium')}
            className={`p-2 rounded text-xs font-mono ${
              filterSeverity === 'medium'
                ? 'bg-yellow-500/30 border border-yellow-500 text-yellow-400'
                : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
            }`}
          >
            🟡 Medium: {severityCounts.medium}
          </button>
          <button
            onClick={() => setFilterSeverity(filterSeverity === 'low' ? null : 'low')}
            className={`p-2 rounded text-xs font-mono ${
              filterSeverity === 'low'
                ? 'bg-blue-500/30 border border-blue-500 text-blue-400'
                : 'bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
            }`}
          >
            🔵 Low: {severityCounts.low}
          </button>
        </div>

        {/* Vulnerabilities List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredVulnerabilities.map((vuln) => (
            <div key={vuln.id} className="border border-green-500/20 rounded overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === vuln.id ? null : vuln.id)}
                className="w-full p-3 hover:bg-green-500/5 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-xl">{getSeverityIcon(vuln.severity)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-mono font-bold text-green-400">{vuln.title}</p>
                    <p className="text-xs text-gray-400">{vuln.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-mono border ${getSeverityColor(vuln.severity)}`}>
                    {vuln.severity.toUpperCase()}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition ${expandedId === vuln.id ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded Details */}
              {expandedId === vuln.id && (
                <div className="bg-black/50 p-4 border-t border-green-500/20 space-y-3 text-xs font-mono">
                  {vuln.description && (
                    <div>
                      <p className="text-gray-400 mb-1">Description:</p>
                      <p className="text-green-400 ml-2">{vuln.description}</p>
                    </div>
                  )}

                  {vuln.parameter && (
                    <div>
                      <p className="text-gray-400 mb-1">Parameter:</p>
                      <p className="text-blue-400 ml-2 break-all">{vuln.parameter}</p>
                    </div>
                  )}

                  {vuln.payload && (
                    <div>
                      <p className="text-gray-400 mb-1">Payload:</p>
                      <div className="bg-black p-2 rounded border border-green-500/20 ml-2 overflow-x-auto">
                        <p className="text-yellow-400 break-all">{vuln.payload}</p>
                      </div>
                    </div>
                  )}

                  {vuln.evidence && (
                    <div>
                      <p className="text-gray-400 mb-1">Evidence:</p>
                      <div className="bg-black p-2 rounded border border-green-500/20 ml-2 overflow-x-auto max-h-32">
                        <p className="text-cyan-400 whitespace-pre-wrap break-all text-xs">{vuln.evidence}</p>
                      </div>
                    </div>
                  )}

                  {vuln.response && (
                    <div>
                      <p className="text-gray-400 mb-1">Response:</p>
                      <div className="bg-black p-2 rounded border border-green-500/20 ml-2 overflow-x-auto max-h-32">
                        <p className="text-purple-400 whitespace-pre-wrap break-all text-xs">{vuln.response}</p>
                      </div>
                    </div>
                  )}

                  <div className="text-gray-500 pt-2 border-t border-green-500/10">
                    Found at: {new Date(vuln.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filterSeverity && (
          <div className="text-xs text-gray-400 text-center">
            Showing {filteredVulnerabilities.length} of {vulnerabilities.length} vulnerabilities
          </div>
        )}
      </div>
    </Card>
  );
}
