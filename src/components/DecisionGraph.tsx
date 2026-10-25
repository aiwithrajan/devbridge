"use client";

import React from "react";
import { GitCommitVertical } from "lucide-react";
import Panel from "@/components/ui/Panel";
import type { DecisionNode } from "@/lib/contracts";

interface DecisionGraphProps {
  decisions: DecisionNode[];
}

export default function DecisionGraph({ decisions }: DecisionGraphProps) {
  return (
    <Panel
      icon={<GitCommitVertical className="h-3.5 w-3.5" />}
      title="Decision graph"
      subtitle="code → decision → record"
    >
      {decisions.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-slate-500">
          Captured decisions appear here as a live map.
        </p>
      ) : (
        <ol className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
          {decisions.map((d) => (
            <li key={d.id} className="flex flex-col gap-1.5">
              <div className="rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2">
                <div className="truncate font-mono text-[11px] text-slate-300">{d.file}</div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{d.anchor}</div>
              </div>

              <div className="ml-2 border-l border-slate-700 pl-3">
                <p className="line-clamp-2 text-[11px] leading-snug text-slate-400">{d.question}</p>
                <p className="mt-1 text-[12px] font-medium leading-snug text-violet-200">{d.decision}</p>
              </div>

              <div className="ml-2 rounded-md border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5">
                <span className="block truncate font-mono text-[10px] text-emerald-300">{d.adrPath}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
