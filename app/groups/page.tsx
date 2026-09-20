import { headers } from 'next/headers'
import Link from 'next/link'
import { DmQueue } from './DmQueue'
import { getCustomers, getEvents, getItems } from '@/lib/data'
import { buildProfiles, SEGMENTS, SEGMENT_ORDER } from '@/lib/classify'
import { dmPriority } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Who to reply to — Lookbook',
  description: 'Her inbox in the order that is worth her time, each with a link to paste.',
}

export default async function GroupsPage() {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${host}`

  const profiles = buildProfiles(getEvents())
  const customers = getCustomers()
  const rows = dmPriority(profiles, customers, { limit: 60 })

  const nameable = profiles.filter(p => p.handle).length
  const groups = SEGMENT_ORDER
    .filter(k => k !== 'BROWSING')
    .map(key => ({
      key,
      label: SEGMENTS[key].label,
      angle: SEGMENTS[key].angle,
      color: SEGMENTS[key].color,
      people: profiles.filter(p => p.segment === key && p.handle).length,
    }))
    .filter(g => g.people > 0)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-9">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <Link href="/" className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium hover:text-foreground transition-colors">
            ← Lookbook
          </Link>
          <Link
            href="/links"
            className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            Build a link →
          </Link>
        </div>
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-3 tracking-tight leading-[1.1]">
          Who to reply to first
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          She writes the message. This decides the order and hands her the link to
          paste — one that already knows who she sent it to, so she finds out
          afterwards whether it landed.
        </p>
        <p className="text-sm text-ink-3 mt-3 max-w-2xl leading-relaxed">
          Ordered by what each person has actually spent, which the retailer reports
          back against the link. Only the {nameable.toLocaleString('en-GB')} people
          she can name appear — an anonymous click from a caption has nobody behind
          it to message.
        </p>
      </header>

      <DmQueue rows={rows} groups={groups} items={getItems()} origin={origin} />
    </main>
  )
}
