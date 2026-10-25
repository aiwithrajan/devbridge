"use client";

import React from "react";
import { Clock } from "lucide-react";
import Panel from "@/components/ui/Panel";
import type { SessionRecord, SessionStatus } from "@/lib/contracts";

const STATUS: Record<SessionStatus, { label: string; dot: string; text: string }> = {
  idle: { label: "Idle", dot: "bg-slate-500", text: "text-slate-400" },
  building: { label: "Building", dot: "bg-indigo-400 animate-pulse", text: "text-indigo-300" },
  briefing: { label: "Briefing", dot: "bg-violet-400", text: "text-violet-300" },
  question: { label: "Awaiting answer", dot: "bg-amber-400", text: "text-amber-300" },
  answered: { label: "Answered", dot: "bg-emerald-400", text: "text-emerald-300" },
  skipped: { label: "Skipped", dot: "bg-slate-600", text: "text-slate-500" },
  error: { label: "Error", dot: "bg-red-500", text: "text-red-300" },
};

interface SessionTimelineProps {
  sessions: SessionRecord[];
}

export default function SessionTimeline({ sessions }: SessionTimelineProps) {
  const ordered = [...sessions].reverse();
  return (
    <Panel
      icon={<Clock className="h-3.5 w-3.5" />}
      title="Session timeline"
      subtitle={`${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
    >
      {ordered.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-slate-500">
          No sessions recorded yet.
        </p>
      ) : (
        <ol className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {ordered.map((s) => {
            const meta = STATUS[s.status];
            return (
              <li
                key={s.id}
                className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                  <span className={`text-[11px] font-medium ${meta.text}`}>{meta.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-slate-500">
                    {new Date(s.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[10px] text-slate-500">
                  {s.files.join(", ") || "—"}
                  {s.linesAdded > 0 && ` · +${s.linesAdded}/−${s.linesRemoved}`}
                </p>
                {s.decision && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-300">
                    {s.decision}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
