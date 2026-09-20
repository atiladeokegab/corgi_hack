import { NextResponse } from 'next/server'
import { getLiveEvents } from '@/lib/data'

export const dynamic = 'force-dynamic'

/** Polled by the dashboard so a click on stage shows up without a reload. */
export async function GET() {
  return NextResponse.json(getLiveEvents().slice(-25).reverse())
}
