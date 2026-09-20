import Link from 'next/link'
import { getCustomers, getEvents, getItems, getPosts, getReconciliation, getTruth } from '@/lib/data'
import { buildProfiles, SEGMENTS, SEGMENT_ORDER } from '@/lib/classify'
import {
  connectorCoverage, dmBreakdown, itemBreakdown, postBreakdown,
  recoveryAccuracy, segmentSummary, sourceMix, topConnectors,
} from '@/lib/analytics'
import { owedToHer } from '@/lib/owed'
import type { SegmentKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')
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
  const owed = owedToHer(getCustomers(), profiles, items)

  const presentKeys = SEGMENT_ORDER.filter(k => segs.some(s => s.key === k))
  const wholeMix = presentKeys.map(k => ({ key: k, n: segs.find(s => s.key === k)!.people }))

  const dmLead = dmRows.length
    ? [...dmRows].sort((a, b) => {
        const ax = a.mix.find(m => m.key === 'CONNECTOR')?.n ?? 0
        const bx = b.mix.find(m => m.key === 'CONNECTOR')?.n ?? 0
        return (bx / Math.max(1, b.total)) - (ax / Math.max(1, a.total))
      })[0]
    : null

  const navLink = 'text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors'

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">

      <header>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">Lookbook</p>
          <span className="flex gap-2">
            <Link href="/links" className={navLink} style={{ borderColor: 'var(--border)' }}>Make a link</Link>
            <Link href="/owed" className={navLink} style={{ borderColor: 'var(--border)' }}>Money owed</Link>
            <Link
              href="/inbox"
              className="text-xs rounded-lg px-3 py-1.5 font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)' }}
            >
              Your inbox →
            </Link>
          </span>
        </div>

        <h1 className="text-3xl sm:text-[2.6rem] font-semibold mt-3 tracking-tight leading-[1.1]">
          {num(profiles.length)} people clicked your links.
          <br className="hidden sm:block" /> Here is who they are.
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          Instagram tells you how many people saw a post. It never tells you what kind
          of person they were, or which post and which question brought them. This does.
        </p>
      </header>

      {/* Money first — it is the thing she can act on today. */}
      <Link
        href="/owed"
        className="mt-8 block rounded-2xl border p-5 sm:p-6 bg-surface-2 hover:opacity-95 transition-opacity"
        style={{ borderColor: 'var(--seg-4)' }}
      >
        <div className="flex items-baseline gap-3 flex-wrap">
          <p className="text-[11px] uppercase tracking-[0.14em] font-medium" style={{ color: 'var(--seg-4)' }}>
            You should have been paid for this
          </p>
          <span className="text-xs text-ink-3 ml-auto">See all {num(owed.count)} →</span>
        </div>
        <p className="text-3xl sm:text-4xl font-semibold mt-2 tnum tracking-tight">{gbp(owed.owedCommission)}</p>
        <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
          {num(owed.count)} times someone saw your post, thought about it for a few days,
          then bought. Your affiliate link only pays you if they buy within a day — so
          nobody paid you for any of them.
        </p>
      </Link>

      <div className="mt-4 rounded-2xl border p-6 sm:p-8 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          The five kinds of people who click
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
        kicker="Who they are"
        title="What each kind of person does differently"
        sub="Worked out purely from how they open your links — how often, how many days apart, and whether they pass them on. Nobody fills in a form. Nobody notices anything."
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm border-collapse min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <th className="font-medium pb-2 pr-4">Who</th>
                <th className="font-medium pb-2 pr-4">How you spot them</th>
                <th className="font-medium pb-2 pr-4 text-right">People</th>
                <th className="font-medium pb-2 pr-4 text-right">Opens each</th>
                <th className="font-medium pb-2 pr-4 text-right">Days active</th>
                <th className="font-medium pb-2">Usually comes from</th>
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
                  <td className="py-3 text-xs text-ink-2">
                    {s.topSource === 'post' ? 'a link in a caption' : s.topSource === 'dm' ? 'a DM reply' : 'a friend'}
                    {s.topJob && <span className="block text-[11px] text-ink-3 mt-0.5">{s.topJob}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        kicker="What to post next"
        title="Every post brings a different crowd"
        sub="How long the bar is, is how many people that post brought you. The colours are who they turned out to be."
      >
        <Legend keys={presentKeys} />
        <Breakdown rows={postRows} max={Math.max(...postRows.map(r => r.total))} />
      </Section>

      <Section
        kicker="Who to answer first"
        title="Every question brings a different crowd too"
        sub="When you send someone a link, it remembers which question you were answering. So the thing they asked tells you what kind of person they are."
      >
        <Legend keys={presentKeys} />
        <Breakdown rows={dmRows} max={Math.max(...dmRows.map(r => r.total))} />
        {dmLead && (
          <p className="text-xs text-ink-3 mt-5 max-w-2xl leading-relaxed">
            Read it as a running order. <strong className="text-foreground font-medium">{dmLead.label}</strong>{' '}
            brings you the most people who pass your links straight on to someone else.
            Those are the messages worth your time, and they are not the loud ones.
          </p>
        )}
      </Section>

      <Section
        kicker="What they want"
        title="What each crowd actually opens"
        sub="Your verdict on each piece, next to the people who keep opening it. Your words, exactly as you wrote them."
      >
        <Legend keys={presentKeys} />
        <Breakdown rows={itemRows} max={Math.max(...itemRows.map(r => r.total))} />
      </Section>

      <Section
        kicker="Your best people"
        title="The ones who pass your links on"
        sub={`When someone forwards your link, you can usually see who sent it. ${coverage.anonymous} arrived with no name attached, which means roughly ${coverage.estimatedUnnamed} more of these people exist that this cannot show you.`}
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm border-collapse min-w-[520px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <th className="font-medium pb-2 pr-4">Who</th>
                <th className="font-medium pb-2 pr-4 text-right">Passed it to</th>
                <th className="font-medium pb-2 pr-4">Found you through</th>
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
                    {c.source === 'dm' ? `a DM · ${c.dmJob}` : c.source === 'share' ? 'a friend' : 'a post'}
                  </td>
                  <td className="py-2.5 text-xs text-ink-2">{c.topSlug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        kicker="Where these numbers come from"
        title="What is measured, and what is a guess"
        sub="The click history here is made up, because Instagram will not tell anyone who saved or shared a post. But the sizes are not invented: traffic per post follows how many people really saved it, the questions are your real twelve, and the pieces are your real wardrobe."
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
          {Object.entries(recon).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3 border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
              <dt className="text-ink-2 text-xs leading-snug">{k}</dt>
              <dd className="ml-auto font-semibold tnum text-xs whitespace-nowrap">{String(v)}</dd>
            </div>
          ))}
          <div className="flex items-baseline gap-3 border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
            <dt className="text-ink-2 text-xs leading-snug">how often the guess about a person is right</dt>
            <dd className="ml-auto font-semibold tnum text-xs whitespace-nowrap">
              {pct(recovery.accuracy)} of {num(recovery.scored)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-ink-3 mt-5 max-w-2xl leading-relaxed">
          Worth saying out loud: only 8 of your 36 pieces are in here. You have no star
          rating on anything and this does not invent one — your words are quoted, never
          scored. And when someone forwards a link by text message, there is no way at
          all to see it, so a few of your best people will always be invisible.
        </p>
      </Section>

      <footer className="mt-16 pt-6 border-t text-sm text-ink-2" style={{ borderColor: 'var(--border)' }}>
        <p className="max-w-2xl leading-relaxed">
          <strong className="text-foreground font-semibold">You no longer have to guess
          who you are talking to</strong> — the links you already send tell you which
          kind of person opened them, and what brought them in.
        </p>
      </footer>
    </main>
  )
}
