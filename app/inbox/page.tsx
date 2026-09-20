import { headers } from 'next/headers'
import Link from 'next/link'
import { Triage } from './Triage'
import { getEvents, getItems, getPendingDms } from '@/lib/data'
import { buildProfiles, SEGMENTS } from '@/lib/classify'
import { buildPersonalLink } from '@/lib/links'
import {
  ASKING, cheaperThan, getTemplates, NEEDS_YOU, PLACEHOLDERS, renderTemplate,
} from '@/lib/templates'
import { TemplateEditor } from './TemplateEditor'
import type { SegmentKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Inbox — Edna',
  description: 'The questions you answer every day, already answered.',
}

export default async function InboxPage() {
  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host') ?? 'localhost:3000'}`

  const items = getItems()
  const bySlug = Object.fromEntries(items.map(i => [i.slug, i]))
  const profiles = buildProfiles(getEvents())
  const segmentByUid = new Map(profiles.map(p => [p.uid, p.segment]))
  const profileByUid = new Map(profiles.map(p => [p.uid, p]))

  const templates = getTemplates()
  const pending = getPendingDms()
  const counts: Record<string, number> = {}
  for (const d of pending) if (templates[d.job]) counts[d.job] = (counts[d.job] ?? 0) + 1

  const cards = pending.map(dm => {
    const item = bySlug[dm.slug] ?? items[0]
    const segment = (segmentByUid.get(dm.uid) ?? 'BROWSING') as SegmentKey
    const template = templates[dm.job]
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

    const draft = template ? renderTemplate(template, { item, link, cheaper, cheaperLink }) : null
    return {
      ...dm,
      segment,
      segmentLabel: SEGMENTS[segment].label,
      segmentColor: SEGMENTS[segment].color,
      itemName: item.name,
      opens: profileByUid.get(dm.uid)?.touches ?? 0,
      distinctPosts: profileByUid.get(dm.uid)?.distinctPosts ?? 0,
      asking: ASKING[dm.job] ?? dm.job,
      autoable: Boolean(draft),
      // Either this question always needs her, or the template could not be filled in.
      needsHer: NEEDS_YOU[dm.job]
        ?? (template && !draft ? 'No cheaper piece of the same kind, so this one is yours.' : null),
      draft,
      link,
    }
  })

  const ready = cards.filter(c => c.autoable).length

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-9">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <Link href="/" className="text-base font-semibold tracking-[0.2em] hover:opacity-70 transition-opacity">
            EDNA
          </Link>
          <Link
            href="/links"
            className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
Make a link →
          </Link>
        </div>
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-3 tracking-tight leading-[1.1]">
          {cards.length} waiting. {ready} already written.
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          Repeat questions come with a reply drafted from your sizes and your own words.
          Read, send, next. The ones needing your judgement are kept separate.
        </p>
      </header>

      <TemplateEditor templates={templates} placeholders={PLACEHOLDERS} counts={counts} />

      <Triage cards={cards} />
    </main>
  )
}
