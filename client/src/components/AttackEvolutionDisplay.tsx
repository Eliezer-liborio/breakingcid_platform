import { AttackPhase, AttackEvolution } from "@/lib/attackEvolution";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface AttackEvolutionDisplayProps {
  evolution: AttackEvolution;
}

export function AttackEvolutionDisplay({ evolution }: AttackEvolutionDisplayProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const getPhaseIcon = (status: AttackPhase['status']) => {
    switch (status) {
      case 'pending':
        return '⊙';
      case 'running':
        return '◐';
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
    }
  };

  const getPhaseColor = (status: AttackPhase['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-yellow-500 animate-pulse';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
    }
  };

  const getProgressBarColor = (status: AttackPhase['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-700';
      case 'running':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-2">
      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-mono text-green-500">OVERALL PROGRESS</span>
          <span className="text-sm font-mono text-green-500">{evolution.totalProgress}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded h-2 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${evolution.totalProgress}%` }}
          />
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-1">
        {evolution.phases.map((phase, index) => (
          <div key={phase.id} className="border border-green-500/20 rounded bg-gray-950">
            <button
              onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              className="w-full p-3 hover:bg-green-500/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg ${getPhaseColor(phase.status)}`}>
                  {getPhaseIcon(phase.status)}
                </span>

                {expandedPhase === phase.id ? (
                  <ChevronDown className="w-4 h-4 text-green-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-green-500" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-sm font-bold text-green-500">
                      {phase.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {phase.progress}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    {phase.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 ml-7 w-full bg-gray-800 rounded h-1.5 overflow-hidden">
                <div
                  className={`${getProgressBarColor(phase.status)} h-full transition-all duration-300`}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </button>

            {/* Expanded Details */}
            {expandedPhase === phase.id && phase.details.length > 0 && (
              <div className="border-t border-green-500/10 bg-gray-900/50 p-3 space-y-1">
                {phase.details.map((detail, idx) => (
                  <div key={idx} className="text-xs font-mono text-green-400/70 pl-7">
                    <span className="text-green-500">&gt;</span> {detail}
                  </div>
                ))}
              </div>
            )}

            {/* Timing Info */}
            {(phase.startTime || phase.endTime) && (
              <div className="border-t border-green-500/10 px-3 py-2 bg-gray-900/30 text-xs font-mono text-gray-500">
                {phase.startTime && (
                  <span>
                    Started: {phase.startTime.toLocaleTimeString()}
                    {phase.endTime && (
                      <span className="ml-4">
                        Duration: {Math.round((phase.endTime.getTime() - phase.startTime.getTime()) / 1000)}s
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Time Estimate */}
      {evolution.estimatedTimeRemaining && evolution.estimatedTimeRemaining > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs font-mono text-yellow-400">
          <span className="text-yellow-500">[*]</span> Estimated time remaining: ~{Math.ceil(evolution.estimatedTimeRemaining / 60)}m
        </div>
      )}
    </div>
  );
}
