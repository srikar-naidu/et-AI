import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Groq Whisper transcription
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      prompt: "Specify context or spelling", // Optional
      response_format: "json", // Optional
      language: "en", // Optional
      temperature: 0.0, // Optional
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("Transcription API error:", error.message);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
