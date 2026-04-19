require('dotenv').config({ path: '.env.local' });
const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');
const ai = genkit({ plugins: [googleAI()] });

async function verify() {
  console.log("Using API Key:", process.env.GEMINI_API_KEY ? "Loaded" : "Missing");
  try {
    const res = await ai.generate({ 
      model: 'googleai/gemini-1.5-pro', 
      prompt: 'hello' 
    });
    console.log("gemini-1.5-pro SUCCESS:", res.text.substring(0, 50));
  } catch(e) {
    console.error("1.5-pro ERRORED:", e.message);
  }
}
verify();
