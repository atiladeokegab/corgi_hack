import Link from 'next/link'
import { OwedList } from './OwedList'
import { getCustomers, getEvents, getItems } from '@/lib/data'
import { buildProfiles } from '@/lib/classify'
import { CHASEABLE_DAYS, COMMISSION_RATE, owedToHer } from '@/lib/owed'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Money owed — Lookbook',
  description: 'Sales you caused but were never paid for.',
}

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')

export default function OwedPage() {
  const items = getItems()
  const profiles = buildProfiles(getEvents())
  const owed = owedToHer(getCustomers(), profiles, items)

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
          {gbp(owed.owedCommission)} you should have been paid.
        </h1>

        <div className="mt-6 rounded-2xl border p-5 bg-surface-2 max-w-2xl" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm leading-relaxed text-ink-2">
            <strong className="text-foreground font-medium">Here is what keeps happening.</strong>{' '}
            Someone sees your post. They save it. They think about it for three days.
            Then they buy.
          </p>
          <p className="text-sm leading-relaxed text-ink-2 mt-3">
            Your affiliate link only pays you if they buy <strong className="text-foreground font-medium">within
            one day</strong>. Three days is too late, so you get nothing — even though
            they only bought it because of you.
          </p>
          <p className="text-sm leading-relaxed text-ink-2 mt-3">
            Every sale below happened within {CHASEABLE_DAYS} days of someone seeing your
            post. Close enough that you can point at it and ask for your cut.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">Sales missed</p>
            <p className="text-2xl font-semibold mt-2 tnum">{owed.count.toLocaleString('en-GB')}</p>
          </div>
          <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">They spent</p>
            <p className="text-2xl font-semibold mt-2 tnum">{gbp(owed.owedValue)}</p>
          </div>
          <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--seg-4)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: 'var(--seg-4)' }}>
              Your cut, unpaid
            </p>
            <p className="text-2xl font-semibold mt-2 tnum">{gbp(owed.owedCommission)}</p>
          </div>
        </div>
        <p className="text-xs text-ink-3 mt-3">
          Your cut is worked out at {Math.round(COMMISSION_RATE * 100)}%. Change it to
          whatever your deal actually is.
        </p>
      </header>

      <OwedList rows={owed.rows.slice(0, 40)} total={owed.count} />
    </main>
  )
}
