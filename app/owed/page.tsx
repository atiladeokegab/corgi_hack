import Link from 'next/link'
import { OwedList } from './OwedList'
import { getCustomers, getEvents, getItems } from '@/lib/data'
import { buildProfiles } from '@/lib/classify'
import { AFFILIATE_WINDOW_HOURS, CHASEABLE_DAYS, COMMISSION_RATE, owedToHer } from '@/lib/owed'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The pay window — Edna',
  description: 'Your affiliate links keep working long after you stop getting paid for them.',
}

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')
const num = (n: number) => Math.round(n).toLocaleString('en-GB')

export default function OwedPage() {
  const items = getItems()
  const profiles = buildProfiles(getEvents())
  const o = owedToHer(getCustomers(), profiles, items)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-9">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <Link href="/" className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium hover:text-foreground transition-colors">
            ← Lookbook
          </Link>
          <Link
            href="/inbox"
            className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            Your inbox →
          </Link>
        </div>

        <h1 className="text-3xl sm:text-[2.6rem] font-semibold mt-3 tracking-tight leading-[1.1]">
          {num(o.lateReturners)} people came back
          <br className="hidden sm:block" /> after you stopped getting paid.
        </h1>

        <div className="mt-6 rounded-2xl border p-5 bg-surface-2 max-w-2xl" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm leading-relaxed text-ink-2">
            Someone sees your post, saves it, thinks for a few days, then buys.
          </p>
          <p className="text-sm leading-relaxed text-ink-2 mt-3">
            Your affiliate link only pays if they buy{' '}
            <strong className="text-foreground font-medium">within {AFFILIATE_WINDOW_HOURS} hours</strong>.
            Three days is too late. You get nothing.
          </p>
        </div>
      </header>

      {/* What we can actually prove, and what we are only inferring. Kept apart on
          purpose: the first number is ours, the second is arithmetic. */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.14em] font-medium" style={{ color: 'var(--seg-3)' }}>
          What we know for certain
        </p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--seg-3)' }}>
            <p className="text-2xl font-semibold tnum">{num(o.lateReturners)}</p>
            <p className="text-xs text-ink-2 mt-1 leading-snug">
              came back to an affiliate link more than a day after the first time
            </p>
          </div>
          <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <p className="text-2xl font-semibold tnum">{num(o.withinChaseable)}</p>
            <p className="text-xs text-ink-2 mt-1 leading-snug">
              of those came back within {CHASEABLE_DAYS} days
            </p>
          </div>
          <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <p className="text-2xl font-semibold tnum">{num(o.paidSales)}</p>
            <p className="text-xs text-ink-2 mt-1 leading-snug">
              sales you actually got paid for
            </p>
          </div>
        </div>
        <p className="text-xs text-ink-3 mt-3 max-w-2xl leading-relaxed">
          The first two are counted from your own affiliate links. The third is from your
          affiliate statement.
        </p>
      </section>

      <section className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.14em] font-medium" style={{ color: 'var(--seg-4)' }}>
          What that is probably worth — an estimate, not a bill
        </p>
        <div className="mt-3 rounded-2xl border p-5 sm:p-6 bg-surface-2" style={{ borderColor: 'var(--seg-4)' }}>
          <p className="text-4xl font-semibold tnum tracking-tight">{gbp(o.estimatedCommission)}</p>
          <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
            Roughly {num(o.estimatedSales)} sales you were never paid for.
          </p>

          <div className="mt-5 rounded-xl p-4 text-sm leading-relaxed"
               style={{ background: 'var(--background)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-2">
              How we got there
            </p>
            <ol className="space-y-1.5 text-ink-2 list-decimal pl-4">
              <li>
                Out of {num(o.totalClickers)} people who clicked, {num(o.paidSales)} bought fast
                enough to count — that is {(o.conversionRate * 100).toFixed(1)}% of them.
              </li>
              <li>
                {num(o.lateReturners)} people came back after the window shut. If they buy at
                that same rate, that is about {num(o.estimatedSales)} sales.
              </li>
              <li>
                Your average order is {gbp(o.averageOrderValue)}, and your cut is{' '}
                {Math.round(COMMISSION_RATE * 100)}%.
              </li>
              <li>
                Deliberately cautious. Repeat visitors buy more often than one-time
                clickers, so the real figure is likely higher.
              </li>
            </ol>
          </div>

          <p className="text-xs text-ink-3 mt-4 max-w-2xl leading-relaxed">
            No one can see that a specific person bought something — that happens on the
            shop&apos;s site. This is your click data multiplied by the rate your affiliate
            statement already shows. An estimate, not a list of names.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          How to turn the estimate into an invoice
        </p>
        <div className="mt-3 rounded-2xl border p-5 bg-surface-2 max-w-2xl" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm text-ink-2 leading-relaxed">
            Ask the brand for your own discount code. A code stays on the order and never
            expires, so a purchase three days later still carries your name.
          </p>
          <p className="text-sm text-ink-2 leading-relaxed mt-3">
            The brand benefits too. They cannot currently tell which creator earned which sale.
          </p>
        </div>
      </section>

      <OwedList rows={o.rows.slice(0, 40)} total={o.lateReturners} estimate={o.estimatedCommission} />
    </main>
  )
}
