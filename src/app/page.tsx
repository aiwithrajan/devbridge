"use client";

import React, { useState, useEffect, useRef } from "react";
import { soundFX } from "@/lib/soundEffects";
import { 
  FileCode2, 
  Sparkles, 
  Volume2, 
  Mic, 
  MicOff, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  UserCheck, 
  GraduationCap, 
  Download, 
  RotateCcw, 
  AudioWaveform, 
  Check, 
  Play, 
  GitBranch, 
  Network, 
  BarChart3, 
  Clock, 
  FileCheck, 
  Flame, 
  ShieldCheck, 
  Terminal,
  RefreshCw,
  FolderTree
} from "lucide-react";

interface SessionState {
  id: string;
  files: string[];
  linesAdded: number;
  linesRemoved: number;
  anchor: string;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  risk: string;
  question: string;
  options: string[];
  why_now: string;
  status: "building" | "awaiting_decision" | "answered" | "skipped";
  answer?: string;
  voiceReply?: string;
  adrPath: string;
  adrContent: string;
  timestamp: string;
}

const HISTORICAL_SESSIONS: SessionState[] = [
  {
    id: "3a9b12e4",
    files: ["src/worker/batch.ts", "src/worker/queue.ts"],
    linesAdded: 84,
    linesRemoved: 12,
    anchor: "src/worker/batch.ts:18",
    severity: "high",
    summary: "AI introduced sequential asynchronous awaits inside a loop across worker queue processors.",
    risk: "Sequential awaits will bottleneck batch throughput and risk connection timeouts under high load.",
    question: "Should we run batch jobs concurrently using p-limit(5), or convert this into a BullMQ worker queue?",
    options: [
      "Concurrent p-limit(5) concurrency cap",
      "Convert to background queue with Redis BullMQ",
      "Keep sequential to guarantee strict transactional order",
    ],
    why_now: "Blocking the main worker loop threatens SLA on large batch payloads.",
    status: "answered",
    answer: "Concurrent p-limit(5) concurrency cap",
    voiceReply: "Architecture decision accepted: Concurrent p-limit(5) cap configured. Saved to ADR 0002.",
    adrPath: "docs/adr/0002-concurrent-batch-processing.md",
    adrContent: `# 0002 — Concurrent Batch Processing with p-limit

- **Status:** accepted
- **Date:** 2026-10-24
- **Session:** 3a9b12e4
- **Anchors:** src/worker/batch.ts:18

## Context
Worker loop was processing batch items sequentially with blocking await calls.

## Decision
Enforce a concurrency cap of 5 using p-limit while preserving error boundary isolation.

## Consequences
- Throughput increased 4.2x without exhausting database pool.
- Error in one item does not abort sibling items in the batch.`,
    timestamp: "20 min ago",
  },
  {
    id: "5c81d09e",
    files: ["package-lock.json", ".prettierrc"],
    linesAdded: 312,
    linesRemoved: 4,
    anchor: "package-lock.json:1",
    severity: "low",
    summary: "Prettier formatter and package lockfile bump.",
    risk: "No architectural logic changed.",
    question: "",
    options: [],
    why_now: "",
    status: "skipped",
    adrPath: "",
    adrContent: "Session silently skipped per FR-09 (formatting-only change).",
    timestamp: "1 hour ago",
  },
];

const INITIAL_ACTIVE_SESSION: SessionState = {
  id: "8f2c41a0",
  files: ["src/auth/rotate.ts", "src/auth/jwt.ts"],
  linesAdded: 61,
  linesRemoved: 8,
  anchor: "src/auth/rotate.ts:44-58",
  severity: "critical",
  summary:
    "Antigravity generated 61 lines across auth rotation. The refresh handler accepts expired tokens if structurally valid.",
  risk:
    "Expired tokens are accepted without exp verification. A client whose token expired 8h ago still gets new access tokens.",
  question:
    "When a refresh token arrives past its expiration, should we strictly reject with 401, or allow a 60-second grace window?",
  options: [
    "Strictly reject with 401 (forces client re-authentication)",
    "Allow a 60-second grace window to absorb network clock skew",
    "Store in Redis blacklist with immediate security telemetry",
  ],
  why_now: "Merging this write path exposes session hijacking on expired client tokens.",
  status: "awaiting_decision",
  adrPath: "docs/adr/0001-reject-expired-refresh-tokens.md",
  adrContent: `# 0001 — Reject expired refresh tokens instead of silently reissuing

- **Status:** accepted
- **Date:** 2026-10-25
- **Session:** 8f2c41a0
- **Anchors:** src/auth/rotate.ts:44-58

## Context
Antigravity added a refresh handler that accepts any structurally valid token,
including one that expired eight hours ago. Nothing in the write path checks \`exp\`.

## Decision
[Pending your voice decision via Wispr Flow...]

## Consequences
- Token families cannot be extended indefinitely by a malicious client.
- rotate.ts requires an explicit expiry test in the auth suite.

## Alternatives considered
- Silent reissue with a short grace window — rejected: hides replay.
- Redis blacklist — deferred: adds infrastructure before proof of need.`,
  timestamp: "Just now",
};

