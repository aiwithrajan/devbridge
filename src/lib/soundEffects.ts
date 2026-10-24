// Robust Web Audio + Native macOS Indian Voices (Lekha for Hindi, Rishi for Indian English)

class SoundFX {
  private ctx: AudioContext | null = null;
  private isAudioUnlocked = false;

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

  // Speaks using native macOS Indian voices (Lekha for Hindi, Rishi for Indian English)
  async speakAlert(text: string, lang: "hi" | "en" = "hi") {
    // 1. Try native macOS server voice first (produces 100% natural Apple Lekha/Rishi voice)
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (res.ok) return;
    } catch {
      // fallback to browser Web Speech API
    }

    // 2. Browser SpeechSynthesis Fallback
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      this.unlockAudio();
      window.speechSynthesis.cancel();

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // If Hindi, specifically pick Lekha or hi-IN
          if (lang === "hi") {
            const hindiVoice = voices.find(
              (v) => v.name.includes("Lekha") || v.lang.toLowerCase().includes("hi")
            );
            if (hindiVoice) utterance.voice = hindiVoice;
          } else {
            // If English, pick Rishi or en-IN
            const indianEnglishVoice = voices.find(
              (v) => v.name.includes("Rishi") || v.lang.toLowerCase().includes("en-in")
            );
            if (indianEnglishVoice) utterance.voice = indianEnglishVoice;
          }
        }

        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (e) {
      console.error("speakAlert error:", e);
    }
  }
}

export const soundFX = new SoundFX();
