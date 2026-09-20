'use client'

import { useRef, useState } from 'react'
import { DmPreview } from '../components/DmPreview'

type Person = { handle: string }

const CAST: Person[] = [
  { handle: 'ellawears' }, { handle: 'junodaily' }, { handle: 'mira.edit' },
  { handle: 'saoirse_x' }, { handle: 'tilly.closet' },
]

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

export function CommentDemo({ keyword, itemName, slug, postSlug }: {
  keyword: string; itemName: string; slug: string; postSlug: string
}) {
  const [comments, setComments] = useState<string[]>([])
  const [sent, setSent] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const cancelled = useRef(false)

  const run = async () => {
    cancelled.current = false
    setRunning(true); setDone(false); setComments([]); setSent([])
    try {
      for (const p of CAST) {
        if (cancelled.current) return
        setComments(c => [...c, p.handle])
        await wait(420)
      }
      await wait(350)
      for (const p of CAST) {
        if (cancelled.current) return
        setSent(s => [...s, p.handle])
        // The DM is pretend. The click it produces is a real one, recorded the
        // same way as any other — which is the only part of this we can prove.
        const params = new URLSearchParams({
          p: postSlug, s: `mc_demo_${p.handle}`, h: p.handle, src: 'instagram_dm', dry: '1',
        })
        fetch(`/r/${slug}?${params}`, { cache: 'no-store' }).catch(() => {})
        await wait(520)
      }
      setDone(true)
    } finally {
      setRunning(false)
    }
  }

  const latest = sent[sent.length - 1]

  return (
    <section className="rounded-2xl border p-5 sm:p-6 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-baseline gap-3 flex-wrap">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          What the automation does
        </p>
        <button
          type="button" onClick={run} disabled={running}
          className="ml-auto text-xs rounded-lg px-3 py-2 font-medium text-white disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {running ? 'Running…' : done ? 'Run it again' : 'Watch it run'}
        </button>
      </div>

      <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
        Put a keyword in your caption. Anyone who comments it gets your affiliate link
        automatically, at any hour, without you touching it.
      </p>

      <div className="grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-5 items-start mt-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-2">
            Your caption
          </p>
          <div className="rounded-xl border p-3.5 text-sm leading-relaxed"
               style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
            The one I keep reaching for. Comment{' '}
            <strong className="font-semibold" style={{ color: 'var(--accent)' }}>{keyword}</strong>
            {' '}and I&apos;ll send you the link x
          </div>

          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mt-4 mb-2">
            Comments {comments.length > 0 && <span className="tnum">({comments.length})</span>}
          </p>
          <ul className="space-y-1.5 min-h-[7rem]">
            {comments.map(h => (
              <li key={h} className="text-xs flex items-center gap-2">
                <span className="size-4 rounded-full shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--seg-5), var(--seg-4))' }} />
                <span className="font-medium">@{h}</span>
                <span className="text-ink-2">{keyword}</span>
                {sent.includes(h) && (
                  <span className="ml-auto text-[11px]" style={{ color: 'var(--seg-3)' }}>✓ sent</span>
                )}
              </li>
            ))}
            {!comments.length && (
              <li className="text-xs text-ink-3">Press <em>Watch it run</em>.</li>
            )}
          </ul>
        </div>

        <p className="text-2xl text-ink-3 text-center rotate-90 md:rotate-0 self-center" aria-hidden>→</p>

        <DmPreview
          handle={latest ? `@${latest}` : '@ellawears'}
          caption={latest ? 'Sent automatically, just now' : 'Two seconds after they comment'}
          bubbles={[
            { from: 'them', text: keyword },
            { from: 'you', text: 'here you go x', link: `/r/${slug}`, linkLabel: itemName },
          ]}
        />
      </div>

      <p className="text-xs text-ink-3 mt-5 leading-relaxed rounded-lg px-3 py-2.5"
         style={{ background: 'var(--background)' }}>
        <strong className="text-foreground font-medium">What is real here:</strong> the
        five taps this produces. They are recorded exactly like any other and appear in
        the feed at the bottom of this page.{' '}
        <strong className="text-foreground font-medium">What is not:</strong> the sending.
        Edna is not connected to ManyChat, so nothing was posted to Instagram. Connecting
        it is an account and an API key, and changes nothing else.
      </p>
    </section>
  )
}
