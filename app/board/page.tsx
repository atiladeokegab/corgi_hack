import Link from 'next/link'
import { getDms, getItems, getPosts } from '@/lib/data'
import { Board, type BoardCard } from './Board'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The board — Lookbook',
  description: 'One canvas for the messages, the pieces and the posts she is working through.',
}

export default function BoardPage() {
  const dms = getDms()
  const items = getItems()
  const posts = getPosts()

  // Enough to work with, not everything she owns. A board that opens with
  // thirty cards on it is a board nobody moves anything on.
  const cards: BoardCard[] = [
    ...dms.slice(0, 5).map<BoardCard>(d => ({
      id: `dm_${d.ref}`,
      kind: 'dm',
      title: d.handle,
      body: d.message,
      meta: `${d.ref} · ${d.job}`,
    })),
    ...items.slice(0, 4).map<BoardCard>(i => ({
      id: `item_${i.slug}`,
      kind: 'item',
      title: i.name,
      // Her verdict, exactly as E-04 prints it. Never scored, never rewritten.
      body: `“${i.sofiaSays}”`,
      meta: `${i.ref} · ${i.tier} · ${i.style}`,
    })),
    ...posts.slice(0, 3).map<BoardCard>(p => ({
      id: `post_${p.ref}`,
      kind: 'post',
      title: p.title,
      body: `${p.views.toLocaleString()} views · ${p.saves.toLocaleString()} saves`,
      meta: `${p.ref} · ${p.organiserLabel}`,
    })),
  ]

  return (
    <main className="mx-auto w-full max-w-[960px] px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-8">
        <Link href="/" className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium hover:text-foreground transition-colors">
          ← Lookbook
        </Link>
        <h1 className="text-3xl sm:text-[2.4rem] font-semibold mt-2 tracking-tight leading-[1.1]">
          The board
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          The messages, the pieces and the posts on one surface, so a decision can be
          moved across it rather than held in her head. Drag anything. It saves itself,
          and it is still where she left it tomorrow.
        </p>
      </header>

      <Board cards={cards} />

      <p className="text-[11px] text-ink-3 mt-4 leading-relaxed max-w-2xl">
        Cards are drawn from the evidence: DMs from E-01, pieces from E-04 with her verdict
        quoted exactly, posts from E-03. Positions persist to <code>data/board.json</code> and
        touch nothing the dashboard reads. No drag-and-drop library — pointer events only.
      </p>
    </main>
  )
}
