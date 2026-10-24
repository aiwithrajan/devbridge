# DevBridge — SDLC Recommendation

**Companion to:** `PRD.md` v1.0
**Date:** 25 October 2026
**Horizon:** 6 days, 22 hours to deadline (31 Oct, 23:59 IST)
**Team:** one person

---

## 1. What you are actually optimising for

Not "good software." You are optimising for a **judge who has ninety seconds and no context**, followed by a **demo video that must not lie**, followed by **an artifact that proves the loop ran**.

Those three things pull in a different direction than normal engineering. Normal engineering optimises for correctness under change over months. You need correctness under observation over six days.

That single sentence determines every process choice below.

**Constraints that are real:**
- One person. No code review, no parallel work, no handover.
- ~10 usable hours a day before quality collapses.
- The hero features (file watching, Apple voices) only exist on your Mac.
- The submission is a link, a video, a screenshot, and a paragraph. Nothing else is read.

**Constraints that are not real, but feel like it:**
- "The code should be clean." At this scale, the diff is read by judges, not maintained by a team.
- "I should finish all eight features." Eight features is the reason the last plan was incoherent.
- "I'll deploy at the end." Deploying at the end is how hackathon projects die on day six at 11pm.

---

## 2. Why the standard models don't fit

| Model | Fit | Verdict |
| :--- | :--- | :--- |
| **Waterfall** | Forces the spec freeze you badly need, then assumes requirements stop changing | Take the freeze, drop the rest |
| **Scrum** | Ceremony cost exceeds value at n=1; no sprint can absorb a two-day overrun in a six-day window | Reject |
| **Kanban** | Good flow, no forcing function toward "demoable" | Reject as primary |
| **Shape Up** | Six-week cycles, betting table, circuit breaker — right ideas, wrong scale | Borrow the circuit breaker only |
| **XP / TDD** | Test-first is genuinely useful for the ADR writer and diff parser; dogmatic coverage is not | Borrow selectively |
| **Demo-Driven Thin Slice** | Build only what the video script shows, in the order the script shows it | **Adopt** |

The reason DDTS wins here is blunt: **the judge only ever sees the script.** Anything not in the script is inventory. Inventory is what you feel productive about while losing.

---

## 3. The recommended model — Demo-Driven Thin Slice (DDTS)

### 3.1 Three rules

**Rule 1 — Write the video script on day zero.**
Not the storyboard, the script: the actual words, the actual order, the actual screen. Every task must be justified by a line in it. If a feature is not in the script, it is not in the build.

**Rule 2 — Deploy before you build.**
A public URL exists on day zero, showing an empty state. Every subsequent commit is visible to a stranger. This converts "will it deploy?" from a day-six catastrophe into a day-zero non-event, and it forces the hosted constraints (no `say`, no local watcher) into the design while they are still cheap to accommodate.

**Rule 3 — Every phase ends with a binary gate.**
Not "80% done." A gate is a stranger doing a thing and it working. If the gate is not green by end of day, the phase is not done and the next phase does not start. Scope gets cut, not the gate.

### 3.2 Why a thin slice rather than a horizontal build

A horizontal build finishes the database, then the API, then the UI, and has nothing demonstrable until day five. A thin slice takes one path — detect a build, show a briefing, write a file — through every layer on day one, ugly and hardcoded. It is demonstrable immediately, and every later day deepens a thing that already works.

At six days with one person, you cannot afford a day where nothing is demonstrable.

---

## 4. Phases and gates

### P0 — Freeze and deploy · Sun 25 Oct

| | |
| :--- | :--- |
| **Work** | Freeze `PRD.md`. Commit the 2,000 lines currently sitting untracked. Strip the camera and TensorFlow (FR-20). Deploy an empty shell to a public URL. |
| **Gate** | The URL loads on a phone, over cellular, and shows the empty state. |
| **Cut if late** | Nothing. This phase is non-negotiable; it costs half a day and prevents the most common failure mode. |

**Day-0 hygiene, in order:** commit what exists before changing anything, tag it `v0.0-baseline`, then strip. You currently have one commit from `create-next-app` and roughly 2,000 lines of untracked application code. That is the single largest technical risk in the project and it takes ten minutes to remove.

### P1 — Walking skeleton · Mon 26 Oct

| | |
| :--- | :--- |
| **Work** | Local agent emits a session. Template-only briefing (no LLM). Question, typed answer, ADR file written. No styling beyond readable. |
| **Gate** | You change three files in a real repo, and a correct ADR appears in `docs/adr/` without you touching the app. |
| **Cut if late** | Drop the local agent; use the manual `⌘⇧B` trigger only. |

The template engine comes first, not the LLM, because it is the fallback that keeps the demo alive when the network is not (PRD §7.4). Building it first means you are never blocked on a provider.

