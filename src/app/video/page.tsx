"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Play, Pause, RotateCcw, Download, CheckCircle2, Mic, 
  Terminal, ShieldCheck, Volume2, Sparkles, VolumeX 
} from "lucide-react";

interface Beat {
  id: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  voiceText: string;
  lang: string;
  speaker: string;
  pauseAfter: number;
  component: string;
}

const BEATS: Beat[] = [
  {
    id: 0,
    title: "Beat 1/5: The Build Wait",
    shortTitle: "Beat 1: The Build Wait",
    subtitle: "When developers prompt AI coding tools, the 60-90s wait leaves code unreviewed.",
    voiceText: "When developers prompt AI coding tools like Cursor or Antigravity, the build wait takes 60 to 90 seconds. We tab away, lose focus, and merge 60 unreviewed lines into production.",
    lang: "en-US",
    speaker: "Narrator",
    pauseAfter: 1200,
    component: "problem",
  },
  {
    id: 1,
    title: "Beat 2/5: Spoken Diff Briefing",
    shortTitle: "Beat 2: Spoken Diff Briefing",
    subtitle: "DevBridge catches landed diffs and speaks the exact file:line architectural risk.",
    voiceText: "DevBridge turns the wait into a spoken code review. It detected 64 lines in rotate dot ts. Line 44 accepts expired tokens without checking the exp claim. Should we reject past expiration or allow grace window?",
    lang: "en-US",
    speaker: "DevBridge Voice",
    pauseAfter: 1400,
    component: "diff",
  },
  {
    id: 2,
    title: "Beat 3/5: Hands-Free Voice Dictation",
    shortTitle: "Beat 3: Voice Dictation",
    subtitle: "Developer speaks via Wispr Flow in Hindi. 1.5s silence auto-submits.",
    voiceText: "401 reject kardo, client ko dobara login karna chahiye.",
    lang: "hi-IN",
    speaker: "Developer (Wispr Flow)",
    pauseAfter: 1500,
    component: "voice",
  },
  {
    id: 3,
    title: "Beat 4/5: Real ADR Committed",
    shortTitle: "Beat 4: ADR Committed to Git",
    subtitle: "Generates permanent Architecture Decision Record in docs/adr/ and updates CONSTRAINTS.md.",
    voiceText: "Architecture decision accepted. Expired tokens strictly return 401. ADR 0001 committed to repository, updating constraints for future prompts.",
    lang: "en-US",
    speaker: "DevBridge System",
    pauseAfter: 1400,
    component: "adr",
  },
  {
    id: 4,
    title: "Beat 5/5: Verified Telemetry",
    shortTitle: "Beat 5: Verified Telemetry",
    subtitle: "Tracks every word dictated, review sessions, and audio duration for hackathon.",
    voiceText: "All telemetry is verified and saved to the Wispr Flow insights card. Zero keystrokes required. The build wait, spent on the code you just got.",
    lang: "en-US",
    speaker: "DevBridge Summary",
    pauseAfter: 2000,
    component: "telemetry",
  },
];

