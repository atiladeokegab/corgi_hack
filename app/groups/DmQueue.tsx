'use client'

import { useMemo, useState } from 'react'
import { buildPersonalLink } from '@/lib/links'
import { londonTime } from '@/lib/time'
import type { Item, SegmentKey } from '@/lib/types'

type Row = {
  uid: string; handle: string; segment: SegmentKey; reason: string
  totalSpent: number; orders: number; lastTs: string; topSlug: string; subscriberId: string
}
type Group = { key: SegmentKey; label: string; angle: string; color: string; people: number }

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')

const ago = (iso: string) => {
  const h = (Date.now() - Date.parse(iso)) / 3_600_000
  if (h < 1) return 'just now'
  if (h < 24) return `${Math.round(h)}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function DmQueue({ rows, groups, items, origin }: {
  rows: Row[]; groups: Group[]; items: Item[]; origin: string
}) {
  const [group, setGroup] = useState<SegmentKey | 'ALL'>('ALL')
  const [item, setItem] = useState('black-blazer')
  const [copied, setCopied] = useState<string | null>(null)

  const visible = useMemo(
    () => rows.filter(r => group === 'ALL' || r.segment === group),
    [rows, group],
  )
  const byKey = Object.fromEntries(groups.map(g => [g.key, g]))
  const active = group === 'ALL' ? null : byKey[group]

  const copy = (r: Row) => {
    const link = buildPersonalLink({
      origin, item, group: r.segment, subscriberId: r.subscriberId, handle: r.handle,
    })
    navigator.clipboard?.writeText(link).then(
      () => { setCopied(r.uid); setTimeout(() => setCopied(null), 1800) },
      () => setCopied(null),
    )
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button" onClick={() => setGroup('ALL')}
          className="text-xs rounded-lg border px-3 py-1.5 transition-colors"
          style={{
            borderColor: group === 'ALL' ? 'var(--accent)' : 'var(--border)',
            background: group === 'ALL' ? 'var(--accent)' : 'transparent',
            color: group === 'ALL' ? '#fff' : 'inherit',
          }}
        >
          Everyone
        </button>
        {groups.map(g => (
          <button
            key={g.key} type="button" onClick={() => setGroup(g.key)}
            className="text-xs rounded-lg border px-3 py-1.5 flex items-center gap-1.5 transition-colors"
            style={{ borderColor: group === g.key ? g.color : 'var(--border)', borderWidth: group === g.key ? 2 : 1 }}
          >
            <span className="size-2 rounded-full" style={{ background: g.color }} />
            {g.label}
          </button>
        ))}
        <label className="text-xs text-ink-2 ml-auto flex items-center gap-2">
          link points at
          <select
            className="rounded-lg border px-2 py-1.5 text-xs bg-surface-2 text-foreground"
            style={{ borderColor: 'var(--border)' }}
            value={item} onChange={e => setItem(e.target.value)}
          >
            {items.map(i => <option key={i.slug} value={i.slug}>{i.name}</option>)}
          </select>
        </label>
      </div>

      {active && (
        <p className="text-sm rounded-xl border p-3.5 bg-surface-2 leading-relaxed"
           style={{ borderColor: active.color }}>
          <strong className="font-medium">{active.label}.</strong>{' '}
          <span className="text-ink-2">{active.angle}</span>
        </p>
      )}

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm border-collapse min-w-[680px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
              <th className="font-medium pb-2 pr-4">Who</th>
              <th className="font-medium pb-2 pr-4">Why they&apos;re here</th>
              <th className="font-medium pb-2 pr-4 text-right">Spent</th>
              <th className="font-medium pb-2 pr-4 text-right">Last seen</th>
              <th className="font-medium pb-2 text-right">Their link</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <tr key={r.uid} className="border-t align-top" style={{ borderColor: 'var(--border)' }}>
                <td className="py-3 pr-4">
                  <p className="font-medium">@{r.handle}</p>
                  <p className="text-[11px] mt-0.5 flex items-center gap-1.5 text-ink-3">
                    <span className="size-1.5 rounded-full" style={{ background: byKey[r.segment]?.color }} />
                    {byKey[r.segment]?.label ?? r.segment}
                  </p>
                </td>
                <td className="py-3 pr-4 text-xs text-ink-2 max-w-[18rem] leading-snug">{r.reason}</td>
                <td className="py-3 pr-4 text-right tnum font-medium">
                  {r.totalSpent ? gbp(r.totalSpent) : <span className="text-ink-3 font-normal">—</span>}
                  {r.orders > 1 && <span className="block text-[11px] text-ink-3 font-normal">{r.orders} orders</span>}
                </td>
                <td className="py-3 pr-4 text-right text-xs text-ink-3 whitespace-nowrap">
                  {ago(r.lastTs)}
                  <span className="block">{londonTime(r.lastTs)}</span>
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button" onClick={() => copy(r)}
                    className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors whitespace-nowrap"
                    style={{ borderColor: copied === r.uid ? 'var(--seg-3)' : 'var(--border)', color: copied === r.uid ? 'var(--seg-3)' : 'inherit' }}
                  >
                    {copied === r.uid ? '✓ copied' : 'Copy link'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!visible.length && (
        <p className="text-sm text-ink-3 py-8">
          Nobody in this group has a handle attached yet — she can only message people
          who came in through a DM or a comment.
        </p>
      )}
    </div>
  )
}
