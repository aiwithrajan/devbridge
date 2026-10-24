"use client";

import React from "react";
import { CheckCircle2, ArrowRight, Sparkles, Layers, Database, ShieldCheck, Cpu } from "lucide-react";

export interface GraphNode {
  id: string;
  title: string;
  type: "completed" | "active" | "brainstormed" | "pending";
  description: string;
  icon?: string;
}

interface ArchitectureGraphProps {
  nodes: GraphNode[];
  activeTaskTitle?: string;
}

export default function ArchitectureGraph({ nodes, activeTaskTitle = "Authentication Flow" }: ArchitectureGraphProps) {
  const getIcon = (type: GraphNode["type"]) => {
    switch (type) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "active":
        return <Cpu className="h-4 w-4 text-indigo-400 animate-spin" />;
      case "brainstormed":
        return <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />;
      default:
        return <Layers className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Live Architecture & Workflow Graph
            </h3>
            <p className="text-[11px] text-slate-400">
              Active Task: <span className="text-indigo-400 font-semibold">{activeTaskTitle}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Done
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" /> Building
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Brainstormed
          </span>
        </div>
      </div>

      {/* Nodes Pipeline */}
      <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 overflow-x-auto py-2">
        {nodes.map((node, index) => {
          const isCompleted = node.type === "completed";
          const isActive = node.type === "active";
          const isBrainstormed = node.type === "brainstormed";

          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div
                className={`relative flex-1 min-w-[180px] w-full rounded-xl border p-3.5 transition-all duration-300 ${
                  isActive
                    ? "border-indigo-500 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50"
                    : isCompleted
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : isBrainstormed
                    ? "border-purple-500/40 bg-purple-950/20 border-dashed"
                    : "border-slate-800 bg-slate-900/40 opacity-60"
                }`}
              >
                {/* Step indicator */}
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="text-slate-500 uppercase">Step {index + 1}</span>
                  {getIcon(node.type)}
                </div>

                {/* Title */}
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  <span>{node.title}</span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {node.description}
                </p>

                {/* Status Badge */}
                <div className="mt-2.5 flex items-center justify-between">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : isCompleted
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : isBrainstormed
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {node.type}
                  </span>

                  {isBrainstormed && (
                    <span className="text-[10px] font-mono text-purple-400 flex items-center gap-0.5">
                      <Sparkles className="h-3 w-3" /> Wispr Decision
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Arrow */}
              {index < nodes.length - 1 && (
                <div className="hidden md:flex text-slate-600 px-1">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
