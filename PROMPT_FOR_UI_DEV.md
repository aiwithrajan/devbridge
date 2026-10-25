# PROMPT FOR FRONTEND / UI DEVELOPER

You are tasked with designing and implementing the complete frontend interface for **DevBridge** (a voice-first developer tool built with Next.js 16 App Router and Tailwind CSS).

The backend, file watchers, voice synthesizers, and git integrations are **100% already implemented and tested**. 
**Do NOT create or modify backend business logic.** Your task is solely to design and build the UI in `src/app/page.tsx` (and any modular components you wish to create) by connecting to the existing APIs, helpers, and data contracts detailed below. You have total creative freedom over the visual design, layout, styling, and aesthetic.

---

## 1. BACKEND API ROUTES & CONTRACTS

All API routes are located in `src/app/api/` and run locally on `http://localhost:3000` (and on Vercel serverless).

### Endpoint 1: Fetch Git Diff & Grounded Dilemma
* **Route:** `GET /api/diff`
* **Query Params:** `?mock=true` (optional, returns demo diff without reading local git)
* **Response Payload (`ParsedDiff`):**
```json
{
  "files": ["src/auth/rotate.ts", "src/auth/jwt.ts"],
  "linesAdded": 61,
  "linesRemoved": 8,
  "hunks": [
    {
      "file": "src/auth/rotate.ts",
      "startLine": 44,
      "endLine": 58,
      "lines": ["+ code lines..."]
    }
  ],
  "summary": "Antigravity modified authentication rotation across 2 files...",
  "risk": "Refresh handler accepts expired tokens if structurally valid without exp claim verification.",
  "anchor": "src/auth/rotate.ts:44-58",
  "severity": "critical", // "low" | "medium" | "high" | "critical"
  "question": "When a refresh token arrives past its expiration, should we strictly reject with 401, or allow a 60-second grace window?",
  "options": [
    "Strictly reject with 401 (forces client re-authentication)",
    "Allow a 60-second grace window to absorb network clock skew",
    "Store in Redis blacklist with immediate security telemetry"
  ],
  "why_now": "Merging this write path exposes session hijacking on expired client tokens."
}
```

---

### Endpoint 2: Persist Decision to Architecture Decision Record (ADR)
* **Route:** `POST /api/adr`
* **Request Payload:**
```json
{
  "title": "Reject expired refresh tokens instead of silently reissuing", // optional
  "context": "Why this decision was made...", // optional
  "decision": "Expired tokens are strictly rejected with 401 and the client must re-authenticate.", // REQUIRED
  "consequences": [ // optional
    "Token families cannot be extended indefinitely.",
    "Client prompts re-authentication on 401."
  ],
  "alternatives": [ // optional
    "Silent reissue with grace window — rejected"
  ],
  "anchors": ["src/auth/rotate.ts:44-58"], // optional
  "rawSpeech": "401 reject kardo client ko dobara login karna hoga", // optional (dictated text)
  "sessionId": "8f2c41a0" // optional
}
```
* **Response Payload:**
```json
{
  "success": true,
  "fileName": "0001-reject-expired-refresh-tokens-instead-of.md",
  "path": "docs/adr/0001-reject-expired-refresh-tokens-instead-of.md",
  "content": "# 0001 — Reject expired refresh tokens...\n\n## Context\n...\n\n## Decision\n...",
  "fileSavedOnDisk": true
}
```
* **Side Effects Handled by Backend:**
  - Creates the markdown file in `docs/adr/NNNN-slug.md`.
  - Appends to `.devbridge/decisions.jsonl`.
  - Appends to `.devbridge/metrics.jsonl`.
  - Appends rule to `CONSTRAINTS.md`.

---

### Endpoint 3: Audio Speech Output (Single-Voice & Overlap Protected)
* **Route:** `POST /api/speak` (or use `soundFX` helper in `src/lib/soundEffects.ts`)
* **Speak Payload:**
```json
{
  "text": "Your AI just wrote 61 lines of code...",
  "lang": "en" // "en" (Rishi en-IN voice) or "hi" (Lekha hi-IN voice)
}
```
* **Stop Payload:**
```json
{
  "action": "stop"
}
```
* **Behavior:**
  - On macOS, runs native Apple voice (`say -v Rishi`). Automatically terminates any previously running speech process so sounds never clash.
  - On cloud/Vercel, instructs client to use Web Speech API (`window.speechSynthesis`).

---

### Endpoint 4: Wispr Flow Cloud API Proxy
* **Route:** `POST /api/wispr`
* **Payload:** `{ "audio": "<base64_audio_string>", "language": "en" }`
* **Behavior:** Proxies to `https://platform-api.wisprflow.ai` when `WISPR_FLOW_API_KEY` is present.

