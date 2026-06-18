import type { AppLocale } from "@/i18n/routing";
import { getApiMessageSync, type ApiErrorKey } from "@/lib/i18n/errors";

type Messages = { errors: Record<string, string> };

const VALIDATION_KEYS = {
  emailRequired: "errors.validation",
  emailInvalid: "errors.validation",
  passwordRequired: "errors.validation",
  passwordShort: "errors.weakPassword",
  nameRequired: "errors.validation",
  nameShort: "errors.validation",
} as const;

function msg(messages: Messages | undefined, key: ApiErrorKey, fallback: string): string {
  if (!messages) return fallback;
  return getApiMessageSync(messages, key) || fallback;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string, locale: AppLocale = "es", messages?: Messages): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return locale === "en" ? "Email is required." : "El email es obligatorio.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return locale === "en" ? "Invalid email address." : "El email no es válido.";
  }
  return null;
}

export function validatePassword(
  password: string,
  minLength = 8,
  locale: AppLocale = "es",
  messages?: Messages,
): string | null {
  if (!password) {
    return locale === "en" ? "Password is required." : "La contraseña es obligatoria.";
  }
  if (password.length < minLength) {
    return msg(messages!, "weakPassword", locale === "en"
      ? `Password must be at least ${minLength} characters.`
      : `La contraseña debe tener al menos ${minLength} caracteres.`);
  }
  return null;
}

export function validateName(name: string, locale: AppLocale = "es"): string | null {
  const trimmed = name.trim();
  if (!trimmed) return locale === "en" ? "Name is required." : "El nombre es obligatorio.";
  if (trimmed.length < 2) {
    return locale === "en" ? "Name must be at least 2 characters." : "El nombre debe tener al menos 2 caracteres.";
  }
  return null;
}

export function validateAddressLine(
  value: string,
  label: string,
  required = false,
  locale: AppLocale = "es",
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return required
      ? locale === "en"
        ? `${label} is required.`
        : `${label} es obligatorio.`
      : null;
  }
  if (trimmed.length < 3) {
    return locale === "en" ? `${label} is too short.` : `${label} es demasiado corto.`;
  }
  return null;
}

export function validatePostalCode(value: string, locale: AppLocale = "es"): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[0-9A-Za-z\s-]{3,12}$/.test(trimmed)) {
    return locale === "en" ? "Invalid postal code." : "Código postal no válido.";
  }
  return null;
}

export function validateBirthDate(value: string | null, locale: AppLocale = "es"): string | null {
  if (!value) return null;

  const parsed = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return locale === "en" ? "Invalid birth date." : "Fecha de cumpleaños inválida.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed > today) {
    return locale === "en" ? "Birth date cannot be in the future." : "La fecha de cumpleaños no puede ser futura.";
  }

  const minAgeDate = new Date(today);
  minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
  if (parsed > minAgeDate) {
    return locale === "en"
      ? "You must be at least 18 years old to use this platform."
      : "Debes ser mayor de 18 años para usar esta plataforma.";
  }

  const maxAgeDate = new Date(today);
  maxAgeDate.setFullYear(maxAgeDate.getFullYear() - 120);
  if (parsed < maxAgeDate) {
    return locale === "en" ? "Invalid birth date." : "Fecha de cumpleaños no válida.";
  }

  return null;
}

export { VALIDATION_KEYS };
