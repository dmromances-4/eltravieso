import alcoholData from '@/data/alcohol-encyclopedia.json'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  return NextResponse.json(alcoholData)
}
