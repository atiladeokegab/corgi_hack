import Link from 'next/link'
import { LinkBuilder } from './LinkBuilder'
import { LiveFeed } from '../components/LiveFeed'
import { getDms, getItems, getPosts } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Make an affiliate link — Edna',
  description: 'An affiliate link that tells you who opened it and what brought them.',
}

export default function LinksPage() {
  const items = getItems()
  const posts = getPosts()
  const dms = getDms()
  const jobs = [...new Set(dms.map(d => d.job))]

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-9">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <Link href="/" className="text-base font-semibold tracking-[0.2em] hover:opacity-70 transition-opacity">
            EDNA
          </Link>
          <Link
            href="/inbox"
            className="text-xs rounded-lg border px-3 py-1.5 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--border)' }}
          >
            Your inbox →
          </Link>
        </div>
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-3 tracking-tight leading-[1.1]">
          Make an affiliate link
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          The same affiliate link, with a few extra characters. They record who opened it
          and what brought them. Whoever taps it lands on the shop as normal.
        </p>
      </header>

      <LinkBuilder items={items} posts={posts} jobs={jobs} dms={dms} />

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight">Clicks landing right now</h2>
        <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
          Open one of your affiliate links. It appears here within two seconds.
        </p>
        <div className="mt-5 rounded-xl border px-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          <LiveFeed />
        </div>
      </section>
    </main>
  )
}
