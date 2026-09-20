import type { Order, Post, Profile, RedirectEvent, SegmentKey } from './types'

export const SEGMENTS: Record<SegmentKey, { label: string; evidence: string; blurb: string }> = {
  CONNECTOR:   { label: 'The Connector',   evidence: 'E-07.4 Ella',  blurb: 'Sends looks on. Someone else completes the purchase.' },
  SENT_ON:     { label: 'Sent by a friend', evidence: 'E-01.5 / E-01.11', blurb: 'Arrived off-platform, on a personal recommendation.' },
  DELIBERATOR: { label: 'The Deliberator', evidence: 'E-07.3 Priya', blurb: 'Sits on it for days, then buys the expensive one.' },
  REGULAR:     { label: 'The Regular',     evidence: 'E-07.2 Jamie', blurb: 'Returns again and again and has never bought. Her highest-intent unconverted group.' },
  IMPULSE:     { label: 'The Impulse',     evidence: 'E-10 link_click', blurb: 'Clicks and buys same day. The only one the affiliate dashboard sees.' },
  BROWSING:    { label: 'Browsing',        evidence: '—',             blurb: 'Not enough signal yet.' },
}

const dayKey = (ts: string) => ts.slice(0, 10)
const DAY_MS = 86_400_000

/**
 * Builds a behavioural profile per anonymous id using ONLY what a redirect can
 * observe: its own cookie, the timestamp, the Referer header and the link it was
 * asked for. No Instagram data, no form, nothing the audience has to opt into.
 *
 * `returnDays` is the load-bearing inference. Instagram will never tell you who
 * saved a post, and a first click says little — almost everyone clicks the day they
 * see it. But coming back to the same link on a separate day is reconsideration,
 * and reconsideration is what a save actually is. That is the save signal,
 * recovered indirectly and measured against held-out truth on the dashboard.
 */
export function buildProfiles(events: RedirectEvent[], orders: Order[], posts: Post[]): Profile[] {
  const postByRef = new Map(posts.map(p => [p.ref, p]))
  const byUid = new Map<string, RedirectEvent[]>()
  for (const e of events) {
    if (!byUid.has(e.uid)) byUid.set(e.uid, [])
    byUid.get(e.uid)!.push(e)
  }

  // How many people each uid demonstrably passed a link on to.
  const sharedTo = new Map<string, Set<string>>()
  for (const e of events) {
    if (!e.via) continue
    if (!sharedTo.has(e.via)) sharedTo.set(e.via, new Set())
    sharedTo.get(e.via)!.add(e.uid)
  }

  const ordersBySubid = new Map<string, Order[]>()
  for (const o of orders) {
    if (!o.subid) continue
    if (!ordersBySubid.has(o.subid)) ordersBySubid.set(o.subid, [])
    ordersBySubid.get(o.subid)!.push(o)
  }

  const profiles: Profile[] = []
  for (const [uid, evs] of byUid) {
    evs.sort((a, b) => a.ts.localeCompare(b.ts))
    const first = evs[0]
    const last = evs[evs.length - 1]
    const post = first.postRef ? postByRef.get(first.postRef) : undefined
    const lagDays = post
      ? +((Date.parse(first.ts) - Date.parse(post.publishedAt + 'T09:00:00Z')) / DAY_MS).toFixed(2)
      : null

    const returnDays = new Set(evs.map(e => dayKey(e.ts))).size
    const distinctPosts = new Set(evs.map(e => e.postRef).filter(Boolean)).size
    const sharerUid = evs.find(e => e.via)?.via ?? null
    const sharedToCount = sharedTo.get(uid)?.size ?? 0

    const myOrders = ordersBySubid.get(uid) ?? []
    const revenue = myOrders.reduce((a, o) => a + o.value, 0)
    const purchased = myOrders.length > 0
    const daysToBuy = purchased
      ? +((Date.parse(myOrders[0].ts) - Date.parse(first.ts)) / DAY_MS).toFixed(2)
      : null

    let segment: SegmentKey = 'BROWSING'
    let reason = 'One touch, no return, no share'
    if (sharedToCount >= 1) {
      segment = 'CONNECTOR'
      reason = `Passed a link to ${sharedToCount} ${sharedToCount === 1 ? 'person' : 'people'}`
    } else if (sharerUid || first.refClass === 'whatsapp' || first.refClass === 'messages') {
      segment = 'SENT_ON'
      reason = sharerUid ? `Arrived via ${sharerUid}` : `Arrived from ${first.refClass}, not Instagram`
    } else if (purchased && returnDays >= 3 && (daysToBuy ?? 0) >= 2) {
      segment = 'DELIBERATOR'
      reason = `Came back on ${returnDays} days, bought after ${daysToBuy!.toFixed(1)}d`
    } else if (returnDays >= 3) {
      segment = 'REGULAR'
      reason = `${returnDays} separate days, ${distinctPosts} post${distinctPosts === 1 ? '' : 's'}, no purchase yet`
    } else if (purchased && (daysToBuy ?? 99) < 1) {
      segment = 'IMPULSE'
      reason = 'Clicked and bought the same day'
    }

    profiles.push({
      uid, segment, reason,
      touches: evs.length, returnDays, distinctPosts, lagDays,
      firstTs: first.ts, lastTs: last.ts, arrivedFrom: first.refClass,
      sharerUid, sharedToCount,
      purchased, revenue,
      affiliateCredited: myOrders.some(o => o.affiliateCredited),
      daysToBuy,
    })
  }
  return profiles
}
