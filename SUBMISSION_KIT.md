# WeMakeDevs × Wispr Flow Submission Kit

> **Event:** No Hands: The Wispr Challenge  
> **Track:** Track 1: Builders (Solo)  
> **Project:** DevBridge (VoiceAnchor)  
> **Status:** 100% Submission Ready

---

## 1. Project Information for Portal Form

| Field | Your Exact Value to Enter |
| :--- | :--- |
| **Project Name** | `DevBridge (VoiceAnchor)` |
| **Project One-Liner** | `The build wait, spent on the code you just got.` |
| **Track** | `Track 1: Builders (Solo)` |
| **Live Project URL** | `https://wispr-five.vercel.app` |
| **GitHub Repository** | `https://github.com/aiwithrajan/devbridge` |
| **Demo Video Link** | `[Paste your 1-2 min Loom or unlisted YouTube link here]` |
| **Wispr Flow Insights Proof** | `https://wispr-five.vercel.app/wispr-insights-card.svg` *(or upload the SVG/PNG)* |

---

## 2. Portal Form Questions & Answers (Ready to Copy-Paste)

### Q1: What problem did you solve?
> When developers prompt AI coding tools like Cursor or Antigravity, the model spends 60–120 seconds generating code across multiple files. During that build wait, developer attention evaporates—they check their phone, leave their desk, and ultimately merge 60+ generated lines without review. Silent security vulnerabilities, missing expiry checks, and architectural flaws slip into production unvetted because developers have no natural mechanism to review landed diffs during the wait.

### Q2: How does your product work?
> DevBridge turns the empty 60–90 second build wait into a voice-first code review. When the AI finishes writing files, DevBridge parses the uncommitted `git diff` hunks, speaks a grounded code briefing in clean English citing the exact `file:line` risk (e.g. `src/auth/rotate.ts:44-58`), and asks exactly ONE architectural dilemma question. The developer dictates their answer hands-free via Wispr Flow in Hindi, Hinglish, or English. After a 1.5-second silence pause, the answer auto-submits, writing an Architecture Decision Record (ADR) directly into `docs/adr/` in the repository and updating `CONSTRAINTS.md` for future AI prompts to inherit.

### Q3: How did you integrate Wispr Flow?
> Wispr Flow is the indispensable core input device in DevBridge. Rather than forcing developers to lean forward and type during an AI generation, they hold their Wispr Flow hotkey from their chair, speak naturally in their native language (Hindi/English), and release. DevBridge captures the text with 1.5s silence auto-submit, normalizes colloquial speech into standard architecture records, and plays back a spoken English confirmation. Every word dictated during architectural reviews is logged for Wispr Flow Insights.

---

## 3. Social Media Post Copy (#NoHandsChallenge)

*Copy and post this on X (Twitter) and LinkedIn to enter the Daily $100 Draw and showcase your project:*

```text
Built DevBridge for the #NoHandsChallenge by @WeMakeDevs × @WisprFlow 🚀

Problem: AI tools take 60-90s to generate code. We tab away, lose focus, and merge 60+ lines unread.

Solution: DevBridge turns the build wait into a spoken code review!
1. Detects landed git diff hunks
2. Cites exact file:line risk out loud
3. You answer by voice via Wispr Flow (Hindi/English)
4. Persists real ADR files directly into your repo!

Live Demo: https://wispr-five.vercel.app
Code: https://github.com/aiwithrajan/devbridge

Hands completely off the keyboard. The build wait, spent on the code you just got. 🎙️⚡
```

---

## 4. Verification Checklist Before Clicking Submit

- [x] Live Vercel app responds with HTTP 200: `https://wispr-five.vercel.app`
- [x] Public GitHub repo is active: `https://github.com/aiwithrajan/devbridge`
- [x] Git tags pushed: `v0.0-baseline`, `v0.1-skeleton`, `v0.2-demo`, `v0.5-evidence`
- [x] Wispr Insights card generated in `public/wispr-insights-card.svg`
- [x] 110s video recording script ready in `DEMO_SCRIPT.md`
