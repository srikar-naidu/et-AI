import { NextRequest, NextResponse } from "next/server";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

function readProviderResult(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const global = "global" in payload && payload.global && typeof payload.global === "object" ? payload.global as Record<string, unknown> : null;
  const result = typeof global?.result === "string" ? global.result.toLowerCase() : null;
  const confidence = typeof global?.confidence === "number" ? global.confidence : null;
  return result && confidence !== null ? { result, confidence } : null;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.AURIGIN_API_KEY;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Attach a non-empty audio file." }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio files must be 25 MB or smaller." }, { status: 413 });
    }

    // Try using Aurigin if we have an API key
    if (apiKey) {
      try {
        const providerForm = new FormData();
        providerForm.append("audio", file, file.name);
        const providerResponse = await fetch("https://api.aurigin.ai/v1/predict", {
          method: "POST",
          headers: { "x-api-key": apiKey },
          body: providerForm,
          cache: "no-store",
        });
        const payload: unknown = await providerResponse.json().catch(() => null);
        if (providerResponse.ok) {
          const analysis = readProviderResult(payload);
          if (analysis) {
            return NextResponse.json({ provider: "Aurigin", ...analysis });
          }
        }
      } catch (e) {
        console.warn("Aurigin failed, using fallback:", e);
      }
    }

    // Fallback: always return unknown if no api key or provider fails
    return NextResponse.json({ provider: "None", result: "unknown", confidence: 0.0 });
  } catch (error) {
    console.error("Deepfake screening error:", error);
    return NextResponse.json({ provider: "None", result: "unknown", confidence: 0.0 });
  }
}
