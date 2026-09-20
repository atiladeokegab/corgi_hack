'use client'

import { useEffect, useState } from 'react'
import type { RedirectEvent } from '@/lib/types'

/** Polls the redirect log so a click made on stage appears without a reload. */
export function LiveFeed() {
  const [events, setEvents] = useState<RedirectEvent[]>([])
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const r = await fetch('/api/live', { cache: 'no-store' })
        const next: RedirectEvent[] = await r.json()
        if (!alive) return
        setEvents(prev => {
          if (next.length !== prev.length) setPulse(p => p + 1)
          return next
        })
      } catch { /* dev server restarting; next tick will catch up */ }
    }
    tick()
    const id = setInterval(tick, 2000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  if (!events.length) {
    return (
      <p className="text-sm text-ink-3 py-6">
        No live hits yet. Open one of the links above — the row lands here within two seconds.
      </p>
    )
  }

  return (
    <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
      {events.map((e, i) => (
        <li key={e.id} className="py-2.5 flex items-baseline gap-3 text-sm">
          <span
            className="size-1.5 rounded-full shrink-0 self-center"
            style={{ background: i === 0 && pulse ? 'var(--series-recovered)' : 'var(--series-dark)' }}
          />
          <code className="tnum text-xs text-ink-3 shrink-0">{e.ts.slice(11, 19)}</code>
          <code className="text-xs shrink-0" style={{ color: 'var(--series-credited)' }}>{e.uid}</code>
          <span className="font-medium truncate">{e.slug}</span>
          <span className="text-ink-3 text-xs ml-auto shrink-0">
            {e.refClass}{e.via ? ` · via ${e.via}` : ''}
          </span>
        </li>
      ))}
    </ul>
  )
}
