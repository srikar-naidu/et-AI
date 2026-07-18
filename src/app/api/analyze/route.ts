import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getGroqApiKey } from "@/lib/server-env";

const SYSTEM_PROMPT = `You are a real-time scam call analyzer embedded in a public safety system. You will receive a transcript of an ongoing phone call. Your job is to analyze it for signs of a "Digital Arrest" scam or any fraud/manipulation attempt.

Evaluate the transcript against these 4 threat vectors:
1. **Authority Impersonation**: Is the caller claiming to be from law enforcement, government, customs, a courier company (FedEx, DHL), a bank, or any official body?
2. **Urgency/Threat**: Is the caller creating artificial urgency, threatening arrest, legal action, account suspension, or any dire consequence?
3. **Isolation Tactics**: Is the caller telling the victim not to hang up, not to tell anyone, to stay alone, or to keep the conversation secret?
4. **Financial Extraction**: Is the caller asking for money transfers, security deposits, fees, gift cards, crypto, or any form of payment?

You MUST respond with ONLY a valid JSON object (no markdown, no code fences) in this exact format:
{
  "threat_level": <number 0-100>,
  "verdict": "<SAFE | SUSPICIOUS | DANGEROUS | CRITICAL>",
  "vectors": {
    "authority": { "detected": <boolean>, "evidence": "<exact quote or null>" },
    "urgency": { "detected": <boolean>, "evidence": "<exact quote or null>" },
    "isolation": { "detected": <boolean>, "evidence": "<exact quote or null>" },
    "financial": { "detected": <boolean>, "evidence": "<exact quote or null>" }
  },
  "summary": "<1-2 sentence plain English explanation of what's happening>"
}

Rules:
- If the transcript is casual friendly conversation, threat_level should be 0-10 and verdict SAFE.
- A single vector (e.g. just mentioning "police" in a normal context) should be 10-25 max.
- Two vectors together should be 40-60.
- Three or more vectors together is 75-100.
- Context matters hugely. Two friends joking about "don't hang up" is NOT isolation. A stranger saying "I am Inspector Sharma from CBI, do not disconnect this call" IS authority + isolation.
- Be precise with evidence quotes. Use the exact words from the transcript.`;

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || transcript.trim().length < 5) {
      return NextResponse.json({
        threat_level: 0,
        verdict: "SAFE",
        vectors: {
          authority: { detected: false, evidence: null },
          urgency: { detected: false, evidence: null },
          isolation: { detected: false, evidence: null },
          financial: { detected: false, evidence: null },
        },
        summary: "Insufficient audio data for analysis.",
      });
    }

    const apiKey = getGroqApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this live call transcript:\n\n"${transcript}"` },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from Groq");
    }

    const analysis = JSON.parse(content);
    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Groq API error:", error.message);
    return NextResponse.json(
      { error: "Analysis failed", details: error.message },
      { status: 500 }
    );
  }
}
