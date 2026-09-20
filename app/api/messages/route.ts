import { NextRequest, NextResponse } from 'next/server'
import { getMessages, saveMessages } from '@/lib/messages'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getMessages())
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json(saveMessages(body))
}
