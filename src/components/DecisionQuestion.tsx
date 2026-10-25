"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, CornerDownLeft } from "lucide-react";
import Panel from "@/components/ui/Panel";
import Chip from "@/components/ui/Chip";
import { soundFX } from "@/lib/soundEffects";

interface DecisionQuestionProps {
  question: string | null;
  options: string[];
  lang: "hi" | "en";
  disabled?: boolean;
  onSubmit: (answer: string, source: "wispr" | "typed" | "option") => void;
}

export default function DecisionQuestion({
  question,
  options,
  lang,
  disabled,
  onSubmit,
}: DecisionQuestionProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const silenceTimer = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setInput("");
    setIsListening(false);
  }, [question]);

  const stopListening = useCallback(() => {
    if (silenceTimer.current) {
      window.clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      /* no-op */
    }
    setIsListening(false);
  }, []);

  const submit = useCallback(
    (text: string, source: "wispr" | "typed" | "option") => {
      const value = text.trim();
      if (!value || disabled) return;
      stopListening();
      setInput("");
      onSubmit(value, source);
    },
    [disabled, onSubmit, stopListening]
  );

  const armSilence = useCallback(() => {
    if (silenceTimer.current) window.clearTimeout(silenceTimer.current);
    silenceTimer.current = window.setTimeout(() => {
      stopListening();
      const current = inputRef.current?.value ?? "";
      if (current.trim()) submit(current, "wispr");
    }, 1500);
  }, [stopListening, submit]);

  const startListening = useCallback(() => {
    soundFX.unlockAudio();
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      inputRef.current?.focus();
      return;
    }
    const recognition = new SR();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let transcript = "";
      const results: any[] = Array.from(event.results);
      for (const result of results) transcript += result[0].transcript;
      setInput(transcript);
      armSilence();
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      setIsListening(false);
      if (input.trim()) submit(input, "wispr");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* already started */
    }
  }, [lang, armSilence, submit, input]);

  useEffect(() => () => stopListening(), [stopListening]);

  if (!question) return null;

  return (
    <Panel
      icon={
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
        </svg>
      }
      title="Architectural decision"
      subtitle="One question, anchored to the code that just landed"
      actions={
        disabled ? (
          <Chip tone="emerald">Captured</Chip>
        ) : (
          <Chip tone="indigo">Awaiting answer</Chip>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] font-medium leading-relaxed text-slate-100">{question}</p>

        {/* Options */}
        <div className="flex flex-col gap-1.5">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => submit(opt, "option")}
              disabled={disabled}
              className="group flex items-start gap-2 rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2 text-left text-[12px] text-slate-200 transition-colors hover:border-indigo-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="mt-px font-mono text-[10px] text-slate-500 group-hover:text-indigo-400">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="leading-snug">{opt}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              armSilence();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input, "typed");
              }
            }}
            disabled={disabled}
            aria-label="Speak or type your decision"
            placeholder={
              lang === "hi"
                ? "बोलें या टाइप करें — 1.5 सेकंड चुप रहने पर अपने आप सबमिट हो जाएगा"
                : "Speak or type your decision — auto-submits after 1.5s of silence"
            }
            className="w-full resize-none rounded-md border border-slate-700 bg-slate-800/40 px-3 py-2 pr-16 text-[12px] leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          {isListening && (
            <span className="absolute right-2.5 top-2 flex items-center gap-1 font-mono text-[10px] text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              REC
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={disabled}
            aria-label={isListening ? "Stop dictation" : "Start dictation"}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${
              isListening
                ? "border-red-500/50 bg-red-500/10 text-red-400"
                : "border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={() => submit(input, "typed")}
            disabled={!input.trim() || disabled}
            className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Capture decision
          </button>
        </div>

        <p className="flex items-center gap-1 text-[10px] text-slate-500">
          <CornerDownLeft className="h-3 w-3" />
          Enter submits · Wispr Flow dictation or Web Speech both accepted
        </p>
      </div>
    </Panel>
  );
}
