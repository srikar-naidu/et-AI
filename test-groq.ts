import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import Groq from "groq-sdk";

async function testGroq() {
  console.log("Testing Groq...");
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Hello" }],
      model: "llama-3.3-70b-versatile",
    });
    console.log("Groq Success:", chatCompletion.choices[0]?.message?.content);
  } catch (error: any) {
    console.error("Groq Chat Error:", error.message);
  }

  try {
    const models = await groq.models.list();
    console.log("Available models:", models.data.map(m => m.id).join(", "));
  } catch (error: any) {
     console.error("Groq Models Error:", error.message);
  }
}

testGroq();
