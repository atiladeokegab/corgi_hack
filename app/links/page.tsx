import Link from 'next/link'
import { LinkBuilder } from './LinkBuilder'
import { LiveFeed } from '../components/LiveFeed'
import { getDms, getItems, getPosts } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Link builder — Lookbook',
  description: 'Build a link that tells Sofia who opened it and what brought them.',
}

export default function LinksPage() {
  const items = getItems()
  const posts = getPosts()
  const dms = getDms()
  const jobs = [...new Set(dms.map(d => d.job))]

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-9">
        <Link href="/" className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium hover:text-foreground transition-colors">
          ← Lookbook
        </Link>
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-2 tracking-tight leading-[1.1]">
          Build a link
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          Sofia already pastes links into her replies. This makes the same link carry a
          few extra characters, so that when someone opens it she learns which post or
          question brought them — and, if it went out through ManyChat, who they are.
          The person clicking sees no difference at all.
        </p>
      </header>

      <LinkBuilder items={items} posts={posts} jobs={jobs} dms={dms} />

      <section className="mt-14">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">Proof</p>
        <h2 className="text-xl font-semibold mt-1.5 tracking-tight">Clicks landing right now</h2>
        <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
          Hit <em>Test it</em> above and the click shows up here within two seconds — the
          same record that feeds the audience breakdown on the main page.
        </p>
        <div className="mt-5 rounded-xl border px-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          <LiveFeed />
        </div>
      </section>
    </main>
  )
}
