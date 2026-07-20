import { NextRequest } from "next/server";
import { insertRow, isSupabaseConfigured } from "@/lib/supabase/server";
import { liveCallShieldTwiml, validateTwilioSignature, voiceTwiml } from "@/lib/twilio";

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
  const callSid = params.get("CallSid");
  const destination = process.env.TWILIO_SHIELD_DESTINATION;

  // When a destination is configured, this endpoint is a live call bridge rather
  // than the older IVR report flow. The caller is connected to the citizen while
  // Twilio forks both tracks to the transcription callback.
  if (destination && callSid && isSupabaseConfigured()) {
    try {
      await insertRow("live_call_sessions", {
        call_sid: callSid,
        caller: params.get("From") ?? "Unknown caller",
        status: "ringing",
      });
    } catch (error) {
      // Twilio retries webhooks. A duplicate CallSid is safe to ignore.
      console.warn("Could not create live call session:", error);
    }
    return new Response(
      liveCallShieldTwiml(`${baseUrl}/api/channels/twilio/voice/transcription`, destination),
      { headers: { "Content-Type": "text/xml" } },
    );
  }
  return new Response(voiceTwiml(`${baseUrl}/api/channels/twilio/voice/process`), { headers: { "Content-Type": "text/xml" } });
}
