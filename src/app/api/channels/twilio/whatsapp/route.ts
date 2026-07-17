import { NextRequest } from "next/server";
import { insertRow, isSupabaseConfigured } from "@/lib/supabase/server";
import { twiml, validateTwilioSignature } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  if (!process.env.TWILIO_AUTH_TOKEN || !isSupabaseConfigured()) {
    return new Response(twiml("This channel is not configured yet."), { status: 503, headers: { "Content-Type": "text/xml" } });
  }

  const values = await request.formData();
  const params = new URLSearchParams();
  values.forEach((value, key) => { if (typeof value === "string") params.append(key, value); });
  if (!validateTwilioSignature(request, params)) {
    return new Response(twiml("Unauthorized request."), { status: 403, headers: { "Content-Type": "text/xml" } });
  }

  const body = params.get("Body")?.trim() ?? "";
  if (body.length < 2) {
    return new Response(twiml("Please send a short description of the suspicious message or call."), { headers: { "Content-Type": "text/xml" } });
  }

  try {
    const createdCase = await insertRow("cases", {
      case_number: `WA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      title: "WhatsApp citizen report",
      status: "open",
      severity: 2,
      source: "twilio_whatsapp",
    }) as unknown as { id: string; case_number: string };
    await insertRow("audit_events", {
      case_id: createdCase.id,
      event_type: "channel.whatsapp.received",
      actor_type: "citizen",
      details: { from: params.get("From"), message_length: body.length },
    });
    return new Response(twiml(`Your report reference is ${createdCase.case_number}. Do not share OTPs, PINs, or passwords. If money is at immediate risk, disconnect the call and use official reporting channels.`), { headers: { "Content-Type": "text/xml" } });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return new Response(twiml("We could not save your report. Please try again shortly."), { status: 500, headers: { "Content-Type": "text/xml" } });
  }
}
