import Link from 'next/link'
import { GroupSender } from './GroupSender'
import { getEvents, getItems } from '@/lib/data'
import { buildProfiles, SEGMENTS, SEGMENT_ORDER } from '@/lib/classify'
import { getMessages } from '@/lib/messages'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Groups — Lookbook',
  description: 'Send each group of her audience the version of the message that suits them.',
}

export default function GroupsPage() {
  const profiles = buildProfiles(getEvents())
  const groups = SEGMENT_ORDER
    .filter(k => k !== 'BROWSING')
    .map(key => ({
      key,
      label: SEGMENTS[key].label,
      blurb: SEGMENTS[key].blurb,
      color: SEGMENTS[key].color,
      people: profiles.filter(p => p.segment === key).length,
    }))
    .filter(g => g.people > 0)
    .sort((a, b) => b.people - a.people)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
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
            Build a single link →
          </Link>
        </div>
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-3 tracking-tight leading-[1.1]">
          Message a whole group at once
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          She writes the reply once for each kind of person, not once for each person.
          Everyone in the group gets their own link, so she finds out afterwards which
          version of the message actually worked. Delivery here goes to a single
          nominated account — enough to show the whole path end to end.
        </p>
      </header>

      <GroupSender groups={groups} items={getItems()} messages={getMessages()} />
    </main>
  )
}
