import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const modelUrl = process.env.COUNTERFEIT_MODEL_API_URL;
  if (!modelUrl) {
    return NextResponse.json({ error: "Currency-screening model is not deployed yet." }, { status: 503 });
  }

  try {
    const incoming = await request.formData();
    const image = incoming.get("image");
    if (!(image instanceof File) || !image.size) {
      return NextResponse.json({ error: "Attach a currency image to screen." }, { status: 400 });
    }
    if (!image.type.startsWith("image/") || image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Use an image file of 10 MB or smaller." }, { status: 400 });
    }

    const modelForm = new FormData();
    modelForm.append("image", image, image.name);
    const modelResponse = await fetch(`${modelUrl.replace(/\/$/, "")}/predict`, {
      method: "POST",
      body: modelForm,
      cache: "no-store",
    });
    const payload: unknown = await modelResponse.json().catch(() => null);
    if (!modelResponse.ok || !payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Currency-screening service could not process this image." }, { status: 502 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Counterfeit screening error:", error);
    return NextResponse.json({ error: "Currency screening failed." }, { status: 500 });
  }
}
