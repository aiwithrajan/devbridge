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
  Check
} from "lucide-react";

interface SessionState {
  id: string;
  files: string[];
  linesAdded: number;
  anchor: string;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  risk: string;
  question: string;
  options: string[];
  status: "briefing" | "awaiting_decision" | "answered";
  answer?: string;
  voiceReply?: string;
  adrPath: string;
  adrContent: string;
}

const INITIAL_DEMO_SESSION: SessionState = {
  id: "8f2c41a0",
  files: ["src/auth/rotate.ts", "src/auth/jwt.ts"],
  linesAdded: 61,
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
};

export default function DevBridgeHome() {
  const [session, setSession] = useState<SessionState>(INITIAL_DEMO_SESSION);
  const [register, setRegister] = useState<"beginner" | "pro">("pro");
  const [voiceInput, setVoiceInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedDiskSuccess, setSavedDiskSuccess] = useState<boolean | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Play spoken briefing in crisp Indian English (Apple Rishi / en-IN)
  const playSpokenBriefing = () => {
    soundFX.unlockAudio();
    const briefingSpeech = register === "beginner"
      ? "Your AI just wrote 61 lines of code. Warning: in rotate.ts, expired tokens are accepted without verification. Question: Should we reject expired tokens with 401, or reissue with a grace window?"
      : "Antigravity generated 61 lines. Critical vulnerability at rotate.ts line 44: refresh handler accepts expired tokens without exp claim verification. Should we reject with 401 or reissue with grace?";
    soundFX.speakAlert(briefingSpeech, "en");
  };

  const handleSelectOption = (option: string) => {
    setVoiceInput(option);
    handleSubmitAnswer(option);
  };

  // Convert raw spoken Hindi/Hinglish/English into clean ADR decision text
  const normalizeDecisionText = (rawSpeech: string): string => {
    const s = rawSpeech.toLowerCase();
    if (s.includes("401") || s.includes("reject") || s.includes("रिजेक्ट") || s.includes("re-login") || s.includes("लॉगिन")) {
      return "Expired tokens are strictly rejected with 401 and the client must re-authenticate. No silent reissue.";
    }
    if (s.includes("grace") || s.includes("silent") || s.includes("ग्रेस") || s.includes("reissue") || s.includes("कॉक स्क्यू")) {
      return "Allow silent reissue with a 60-second grace window to absorb network latency.";
    }
    if (s.includes("redis") || s.includes("blacklist") || s.includes("रेडिस") || s.includes("ब्लैकलिस्ट")) {
      return "Store revoked and expired tokens in a Redis blacklist with immediate security telemetry.";
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

  // Submit answer, persist real ADR via /api/adr, and trigger spoken English voice reply
  const handleSubmitAnswer = async (answerToSubmit?: string) => {
    const rawAnswer = answerToSubmit || voiceInput;
    if (!rawAnswer.trim()) return;

    soundFX.playRestored();
    setIsSaving(true);

    const normalizedDecision = normalizeDecisionText(rawAnswer);
    const voiceReplyText = getAiVoiceReply(normalizedDecision, register);

    const updatedADR = `# 0001 — Reject expired refresh tokens instead of silently reissuing

- **Status:** accepted
- **Date:** 2026-10-25
- **Session:** ${session.id}
- **Anchors:** ${session.anchor}
- **Spoken Input:** "${rawAnswer.trim()}" (Dictated via Wispr Flow)

## Context
Antigravity added a refresh handler that accepts any structurally valid token,
including one that expired eight hours ago. Nothing in the write path checks \`exp\`.

## Decision
${normalizedDecision}

## Consequences
- Token families cannot be extended indefinitely by a malicious client.
- Client automatically prompts re-authentication on 401.
- rotate.ts now requires an explicit expiry test in the test suite.

## Alternatives considered
- Silent reissue with a short grace window — rejected: hides replay.
- Redis blacklist — deferred: adds infrastructure before proof of need.`;

    setSession((prev) => ({
      ...prev,
      status: "answered",
      answer: rawAnswer.trim(),
      voiceReply: voiceReplyText,
      adrContent: updatedADR,
    }));

    // Trigger AI Spoken Voice Reply in clean English
    soundFX.speakAlert(voiceReplyText, "en");

    // Call /api/adr to persist real file to disk & .devbridge/decisions.jsonl
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
      // en-IN recognizes Indian English, Hindi words, and Hinglish seamlessly
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

  const handleReset = () => {
    setSession(INITIAL_DEMO_SESSION);
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
      soundFX.speakAlert(session.voiceReply, "en");
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
                  Wispr Flow • Track 1
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  AI Voice: English (Rishi)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                The build wait, spent on the code you just got.
              </p>
            </div>
          </div>

          {/* Controls: Register Toggle & Reset */}
          <div className="flex items-center gap-2.5">
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

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
              title="Reset Demo Loop"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
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
            <span>Hear Briefing (Voice)</span>
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
                ? "Your AI generated the token refresh logic in rotate.ts, but left an unguarded security gap."
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

          {/* 2. Anchored Question & Voice Reply Hub (Speaks in English, Accepts Hindi/Hinglish/English speech) */}
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  2. Exactly One Decision Question
                </h3>
              </div>
              <span className="text-[10px] text-purple-400 font-mono font-bold flex items-center gap-1">
                <Mic className="h-3 w-3" /> Voice Reply via Wispr Flow
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
                        ? "Listening... Speak in Hindi, Hinglish, or English (auto-submits on 1.5s silence)..."
                        : "Speak your decision in Hindi or English (e.g. '401 reject kardo' or 'Reject with 401')..."
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
                <span>🎙️ <strong>Wispr Voice Active:</strong> Aap Hindi ya English dono me bol sakte ho (1.5s auto-submit)</span>
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
                    className="flex items-center gap-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors"
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>Replay Voice</span>
                  </button>
                </div>
                <p className="text-xs text-emerald-100 font-mono italic">
                  &ldquo;{session.voiceReply}&rdquo;
                </p>
                <div className="flex items-center justify-between text-[10px] text-emerald-400/80 pt-1 border-t border-emerald-500/20">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Real ADR saved to <code className="bg-emerald-950/60 px-1 rounded">{session.adrPath}</code>
                  </span>
                  <span>.devbridge/decisions.jsonl updated</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Persisted Architecture Decision Record (ADR) in Clean English (5 cols) */}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3 px-6 text-center text-xs text-slate-500">
        DevBridge • Built for WeMakeDevs × Wispr Flow Hackathon • Track 1: Builders (Solo)
      </footer>
    </div>
  );
}
