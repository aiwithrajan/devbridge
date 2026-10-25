"use client";

import React from "react";
import { Activity } from "lucide-react";
import Panel from "@/components/ui/Panel";
import type { Telemetry } from "@/lib/contracts";

interface TelemetryPanelProps {
  telemetry: Telemetry;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="bg-slate-900/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className={`mt-0.5 font-mono text-sm ${tone}`}>{value}</div>
    </div>
  );
}

export default function TelemetryPanel({ telemetry }: TelemetryPanelProps) {
  const captureRate =
    telemetry.sessionsSeen > 0
      ? Math.round((telemetry.decisionsCaptured / telemetry.sessionsSeen) * 100)
      : 0;

  return (
    <Panel
      icon={<Activity className="h-3.5 w-3.5" />}
      title="Telemetry"
      subtitle="Local session log — nothing leaves this machine"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-800 bg-slate-800 sm:grid-cols-4">
          <Metric
            label="Wait repurposed"
            value={`${(telemetry.waitMsSaved / 1000).toFixed(0)}s`}
            tone="text-emerald-300"
          />
          <Metric
            label="Captured"
            value={`${telemetry.decisionsCaptured}/${telemetry.sessionsSeen}`}
            tone="text-indigo-300"
          />
          <Metric label="Capture rate" value={`${captureRate}%`} tone="text-slate-200" />
          <Metric
            label="Avg latency"
            value={`${telemetry.avgDecisionLatencyMs}ms`}
            tone="text-slate-200"
          />
        </div>

        <div>
          <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-slate-500">
            metrics.jsonl
          </div>
          <pre className="max-h-32 overflow-auto rounded-md border border-slate-800 bg-slate-950/60 p-3 font-mono text-[10px] leading-relaxed text-slate-400">
            {telemetry.rawMetrics.length > 0
              ? telemetry.rawMetrics.join("\n")
              : "// no sessions recorded yet"}
          </pre>
        </div>
      </div>
    </Panel>
  );
}
