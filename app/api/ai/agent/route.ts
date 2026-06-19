import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAiStatus, isTextAiAvailable } from "@/lib/ai/availability";
import { createRecipeFromPrompt, saveGeneratedRecipe, type GeneratedRecipe } from "@/lib/recipes/agent";
import { getRequestLocaleFromHeaders } from "@/lib/i18n/request-locale";
import { checkRateLimit, getAiAgentRateLimits, getClientIp } from "@/lib/rate-limit";
import { buildRequestContext, mergeRequestContext, runWithRequestContext } from "@/lib/observability/request-context";
import { withSentrySpan } from "@/lib/observability/sentry-span";
import { logServerError } from "@/lib/security/safe-error";

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
  return runWithRequestContext(buildRequestContext(request), async () => {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      mergeRequestContext({ userId: session.user.id });
    }
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
    const mode = body.mode === "save" || body.recipe ? "save" : "preview";

    if (mode === "save") {
      const recipe = body.recipe as GeneratedRecipe | undefined;
      if (!recipe || !recipe.title || !Array.isArray(recipe.ingredients) || recipe.ingredients.length < 3) {
        return NextResponse.json(
          { message: "Falta la receta a guardar o está incompleta. Genera una previsualización primero." },
          { status: 400 },
        );
      }

      const saved = await withSentrySpan(
        "ai-agent.save_recipe",
        "ai",
        () => saveGeneratedRecipe(recipe, { userId: session?.user?.id ?? null }),
        { userId: session?.user?.id ?? "anonymous" },
      );

      return NextResponse.json(saved);
    }

    const promptText = String(body.prompt ?? body.text ?? body.comment ?? "").trim();

    if (!promptText) {
      return NextResponse.json(
        { message: "Escribe una idea, comentario o descripción para crear la receta." },
        { status: 400 },
      );
    }

    const locale = getRequestLocaleFromHeaders(request);
    const result = await withSentrySpan(
      "ai-agent.create_recipe",
      "ai",
      () => createRecipeFromPrompt(promptText, { locale }),
      { userId: session?.user?.id ?? "anonymous" },
    );

    return NextResponse.json({ ...result, saved: false, viewUrl: null });
  } catch (error: unknown) {
    logServerError("ai-agent", error, { path: new URL(request.url).pathname });
    const message = error instanceof Error ? error.message : "Error al generar la receta.";
    return NextResponse.json({ message }, { status: 500 });
  }
  });
}
