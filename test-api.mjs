import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
async function test() {
  const ai = genkit({ plugins: [googleAI()] });
  try {
    await ai.generate({ model: "googleai/gemini-1.5-pro", prompt: "hi" });
    console.log("gemini-1.5-pro works");
  } catch(e) {
    console.error("1.5-pro:", e.message);
  }
  
  try {
    await ai.generate({ model: "googleai/gemini-1.5-flash-8b", prompt: "hi" });
    console.log("gemini-1.5-flash-8b works");
  } catch(e) {
    console.error("1.5-flash-8b:", e.message);
  }
}
test();
