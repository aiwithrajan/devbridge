import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

// Native macOS Speech Endpoint: Uses Apple's built-in Indian voices (Rishi for Indian English, Lekha for Hindi)
export async function POST(req: NextRequest) {
  try {
    const { text, lang = "en" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Sanitize input to prevent shell injection
    const cleanText = text.replace(/["`$\\]/g, "");

    // On local macOS, execute Apple's native speech command
    if (process.platform === "darwin") {
      const voice = lang === "hi" ? "Lekha" : "Rishi";
      exec(`say -v ${voice} "${cleanText}"`, (error) => {
        if (error) {
          console.error("macOS say error:", error);
        }
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
