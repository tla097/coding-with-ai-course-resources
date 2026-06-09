import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Explain how AI works in a few words",
  });

  console.log("=== Gemini API Test ===");
  console.log("Response:", response.text);
  console.log("Full response object:", JSON.stringify(response, null, 2));
}

main().catch(console.error);
