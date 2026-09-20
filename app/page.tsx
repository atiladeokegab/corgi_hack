import Link from 'next/link'
import { gbp, num, pct } from './components/Layout'
import { getCustomers, getEvents, getItems, getPendingDms, getPosts } from '@/lib/data'
import { buildProfiles, SEGMENTS, SEGMENT_ORDER } from '@/lib/classify'
import { dmBreakdown, postBreakdown, segmentSummary, sourceMix } from '@/lib/analytics'
import { owedToHer } from '@/lib/owed'
import { cheaperThan, TEMPLATES } from '@/lib/templates'

export const dynamic = 'force-dynamic'

function Card({ href, kicker, title, line, accent }: {
  href: string; kicker: string; title: string; line: string; accent?: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border p-5 bg-surface-2 hover:opacity-95 transition-opacity block"
      style={{ borderColor: accent ?? 'var(--border)' }}
    >
      <p className="text-[11px] uppercase tracking-[0.12em] font-medium"
         style={{ color: accent ?? 'var(--text-muted)' }}>
        {kicker}
      </p>
      <p className="text-lg font-semibold mt-1.5 tracking-tight">{title}</p>
      <p className="text-sm text-ink-2 mt-1.5 leading-snug">{line}</p>
    </Link>
  )
}

export default function Page() {
  const events = getEvents()
  const profiles = buildProfiles(events)
  const segs = segmentSummary(profiles)
  const sources = sourceMix(profiles)
  const owed = owedToHer(getCustomers(), profiles, getItems())

  const pending = getPendingDms()
  const items = getItems()
  const bySlug = Object.fromEntries(items.map(i => [i.slug, i]))
  // Same test the inbox applies: a template only counts if it actually resolves.
  // Some budget questions have no honest cheaper answer, so they fall through to her.
  const easy = pending.filter(d => {
    const tpl = TEMPLATES[d.job]
    if (!tpl?.autoable) return false
    const item = bySlug[d.slug] ?? items[0]
    const cheaper = cheaperThan(item, items)
    return Boolean(tpl.build({ item, link: 'x', cheaper, cheaperLink: cheaper ? 'x' : null }))
  }).length

  const postRows = postBreakdown(getPosts(), profiles)
  const dmRows = dmBreakdown(profiles)
  const topPost = postRows[0]
  const loudestQuestion = dmRows[0]

  const present = SEGMENT_ORDER.filter(k => segs.some(s => s.key === k))
  const mix = present.map(k => ({ key: k, n: segs.find(s => s.key === k)!.people }))
  const biggest = [...mix].sort((a, b) => b.n - a.n)[0]

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">

      <header>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">Lookbook</p>
        <h1 className="text-3xl sm:text-[2.6rem] font-semibold mt-2 tracking-tight leading-[1.1]">
          {num(profiles.length)} people clicked your links.
        </h1>
        <p className="text-base text-ink-2 mt-3 max-w-2xl leading-relaxed">
          Instagram tells you how many people saw a post. It never tells you what kind
          of person they were. This does.
        </p>
      </header>

      {/* One picture of the whole audience. Everything else hangs off it. */}
      <section className="mt-8 rounded-2xl border p-5 sm:p-6 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-0.5 h-11">
          {mix.map(m => (
            <div
              key={m.key}
              className="first:rounded-l-md last:rounded-r-md"
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
        <p className="text-sm text-ink-2 mt-5 leading-relaxed border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          Most of your audience are{' '}
          <span className="font-medium" style={{ color: SEGMENTS[biggest.key].color }}>
            {SEGMENTS[biggest.key].label}
          </span>{' '}
          — {SEGMENTS[biggest.key].blurb.toLowerCase().replace(/\.$/, '')}.
        </p>
      </section>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sources.map(s => (
          <div key={s.source} className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">{s.label}</p>
            <p className="text-2xl font-semibold mt-1.5 tnum tracking-tight">{pct(s.share)}</p>
            <p className="text-xs text-ink-3 mt-1">{num(s.people)} people</p>
          </div>
        ))}
      </div>

      {/* The two things she can act on today. */}
      <div className="mt-8 grid sm:grid-cols-2 gap-3">
        <Card
          href="/inbox"
          kicker="Do this first"
          title={`${pending.length} people are waiting`}
          line={`${easy} of them asked something you answer every day. Those already have a reply written.`}
          accent="var(--accent)"
        />
        <Card
          href="/owed"
          kicker="Money"
          title={`${num(owed.lateReturners)} came back too late`}
          line={`Your link stops paying after a day. Best guess, about ${gbp(owed.estimatedCommission)} of commission nobody gave you.`}
          accent="var(--seg-4)"
        />
      </div>

      <h2 className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium mt-10 mb-3">
        Have a proper look
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <Card
          href="/posts"
          kicker="Your posts"
          title="What to post next"
          line={topPost ? `“${topPost.label}” brought you the most people.` : 'Which posts bring which crowd.'}
        />
        <Card
          href="/questions"
          kicker="Your DMs"
          title="Who to answer first"
          line={loudestQuestion
            ? `Your most common question is “${loudestQuestion.label.toLowerCase()}” — and it is not the one that matters most.`
            : 'Which questions bring which crowd.'}
        />
        <Card
          href="/pieces"
          kicker="Your wardrobe"
          title="What they want"
          line="Which pieces each crowd keeps opening, next to what you said about them."
        />
        <Card
          href="/numbers"
          kicker="The small print"
          title="Where these numbers come from"
          line="What is counted, what is worked out, and what nobody can see at all."
        />
      </div>

      <div className="mt-3">
        <Card
          href="/links"
          kicker="Set-up"
          title="Make a link"
          line="Build the link you paste into a caption or a reply. This is what makes all of the above work."
        />
      </div>

      <footer className="mt-14 pt-6 border-t text-sm text-ink-2" style={{ borderColor: 'var(--border)' }}>
        <p className="max-w-2xl leading-relaxed">
          <strong className="text-foreground font-semibold">You no longer have to guess
          who you are talking to.</strong> The links you already send tell you which kind
          of person opened them, and what brought them in.
        </p>
      </footer>
    </main>
  )
}
