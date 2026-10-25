// Robust Web Audio + Native macOS Apple Indian Voices (Rishi for en-IN, Lekha for hi-IN) + Browser SpeechSynthesis fallback
// Guarantees strictly ONE voice plays at any given time with immediate cancellation of prior speech.

class SoundFX {
  private ctx: AudioContext | null = null;
  private isAudioUnlocked = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  unlockAudio() {
    if (this.isAudioUnlocked) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === "suspended") {
          this.ctx.resume();
        }
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.isAudioUnlocked = true;
      }
    } catch (e) {
      console.warn("Audio unlock warning:", e);
    }
  }

  private getCtx() {
    this.unlockAudio();
    return this.ctx;
  }

  playAlert() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "sine";

      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.25);

      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.exponentialRampToValueAtTime(380, now + 0.25);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch (e) {
      console.error("playAlert error:", e);
    }
  }

  playRestored() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch (e) {
      console.error("playRestored error:", e);
    }
  }

  // Instantly halts all ongoing speech across browser and native macOS process
  stopSpeech() {
    // 1. Cancel browser speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    // 2. Kill server-side macOS 'say' process if active
    fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    }).catch(() => {});
  }

  // Speaks using native Apple Indian voices or Browser Web Speech API
  // Cancels any running speech first so double-clicks NEVER produce overlapping voices!
  async speakAlert(text: string, lang: "hi" | "en" = "en", onEnd?: () => void) {
    this.stopSpeech();

    // 1. Try native macOS server voice first (if running on local Mac)
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.localAudio === true) {
        // Approximate speech duration based on word count (~150 words per minute)
        const wordCount = text.split(/\s+/).length;
        const durationMs = Math.max(2000, (wordCount / 150) * 60 * 1000);
        setTimeout(() => {
          if (onEnd) onEnd();
        }, durationMs);
        return;
      }
    } catch {
      // fallback to browser Web Speech API
    }

    // 2. Browser SpeechSynthesis Fallback (works on Vercel and all hosted browsers)
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.unlockAudio();
      window.speechSynthesis.cancel();

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          if (onEnd) onEnd();
        };
        utterance.onerror = () => {
          if (onEnd) onEnd();
        };

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          if (lang === "hi") {
            const hindiVoice = voices.find(
              (v) => v.name.includes("Lekha") || v.lang.toLowerCase().includes("hi")
            );
            if (hindiVoice) utterance.voice = hindiVoice;
          } else {
            const englishVoice =
              voices.find((v) => v.name.includes("Rishi") || v.lang.toLowerCase() === "en-in") ||
              voices.find((v) => v.lang.toLowerCase().startsWith("en"));
            if (englishVoice) utterance.voice = englishVoice;
          }
        }

        this.activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (e) {
      console.error("speakAlert error:", e);
      if (onEnd) onEnd();
    }
  }
}

export const soundFX = new SoundFX();
