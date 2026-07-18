const apiKey = process.env.GROQ_API_KEY;

async function testGroq() {
  console.log("Testing Groq...");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Hello" }],
      model: "llama-3.3-70b-versatile",
    })
  });
  console.log("Groq Status:", response.status);
  const data = await response.json();
  console.log("Groq Response:", JSON.stringify(data).slice(0, 200));
}

testGroq();
