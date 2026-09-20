'use client'

import { useMemo, useState } from 'react'
import { londonTime } from '@/lib/time'
import { DmPreview } from '../components/DmPreview'

type Card = {
  id: string; handle: string; job: string; text: string; ts: string
  segment: string; segmentLabel: string; segmentColor: string
  itemName: string; asking: string; opens: number; distinctPosts: number
  autoable: boolean; needsHer: string | null
  draft: string | null; link: string
}

const ago = (iso: string) => {
  const h = (Date.now() - Date.parse(iso)) / 3_600_000
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`
  if (h < 24) return `${Math.round(h)}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function Triage({ cards }: { cards: Card[] }) {
  const [tab, setTab] = useState<'ready' | 'needs' | 'done'>('ready')
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [done, setDone] = useState<Record<string, { mode: 'template' | 'custom'; text: string }>>({})

  const ready = useMemo(() => cards.filter(c => c.autoable && !done[c.id]), [cards, done])
  const needs = useMemo(() => cards.filter(c => !c.autoable && !done[c.id]), [cards, done])
  const cleared = Object.keys(done).length
  const visible = tab === 'ready' ? ready : tab === 'needs' ? needs : cards.filter(c => done[c.id])

  const send = async (c: Card) => {
    const text = edits[c.id] ?? c.draft ?? ''
    if (!text.trim()) return
    const usedTemplate = text === c.draft
    navigator.clipboard?.writeText(text).catch(() => { /* clipboard blocked; reply still logged */ })
    setDone(d => ({ ...d, [c.id]: { mode: usedTemplate ? 'template' : 'custom', text } }))
    fetch('/api/reply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: c.id, handle: c.handle, job: c.job, usedTemplate }),
    }).catch(() => { /* non-fatal */ })
  }

  const Tab = ({ id, label, count }: { id: typeof tab; label: string; count: number }) => (
    <button
      type="button" onClick={() => setTab(id)}
      className="text-sm rounded-lg px-3 py-2 transition-colors"
      style={{
        background: tab === id ? 'var(--accent)' : 'transparent',
        color: tab === id ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${tab === id ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {label} <span className="tnum opacity-70">{count}</span>
    </button>
  )

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-6">
        <Tab id="ready" label="Ready to send" count={ready.length} />
        <Tab id="needs" label="Needs you" count={needs.length} />
        <Tab id="done" label="Cleared" count={cleared} />
        {cleared > 0 && (
          <p className="text-xs text-ink-3 ml-auto tnum">
{cleared} sent · {Math.round((cleared / cards.length) * 100)}% of today done
          </p>
        )}
      </div>

      {!visible.length && (
        <p className="text-sm text-ink-3 py-10">
          {tab === 'ready'
            ? 'All the easy ones are done. What is left needs you.'
            : tab === 'needs' ? 'Nothing is waiting on you.' : 'You have not sent anything yet.'}
        </p>
      )}

      <ul className="space-y-4">
        {visible.slice(0, 25).map(c => {
          const isDone = Boolean(done[c.id])
          return (
            <li
              key={c.id}
              className="rounded-xl border p-4 sm:p-5 bg-surface-2"
              style={{ borderColor: isDone ? 'var(--seg-3)' : 'var(--border)' }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="size-2 rounded-full shrink-0" style={{ background: c.segmentColor }} />
                <p className="font-medium text-sm">@{c.handle}</p>
                <p className="text-[11px] text-ink-3">{c.segmentLabel}</p>
                {c.opens > 1 && (
                  <p className="text-[11px] text-ink-3">
                    · opened your links {c.opens} times{c.distinctPosts > 1 ? ` across ${c.distinctPosts} posts` : ''}
                  </p>
                )}
                <p className="text-[11px] text-ink-3 ml-auto">{ago(c.ts)} · {londonTime(c.ts)}</p>
              </div>

              <p className="mt-3 text-sm leading-relaxed rounded-lg px-3.5 py-2.5"
                 style={{ background: 'var(--background)' }}>
                {c.text}
              </p>

              <p className="text-[11px] uppercase tracking-[0.1em] text-ink-3 font-medium mt-3">
                Really asking · {c.asking}
              </p>

              {isDone ? (
                <div className="mt-4">
                  <p className="text-sm mb-3" style={{ color: 'var(--seg-3)' }}>
                    ✓ Sent {done[c.id].mode === 'template' ? '' : 'in your own words'}
                  </p>
                  <DmPreview
                    handle={`@${c.handle}`}
                    caption="What they just got"
                    bubbles={[
                      { from: 'them', text: c.text },
                      { from: 'you', text: done[c.id].text.replace(c.link, '').trim(), link: c.link, linkLabel: c.itemName },
                    ]}
                  />
                </div>
              ) : (
                <>
                  {c.needsHer && (
                    <p className="text-xs mt-3 rounded-lg px-3 py-2 leading-relaxed"
                       style={{ background: 'var(--background)', color: 'var(--text-secondary)' }}>
                      {c.needsHer} Their link is ready below if you want it.
                    </p>
                  )}
                  <textarea
                    value={edits[c.id] ?? c.draft ?? ''}
                    onChange={e => setEdits(v => ({ ...v, [c.id]: e.target.value }))}
                    onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send(c) }}
                    rows={c.autoable ? 3 : 2}
                    placeholder={c.autoable ? '' : 'Your words. Nobody can write this one for you.'}
                    className="w-full rounded-lg border p-3 text-sm mt-3 leading-relaxed bg-background text-foreground"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <div className="flex flex-wrap gap-2 mt-2.5 items-center">
                    <button
                      type="button" onClick={() => send(c)}
                      className="text-xs rounded-lg px-3 py-2 font-medium text-white"
                      style={{ background: c.autoable ? 'var(--seg-3)' : 'var(--accent)' }}
                    >
                      {c.autoable && (edits[c.id] ?? c.draft) === c.draft ? 'Send this' : 'Send mine'}
                    </button>
                    {c.autoable && (edits[c.id] ?? c.draft) !== c.draft && (
                      <button
                        type="button"
                        onClick={() => setEdits(v => ({ ...v, [c.id]: c.draft ?? '' }))}
                        className="text-xs rounded-lg border px-3 py-2 hover:bg-background transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        Back to the template
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(c.link)}
                      className="text-xs rounded-lg border px-3 py-2 hover:bg-background transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      Copy just the link
                    </button>
                    <span className="text-[11px] text-ink-3 ml-auto hidden sm:inline">⌘↵ to send</span>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {visible.length > 25 && (
        <p className="text-xs text-ink-3 mt-5">
          Showing 25 of {visible.length}. Send these and the next lot appear.
        </p>
      )}
    </div>
  )
}
