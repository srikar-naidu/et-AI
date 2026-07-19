import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/counterfeit
 *
 * Accepts a currency image and forwards it to an optional external ML
 * service (COUNTERFEIT_MODEL_API_URL).  When the external service is
 * unreachable or not configured, returns a structured response
 * instructing the client to use the browser-native analysis engine.
 *
 * The heavy-lifting CV analysis (microprint, security thread, serial
 * number, UV features) runs entirely client-side via Canvas API and
 * does not depend on this route.
 */
export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData();
    const image = incoming.get("image");
    if (!(image instanceof File) || !image.size) {
      return NextResponse.json(
        { error: "Attach a currency image to screen." },
        { status: 400 },
      );
    }
    if (!image.type.startsWith("image/") || image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Use an image file of 10 MB or smaller." },
        { status: 400 },
      );
    }

    const modelUrl = process.env.COUNTERFEIT_MODEL_API_URL;

    // Try the external ML service first
    if (modelUrl) {
      try {
        const modelForm = new FormData();
        modelForm.append("image", image, image.name);
        const modelResponse = await fetch(
          `${modelUrl.replace(/\/$/, "")}/predict`,
          {
            method: "POST",
            body: modelForm,
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
          },
        );
        const payload: unknown = await modelResponse.json().catch(() => null);
        if (modelResponse.ok && payload && typeof payload === "object") {
          return NextResponse.json({
            source: "external_ml_model",
            ...(payload as Record<string, unknown>),
          });
        }
      } catch {
        // External service unreachable — fall through
      }
    }

    // No external service — client-side engine handles the analysis
    return NextResponse.json({
      source: "client_analysis_required",
      message:
        "No external ML model configured. Use the client-side analysis engine.",
      disclaimer:
        "This screening tool is an aid and does not replace authentication by a trained examiner.",
    });
  } catch (error) {
    console.error("Counterfeit screening error:", error);
    return NextResponse.json(
      { error: "Currency screening failed." },
      { status: 500 },
    );
  }
}
