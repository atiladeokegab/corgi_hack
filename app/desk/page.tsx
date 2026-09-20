import Link from 'next/link'
import { PageNav } from '@/app/components/PageNav'
import { getDms, getEvents, getItems, getPosts } from '@/lib/data'
import { buildProfiles } from '@/lib/classify'
import { triageQueue, delegationLoad, jobValues } from '@/lib/triage'
import { cohorts, broadcastSaving, MONTHLY_DM_VOLUME } from '@/lib/broadcast'
import { draftReply } from '@/lib/reply'
import { recommendFor } from '@/lib/recommend'
import { auditAgainstEvidence } from '@/lib/jobs'
import { Desk } from './Desk'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The desk — Lookbook',
  description: 'Her DM queue, ordered by who each question brings rather than how loud it is.',
}

export default function DeskPage() {
  const dms = getDms()
  const items = getItems()
  const posts = getPosts()
  const profiles = buildProfiles(getEvents())

  const rows = triageQueue(dms, profiles, items)
  const load = delegationLoad(rows)
  const values = jobValues(profiles)
  const list = cohorts(rows, profiles)
  const saving = broadcastSaving(list)
  const audit = auditAgainstEvidence(dms)
  const agreement = audit.filter(a => a.agrees).length

  // Everything the client needs, resolved on the server so the page renders
  // complete on first paint and the demo never shows a loading state.
  const prepared = rows.map(row => {
    const item = row.item ? items.find(i => i.slug === row.item!.slug) ?? null : null
    return {
      row,
      itemName: item?.name ?? null,
      draft: row.job ? draftReply(row.job, item) : null,
      suggestions: recommendFor(row, { posts, items, profiles }),
    }
  })

  const loudest = [...values].sort((a, b) => b.people - a.people)[0] ?? null
  const mostValuable = values[0] ?? null

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <Link href="/" className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium hover:text-foreground transition-colors">
          ← Lookbook
        </Link>
        <PageNav current="/desk" />
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-2 tracking-tight leading-[1.1]">
          The desk
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          Her inbox is chronological, so the loudest question wins. This is the same
          twelve messages ordered by <em>who each question brings</em> — measured from
          the links they went on to open — with the answer already written in her own
          words wherever it does not need her eye.
        </p>
      </header>

      {loudest && mostValuable && loudest.job !== mostValuable.job && (
        <section
          className="rounded-xl border px-5 py-5 mb-10 bg-surface-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">The inversion</p>
          <div className="grid sm:grid-cols-2 gap-5 mt-3">
            <div>
              <p className="text-sm text-ink-2 leading-relaxed">
                Her <strong className="text-foreground">loudest</strong> question is{' '}
                <strong className="text-foreground">{loudest.job}</strong> — {loudest.people} people,
                and {Math.round(loudest.quickShare * 100)}% of them open the link once and never come back.
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-2 leading-relaxed">
                Her <strong className="text-foreground">most valuable</strong> is{' '}
                <strong className="text-foreground">{mostValuable.job}</strong> — {mostValuable.people} people,
                {' '}{mostValuable.onwardReach.toFixed(2)} onward shares each and{' '}
                {Math.round(mostValuable.returnRate * 100)}% return.
              </p>
            </div>
          </div>
          <p className="text-sm text-ink-2 mt-4 leading-relaxed">
            Volume order and value order are close to opposites. That is a content brief she
            cannot currently see.
          </p>
        </section>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
        <Stat value={`${load.offHerDesk}/${load.total}`} label="Questions that leave her desk" sub={`${load.va} to the VA · ${load.agent} auto-replied`} />
        <Stat value={`${saving.repliesAvoided.toLocaleString()}`} label="Replies a month avoided" sub={`${saving.sendsRequired} sends instead, of ~${MONTHLY_DM_VOLUME.toLocaleString()}`} />
        <Stat value={`${agreement}/${audit.length}`} label="Categoriser vs E-01's labels" sub="Scored against the printed evidence" />
        <Stat value={`${load.sofia}`} label="Still need her eye" sub="And those are the ones worth her time" />
      </section>

      <Desk prepared={prepared} cohorts={list} saving={saving} />

      <section className="mt-16 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">What is real here</p>
        <ul className="text-sm text-ink-2 mt-3 space-y-2 leading-relaxed max-w-3xl">
          <li>
            <strong className="text-foreground">Real:</strong> the twelve messages and their job
            labels are E-01 as printed. The categoriser re-derives those labels from the text
            alone and agrees on {agreement} of {audit.length}. Every verdict quoted in a draft is
            the <code className="text-xs">sofia_says</code> field from E-04, unchanged.
          </li>
          <li>
            <strong className="text-foreground">Measured:</strong> the ordering comes from click
            behaviour in the log — onward shares and return days per cohort. The one modelling
            choice, how those two combine into a score, is named in{' '}
            <code className="text-xs">lib/triage.ts</code>.
          </li>
          <li>
            <strong className="text-foreground">Synthetic:</strong> the click history itself, as
            PRODUCT.md already states. Monthly figures scale the observed mix onto the{' '}
            {MONTHLY_DM_VOLUME.toLocaleString()} DMs a month the case file gives, and are
            estimates, not counts.
          </li>
          <li>
            <strong className="text-foreground">Not invented:</strong> no numeric rating for any
            piece. E-04 names one; the printed evidence does not contain it, so nothing here
            scores her taste.
          </li>
        </ul>
      </section>
    </main>
  )
}

function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="rounded-xl border px-4 py-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
      <p className="text-2xl font-semibold tracking-tight tnum">{value}</p>
      <p className="text-xs text-foreground mt-1.5 font-medium leading-snug">{label}</p>
      <p className="text-[11px] text-ink-3 mt-1 leading-snug">{sub}</p>
    </div>
  )
}
