"use client";

import React, { useState, useEffect } from "react";
import { soundFX } from "@/lib/soundEffects";
import { 
  FileCode2, 
  Sparkles, 
  Volume2, 
  Mic, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  History, 
  Languages, 
  UserCheck, 
  GraduationCap,
  Play,
  Download,
  ExternalLink
} from "lucide-react";

interface SessionState {
  id: string;
  files: string[];
  linesAdded: number;
  linesRemoved: number;
  status: "building" | "briefing" | "awaiting_answer" | "answered" | "skipped";
  summary: string;
  risk: string;
  anchor: string;
  severity: "low" | "medium" | "high";
  question: string;
  options: string[];
  answer: string;
  adrPath: string;
  adrContent: string;
}

const DEMO_SESSION: SessionState = {
  id: "8f2c41a0",
  files: ["src/auth/rotate.ts", "src/auth/jwt.ts"],
  linesAdded: 61,
  linesRemoved: 8,
  status: "awaiting_answer",
  summary: "Antigravity just generated a refresh token rotation handler.",
  risk: "Expired tokens are accepted without verifying the 'exp' claim in rotate.ts:44-58.",
  anchor: "src/auth/rotate.ts:44-58",
  severity: "high",
  question: "When an expired refresh token arrives, should we reject it with 401 or silently reissue with a short grace window?",
  options: [
    "Reject with 401 and force re-login (Recommended)",
    "Silent reissue with 60s grace window",
    "Store in Redis blacklist with immediate alert"
  ],
  answer: "",
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
Expired tokens are rejected with 401 and the client re-authenticates. No silent reissue.

## Consequences
- A background tab wakes up logged out after a long sleep.
- Token families cannot be extended indefinitely by a malicious client.
- rotate.ts now needs an explicit expiry test in the auth suite.

## Alternatives considered
- Silent reissue with a short grace window — rejected: hides replay.
- Redis blacklist — deferred: adds infrastructure before proof of need.`
};

export default function DevBridgeHome() {
  const [session, setSession] = useState<SessionState>(DEMO_SESSION);
  const [register, setRegister] = useState<"beginner" | "pro">("beginner");
  const [lang, setLang] = useState<"hi" | "en-IN">("hi");
  const [voiceInput, setVoiceInput] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [isDemoMode] = useState(true);

  // Play spoken briefing when session is in briefing state
  const playSpokenBriefing = () => {
    soundFX.unlockAudio();
    if (lang === "hi") {
      const hiText = register === "beginner"
        ? "तुम्हारा AI 61 लाइन कोड लिख चुका है। ध्यान दो: rotate.ts में एक्सपायर्ड टोकन बिना चेक किए पास हो रहा है। सवाल: जब पुराना टोकन आए तो 401 रिजेक्ट करें या नया जारी करें?"
        : "Antigravity just wrote 61 lines. Critical risk in rotate.ts line 44: expired tokens are accepted without exp check. Should we reject with 401 or reissue with grace?";
      soundFX.speakAlert(hiText, "hi");
    } else {
      const enText = `Your AI just wrote 61 lines. Risk identified in rotate.ts line 44: expired tokens are accepted without verification. Should we reject with 401, or reissue with a grace window?`;
      soundFX.speakAlert(enText, "en");
    }
  };

  const handleSelectOption = (option: string) => {
    setVoiceInput(option);
    handleSubmitAnswer(option);
  };

  const handleSubmitAnswer = (answerToSubmit?: string) => {
    const finalAnswer = answerToSubmit || voiceInput;
    if (!finalAnswer.trim()) return;

    soundFX.playRestored();
    setSession((prev) => ({
      ...prev,
      status: "answered",
      answer: finalAnswer,
    }));

    if (lang === "hi") {
      soundFX.speakAlert("फैसला रिकॉर्ड हो गया। आर्किटेक्चर डिसिशन रिकॉर्ड docs/adr में सेव कर दिया गया है।", "hi");
    } else {
      soundFX.speakAlert("Decision recorded into docs/adr as an Architecture Decision Record.", "en");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20">
              DB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">DevBridge</h1>
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                  {isDemoMode ? "Demo Mode (Scripted)" : "Live Repository"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                The build wait, spent on the code you just got.
              </p>
            </div>
          </div>

          {/* Controls: Register & Language */}
          <div className="flex items-center gap-2.5">
            {/* Language */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setLang("hi")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  lang === "hi"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Languages className="h-3 w-3" />
                <span>हिंदी (लेखा)</span>
              </button>
              <button
                onClick={() => setLang("en-IN")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  lang === "en-IN"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>English (Rishi)</span>
              </button>
            </div>

            {/* Register */}
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
          </div>
        </div>
      </header>

      {/* Hero Banner (First 60s Judge Path) */}
      <section className="border-b border-slate-800 bg-slate-900/30 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
                <span>Anchor: <span className="text-amber-400 underline">{session.anchor}</span></span>
              </div>
            </div>
          </div>

          <button
            onClick={playSpokenBriefing}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Hear Briefing ({lang === "hi" ? "लेखा" : "Rishi"})</span>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                ? "तुम्हारे AI ने rotate.ts में टोकन रोटेशन कोड तो लिख दिया, लेकिन इसमें एक छुपा हुआ रिस्क है।"
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
                    ? "एक्सपायर हो चुका टोकन भी बिना चेक किए पास हो रहा है। कोई भी एक्सपायर्ड टोकन यूज करके लॉग-इन रह सकता है।"
                    : session.risk}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Anchored Question & Voice Response */}
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  2. Exactly One Decision Question
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Answer by Voice via Wispr
              </span>
            </div>

            <p className="text-sm font-bold text-white leading-relaxed">
              {register === "beginner"
                ? "जब कोई एक्सपायर हुआ टोकन आए, तो सिस्टम को तुरंत रिजेक्ट करके 401 एरर देना चाहिए या चुपचाप नया टोकन दे देना चाहिए?"
                : session.question}
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

            {/* Wispr Voice Input / Freeform */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitAnswer();
                  }}
                  placeholder="Hold Wispr key or dictate your answer: 'Reject with 401'..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => handleSubmitAnswer()}
                disabled={!voiceInput.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shrink-0 transition-colors"
                title="Save Decision"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
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
                docs/adr/
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="truncate max-w-[220px]">{session.adrPath}</span>
              <span className="text-emerald-400 font-semibold">Saved in Repo</span>
            </div>

            {/* ADR Markdown Preview */}
            <div className="mt-3 flex-1 rounded-xl border border-slate-800 bg-slate-950 p-3.5 overflow-y-auto max-h-[420px] font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap select-text">
              {session.adrContent}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Next Cursor prompt inherits this decision</span>
              <span className="text-indigo-400 font-mono font-medium">CONSTRAINTS.md updated</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
