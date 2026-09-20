import { Breakdown, Legend, PageHeader } from '../components/Layout'
import { getEvents, getPosts } from '@/lib/data'
import { buildProfiles, SEGMENT_ORDER, SEGMENTS } from '@/lib/classify'
import { postBreakdown } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'What to post next — Lookbook' }

export default function PostsPage() {
  const profiles = buildProfiles(getEvents())
  const rows = postBreakdown(getPosts(), profiles)
  const present = SEGMENT_ORDER.filter(k => rows.some(r => r.mix.some(m => m.key === k)))
  const best = rows[0]
  const bestLead = best ? [...best.mix].sort((a, b) => b.n - a.n)[0] : null

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <PageHeader
        title="What to post next"
        sub="Every post pulls in a different crowd. How long the bar is, is how many people that post brought you. The colours are who they turned out to be."
      />

      {best && bestLead && (
        <p className="rounded-xl border p-4 bg-surface-2 text-sm leading-relaxed mb-8 max-w-2xl"
           style={{ borderColor: 'var(--border)' }}>
          <strong className="font-medium">&ldquo;{best.label}&rdquo; brought you the most people</strong>{' '}
          — and most of them were{' '}
          <span className="font-medium" style={{ color: SEGMENTS[bestLead.key].color }}>
            {SEGMENTS[bestLead.key].label}
          </span>. If that is the crowd you want more of, make more like it.
        </p>
      )}

      <Legend keys={present} />
      <Breakdown rows={rows} max={Math.max(...rows.map(r => r.total))} />

      <p className="text-xs text-ink-3 mt-10 max-w-2xl leading-relaxed">
        The number of links in a post matters more than you would think. Your most
        stripped-back post and your longest one do not bring the same people.
      </p>
    </main>
  )
}
