import { NextRequest, NextResponse } from 'next/server'
import { getTemplates, saveTemplates } from '@/lib/templates'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getTemplates())
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json(saveTemplates(body))
}
