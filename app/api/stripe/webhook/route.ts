import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { verifySignature } from '@/lib/stripe'

/**
 * Where Stripe would post charge events.
 *
 * Two rules this route exists to hold. An event is marked verified only when a
 * signature actually verified against a configured secret — an absent secret
 * yields `verified: false`, never a pass. And an unverified event is recorded
 * as unverified rather than discarded, so the gap is visible in the log
 * instead of silently shaping the numbers on the page.
 */

const FILE = path.join(process.cwd(), 'data', 'stripe-events.local.json')

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // The raw body, unparsed — Stripe signs the bytes, not the object.
  const raw = await req.text()
  const { verified, reason } = verifySignature(
    raw,
    req.headers.get('stripe-signature'),
    process.env.STRIPE_WEBHOOK_SECRET,
  )

  let event: unknown = null
  try { event = JSON.parse(raw) } catch {
    return NextResponse.json({ error: 'body was not JSON' }, { status: 400 })
  }

  const record = { receivedAt: new Date().toISOString(), verified, reason, event }

  let all: unknown[] = []
  try { all = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { all = [] }
  all.push(record)
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(all, null, 1))

  // 200 either way: Stripe retries a non-2xx, and a retry storm on a signature
  // we will never be able to verify helps nobody. The record carries the truth.
  return NextResponse.json({ received: true, verified, reason })
}

export async function GET() {
  try {
    const all = JSON.parse(fs.readFileSync(FILE, 'utf8')) as { verified: boolean }[]
    return NextResponse.json({ count: all.length, verified: all.filter(e => e.verified).length })
  } catch {
    return NextResponse.json({ count: 0, verified: 0 })
  }
}
