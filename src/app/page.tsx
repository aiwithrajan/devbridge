"use client";

import React, { useState, useEffect } from "react";
import PhoneWatchdog from "@/components/PhoneWatchdog";
import ArchitectureGraph, { GraphNode } from "@/components/ArchitectureGraph";
import VoiceCoach from "@/components/VoiceCoach";
import TaskManager, { TaskItem } from "@/components/TaskManager";
import { soundFX } from "@/lib/soundEffects";
import { 
  Shield, 
  Sparkles, 
  Clock, 
  Flame, 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw,
  Radio,
  FileCode2,
  CheckCircle2
} from "lucide-react";

interface DistractionEvent {
  id: string;
  timestamp: string;
  count: number;
}

const INITIAL_GRAPH_NODES: GraphNode[] = [
  {
    id: "node-1",
    title: "1. User /login Route",
    type: "completed",
    description: "Accepts credentials, returns Access & Refresh Token pair with signed secret.",
  },
  {
    id: "node-2",
    title: "2. Token Rotation Handler",
    type: "active",
    description: "Validates incoming refresh token; currently generating in Cursor/Antigravity...",
  },
  {
    id: "node-3",
    title: "3. Revocation Blacklist",
    type: "brainstormed",
    description: "Redis in-memory store with 7-day TTL to block stolen or logged-out tokens.",
  },
];

export default function DevBridgeDashboard() {
  const [distractions, setDistractions] = useState<DistractionEvent[]>([]);
  const [isSprintActive, setIsSprintActive] = useState(true);
  const [sprintSeconds, setSprintSeconds] = useState(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Active Task & Architecture Graph state
  const [activeTask, setActiveTask] = useState<string>("JWT Token Rotation & Refresh Handler");
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>(INITIAL_GRAPH_NODES);
  const [isPhoneDetected, setIsPhoneDetected] = useState(false);

  // Real-time Workspace Watcher State
  const [watcherStatus, setWatcherStatus] = useState<"connecting" | "active" | "error">("connecting");
  const [recentFileChanges, setRecentFileChanges] = useState<{ path: string; type: string; timestamp: number }[]>([]);

  // 15-min countdown timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSprintSeconds((prev) => {
        if (prev <= 1) {
          soundFX.playRestored();
          soundFX.speakAlert("Sprint complete! Great job maintaining focus.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Connect to Workspace File Watcher (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/watcher");

      eventSource.addEventListener("connected", () => {
        setWatcherStatus("active");
      });

      eventSource.addEventListener("file_change", (e) => {
        try {
          const data = JSON.parse(e.data);
          setRecentFileChanges((prev) => [data, ...prev.slice(0, 4)]);
        } catch {
          // parse error
        }
      });

      eventSource.onerror = () => {
        setWatcherStatus("error");
      };
    } catch {
      setWatcherStatus("error");
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handlePhoneDetected = (count: number) => {
    setIsPhoneDetected(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setDistractions((prev) => [
      { id: Date.now().toString(), timestamp: timeStr, count },
      ...prev.slice(0, 9),
    ]);
  };

  const handlePhoneCleared = () => {
    setIsPhoneDetected(false);
  };

  // When a spoken decision is confirmed in VoiceCoach, dynamically add it to the architecture graph!
  const handleDecisionMade = (newDecisionNodeTitle: string) => {
    setGraphNodes((prev) => [
      ...prev,
      {
        id: `node-${Date.now()}`,
        title: `${prev.length + 1}. ${newDecisionNodeTitle}`,
        type: "brainstormed",
        description: "Agreed in Spoken Brainstorming session via Wispr Flow.",
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">DevBridge</h1>
                <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                  VoiceAnchor
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  v1.0 Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                WeMakeDevs × Wispr Flow • Track 1: Builders
              </p>
            </div>
          </div>

          {/* Center Sprint Timer */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-1.5 shadow-inner">
            <Clock className="h-4 w-4 text-indigo-400 animate-pulse" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-slate-400 uppercase font-mono">Sprint:</span>
              <span className="font-mono text-base font-bold text-white tracking-wider">
                {formatTimer(sprintSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-2">
              <button
                onClick={() => setIsTimerRunning((v) => !v)}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title={isTimerRunning ? "Pause timer" : "Resume timer"}
              >
                {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setSprintSeconds(15 * 60)}
                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Reset to 15m"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* IDE Watcher Status & Test Sound */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
              <Radio className={`h-3 w-3 ${watcherStatus === "active" ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
              <span className="font-mono text-[11px]">
                {watcherStatus === "active" ? "Cursor / IDE Sync: Connected" : "Watcher: Connecting"}
              </span>
            </div>

            <button
              onClick={() => {
                soundFX.playAlert();
                soundFX.speakAlert("फोन नीचे रखो! कोड पर ध्यान दो।", "hi");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Test Audio (Lekha)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Top Full Width: Live Visual Architecture Graph */}
        <ArchitectureGraph nodes={graphNodes} activeTaskTitle={activeTask} />

        {/* 2-Column Split View: Voice Coach vs Vision Sentry & Multi-Task Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Voice Coach & Brainstorming Hub (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <VoiceCoach
              activeTaskTitle={activeTask}
              isPhoneDetected={isPhoneDetected}
              onDecisionMade={handleDecisionMade}
            />

            {/* Live IDE File Changes Feed */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    IDE Active File Stream (Cursor / Antigravity)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Live
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {recentFileChanges.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2 italic text-center">
                    Waiting for code edits in project directory...
                  </p>
                ) : (
                  recentFileChanges.map((change, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-xs font-mono"
                    >
                      <span className="text-slate-300 truncate max-w-[260px]">{change.path}</span>
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 uppercase">
                        {change.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Vision Sentry & Multi-Task Manager (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Phone Watchdog (Vision Sentry) */}
            <PhoneWatchdog
              isActive={isSprintActive}
              onPhoneDetected={handlePhoneDetected}
              onPhoneCleared={handlePhoneCleared}
            />

            {/* Voice Multi-Task Manager */}
            <TaskManager
              activeTaskId="task-1"
              onActiveTaskChange={(task: TaskItem) => {
                setActiveTask(task.title);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
