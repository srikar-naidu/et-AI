import { NextRequest } from "next/server";
import { validateTwilioSignature, voiceTwiml } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl || !process.env.TWILIO_AUTH_TOKEN) {
    return new Response("Voice channel is not configured.", { status: 503 });
  }
  const values = await request.formData();
  const params = new URLSearchParams();
  values.forEach((value, key) => { if (typeof value === "string") params.append(key, value); });
  if (!validateTwilioSignature(request, params)) {
    return new Response("Unauthorized request.", { status: 403 });
  }
  return new Response(voiceTwiml(`${baseUrl}/api/channels/twilio/voice/process`), { headers: { "Content-Type": "text/xml" } });
}
