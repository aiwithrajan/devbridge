import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// API Route: Persist ADR and append to .devbridge/decisions.jsonl
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title = "Reject expired refresh tokens instead of silently reissuing",
      context = "Antigravity added a refresh handler that accepts any structurally valid token, including one that expired eight hours ago. Nothing in the write path checks exp.",
      decision,
      consequences = [
        "Token families cannot be extended indefinitely by a malicious client.",
        "Client automatically prompts re-authentication on 401.",
        "rotate.ts now requires an explicit expiry test in the test suite.",
      ],
      alternatives = [
        "Silent reissue with a short grace window — rejected: hides replay.",
        "Redis blacklist — deferred: adds infrastructure before proof of need.",
      ],
      anchors = ["src/auth/rotate.ts:44-58"],
      rawSpeech = "",
      sessionId = "8f2c41a0",
    } = body;

    if (!decision) {
      return NextResponse.json({ error: "Decision text is required" }, { status: 400 });
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);

    const fileName = `0001-${slug}.md`;
    const adrRelativePath = `docs/adr/${fileName}`;

    const adrContent = `# 0001 — ${title}

- **Status:** accepted
- **Date:** ${dateStr}
- **Session:** ${sessionId}
- **Anchors:** ${anchors.join(", ")}
${rawSpeech ? `- **Spoken Input:** "${rawSpeech}" (Dictated via Wispr Flow)\n` : ""}
## Context
${context}

## Decision
${decision}

## Consequences
${consequences.map((c: string) => `- ${c}`).join("\n")}

## Alternatives considered
${alternatives.map((a: string) => `- ${a}`).join("\n")}
`;

    // Try writing to local repo disk
    let fileSavedOnDisk = false;
    try {
      const adrDir = path.join(process.cwd(), "docs", "adr");
      if (!fs.existsSync(adrDir)) {
        fs.mkdirSync(adrDir, { recursive: true });
      }
      fs.writeFileSync(path.join(adrDir, fileName), adrContent, "utf8");

      // Append to .devbridge/decisions.jsonl (FR-12)
      const dotDevbridgeDir = path.join(process.cwd(), ".devbridge");
      if (!fs.existsSync(dotDevbridgeDir)) {
        fs.mkdirSync(dotDevbridgeDir, { recursive: true });
      }
      const record = {
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        adr_path: adrRelativePath,
        decision,
        spoken_input: rawSpeech,
      };
      fs.appendFileSync(
        path.join(dotDevbridgeDir, "decisions.jsonl"),
        JSON.stringify(record) + "\n",
        "utf8"
      );

      // Append to .devbridge/metrics.jsonl (FR-13)
      const metric = {
        session_id: sessionId,
        wait_ms: 60000,
        decision_captured: true,
        timestamp: new Date().toISOString(),
      };
      fs.appendFileSync(
        path.join(dotDevbridgeDir, "metrics.jsonl"),
        JSON.stringify(metric) + "\n",
        "utf8"
      );

      fileSavedOnDisk = true;
    } catch (diskErr) {
      console.warn("Could not write to local disk (likely read-only serverless environment):", diskErr);
    }

    return NextResponse.json({
      success: true,
      fileName,
      path: adrRelativePath,
      content: adrContent,
      fileSavedOnDisk,
    });
  } catch (error) {
    console.error("ADR write error:", error);
    return NextResponse.json({ error: "Failed to save ADR" }, { status: 500 });
  }
}
