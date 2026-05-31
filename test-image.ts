import { generateImage } from "./lib/ai/provider";

async function main() {
  try {
    console.log("Generating image...");
    const res = await generateImage("Un vermut rojo clásico");
    console.log("Success:", res.url.substring(0, 50) + "...");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
