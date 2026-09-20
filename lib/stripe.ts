import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

/**
 * A thin Stripe reader, safe with no key present.
 *
 * No `stripe` package. One REST call against a documented endpoint is fewer
 * moving parts than an SDK, adds nothing to the bundle, and keeps this repo's
 * zero-new-dependency rule intact.
 *
 * Server-only. Nothing here may be imported from a 'use client' file — the key
 * must never reach the browser.
 */

export type Charge = {
  id: string
  amount: number          // minor units, as Stripe reports them
  currency: string
  created: number         // unix seconds
  description: string | null
  metadata: Record<string, string>
}

export type ChargeSource = {
  isLive: boolean
  describe: string
  charges: Charge[]
}

const FIXTURE = path.join(process.cwd(), 'data', 'charges-fixture.json')

function fixture(): Charge[] {
  try { return JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as Charge[] }
  catch { return [] }
}

/**
 * Live when STRIPE_SECRET_KEY is set, and only then. `isLive` is what the page
 * renders as a connected badge, so it is never hardcoded true.
 */
export async function getCharges(limit = 100): Promise<ChargeSource> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return {
      isLive: false,
      describe: 'No STRIPE_SECRET_KEY set — reading data/charges-fixture.json',
      charges: fixture(),
    }
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/charges?limit=${limit}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`stripe responded ${res.status}`)
    const body = await res.json() as { data: Charge[] }
    return { isLive: true, describe: `Live Stripe account, ${body.data.length} charges`, charges: body.data }
  } catch (err) {
    // A dead network on demo day must not take the page down with it.
    return {
      isLive: false,
      describe: `Stripe unreachable (${err instanceof Error ? err.message : 'unknown'}) — falling back to the fixture`,
      charges: fixture(),
    }
  }
}

/**
 * Stripe signs each webhook as `t=<ts>,v1=<hmac>` over `<ts>.<raw body>`.
 * Compared with timingSafeEqual so the check does not leak by timing.
 */
export function verifySignature(rawBody: string, header: string | null, secret: string | undefined): {
  verified: boolean
  reason: string
} {
  if (!secret) return { verified: false, reason: 'no STRIPE_WEBHOOK_SECRET configured' }
  if (!header) return { verified: false, reason: 'no Stripe-Signature header' }

  const parts = Object.fromEntries(
    header.split(',').map(p => p.split('=', 2) as [string, string]),
  )
  const timestamp = parts.t
  const sent = parts.v1
  if (!timestamp || !sent) return { verified: false, reason: 'malformed Stripe-Signature header' }

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(sent, 'utf8')
  if (a.length !== b.length) return { verified: false, reason: 'signature length mismatch' }

  return crypto.timingSafeEqual(a, b)
    ? { verified: true, reason: 'signature valid' }
    : { verified: false, reason: 'signature did not match' }
}
