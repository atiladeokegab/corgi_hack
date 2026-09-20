import type { Item, Post, Profile } from './types'
import { SEGMENTS } from './classify'
import type { QueueRow } from './triage'

/**
 * What she should have in front of her while she answers this one message.
 *
 * Problem #9 in docs/problem-map.md: her judgement is scattered across voice
 * notes, Notion, screenshots and a paper notebook, and is not findable — by
 * anyone, including her. She has already answered most of what she is being
 * asked; she just cannot retrieve her own answer in the four seconds a DM
 * reply deserves.
 *
 * So this retrieves rather than generates. Every row it returns is something
 * she already made or already said, with the reason it surfaced attached.
 * Deterministic ranking over data in the repo: no inference, no API call.
 */

export type Suggestion = {
  kind: 'post' | 'item' | 'stat'
  label: string
  detail: string
  why: string
  ref: string
}

export function recommendFor(
  row: QueueRow,
  { posts, items, profiles }: { posts: Post[]; items: Item[]; profiles: Profile[] },
): Suggestion[] {
  const out: Suggestion[] = []
  const item = row.item ? items.find(i => i.slug === row.item!.slug) ?? null : null

  // 1. Her own footage and captions for this piece — B-roll she has already shot.
  if (item) {
    const appearances = posts
      .filter(p => p.items.includes(item.slug))
      .sort((a, b) => b.saves - a.saves)
    for (const p of appearances.slice(0, 2)) {
      out.push({
        kind: 'post',
        label: p.title,
        detail: `${p.views.toLocaleString()} views · ${p.saves.toLocaleString()} saves · ${p.publishedAt.slice(0, 10)}`,
        why: `You already filmed the ${item.name.toLowerCase()} here`,
        ref: p.ref,
      })
    }
  }

  // 2. Pieces she has stood behind that sit next to this one.
  if (item) {
    const near = items.filter(i =>
      i.slug !== item.slug && (i.category === item.category || i.style === item.style))
    // A budget question wants the cheaper neighbour first; everything else wants the closest.
    const ordered = row.job === 'BUDGET'
      ? near.sort((a, b) => tierRank(a.tier) - tierRank(b.tier))
      : near
    for (const i of ordered.slice(0, 2)) {
      out.push({
        kind: 'item',
        label: i.name,
        detail: `${i.tier} · ${i.style} · “${i.sofiaSays}”`,
        why: i.category === item.category ? `Same category as the ${item.name.toLowerCase()}` : `Same ${i.style.toLowerCase()} line`,
        ref: i.ref,
      })
    }
  }

  // 3. The one number that should change how she answers this message.
  if (row.value) {
    const v = row.value
    out.push({
      kind: 'stat',
      label: v.topSegment ? `Mostly ${v.topSegment}` : 'Mixed audience',
      detail: `${v.people} people · ${Math.round(v.returnRate * 100)}% come back · ${v.onwardReach.toFixed(2)} onward shares each`,
      why: v.quickShare > 0.5
        ? 'Most of these never return. Answer it fast, do not spend your best thinking here'
        : v.connectorShare > 0.2
          ? 'This question brings people who pass your links on. Worth a proper answer'
          : 'These come back and reconsider before deciding',
      ref: v.job,
    })
  }

  // 4. Who she is talking to, when the redirect has met them before.
  const known = profiles.find(p => p.subscriberId && `@${p.subscriberId}` === row.handle)
  if (known) {
    out.push({
      kind: 'stat',
      label: SEGMENTS[known.segment].label,
      detail: `${known.touches} opens over ${known.spanDays}d · arrived via ${known.arrivedFrom}`,
      why: known.reason,
      ref: known.uid,
    })
  }

  return out
}

const tierRank = (t: Item['tier']) => (t === 'entry' ? 0 : t === 'mid' ? 1 : 2)
