import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { exportToPDF, exportToJSON, exportToCSV, exportToXML } from "@/lib/multiFormatReportExporter";

export default function CombinedReports() {
  const [, setLocation] = useLocation();
  const [selectedScans, setSelectedScans] = useState<number[]>([]);
  const [exportFormat, setExportFormat] = useState<'txt' | 'pdf' | 'json' | 'csv' | 'xml'>('pdf');

  const { data: scans, isLoading } = trpc.scans.list.useQuery();

  const handleSelectScan = (scanId: number) => {
    setSelectedScans(prev =>
      prev.includes(scanId)
        ? prev.filter(id => id !== scanId)
        : [...prev, scanId]
    );
  };

  const handleSelectAll = () => {
    if (selectedScans.length === scans?.length) {
      setSelectedScans([]);
    } else {
      setSelectedScans(scans?.map(s => s.id) || []);
    }
  };

  const handleGenerateCombinedReport = async () => {
    if (selectedScans.length === 0) {
      toast.error("Please select at least one scan");
      return;
    }

    try {
      // Fetch data for all selected scans
      const scanDataPromises = selectedScans.map(scanId =>
        trpc.scans.get.useQuery({ id: scanId }).data
      );

      const allScanData = scanDataPromises.filter((data): data is any => data !== undefined);

      // Combine all vulnerabilities
      const combinedVulnerabilities = allScanData.flatMap(data => data.vulnerabilities);

      // Create combined report data
      const combinedReportData = {
        scanId: 0, // Combined report
        target: `Combined Report (${selectedScans.length} scans)`,
        scanType: 'combined',
        status: 'completed',
        createdAt: new Date(),
        duration: null,
        vulnerabilities: combinedVulnerabilities,
      };

      const timestamp = Date.now();
      const filename = `breakingcid_combined_report_${timestamp}`;

      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(combinedReportData, `${filename}.pdf`);
          break;
        case 'json':
          exportToJSON(combinedReportData, `${filename}.json`);
          break;
        case 'csv':
          exportToCSV(combinedReportData, `${filename}.csv`);
          break;
        case 'xml':
          exportToXML(combinedReportData, `${filename}.xml`);
          break;
      }

      toast.success(`Combined report generated (${exportFormat.toUpperCase()})`);
    } catch (error) {
      toast.error("Failed to generate combined report");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="border-green-500/30 text-green-500 hover:bg-green-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> BACK
          </Button>
          <h1 className="text-2xl font-bold">COMBINED REPORTS</h1>
        </div>
        <div className="h-px bg-green-500/30"></div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 border-green-500/30 p-6 sticky top-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">&gt;</span> EXPORT OPTIONS
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">FORMAT:</p>
                <div className="space-y-2">
                  {(['pdf', 'json', 'csv', 'xml'] as const).map(format => (
                    <label key={format} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={exportFormat === format}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{format.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-green-500/30">
                <p className="text-xs text-gray-400 mb-2">
                  SELECTED: {selectedScans.length} / {scans?.length || 0}
                </p>
                <Button
                  onClick={handleGenerateCombinedReport}
                  disabled={selectedScans.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-black font-bold disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" /> GENERATE REPORT
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Scans List */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-green-500/30 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">&gt;</span> SELECT SCANS
            </h2>

            {isLoading ? (
              <div className="text-gray-400">Loading scans...</div>
            ) : !scans || scans.length === 0 ? (
              <div className="text-gray-400">No scans available</div>
            ) : (
              <div className="space-y-2">
                {/* Select All */}
                <div className="p-3 bg-gray-800/50 border border-green-500/20 rounded flex items-center gap-3 hover:bg-gray-800 transition-colors">
                  <Checkbox
                    checked={selectedScans.length === scans.length}
                    onCheckedChange={handleSelectAll}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-bold">SELECT ALL ({scans.length})</span>
                </div>

                {/* Individual Scans */}
                {scans.map(scan => (
                  <div
                    key={scan.id}
                    onClick={() => handleSelectScan(scan.id)}
                    className="p-3 bg-gray-800/50 border border-green-500/20 rounded flex items-center gap-3 hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedScans.includes(scan.id)}
                      onCheckedChange={() => handleSelectScan(scan.id)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-mono font-bold">
                          Scan #{scan.id}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          scan.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          scan.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {scan.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Target: {scan.target}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {scan.scanType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
