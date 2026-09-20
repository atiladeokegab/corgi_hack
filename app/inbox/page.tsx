import { headers } from 'next/headers'
import Link from 'next/link'
import { Triage } from './Triage'
import { getEvents, getItems, getPendingDms } from '@/lib/data'
import { buildProfiles, SEGMENTS } from '@/lib/classify'
import { buildPersonalLink } from '@/lib/links'
import { cheaperThan, TEMPLATES } from '@/lib/templates'
import type { SegmentKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Inbox — Lookbook',
  description: 'The questions she has answered a thousand times, answered.',
}

export default async function InboxPage() {
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host') ?? 'localhost:3000'}`

  const items = getItems()
  const bySlug = Object.fromEntries(items.map(i => [i.slug, i]))
  const profiles = buildProfiles(getEvents())
  const segmentByUid = new Map(profiles.map(p => [p.uid, p.segment]))

  const cards = getPendingDms().map(dm => {
    const item = bySlug[dm.slug] ?? items[0]
    const segment = (segmentByUid.get(dm.uid) ?? 'BROWSING') as SegmentKey
    const template = TEMPLATES[dm.job]
    const link = buildPersonalLink({
      origin, item: item.slug, group: segment,
      subscriberId: `mc_${dm.handle}`, handle: dm.handle,
    })
    const cheaper = cheaperThan(item, items)
    const cheaperLink = cheaper
      ? buildPersonalLink({
          origin, item: cheaper.slug, group: segment,
          subscriberId: `mc_${dm.handle}`, handle: dm.handle,
        })
      : null

    const draft = template?.build({ item, link, cheaper, cheaperLink }) ?? null
    return {
      ...dm,
      segment,
      segmentLabel: SEGMENTS[segment].label,
      segmentColor: SEGMENTS[segment].color,
      itemName: item.name,
      asking: template?.asking ?? dm.job,
      autoable: Boolean(template?.autoable && draft),
      needsHer: template?.needsHer ?? null,
      draft,
      link,
    }
  })

  const ready = cards.filter(c => c.autoable).length

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-9">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <Link href="/" className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium hover:text-foreground transition-colors">
            ← Lookbook
          </Link>
          <Link
            href="/groups"
            className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            Who to reply to →
          </Link>
        </div>
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-3 tracking-tight leading-[1.1]">
          {cards.length} waiting. {ready} of them you have answered a hundred times.
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          The repeat questions come with the reply already written — her size, her
          cheaper pick, her own words. Read it, send it, move on. The ones that
          actually need her are marked and left alone.
        </p>
      </header>

      <Triage cards={cards} />
    </main>
  )
}
