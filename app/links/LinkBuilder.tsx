'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Dm, Item, Post } from '@/lib/types'

const MERGE_FIELD = '{{subscriber_id}}'
const SAMPLE_SUBSCRIBER = 'mc_demo_8841'

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">{label}</span>
      <span className="block text-xs text-ink-2 mt-1 mb-2 leading-snug">{hint}</span>
      {children}
    </label>
  )
}

const selectClass =
  'w-full rounded-lg border px-3 py-2 text-sm bg-surface-2 text-foreground'

export function LinkBuilder({ items, posts, jobs, dms }: { items: Item[]; posts: Post[]; jobs: string[]; dms: Dm[] }) {
  const [slug, setSlug] = useState('black-blazer')
  const [postSlug, setPostSlug] = useState('the-blazer')
  const [job, setJob] = useState('')
  const [manychat, setManychat] = useState(true)
  const [origin, setOrigin] = useState('https://your-site.example')
  const [copied, setCopied] = useState(false)
  const [sender, setSender] = useState(dms[0]?.handle ?? '')
  const [sent, setSent] = useState<string | null>(null)

  useEffect(() => { setOrigin(window.location.origin) }, [])

  const item = items.find(i => i.slug === slug)

  const url = useMemo(() => {
    const parts: string[] = []
    if (postSlug) parts.push(`p=${postSlug}`)
    if (job) parts.push(`d=${encodeURIComponent(job)}`)
    // Never URL-encode the merge field — ManyChat has to recognise it to swap it out.
    if (manychat) parts.push(`s=${MERGE_FIELD}`)
    return `${origin}/r/${slug}${parts.length ? '?' + parts.join('&') : ''}`
  }, [origin, slug, postSlug, job, manychat])

  const testUrl = url.replace(MERGE_FIELD, SAMPLE_SUBSCRIBER) + (url.includes('?') ? '&' : '?') + 'dry=1'

  const captures = [
    { on: true, label: 'That someone opened this link at all', detail: 'a cookie that lasts a year, so we recognise them if they come back' },
    { on: Boolean(postSlug), label: 'Which post it came from', detail: postSlug ? `tagged “${posts.find(p => p.slug === postSlug)?.title ?? postSlug}”` : 'pick a post to turn this on' },
    { on: Boolean(job), label: 'Which question she was answering', detail: job ? `tagged ${job}` : 'pick a DM question to turn this on' },
    { on: manychat, label: 'Who the person is', detail: manychat ? 'ManyChat fills in the commenter’s id — a handle instead of an anonymous click' : 'off: the click stays anonymous' },
    { on: true, label: 'If they forward it to a friend', detail: 'the friend arrives from WhatsApp or Messages rather than Instagram' },
  ]

  return (
    <div className="grid lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] gap-8 items-start">

      <div className="space-y-5">
        <Field label="The item" hint="Which piece the link should open.">
          <select className={selectClass} style={{ borderColor: 'var(--border)' }}
                  value={slug} onChange={e => setSlug(e.target.value)}>
            {items.map(i => (
              <option key={i.slug} value={i.slug}>
                {i.name}{i.realDestination ? '' : ' (placeholder link)'}
              </option>
            ))}
          </select>
        </Field>

        <Field label="The post" hint="If this link lives in a caption or a comment reply, say which post.">
          <select className={selectClass} style={{ borderColor: 'var(--border)' }}
                  value={postSlug} onChange={e => setPostSlug(e.target.value)}>
            <option value="">— not from a post —</option>
            {posts.map(p => <option key={p.ref} value={p.slug}>{p.title}</option>)}
          </select>
        </Field>

        <Field label="The question" hint="Replying to a DM by hand? Tag which question you're answering.">
          <select className={selectClass} style={{ borderColor: 'var(--border)' }}
                  value={job} onChange={e => setJob(e.target.value)}>
            <option value="">— not from a DM —</option>
            {jobs.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </Field>

        <label className="flex gap-3 items-start rounded-lg border p-3 cursor-pointer bg-surface-2"
               style={{ borderColor: manychat ? 'var(--seg-3)' : 'var(--border)' }}>
          <input type="checkbox" className="mt-0.5" checked={manychat}
                 onChange={e => setManychat(e.target.checked)} />
          <span>
            <span className="text-sm font-medium block">This link goes in a comment auto-reply</span>
            <span className="text-xs text-ink-2 block mt-0.5 leading-snug">
              For &ldquo;comment BLAZER and I&apos;ll send you the link&rdquo;. ManyChat swaps
              the placeholder for the commenter&apos;s id before it sends, so an anonymous
              click becomes a named one. DMs she answers herself &mdash; those links come
              from the list on the replies page.
            </span>
          </span>
        </label>
      </div>

      <div className="space-y-6 min-w-0">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-2">
            Paste this into ManyChat
          </p>
          <div className="rounded-xl border p-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
            <code className="text-xs sm:text-sm break-all leading-relaxed block">
              {url.split(MERGE_FIELD).map((chunk, i, arr) => (
                <span key={i}>
                  {chunk}
                  {i < arr.length - 1 && (
                    <span className="font-semibold" style={{ color: 'var(--seg-3)' }}>{MERGE_FIELD}</span>
                  )}
                </span>
              ))}
            </code>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(url).then(
                    () => { setCopied(true); setTimeout(() => setCopied(false), 1600) },
                    () => setCopied(false),
                  )
                }}
                className="text-xs rounded-lg px-3 py-2 font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <a
                href={testUrl} target="_blank" rel="noreferrer"
                className="text-xs rounded-lg border px-3 py-2 hover:bg-background transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                Test it (records a real click)
              </a>
            </div>
          </div>
          {item && !item.realDestination && (
            <p className="text-xs text-ink-3 mt-2">
              {item.name} still points at a placeholder search page. Only the black blazer
              has a real retailer link so far.
            </p>
          )}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-3">
            What this link will tell her
          </p>
          <ul className="space-y-2.5">
            {captures.map(c => (
              <li key={c.label} className="flex gap-2.5 items-start text-sm">
                <span
                  className="size-2 rounded-full shrink-0 mt-1.5"
                  style={{ background: c.on ? 'var(--seg-3)' : 'var(--series-dark)' }}
                />
                <span>
                  <span className={c.on ? 'font-medium' : 'text-ink-3'}>{c.label}</span>
                  <span className="block text-xs text-ink-2 mt-0.5 leading-snug">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* The fallback path: proves the identified click without a ManyChat account,
            using her twelve real DM senders as the cast. */}
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--seg-4)' }}>
          <p className="text-[11px] uppercase tracking-[0.12em] font-medium mb-1" style={{ color: 'var(--seg-4)' }}>
            No ManyChat account yet
          </p>
          <p className="text-sm text-ink-2 leading-relaxed mb-3">
            Stand in for the auto-reply: pretend someone commented on the post and
            ManyChat sent them this link. The click that lands is real — only the
            delivery is simulated.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="rounded-lg border px-3 py-2 text-sm bg-surface-2 text-foreground max-w-full"
              style={{ borderColor: 'var(--border)' }}
              value={sender}
              onChange={e => setSender(e.target.value)}
            >
              {dms.map(d => (
                <option key={d.ref} value={d.handle}>{d.handle} — {d.job}</option>
              ))}
            </select>
            <button
              type="button"
              className="text-xs rounded-lg px-3 py-2 font-medium text-white"
              style={{ background: 'var(--seg-4)' }}
              onClick={async () => {
                const dm = dms.find(d => d.handle === sender)
                if (!dm) return
                const handle = dm.handle.replace(/^@/, '')
                const params = new URLSearchParams({
                  d: dm.job,
                  s: `mc_sim_${handle}`,
                  h: handle,
                  src: 'instagram_dm',
                  dry: '1',
                })
                if (postSlug) params.set('p', postSlug)
                await fetch(`/r/${slug}?${params}`, { cache: 'no-store' })
                setSent(`${dm.handle} opened the ${item?.name ?? slug} link`)
                setTimeout(() => setSent(null), 6000)
              }}
            >
              Send it
            </button>
            {sent && <span className="text-xs" style={{ color: 'var(--seg-3)' }}>✓ {sent}</span>}
          </div>
          {(() => {
            const dm = dms.find(d => d.handle === sender)
            return dm ? (
              <p className="text-xs text-ink-3 mt-3 leading-snug">
                What they asked: &ldquo;{dm.message}&rdquo; — logged as <strong>{dm.job}</strong>.
              </p>
            ) : null
          })()}
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-3">
            Where it goes in ManyChat
          </p>
          <ol className="text-sm text-ink-2 space-y-2 list-decimal pl-4 leading-relaxed">
            <li>Make an Instagram flow with a <strong>comment</strong> trigger — the keyword you put in the caption.</li>
            <li>In the message it sends back, paste the URL above instead of the retailer link.</li>
            <li>Send it. ManyChat swaps <code className="text-xs">{MERGE_FIELD}</code> for that person&apos;s id as it goes out.</li>
          </ol>
          <p className="text-xs text-ink-3 mt-3 leading-relaxed">
            Nothing changes for the person receiving it — they tap a link and land on the
            retailer, same as always. Comments only: her DMs stay hers to answer, with the
            link copied from the replies list.
          </p>
        </div>
      </div>
    </div>
  )
}
