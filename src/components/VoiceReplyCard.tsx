"use client";

import React from "react";
import { Play, Square, ShieldCheck } from "lucide-react";
import Panel from "@/components/ui/Panel";

interface VoiceReplyCardProps {
  text: string | null;
  playing: boolean;
  onReplay: () => void;
  onStop: () => void;
}

export default function VoiceReplyCard({ text, playing, onReplay, onStop }: VoiceReplyCardProps) {
  if (!text) return null;
  return (
    <Panel
      icon={<ShieldCheck className="h-3.5 w-3.5" />}
      title="Confirmation"
      subtitle="Decision recorded and spoken back"
      actions={
        <button
          onClick={playing ? onStop : onReplay}
          aria-label={playing ? "Stop confirmation audio" : "Replay confirmation audio"}
          className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {playing ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {playing ? "Stop" : "Replay"}
        </button>
      }
    >
      <p className="text-[13px] leading-relaxed text-slate-200">{text}</p>
    </Panel>
  );
}
