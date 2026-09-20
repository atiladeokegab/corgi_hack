import { Breakdown, Legend, PageHeader } from '../components/Layout'
import { getEvents } from '@/lib/data'
import { buildProfiles, SEGMENT_ORDER, SEGMENTS } from '@/lib/classify'
import { dmBreakdown } from '@/lib/analytics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Who to answer first — Edna' }

export default function QuestionsPage() {
  const profiles = buildProfiles(getEvents())
  const rows = dmBreakdown(profiles)
  const present = SEGMENT_ORDER.filter(k => rows.some(r => r.mix.some(m => m.key === k)))

  const loudest = rows[0]
  const bestForSharing = [...rows].sort((a, b) => {
    const ax = a.mix.find(m => m.key === 'CONNECTOR')?.n ?? 0
    const bx = b.mix.find(m => m.key === 'CONNECTOR')?.n ?? 0
    return (bx / Math.max(1, b.total)) - (ax / Math.max(1, a.total))
  })[0]

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <PageHeader
        title="Who to answer first"
        sub="Your affiliate link records which question you were answering. What someone asks predicts what kind of person they are."
      />

      {loudest && bestForSharing && (
        <div className="rounded-xl border p-4 bg-surface-2 text-sm leading-relaxed mb-8 max-w-2xl space-y-2"
             style={{ borderColor: 'var(--border)' }}>
          <p>
            <strong className="font-medium">&ldquo;{loudest.label.toLowerCase()}&rdquo;</strong> is your most
            common question. Those people take the link and never return.
          </p>
          <p>
            <strong className="font-medium">&ldquo;{bestForSharing.label.toLowerCase()}&rdquo;</strong> is one of
            your quietest. It brings the most people who forward your affiliate links on.
          </p>
        </div>
      )}

      <Legend keys={present} />
      <Breakdown rows={rows} max={Math.max(...rows.map(r => r.total))} />

      <p className="text-xs text-ink-3 mt-10 max-w-2xl leading-relaxed">
        The loudest questions are rarely the most valuable.
      </p>
    </main>
  )
}
