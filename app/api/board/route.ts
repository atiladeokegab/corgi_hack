import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

/**
 * The whiteboard's own store. Kept separate from the click log so that
 * rearranging her workspace can never disturb the evidence the dashboard reads.
 */

const FILE = path.join(process.cwd(), 'data', 'board.json')

export const dynamic = 'force-dynamic'

export type BoardState = {
  positions: Record<string, { x: number; y: number }>
  notes: { id: string; text: string; x: number; y: number }[]
  updatedAt: string
}

const EMPTY: BoardState = { positions: {}, notes: [], updatedAt: '' }

function read(): BoardState {
  try { return { ...EMPTY, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) } }
  catch { return EMPTY }
}

export async function GET() {
  return NextResponse.json(read())
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'expected a board state object' }, { status: 400 })
  }
  const next: BoardState = {
    positions: body.positions ?? {},
    notes: Array.isArray(body.notes) ? body.notes : [],
    updatedAt: new Date().toISOString(),
  }
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(next, null, 1))
  return NextResponse.json({ ok: true, updatedAt: next.updatedAt })
}
