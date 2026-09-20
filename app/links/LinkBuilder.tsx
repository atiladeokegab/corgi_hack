'use client'

import { useEffect, useMemo, useState } from 'react'
import { DmPreview } from '../components/DmPreview'
import type { Dm, Item, Post } from '@/lib/types'

const MERGE_FIELD = '{{subscriber_id}}'

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">{label}</span>
      <span className="block text-xs text-ink-2 mt-1 mb-2 leading-snug">{hint}</span>
      {children}
    </label>
  )
}

const selectClass = 'w-full rounded-lg border px-3 py-2 text-sm bg-surface-2 text-foreground'

export function LinkBuilder({ items, posts, jobs, dms }: {
  items: Item[]; posts: Post[]; jobs: string[]; dms: Dm[]
}) {
  const [slug, setSlug] = useState('black-blazer')
  const [postSlug, setPostSlug] = useState('the-blazer')
  const [job, setJob] = useState('')
  const [autoReply, setAutoReply] = useState(true)
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
    if (autoReply) parts.push(`s=${MERGE_FIELD}`)
    return `${origin}/r/${slug}${parts.length ? '?' + parts.join('&') : ''}`
  }, [origin, slug, postSlug, job, autoReply])

  const testUrl = url.replace(MERGE_FIELD, 'someone_who_commented') + (url.includes('?') ? '&' : '?') + 'dry=1'
  const keyword = (item?.name.split(' ').pop() ?? 'LINK').toUpperCase()

  return (
    <div className="space-y-10">

      {/* What ManyChat is, shown rather than explained. */}
      <section className="rounded-2xl border p-5 sm:p-6 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          What the robot does for you
        </p>
        <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">
          You put a word in your caption. Anyone who comments that word gets your link
          sent to them instantly, all day, while you are asleep. You do not touch it.
        </p>

        <div className="grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-5 items-center mt-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-2">
              Your caption says
            </p>
            <div className="rounded-xl border p-3.5 text-sm leading-relaxed"
                 style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
              <p>The one I keep reaching for. Comment{' '}
                <strong className="font-semibold" style={{ color: 'var(--accent)' }}>{keyword}</strong>
                {' '}and I&apos;ll send you the link x</p>
            </div>
            <div className="mt-3 space-y-1.5">
              {['@ellawears', '@junodaily', '@mira.edit'].map(h => (
                <p key={h} className="text-xs text-ink-2">
                  <span className="font-medium">{h}</span> {keyword}
                </p>
              ))}
              <p className="text-xs text-ink-3">…and 400 more</p>
            </div>
          </div>

          <p className="text-2xl text-ink-3 text-center md:rotate-0 rotate-90" aria-hidden>→</p>

          <DmPreview
            handle="@ellawears"
            caption="Two seconds later, in their DMs"
            bubbles={[
              { from: 'them', text: keyword },
              {
                from: 'you',
                text: "here you go x",
                link: `${origin}/r/${slug}`,
                linkLabel: item?.name ?? 'the piece',
              },
            ]}
          />
        </div>
      </section>

      <div className="grid lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] gap-8 items-start">
        <div className="space-y-5">
          <Field label="The piece" hint="What the link should open.">
            <select className={selectClass} style={{ borderColor: 'var(--border)' }}
                    value={slug} onChange={e => setSlug(e.target.value)}>
              {items.map(i => (
                <option key={i.slug} value={i.slug}>
                  {i.name}{i.realDestination ? '' : ' (not a real shop link yet)'}
                </option>
              ))}
            </select>
          </Field>

          <Field label="The post" hint="Which post this link belongs to.">
            <select className={selectClass} style={{ borderColor: 'var(--border)' }}
                    value={postSlug} onChange={e => setPostSlug(e.target.value)}>
              <option value="">— not from a post —</option>
              {posts.map(p => <option key={p.ref} value={p.slug}>{p.title}</option>)}
            </select>
          </Field>

          <Field label="The question" hint="Answering a DM yourself? Say what they asked.">
            <select className={selectClass} style={{ borderColor: 'var(--border)' }}
                    value={job} onChange={e => setJob(e.target.value)}>
              <option value="">— not from a DM —</option>
              {jobs.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </Field>

          <label className="flex gap-3 items-start rounded-lg border p-3 cursor-pointer bg-surface-2"
                 style={{ borderColor: autoReply ? 'var(--seg-3)' : 'var(--border)' }}>
            <input type="checkbox" className="mt-0.5" checked={autoReply}
                   onChange={e => setAutoReply(e.target.checked)} />
            <span>
              <span className="text-sm font-medium block">The robot is sending this one</span>
              <span className="text-xs text-ink-2 block mt-0.5 leading-snug">
                Adds a tag that gets swapped for the person&apos;s name as it sends. That is
                how you find out who clicked instead of just how many.
              </span>
            </span>
          </label>
        </div>

        <div className="space-y-6 min-w-0">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium mb-2">
              Your link
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
                  {copied ? 'Copied' : 'Copy it'}
                </button>
                <a
                  href={testUrl} target="_blank" rel="noreferrer"
                  className="text-xs rounded-lg border px-3 py-2 hover:bg-background transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Open it yourself
                </a>
              </div>
            </div>
            {item && !item.realDestination && (
              <p className="text-xs text-ink-3 mt-2">
                {item.name} does not have a real shop link yet, so this one goes to a
                search page. Only the black blazer is wired up properly.
              </p>
            )}
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--seg-4)' }}>
            <p className="text-[11px] uppercase tracking-[0.12em] font-medium mb-1" style={{ color: 'var(--seg-4)' }}>
              Try it without setting anything up
            </p>
            <p className="text-sm text-ink-2 leading-relaxed mb-3">
              Pretend one of your people just commented, and the robot sent them this.
              The click is real — only the sending is pretend.
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="rounded-lg border px-3 py-2 text-sm bg-surface-2 text-foreground max-w-full"
                style={{ borderColor: 'var(--border)' }}
                value={sender} onChange={e => setSender(e.target.value)}
              >
                {dms.map(d => <option key={d.ref} value={d.handle}>{d.handle}</option>)}
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
                    d: dm.job, s: `mc_sim_${handle}`, h: handle, src: 'instagram_dm', dry: '1',
                  })
                  if (postSlug) params.set('p', postSlug)
                  await fetch(`/r/${slug}?${params}`, { cache: 'no-store' })
                  setSent(`${dm.handle} opened it`)
                  setTimeout(() => setSent(null), 6000)
                }}
              >
                Send it to them
              </button>
              {sent && <span className="text-xs" style={{ color: 'var(--seg-3)' }}>✓ {sent}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
