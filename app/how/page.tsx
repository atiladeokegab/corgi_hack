import { num, PageHeader, pct } from '../components/Layout'
import { getEvents, getReconciliation, getTruth } from '@/lib/data'
import { buildProfiles, SEGMENTS, SEGMENT_ORDER } from '@/lib/classify'
import { recoveryAccuracy } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'How Edna works — Edna' }

const STEPS = [
  {
    n: '1',
    title: 'You send your affiliate link',
    body: 'In a caption, in a DM reply, or automatically to anyone who comments a keyword. It looks the same to whoever taps it.',
  },
  {
    n: '2',
    title: 'Edna records the tap',
    body: 'When, from where, which post it was on, and which question you were answering. Nobody fills anything in.',
  },
  {
    n: '3',
    title: 'The pattern becomes a person',
    body: 'Someone who opens one piece five times is doing something different from someone who opens once and never returns. That difference is the group.',
  },
]

export default function HowPage() {
  const profiles = buildProfiles(getEvents())
  const recovery = recoveryAccuracy(profiles, getTruth())
  const recon = getReconciliation()
  const groups = SEGMENT_ORDER.filter(k => k !== 'BROWSING')

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <PageHeader
        title="How Edna works"
        sub="Nothing here reads your DMs or your followers. It only watches what happens when someone taps one of your affiliate links."
      />

      <ol className="grid sm:grid-cols-3 gap-3">
        {STEPS.map(s => (
          <li key={s.n} className="rounded-2xl border p-5 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <span className="inline-flex items-center justify-center size-7 rounded-full text-xs font-semibold text-white"
                  style={{ background: 'var(--accent)' }}>
              {s.n}
            </span>
            <p className="font-medium mt-3">{s.title}</p>
            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">The five groups</h2>
        <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
          Each one is a description of what somebody did, not a guess about who they are.
        </p>
        <ul className="mt-5 rounded-2xl border overflow-hidden bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          {groups.map((k, i) => (
            <li key={k} className={`p-4 sm:p-5 ${i ? 'border-t' : ''}`} style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="size-2.5 rounded-full shrink-0" style={{ background: SEGMENTS[k].color }} />
                <p className="font-medium">{SEGMENTS[k].label}</p>
                <p className="text-xs text-ink-3 ml-auto font-mono">{SEGMENTS[k].signature}</p>
              </div>
              <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">{SEGMENTS[k].blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">How often it gets the group right</h2>
        <div className="mt-4 rounded-2xl border p-5 sm:p-6 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-5xl font-semibold tnum tracking-tight">{pct(recovery.accuracy)}</p>
          <p className="text-sm text-ink-2 mt-3 max-w-2xl leading-relaxed">
            Edna is put through a test. It is shown {num(recovery.scored)} people&apos;s clicks
            and asked which group each one belongs to, without being shown the answer.
            It gets {pct(recovery.accuracy)} of them right.
          </p>
          <p className="text-sm text-ink-2 mt-3 max-w-2xl leading-relaxed">
            The ones it gets wrong are almost always people who forwarded a link by text
            message. That leaves no trace at all, so they look like strangers who typed
            the address in.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">What is solid and what is not</h2>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-2xl border p-5 bg-surface-2" style={{ borderColor: 'var(--seg-3)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: 'var(--seg-3)' }}>
              Counted
            </p>
            <p className="text-sm text-ink-2 mt-2 leading-relaxed">
              Every tap, when it happened, and whether it came from Instagram or a friend.
            </p>
          </div>
          <div className="rounded-2xl border p-5 bg-surface-2" style={{ borderColor: 'var(--seg-4)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: 'var(--seg-4)' }}>
              Estimated
            </p>
            <p className="text-sm text-ink-2 mt-2 leading-relaxed">
              Which group someone is in, and any money figure. Both are worked out, not observed.
            </p>
          </div>
          <div className="rounded-2xl border p-5 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">
              Cannot be seen
            </p>
            <p className="text-sm text-ink-2 mt-2 leading-relaxed">
              Who saved a post. Whether anyone actually bought. Links forwarded by text.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">The numbers behind all of it</h2>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
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
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">Small print</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-2 max-w-2xl leading-relaxed list-disc pl-5">
          <li>
            The click history is simulated. Instagram does not release who saved or shared
            a post. Volumes follow your real save counts and your real twelve questions.
          </li>
          <li>8 of your 36 pieces are loaded.</li>
          <li>Your pieces have no rating and none is invented. Your words are quoted, never scored.</li>
          <li>Affiliate links forwarded by text message cannot be seen at all.</li>
          <li>No one can see that a specific person bought. Money figures are estimates.</li>
        </ul>
      </section>
    </main>
  )
}
