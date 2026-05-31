import { GoogleGenAI } from "@google/genai";

async function main() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    
    console.log("Generating image with imagen-4.0-fast-generate-001...");
    const response = await client.models.generateImages({
      model: "imagen-4.0-fast-generate-001",
      prompt: "Un vermut rojo clásico",
      config: {
        numberOfImages: 1,
      },
    });
    
    const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
      console.log("Success! Image bytes length:", imageBytes.length);
    } else {
      console.log("No image bytes returned.");
    }
  } catch (err) {
    console.error("Error generating image:", err);
  }
}

main();
