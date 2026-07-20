import { NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseRest, updateRows } from "@/lib/supabase/server";
import { validateTwilioSignature } from "@/lib/twilio";

type LiveSession = { id: string; transcript: string; latest_sequence_id: number | null };

export async function POST(request: NextRequest) {
  const values = await request.formData();
  const params = new URLSearchParams();
  values.forEach((value, key) => { if (typeof value === "string") params.append(key, value); });
  if (!validateTwilioSignature(request, params)) return new Response("Unauthorized request.", { status: 403 });
  if (!isSupabaseConfigured()) return new Response(null, { status: 204 });

  const callSid = params.get("CallSid");
  const event = params.get("TranscriptionEvent");
  if (!callSid || !event) return new Response(null, { status: 204 });
  const updatedAt = new Date().toISOString();

  try {
    if (event === "transcription-started") {
      await updateRows("live_call_sessions", `call_sid=eq.${encodeURIComponent(callSid)}`, {
        status: "connected",
        transcription_sid: params.get("TranscriptionSid"),
        updated_at: updatedAt,
      });
    }

    if (event === "transcription-content" && params.get("Final") === "true") {
      const data = JSON.parse(params.get("TranscriptionData") ?? "{}") as { transcript?: string };
      const text = data.transcript?.trim();
      const sequence = Number(params.get("SequenceId"));
      if (text && Number.isFinite(sequence)) {
        const sessions = await supabaseRest<LiveSession[]>(
          `live_call_sessions?select=id,transcript,latest_sequence_id&call_sid=eq.${encodeURIComponent(callSid)}&limit=1`,
        );
        const session = sessions[0];
        if (session && sequence > (session.latest_sequence_id ?? -1)) {
          const speaker = params.get("Track") === "inbound_track" ? "Caller" : "Citizen";
          await updateRows("live_call_sessions", `id=eq.${encodeURIComponent(session.id)}`, {
            transcript: `${session.transcript ? `${session.transcript}\n` : ""}${speaker}: ${text}`,
            latest_sequence_id: sequence,
            status: "connected",
            updated_at: updatedAt,
          });
        }
      }
    }

    if (event === "transcription-stopped") {
      await updateRows("live_call_sessions", `call_sid=eq.${encodeURIComponent(callSid)}`, { status: "completed", updated_at: updatedAt });
    }
    if (event === "transcription-error") {
      await updateRows("live_call_sessions", `call_sid=eq.${encodeURIComponent(callSid)}`, {
        status: "error",
        error_message: params.get("TranscriptionError") ?? "Twilio transcription error",
        updated_at: updatedAt,
      });
    }
  } catch (error) {
    console.error("Twilio transcription callback error:", error);
    return new Response("Could not process callback.", { status: 500 });
  }

  return new Response(null, { status: 204 });
}
