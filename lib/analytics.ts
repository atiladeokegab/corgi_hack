import type { ClickEvent, Item, Post, Profile, SegmentKey, Source } from './types'
import { SEGMENTS, SEGMENT_ORDER } from './classify'

const countBy = <T, K extends string>(xs: T[], key: (x: T) => K) => {
  const m = new Map<K, number>()
  for (const x of xs) { const k = key(x); m.set(k, (m.get(k) ?? 0) + 1) }
  return m
}
const topOf = <K extends string>(m: Map<K, number>) =>
  [...m.entries()].sort((a, b) => b[1] - a[1])[0] ?? null

export type SegmentRow = {
  key: SegmentKey
  label: string; evidence: string; signature: string; blurb: string; color: string
  people: number; share: number
  avgOpens: number; avgReturnDays: number; avgSpanDays: number
  topSource: Source | null; topJob: string | null; topItem: string | null
}

/** Segment mix — how her clicking audience actually divides up. */
export function segmentSummary(profiles: Profile[]): SegmentRow[] {
  const total = profiles.length
  return SEGMENT_ORDER.map(key => {
    const g = profiles.filter(p => p.segment === key)
    if (!g.length) return null
    const sources = countBy(g, p => p.source)
    const jobs = countBy(g.filter(p => p.dmJob), p => p.dmJob!)
    const slugs = countBy(g, p => p.topSlug)
    return {
      key,
      ...SEGMENTS[key],
      people: g.length,
      share: total ? g.length / total : 0,
      avgOpens: g.reduce((a, p) => a + p.touches, 0) / g.length,
      avgReturnDays: g.reduce((a, p) => a + p.returnDays, 0) / g.length,
      avgSpanDays: g.reduce((a, p) => a + p.spanDays, 0) / g.length,
      topSource: topOf(sources)?.[0] ?? null,
      topJob: topOf(jobs)?.[0] ?? null,
      topItem: topOf(slugs)?.[0] ?? null,
    }
  }).filter(Boolean) as SegmentRow[]
}

/** Where her audience comes from at all: caption link, DM reply, or a friend. */
export function sourceMix(profiles: Profile[]) {
  const total = profiles.length
  const labels: Record<Source, string> = {
    post: 'A caption link',
    dm: 'A DM reply',
    share: 'A friend passing it on',
  }
  return (['post', 'dm', 'share'] as Source[]).map(s => {
    const g = profiles.filter(p => p.source === s)
    return { source: s, label: labels[s], people: g.length, share: total ? g.length / total : 0 }
  })
}

type Row = { key: string; label: string; sub: string; total: number; mix: { key: SegmentKey; n: number }[] }

const mixOf = (g: Profile[]): Row['mix'] =>
  SEGMENT_ORDER.map(k => ({ key: k, n: g.filter(p => p.segment === k).length })).filter(m => m.n > 0)

/** Which post brings which kind of person. */
export function postBreakdown(posts: Post[], profiles: Profile[]): Row[] {
  return posts.map(post => {
    const g = profiles.filter(p => p.source === 'post' && p.entryPost === post.ref)
    return {
      key: post.ref,
      label: post.title,
      sub: `${post.linkCount} link${post.linkCount === 1 ? '' : 's'}`,
      total: g.length,
      mix: mixOf(g),
    }
  }).sort((a, b) => b.total - a.total)
}

/** Which DM question brings which kind of person — E-01's twelve jobs. */
export function dmBreakdown(profiles: Profile[]): Row[] {
  const dmPeople = profiles.filter(p => p.source === 'dm' && p.dmJob)
  const jobs = [...new Set(dmPeople.map(p => p.dmJob!))]
  return jobs.map(job => {
    const g = dmPeople.filter(p => p.dmJob === job)
    return { key: job, label: job, sub: '', total: g.length, mix: mixOf(g) }
  }).sort((a, b) => b.total - a.total)
}

/** Which pieces each group actually opens. */
export function itemBreakdown(items: Item[], profiles: Profile[]): Row[] {
  return items.map(item => {
    const g = profiles.filter(p => p.topSlug === item.slug)
    return {
      key: item.slug,
      label: item.name,
      sub: `“${item.sofiaSays}”`,
      total: g.length,
      mix: mixOf(g),
    }
  }).filter(r => r.total > 0).sort((a, b) => b.total - a.total)
}

/** Named Connectors — the answer to "who is worth replying to first". */
export function topConnectors(profiles: Profile[], limit = 8) {
  const reach = new Map<string, number>()
  for (const p of profiles) {
    if (!p.sharerUid) continue
    reach.set(p.sharerUid, (reach.get(p.sharerUid) ?? 0) + 1)
  }
  return profiles
    .filter(p => p.sharedToCount > 0)
    .map(p => ({
      uid: p.uid,
      sharedTo: p.sharedToCount,
      reached: reach.get(p.uid) ?? 0,
      source: p.source,
      dmJob: p.dmJob,
      entryPost: p.entryPost,
      topSlug: p.topSlug,
    }))
    .sort((a, b) => b.sharedTo - a.sharedTo)
    .slice(0, limit)
}

/**
 * Anonymous shares prove Connectors exist that the log cannot name. Size the gap
 * rather than quietly ignore it.
 */
export function connectorCoverage(profiles: Profile[], events: ClickEvent[]) {
  const shareArrivals = profiles.filter(p => p.segment === 'SENT_ON')
  const named = shareArrivals.filter(p => p.sharerUid).length
  const anonymous = shareArrivals.length - named
  const identified = profiles.filter(p => p.segment === 'CONNECTOR').length
  const fanOut = identified ? named / identified : 0
  return {
    identified,
    anonymous,
    shareArrivals: shareArrivals.length,
    estimatedUnnamed: fanOut > 0 ? Math.round(anonymous / fanOut) : 0,
  }
}

/** Does the classifier actually recover behaviour? Scored against held-out truth. */
export function recoveryAccuracy(profiles: Profile[], truth: { uid: string; archetype: string }[]) {
  const byUid = new Map(truth.map(t => [t.uid, t.archetype === 'SAME_DAY' ? 'QUICK' : t.archetype]))
  let hit = 0, seen = 0
  const confusion = new Map<string, number>()
  for (const p of profiles) {
    const actual = byUid.get(p.uid)
    if (!actual) continue
    seen++
    if (actual === p.segment) hit++
    else confusion.set(`${actual}->${p.segment}`, (confusion.get(`${actual}->${p.segment}`) ?? 0) + 1)
  }
  return {
    accuracy: seen ? hit / seen : 0,
    scored: seen,
    worst: [...confusion.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
  }
}
