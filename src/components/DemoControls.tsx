"use client";

import React from "react";
import { Play, Keyboard } from "lucide-react";
import Panel from "@/components/ui/Panel";
import Chip from "@/components/ui/Chip";

interface WatcherChange {
  path: string;
  type: string;
  timestamp: number;
}

interface DemoControlsProps {
  onInspect: () => void;
  onRunDemo: () => void;
  demoRunning: boolean;
  watcherStatus: "connecting" | "active" | "error";
  recentChanges: WatcherChange[];
  demoMode: boolean;
}

export default function DemoControls({
  onInspect,
  onRunDemo,
  demoRunning,
  watcherStatus,
  recentChanges,
  demoMode,
}: DemoControlsProps) {
  return (
    <Panel
      icon={<Play className="h-3.5 w-3.5" />}
      title="Triggers"
      subtitle="Inspect a build or run the scripted demo"
      actions={
        watcherStatus === "active" ? (
          <Chip tone="emerald">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            IDE sync live
          </Chip>
        ) : (
          <Chip tone="amber">IDE sync idle</Chip>
        )
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onInspect}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-[12px] font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Keyboard className="h-3.5 w-3.5" />
            Inspect working diff
            <kbd className="rounded border border-slate-600 bg-slate-900 px-1 font-mono text-[10px]">⌘⇧B</kbd>
          </button>
          <button
            onClick={onRunDemo}
            disabled={demoRunning}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Play className="h-3.5 w-3.5" />
            {demoRunning ? "Running demo…" : "Run judge demo"}
          </button>
        </div>

        {demoMode && (
          <p className="rounded-md border border-indigo-500/25 bg-indigo-500/5 px-3 py-2 text-[11px] leading-relaxed text-indigo-200">
            Demo mode — scripted session, no API key or repository required.
          </p>
        )}

        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-[0.08em] text-slate-500">
            Live file stream
          </div>
          {recentChanges.length === 0 ? (
            <p className="text-[11px] text-slate-500">Waiting for edits in the workspace…</p>
          ) : (
            <ul className="flex max-h-28 flex-col gap-1 overflow-y-auto pr-1">
              {recentChanges.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/50 px-2 py-1"
                >
                  <span className="truncate font-mono text-[10px] text-slate-300">{c.path}</span>
                  <span className="shrink-0 font-mono text-[9px] uppercase text-slate-500">{c.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
