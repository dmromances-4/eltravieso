const BASE_URL = 'https://api.holded.com/v1'

export type HoldedStockLine = {
  articleId: string
  availableQuantity: number
  warehouseId?: string
  name?: string
}

export type HoldedContactPayload = {
  name: string
  email: string
  phone?: string
  vatNumber?: string
  address?: string
}

export type HoldedInvoiceLine = {
  description: string
  quantity: number
  unitPrice: number
  taxId: string
}

function getHoldedHeaders() {
  const apiKey = process.env.HOLDED_API_KEY
  if (!apiKey) {
    throw new Error('HOLDED_API_KEY is required to connect to Holded')
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`Holded API error (${response.status}): ${body}`)
  }
  return body ? JSON.parse(body) : ({} as T)
}

export async function fetchHoldedStock(articleId: string) {
  const url = `${BASE_URL}/warehouse/stock?articleId=${encodeURIComponent(articleId)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: getHoldedHeaders()
  })

  return parseJsonResponse<{ data: HoldedStockLine[] }>(response)
}

export async function createHoldedContact(payload: HoldedContactPayload) {
  const response = await fetch(`${BASE_URL}/contacts`, {
    method: 'POST',
    headers: getHoldedHeaders(),
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      vatNumber: payload.vatNumber,
      address: payload.address
    })
  })

  return parseJsonResponse<{ id: string; name: string; email: string }>(response)
}

export async function createHoldedInvoice(payload: {
  contactId: string
  date: string
  lines: HoldedInvoiceLine[]
  reference?: string
}) {
  const response = await fetch(`${BASE_URL}/invoices`, {
    method: 'POST',
    headers: getHoldedHeaders(),
    body: JSON.stringify({
      contactId: payload.contactId,
      date: payload.date,
      lines: payload.lines,
      reference: payload.reference,
      type: 'invoice',
      taxMode: 'inclusive'
    })
  })

  return parseJsonResponse<{ id: string; reference: string }>(response)
}

export async function syncSaleToHolded(order: {
  contact: HoldedContactPayload
  items: HoldedInvoiceLine[]
  reference: string
}) {
  const contact = await createHoldedContact(order.contact)
  const invoice = await createHoldedInvoice({
    contactId: contact.id,
    date: new Date().toISOString().split('T')[0],
    lines: order.items,
    reference: order.reference
  })

  return { contact, invoice }
}
