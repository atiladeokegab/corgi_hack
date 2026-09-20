import Link from 'next/link'
import { LiveFeed } from './components/LiveFeed'
import { getDms, getEvents, getItems, getPosts, getReconciliation, getTruth } from '@/lib/data'
import { buildProfiles, SEGMENTS, SEGMENT_ORDER } from '@/lib/classify'
import {
  connectorCoverage, dmBreakdown, itemBreakdown, postBreakdown,
  recoveryAccuracy, segmentSummary, sourceMix, topConnectors,
} from '@/lib/analytics'
import type { SegmentKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

const num = (n: number) => Math.round(n).toLocaleString('en-GB')
const pct = (n: number, d = 0) => (n * 100).toFixed(d) + '%'

function Section({ kicker, title, sub, children }: {
  kicker: string; title: string; sub?: string; children: React.ReactNode
}) {
  return (
    <section className="mt-14">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">{kicker}</p>
      <h2 className="text-xl sm:text-2xl font-semibold mt-1.5 tracking-tight">{title}</h2>
      {sub && <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Legend({ keys }: { keys: SegmentKey[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
      {keys.map(k => (
        <li key={k} className="flex items-center gap-1.5 text-xs text-ink-2">
          <span className="size-2 rounded-full shrink-0" style={{ background: SEGMENTS[k].color }} />
          {SEGMENTS[k].label}
        </li>
      ))}
    </ul>
  )
}

/** Part-to-whole across one row. 2px surface gaps keep adjacent fills separable. */
function MixBar({ mix, total }: { mix: { key: SegmentKey; n: number }[]; total: number }) {
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

function Breakdown({ rows, max }: {
  rows: { key: string; label: string; sub: string; total: number; mix: { key: SegmentKey; n: number }[] }[]
  max: number
}) {
  return (
    <ul className="space-y-4">
      {rows.map(r => {
        const lead = [...r.mix].sort((a, b) => b.n - a.n)[0]
        return (
          <li key={r.key}>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="font-medium text-sm">{r.label}</p>
              {r.sub && <p className="text-[11px] text-ink-3">{r.sub}</p>}
              <p className="text-xs text-ink-3 tnum ml-auto">{num(r.total)} people</p>
            </div>
            {/* Bars are scaled to the biggest row, so volume and mix read at once. */}
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

export default function Page() {
  const events = getEvents()
  const posts = getPosts()
  const items = getItems()
  const dms = getDms()
  const profiles = buildProfiles(events)

  const segs = segmentSummary(profiles)
  const sources = sourceMix(profiles)
  const postRows = postBreakdown(posts, profiles)
  const dmRows = dmBreakdown(profiles)
  const itemRows = itemBreakdown(items, profiles)
  const connectors = topConnectors(profiles, 6)
  const coverage = connectorCoverage(profiles, events)
  const recovery = recoveryAccuracy(profiles, getTruth())
  const recon = getReconciliation()

  const postTitle = (ref: string | null) => posts.find(p => p.ref === ref)?.title ?? null

  const presentKeys = SEGMENT_ORDER.filter(k => segs.some(s => s.key === k))
  const wholeMix = presentKeys.map(k => ({ key: k, n: segs.find(s => s.key === k)!.people }))
  const dmLead = dmRows.length
    ? [...dmRows].sort((a, b) => {
        const ax = a.mix.find(m => m.key === 'CONNECTOR')?.n ?? 0
        const bx = b.mix.find(m => m.key === 'CONNECTOR')?.n ?? 0
        return (bx / Math.max(1, b.total)) - (ax / Math.max(1, a.total))
      })[0]
    : null

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">

      <header>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
            Operation Lookbook · Case 002
          </p>
          <span className="flex gap-2">
            <Link
              href="/links"
              className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              Build a link
            </Link>
            <Link
              href="/groups"
              className="text-xs rounded-lg px-3 py-1.5 font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              Message a group →
            </Link>
          </span>
        </div>
        <h1 className="text-3xl sm:text-[2.6rem] font-semibold mt-2 tracking-tight leading-[1.1]">
          Sofia has {num(profiles.length)} people in her audience.
          <br className="hidden sm:block" /> Here is who they are.
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          Instagram tells her how many people saw a post. It never tells her which kind
          of person, or which of her posts and DM replies brought them. This reads the
          shape of how each person opens her links and sorts them into five groups —
          so she can decide what to make next from what they do, not from a guess.
        </p>
      </header>

      {/* The whole audience, one bar. Direct-labelled below and tabulated further down. */}
      <div className="mt-9 rounded-2xl border p-6 sm:p-8 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          Her clicking audience, by behaviour
        </p>
        <div className="mt-5 flex gap-0.5 h-10">
          {wholeMix.map(m => (
            <div
              key={m.key}
              className="first:rounded-l-md last:rounded-r-md"
              style={{ width: `${(m.n / profiles.length) * 100}%`, background: SEGMENTS[m.key].color }}
              title={`${SEGMENTS[m.key].label}: ${num(m.n)}`}
            />
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
          {wholeMix.map(m => (
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
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sources.map(s => (
          <div key={s.source} className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">{s.label}</p>
            <p className="text-2xl font-semibold mt-2 tnum tracking-tight">{pct(s.share)}</p>
            <p className="text-xs text-ink-3 mt-1.5">{num(s.people)} people</p>
          </div>
        ))}
      </div>

      <Section
        kicker="The five groups"
        title="What each group does differently"
        sub="Every column here is something a redirect can observe on its own: its cookie, the timestamp, the Referer header, and which link was asked for. Nothing the audience fills in, no page for them to visit, no extra step in their day."
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm border-collapse min-w-[780px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <th className="font-medium pb-2 pr-4">Group</th>
                <th className="font-medium pb-2 pr-4">How you spot them</th>
                <th className="font-medium pb-2 pr-4 text-right">People</th>
                <th className="font-medium pb-2 pr-4 text-right">Opens each</th>
                <th className="font-medium pb-2 pr-4 text-right">Days active</th>
                <th className="font-medium pb-2 pr-4">Mostly arrives via</th>
                <th className="font-medium pb-2">Opens most</th>
              </tr>
            </thead>
            <tbody>
              {segs.map(s => (
                <tr key={s.key} className="border-t align-top" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-3 pr-4">
                    <p className="font-medium flex items-center gap-1.5">
                      <span className="size-2 rounded-full shrink-0" style={{ background: s.color }} />
                      {s.label}
                    </p>
                    <p className="text-xs text-ink-3 mt-0.5 max-w-[17rem] leading-snug">{s.blurb}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-2 max-w-[11rem] leading-snug">{s.signature}</td>
                  <td className="py-3 pr-4 text-right tnum font-medium">
                    {num(s.people)}
                    <span className="block text-[11px] text-ink-3 font-normal">{pct(s.share)}</span>
                  </td>
                  <td className="py-3 pr-4 text-right tnum">{s.avgOpens.toFixed(1)}</td>
                  <td className="py-3 pr-4 text-right tnum">{s.avgSpanDays.toFixed(1)}</td>
                  <td className="py-3 pr-4 text-xs text-ink-2">
                    {s.topSource === 'post' ? 'a caption link' : s.topSource === 'dm' ? 'a DM reply' : 'a friend'}
                    {s.topJob && <span className="block text-[11px] text-ink-3 mt-0.5">{s.topJob}</span>}
                  </td>
                  <td className="py-3 text-xs text-ink-2">{s.topItem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        kicker="Decision one"
        title="Which post brings which people"
        sub="Same audience, sorted by where they came in. The bar length is how many people the post brought; the colours are who they turned out to be."
      >
        <Legend keys={presentKeys} />
        <Breakdown rows={postRows} max={Math.max(...postRows.map(r => r.total))} />
      </Section>

      <Section
        kicker="Decision two"
        title="Which DM question brings which people"
        sub="Every DM is really asking for one of a dozen things — where is it, what size, cheaper version, what goes with it. When the link in her reply is tagged with the question it answered, that question becomes a fact about whoever clicked it. The inbox stops being a queue to clear and starts sorting her audience for her."
      >
        <Legend keys={presentKeys} />
        <Breakdown rows={dmRows} max={Math.max(...dmRows.map(r => r.total))} />
        {dmLead && (
          <p className="text-xs text-ink-3 mt-5 max-w-2xl leading-relaxed">
            Read it as a priority order. <strong className="text-foreground font-medium">{dmLead.label}</strong>{' '}
            produces the highest proportion of Connectors — people who pass the link
            straight on to someone else. Those replies are worth answering first, and
            they are not the ones with the loudest volume.
          </p>
        )}
      </Section>

      <Section
        kicker="Decision three"
        title="What each group actually opens"
        sub="Her own verdict on each piece, sat next to who opens it. Her judgement is the thing people come for, so it is quoted exactly as she wrote it and never turned into a score."
      >
        <Legend keys={presentKeys} />
        <Breakdown rows={itemRows} max={Math.max(...itemRows.map(r => r.total))} />
      </Section>

      <Section
        kicker="Named, not just counted"
        title="The people who pass her links on"
        sub={`A forwarded link only carries its sender's id when what travelled was still Sofia's link. ${coverage.anonymous} share arrivals came in with no sender attached, which implies roughly ${coverage.estimatedUnnamed} more Connectors the log cannot name — counted here rather than quietly dropped.`}
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <th className="font-medium pb-2 pr-4">Anon id</th>
                <th className="font-medium pb-2 pr-4 text-right">Passed it to</th>
                <th className="font-medium pb-2 pr-4">Found her via</th>
                <th className="font-medium pb-2">Was looking at</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map(c => (
                <tr key={c.uid} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2.5 pr-4"><code className="text-xs">{c.uid}</code></td>
                  <td className="py-2.5 pr-4 text-right tnum font-semibold" style={{ color: 'var(--seg-3)' }}>
                    {c.sharedTo}
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-ink-2">
                    {c.source === 'dm' ? `DM · ${c.dmJob}` : c.source === 'share' ? 'a friend' : (postTitle(c.entryPost) ?? 'a post')}
                  </td>
                  <td className="py-2.5 text-xs text-ink-2">{c.topSlug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        kicker="It actually runs"
        title="The link, live"
        sub="These are real endpoints. Opening one sets a cookie, classifies where the click came from, records it and bounces on to the retailer. ?dry=1 shows the recorded row instead of leaving the site. This is the only thing that has to change in Sofia's day: the link she already pastes points here first."
      >
        <div className="flex flex-wrap gap-2">
          <a
            href="/r/black-blazer?p=the-blazer&dry=1"
            target="_blank" rel="noreferrer"
            className="text-xs rounded-lg border px-3 py-2 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            <code>/r/black-blazer?p=the-blazer</code>
            <span className="text-ink-3 ml-2">from a caption</span>
          </a>
          <a
            href="/r/white-tee?d=BUDGET&dry=1"
            target="_blank" rel="noreferrer"
            className="text-xs rounded-lg border px-3 py-2 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--seg-2)', color: 'var(--seg-2)' }}
          >
            <code>/r/white-tee?d=BUDGET</code>
            <span className="ml-2">from a DM reply</span>
          </a>
          <a
            href="/r/black-blazer?p=the-blazer&src=whatsapp&v=u_00001&dry=1"
            target="_blank" rel="noreferrer"
            className="text-xs rounded-lg border px-3 py-2 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--seg-3)', color: 'var(--seg-3)' }}
          >
            <code>/r/black-blazer?src=whatsapp</code>
            <span className="ml-2">passed on by a friend</span>
          </a>
        </div>
        <div className="mt-5 rounded-xl border px-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          <LiveFeed />
        </div>
      </Section>

      <Section
        kicker="Provenance"
        title="What is measured, assumed, and simply not knowable"
        sub="The click history here is made up — Instagram does not hand out per-person saves or shares to anybody, so no such record exists to import. The volumes are not arbitrary though: traffic per post is proportional to how many people actually saved it, the DM mix uses her twelve real question types, and the pieces are her real wardrobe."
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
          {Object.entries(recon).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3 border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
              <dt className="text-ink-2 text-xs leading-snug">{k}</dt>
              <dd className="ml-auto font-semibold tnum text-xs whitespace-nowrap">{String(v)}</dd>
            </div>
          ))}
          <div className="flex items-baseline gap-3 border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
            <dt className="text-ink-2 text-xs leading-snug">
              classifier recovers the real behaviour
            </dt>
            <dd className="ml-auto font-semibold tnum text-xs whitespace-nowrap">
              {pct(recovery.accuracy)} of {num(recovery.scored)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-ink-3 mt-5 max-w-2xl leading-relaxed">
          Gaps worth saying out loud: only 8 of her 36 wardrobe pieces are covered.
          She has no star rating on her pieces and this does not invent one — her
          words are quoted, never scored. Which pieces each post linked to has been
          read off the post titles rather than recorded. And share tracking is partial
          by nature: the group is always countable, the individual behind a forward
          is identifiable about half the time.
        </p>
      </Section>

      <footer className="mt-16 pt-6 border-t text-sm text-ink-2" style={{ borderColor: 'var(--border)' }}>
        <p className="max-w-2xl leading-relaxed">
          <strong className="text-foreground font-semibold">Sofia no longer needs to guess who
          she is talking to</strong> — because the links she already sends now tell her
          which kind of person opened them, and which post or question brought them in.
        </p>
      </footer>
    </main>
  )
}
