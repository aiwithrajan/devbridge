import { NextRequest, NextResponse, connection } from "next/server";
import { exec } from "child_process";

// Native macOS Speech Endpoint: Uses Apple's built-in Indian voices (Rishi for Indian English, Lekha for Hindi)
// Prevents overlapping audio by immediately cancelling any prior speech process before starting a new one.

export async function POST(req: NextRequest) {
  await connection();
  try {
    const body = await req.json();
    const { text, lang = "en", action } = body;

    // Handle explicit stop action
    if (action === "stop") {
      if (process.platform === "darwin") {
        exec("killall say 2>/dev/null || true");
      }
      return NextResponse.json({ success: true, stopped: true });
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Sanitize input to prevent shell injection
    const cleanText = text.replace(/["`$\\]/g, "");

    // On local macOS, kill any previous speaking process first, then speak
    if (process.platform === "darwin") {
      const voice = lang === "hi" ? "Lekha" : "Rishi";

      // Step 1: Kill previous 'say' process so audio never overlaps
      exec("killall say 2>/dev/null || true", () => {
        // Step 2: Spawn new single 'say' process
        exec(`say -v ${voice} "${cleanText}"`, (error) => {
          if (error && error.killed) return;
        });
      });

      return NextResponse.json({ success: true, localAudio: true, voice, text: cleanText });
    }

    // On Linux/Cloud hosting (e.g. Vercel), notify client to synthesize audio in-browser
    return NextResponse.json({
      success: true,
      localAudio: false,
      text: cleanText,
      message: "Serverless environment detected; fallback to client speech synthesis.",
    });
  } catch (error) {
    console.error("Speak API error:", error);
    return NextResponse.json({ error: "Failed to trigger speech" }, { status: 500 });
  }
}

export async function DELETE() {
  await connection();
  if (process.platform === "darwin") {
    exec("killall say 2>/dev/null || true");
  }
  return NextResponse.json({ success: true, stopped: true });
}