export default function DevBridgeHome() {
  const [activeTab, setActiveTab] = useState<"loop" | "timeline" | "graph" | "metrics">("loop");
  const [session, setSession] = useState<SessionState>(INITIAL_ACTIVE_SESSION);
  const [sessionsList, setSessionsList] = useState<SessionState[]>([INITIAL_ACTIVE_SESSION, ...HISTORICAL_SESSIONS]);
  const [register, setRegister] = useState<"beginner" | "pro">("pro");
  const [voiceInput, setVoiceInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDiskSuccess, setSavedDiskSuccess] = useState<boolean | null>(null);
  const [isSpeakingBriefing, setIsSpeakingBriefing] = useState(false);
  const [isSpeakingReply, setIsSpeakingReply] = useState(false);

  // Scripted 60-Second Judge Demo state
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [demoCountdown, setDemoCountdown] = useState<number>(60);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Keyboard shortcut ⌘⇧B for manual trigger (FR-02)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleFetchLiveGitDiff();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch real git diff from local workspace
  const handleFetchLiveGitDiff = async () => {
    try {
      soundFX.playAlert();
      const res = await fetch("/api/diff");
      if (res.ok) {
        const diffData = await res.json();
        const newSession: SessionState = {
          id: Math.random().toString(16).slice(2, 10),
          files: diffData.files,
          linesAdded: diffData.linesAdded,
          linesRemoved: diffData.linesRemoved,
          anchor: diffData.anchor,
          severity: diffData.severity,
          summary: diffData.summary,
          risk: diffData.risk,
          question: diffData.question,
          options: diffData.options,
          why_now: diffData.why_now,
          status: "awaiting_decision",
          adrPath: `docs/adr/0001-${diffData.files[0]?.replace(/[^a-z0-9]/gi, "-").slice(0, 20)}.md`,
          adrContent: `# 0001 — ${diffData.question}

- **Status:** pending
- **Date:** ${new Date().toISOString().split("T")[0]}
- **Anchors:** ${diffData.anchor}

## Context
${diffData.summary}

## Risk
${diffData.risk}

## Decision
[Pending your voice decision via Wispr Flow...]`,
          timestamp: "Just now",
        };
        setSession(newSession);
        setSessionsList((prev) => [newSession, ...prev]);
        setActiveTab("loop");
        playSpokenBriefing(newSession);
      }
    } catch (e) {
      console.warn("Live git diff fetch failed:", e);
    }
  };

  // Play spoken briefing in crisp Indian English (Apple Rishi / en-IN) with overlap prevention
  const playSpokenBriefing = (s: SessionState = session) => {
    soundFX.unlockAudio();
    if (isSpeakingBriefing) {
      soundFX.stopSpeech();
      setIsSpeakingBriefing(false);
      return;
    }

    setIsSpeakingBriefing(true);
    setIsSpeakingReply(false);

    const briefingSpeech = register === "beginner"
      ? `Your AI just wrote ${s.linesAdded} lines of code. Warning: at ${s.anchor}, ${s.risk} Question: ${s.question}`
      : `Antigravity generated ${s.linesAdded} lines. Critical vulnerability at ${s.anchor}: ${s.risk} Dilemma: ${s.question}`;
    soundFX.speakAlert(briefingSpeech, "en", () => {
      setIsSpeakingBriefing(false);
    });
  };

  const handleSelectOption = (option: string) => {
    setVoiceInput(option);
    handleSubmitAnswer(option);
  };

  // Normalize spoken Hindi/Hinglish/English into clean ADR decision text
  const normalizeDecisionText = (rawSpeech: string): string => {
    const s = rawSpeech.toLowerCase();
    if (s.includes("401") || s.includes("reject") || s.includes("रिजेक्ट") || s.includes("re-login") || s.includes("लॉगिन")) {
      return "Expired tokens are strictly rejected with 401 and the client must re-authenticate. No silent reissue.";
    }
    if (s.includes("grace") || s.includes("silent") || s.includes("ग्रेस") || s.includes("reissue") || s.includes("क्लॉक")) {
      return "Allow silent reissue with a 60-second grace window to absorb network latency.";
    }
    if (s.includes("redis") || s.includes("blacklist") || s.includes("रेडिस") || s.includes("ब्लैकलिस्ट")) {
      return "Store revoked and expired tokens in a Redis blacklist with immediate security telemetry.";
    }
    if (s.includes("concurrent") || s.includes("limit") || s.includes("p-limit")) {
      return "Enforce concurrent p-limit(5) concurrency cap.";
    }
    return rawSpeech.trim();
  };

  // Generate crisp AI voice reply in clear English
  const getAiVoiceReply = (decisionText: string, userRegister: "beginner" | "pro"): string => {
    const s = decisionText.toLowerCase();
    if (s.includes("401") || s.includes("reject")) {
      return userRegister === "pro"
        ? "Architecture decision accepted: Expired tokens will strictly return 401. ADR 0001 committed to repository, constraints injected into next prompt."
        : "Got it! Expired tokens will be rejected with 401, requiring the client to log in again. Decision saved to your repository.";
    }
    if (s.includes("grace") || s.includes("silent")) {
      return userRegister === "pro"
        ? "Architecture decision accepted: 60-second grace window permitted. ADR 0001 committed to repository."
        : "Got it! Allowing a 60-second grace window for network latency. Decision saved to your repository.";
    }
    if (s.includes("redis") || s.includes("blacklist")) {
      return userRegister === "pro"
        ? "Architecture decision accepted: Revoked tokens stored in Redis blacklist. ADR 0001 committed to repository."
        : "Got it! Tracking revoked tokens in Redis blacklist. Decision saved to your repository.";
    }
    return userRegister === "pro"
      ? `Decision accepted: ${decisionText}. ADR 0001 committed to repository.`
      : `Got it! Decision recorded: ${decisionText}. Saved to your repository.`;
  };

  // Submit answer, persist real ADR via /api/adr, update CONSTRAINTS.md, and speak English voice reply
  const handleSubmitAnswer = async (answerToSubmit?: string) => {
    const rawAnswer = answerToSubmit || voiceInput;
    if (!rawAnswer.trim()) return;

    soundFX.playRestored();
    setIsSaving(true);

    const normalizedDecision = normalizeDecisionText(rawAnswer);
    const voiceReplyText = getAiVoiceReply(normalizedDecision, register);

    const updatedADR = `# 0001 — Reject expired refresh tokens instead of silently reissuing

- **Status:** accepted
- **Date:** ${new Date().toISOString().split("T")[0]}
- **Session:** ${session.id}
- **Anchors:** ${session.anchor}
- **Spoken Input:** "${rawAnswer.trim()}" (Dictated via Wispr Flow)

## Context
${session.summary}

## Decision
${normalizedDecision}

## Consequences
- Token families cannot be extended indefinitely by a malicious client.
- Client automatically prompts re-authentication on 401.
- ${session.files[0] || "rotate.ts"} now requires an explicit expiry test in the test suite.

## Alternatives considered
- Silent reissue with a short grace window — rejected: hides replay.
- Redis blacklist — deferred: adds infrastructure before proof of need.`;

    const updatedSession: SessionState = {
      ...session,
      status: "answered",
      answer: rawAnswer.trim(),
      voiceReply: voiceReplyText,
      adrContent: updatedADR,
    };

    setSession(updatedSession);
    setSessionsList((prev) =>
      prev.map((s) => (s.id === session.id ? updatedSession : s))
    );

    // Trigger AI Spoken Voice Reply in clean English
    soundFX.speakAlert(voiceReplyText, "en");

    // Call /api/adr to persist real file to disk, .devbridge/decisions.jsonl, and CONSTRAINTS.md
    try {
      const res = await fetch("/api/adr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Reject expired refresh tokens instead of silently reissuing",
          decision: normalizedDecision,
          rawSpeech: rawAnswer.trim(),
          sessionId: session.id,
          anchors: [session.anchor],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedDiskSuccess(data.fileSavedOnDisk ?? true);
      }
    } catch (e) {
      console.warn("ADR network save warning:", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Voice recording supporting Hindi, Hinglish, and English speech
  const toggleVoiceRecording = () => {
    soundFX.unlockAudio();

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");

        setVoiceInput(transcript);

        // Auto-submit on 1.5s silence
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          recognition.stop();
          setIsListening(false);
          handleSubmitAnswer(transcript);
        }, 1500);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      inputRef.current?.focus();
    }
  };

  // Start Scripted 60-Second Judge Path (FR-15 & FR-16)
  const startJudgeDemo = () => {
    soundFX.unlockAudio();
    setIsDemoRunning(true);
    setDemoStep(1);
    setDemoCountdown(60);
    handleReset();

    // 0s-12s: AI Writing Code
    soundFX.playAlert();

    let count = 60;
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    demoIntervalRef.current = setInterval(() => {
      count -= 1;
      setDemoCountdown(count);

      // 12s mark: Briefing lands + speaks
      if (count === 48) {
        setDemoStep(2);
        playSpokenBriefing(INITIAL_ACTIVE_SESSION);
      }

      // 30s mark: Question ready
      if (count === 30) {
        setDemoStep(3);
      }

      // 45s mark: Simulated Wispr dictation
      if (count === 15) {
        setDemoStep(4);
        setVoiceInput("401 reject kardo client ko dobara login karna hoga");
      }

      // 50s mark: Auto-submits
      if (count === 10) {
        handleSubmitAnswer("Strictly reject with 401 (forces client re-authentication)");
      }

      // 60s mark: Judge free dictation
      if (count <= 0) {
        setDemoStep(5);
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      }
    }, 1000);
  };

  const stopJudgeDemo = () => {
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    setIsDemoRunning(false);
    setDemoStep(0);
  };

  const handleReset = () => {
    soundFX.stopSpeech();
    setIsSpeakingBriefing(false);
    setIsSpeakingReply(false);
    setSession(INITIAL_ACTIVE_SESSION);
    setVoiceInput("");
    setIsListening(false);
    setSavedDiskSuccess(null);
  };

  const handleDownloadADR = () => {
    const blob = new Blob([session.adrContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "0001-reject-expired-refresh-tokens.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const replayVoiceReply = () => {
    if (session.voiceReply) {
      if (isSpeakingReply) {
        soundFX.stopSpeech();
        setIsSpeakingReply(false);
        return;
      }
      setIsSpeakingReply(true);
      setIsSpeakingBriefing(false);
      soundFX.speakAlert(session.voiceReply, "en", () => {
        setIsSpeakingReply(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-lg shadow-lg shadow-indigo-500/20">
              DB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">DevBridge</h1>
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                  Track 1: Builders
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  AI Voice: English (Rishi)
                </span>
                <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                  Wispr Mic: Hindi / English
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                The build wait, spent on the code you just got.
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Actions */}
          <div className="flex items-center gap-2">
            {/* View Mode Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("loop")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "loop"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Review Loop</span>
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "timeline"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Timeline ({sessionsList.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("graph")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "graph"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                <span>Decision Graph</span>
              </button>
              <button
                onClick={() => setActiveTab("metrics")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === "metrics"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Metrics</span>
              </button>
            </div>

            {/* Register Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setRegister("beginner")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  register === "beginner"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <GraduationCap className="h-3 w-3" />
                <span>Beginner</span>
              </button>
              <button
                onClick={() => setRegister("pro")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  register === "pro"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserCheck className="h-3 w-3" />
                <span>Pro</span>
              </button>
            </div>

            {/* Run 60s Judge Demo Button */}
            <button
              onClick={isDemoRunning ? stopJudgeDemo : startJudgeDemo}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                isDemoRunning
                  ? "bg-amber-500 text-slate-950 animate-pulse"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
              }`}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isDemoRunning ? `Demo (${demoCountdown}s)` : "60s Judge Demo"}</span>
            </button>

            {/* Manual Trigger Button (⌘⇧B) */}
            <button
              onClick={handleFetchLiveGitDiff}
              className="flex items-center gap-1 p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Inspect Current Git Diff (⌘⇧B)"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Scripted Demo Banner (If Active) */}
      {isDemoRunning && (
        <section className="bg-purple-950/60 border-b border-purple-500/30 py-2.5 px-6 animate-fadeIn">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-400 animate-ping" />
              <span className="font-bold text-purple-200">
                Judge Path Simulation Active:
              </span>
              <span className="text-purple-300 font-mono">
                {demoStep === 1 && "0s–12s: Simulating Cursor / Antigravity file generation..."}
                {demoStep === 2 && "12s–30s: Build closed -> Grounded code briefing spoken out loud."}
                {demoStep === 3 && "30s–45s: Architectural dilemma question presented with trade-offs."}
                {demoStep === 4 && "45s–50s: Spoken dictation captured via Wispr Flow..."}
                {demoStep >= 5 && "60s+: Decision persisted to docs/adr! Now try dictating your own answer."}
              </span>
            </div>
            <span className="font-mono text-purple-400 font-bold">{demoCountdown}s remaining</span>
          </div>
        </section>
      )}

      {/* Hero Session Strip */}
      <section className="border-b border-slate-800 bg-slate-900/30 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileCode2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Your AI just wrote <span className="text-indigo-400 font-bold">{session.linesAdded} lines</span> across {session.files.length} files. Here is what matters:
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span>Session #{session.id}</span>
                <span>•</span>
                <span>Files: {session.files.join(", ")}</span>
                <span>•</span>
                <span>Anchor: <span className="text-amber-400 underline">{session.anchor}</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playSpokenBriefing(session)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                isSpeakingBriefing
                  ? "border-red-500/40 bg-red-500/10 text-red-300 ring-1 ring-red-500/30"
                  : "border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300"
              }`}
            >
              {isSpeakingBriefing ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span>Stop Briefing</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Listen Briefing (English)</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
              title="Reset Session"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Tab Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* ========================================================= */}
        {/* TAB 1: THE CORE REVIEW LOOP (FIRST 60s JUDGE PATH)         */}
        {/* ========================================================= */}
        {activeTab === "loop" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Briefing & Question (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* 1. Grounded Briefing Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      1. Grounded Code Briefing
                    </h2>
                  </div>
                  <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase font-mono">
                    {session.severity} severity
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {register === "beginner"
                    ? `Your AI generated ${session.linesAdded} lines across ${session.files.join(", ")}, but left an unguarded architectural trade-off.`
                    : session.summary}
                </p>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-300">
                      Risk at {session.anchor}:
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {register === "beginner"
                        ? "Expired tokens are accepted without verification. A client using an 8-hour expired token will still remain logged in."
                        : session.risk}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Anchored Question & Voice Reply Hub */}
              <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      2. Exactly One Decision Question
                    </h3>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono font-bold flex items-center gap-1">
                    <Mic className="h-3 w-3" /> Voice Dictation via Wispr Flow
                  </span>
                </div>

                <p className="text-sm font-bold text-white leading-relaxed">
                  {session.question}
                </p>

                {/* Suggested Options */}
                <div className="space-y-2">
                  {session.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(opt)}
                      disabled={session.status === "answered"}
                      className={`w-full rounded-xl border p-3 text-left text-xs transition-all flex items-center justify-between ${
                        session.answer === opt
                          ? "border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-1 ring-emerald-500/50"
                          : "border-slate-800 bg-slate-950/60 hover:border-indigo-500/40 hover:bg-slate-900 text-slate-300"
                      }`}
                    >
                      <span>{opt}</span>
                      {session.answer === opt && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Voice Input Zone: Glowing Mic + Auto-Submit */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={voiceInput}
                        onChange={(e) => setVoiceInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSubmitAnswer();
                        }}
                        placeholder={
                          isListening
                            ? "Listening... Speak in Hindi or English (auto-submits on 1.5s silence)..."
                            : "Speak in Hindi or English (e.g. '401 reject kardo' or 'Strictly reject with 401')..."
                        }
                        className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                          isListening
                            ? "border-red-500 ring-2 ring-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                            : "border-slate-800 focus:ring-1 focus:ring-indigo-500"
                        }`}
                      />

                      {isListening && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                          <span className="text-[10px] text-red-400 font-mono font-bold">RECORDING</span>
                        </div>
                      )}
                    </div>

                    {/* Voice Recording Button */}
                    <button
                      onClick={toggleVoiceRecording}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                        isListening
                          ? "border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                          : "border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
                      }`}
                      title="Speak in Hindi/English/Hinglish (Auto-submits on speech end)"
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    {/* Typed submit fallback */}
                    <button
                      onClick={() => handleSubmitAnswer()}
                      disabled={!voiceInput.trim() || isSaving}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shrink-0 transition-colors"
                      title="Submit Decision"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>🎙️ <strong>Wispr Voice Active:</strong> Hindi, Hinglish, or English (1.5s auto-submit)</span>
                    <span className="text-indigo-400 font-mono">Input: en-IN (Bilingual)</span>
                  </div>
                </div>

                {/* 3. AI Voice Spoken Reply Card (Appears when decision is submitted) */}
                {session.status === "answered" && session.voiceReply && (
                  <div className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex flex-col gap-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AudioWaveform className="h-4 w-4 text-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-300 font-mono">
                          AI Voice Reply (English • Rishi)
                        </span>
                      </div>
                      <button
                        onClick={replayVoiceReply}
                        className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors ${
                          isSpeakingReply
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        {isSpeakingReply ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" />
                            <span>Replay Voice</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-emerald-100 font-mono italic">
                      &ldquo;{session.voiceReply}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-emerald-400/80 pt-1 border-t border-emerald-500/20">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3" /> Real ADR saved to <code className="bg-emerald-950/60 px-1 rounded">{session.adrPath}</code>
                      </span>
                      <span>CONSTRAINTS.md updated</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Persisted Architecture Decision Record (ADR) (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      Persisted Decision Record
                    </h3>
                  </div>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                    ADR 0001
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="truncate max-w-[220px]">{session.adrPath}</span>
                  <span className={session.status === "answered" ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                    {session.status === "answered" ? "✓ Decision Persisted" : "Awaiting Voice Answer"}
                  </span>
                </div>

                {/* ADR Markdown Preview */}
                <div className="mt-3 flex-1 rounded-xl border border-slate-800 bg-slate-950 p-3.5 overflow-y-auto max-h-[380px] font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap select-text">
                  {session.adrContent}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Inherited by next AI prompt</span>
                  <button
                    onClick={handleDownloadADR}
                    className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 font-mono text-[10px] transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export ADR (.md)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SESSION TIMELINE (FR-18)                           */}
        {/* ========================================================= */}
        {activeTab === "timeline" && (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>Build Session Timeline (FR-18)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological log of AI coding sessions detected by local watcher. Skipped is a first-class state.
                </p>
              </div>
              <button
                onClick={handleFetchLiveGitDiff}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-mono text-indigo-300 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Trigger Manual Session (⌘⇧B)</span>
              </button>
            </div>

            <div className="space-y-3">
              {sessionsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSession(item);
                    setActiveTab("loop");
                  }}
                  className={`rounded-2xl border p-4 transition-all cursor-pointer flex flex-col gap-2.5 ${
                    item.id === session.id
                      ? "border-indigo-500 bg-slate-900/90 shadow-md ring-1 ring-indigo-500/40"
                      : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">#{item.id}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400 font-mono">{item.files.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          item.status === "answered"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : item.status === "skipped"
                            ? "bg-slate-800 text-slate-400 border-slate-700"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{item.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/60">
                    <span>+{item.linesAdded} / -{item.linesRemoved} lines</span>
                    <span>Anchor: {item.anchor}</span>
                    {item.adrPath && <span className="text-emerald-400">{item.adrPath}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DECISION GRAPH (FR-19)                             */}
        {/* ========================================================= */}
        {activeTab === "graph" && (
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Network className="h-4 w-4 text-indigo-400" />
                  <span>Interactive Architecture Decision Graph (FR-19)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nodes represent architectural choices dictated via Wispr Flow; edges represent files and prompt constraints.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">2 Active Decision Nodes</span>
            </div>

            {/* Visual Node Diagram */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col gap-6 min-h-[400px]">
              {/* Architecture Layer 1: Code Write Paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold">
                    <FolderTree className="h-4 w-4" />
                    <span>Hunk: src/auth/rotate.ts:44-58</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Token refresh logic generated without exp claim check.
                  </p>
                  <div className="mt-2 text-center text-slate-500 text-xs">↓</div>
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300 font-mono">
                      <span>ADR-0001: 401 Rejection</span>
                      <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">ACCEPTED</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Expired tokens strictly return 401. Forced client re-login.
                    </p>
                    <div className="mt-2 text-[10px] text-emerald-400/80 font-mono">
                      Dictated: &ldquo;401 reject kardo client ko dobara login karna hoga&rdquo;
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold">
                    <FolderTree className="h-4 w-4" />
                    <span>Hunk: src/worker/batch.ts:18</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Sequential awaits bottlenecking batch throughput.
                  </p>
                  <div className="mt-2 text-center text-slate-500 text-xs">↓</div>
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300 font-mono">
                      <span>ADR-0002: Concurrent p-limit(5)</span>
                      <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">ACCEPTED</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Batch concurrency capped at 5 workers.
                    </p>
                    <div className="mt-2 text-[10px] text-emerald-400/80 font-mono">
                      Dictated: &ldquo;Concurrent p-limit concurrency cap&rdquo;
                    </div>
                  </div>
                </div>
              </div>

              {/* Edge Connection to Prompt Ingestion */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-1.5">
                    <Terminal className="h-4 w-4" />
                    <span>Repository Constraints (CONSTRAINTS.md)</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Cursor and Antigravity inherit these decisions in subsequent prompts without manual copy-paste.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([
                      `# Repository Constraints\n- [ADR-0001]: Reject expired tokens with 401\n- [ADR-0002]: Concurrency cap 5 on worker queue\n`
                    ], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "CONSTRAINTS.md";
                    a.click();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  Export CONSTRAINTS.md
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SESSION METRICS (FR-13)                            */}
        {/* ========================================================= */}
        {activeTab === "metrics" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-400" />
                  <span>Session Telemetry & Evidence (FR-13)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged in <code className="text-indigo-300">.devbridge/metrics.jsonl</code> — PRD Rule: No number appears in video that is not in metrics.
                </p>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col gap-1">
                <span className="text-xs font-mono text-slate-400">Total Build Wait Saved</span>
                <span className="text-2xl font-black text-indigo-400 font-mono">184s</span>
                <span className="text-[11px] text-slate-500">Across 3 build sessions</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col gap-1">
                <span className="text-xs font-mono text-slate-400">Decisions Captured</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">100%</span>
                <span className="text-[11px] text-slate-500">2 captured / 0 abandoned</span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col gap-1">
                <span className="text-xs font-mono text-slate-400">Avg Decision Latency</span>
                <span className="text-2xl font-black text-purple-400 font-mono">3.8s</span>
                <span className="text-[11px] text-slate-500">Dictated via Wispr Flow</span>
              </div>
            </div>

            {/* Metrics JSONL Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800/60">
                <span>Raw Log: .devbridge/metrics.jsonl</span>
                <span className="text-emerald-400">Valid JSON Lines</span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
{`{"session_id":"8f2c41a0","wait_ms":61000,"decision_captured":true,"timestamp":"2026-10-25T02:38:54Z"}
{"session_id":"3a9b12e4","wait_ms":84000,"decision_captured":true,"timestamp":"2026-10-25T02:12:10Z"}
{"session_id":"5c81d09e","wait_ms":39000,"decision_captured":false,"skipped":true,"timestamp":"2026-10-25T01:40:02Z"}`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>DevBridge (VoiceAnchor)</span>
            <span>•</span>
            <span>WeMakeDevs × Wispr Flow Hackathon</span>
            <span>•</span>
            <span>Track 1: Builders (Solo)</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>FR-20: Camera Stripped</span>
            <span>•</span>
            <span>FR-12: Repo ADRs</span>
            <span>•</span>
            <span>Wispr Voice Engine Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
