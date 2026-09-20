import { NextRequest, NextResponse } from 'next/server'
import { appendReceivedMessage, ingestAll, normaliseMessage } from '@/lib/ingest'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await ingestAll())
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = normaliseMessage(body)
    await appendReceivedMessage(message)
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'invalid message' },
      { status: 400 },
    )
  }
}
