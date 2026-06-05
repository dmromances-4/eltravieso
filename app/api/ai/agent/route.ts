import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAiStatus, isTextAiAvailable } from "@/lib/ai/availability";
import { createRecipeFromPrompt } from "@/lib/recipes/agent";
import { checkRateLimit, getAiAgentRateLimits, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  const status = getAiStatus();
  return NextResponse.json(
    {
      ...status,
      endpoints: { generate: "POST /api/ai/agent", search: "GET /api/recipes/search?q=", status: "GET /api/ai/status" },
    },
    { status: status.available ? 200 : 503 },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const rateKey = `ai-agent:${session?.user?.id ?? getClientIp(request)}`;
    const rate = checkRateLimit(rateKey, getAiAgentRateLimits(Boolean(session?.user?.id)));

    if (!rate.allowed) {
      return NextResponse.json(
        { message: "Demasiadas solicitudes al agente. Espera un momento e inténtalo de nuevo." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSec),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    if (!isTextAiAvailable()) {
      return NextResponse.json(
        {
          message:
            "El agente no está disponible. Configura GEMINI_API_KEY o GROQ_API_KEY en .env.local (ver .env.example).",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const promptText = String(body.prompt ?? body.text ?? body.comment ?? "").trim();

    if (!promptText) {
      return NextResponse.json(
        { message: "Escribe una idea, comentario o descripción para crear la receta." },
        { status: 400 },
      );
    }

    const result = await createRecipeFromPrompt(promptText, { userId: session?.user?.id ?? null });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al generar la receta.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
