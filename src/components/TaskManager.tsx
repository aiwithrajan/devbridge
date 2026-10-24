"use client";

import React, { useState } from "react";
import { ListTodo, Plus, CheckCircle2, Clock, Play, Mic, Sparkles, Trash2, ArrowUpRight } from "lucide-react";
import { soundFX } from "@/lib/soundEffects";

export interface TaskItem {
  id: string;
  title: string;
  status: "active" | "queued" | "completed";
  category: "backend" | "frontend" | "security" | "devops";
  estimatedMinutes: number;
  notes?: string;
  filesTouched?: string[];
}

interface TaskManagerProps {
  onActiveTaskChange?: (task: TaskItem) => void;
  activeTaskId?: string;
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "task-1",
    title: "JWT Token Rotation & Refresh Handler",
    status: "active",
    category: "security",
    estimatedMinutes: 15,
    notes: "Decided in brainstorm: Redis blacklist with 7-day TTL",
    filesTouched: ["src/auth/jwt.ts", "src/auth/refresh.ts"],
  },
  {
    id: "task-2",
    title: "Setup Redis Docker Container & Env",
    status: "queued",
    category: "devops",
    estimatedMinutes: 10,
    notes: "Queued via Wispr voice command",
    filesTouched: ["docker-compose.yml", ".env.local"],
  },
  {
    id: "task-3",
    title: "Axios 401 Auto-Retry Interceptor",
    status: "queued",
    category: "frontend",
    estimatedMinutes: 15,
    notes: "Client-side token refreshing without user logout",
    filesTouched: ["src/lib/axiosClient.ts"],
  },
];

export default function TaskManager({ onActiveTaskChange, activeTaskId = "task-1" }: TaskManagerProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [isVoiceAdding, setIsVoiceAdding] = useState(false);

  // Add task (either manual or spoken)
  const handleAddTask = (titleToAdd?: string) => {
    const title = titleToAdd || newTaskInput;
    if (!title.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      status: "queued",
      category: "backend",
      estimatedMinutes: 15,
      notes: "Added via Voice Multi-Task Manager",
      filesTouched: [],
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskInput("");
    soundFX.playRestored();
    soundFX.speakAlert(`Task added: ${newTask.title}`);
  };

  // Switch active task
  const handleSwitchActive = (task: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        status: t.id === task.id ? "active" : t.status === "active" ? "queued" : t.status,
      }))
    );

    if (onActiveTaskChange) {
      onActiveTaskChange(task);
    }

    soundFX.speakAlert(`Switched active context to: ${task.title}`);
  };

  // Mark task as completed
  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "completed" } : t))
    );
    soundFX.playRestored();
    soundFX.speakAlert("Task marked complete! Great progress.");
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ListTodo className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Voice Multi-Task Manager
            </h3>
            <p className="text-[11px] text-slate-400">
              Context Memory & Hands-Free Task Switching
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono rounded-full bg-slate-800 px-2.5 py-0.5 text-slate-300">
          {tasks.filter((t) => t.status === "completed").length}/{tasks.length} Completed
        </span>
      </div>

      {/* Task Input (Type or Wispr Dictate) */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddTask();
          }}
          placeholder="Speak or type: 'Logout route pe Redis blacklist call karna'..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <button
          onClick={() => handleAddTask()}
          disabled={!newTaskInput.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shrink-0 transition-colors"
          title="Add Task"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {tasks.map((task) => {
          const isActive = task.status === "active";
          const isCompleted = task.status === "completed";

          return (
            <div
              key={task.id}
              className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-all ${
                isActive
                  ? "border-indigo-500/60 bg-indigo-950/20 ring-1 ring-indigo-500/30"
                  : isCompleted
                  ? "border-emerald-500/30 bg-emerald-950/10 opacity-70"
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                    isCompleted
                      ? "border-emerald-400 bg-emerald-500 text-slate-950"
                      : "border-slate-600 hover:border-emerald-400"
                  }`}
                  title={isCompleted ? "Completed" : "Mark as complete"}
                >
                  {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isCompleted ? "line-through text-slate-500" : "text-slate-100"
                      }`}
                    >
                      {task.title}
                    </span>
                    {isActive && (
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-300 font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {task.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!isActive && !isCompleted && (
                  <button
                    onClick={() => handleSwitchActive(task)}
                    className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 px-2 py-1 text-[10px] font-semibold transition-colors"
                  >
                    <Play className="h-3 w-3" />
                    <span>Switch</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
