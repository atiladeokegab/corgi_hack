'use client'

import { useEffect, useState } from 'react'
import type { Item, SegmentKey } from '@/lib/types'

type Group = { key: SegmentKey; label: string; blurb: string; people: number; color: string }
type Recipient = { uid: string; handle: string | null; status: 'sending' | 'queued'; hoursSinceContact: number }
type Result = { group: SegmentKey; total: number; sending: number; queued: number; recipients: Recipient[] }

export function GroupSender({ groups, items, messages }: {
  groups: Group[]; items: Item[]; messages: Record<string, string>
}) {
  const [group, setGroup] = useState<SegmentKey>(groups[0]?.key ?? 'CONNECTOR')
  const [item, setItem] = useState('black-blazer')
  const [drafts, setDrafts] = useState(messages)
  const [result, setResult] = useState<Result | null>(null)
  const [running, setRunning] = useState(false)

  const current = groups.find(g => g.key === group)
  useEffect(() => { setResult(null) }, [group, item])

  const save = (text: string) => {
    setDrafts(d => ({ ...d, [group]: text }))
  }

  const persist = () => {
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [group]: drafts[group] }),
    }).catch(() => { /* non-fatal: the draft still sends from state */ })
  }

  const run = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ group, item, message: drafts[group] }),
      })
      setResult(await res.json())
    } finally {
      setRunning(false)
    }
  }

  const itemName = items.find(i => i.slug === item)?.name ?? item

  return (
    <div className="space-y-8">

      {/* 1 — who */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-3">
          1 · Who gets it
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {groups.map(g => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
              className="text-left rounded-xl border p-3.5 transition-colors bg-surface-2 hover:bg-background"
              style={{ borderColor: group === g.key ? g.color : 'var(--border)', borderWidth: group === g.key ? 2 : 1 }}
            >
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full shrink-0" style={{ background: g.color }} />
                <span className="text-sm font-medium">{g.label}</span>
                <span className="ml-auto text-sm tnum font-semibold">{g.people.toLocaleString('en-GB')}</span>
              </span>
              <span className="block text-xs text-ink-2 mt-1 leading-snug">{g.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2 — what */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-3">
          2 · What you&apos;re sending them
        </p>
        <select
          className="rounded-lg border px-3 py-2 text-sm bg-surface-2 text-foreground mb-3"
          style={{ borderColor: 'var(--border)' }}
          value={item}
          onChange={e => setItem(e.target.value)}
        >
          {items.map(i => <option key={i.slug} value={i.slug}>{i.name}</option>)}
        </select>
        <textarea
          value={drafts[group] ?? ''}
          onChange={e => save(e.target.value)}
          onBlur={persist}
          rows={5}
          className="w-full rounded-xl border p-4 text-sm bg-surface-2 text-foreground leading-relaxed"
          style={{ borderColor: 'var(--border)' }}
        />
        <p className="text-xs text-ink-3 mt-2">
          <code>{'{link}'}</code> becomes each person&apos;s own link — it carries who they
          are and which group they were in, so you find out whether this message worked.
        </p>
      </div>

      {/* 3 — go */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-3">
          3 · Send it
        </p>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="text-sm rounded-lg px-4 py-2.5 font-medium text-white disabled:opacity-60"
          style={{ background: current?.color ?? 'var(--accent)' }}
        >
          {running
            ? 'Working through the list…'
            : `Send the ${itemName} to ${current?.people.toLocaleString('en-GB')} ${current?.label}`}
        </button>

        {result && (
          <div className="mt-5 rounded-xl border p-5 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-semibold tnum">{result.total.toLocaleString('en-GB')}</p>
                <p className="text-xs text-ink-3 mt-0.5">in the group</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tnum" style={{ color: 'var(--seg-3)' }}>
                  {result.sending.toLocaleString('en-GB')}
                </p>
                <p className="text-xs text-ink-3 mt-0.5">going out now</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tnum" style={{ color: 'var(--seg-4)' }}>
                  {result.queued.toLocaleString('en-GB')}
                </p>
                <p className="text-xs text-ink-3 mt-0.5">queued</p>
              </div>
            </div>
            <p className="text-xs text-ink-2 mt-4 leading-relaxed">
              Instagram only lets her message someone who contacted her in the last 24
              hours, so the rest are held and sent the moment they next comment or DM.
              Nobody is dropped and nothing goes out uninvited — which is what keeps the
              account safe.
            </p>
            <ul className="mt-4 divide-y" style={{ borderColor: 'var(--border)' }}>
              {result.recipients.slice(0, 8).map(r => (
                <li key={r.uid} className="py-2 flex items-center gap-3 text-sm">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ background: r.status === 'sending' ? 'var(--seg-3)' : 'var(--seg-4)' }}
                  />
                  <code className="text-xs">{r.handle ? `@${r.handle}` : r.uid}</code>
                  <span className="text-xs text-ink-3 ml-auto">
                    {r.status === 'sending' ? 'sending now' : `queued · last heard from ${r.hoursSinceContact}h ago`}
                  </span>
                </li>
              ))}
            </ul>
            {result.total > 8 && (
              <p className="text-xs text-ink-3 mt-3">…and {(result.total - 8).toLocaleString('en-GB')} more.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
