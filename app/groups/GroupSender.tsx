'use client'

import { useEffect, useState } from 'react'
import type { Item, SegmentKey } from '@/lib/types'

type Group = { key: SegmentKey; label: string; blurb: string; people: number; color: string }
type Recipient = { uid: string; handle: string | null; link: string; message: string }
type Result = { group: SegmentKey; total: number; recipients: Recipient[]; delivery: Recipient | null }

export function GroupSender({ groups, items, messages }: {
  groups: Group[]; items: Item[]; messages: Record<string, string>
}) {
  const [group, setGroup] = useState<SegmentKey>(groups[0]?.key ?? 'CONNECTOR')
  const [item, setItem] = useState('black-blazer')
  const [drafts, setDrafts] = useState(messages)
  const [deliverTo, setDeliverTo] = useState('sofia.styles')
  const [result, setResult] = useState<Result | null>(null)
  const [running, setRunning] = useState(false)
  const [opened, setOpened] = useState(false)

  const current = groups.find(g => g.key === group)
  useEffect(() => { setResult(null); setOpened(false) }, [group, item])

  const persist = () => {
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [group]: drafts[group] }),
    }).catch(() => { /* non-fatal: the draft still sends from state */ })
  }

  const run = async () => {
    setRunning(true)
    setOpened(false)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ group, item, message: drafts[group], deliverTo }),
      })
      setResult(await res.json())
    } finally {
      setRunning(false)
    }
  }

  const itemName = items.find(i => i.slug === item)?.name ?? item

  return (
    <div className="space-y-8">

      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-3">1 · Who gets it</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {groups.map(g => (
            <button
              key={g.key} type="button" onClick={() => setGroup(g.key)}
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

      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-3">
          2 · What you&apos;re sending them
        </p>
        <select
          className="rounded-lg border px-3 py-2 text-sm bg-surface-2 text-foreground mb-3"
          style={{ borderColor: 'var(--border)' }}
          value={item} onChange={e => setItem(e.target.value)}
        >
          {items.map(i => <option key={i.slug} value={i.slug}>{i.name}</option>)}
        </select>
        <textarea
          value={drafts[group] ?? ''}
          onChange={e => setDrafts(d => ({ ...d, [group]: e.target.value }))}
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

      <div>
        <div className="flex items-end gap-3 flex-wrap mb-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">3 · Send it</p>
          <label className="text-xs text-ink-2 ml-auto flex items-center gap-2">
            delivering to
            <input
              value={deliverTo} onChange={e => setDeliverTo(e.target.value)}
              className="rounded-lg border px-2 py-1 text-xs bg-surface-2 text-foreground w-40"
              style={{ borderColor: 'var(--border)' }}
            />
          </label>
        </div>
        <button
          type="button" onClick={run} disabled={running}
          className="text-sm rounded-lg px-4 py-2.5 font-medium text-white disabled:opacity-60"
          style={{ background: current?.color ?? 'var(--accent)' }}
        >
          {running
            ? 'Working through the list…'
            : `Send the ${itemName} to ${current?.people.toLocaleString('en-GB')} ${current?.label}`}
        </button>

        {result && (
          <div className="mt-5 rounded-xl border p-5 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-2xl font-semibold tnum">{result.total.toLocaleString('en-GB')}</p>
              <p className="text-sm text-ink-2">messages prepared, each with its own link</p>
            </div>

            {result.delivery && (
              <div className="mt-5">
                <p className="text-xs text-ink-3 mb-2">
                  Delivered to <strong className="text-foreground">@{result.delivery.handle}</strong> —
                  one account, so this stays a demo and the real one stays safe.
                </p>
                {/* The message exactly as it lands in a DM. */}
                <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
                     style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  {result.delivery.message}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="text-xs rounded-lg border px-3 py-2 hover:bg-background transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => navigator.clipboard?.writeText(result.delivery!.message)}
                  >
                    Copy the message
                  </button>
                  <button
                    type="button"
                    className="text-xs rounded-lg px-3 py-2 font-medium text-white"
                    style={{ background: 'var(--seg-3)' }}
                    onClick={async () => {
                      await fetch(result.delivery!.link + '&dry=1', { cache: 'no-store' })
                      setOpened(true)
                    }}
                  >
                    They open it
                  </button>
                  {opened && (
                    <span className="text-xs self-center" style={{ color: 'var(--seg-3)' }}>
                      ✓ recorded — tagged {result.group}, now on the dashboard
                    </span>
                  )}
                </div>
              </div>
            )}

            <details className="mt-5">
              <summary className="text-xs text-ink-3 cursor-pointer">
                See the other {(result.total - 1).toLocaleString('en-GB')} that were prepared
              </summary>
              <ul className="mt-3 divide-y" style={{ borderColor: 'var(--border)' }}>
                {result.recipients.slice(0, 10).map(r => (
                  <li key={r.uid} className="py-2 flex items-center gap-3 text-xs">
                    <code>{r.handle ? `@${r.handle}` : r.uid}</code>
                    <span className="text-ink-3 ml-auto truncate max-w-[22rem]">{r.link.split('?')[0]}?…</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
