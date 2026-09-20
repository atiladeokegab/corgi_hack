import type { Customer, Item, Profile } from './types'

/**
 * Money she earned and was not paid.
 *
 * Affiliate networks only pay when the purchase happens inside the click window —
 * usually 24 hours. People take about three days to decide. So a sale she plainly
 * caused, from someone who saw her post on Monday and bought on Thursday, pays her
 * nothing, because the clock ran out.
 *
 * Five days is the cut-off used here: close enough that the link clearly caused
 * the sale, so she can point at it and ask for the commission.
 */
export const CHASEABLE_DAYS = 5
export const COMMISSION_RATE = 0.10

export type OwedRow = {
  uid: string
  handle: string | null
  item: string
  value: number
  commission: number
  daysAfterSeeing: number
  ts: string
}

export function owedToHer(customers: Customer[], profiles: Profile[], items: Item[]) {
  const nameOf = Object.fromEntries(items.map(i => [i.slug, i.name]))
  const byUid = new Map(profiles.map(p => [p.uid, p]))

  const rows: OwedRow[] = []
  let paidTotal = 0
  let allTotal = 0

  for (const c of customers) {
    for (const p of c.purchases ?? []) {
      allTotal += p.value
      if (p.paidOut) { paidTotal += p.value; continue }
      if (p.daysAfterSeeing > CHASEABLE_DAYS) continue
      rows.push({
        uid: c.uid,
        handle: byUid.get(c.uid)?.handle ?? null,
        item: nameOf[p.slug] ?? p.slug,
        value: p.value,
        commission: p.value * COMMISSION_RATE,
        daysAfterSeeing: p.daysAfterSeeing,
        ts: p.ts,
      })
    }
  }

  rows.sort((a, b) => b.ts.localeCompare(a.ts))
  const owedValue = rows.reduce((a, r) => a + r.value, 0)
  return {
    rows,
    count: rows.length,
    owedValue,
    owedCommission: owedValue * COMMISSION_RATE,
    paidCommission: paidTotal * COMMISSION_RATE,
    shareUnpaid: allTotal ? owedValue / allTotal : 0,
  }
}
