import { Breakdown, Legend, PageHeader } from '../components/Layout'
import { getEvents, getPosts } from '@/lib/data'
import { buildProfiles, SEGMENT_ORDER, SEGMENTS } from '@/lib/classify'
import { postBreakdown } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'What to post next — Edna' }

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
        sub="Bar length is how many people the post brought. Colour is who they were."
      />

      {best && bestLead && (
        <p className="rounded-xl border p-4 bg-surface-2 text-sm leading-relaxed mb-8 max-w-2xl"
           style={{ borderColor: 'var(--border)' }}>
          <strong className="font-medium">&ldquo;{best.label}&rdquo;</strong> brought the most people.
          Mostly{' '}
          <span className="font-medium" style={{ color: SEGMENTS[bestLead.key].color }}>
            {SEGMENTS[bestLead.key].label}
          </span>.
        </p>
      )}

      <Legend keys={present} />
      <Breakdown rows={rows} max={Math.max(...rows.map(r => r.total))} />

      <p className="text-xs text-ink-3 mt-10 max-w-2xl leading-relaxed">
        A post with one link and a post with five do not bring the same people.
      </p>
    </main>
  )
}
