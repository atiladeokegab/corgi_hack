import type { Order, Post, Profile, SegmentKey } from './types'
import { SEGMENTS } from './classify'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

/** The headline: what she is paid for, versus what actually happened. */
export function headline(orders: Order[]) {
  const total = sum(orders.map(o => o.value))
  const affiliate = sum(orders.filter(o => o.affiliateCredited).map(o => o.value))
  const ownRedirect = sum(orders.filter(o => o.subid).map(o => o.value))
  const untouched = sum(orders.filter(o => !o.subid).map(o => o.value))
  return {
    total,
    affiliate,
    ownRedirect,
    untouched,
    blindSpot: total - affiliate,
    blindSpotPct: total ? (total - affiliate) / total : 0,
    recoveredPct: total ? (ownRedirect - affiliate) / total : 0,
    orders: orders.length,
    creditedOrders: orders.filter(o => o.affiliateCredited).length,
  }
}

export function bySegment(profiles: Profile[], orders: Order[]) {
  const profByUid = new Map(profiles.map(p => [p.uid, p]))
  const total = sum(orders.map(o => o.value))

  // A Connector's own spend understates her: credit her with what her recipients spent.
  const downstream = new Map<string, number>()
  for (const p of profiles) {
    if (!p.sharerUid) continue
    downstream.set(p.sharerUid, (downstream.get(p.sharerUid) ?? 0) + p.revenue)
  }

  const keys = Object.keys(SEGMENTS) as SegmentKey[]
  return keys.map(key => {
    const group = profiles.filter(p => p.segment === key)
    const buyers = group.filter(p => p.purchased)
    const revenue = sum(group.map(p => p.revenue))
    const influenced = sum(group.map(p => downstream.get(p.uid) ?? 0))
    return {
      key,
      ...SEGMENTS[key],
      people: group.length,
      buyers: buyers.length,
      conversion: group.length ? buyers.length / group.length : 0,
      revenue,
      influenced,
      totalValue: revenue + influenced,
      shareOfRevenue: total ? (revenue + influenced) / total : 0,
      avgOrder: buyers.length ? revenue / buyers.length : 0,
      medianDaysToBuy: median(buyers.map(b => b.daysToBuy!).filter(d => d != null)),
      pctAffiliateCredited: buyers.length ? buyers.filter(b => b.affiliateCredited).length / buyers.length : 0,
    }
  }).filter(s => s.people > 0).sort((a, b) => b.totalValue - a.totalValue)
}

/** Instagram's ranking of her posts, next to the one that pays her. */
export function byPost(posts: Post[], orders: Order[], profiles: Profile[]) {
  const profByUid = new Map(profiles.map(p => [p.uid, p]))
  const rows = posts.map(post => {
    const os = orders.filter(o => o.postRef === post.ref)
    const revenue = sum(os.map(o => o.value))
    const credited = sum(os.filter(o => o.affiliateCredited).map(o => o.value))
    const segs = new Map<SegmentKey, number>()
    for (const o of os) {
      const seg = o.subid ? profByUid.get(o.subid)?.segment : undefined
      const k = (seg ?? 'BROWSING') as SegmentKey
      segs.set(k, (segs.get(k) ?? 0) + o.value)
    }
    const topSegment = [...segs.entries()].sort((a, b) => b[1] - a[1])[0]
    return {
      ...post,
      revenue,
      credited,
      hidden: revenue - credited,
      revenuePer1kViews: post.views ? (revenue / post.views) * 1000 : 0,
      saveRate: post.views ? post.saves / post.views : 0,
      topSegment: topSegment?.[0] ?? null,
      topSegmentRevenue: topSegment?.[1] ?? 0,
    }
  })
  const byViews = [...rows].sort((a, b) => b.views - a.views).map(r => r.ref)
  const byRevenue = [...rows].sort((a, b) => b.revenue - a.revenue).map(r => r.ref)
  return rows.map(r => ({
    ...r,
    rankByViews: byViews.indexOf(r.ref) + 1,
    rankByRevenue: byRevenue.indexOf(r.ref) + 1,
  })).sort((a, b) => b.revenue - a.revenue)
}

/** The named answer to "who is important": individual Connectors, ranked. */
export function topConnectors(profiles: Profile[], limit = 8) {
  const downstream = new Map<string, { revenue: number; buyers: number; people: number }>()
  for (const p of profiles) {
    if (!p.sharerUid) continue
    const cur = downstream.get(p.sharerUid) ?? { revenue: 0, buyers: 0, people: 0 }
    cur.revenue += p.revenue
    cur.buyers += p.purchased ? 1 : 0
    cur.people += 1
    downstream.set(p.sharerUid, cur)
  }
  return profiles
    .filter(p => p.sharedToCount > 0)
    .map(p => ({
      uid: p.uid,
      ownRevenue: p.revenue,
      sharedTo: p.sharedToCount,
      ...(downstream.get(p.uid) ?? { revenue: 0, buyers: 0, people: 0 }),
    }))
    .sort((a, b) => (b.revenue + b.ownRevenue) - (a.revenue + a.ownRevenue))
    .slice(0, limit)
}

/**
 * Three separate days on the same link is the threshold that best recovers a saver.
 * Two is too loose (a single late return trips it); four buys precision at the cost
 * of a quarter of the recall. Scored against held-out truth, not asserted.
 */
export const SAVER_RETURN_DAYS = 3

export function saveProxyAccuracy(profiles: Profile[], truth: { uid: string; saves: number }[]) {
  const savesByUid = new Map(truth.map(t => [t.uid, t.saves]))
  let tp = 0, fp = 0, fn = 0
  for (const p of profiles) {
    const actual = savesByUid.get(p.uid)
    if (actual == null) continue
    const predicted = p.returnDays >= SAVER_RETURN_DAYS
    const isSaver = actual >= 3
    if (predicted && isSaver) tp++
    else if (predicted && !isSaver) fp++
    else if (!predicted && isSaver) fn++
  }
  return {
    precision: tp + fp ? tp / (tp + fp) : 0,
    recall: tp + fn ? tp / (tp + fn) : 0,
  }
}
