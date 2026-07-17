import { NextRequest } from "next/server";
import { insertRow, isSupabaseConfigured } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/twilio";

const responseXml = (message: string) => `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${message}</Say></Response>`;

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return new Response(responseXml("Secure case storage is not configured."), { status: 503, headers: { "Content-Type": "text/xml" } });
  const values = await request.formData();
  const params = new URLSearchParams();
  values.forEach((value, key) => { if (typeof value === "string") params.append(key, value); });
  if (!validateTwilioSignature(request, params)) return new Response(responseXml("Unauthorized request."), { status: 403, headers: { "Content-Type": "text/xml" } });

  const transcript = params.get("SpeechResult")?.trim() ?? "";
  if (!transcript) return new Response(responseXml("We did not receive a report. Please call again if you need help."), { headers: { "Content-Type": "text/xml" } });

  try {
    const createdCase = await insertRow("cases", {
      case_number: `IVR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      title: "Voice citizen report",
      status: "open",
      severity: 2,
      source: "twilio_voice",
    }) as unknown as { id: string; case_number: string };
    await insertRow("audit_events", {
      case_id: createdCase.id,
      event_type: "channel.voice.received",
      actor_type: "citizen",
      details: { from: params.get("From"), transcript_length: transcript.length },
    });
    return new Response(responseXml(`Your report reference is ${createdCase.case_number}. Do not make any payment or share an OTP.`), { headers: { "Content-Type": "text/xml" } });
  } catch (error) {
    console.error("Voice webhook error:", error);
    return new Response(responseXml("We could not save your report. Please try again later."), { status: 500, headers: { "Content-Type": "text/xml" } });
  }
}
