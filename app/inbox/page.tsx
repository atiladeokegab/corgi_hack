import { adapters, ingestAll } from '@/lib/ingest'
import type { Platform, UnifiedMessage } from '@/lib/ingest'

export const dynamic = 'force-dynamic'

const labels: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  email: 'Email',
}

const colours: Record<Platform, string> = {
  instagram: 'var(--seg-2)',
  tiktok: 'var(--seg-3)',
  youtube: 'var(--seg-5)',
  email: 'var(--seg-1)',
}

function rawField(message: UnifiedMessage, field: string): string | null {
  if (!message.raw || typeof message.raw !== 'object') return null
  const value = (message.raw as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : null
}

export default async function InboxPage() {
  const messages = await ingestAll()
  const counts = new Map<Platform, number>()
  messages.forEach(message => counts.set(message.platform, (counts.get(message.platform) ?? 0) + 1))

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <header>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          One queue · four adapter boundaries
        </p>
        <h1 className="text-3xl sm:text-[2.6rem] font-semibold mt-2 tracking-tight leading-[1.1]">
          Sofia&apos;s inbox, without pretending every door is open.
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          The case records 3.1K+ DMs each month. Twelve Instagram messages are printed in
          E-01; TikTok, YouTube and email below are clearly labelled stand-ins until their
          real connection requirements can be met.
        </p>
      </header>

      <section className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Connections">
        {adapters.map(adapter => (
          <article key={adapter.platform} className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{labels[adapter.platform]}</p>
              <span
                className="rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.1em] font-medium"
                style={{ color: adapter.isLive ? 'var(--seg-3)' : 'var(--text-muted)', background: 'var(--background)' }}
              >
                {adapter.isLive ? 'Live' : 'Stand-in'}
              </span>
            </div>
            <p className="text-2xl font-semibold tnum mt-3">{counts.get(adapter.platform) ?? 0}</p>
            <p className="text-xs text-ink-3 mt-2 leading-relaxed">{adapter.describe()}</p>
          </article>
        ))}
      </section>

      <section className="mt-12">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">Unified message list</p>
        <h2 className="text-xl sm:text-2xl font-semibold mt-1.5 tracking-tight">Newest first</h2>
        <ul className="mt-5 divide-y rounded-xl border bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          {messages.map(message => {
            const job = rawField(message, 'job')
            const synthetic = rawField(message, 'fixture')
            return (
              <li key={message.id} className="p-4 sm:p-5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="size-2 rounded-full" style={{ background: colours[message.platform] }} />
                  <span className="text-[11px] uppercase tracking-[0.12em] font-medium">{labels[message.platform]}</span>
                  <span className="text-sm font-medium">{message.handle}</span>
                  {job && <span className="rounded-full bg-background px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-ink-2">{job}</span>}
                  {synthetic && <span className="rounded-full bg-background px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-ink-3">Synthetic stand-in</span>}
                  <time className="ml-auto text-xs text-ink-3 tnum" dateTime={message.receivedAt}>
                    {new Date(message.receivedAt).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed">{message.text}</p>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
