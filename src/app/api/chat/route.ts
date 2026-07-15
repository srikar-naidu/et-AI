import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const SYSTEM_PROMPT_TEMPLATE = `You are the Citizen Fraud Shield Assistant, an official conversational AI for the Digital Public Safety Command Center. 
Your job is to assist citizens who suspect they are being targeted by a scam, specifically digital arrests, phishing, or financial fraud.

Rules:
1. Be empathetic, authoritative, and calm.
2. If they mention threats of arrest from "CBI", "Customs", or "Police" over a phone/video call, firmly explain that NO official Indian agency arrests people over Skype/WhatsApp or asks for "security deposits" to avoid arrest. State clearly this is a "Digital Arrest Scam".
3. Ask for details like phone numbers or links they received so the system can "log" it.
4. Keep responses concise, easily readable in a small chat widget format (1-3 short paragraphs max).
5. Always advise them NOT to transfer any money and to disconnect the call/block the number.
6. Respond ONLY in the language selected by the user: {{LANGUAGE}}.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, language } = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const LANGUAGE_NAMES: Record<string, string> = {
      en: "English",
      hi: "Hindi",
      bn: "Bengali",
      te: "Telugu",
      ta: "Tamil",
      mr: "Marathi",
      gu: "Gujarati",
      kn: "Kannada",
      ml: "Malayalam",
      pa: "Punjabi",
      or: "Odia",
      as: "Assamese"
    };

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{{LANGUAGE}}", LANGUAGE_NAMES[language] || "English");

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 400,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    return NextResponse.json({ reply: content });
  } catch (error: any) {
    console.error("Chat API error:", error.message);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
