import Link from 'next/link'
import { SEGMENTS } from '@/lib/classify'
import type { SegmentKey } from '@/lib/types'

export const pct = (n: number, d = 0) => (n * 100).toFixed(d) + '%'
export const num = (n: number) => Math.round(n).toLocaleString('en-GB')
export const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')

export function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="mb-8">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <Link href="/" className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium hover:text-foreground transition-colors">
          ← Back to your dashboard
        </Link>
        <Link
          href="/inbox"
          className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          Your inbox →
        </Link>
      </div>
      <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-3 tracking-tight leading-[1.1]">{title}</h1>
      <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">{sub}</p>
    </header>
  )
}

export function Legend({ keys }: { keys: SegmentKey[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
      {keys.map(k => (
        <li key={k} className="flex items-center gap-1.5 text-xs text-ink-2">
          <span className="size-2 rounded-full shrink-0" style={{ background: SEGMENTS[k].color }} />
          {SEGMENTS[k].label}
        </li>
      ))}
    </ul>
  )
}

/** Part-to-whole across one row. 2px gaps keep adjacent fills separable. */
export function MixBar({ mix, total }: { mix: { key: SegmentKey; n: number }[]; total: number }) {
  if (!total) return <div className="h-2.5 rounded-full" style={{ background: 'var(--grid)' }} />
  return (
    <div className="flex gap-0.5 h-2.5">
      {mix.map(m => (
        <div
          key={m.key}
          className="first:rounded-l-full last:rounded-r-full"
          style={{ width: `${(m.n / total) * 100}%`, background: SEGMENTS[m.key].color }}
          title={`${SEGMENTS[m.key].label}: ${m.n} (${pct(m.n / total)})`}
        />
      ))}
    </div>
  )
}

export function Breakdown({ rows, max }: {
  rows: { key: string; label: string; sub: string; total: number; mix: { key: SegmentKey; n: number }[] }[]
  max: number
}) {
  return (
    <ul className="space-y-5">
      {rows.map(r => {
        const lead = [...r.mix].sort((a, b) => b.n - a.n)[0]
        return (
          <li key={r.key}>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="font-medium text-sm">{r.label}</p>
              {r.sub && <p className="text-[11px] text-ink-3">{r.sub}</p>}
              <p className="text-xs text-ink-3 tnum ml-auto">{num(r.total)} people</p>
            </div>
            {/* Scaled to the biggest row, so volume and mix read at the same time. */}
            <div style={{ width: `${max ? Math.max(6, (r.total / max) * 100) : 0}%` }} className="mt-1.5">
              <MixBar mix={r.mix} total={r.total} />
            </div>
            {lead && (
              <p className="text-[11px] text-ink-2 mt-1.5">
                mostly{' '}
                <span className="font-medium" style={{ color: SEGMENTS[lead.key].color }}>
                  {SEGMENTS[lead.key].label}
                </span>{' '}
                <span className="text-ink-3 tnum">({pct(lead.n / r.total)})</span>
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
