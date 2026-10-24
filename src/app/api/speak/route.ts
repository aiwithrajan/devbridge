import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

// Native macOS Speech Endpoint: Uses Apple's built-in Indian voices (Lekha for Hindi, Rishi for Indian English)
export async function POST(req: NextRequest) {
  try {
    const { text, lang = "hi" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Sanitize input to prevent shell injection
    const cleanText = text.replace(/["`$\\]/g, "");

    // Pick voice: Lekha for pure Hindi, Rishi for Indian English
    const voice = lang === "hi" ? "Lekha" : "Rishi";

    // Execute macOS native speech command
    exec(`say -v ${voice} "${cleanText}"`, (error) => {
      if (error) {
        console.error("macOS say error:", error);
      }
    });

    return NextResponse.json({ success: true, voice, text: cleanText });
  } catch (error) {
    console.error("Speak API error:", error);
    return NextResponse.json({ error: "Failed to trigger speech" }, { status: 500 });
  }
}
