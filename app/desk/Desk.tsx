'use client'

import { useMemo, useState } from 'react'
import type { QueueRow, Owner } from '@/lib/triage'
import { OWNERS } from '@/lib/triage'
import type { Draft } from '@/lib/reply'
import type { Suggestion } from '@/lib/recommend'
import type { Cohort } from '@/lib/broadcast'
import { testLink } from '@/lib/link'

type Prepared = {
  row: QueueRow
  itemName: string | null
  draft: Draft | null
  suggestions: Suggestion[]
}

const OWNER_COLOR: Record<Owner, string> = {
  SOFIA: 'var(--seg-2)',
  VA: 'var(--seg-1)',
  AGENT: 'var(--seg-3)',
}

export function Desk({
  prepared, cohorts, saving,
}: {
  prepared: Prepared[]
  cohorts: Cohort[]
  saving: { cohorts: number; repliesAvoided: number; ofMonthly: number; sendsRequired: number }
}) {
  const [filter, setFilter] = useState<Owner | 'ALL'>('ALL')
  const [open, setOpen] = useState<string | null>(prepared[0]?.row.ref ?? null)
  const [sent, setSent] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const shown = useMemo(
    () => filter === 'ALL' ? prepared : prepared.filter(p => p.row.owner === filter),
    [prepared, filter],
  )

  const copy = async (ref: string, text: string) => {
    const absolute = text.replace(/(^|\s)\/r\//g, `$1${window.location.origin}/r/`)
    try {
      await navigator.clipboard.writeText(absolute)
      setCopied(ref)
      setTimeout(() => setCopied(c => (c === ref ? null : c)), 1600)
    } catch { /* clipboard blocked — the draft is on screen either way */ }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        <Tab active={filter === 'ALL'} onClick={() => setFilter('ALL')} label={`Everything (${prepared.length})`} />
        {(['SOFIA', 'VA', 'AGENT'] as Owner[]).map(o => (
          <Tab
            key={o}
            active={filter === o}
            onClick={() => setFilter(o)}
            label={`${OWNERS[o].label} (${prepared.filter(p => p.row.owner === o).length})`}
            color={OWNER_COLOR[o]}
          />
        ))}
      </div>

      <div className="space-y-2.5">
        {shown.map(({ row, itemName, draft, suggestions }) => {
          const isOpen = open === row.ref
          return (
            <article
              key={row.ref}
              className="rounded-xl border bg-surface-2 overflow-hidden"
              style={{ borderColor: isOpen ? OWNER_COLOR[row.owner] : 'var(--border)' }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : row.ref)}
                className="w-full text-left px-4 sm:px-5 py-4 flex items-start gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-lg font-semibold tnum text-ink-3 w-6 shrink-0 pt-0.5">{row.rank}</span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{row.handle}</span>
                    <Chip label={row.job ?? row.labelledJob} />
                    {row.moved !== 0 && (
                      <span
                        className="text-[10px] uppercase tracking-[0.1em] font-medium tnum"
                        style={{ color: row.moved > 0 ? 'var(--seg-3)' : 'var(--seg-5)' }}
                      >
                        {row.moved > 0 ? `↑ ${row.moved} on volume` : `↓ ${-row.moved} on volume`}
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-ink-2 mt-1.5 leading-snug">{row.message}</span>
                </span>

                <span
                  className="text-[10px] uppercase tracking-[0.1em] font-semibold px-2 py-1 rounded shrink-0"
                  style={{ color: OWNER_COLOR[row.owner], background: 'color-mix(in srgb, currentColor 10%, transparent)' }}
                >
                  {OWNERS[row.owner].label}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs text-ink-3 mt-4 leading-relaxed">
                    <strong className="text-ink-2">{OWNERS[row.owner].label}.</strong> {row.why}
                  </p>

                  {draft && (
                    <div className="mt-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
                        {draft.sendable ? 'Ready to send' : 'Needs her line'}
                      </p>
                      <div
                        className="rounded-lg border px-3.5 py-3 mt-2 text-sm leading-relaxed"
                        style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
                      >
                        {draft.text}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <button
                          onClick={() => copy(row.ref, draft.text)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {copied === row.ref ? 'Copied' : 'Copy reply'}
                        </button>
                        <a
                          href={testLink(draft.link)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          Test the link
                        </a>
                        {draft.quoted && (
                          <span className="text-[11px] text-ink-3">
                            quoting her verdict “{draft.quoted}” exactly
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-3 mt-2 leading-snug">{draft.note}</p>
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
                        Already in her world
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {suggestions.map((s, i) => (
                          <li key={`${s.ref}-${i}`} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                            <span className="text-[10px] uppercase tracking-[0.1em] text-ink-3 w-10 shrink-0">{s.kind}</span>
                            <span className="font-medium">{s.label}</span>
                            <span className="text-ink-3">{s.detail}</span>
                            <span className="text-ink-2 basis-full pl-12 leading-snug">{s.why}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {itemName && (
                    <p className="text-[11px] text-ink-3 mt-4">
                      Piece: {itemName} — {row.item?.why}
                    </p>
                  )}
                  <p className="text-[11px] text-ink-3 mt-1">
                    {row.ref} · categoriser said {row.job ?? 'nothing'} at {Math.round(row.confidence * 100)}% ·
                    {row.agrees ? ' agrees with' : ' DISAGREES with'} the printed label {row.labelledJob}
                  </p>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <section className="mt-14">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">Answer once</p>
        <h2 className="text-xl font-semibold mt-1.5 tracking-tight">Send it to everyone who asked</h2>
        <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
          Every person whose link carried the same question tag is one cohort. One send
          reaches all of them, and each of those sends still reports back separately — so
          the reply is one-to-many while the measurement stays one-to-one.
        </p>

        <div className="mt-5 rounded-xl border overflow-hidden bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          {cohorts.map(c => (
            <div
              key={c.job}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-sm font-medium min-w-0 flex-1">{c.job}</span>
              <span className="text-xs text-ink-3 tnum">
                {c.observed} observed · ~{c.monthlyEstimate.toLocaleString()}/month
              </span>
              {c.sendable ? (
                <button
                  onClick={() => setSent(s => ({ ...s, [c.job]: c.monthlyEstimate }))}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  style={{ borderColor: sent[c.job] ? 'var(--seg-3)' : 'var(--border)', color: sent[c.job] ? 'var(--seg-3)' : undefined }}
                >
                  {sent[c.job] ? `Queued for ${c.observed}` : `Send to ${c.observed}`}
                </button>
              ) : (
                <span className="text-xs text-ink-3">Hers to answer</span>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-ink-2 mt-4 leading-relaxed max-w-2xl">
          <strong className="text-foreground">{saving.sendsRequired} sends</strong> cover an
          estimated <strong className="text-foreground tnum">{saving.repliesAvoided.toLocaleString()}</strong>{' '}
          individual replies a month — {Math.round(saving.ofMonthly * 100)}% of her inbox — without
          her writing a word she has not already written.
        </p>
        <p className="text-[11px] text-ink-3 mt-2 leading-snug">
          Queueing here stages the broadcast; the send itself goes out through the ManyChat
          flow that already carries her links. Monthly figures are the observed mix scaled onto
          the case file&rsquo;s 3.1K, and are estimates rather than counts.
        </p>
      </section>
    </>
  )
}

function Tab({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
      style={{
        borderColor: active ? (color ?? 'var(--foreground)') : 'var(--border)',
        color: active ? (color ?? 'var(--foreground)') : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span
      className="text-[10px] uppercase tracking-[0.1em] font-medium px-1.5 py-0.5 rounded border text-ink-3"
      style={{ borderColor: 'var(--border)' }}
    >
      {label}
    </span>
  )
}
