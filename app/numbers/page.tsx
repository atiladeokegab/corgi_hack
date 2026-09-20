import { num, PageHeader, pct } from '../components/Layout'
import { getEvents, getReconciliation, getTruth } from '@/lib/data'
import { buildProfiles } from '@/lib/classify'
import { recoveryAccuracy } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Where these numbers come from — Edna' }

export default function NumbersPage() {
  const profiles = buildProfiles(getEvents())
  const recovery = recoveryAccuracy(profiles, getTruth())
  const recon = getReconciliation()

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <PageHeader
        title="Where these numbers come from"
        sub="What is counted, what is estimated, and what cannot be seen."
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-10">
        <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--seg-3)' }}>
          <p className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: 'var(--seg-3)' }}>
            Counted
          </p>
          <p className="text-sm text-ink-2 mt-2 leading-snug">
            Every click, when it happened, and whether it came from Instagram or a friend.
          </p>
        </div>
        <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--seg-4)' }}>
          <p className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: 'var(--seg-4)' }}>
            Worked out
          </p>
          <p className="text-sm text-ink-2 mt-2 leading-snug">
            Which of the five groups someone belongs to, guessed from how they open your
            affiliate links. Right {pct(recovery.accuracy)} of the time.
          </p>
        </div>
        <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">
            Nobody can see
          </p>
          <p className="text-sm text-ink-2 mt-2 leading-snug">
            Who saved a post. Whether anyone actually bought.
          </p>
        </div>
      </div>

      <h2 className="text-lg font-semibold tracking-tight mb-4">The numbers behind all of it</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
        {Object.entries(recon).map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-3 border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
            <dt className="text-ink-2 text-xs leading-snug">{k}</dt>
            <dd className="ml-auto font-semibold tnum text-xs whitespace-nowrap">{String(v)}</dd>
          </div>
        ))}
        <div className="flex items-baseline gap-3 border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
          <dt className="text-ink-2 text-xs leading-snug">people sorted into the right group</dt>
          <dd className="ml-auto font-semibold tnum text-xs whitespace-nowrap">
            {pct(recovery.accuracy)} of {num(recovery.scored)}
          </dd>
        </div>
      </dl>

      <h2 className="text-lg font-semibold tracking-tight mt-12 mb-3">Things worth saying out loud</h2>
      <ul className="space-y-3 text-sm text-ink-2 max-w-2xl leading-relaxed list-disc pl-5">
        <li>
          The click history is simulated. Instagram does not release who saved or shared
          a post. Volumes follow your real save counts and your real twelve questions.
        </li>
        <li>
          8 of your 36 pieces are loaded.
        </li>
        <li>
          Your pieces have no rating and none is invented. Your words are quoted, never scored.
        </li>
        <li>
          Affiliate links forwarded by text message cannot be seen at all.
        </li>
        <li>
          No one can see that a specific person bought. Money figures are estimates.
        </li>
      </ul>
    </main>
  )
}
