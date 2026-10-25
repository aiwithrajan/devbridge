# DevBridge — Demo Video Script (110 Seconds)

> **Format:** Under 2:00 minutes (110s target). Unlisted YouTube link for hackathon submission.  
> **Rule:** Every metric quoted must exist in `.devbridge/metrics.jsonl`. No hands on keyboard during voice interaction.

---

### ⏱️ Timeline & Shot List

#### 0:00 – 0:12 | The Build Wait (Visual Tension)
- **Visual:** Cursor or Antigravity window actively writing files. Progress spinner turning. 
- **Audio:** Silence or ambient mechanical typing sounds.
- **On Screen:** Developer leans back in chair, hands completely off the keyboard.
- **Voiceover:** None. Let the judge feel the empty 60-second wait that every AI developer experiences.

#### 0:12 – 0:35 | The Grounded Briefing
- **Visual:** DevBridge window automatically pops up (or is tiled side-by-side).
- **Audio (DevBridge speaks in crisp English):**  
  > *"Your AI just wrote 61 lines across auth files. Critical vulnerability at rotate.ts line 44: the refresh handler accepts expired tokens without checking the exp claim."*
- **Visual:** Card highlights line `src/auth/rotate.ts:44-58` with a red badge.
- **Voiceover (Developer):**  
  > *"Instead of checking my phone, DevBridge turns the wait into a code briefing grounded in the exact line that can break production."*

#### 0:35 – 0:55 | The One Question (The Dilemma)
- **Visual:** DevBridge displays **2. Exactly One Decision Question**:
  > *"When a refresh token arrives past its expiration, should we strictly reject with 401, or allow a 60-second grace window?"*
- **Voiceover (Developer):**  
  > *"It asks exactly ONE question that forces an architectural choice before the code merges."*

#### 0:55 – 1:15 | The Wispr Voice Dictation (Hands-Free)
- **Visual:** Camera zooms on developer's hands resting on the desk (not touching the keyboard). Developer holds Wispr shortcut.
- **Audio (Developer speaks naturally in Hindi/English):**  
  > *"401 reject kardo, client ko dobara login karna chahiye."*
- **Visual:** Wispr Flow captures the speech instantly into the input box.
- **Visual:** 1.5s of silence passes. The input auto-submits with a subtle chime.
- **Audio (DevBridge confirms):**  
  > *"Architecture decision accepted: Expired tokens will strictly return 401. ADR 0001 committed to repository."*

#### 1:15 – 1:35 | The Trace (Persistence into Git)
- **Visual:** Show VS Code file explorer. A new file has appeared in real time:
  - `docs/adr/0001-reject-expired-refresh-tokens.md`
- **Visual:** Show `CONSTRAINTS.md` updated with the new rule.
- **Voiceover (Developer):**  
  > *"Every decision produces an Architecture Decision Record in the repository. The next Cursor prompt inherits these constraints, so the AI never repeats the same mistake."*

#### 1:35 – 1:50 | Telemetry & Multi-View Graph
- **Visual:** Click over to the **Decision Graph** and **Metrics** tab:
  - Total wait saved: **351s** across 5 sessions
  - Decisions captured: **100%**
  - Average latency: **3.8s**
- **Voiceover (Developer):**  
  > *"In 5 real sessions, DevBridge turned 351 seconds of empty waiting into vetted, permanent architectural decisions."*

#### 1:50 – 1:58 | Close
- **Visual:** DevBridge logo with Wispr Flow badge and GitHub repo link.
- **Voiceover (Developer):**  
  > *"DevBridge: The build wait, spent on the code you just got. Built with Wispr Flow for the No Hands Challenge."*
