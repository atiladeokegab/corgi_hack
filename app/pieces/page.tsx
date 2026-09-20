import { Breakdown, Legend, PageHeader } from '../components/Layout'
import { getEvents, getItems } from '@/lib/data'
import { buildProfiles, SEGMENT_ORDER } from '@/lib/classify'
import { itemBreakdown } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'What they want — Lookbook' }

export default function PiecesPage() {
  const profiles = buildProfiles(getEvents())
  const items = getItems()
  const rows = itemBreakdown(items, profiles)
  const present = SEGMENT_ORDER.filter(k => rows.some(r => r.mix.some(m => m.key === k)))

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <PageHeader
        title="What they want"
        sub="Your verdict on each piece, sat next to the people who keep opening it. Your words, exactly as you wrote them — never turned into a score."
      />

      <Legend keys={present} />
      <Breakdown rows={rows} max={Math.max(...rows.map(r => r.total))} />

      <p className="text-xs text-ink-3 mt-10 max-w-2xl leading-relaxed">
        Only 8 of your 36 pieces are in here, so this is a slice rather than the whole
        wardrobe.
      </p>
    </main>
  )
}