### P2 — Demo spine · Tue 27 Oct

| | |
| :--- | :--- |
| **Work** | The scripted 90-second session on the hosted URL: files writing, briefing appearing, question, scripted answer, ADR. All canned, all reliable. |
| **Gate** | A stranger opens the link, clicks once, and reaches the ADR without a word of explanation from you. |
| **Cut if late** | Cut the animated file-writing; show a static diff that reveals line by line. |

This is the phase that decides the submission. Everything after it is depth on a thing that already works.

### P3 — Real intelligence · Wed 28 Oct

| | |
| :--- | :--- |
| **Work** | LLM with the four tool schemas (PRD §7.3). Redaction. `write_decision_record` producing a real file. Two registers, two languages. |
| **Gate** | On a real diff, the briefing cites a line you did not tell it about, and answering writes a correct ADR. |
| **Cut if late** | Keep the LLM for the live path, keep canned responses for the demo, label both. |

### P4 — Hosted hardening · Thu 29 Oct

| | |
| :--- | :--- |
| **Work** | Pre-rendered audio. Judge-speaks. Degraded paths (LLM blocked, audio blocked, mic denied). Safari pass. Mobile layout. |
| **Gate** | Demo completes in Safari with the LLM host blocked and system audio muted. |
| **Cut if late** | Cut judge-speaks to a text input. Painful — it is the best ten seconds in the demo — but survivable. |

### P5 — Evidence · Fri 30 Oct

| | |
| :--- | :--- |
| **Work** | Five real sessions on a real repo. Export metrics. Screenshot the Wispr usage card. Shoot the video. |
| **Gate** | Video is under 2:00, unlisted, and every number in it exists in `metrics.jsonl`. |
| **Cut if late** | Fewer sessions. Never invent a number. |

Recording on Friday rather than Saturday is deliberate: it leaves Saturday for editing, uploading, and the submission form, which is where the last hour always goes wrong.

### P6 — Submit · Sat 31 Oct

| | |
| :--- | :--- |
| **Work** | Edit, upload unlisted, fill the four submission fields, final link check in an incognito window. |
| **Gate** | Submitted before 18:00 IST, six hours of buffer. |

---

## 5. Working practices

### 5.1 Version control

Trunk-based. `main` is always deployable and always what the URL serves.

- Work on `feat/x`, merge the same day, delete the branch. Long-lived branches at n=1 are just a way to lose work.
- Commit at least every 60 minutes of work. Small commits are your only undo.
- Tag each gate: `v0.0-baseline`, `v0.1-skeleton`, `v0.2-demo`, `v0.3-intelligence`, `v0.4-hosted`, `v0.5-evidence`, `v1.0-submitted`. The tag list is the project history a judge can actually read.
- Commit message names the requirement: `feat(FR-12): write ADR on decision`. Six days later this is how you know what is done.

### 5.2 Contract-first

One file, `src/lib/contracts.ts`, holds zod schemas for every request and response. Route handlers and components import from it. At one person this feels like overhead for about two hours, then it stops an entire class of bug that costs half a day to find.

The tool schemas in PRD §7.3 are already written — use them verbatim rather than re-deriving them.

### 5.3 Feature flags, not branches

```
DEMO_MODE=1      # scripted session, no agent, no key
LLM_ENABLED=0    # template fallback only
AUDIO=0          # text-only
```

The demo must run with all three off. This is not defensive programming, it is the submission requirement (FR-17). If a flag combination is broken, the demo is broken.

### 5.4 Definition of Done

A requirement is done when all five hold:

1. It runs from a clean clone with `npm i && npm run dev`.
2. It has the acceptance check from the PRD, performed and observed.
3. It survives with `LLM_ENABLED=0` if it touches the model.
4. It survives with `AUDIO=0` if it touches sound.
5. It is committed with the FR number in the message.

Anything less is "in progress," and in-progress work at 11pm on 31 October is worth zero.

### 5.5 Timeboxing

Work in 90-minute blocks with a hard stop. At the end of each block, write one line to `CUTLIST.md`: what you dropped and why. The cut list is not failure logging — it is the raw material for the video's honest segment, and it stops the slow bleed where one bug eats a day.

---

## 6. Test strategy, proportionate to the risk

Coverage percentage is the wrong target. The risk is not "a function is wrong," it is "the demo dies in front of a judge."

| Layer | What | Why |
| :--- | :--- | :--- |
| **One end-to-end test** | Playwright: load URL → demo session → ADR appears | This is the gate for P2 and P4. Run before every deploy. |
| **Three unit tests** | Diff parser, secret redactor, ADR writer (numbering, escaping, idempotence) | These fail silently and corrupt the one artifact you are claiming |
| **Manual matrix** | Chrome/Safari × audio on/off × LLM on/off × mic allowed/denied | 8 cells, 10 minutes, catches everything the tests cannot |
| **Stranger test** | One person, no context, no narration, at each gate | The only test that measures what judges measure |

