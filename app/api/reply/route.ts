import fs from 'node:fs'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FILE = path.join(process.cwd(), 'data', 'reply-log.local.json')

/**
 * Records that she answered one. It does NOT transmit anything — there is no
 * Instagram connection here, and her DMs are hers to send. The reply text goes
 * to the clipboard; this just keeps the count honest.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  let log: unknown[] = []
  try { log = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { /* first reply */ }
  log.push({
    id: body.id,
    handle: body.handle ?? null,
    job: body.job ?? null,
    usedTemplate: Boolean(body.usedTemplate),
    at: new Date().toISOString(),
  })
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(log.slice(-500), null, 1))
  return NextResponse.json({ ok: true, answered: log.length })
}
