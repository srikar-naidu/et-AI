import { createHmac, timingSafeEqual } from "node:crypto";

export function twiml(message: string) {
  const escaped = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

export function voiceTwiml(actionUrl: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" language="en-IN"><Say>Digital Safety Command Center. Please describe the suspicious call or message after the tone.</Say></Gather><Say>We did not receive a report. Please call again if you need help.</Say></Response>`;
}

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Starts Twilio Real-Time Transcription, then bridges the caller to the protected citizen. */
export function liveCallShieldTwiml(callbackUrl: string, destination: string) {
  const callback = xmlEscape(callbackUrl);
  const to = xmlEscape(destination);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Start><Transcription name="fraud-shield" statusCallbackUrl="${callback}" track="both_tracks" inboundTrackLabel="caller" outboundTrackLabel="citizen" languageCode="en-IN" partialResults="true" enableAutomaticPunctuation="true"/></Start><Dial answerOnBridge="true">${to}</Dial></Response>`;
}

export function validateTwilioSignature(request: Request, values: URLSearchParams) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || process.env.TWILIO_VALIDATE_SIGNATURE !== "true") return true;
  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;
  const data = [...values.entries()].sort(([left], [right]) => left.localeCompare(right)).reduce((text, [key, value]) => text + key + value, request.url);
  const expected = createHmac("sha1", authToken).update(data).digest("base64");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}