export default function DemoVideoStudio() {
  const [currentBeatIdx, setCurrentBeatIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentBeat = BEATS[currentBeatIdx];

  // Best voice picker
  const getBestVoice = (lang: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    if (lang === "hi-IN") {
      const hi = voices.find(v => v.lang.startsWith("hi") || v.name.includes("Lekha") || v.name.includes("Hindi"));
      if (hi) return hi;
    }
    const pref = voices.find(v => v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Karen") || (v.lang === "en-US" && !v.name.includes("Google")));
    return pref || voices.find(v => v.lang.startsWith("en")) || voices[0];
  };

  const stopAudio = () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const playBeatSequence = (idx: number) => {
    stopAudio();
    setCurrentBeatIdx(idx);
    const beat = BEATS[idx];

    if (!isPlaying) return;

    if (speechEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(beat.voiceText);
      utter.rate = beat.lang === "hi-IN" ? 0.95 : 1.05;
      const voice = getBestVoice(beat.lang);
      if (voice) utter.voice = voice;

      utter.onend = () => {
        if (idx < BEATS.length - 1) {
          transitionTimerRef.current = setTimeout(() => {
            playBeatSequence(idx + 1);
          }, beat.pauseAfter);
        } else {
          setIsPlaying(false);
          if (isRecording) stopRecording();
        }
      };

      utter.onerror = () => {
        if (idx < BEATS.length - 1) {
          transitionTimerRef.current = setTimeout(() => playBeatSequence(idx + 1), 4000);
        }
      };

      window.speechSynthesis.speak(utter);
    } else {
      transitionTimerRef.current = setTimeout(() => {
        if (idx < BEATS.length - 1) {
          playBeatSequence(idx + 1);
        } else {
          setIsPlaying(false);
          if (isRecording) stopRecording();
        }
      }, 5000);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      playBeatSequence(currentBeatIdx);
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [isPlaying]);

  const togglePlay = () => {
    if (currentBeatIdx >= BEATS.length - 1) {
      setCurrentBeatIdx(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    stopAudio();
    setIsPlaying(false);
    setCurrentBeatIdx(0);
  };

  const jumpToBeat = (idx: number) => {
    stopAudio();
    setCurrentBeatIdx(idx);
    if (isPlaying) {
      playBeatSequence(idx);
    }
  };

  const startRecording = async () => {
    try {
      if (!containerRef.current) return;
      const stream = (containerRef.current as any).captureStream 
        ? (containerRef.current as any).captureStream(30)
        : await navigator.mediaDevices.getDisplayMedia({ video: true });

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setIsRecording(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      handleRestart();
      setIsPlaying(true);
    } catch (err) {
      console.error("Recording error:", err);
      alert("Screen capture recording permission needed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
            DB
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              DevBridge Demo Studio
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                1080p Event-Driven Video
              </span>
            </h1>
            <p className="text-xs text-slate-400">Natural Audio Narration & Seamless Scene Transitions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            ← Back to App
          </Link>
          {recordedBlobUrl && (
            <a
              href={recordedBlobUrl}
              download="devbridge-demo-walkthrough.webm"
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              Download Recorded Video
            </a>
          )}
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-6xl w-full mx-auto">
        
        {/* Video Canvas Container (16:9 Aspect Ratio) */}
        <div 
          ref={containerRef}
          className="relative w-full aspect-video max-w-4xl rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-8 shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          {/* Watermark & Badges */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-lg">DevBridge</span>
              <span className="text-xs text-slate-400">× Wispr Flow</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                #NoHandsChallenge
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isPlaying && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {currentBeat.speaker} Speaking
                </div>
              )}
              <div className="text-xs font-mono text-amber-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                {currentBeat.title}
              </div>
            </div>
          </div>

          {/* Dynamic Beat Canvas View */}
          <div className="my-auto z-10 transition-all duration-500">
            {currentBeat.component === "problem" && (
              <div className="text-center max-w-xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
                  <Terminal className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  The Empty 60–90s AI Build Wait
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  When Cursor or Antigravity finishes generating code, developers have tabbed away. 
                  60+ generated lines land without review—shipping subtle security vulnerabilities directly into production.
                </p>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400">
                    Git Diff: 64 landed lines
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-xs font-mono text-rose-300">
                    Attention: 0% at terminal
                  </div>
                </div>
              </div>
            )}

            {currentBeat.component === "diff" && (
              <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-700 rounded-xl p-5 shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-rose-400 flex items-center gap-1.5 font-semibold">
                    <Volume2 className="w-4 h-4 text-orange-400 animate-pulse" />
                    DevBridge Grounded Voice Briefing
                  </span>
                  <span className="text-slate-400">src/auth/rotate.ts:44-58</span>
                </div>
                <div className="p-3.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                  <p className="text-emerald-400">// Grounded Spoken Audio Prompt:</p>
                  &quot;Your AI just modified token rotation in rotate.ts. Line 44 accepts expired tokens without validating the exp claim. Should we strictly reject past expiry, or allow a 60s grace period?&quot;
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Grounded in exact git hunks • Spoken in clear, audible English
                </div>
              </div>
            )}

            {currentBeat.component === "voice" && (
              <div className="max-w-xl mx-auto bg-slate-900/90 border border-amber-500/30 rounded-xl p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-amber-400 animate-bounce" />
                    Wispr Flow Multilingual Capture
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Hindi Dictation
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-black/70 border border-amber-500/20">
                  <p className="text-xs text-slate-400 mb-1 font-mono">Spoken from chair (hands off keyboard):</p>
                  <p className="text-base font-medium text-amber-200">
                    &quot;401 reject kardo, client ko dobara login karna chahiye.&quot;
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 1.5s silence auto-submit
                  </span>
                  <span>Latency: 280ms</span>
                </div>
              </div>
            )}

            {currentBeat.component === "adr" && (
              <div className="max-w-xl mx-auto bg-slate-900/90 border border-emerald-500/30 rounded-xl p-5 shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Real ADR Generated & Committed
                  </span>
                  <span className="text-slate-400">docs/adr/0001-reject-expired-tokens.md</span>
                </div>
                <div className="p-3.5 rounded-lg bg-black/70 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="text-slate-400"># 0001. Strictly Reject Expired Tokens</p>
                  <p className="text-emerald-300">Status: Accepted</p>
                  <p className="text-slate-400">Decision: Reject tokens past exp with 401. Enforce client re-login.</p>
                  <p className="text-amber-400">Updated: CONSTRAINTS.md (inherited by future Cursor prompts)</p>
                </div>
                <p className="text-[11px] text-slate-400">
                  Permanent git artifact created with zero keyboard strokes.
                </p>
              </div>
            )}

            {currentBeat.component === "telemetry" && (
              <div className="max-w-xl mx-auto grid grid-cols-3 gap-3 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-amber-400">43</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">Dictated Words</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">Wispr Flow Track 1</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-emerald-400">100%</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">ADR Persistence</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">7 Sessions Logged</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                  <div className="text-2xl font-black text-sky-400">29.8s</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">Speech Duration</div>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">Hindi + English</div>
                </div>
              </div>
            )}
          </div>

          {/* Subtitle Bar */}
          <div className="z-10 bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xs font-medium text-slate-200">{currentBeat.subtitle}</p>
          </div>

          {/* Subtle Ambient Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
        </div>

        {/* Timeline & Player Controls */}
        <div className="w-full max-w-4xl mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          {/* Progress Timeline with Segmented Beats */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Beat {currentBeatIdx + 1} of 5</span>
              <span className="text-slate-300 font-medium">{currentBeat.shortTitle}</span>
              <span>100% Completion</span>
            </div>
            <div className="flex gap-1.5 h-2">
              {BEATS.map((beat, idx) => (
                <div
                  key={beat.id}
                  onClick={() => jumpToBeat(idx)}
                  className="flex-1 bg-slate-800 rounded-full overflow-hidden cursor-pointer"
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      idx < currentBeatIdx
                        ? "bg-amber-500 w-full"
                        : idx === currentBeatIdx
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 w-full animate-pulse"
                        : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Controls Button Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 font-medium text-white text-xs flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Pause" : "Play Walkthrough"}
              </button>
              <button
                onClick={handleRestart}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restart
              </button>
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
              >
                {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                Voiceover: {speechEnabled ? "ON" : "OFF"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-medium transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Record & Export Video (.webm)
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs flex items-center gap-2 font-medium animate-pulse"
                >
                  <Pause className="w-4 h-4" />
                  Stop Recording
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
