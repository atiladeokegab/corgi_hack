import type { Profile } from './types'
import { SEGMENTS } from './classify'
import type { Charge } from './stripe'

/**
 * Money, reported against the thing the intelligence drop actually said.
 *
 * E-09: 62% of high-value purchasers never clicked the affiliate link, the
 * median gap between saving a look and buying is 3.4 days, and 41% of
 * purchases followed a share to a friend. So a click-to-charge join measures
 * the minority path by construction.
 *
 * This file therefore never reports attributable revenue on its own. The
 * unattributed remainder is returned alongside it, every time, as the headline
 * rather than a footnote — because on this evidence it is the larger number and
 * pretending otherwise would mislead her about her own business.
 *
 * Nothing here changes how anyone is classified. It reads the segments the
 * redirect already derived and asks which of them turn up in the charge log.
 */

export type Attribution = {
  charge: Charge
  uid: string | null
  segment: string | null
  attributed: boolean
}

export type RevenueSummary = {
  charges: number
  total: number
  attributedTotal: number
  unattributedTotal: number
  attributedCount: number
  unattributedCount: number
  attributedShare: number
  currency: string
}

const money = (c: Charge[]) => c.reduce((a, x) => a + x.amount, 0)

/** A charge is attributable only when it carries the uid a tracked link set. */
export function attribute(charges: Charge[], profiles: Profile[]): Attribution[] {
  const byUid = new Map(profiles.map(p => [p.uid, p]))
  return charges.map(charge => {
    const uid = charge.metadata?.lb_uid ?? null
    const profile = uid ? byUid.get(uid) ?? null : null
    return {
      charge,
      uid,
      segment: profile ? SEGMENTS[profile.segment].label : null,
      attributed: Boolean(profile),
    }
  })
}

export function summarise(rows: Attribution[]): RevenueSummary {
  const attributed = rows.filter(r => r.attributed).map(r => r.charge)
  const unattributed = rows.filter(r => !r.attributed).map(r => r.charge)
  const total = money(attributed) + money(unattributed)
  return {
    charges: rows.length,
    total,
    attributedTotal: money(attributed),
    unattributedTotal: money(unattributed),
    attributedCount: attributed.length,
    unattributedCount: unattributed.length,
    attributedShare: total ? money(attributed) / total : 0,
    currency: rows[0]?.charge.currency?.toUpperCase() ?? 'GBP',
  }
}

export type SegmentRevenue = {
  segment: string
  people: number
  buyers: number
  conversion: number
  revenue: number
}

/**
 * Which kind of person actually buys, among the ones a charge can be tied to.
 *
 * `people` counts everyone the redirect saw in that segment; `buyers` counts
 * the subset that appear in the charge log. The conversion rate is therefore a
 * floor, not a rate — the 62% who never clicked cannot appear in either column,
 * and that is stated on the page rather than left for the reader to work out.
 */
export function bySegment(rows: Attribution[], profiles: Profile[]): SegmentRevenue[] {
  const spend = new Map<string, { revenue: number; buyers: Set<string> }>()
  for (const r of rows) {
    if (!r.attributed || !r.segment || !r.uid) continue
    const e = spend.get(r.segment) ?? { revenue: 0, buyers: new Set<string>() }
    e.revenue += r.charge.amount
    e.buyers.add(r.uid)
    spend.set(r.segment, e)
  }

  const population = new Map<string, number>()
  for (const p of profiles) {
    const label = SEGMENTS[p.segment].label
    population.set(label, (population.get(label) ?? 0) + 1)
  }

  return [...population.entries()].map(([segment, people]) => {
    const e = spend.get(segment)
    const buyers = e?.buyers.size ?? 0
    return {
      segment,
      people,
      buyers,
      conversion: people ? buyers / people : 0,
      revenue: e?.revenue ?? 0,
    }
  }).sort((a, b) => b.revenue - a.revenue || b.conversion - a.conversion)
}

export const formatMoney = (minor: number, currency = 'GBP') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 })
    .format(minor / 100)
