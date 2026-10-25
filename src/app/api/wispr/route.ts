import { NextRequest, NextResponse, connection } from "next/server";

// Wispr Flow Voice Interface API integration
// Uses official https://platform-api.wisprflow.ai when WISPR_FLOW_API_KEY is configured
export async function POST(req: NextRequest) {
  await connection();
  try {
    const apiKey = process.env.WISPR_FLOW_API_KEY;

    const contentType = req.headers.get("content-type") || "";
    let audioBase64 = "";
    let language = "en";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      audioBase64 = body.audio || "";
      language = body.language || "en";
    } else {
      // Form data or buffer
      const formData = await req.formData();
      const file = formData.get("audio") as Blob | null;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        audioBase64 = Buffer.from(arrayBuffer).toString("base64");
      }
    }

    if (!audioBase64) {
      return NextResponse.json({ error: "Audio payload is required" }, { status: 400 });
    }

    // If Wispr Flow API key is present, proxy to official Wispr Flow Voice Interface
    if (apiKey) {
      try {
        const wisprRes = await fetch("https://platform-api.wisprflow.ai/api/v1/dash/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            audio: audioBase64,
            context: {
              domain: "software_engineering",
              language,
              task: "architecture_decision",
            },
          }),
        });

        if (wisprRes.ok) {
          const data = await wisprRes.json();
          return NextResponse.json({
            success: true,
            provider: "wispr_flow_api",
            transcript: data.text || data.transcript || "",
          });
        } else {
          console.warn("Wispr Flow API responded with non-200:", wisprRes.status);
        }
      } catch (err) {
        console.warn("Wispr Flow API network error:", err);
      }
    }

    // Graceful fallback response when API key is not yet set
    return NextResponse.json({
      success: true,
      provider: "wispr_flow_client_mode",
      message: "Wispr Flow desktop app or Web Speech API active. Add WISPR_FLOW_API_KEY to .env for cloud API.",
    });
  } catch (error) {
    console.error("Wispr API route error:", error);
    return NextResponse.json({ error: "Failed to process Wispr audio" }, { status: 500 });
  }
}
