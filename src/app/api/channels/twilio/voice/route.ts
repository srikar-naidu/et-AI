import { NextRequest } from "next/server";
import { insertRow, isSupabaseConfigured } from "@/lib/supabase/server";
import { liveCallShieldTwiml, validateTwilioSignature, voiceTwiml } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  console.log("[Twilio Voice Webhook] Incoming request");
  
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl || !process.env.TWILIO_AUTH_TOKEN) {
    console.error("[Twilio Voice Webhook] Missing configuration: baseUrl or TWILIO_AUTH_TOKEN not set", { baseUrl, hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN });
    return new Response("Voice channel is not configured.", { status: 503 });
  }
  
  const values = await request.formData();
  const params = new URLSearchParams();
  values.forEach((value, key) => { if (typeof value === "string") params.append(key, value); });
  
  console.log("[Twilio Voice Webhook] Params received:", Object.fromEntries(params));
  
  if (!validateTwilioSignature(request, params)) {
    console.error("[Twilio Voice Webhook] Invalid Twilio signature");
    return new Response("Unauthorized request.", { status: 403 });
  }
  
  const callSid = params.get("CallSid");
  const destination = process.env.TWILIO_SHIELD_DESTINATION;
  const supabaseOk = isSupabaseConfigured();

  console.log("[Twilio Voice Webhook] Check:", { callSid, destination, supabaseOk });

  // When a destination is configured, this endpoint is a live call bridge rather
  // than the older IVR report flow. The caller is connected to the citizen while
  // Twilio forks both tracks to the transcription callback.
  if (destination && callSid && supabaseOk) {
    try {
      await insertRow("live_call_sessions", {
        call_sid: callSid,
        caller: params.get("From") ?? "Unknown caller",
        status: "ringing",
      });
      console.log("[Twilio Voice Webhook] Created live call session");
    } catch (error) {
      // Twilio retries webhooks. A duplicate CallSid is safe to ignore.
      console.warn("Could not create live call session:", error);
    }
    const twiml = liveCallShieldTwiml(`${baseUrl}/api/channels/twilio/voice/transcription`, destination);
    console.log("[Twilio Voice Webhook] Returning live call TwiML:", twiml);
    return new Response(
      twiml,
      { headers: { "Content-Type": "text/xml" } },
    );
  }
  const fallbackTwiml = voiceTwiml(`${baseUrl}/api/channels/twilio/voice/process`);
  console.log("[Twilio Voice Webhook] Returning fallback TwiML:", fallbackTwiml);
  return new Response(fallbackTwiml, { headers: { "Content-Type": "text/xml" } });
}
