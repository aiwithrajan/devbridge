"use client";

import React from "react";
import { FileCode2, Crosshair, Play, Square, GraduationCap, UserCheck, AlertTriangle } from "lucide-react";
import Panel from "@/components/ui/Panel";
import Chip from "@/components/ui/Chip";
import type { ParsedDiff, Severity } from "@/lib/contracts";

const SEVERITY_DOT: Record<Severity, string> = {
  low: "bg-slate-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-red-500",
};

const SEVERITY_TEXT: Record<Severity, string> = {
  low: "text-slate-300",
  medium: "text-amber-300",
  high: "text-orange-300",
  critical: "text-red-300",
};

interface SessionPanelProps {
  diff: ParsedDiff | null;
  sessionId: string | null;
  register: "pro" | "beginner";
  onToggleRegister: () => void;
  audioPlaying: boolean;
  onPlayBriefing: () => void;
  onStopAudio: () => void;
}

export default function SessionPanel({
  diff,
  sessionId,
  register,
  onToggleRegister,
  audioPlaying,
  onPlayBriefing,
  onStopAudio,
}: SessionPanelProps) {
  return (
    <Panel
      icon={<FileCode2 className="h-3.5 w-3.5" />}
      title="Code briefing"
      subtitle={
        <>
          <span className="font-mono">{sessionId ?? "—"}</span>
          {diff ? ` · ${diff.files.length} file${diff.files.length === 1 ? "" : "s"} changed` : " · no build captured"}
        </>
      }
      actions={
        /* Segmented register control */
        <div className="flex items-center rounded-md border border-slate-700 bg-slate-800/50 p-0.5">
          <button
            onClick={() => register !== "pro" && onToggleRegister()}
            aria-pressed={register === "pro"}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              register === "pro" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="h-3 w-3" />
            Pro
          </button>
          <button
            onClick={() => register !== "beginner" && onToggleRegister()}
            aria-pressed={register === "beginner"}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              register === "beginner" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <GraduationCap className="h-3 w-3" />
            Beginner
          </button>
        </div>
      }
    >
      {!diff ? (
        <div className="rounded-lg border border-dashed border-slate-800 px-4 py-8 text-center">
          <p className="text-[13px] text-slate-400">No build captured yet.</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Inspect the working diff with{" "}
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1 font-mono text-[10px]">⌘⇧B</kbd>,
            or run the judge demo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-slate-800 bg-slate-800">
            <div className="bg-slate-900/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Added</div>
              <div className="font-mono text-sm text-emerald-300">+{diff.linesAdded}</div>
            </div>
            <div className="bg-slate-900/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Removed</div>
              <div className="font-mono text-sm text-red-300">−{diff.linesRemoved}</div>
            </div>
            <div className="bg-slate-900/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Severity</div>
              <div className={`flex items-center gap-1.5 text-sm font-medium ${SEVERITY_TEXT[diff.severity]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[diff.severity]}`} />
                {diff.severity}
              </div>
            </div>
          </div>

          {/* Files + anchor */}
          <div className="space-y-1.5">
            {diff.files.map((f) => (
              <div key={f} className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <FileCode2 className="h-3 w-3 shrink-0 text-slate-500" />
                <span className="truncate">{f}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 pt-1">
              <Chip tone="violet" mono>
                <Crosshair className="h-3 w-3" />
                {diff.anchor}
              </Chip>
            </div>
          </div>

          {/* Summary / risk */}
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-slate-500">Summary</div>
              <p className="text-[13px] leading-relaxed text-slate-200">{diff.summary}</p>
            </div>

            <div className="rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-red-400">
                <AlertTriangle className="h-3 w-3" />
                Risk
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-red-100">{diff.risk}</p>
            </div>

            {diff.why_now && (
              <p className="text-[11px] leading-relaxed text-slate-500">
                <span className="text-slate-400">Why now:</span> {diff.why_now}
              </p>
            )}
          </div>

          {/* Audio */}
          <button
            onClick={audioPlaying ? onStopAudio : onPlayBriefing}
            aria-label={audioPlaying ? "Stop briefing audio" : "Play briefing audio"}
            className="flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-[12px] font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {audioPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {audioPlaying ? "Stop audio" : "Play briefing audio"}
          </button>
        </div>
      )}
    </Panel>
  );
}
