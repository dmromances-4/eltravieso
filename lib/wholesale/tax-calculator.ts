// ─────────────────────────────────────────────────────────────────────────────
// Wholesale Tax Calculator — Integer-only arithmetic (cents + basis points)
// Impuestos Especiales: 8% (800 bps) · IVA: 21% (2100 bps)
// ─────────────────────────────────────────────────────────────────────────────

/** Basis points: 1 bps = 0.01% */
const EXCISE_TAX_BPS = 800;   // 8.00%
const VAT_BPS = 2100;          // 21.00%
const BPS_DIVISOR = 10_000;

export interface TaxBreakdown {
  subtotalCents: number;
  exciseTaxCents: number;
  vatCents: number;
  totalCents: number;
}

export interface LineItem {
  unitPriceCents: number;
  quantity: number;
}

/**
 * Compute excise tax in cents from a subtotal in cents.
 * Uses integer math: (subtotal * bps) / 10000, truncated.
 */
export function computeExciseTax(subtotalCents: number): number {
  return Math.round((subtotalCents * EXCISE_TAX_BPS) / BPS_DIVISOR);
}

/**
 * Compute VAT in cents. VAT base = subtotal + excise tax (cascaded).
 * Spanish tax law: IVA applies on top of the excise-inclusive amount.
 */
export function computeVAT(subtotalCents: number, exciseTaxCents: number): number {
  const vatBase = subtotalCents + exciseTaxCents;
  return Math.round((vatBase * VAT_BPS) / BPS_DIVISOR);
}

/**
 * Full tax breakdown for a set of line items.
 */
export function calculateOrderTaxes(items: LineItem[]): TaxBreakdown {
  const subtotalCents = items.reduce(
    (acc, item) => acc + item.unitPriceCents * item.quantity,
    0
  );

  const exciseTaxCents = computeExciseTax(subtotalCents);
  const vatCents = computeVAT(subtotalCents, exciseTaxCents);
  const totalCents = subtotalCents + exciseTaxCents + vatCents;

  return { subtotalCents, exciseTaxCents, vatCents, totalCents };
}

/**
 * Generate a sequential order number: WS-YYYY-NNNNNN
 */
export function generateWholesaleOrderNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequenceNumber).padStart(6, "0");
  return `WS-${year}-${padded}`;
}

/**
 * Generate a sequential invoice number: FV-YYYY-NNNNNN
 */
export function generateInvoiceNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequenceNumber).padStart(6, "0");
  return `FV-${year}-${padded}`;
}