Do not write tests for the UI components. They will change daily and the test will lag the design, which is worse than no test.

---

## 7. Risk register with kill criteria

A kill criterion is a pre-committed decision to abandon something. Deciding in advance is the only way to decide rationally at 2am.

| Risk | Trigger | Response | Kill criterion |
| :--- | :--- | :--- | :--- |
| Watcher misses the IDE's write pattern | No session after 3 real builds | Manual trigger becomes primary; add git polling | If not working by Tue 27 EOD, ship manual trigger only |
| LLM latency breaks the 6s budget | p95 > 8s over 10 runs | Cache by diff hash; pre-generate demo briefings | If still > 8s Wed EOD, demo uses canned responses only |
| Hosted audio sounds wrong | Any listener winces | Pre-rendered mp3 only, never live TTS in demo | If pre-render fails Thu, demo is text-only with captions |
| Question quality is generic | Cannot cite a line | Reject briefings without a valid anchor | If < 70% of briefings anchor correctly by Wed, template-only for the demo |
| Scope overrun | A gate misses by a full day | Cut the next phase's stretch, not its gate | If two gates missed, cut to P0–P2 and submit the reliable loop |
| Repo hygiene | Cannot clone and run | Stop feature work, fix immediately | Non-negotiable, same day |

The circuit breaker, borrowed from Shape Up: **if two consecutive gates fail, the project ships the P2 demo and nothing else.** A reliable 90-second loop with a real ADR beats a broken eight-feature platform every single time.

---

## 8. Daily rhythm

| Time | Ceremony | Duration |
| :--- | :--- | :--- |
| 09:00 | Self-standup: what shipped yesterday, what the gate is today, what is blocking | 15 min |
| 13:00 | Midday check: is the gate still reachable today? If not, cut now | 5 min |
| 18:30 | Gate check: perform the gate as a stranger would | 20 min |
| 21:30 | Commit, tag if a gate passed, one `CHANGELOG.md` line | 10 min |

**Challenge ceremony (weekly, required):** post progress with `#NoHandsChallenge`, tag WeMakeDevs and Wispr Flow, upload the Wispr usage card to the weekly check-in. This is a submission requirement, not marketing — missing check-ins is a self-inflicted wound.

**Usage discipline:** the leaderboard is a separate ₹1,00,000 prize decided purely on dictated words. Everything you write this week — prompts, commit messages, the video script, this document — should go through Wispr. It costs nothing extra and it is the cheapest second prize in the competition.

---

## 9. Submission pipeline

Work backwards from the form. Four required fields, one bonus.

| # | Item | Ready by | Check |
| :--- | :--- | :--- | :--- |
| 1 | Project link | P0 | Opens incognito, no sign-in, demo completes in under 2 minutes |
| 2 | Demo video ≤ 2:00 | P5 | Unlisted, audio audible on phone speakers, first 10 seconds show the loop |
| 3 | Wispr usage card | P5 | Screenshot from Insights, words legible |
| 4 | Problem / user / how Wispr was used | P6 | Three short paragraphs, no adjectives that cannot be verified |
| + | Social posts | ongoing | `#NoHandsChallenge`, both accounts tagged, link in weekly check-in |

**The video, in beats (110 seconds):**

| t | Beat |
| :--- | :--- |
| 0–12 | The wait, on screen. Files writing. No narration. |
| 12–35 | Briefing appears and speaks. One risk, one line cited. |
| 35–55 | The question. You answer out loud through Wispr. |
| 55–70 | The ADR appears in the editor, in the repo, in git. |
| 70–90 | Cut to the repo: three ADRs from real sessions, real dates. |
| 90–110 | One line on who it is for, one line on what you cut and why. |

Beat 70–90 is the one most entries will not have. It is the "one real result" the challenge asks for, and it is the difference between a demo and a product.

---

## 10. After the deadline

If it places, the interesting question is what survives contact with real users.

- **Keep:** the ADR loop, the two-register copy, the text-first default.
- **Drop:** the decision graph, the session timeline chrome, anything that made the demo look fuller than the product is.
- **Build next:** a VS Code extension so the watcher is not a separate process, and ADR-aware prompt injection so the next Cursor prompt literally reads the decisions.
- **Measure next:** ADR reuse rate. If decisions are written and never read, the loop did not close and the product is a very polite diary.

---

*DevBridge SDLC v1.0 · WeMakeDevs × Wispr Flow, No Hands Challenge · Track 1: Builders*
