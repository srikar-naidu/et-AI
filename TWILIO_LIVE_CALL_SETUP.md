# Live Call Shield — Twilio demo setup

This implementation protects a **Twilio Programmable Voice** call. It cannot intercept a normal peer-to-peer WhatsApp call made directly between two WhatsApp accounts.

For the demo, the test caller calls your Twilio Voice number. Twilio starts live transcription, bridges the call to your protected phone, and delivers final transcript utterances to the dashboard for repeated fraud screening.

## 1. Apply the database migration

Run `supabase/migrations/20260720_live_call_shield.sql` in the Supabase SQL editor after the existing migrations. It creates `live_call_sessions`, which stores only the transcript, call state, and Twilio identifiers needed by the dashboard.

## 2. Configure environment values

Copy these values into `.env.local`; do not commit this file.

```env
APP_BASE_URL=https://your-public-https-domain.example
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_SHIELD_DESTINATION=+91... # your protected phone, in E.164 format
TWILIO_VALIDATE_SIGNATURE=true
```

`APP_BASE_URL` must be a public HTTPS URL. For local testing, use a temporary HTTPS tunnel and set its URL here. Twilio cannot deliver webhooks to `localhost`.

## 3. Set the Twilio number webhook

In the Twilio Console, open the purchased Voice number and set **A call comes in** to:

```text
POST https://your-public-https-domain.example/api/channels/twilio/voice
```

## 4. Test

1. Open the app's **Live Call Shield** and keep **Twilio call** selected.
2. From a different test number/account, call the Twilio Voice number.
3. Answer the bridged call on `TWILIO_SHIELD_DESTINATION`.
4. Speak a scripted scam scenario. Within a few seconds, final utterances appear in the Live Transcript panel and the fraud model updates the risk alert.

## WhatsApp note

Twilio's WhatsApp Business Calling can dial a WhatsApp client with `<Dial><WhatsApp>`, but it requires a registered Voice-activated WhatsApp sender and prior recipient consent via a WhatsApp template. It is not an API for silently capturing ordinary personal WhatsApp calls. Keep the programmable-voice bridge above as the hackathon demonstration channel unless you have that approved WhatsApp Business Calling setup.

## Privacy

Obtain consent from every participant before recording or transcribing a call, publish a retention policy, and secure the dashboard with authentication before any real deployment. This project currently exposes the latest shield session to the dashboard API for a single-user demo.
