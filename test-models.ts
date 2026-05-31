import { GoogleGenAI } from "@google/genai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const client = new GoogleGenAI({ apiKey });
  
  // This is a rough guess on the SDK method to list models based on typical Google SDKs
  // Let's just fetch from the REST API to be safe
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  const models = data.models.map((m: any) => m.name);
  console.log("Available models:");
  models.forEach((m: string) => console.log(m));
}

main();
