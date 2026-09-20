import Link from 'next/link'
import { gbp, num, pct } from './components/Layout'
import { getCustomers, getEvents, getItems, getPendingDms } from '@/lib/data'
import { buildProfiles, SEGMENTS, SEGMENT_ORDER } from '@/lib/classify'
import { segmentSummary, sourceMix } from '@/lib/analytics'
import { owedToHer } from '@/lib/owed'
import { cheaperThan, getTemplates, renderTemplate } from '@/lib/templates'

export const dynamic = 'force-dynamic'

/** Big, uniform, one number each. */
function Tile({ href, label, value, note, accent }: {
  href: string; label: string; value: string; note: string; accent?: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border p-5 bg-surface-2 hover:opacity-95 transition-opacity flex flex-col"
      style={{ borderColor: accent ?? 'var(--border)' }}
    >
      <p className="text-[11px] uppercase tracking-[0.14em] font-medium"
         style={{ color: accent ?? 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-3xl font-semibold mt-2 tnum tracking-tight">{value}</p>
      <p className="text-sm text-ink-2 mt-1.5 leading-snug">{note}</p>
    </Link>
  )
}

export default function Page() {
  const events = getEvents()
  const profiles = buildProfiles(events)
  const segs = segmentSummary(profiles)
  const sources = sourceMix(profiles)
  const items = getItems()
  const owed = owedToHer(getCustomers(), profiles, items)

  const pending = getPendingDms()
  const bySlug = Object.fromEntries(items.map(i => [i.slug, i]))
  // Same test the inbox applies, so the two pages cannot disagree: a template
  // only counts if every placeholder in it can actually be filled in.
  const templates = getTemplates()
  const easy = pending.filter(d => {
    const tpl = templates[d.job]
    if (!tpl) return false
    const item = bySlug[d.slug] ?? items[0]
    const cheaper = cheaperThan(item, items)
    return Boolean(renderTemplate(tpl, { item, link: 'x', cheaper, cheaperLink: cheaper ? 'x' : null }))
  }).length


  const present = SEGMENT_ORDER.filter(k => segs.some(s => s.key === k))
  const mix = present.map(k => ({ key: k, n: segs.find(s => s.key === k)!.people }))

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">

      <header className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xl font-semibold tracking-[0.2em]">EDNA</p>
        <Link
          href="/links"
          className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          Make an affiliate link
        </Link>
      </header>

      {/* The hero: the whole audience in one shape. */}
      <section className="mt-9">
        <p className="text-5xl sm:text-6xl font-semibold tnum tracking-tight">{num(profiles.length)}</p>
        <p className="text-base text-ink-2 mt-1">people clicked your affiliate links</p>

        <div className="flex gap-0.5 h-12 mt-6">
          {mix.map(m => (
            <div
              key={m.key}
              className="first:rounded-l-lg last:rounded-r-lg"
              style={{ width: `${(m.n / profiles.length) * 100}%`, background: SEGMENTS[m.key].color }}
              title={`${SEGMENTS[m.key].label}: ${num(m.n)}`}
            />
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
          {mix.map(m => (
            <div key={m.key}>
              <dt className="flex items-center gap-1.5 text-xs text-ink-2">
                <span className="size-2 rounded-full shrink-0" style={{ background: SEGMENTS[m.key].color }} />
                {SEGMENTS[m.key].label}
              </dt>
              <dd className="text-lg font-semibold tnum mt-0.5">
                {pct(m.n / profiles.length)}
                <span className="text-xs text-ink-3 font-normal ml-1.5">{num(m.n)}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Today. Loudest thing on the page. */}
      <div className="mt-10 grid sm:grid-cols-2 gap-3">
        <Tile
          href="/inbox"
          label="Inbox"
          value={`${pending.length} waiting`}
          note={`${easy} replies already written.`}
          accent="var(--accent)"
        />
        <Tile
          href="/owed"
          label="Unpaid"
          value={gbp(owed.estimatedCommission)}
          note={`${num(owed.lateReturners)} came back after the window closed.`}
          accent="var(--seg-4)"
        />
      </div>

      <section className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium mb-3">
          Where your audience comes from
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sources.map(s => (
            <div key={s.source} className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">{s.label}</p>
              <p className="text-2xl font-semibold mt-1.5 tnum tracking-tight">{pct(s.share)}</p>
              <p className="text-xs text-ink-3 mt-1">{num(s.people)} people</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium mb-3">
          Look deeper
        </p>
        <ul className="rounded-2xl border overflow-hidden bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          {[
            { href: '/posts', title: 'What to post next', line: 'Which posts bring which kind of person.' },
            { href: '/questions', title: 'Who to answer first', line: 'Which questions bring which kind of person.' },
            { href: '/pieces', title: 'What they want', line: 'Which pieces each group keeps opening.' },
            { href: '/links', title: 'Make an affiliate link', line: 'The link you paste into a caption or a reply.' },
            { href: '/how', title: 'How Edna works', line: 'What is counted, what is estimated, what cannot be seen.' },
          ].map((r, i) => (
            <li key={r.href} className={i ? 'border-t' : ''} style={{ borderColor: 'var(--border)' }}>
              <Link href={r.href} className="flex items-baseline gap-4 p-4 hover:bg-background transition-colors">
                <span className="font-medium text-sm">{r.title}</span>
                <span className="text-sm text-ink-2 hidden sm:inline">{r.line}</span>
                <span className="ml-auto text-ink-3 shrink-0">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
