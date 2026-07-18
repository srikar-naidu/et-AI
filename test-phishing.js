
const testMessage = `URGENT: Your Aadhaar card has been suspended due to suspicious activity! Verify your details immediately to avoid account blocking. Click here: https://aadhaar-verify-gov.in/security`;

async function testPhishingAPI() {
  const res = await fetch("http://localhost:3000/api/phishing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: testMessage })
  });
  const data = await res.json();
  console.log("Phishing API response:", JSON.stringify(data, null, 2));
}

testPhishingAPI();
