import type { ClickEvent, Profile, SegmentKey } from './types'

export const SEGMENT_ORDER: SegmentKey[] = ['REGULAR', 'RESEARCHER', 'CONNECTOR', 'SENT_ON', 'QUICK', 'BROWSING']

export const SEGMENTS: Record<SegmentKey, {
  label: string; signature: string; blurb: string; color: string
}> = {
  REGULAR: {
    label: 'The Regular', color: 'var(--seg-1)',
    signature: '3+ different posts, including old ones',
    blurb: 'Keeps coming back and ranges across her whole back catalogue.',
  },
  RESEARCHER: {
    label: 'The Researcher', color: 'var(--seg-2)',
    signature: 'One item, reopened 3+ times',
    blurb: 'Fixates on a single piece and reopens it for days before deciding.',
  },
  CONNECTOR: {
    label: 'The Connector', color: 'var(--seg-3)',
    signature: 'Passed the link to someone else',
    blurb: 'Treats her links as things to send to other people.',
  },
  SENT_ON: {
    label: 'Arrived from a friend', color: 'var(--seg-4)',
    signature: 'Came from off-platform, not Instagram',
    blurb: 'Not a follower yet. Someone they trust sent this to them.',
  },
  QUICK: {
    label: 'The Quick Ask', color: 'var(--seg-5)',
    signature: 'One open, no return',
    blurb: 'Wanted the link, took the link, left.',
  },
  BROWSING: {
    label: 'Unclassified', color: 'var(--series-dark)',
    signature: 'Too little to call',
    blurb: 'Two or three opens with no clear shape yet.',
  },
}

const DAY_MS = 86_400_000
const dayKey = (ts: string) => ts.slice(0, 10)

/**
 * Builds a behavioural profile per anonymous id using ONLY what a redirect can
 * observe: its own cookie, the timestamp, the Referer header, and which link was
 * asked for. Nothing the audience fills in, no page for them to visit, no extra
 * step anywhere in their day.
 *
 * Instagram will never say who saved a post. What it cannot hide is the shape of
 * someone's returns — and the shape is what distinguishes a person weighing one
 * purchase from a person browsing her whole back catalogue.
 */
export function buildProfiles(events: ClickEvent[]): Profile[] {
  const byUid = new Map<string, ClickEvent[]>()
  for (const e of events) {
    if (!byUid.has(e.uid)) byUid.set(e.uid, [])
    byUid.get(e.uid)!.push(e)
  }

  // Who each person demonstrably passed a link on to.
  const sharedTo = new Map<string, Set<string>>()
  for (const e of events) {
    if (!e.via) continue
    if (!sharedTo.has(e.via)) sharedTo.set(e.via, new Set())
    sharedTo.get(e.via)!.add(e.uid)
  }

  const profiles: Profile[] = []
  for (const [uid, evs] of byUid) {
    evs.sort((a, b) => a.ts.localeCompare(b.ts))
    const first = evs[0]
    const last = evs[evs.length - 1]

    const returnDays = new Set(evs.map(e => dayKey(e.ts))).size
    const distinctPosts = new Set(evs.map(e => e.postRef).filter(Boolean)).size
    const slugCounts = new Map<string, number>()
    for (const e of evs) slugCounts.set(e.slug, (slugCounts.get(e.slug) ?? 0) + 1)
    const distinctSlugs = slugCounts.size
    const topSlug = [...slugCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const sharerUid = evs.find(e => e.via)?.via ?? null
    const sharedToCount = sharedTo.get(uid)?.size ?? 0
    const spanDays = +((Date.parse(last.ts) - Date.parse(first.ts)) / DAY_MS).toFixed(1)

    let segment: SegmentKey = 'BROWSING'
    let reason = `${evs.length} opens, no clear shape yet`
    if (sharedToCount >= 1) {
      segment = 'CONNECTOR'
      reason = `Passed a link to ${sharedToCount} ${sharedToCount === 1 ? 'person' : 'people'}`
    } else if (sharerUid || first.refClass === 'whatsapp' || first.refClass === 'messages') {
      segment = 'SENT_ON'
      reason = sharerUid ? `Sent by ${sharerUid}` : `Arrived from ${first.refClass}, not Instagram`
    } else if (distinctPosts >= 3) {
      segment = 'REGULAR'
      reason = `${distinctPosts} different posts over ${returnDays} days`
    } else if (distinctSlugs === 1 && evs.length >= 3) {
      segment = 'RESEARCHER'
      reason = `Reopened ${topSlug} ${evs.length} times over ${spanDays}d`
    } else if (evs.length === 1) {
      segment = 'QUICK'
      reason = 'One open, never came back'
    }

    profiles.push({
      uid, segment, reason,
      touches: evs.length, returnDays, distinctPosts, distinctSlugs, spanDays,
      firstTs: first.ts, lastTs: last.ts,
      arrivedFrom: first.refClass, source: first.source, dmJob: first.dmJob,
      entryPost: first.postRef, topSlug,
      sharerUid, sharedToCount,
      subscriberId: evs.find(e => e.subscriberId)?.subscriberId ?? null,
      handle: evs.find(e => e.handle)?.handle ?? null,
    })
  }
  return profiles
}
