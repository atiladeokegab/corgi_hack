import Link from 'next/link'
import { getEvents } from '@/lib/data'
import { buildProfiles } from '@/lib/classify'
import { getCharges } from '@/lib/stripe'
import { attribute, summarise, bySegment, formatMoney } from '@/lib/monetisation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Revenue — Lookbook',
  description: 'What the charge log can and cannot tell her, reported honestly.',
}

export default async function RevenuePage() {
  const source = await getCharges()
  const profiles = buildProfiles(getEvents())
  const rows = attribute(source.charges, profiles)
  const sum = summarise(rows)
  const segments = bySegment(rows, profiles)

  const unattributedShare = 1 - sum.attributedShare

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-9">
        <Link href="/" className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium hover:text-foreground transition-colors">
          ← Lookbook
        </Link>
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-2 tracking-tight leading-[1.1]">
          Revenue
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          Charges joined to the people a tracked link recognised. The number this page
          leads with is the one that <em>cannot</em> be joined, because on this evidence
          that is the bigger half and every affiliate dashboard she owns already hides it.
        </p>
      </header>

      {!source.isLive && (
        <div
          className="rounded-xl border px-4 py-3 mb-8 text-sm"
          style={{ borderColor: 'var(--seg-4)', background: 'color-mix(in srgb, var(--seg-4) 8%, transparent)' }}
        >
          <strong className="font-medium">Synthetic charge data.</strong>{' '}
          <span className="text-ink-2">
            {source.describe}. Proportions are pinned to E-09; the three figures that are
            assumptions are named in <code className="text-xs">scripts/seed-charges.mjs</code>.
          </span>
        </div>
      )}

      <section className="grid sm:grid-cols-3 gap-3 mb-4">
        <div
          className="rounded-xl border px-5 py-5 sm:col-span-2"
          style={{ borderColor: 'var(--seg-2)', background: 'var(--surface-2)' }}
        >
          <p className="text-[11px] uppercase tracking-[0.14em] font-medium" style={{ color: 'var(--seg-2)' }}>
            Cannot be traced to a click
          </p>
          <p className="text-4xl font-semibold tracking-tight mt-2 tnum">
            {formatMoney(sum.unattributedTotal, sum.currency)}
          </p>
          <p className="text-sm text-ink-2 mt-2 leading-relaxed">
            {Math.round(unattributedShare * 100)}% of takings, across {sum.unattributedCount} charges.
            E-09 says to expect this: 62% of high-value purchasers never clicked the link, and the
            median gap between saving a look and buying is 3.4 days. This is the majority path, not
            a tracking bug.
          </p>
        </div>

        <div className="rounded-xl border px-5 py-5 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">Attributable</p>
          <p className="text-3xl font-semibold tracking-tight mt-2 tnum">
            {formatMoney(sum.attributedTotal, sum.currency)}
          </p>
          <p className="text-sm text-ink-2 mt-2 leading-relaxed">
            {Math.round(sum.attributedShare * 100)}% of takings, {sum.attributedCount} charges
            carrying a <code className="text-xs">lb_uid</code> a tracked link set.
          </p>
        </div>
      </section>

      <p className="text-sm text-ink-2 mb-12 leading-relaxed max-w-3xl">
        Total {formatMoney(sum.total, sum.currency)} across {sum.charges} charges. Reported as two
        numbers on purpose: an affiliate dashboard shows only the smaller one, and a creator
        deciding what to make next off that number is optimising for the minority of her buyers.
      </p>

      <section>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">Among the ones we can see</p>
        <h2 className="text-xl font-semibold mt-1.5 tracking-tight">Which kind of person buys</h2>
        <p className="text-sm text-ink-2 mt-2 max-w-3xl leading-relaxed">
          Conversion here is a <strong className="text-foreground">floor, not a rate</strong>. The
          62% who bought without clicking cannot appear in either column, so every figure below
          understates. It is still the only view she has of which behaviour precedes money.
        </p>

        <div className="mt-5 rounded-xl border overflow-x-auto bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <th className="font-medium px-4 py-3">Segment</th>
                <th className="font-medium px-4 py-3 text-right">People</th>
                <th className="font-medium px-4 py-3 text-right">Traceable buyers</th>
                <th className="font-medium px-4 py-3 text-right">Floor rate</th>
                <th className="font-medium px-4 py-3 text-right">Traceable revenue</th>
              </tr>
            </thead>
            <tbody>
              {segments.map(s => (
                <tr key={s.segment} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium">{s.segment}</td>
                  <td className="px-4 py-3 text-right tnum text-ink-2">{s.people}</td>
                  <td className="px-4 py-3 text-right tnum text-ink-2">{s.buyers}</td>
                  <td className="px-4 py-3 text-right tnum text-ink-2">{(s.conversion * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right tnum font-medium">{formatMoney(s.revenue, sum.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">How this is wired</p>
        <ul className="text-sm text-ink-2 mt-3 space-y-2 leading-relaxed max-w-3xl">
          <li>
            <strong className="text-foreground">Live when a key exists, never otherwise.</strong>{' '}
            With <code className="text-xs">STRIPE_SECRET_KEY</code> set, charges come from
            Stripe over one REST call. Without it, the fixture. No <code className="text-xs">stripe</code>{' '}
            package and no new dependency.
          </li>
          <li>
            <strong className="text-foreground">Webhooks are signature-checked.</strong>{' '}
            <code className="text-xs">POST /api/stripe/webhook</code> verifies the
            <code className="text-xs"> Stripe-Signature</code> HMAC with a timing-safe compare.
            With no secret configured an event is recorded as <em>unverified</em> — it is never
            counted as verified, and never silently dropped.
          </li>
          <li>
            <strong className="text-foreground">The join is one field.</strong> A charge is
            attributable only if it carries <code className="text-xs">metadata.lb_uid</code>, which
            a tracked link set. Everything else is unattributed, and stays visible as such.
          </li>
          <li>
            <strong className="text-foreground">No secret reaches the browser.</strong> This page
            and its modules are server-only; nothing here is imported by a client component.
          </li>
        </ul>
      </section>
    </main>
  )
}