---

### Endpoint 5: Real-Time File Watcher (SSE)
* **Route:** `GET /api/watcher`
* **Type:** Server-Sent Events stream (`text/event-stream`).
* **Events:**
  - `connected`: `{ status: "watching", directory: string, timestamp: number }`
  - `file_change`: `{ type: "modified" | "created", path: string, timestamp: number }`

---

## 2. CLIENT-SIDE HELPERS & CONTRACTS

### A. Sound & Speech Manager (`src/lib/soundEffects.ts`)
Import: `import { soundFX } from "@/lib/soundEffects";`
- `soundFX.speakAlert(text: string, lang?: "en" | "hi", onEnd?: () => void)`: Speaks text. Automatically cancels prior audio. Calls `onEnd` when speech finishes.
- `soundFX.stopSpeech()`: Immediately stops all speech across browser and native server processes.
- `soundFX.playAlert()`: Plays a quick chime sound.
- `soundFX.playRestored()`: Plays an audio confirmation success chord.
- `soundFX.unlockAudio()`: Unlocks browser AudioContext on first user interaction.

### B. Secret Redaction (`src/lib/redact.ts`)
Import: `import { redactSecrets } from "@/lib/redact";`
- `redactSecrets(diffString)`: Automatically redacts JWTs, Bearer tokens, DB connection strings, and API keys before displaying diffs.

### C. Zod Contracts (`src/lib/contracts.ts`)
Holds all schemas:
- `EmitBriefingSchema`
- `AskDecisionSchema`
- `WriteDecisionRecordSchema`
- `RecordSessionMetricSchema`
- Types: `BuildSession`, `Hunk`, `Decision`

---

## 3. VOICE INPUT CAPTURE BEHAVIOR (WISPR FLOW SPEC)

The input system accepts spoken answers in **Hindi, Hinglish, or English**:
1. **Desktop Wispr Flow App:** Developer holds the Wispr shortcut on their OS, speaks naturally, and Wispr types cleaned text into the active `<input>`.
2. **Browser Web Speech Fallback:** When clicking the mic button in-browser, use `webkitSpeechRecognition` with `recognition.lang = "en-IN"` (which transcribes Indian English, Hindi words, and Hinglish).
3. **1.5s Silence Auto-Submit:** After the user stops speaking (1.5 seconds of silence), automatically trigger decision submission without requiring keyboard clicks.
4. **Typed Fallback:** The user can also type and press Enter / click Submit. Both produce identical downstream behavior.

---

## 4. DATA THAT MUST BE PRESENT IN THE UI

Your UI must render and bind the following data points (arrange and style them however you see fit):

1. **Session Information:**
   - Session ID (e.g. `8f2c41a0`)
   - Changed files list
   - Lines added & lines removed
   - Exact anchor risk citation (`file:startLine-endLine`, e.g. `src/auth/rotate.ts:44-58`)
   - Severity level (`low`, `medium`, `high`, `critical`)
2. **Grounded Code Briefing:**
   - Briefing summary text
   - Specific risk explanation
   - Audio trigger to hear the briefing spoken out loud (with play/stop toggle)
   - Register toggle: `pro` vs `beginner` (changes technical depth of the briefing copy)
3. **The Architectural Decision Question:**
   - Exactly ONE question (never yes/no, forces a choice between trade-offs)
   - 2 to 4 suggested options
   - Free-form / voice dictation input area with recording state indicator
   - Auto-submit on 1.5s silence
4. **AI Voice Reply Card:**
   - When an answer is submitted, the AI speaks back in clear English confirming the decision
   - Displays the confirmation text with a "Replay Voice / Stop" button
5. **Persisted ADR (Architecture Decision Record):**
   - Shows live markdown content of the generated ADR
   - File path indicator (e.g. `docs/adr/0001-reject-expired-refresh-tokens.md`)
   - Export ADR (.md download) button
   - Indication that `CONSTRAINTS.md` was updated
6. **Session Timeline (FR-18):**
   - List of sessions: active, answered, and skipped (formatting diffs)
7. **Architecture Decision Graph / Map (FR-19):**
   - Nodes connecting file hunks $\rightarrow$ decisions $\rightarrow$ ADRs $\rightarrow$ prompt constraints
8. **Session Telemetry Metrics (FR-13):**
   - Wait time saved (ms / seconds)
   - Percentage of decisions captured
   - Average decision latency
   - Raw `.devbridge/metrics.jsonl` preview
9. **Shortcuts & Triggers (FR-02 & FR-15):**
   - `⌘⇧B` keyboard shortcut to inspect current uncommitted git diff via `GET /api/diff`
   - One-click trigger for the scripted 60-second judge simulation
