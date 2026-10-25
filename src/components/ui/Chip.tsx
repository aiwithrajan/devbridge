import React from "react";

export type ChipTone = "neutral" | "indigo" | "emerald" | "amber" | "red" | "violet";

const TONES: Record<ChipTone, string> = {
  neutral: "border-slate-700 bg-slate-800/60 text-slate-300",
  indigo: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
  emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  red: "border-red-500/40 bg-red-500/10 text-red-300",
  violet: "border-violet-500/40 bg-violet-500/10 text-violet-300",
};

interface ChipProps {
  tone?: ChipTone;
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}

export default function Chip({ tone = "neutral", children, className = "", mono = false }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${TONES[tone]} ${
        mono ? "font-mono" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}
