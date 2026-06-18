/** Código interno El Travieso: ET-PROD-00001 */
export const PRODUCT_CODE_PATTERN = /^ET-PROD-\d{5}$/;

export function formatProductCode(sequence: number): string {
  return `ET-PROD-${String(sequence).padStart(5, "0")}`;
}

export function parseProductCodeSequence(code: string | null | undefined): number {
  if (!code) return 0;
  const match = code.match(/^ET-PROD-(\d+)$/i);
  return match ? Number(match[1]) : 0;
}
