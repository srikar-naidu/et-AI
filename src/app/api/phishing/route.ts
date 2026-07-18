import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getGroqApiKey } from "@/lib/server-env";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid content payload" }, { status: 400 });
    }

    const apiKey = getGroqApiKey();

    if (apiKey) {
      try {
        const groq = new Groq({ apiKey });
        const systemPrompt = `You are a cybersecurity phishing analysis engine. 
Analyze the following text message or URL.
Extract the following information and return ONLY a raw JSON object (no markdown, no backticks, just the JSON string).
Format:
{
  "domainAge": "e.g., 2 Days Old or N/A",
  "location": "e.g., St. Petersburg, RU or N/A",
  "threatType": "e.g., Impersonation, Credential Harvesting",
  "urgencyLevel": "High, Medium, or Low",
  "explanation": "A 1-2 sentence explanation of the deceptive tactic used."
}`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_tokens: 300,
        });

        const reply = chatCompletion.choices[0]?.message?.content || "";
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (parsed) {
          return NextResponse.json(parsed);
        }
      } catch (error) {
        console.error("Groq phishing analysis error:", error);
        // Fall back to mock if Groq fails (e.g. invalid key)
      }
    }

    // DEMO FALLBACK (if Groq fails or key is missing)
    let domainAge = "N/A";
    let location = "N/A";
    let threatType = "Suspicious Link / Social Engineering";
    let urgencyLevel = "High";
    let explanation = "The message employs psychological manipulation or suspicious links.";

    if (content.toLowerCase().includes("hdfc") || content.toLowerCase().includes("kyc")) {
      domainAge = "Just created (1 hour ago)";
      location = "Mumbai, IN (Masked via VPN)";
      threatType = "Banking Credential Harvesting";
      urgencyLevel = "Critical";
      explanation = "This is a classic KYC update scam designed to steal your banking credentials. Real banks never send generic suspension threats via SMS.";
    } else if (content.toLowerCase().includes("cbi") || content.toLowerCase().includes("arrest")) {
      domainAge = "N/A";
      location = "Noida, UP (Suspected Call Center)";
      threatType = "Digital Arrest Extortion";
      urgencyLevel = "Critical";
      explanation = "Law enforcement agencies do not threaten arrest over digital messages or demand security deposits.";
    } else if (content.includes("http")) {
      domainAge = "2 Days Old";
      location = "St. Petersburg, RU";
      threatType = "Phishing Payload";
      urgencyLevel = "High";
      explanation = "The embedded URL directs to a newly registered, unverified domain attempting to spoof a legitimate service.";
    }

    return NextResponse.json({
      domainAge,
      location,
      threatType,
      urgencyLevel,
      explanation,
      mode: "demo_fallback"
    });

  } catch (error: any) {
    console.error("Phishing API error:", error.message);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
