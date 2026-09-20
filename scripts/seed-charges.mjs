/**
 * Generate data/charges-fixture.json — the stand-in charge log the revenue page
 * reads when no STRIPE_SECRET_KEY is present.
 *
 * No charge data was provided with the case file and none can be obtained, so
 * this is synthetic and is labelled as such everywhere it surfaces. What is NOT
 * invented is its shape: every proportion below is pinned to E-09, and the
 * three numbers that are genuinely assumptions are named as constants so they
 * can be argued with — the same contract scripts/seed.mjs already works to.
 *
 *   node scripts/seed-charges.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DATA = path.join(process.cwd(), 'data')
const read = f => JSON.parse(readFileSync(path.join(DATA, f), 'utf8'))

// ---- Pinned to E-09 (sheet 14, the intelligence drop) ----------------------
/** 62% of high-value purchasers did not click the affiliate link. */
const ATTRIBUTABLE_SHARE = 0.38
/** 41% of purchases followed a share to a friend or partner. */
const VIA_SHARE_SHARE = 0.41
/** 2.2x higher purchase rate when someone saved 3+ looks before buying. */
const REPEAT_OPENER_LIFT = 2.2

// ---- Assumptions. Not in the evidence. Argue with these. -------------------
/** How many purchases land in the window the click log covers. */
const PURCHASES = 140
/**
 * Price per tier in pence. E-04 carries no prices. These are anchored to the
 * two figures the evidence does print — "£35 is enough" (E-04, white tee) and
 * "under £120 ... not paying £400" (E-01.4) — and nothing else.
 */
const TIER_PRICE = { entry: 3500, mid: 12000, premium: 40000 }

// Deterministic, so the fixture is reproducible and diffs stay readable.
let seed = 20260920
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const pick = xs => xs[Math.floor(rnd() * xs.length)]

const events = read('click-log.json')
const items = read('items.json')

// Weight attributable buyers toward people who came back, per E-09's 2.2x lift.
const touches = new Map()
for (const e of events) touches.set(e.uid, (touches.get(e.uid) ?? 0) + 1)
const pool = []
for (const [uid, n] of touches) {
  const weight = n >= 3 ? Math.round(REPEAT_OPENER_LIFT) : 1
  for (let i = 0; i < weight; i++) pool.push(uid)
}

const start = Date.parse(events[0]?.ts ?? '2026-08-01T00:00:00Z')
const end = Date.parse(events[events.length - 1]?.ts ?? '2026-09-20T00:00:00Z')

const charges = []
for (let i = 0; i < PURCHASES; i++) {
  const item = pick(items)
  const attributable = rnd() < ATTRIBUTABLE_SHARE
  const uid = attributable ? pick(pool) : null
  const viaShare = rnd() < VIA_SHARE_SHARE

  const metadata = { lb_item: item.slug }
  if (uid) metadata.lb_uid = uid
  if (viaShare) metadata.lb_route = 'passed_on'

  charges.push({
    id: `ch_${(seed >>> 0).toString(36)}${i.toString(36)}`,
    amount: TIER_PRICE[item.tier] ?? TIER_PRICE.mid,
    currency: 'gbp',
    created: Math.round((start + rnd() * (end - start)) / 1000),
    description: item.name,
    metadata,
  })
}

charges.sort((a, b) => a.created - b.created)
writeFileSync(path.join(DATA, 'charges-fixture.json'), JSON.stringify(charges, null, 1))

const withUid = charges.filter(c => c.metadata.lb_uid).length
console.log(`charges-fixture.json: ${charges.length} charges, ${withUid} attributable (${Math.round(100 * withUid / charges.length)}%), target ${Math.round(100 * ATTRIBUTABLE_SHARE)}%`)
