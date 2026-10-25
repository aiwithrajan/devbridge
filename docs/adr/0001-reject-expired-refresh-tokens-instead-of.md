# 0001 — Reject expired refresh tokens instead of silently reissuing

- **Status:** accepted
- **Date:** 2026-10-25
- **Session:** 8f2c41a0
- **Anchors:** src/auth/rotate.ts:44-58
- **Spoken Input:** "Strictly reject with 401 (forces client re-authentication)" (Dictated via Wispr Flow)

## Context
Antigravity added a refresh handler that accepts any structurally valid token, including one that expired eight hours ago. Nothing in the write path checks exp.

## Decision
Expired tokens are strictly rejected with 401 and the client must re-authenticate. No silent reissue.

## Consequences
- Token families cannot be extended indefinitely by a malicious client.
- Client automatically prompts re-authentication on 401.
- rotate.ts now requires an explicit expiry test in the test suite.

## Alternatives considered
- Silent reissue with a short grace window — rejected: hides replay.
- Redis blacklist — deferred: adds infrastructure before proof of need.
