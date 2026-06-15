import { maskSecret } from "@/lib/security/redact";

/** Enmascara un valor de env para logs de diagnóstico (últimos 4 chars visibles). */
export function maskEnvValue(value: string | undefined): string {
  if (!value) return "(ausente)";
  return maskSecret(value, 4) ?? "(ausente)";
}

/** Etiqueta segura para logs: NOMBRE=********abcd */
export function formatEnvKeyStatus(name: string, value: string | undefined): string {
  return `${name}=${maskEnvValue(value)}`;
}
