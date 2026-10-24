"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Volume2, Languages, UserCheck, GraduationCap, Send, ShieldCheck } from "lucide-react";
import { soundFX } from "@/lib/soundEffects";

interface VoiceCoachProps {
  onDecisionMade?: (newDecision: string) => void;
  activeTaskTitle?: string;
  isPhoneDetected?: boolean;
}

export default function VoiceCoach({
  onDecisionMade,
  activeTaskTitle = "Authentication Module",
  isPhoneDetected = false,
}: VoiceCoachProps) {
  const [isProMode, setIsProMode] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"hi" | "en">("hi");
  const [recapText, setRecapText] = useState("");
  const [dilemmaQuestion, setDilemmaQuestion] = useState("");
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>([]);
  const [spokenInput, setSpokenInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fetch initial recap and dilemma
  const fetchChallenge = async (overridePro?: boolean, overrideLang?: "hi" | "en") => {
    setIsProcessing(true);
    const selectedPro = overridePro ?? isProMode;
    const selectedLang = overrideLang ?? voiceLang;

    try {
      const res = await fetch("/api/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recap_and_challenge",
          currentTaskTitle: activeTaskTitle,
          voiceLang: selectedLang,
          userPromptHistory: selectedPro
            ? ["use redis ttl", "implement jwt rotation", "zod schema"] 
            : ["pura login bana do", "help with auth"],
        }),
      });

      const data = await res.json();
      setRecapText(data.recap);
      setDilemmaQuestion(data.challenge);
      setSuggestedOptions(data.suggestedOptions || []);
      setAiFeedback(null);

      // Speak using native Apple Indian voice (Lekha for Hindi, Rishi for English)
      soundFX.speakAlert(`${data.recap} ${data.challenge}`, selectedLang);

      // Auto-focus Wispr input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    } catch (err) {
      console.error("Failed to fetch challenge:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, [activeTaskTitle]);

  // When phone is detected, automatically trigger voice intervention in chosen language
  useEffect(() => {
    if (isPhoneDetected) {
      const warning = voiceLang === "hi" 
        ? `फोन नीचे रखो! सुनो: ${recapText} ${dilemmaQuestion}`
        : `Put your phone down! Listen: ${recapText} ${dilemmaQuestion}`;
      soundFX.speakAlert(warning, voiceLang);
      inputRef.current?.focus();
    }
  }, [isPhoneDetected]);

  // Submit spoken answer
  const handleSubmitSpokenReply = async (textToSubmit?: string) => {
    const finalInput = textToSubmit || spokenInput;
    if (!finalInput.trim()) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_voice_reply",
          userSpokenInput: finalInput,
          voiceLang,
          userPromptHistory: isProMode ? ["redis", "schema"] : [],
        }),
      });

      const data = await res.json();
      setAiFeedback(data.aiSpokenResponse);

      // Speak AI feedback out loud using native Indian voice
      soundFX.speakAlert(data.aiSpokenResponse, voiceLang);

      if (data.newArchitectureNode && onDecisionMade) {
        onDecisionMade(data.newArchitectureNode);
      }

      setSpokenInput("");
    } catch (err) {
      console.error("Submit voice reply error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Web Speech recognition fallback for in-browser mic
  const toggleMicListening = () => {
    soundFX.unlockAudio();

    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as unknown as { SpeechRecognition: any; webkitSpeechRecognition: any }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setSpokenInput(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        setIsListening(false);
        if (spokenInput.trim()) {
          handleSubmitSpokenReply();
        }
      };

      recognition.start();
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
      {/* Header & Persona & Language Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Voice Brainstorming & Context Revival
            </h3>
            <p className="text-[11px] text-slate-400">
              Native Apple Indian Voices (Lekha / Rishi) + Wispr Flow
            </p>
          </div>
        </div>

        {/* Toggles: Language (Hindi vs Indian English) and Persona (Pro vs Beginner) */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => {
                setVoiceLang("hi");
                fetchChallenge(isProMode, "hi");
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                voiceLang === "hi"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Languages className="h-3 w-3" />
              <span>Hindi (लेखा)</span>
            </button>

            <button
              onClick={() => {
                setVoiceLang("en");
                fetchChallenge(isProMode, "en");
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                voiceLang === "en"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Indian English (Rishi)</span>
            </button>
          </div>

          {/* Persona Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => {
                setIsProMode(false);
                fetchChallenge(false, voiceLang);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                !isProMode
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <GraduationCap className="h-3 w-3" />
              <span>Beginner</span>
            </button>

            <button
              onClick={() => {
                setIsProMode(true);
                fetchChallenge(true, voiceLang);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                isProMode
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

      {/* AI Speech Bubble: Context Recap */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1">
            <Volume2 className="h-3 w-3 animate-pulse" />
            <span>1. Pichla Code Recap (Context Revival)</span>
          </span>
          <button
            onClick={() => soundFX.speakAlert(recapText, voiceLang)}
            className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 font-mono rounded bg-indigo-500/10 px-2 py-0.5 border border-indigo-500/20"
          >
            🔊 Re-play Apple Voice
          </button>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {recapText || "Loading code context..."}
        </p>
      </div>

      {/* AI Dilemma Bubble: Next Step Challenge */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 flex flex-col gap-2">
        <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          <span>2. Next Step Architecture Dilemma (Phone-Killer Hook)</span>
        </span>
        <p className="text-xs text-purple-100 font-semibold leading-relaxed">
          {dilemmaQuestion || "Formulating architectural challenge..."}
        </p>

        {/* Suggested Quick Options */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {suggestedOptions.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSubmitSpokenReply(opt)}
              className="rounded-lg border border-purple-500/30 bg-purple-900/30 px-2.5 py-1 text-[11px] text-purple-200 hover:bg-purple-800/40 hover:text-white transition-colors text-left"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* AI Feedback Bubble (if replied) */}
      {aiFeedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>AI Brainstorming Decision Applied</span>
          </span>
          <p className="text-xs text-emerald-200 mt-1 font-medium">
            {aiFeedback}
          </p>
        </div>
      )}

      {/* Glowing Wispr Voice Input Bar */}
      <div className="mt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={spokenInput}
            onChange={(e) => setSpokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitSpokenReply();
            }}
            placeholder={
              voiceLang === "hi"
                ? "Wispr key hold karo ya yahan bolo: 'रेडिस ब्लैकलिस्ट यूज़ करना बेहतर रहेगा'..."
                : "Hold Wispr key or speak your answer: 'Redis blacklist is better for performance'..."
            }
            className="w-full rounded-xl border border-indigo-500/40 bg-slate-900/90 px-4 py-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] pr-10"
          />

          {isListening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] text-red-400 font-mono font-bold">LIVE</span>
            </div>
          )}
        </div>

        {/* Speak / Dictate Toggle Button */}
        <button
          onClick={toggleMicListening}
          className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
            isListening
              ? "border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
              : "border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
          }`}
          title="Speak via Wispr Flow"
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* Send Button */}
        <button
          onClick={() => handleSubmitSpokenReply()}
          disabled={!spokenInput.trim() || isProcessing}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
        <span>💡 Voice Engine: {voiceLang === "hi" ? "Apple Lekha (शुद्ध हिंदी)" : "Apple Rishi (Indian English)"}</span>
        <span className="font-mono text-indigo-400">Auto-Submits on Speech</span>
      </div>
    </div>
  );
}
