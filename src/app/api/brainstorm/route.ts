import { NextRequest, NextResponse } from "next/server";

export interface BrainstormRequest {
  action: "recap_and_challenge" | "process_voice_reply" | "classify_profile";
  currentTaskTitle?: string;
  recentFiles?: string[];
  userSpokenInput?: string;
  userPromptHistory?: string[];
  voiceLang?: "hi" | "en";
}

export async function POST(req: NextRequest) {
  try {
    const body: BrainstormRequest = await req.json();
    const { 
      action, 
      currentTaskTitle = "Authentication Module", 
      recentFiles = ["src/auth/jwt.ts"], 
      userSpokenInput, 
      userPromptHistory = [],
      voiceLang = "hi"
    } = body;

    // Classify Developer Profile
    let isPro = false;
    const historyText = userPromptHistory.join(" ").toLowerCase();
    const technicalKeywords = ["redis", "ttl", "jwt", "zod", "prisma", "race condition", "exponential backoff", "docker", "schema", "middleware", "latency"];
    const matchedKeywords = technicalKeywords.filter(k => historyText.includes(k));
    if (matchedKeywords.length >= 2 || historyText.includes("use ") || historyText.includes("implement ")) {
      isPro = true;
    }

    if (action === "classify_profile") {
      return NextResponse.json({
        experienceTier: isPro ? "experienced_pro" : "curious_beginner",
        toneMode: isPro ? "peer_architect" : "friendly_mentor",
      });
    }

    // Recap Previous Workflow + Generate Brainstorm Challenge
    if (action === "recap_and_challenge") {
      if (voiceLang === "hi") {
        // Natural Hindi for Lekha voice
        if (isPro) {
          return NextResponse.json({
            experienceTier: "experienced_pro",
            toneMode: "peer_architect",
            recap: `पिछले स्टेप में हमने JWT वेरिफिकेशन मिडलवेयर वायर कर दिया है (${recentFiles.slice(0, 2).join(", ")})।`,
            challenge: `लेकिन अब आगे सोचो: जब टोकन एक्सपायर होगा, तो रिवोकेशन के लिए रेडिस ब्लैकलिस्ट यूज़ करें या डिस्ट्रीब्यूटेड ब्लूम फिल्टर? तुम्हारा क्या टेक है?`,
            suggestedOptions: [
              "रेडिस ब्लैकलिस्ट (7 दिन TTL)",
              "शॉर्ट-लिव्ड टोकन रोटेशन",
              "डिस्ट्रीब्यूटेड ब्लूम फिल्टर"
            ]
          });
        } else {
          return NextResponse.json({
            experienceTier: "curious_beginner",
            toneMode: "friendly_mentor",
            recap: `फोन नीचे रखो! समझ लो कि तुम्हारा लॉगिन कैसे काम कर रहा है: बैकएंड ने एक सिक्योर डिजिटल गेट-पास यानी JWT जनरेट किया है।`,
            challenge: `अब अगले स्टेप में यूजर को प्रोफाइल देखनी है। क्या लगता है, हर रिक्वेस्ट में ये टोकन चेक होना चाहिए या डेटाबेस से बार-बार पासवर्ड चेक करें? बोलो माइक में!`,
            suggestedOptions: [
              "हर रिक्वेस्ट में टोकन चेक करो (फास्ट)",
              "डेटाबेस में सेशन रखो (सिंपल)",
              "दोनों का कॉम्बिनेशन"
            ]
          });
        }
      } else {
        // Natural Indian English for Rishi voice
        if (isPro) {
          return NextResponse.json({
            experienceTier: "experienced_pro",
            toneMode: "peer_architect",
            recap: `In the previous step, we wired up the JWT verification middleware (${recentFiles.slice(0, 2).join(", ")}).`,
            challenge: `Now for the next step: When tokens expire, should we use a Redis blacklist with a 7-day TTL, or a distributed bloom filter? What's your take?`,
            suggestedOptions: [
              "Redis blacklist with 7-day TTL",
              "Short-lived token rotation",
              "Distributed bloom filter in Redis cluster"
            ]
          });
        } else {
          return NextResponse.json({
            experienceTier: "curious_beginner",
            toneMode: "friendly_mentor",
            recap: `Put your phone down! Understand how your login works: The backend generated a secure digital gate-pass called a JWT.`,
            challenge: `Now in the next step, the user wants to view their profile. Should we verify this token on every request, or re-check the password in the database? Speak into the mic!`,
            suggestedOptions: [
              "Verify token on every request (Fast)",
              "Store session in database (Simple)",
              "Hybrid approach"
            ]
          });
        }
      }
    }

    // Process Spoken Voice Reply
    if (action === "process_voice_reply") {
      const speech = (userSpokenInput || "").toLowerCase();
      let aiFeedback = "";
      let newArchitectureNode = "";

      if (speech.includes("redis") || speech.includes("token") || speech.includes("fast") || speech.includes("रेडिस") || speech.includes("टोकन")) {
        if (voiceLang === "hi") {
          aiFeedback = isPro
            ? "बिल्कुल सही! रेडिस इन-मेमोरी लूकअप सुपर-फास्ट टाइम देता है, डेटाबेस पर फालतू लोड नहीं पड़ेगा। आर्किटेक्चर अपडेट हो गया!"
            : "शाबाश! बिल्कुल सही सोचा। टोकन वेरीफाई करने से वेबसाइट सुपर-फास्ट रहेगी। तुम्हारा आर्किटेक्चर डायग्राम अपडेट हो गया!";
        } else {
          aiFeedback = isPro
            ? "Spot on! Redis in-memory lookup gives O(1) performance and keeps zero load on your SQL database. Architecture updated!"
            : "Great job! That's exactly right. Verifying tokens keeps the web app super responsive. Your architecture diagram is updated!";
        }
        newArchitectureNode = "Redis In-Memory Token Validator";
      } else {
        if (voiceLang === "hi") {
          aiFeedback = "तुम्हारा थॉट बिल्कुल प्रैक्टिकल है! इसको सिस्टम फ्लो में ऐड कर दिया गया है।";
        } else {
          aiFeedback = "Solid architectural decision! Added to your live system flow.";
        }
        newArchitectureNode = "Dynamic Resilience Middleware";
      }

      return NextResponse.json({
        success: true,
        aiSpokenResponse: aiFeedback,
        newArchitectureNode,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Brainstorm API error:", error);
    return NextResponse.json({ error: "Failed to process brainstorming request" }, { status: 500 });
  }
}
