import { NextRequest, NextResponse } from "next/server";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const AURIGIN_PREDICT_URL = "https://api.aurigin.ai/v1/predict";

type AuthenticityResult = "spoofed" | "real";

function normalizeResult(value: unknown): AuthenticityResult | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "spoofed" || normalized === "fake" || normalized === "synthetic") return "spoofed";
  if (normalized === "real" || normalized === "bonafide" || normalized === "genuine") return "real";
  return null;
}

function readProviderResult(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { ok: false as const, error: "Aurigin returned an empty response." };
  }

  const record = payload as Record<string, unknown>;
  const global =
    record.global && typeof record.global === "object"
      ? (record.global as Record<string, unknown>)
      : null;

  const warnings = Array.isArray(record.warnings)
    ? record.warnings.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const reason =
    typeof global?.reason === "string" && global.reason.trim()
      ? global.reason.trim()
      : warnings[0] ?? null;

  const result = normalizeResult(global?.result);
  const confidence = typeof global?.confidence === "number" ? global.confidence : null;

  if (!result || confidence === null) {
    return {
      ok: false as const,
      error:
        reason ??
        "Aurigin could not classify this audio. Use at least 3 seconds of clear speech (WAV/MP3 preferred; browser WebM is converted automatically).",
    };
  }

  return {
    ok: true as const,
    result,
    confidence,
    predictionId: typeof record.prediction_id === "string" ? record.prediction_id : null,
    model: typeof record.model === "string" ? record.model : null,
  };
}

function providerErrorMessage(status: number, payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
  }
  if (status === 401 || status === 403) return "Aurigin rejected the API key.";
  if (status === 400) return "Aurigin rejected the audio file. Try WAV or MP3.";
  if (status === 413) return "Audio file is too large for Aurigin.";
  return `Aurigin screening failed (HTTP ${status}).`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.AURIGIN_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        provider: "None",
        result: "unknown",
        confidence: null,
        error: "AURIGIN_API_KEY is not configured on the server.",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Attach a non-empty audio file." }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Audio files must be 25 MB or smaller." }, { status: 413 });
    }

    const audioBytes = await file.arrayBuffer();
    const providerForm = new FormData();
    // Aurigin v1 expects the multipart field name "file" (not "audio").
    providerForm.append(
      "file",
      new Blob([audioBytes], { type: file.type || "application/octet-stream" }),
      file.name || "voice-sample.wav",
    );

    const providerResponse = await fetch(AURIGIN_PREDICT_URL, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: providerForm,
      cache: "no-store",
    });

    const payload: unknown = await providerResponse.json().catch(() => null);

    if (!providerResponse.ok) {
      return NextResponse.json(
        {
          provider: "Aurigin",
          result: "unknown",
          confidence: null,
          error: providerErrorMessage(providerResponse.status, payload),
        },
        { status: 502 },
      );
    }

    const analysis = readProviderResult(payload);
    if (!analysis.ok) {
      return NextResponse.json(
        {
          provider: "Aurigin",
          result: "unknown",
          confidence: null,
          error: analysis.error,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      provider: "Aurigin",
      result: analysis.result,
      confidence: analysis.confidence,
      predictionId: analysis.predictionId,
      model: analysis.model,
    });
  } catch (error) {
    console.error("Deepfake screening error:", error);
    return NextResponse.json(
      {
        provider: "Aurigin",
        result: "unknown",
        confidence: null,
        error: "Voice-authenticity screening could not reach Aurigin.",
      },
      { status: 502 },
    );
  }
}
