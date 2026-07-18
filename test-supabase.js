const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

async function testSupabase() {
  console.log("Testing Supabase...");
  const response = await fetch(`${url}/rest/v1/cases?select=id&limit=1`, {
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });
  console.log("Supabase Status:", response.status);
  const text = await response.text();
  console.log("Supabase Response:", text);
}

testSupabase();
