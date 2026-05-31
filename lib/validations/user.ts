export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return "El email es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return "El email no es válido.";
  return null;
}

export function validatePassword(password: string, minLength = 8): string | null {
  if (!password) return "La contraseña es obligatoria.";
  if (password.length < minLength) return `La contraseña debe tener al menos ${minLength} caracteres.`;
  return null;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "El nombre es obligatorio.";
  if (trimmed.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  return null;
}

export function validateAddressLine(value: string, label: string, required = false): string | null {
  const trimmed = value.trim();
  if (!trimmed) return required ? `${label} es obligatorio.` : null;
  if (trimmed.length < 3) return `${label} es demasiado corto.`;
  return null;
}

export function validatePostalCode(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[0-9A-Za-z\s-]{3,12}$/.test(trimmed)) return "Código postal no válido.";
  return null;
}

export function validateBirthDate(value: string | null): string | null {
  if (!value) return null;

  const parsed = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "Fecha de cumpleaños inválida.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed > today) return "La fecha de cumpleaños no puede ser futura.";

  const minAgeDate = new Date(today);
  minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
  if (parsed > minAgeDate) {
    return "Debes ser mayor de 18 años para usar esta plataforma.";
  }

  const maxAgeDate = new Date(today);
  maxAgeDate.setFullYear(maxAgeDate.getFullYear() - 120);
  if (parsed < maxAgeDate) return "Fecha de cumpleaños no válida.";

  return null;
}
