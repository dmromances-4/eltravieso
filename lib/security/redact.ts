/** Valor enviado por el cliente cuando no quiere cambiar un secreto ya guardado. */
export const MASKED_SECRET = "********";

/** Enmascara un secreto dejando visibles solo los últimos caracteres. */
export function maskSecret(value: string | null | undefined, visibleTail = 4): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length <= visibleTail) return MASKED_SECRET;
  return `${"*".repeat(8)}${trimmed.slice(-visibleTail)}`;
}

/** True si el valor es un placeholder de secreto (no debe persistirse). */
export function isMaskedSecret(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed === MASKED_SECRET || /^\*{8}/.test(trimmed);
}

/** Normaliza un campo secreto entrante: undefined = no cambiar, string = nuevo valor. */
export function parseSecretUpdate(
  value: unknown,
  options?: { allowClear?: boolean },
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return options?.allowClear ? null : undefined;
  const trimmed = String(value).trim();
  if (!trimmed || isMaskedSecret(trimmed)) return undefined;
  return trimmed;
}
