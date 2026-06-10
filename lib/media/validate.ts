import type { MediaKind, UserRole } from "@prisma/client";
import type { CreateLiveStreamInput, CreateMediaInput } from "@/lib/media/types";

const BAR_ALLOWED_KINDS: MediaKind[] = ["EVENT_VIDEO"];

export function validateMediaForRole(
  role: UserRole,
  input: CreateMediaInput,
): string | null {
  if (role === "ADMIN") return validateMediaInput(input);

  if (role === "BAR_OWNER") {
    if (!BAR_ALLOWED_KINDS.includes(input.kind)) {
      return "Los bares solo pueden publicar eventos en vídeo.";
    }
    if (!input.barProfileId) return "Falta el perfil del bar.";
    return validateMediaInput(input);
  }

  return "No autorizado para crear contenido en Pantalla.";
}

export function validateMediaInput(input: CreateMediaInput): string | null {
  if (!input.title?.trim()) return "El título es obligatorio.";
  if (!input.kind) return "El tipo es obligatorio.";

  if (input.kind === "SERIES_EPISODE" || input.kind === "PODCAST_EPISODE") {
    if (!input.parentId) return "Los episodios requieren un contenido padre.";
  }

  if (input.kind === "EVENT_VIDEO" && !input.mediaUrl && !input.playbackUrl) {
    return "Indica una URL de vídeo o sube un archivo.";
  }

  return null;
}

export function validateLiveStreamInput(input: CreateLiveStreamInput): string | null {
  if (!input.title?.trim()) return "El título es obligatorio.";
  if (!input.embedUrl?.trim()) return "La URL embed es obligatoria.";
  return null;
}

export function validateCommentContent(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return "Comentario inválido.";
  if (trimmed.length > 4000) return "Comentario inválido.";
  return null;
}

export function validateRatingScore(score: number): string | null {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return "La puntuación debe estar entre 1 y 5.";
  }
  return null;
}
