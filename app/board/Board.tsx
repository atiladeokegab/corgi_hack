'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Her workspace, on one canvas.
 *
 * Problem #9 in docs/problem-map.md: her judgement is scattered across voice
 * notes, Notion, screenshots and a paper notebook, and is findable by nobody,
 * including her. This does not solve that — it gives the pieces one surface
 * where they can be put next to each other and moved through a decision.
 *
 * Deliberately no drag-and-drop library. Pointer events cover mouse, trackpad
 * and touch in about forty lines, and a demo that ships zero new dependencies
 * is a demo that still builds at 17:55.
 */

export type BoardCard = {
  id: string
  kind: 'dm' | 'item' | 'post' | 'note'
  title: string
  body: string
  meta: string
}

type Pos = { x: number; y: number }
type Note = { id: string; text: string; x: number; y: number }

const COLUMNS = [
  { key: 'inbox', label: 'Inbox', blurb: 'Came in. Not looked at yet.' },
  { key: 'deciding', label: 'Deciding', blurb: 'Needs her eye on it.' },
  { key: 'answered', label: 'Answered', blurb: 'Done, and it went out.' },
] as const

const KIND_COLOR: Record<BoardCard['kind'], string> = {
  dm: 'var(--seg-2)',
  item: 'var(--seg-1)',
  post: 'var(--seg-3)',
  note: 'var(--seg-4)',
}

const CARD_W = 216
const LANE = 300
const TOP = 56

export function Board({ cards }: { cards: BoardCard[] }) {
  const [positions, setPositions] = useState<Record<string, Pos>>({})
  const [notes, setNotes] = useState<Note[]>([])
  const [loaded, setLoaded] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const surface = useRef<HTMLDivElement>(null)
  const grab = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Whatever she arranged last time. Until it arrives, lay the cards out in a
  // sensible default so the board is never empty on first paint.
  useEffect(() => {
    let live = true
    fetch('/api/board')
      .then(r => r.json())
      .then((s: { positions?: Record<string, Pos>; notes?: Note[] }) => {
        if (!live) return
        setPositions(s.positions ?? {})
        setNotes(s.notes ?? [])
      })
      .catch(() => { /* first run, no board yet */ })
      .finally(() => { if (live) setLoaded(true) })
    return () => { live = false }
  }, [])

  const save = useCallback((p: Record<string, Pos>, n: Note[]) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetch('/api/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: p, notes: n }),
      })
        .then(() => {
          setSaved(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        })
        .catch(() => { /* the board still works unsaved */ })
    }, 500)
  }, [])

  useEffect(() => {
    if (!dragging) return

    const move = (e: PointerEvent) => {
      const g = grab.current
      const box = surface.current?.getBoundingClientRect()
      if (!g || !box) return
      const x = Math.max(0, Math.min(box.width - CARD_W, e.clientX - box.left - g.dx))
      const y = Math.max(0, Math.min(box.height - 60, e.clientY - box.top - g.dy))
      setPositions(p => ({ ...p, [g.id]: { x, y } }))
    }

    const up = () => {
      grab.current = null
      setDragging(null)
      setPositions(p => { save(p, notes); return p })
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [dragging, notes, save])

  const start = (id: string) => (e: React.PointerEvent) => {
    const box = surface.current?.getBoundingClientRect()
    if (!box) return
    const at = positions[id] ?? defaultPos(id, cards)
    grab.current = { id, dx: e.clientX - box.left - at.x, dy: e.clientY - box.top - at.y }
    setDragging(id)
  }

  const addNote = () => {
    const note: Note = { id: `note_${Date.now().toString(36)}`, text: '', x: 24, y: TOP + 24 }
    const next = [...notes, note]
    setNotes(next)
    save(positions, next)
  }

  const editNote = (id: string, text: string) => {
    const next = notes.map(n => (n.id === id ? { ...n, text } : n))
    setNotes(next)
    save(positions, next)
  }

  const removeNote = (id: string) => {
    const next = notes.filter(n => n.id !== id)
    setNotes(next)
    save(positions, next)
  }

  const all: (BoardCard & { pos: Pos })[] = [
    ...cards.map(c => ({ ...c, pos: positions[c.id] ?? defaultPos(c.id, cards) })),
    ...notes.map(n => ({
      id: n.id, kind: 'note' as const, title: 'Note', body: n.text, meta: '',
      pos: positions[n.id] ?? { x: n.x, y: n.y },
    })),
  ]

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={addNote}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          Add a note
        </button>
        <span className="text-[11px] text-ink-3">
          {!loaded ? 'loading your board…' : saved ? `saved ${saved}` : 'drag a card — it saves itself'}
        </span>
      </div>

      <div
        ref={surface}
        className="relative rounded-xl border overflow-hidden select-none"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', height: 680, touchAction: 'none' }}
      >
        {COLUMNS.map((col, i) => (
          <div
            key={col.key}
            className="absolute top-0 bottom-0 border-r last:border-r-0 pointer-events-none"
            style={{ left: i * LANE, width: LANE, borderColor: 'var(--grid)' }}
          >
            <div className="px-4 pt-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">{col.label}</p>
              <p className="text-[11px] text-ink-3 mt-0.5 leading-snug">{col.blurb}</p>
            </div>
          </div>
        ))}

        {all.map(card => (
          <article
            key={card.id}
            onPointerDown={start(card.id)}
            className="absolute rounded-lg border px-3 py-2.5 cursor-grab active:cursor-grabbing"
            style={{
              left: card.pos.x,
              top: card.pos.y,
              width: CARD_W,
              borderColor: dragging === card.id ? KIND_COLOR[card.kind] : 'var(--border)',
              background: 'var(--background)',
              boxShadow: dragging === card.id ? '0 8px 24px rgba(0,0,0,0.14)' : 'none',
              zIndex: dragging === card.id ? 20 : 1,
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: KIND_COLOR[card.kind] }} />
              <span className="text-[10px] uppercase tracking-[0.1em] text-ink-3 font-medium">{card.kind}</span>
              {card.kind === 'note' && (
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={() => removeNote(card.id)}
                  className="ml-auto text-[10px] text-ink-3 hover:text-foreground"
                >
                  remove
                </button>
              )}
            </div>

            {card.kind === 'note' ? (
              <textarea
                value={card.body}
                onPointerDown={e => e.stopPropagation()}
                onChange={e => editNote(card.id, e.target.value)}
                placeholder="Anything you would have put on a sticky note"
                rows={3}
                className="w-full mt-1.5 bg-transparent text-xs leading-snug resize-none outline-none placeholder:text-ink-3"
              />
            ) : (
              <>
                <p className="text-xs font-medium mt-1.5 leading-snug">{card.title}</p>
                <p className="text-[11px] text-ink-2 mt-1 leading-snug">{card.body}</p>
                {card.meta && <p className="text-[10px] text-ink-3 mt-1.5">{card.meta}</p>}
              </>
            )}
          </article>
        ))}
      </div>
    </>
  )
}

/** Stack everything in Inbox on first run, in a readable ladder. */
function defaultPos(id: string, cards: BoardCard[]): Pos {
  const i = Math.max(0, cards.findIndex(c => c.id === id))
  return { x: 20 + (i % 2) * 8, y: TOP + 12 + i * 92 }
}
