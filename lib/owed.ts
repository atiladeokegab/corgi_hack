import type { Customer, Item, Profile } from './types'

/**
 * The gap between how long an affiliate link pays for and how long people
 * actually take to decide.
 *
 * Careful about what is knowable here, because it is easy to overclaim:
 *
 *   PROVABLE — every click and its timestamp. Our redirect, our cookie, our
 *   server. Someone whose last click is three days after their first is a fact.
 *
 *   REAL BUT PARTIAL — the affiliate network's conversion report. It gives
 *   genuine sales with timestamps, but only the ones it ATTRIBUTED. A purchase
 *   outside the click window is never attributed, so it never appears. The sales
 *   we care about are precisely the ones missing from that report.
 *
 *   NOT KNOWABLE — that a specific late returner bought something. The purchase
 *   happens on the retailer's site and nothing here observes it.
 *
 * So the headline is the provable number, and the money is an estimate built
 * from two real inputs: our click log, and the conversion rate the affiliate
 * report does give us. The fix that would make it exact is a per-person discount
 * code, which lands on the order regardless of any cookie window.
 */
export const AFFILIATE_WINDOW_HOURS = 24
export const CHASEABLE_DAYS = 5
export const COMMISSION_RATE = 0.10

const DAY = 86_400_000

export type LateReturner = {
  uid: string
  handle: string | null
  item: string
  firstTs: string
  lastTs: string
  daysApart: number
  opens: number
}

export function owedToHer(customers: Customer[], profiles: Profile[], items: Item[]) {
  const nameOf = Object.fromEntries(items.map(i => [i.slug, i.name]))

  // --- provable, straight off our own log
  const late = profiles.filter(p => p.spanDays > AFFILIATE_WINDOW_HOURS / 24)
  const rows: LateReturner[] = late
    .map(p => ({
      uid: p.uid,
      handle: p.handle,
      item: nameOf[p.topSlug] ?? p.topSlug,
      firstTs: p.firstTs,
      lastTs: p.lastTs,
      daysApart: p.spanDays,
      opens: p.touches,
    }))
    .sort((a, b) => b.lastTs.localeCompare(a.lastTs))

  const withinChaseable = late.filter(p => p.spanDays <= CHASEABLE_DAYS).length

  // --- real, from the affiliate report: the sales it did pay out on
  const paid = customers.flatMap(c => c.purchases ?? []).filter(p => p.paidOut)
  const paidValue = paid.reduce((a, p) => a + p.value, 0)
  const averageOrderValue = paid.length ? paidValue / paid.length : 0
  const conversionRate = profiles.length ? paid.length / profiles.length : 0

  // --- the estimate, and every input to it is one of the two above
  const estimatedSales = Math.round(late.length * conversionRate)
  const estimatedValue = estimatedSales * averageOrderValue

  return {
    lateReturners: late.length,
    withinChaseable,
    totalClickers: profiles.length,
    rows,

    paidSales: paid.length,
    paidValue,
    paidCommission: paidValue * COMMISSION_RATE,
    averageOrderValue,
    conversionRate,

    estimatedSales,
    estimatedValue,
    estimatedCommission: estimatedValue * COMMISSION_RATE,
  }
}
