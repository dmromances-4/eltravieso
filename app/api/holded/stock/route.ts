import { NextResponse } from 'next/server'
import { fetchHoldedStock } from '@/lib/holded/api'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sku = url.searchParams.get('sku')
  if (!sku) {
    return NextResponse.json({ error: 'sku parameter required' }, { status: 400 })
  }

  try {
    const stock = await fetchHoldedStock(sku)
    return NextResponse.json(stock)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 502 })
  }
}
