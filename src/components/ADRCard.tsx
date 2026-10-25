"use client";

import React from "react";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import Panel from "@/components/ui/Panel";
import Chip from "@/components/ui/Chip";
import type { AdrResponse } from "@/lib/contracts";

interface ADRCardProps {
  adr: AdrResponse | null;
  constraintsUpdated: boolean;
}

export default function ADRCard({ adr, constraintsUpdated }: ADRCardProps) {
  const download = () => {
    if (!adr) return;
    const blob = new Blob([adr.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = adr.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!adr) return null;

  return (
    <Panel
      icon={<FileText className="h-3.5 w-3.5" />}
      title="Decision record"
      subtitle={<span className="font-mono">{adr.path}</span>}
      actions={
        <button
          onClick={download}
          className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Download className="h-3 w-3" />
          .md
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {adr.fileSavedOnDisk ? (
            <Chip tone="emerald">
              <CheckCircle2 className="h-3 w-3" />
              Written to disk
            </Chip>
          ) : (
            <Chip tone="amber">Read-only host</Chip>
          )}
          {constraintsUpdated && <Chip tone="emerald">CONSTRAINTS.md updated</Chip>}
        </div>

        {!adr.fileSavedOnDisk && (
          <p className="text-[11px] leading-relaxed text-slate-500">
            This environment cannot write files, so the record is shown above but not persisted.
          </p>
        )}

        <pre className="max-h-72 overflow-auto rounded-md border border-slate-800 bg-slate-950/60 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
          {adr.content}
        </pre>

        {constraintsUpdated && (
          <p className="text-[11px] leading-relaxed text-slate-400">
            Next AI prompt in this repository inherits this constraint automatically.
          </p>
        )}
      </div>
    </Panel>
  );
}
