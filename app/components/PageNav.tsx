import Link from 'next/link'

/**
 * Cross-links between the pages added for the roadmap build.
 *
 * Deliberately not wired into the site nav: the homepage and layout belong to
 * the rest of the team and are not ours to edit. This keeps the new pages
 * reachable from one another during a demo without touching their work.
 */

const PAGES = [
  { href: '/desk', label: 'The desk' },
  { href: '/board', label: 'The board' },
  { href: '/inbox', label: 'Unified inbox' },
  { href: '/revenue', label: 'Revenue' },
] as const

export function PageNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
      {PAGES.map(p => (
        <Link
          key={p.href}
          href={p.href}
          aria-current={p.href === current ? 'page' : undefined}
          className="text-[11px] uppercase tracking-[0.12em] font-medium transition-colors"
          style={{ color: p.href === current ? 'var(--foreground)' : 'var(--text-muted)' }}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  )
}
