import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getGroqApiKey } from "@/lib/server-env";
import { getClusterGraph } from "@/lib/fraud-intelligence";
import { loadFraudGraph } from "@/lib/fraud-data";

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
    const { messages, language, clusterId } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return NextResponse.json({ error: "Provide between 1 and 30 chat messages." }, { status: 400 });
    }

    const graphContext = typeof clusterId === "string" ? getClusterGraph(await loadFraudGraph(), clusterId) : null;

    const apiKey = getGroqApiKey();
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

    const clusterPrompt = graphContext
      ? `\n\nYou are additionally assisting an investigator with the selected fraud cluster. Use only these verified facts. Do not invent names, transactions, or legal conclusions. Say when the data is insufficient.\nCluster: ${graphContext.cluster.id}\n${graphContext.cluster.summary}\nEntities: ${graphContext.nodes.map((node) => `${node.label} (${node.type}, risk ${node.riskScore})`).join("; ")}\nRelationships: ${graphContext.links.map((link) => `${link.source} -> ${link.target}: ${link.type}${link.amount ? ` INR ${link.amount}` : ""}${link.flagged ? " [flagged]" : ""}`).join("; ")}`
      : "";
    const systemPrompt = graphContext
      ? `You are the Fraud Network Intelligence Agent for an authorised investigator. Produce a concise, formal forensic narrative in ${LANGUAGE_NAMES[language] || "English"}. Explain linkages, transactions, and risk signals from the verified cluster facts only. Do not claim guilt, make legal conclusions, or invent evidence.${clusterPrompt}`
      : SYSTEM_PROMPT_TEMPLATE.replace("{{LANGUAGE}}", LANGUAGE_NAMES[language] || "English");

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
