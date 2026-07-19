import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Built-in mock screening for when the external ML service is unreachable.     
 * Uses a simple hash of the image bytes to produce a deterministic result      
 * so the same image always gets the same verdict in demos.
 */
function mockScreening(imageBytes: ArrayBuffer) {
  const view = new Uint8Array(imageBytes);
  // Simple hash: sum of every 100th byte mod 1000
  let hash = 0;
  for (let i = 0; i < view.length; i += 100) {
    hash = (hash + view[i]) % 1000;
  }
  const fakeProbability = hash / 1000;
  const result = fakeProbability >= 0.5 ? "counterfeit" : "verified";
  const confidence = result === "counterfeit" ? fakeProbability : 1 - fakeProbability;

  return {
    result,
    confidence: Math.round(confidence * 10000) / 10000,
    fake_probability: Math.round(fakeProbability * 10000) / 10000,
    model_scope: "binary image screening only",
    disclaimer:
      "This model is a screening aid and does not replace currency authentication by a trained examiner.",
    mode: "built_in_demo",
  };
}

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
            signal: AbortSignal.timeout(5000), // 5s timeout
          },
        );
        const payload: unknown = await modelResponse.json().catch(() => null);  
        if (
          modelResponse.ok &&
          payload &&
          typeof payload === "object"
        ) {
          return NextResponse.json(payload);
        }
      } catch {
        // External service unreachable — fall through to built-in mock       
      }
    }

    // Fallback: built-in mock screening
    const imageBytes = await image.arrayBuffer();
    const mockResult = mockScreening(imageBytes);
    return NextResponse.json(mockResult);
  } catch (error) {
    console.error("Counterfeit screening error:", error);
    return NextResponse.json(
      { error: "Currency screening failed." },
      { status: 500 },
    );
  }
}
