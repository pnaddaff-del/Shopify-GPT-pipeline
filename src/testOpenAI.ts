import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function run() {
  try {
    const models = await client.models.list();
    console.log("✅ OpenAI connection successful. Models count:", models.data.length);
  } catch (err) {
    console.error("❌ OpenAI test failed:", err);
  }
}

run();
