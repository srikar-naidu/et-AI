import { NextResponse } from "next/server";
import { isSupabaseConfigured, isSupabaseClientConfigured } from "@/lib/supabase/server";

function getServiceStatus() {
  const services = [] as Array<{ label: string; status: string; detail: string }>;

  const groqConfigured = Boolean(process.env.GROQ_API_KEY);
  const supabaseConfigured = isSupabaseConfigured();
  const supabaseClientConfigured = isSupabaseClientConfigured();
  const auriginConfigured = Boolean(process.env.AURIGIN_API_KEY);
  const modelConfigured = Boolean(process.env.COUNTERFEIT_MODEL_API_URL);
  const twilioConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

  services.push({
    label: "Groq screening",
    status: groqConfigured ? "configured" : "needs-key",
    detail: groqConfigured ? "Groq API key is configured for voice and transcription screening." : "Add GROQ_API_KEY to enable live analysis.",
  });

  services.push({
    label: "Supabase storage",
    status: supabaseConfigured ? "configured" : "needs-key",
    detail: supabaseConfigured ? "Server-side Supabase credentials are present." : "Add SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL to enable secure case storage.",
  });

  services.push({
    label: "Supabase auth",
    status: supabaseClientConfigured ? "configured" : "needs-key",
    detail: supabaseClientConfigured ? "Client auth is available for operator sign-in flows." : "Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable browser auth.",
  });

  services.push({
    label: "Schema migration",
    status: supabaseConfigured ? "configured" : "needs-migration",
    detail: supabaseConfigured ? "Server connectivity is present; run the SQL migration if tables are missing." : "Enable Supabase first, then apply the migration in the SQL editor.",
  });

  services.push({
    label: "Counterfeit model",
    status: modelConfigured ? "configured" : "needs-model",
    detail: modelConfigured ? "Model endpoint is configured for image screening." : "Deploy the ml-service and set COUNTERFEIT_MODEL_API_URL to test the upload flow.",
  });

  services.push({
    label: "Twilio channels",
    status: twilioConfigured ? "configured" : "needs-key",
    detail: twilioConfigured ? "Twilio webhook and messaging settings are ready for deployment." : "Add Twilio credentials and public webhook URLs before testing voice/WhatsApp flows.",
  });

  services.push({
    label: "Voice authenticity",
    status: auriginConfigured ? "configured" : "needs-key",
    detail: auriginConfigured ? "Aurigin screening is ready for audio authenticity checks." : "Add AURIGIN_API_KEY for voice-authenticity screening.",
  });

  return services;
}

export async function GET() {
  return NextResponse.json({ services: getServiceStatus() });
}
