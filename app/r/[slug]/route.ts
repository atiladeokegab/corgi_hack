import { NextRequest, NextResponse } from 'next/server'
import { appendLiveEvent, getItems } from '@/lib/data'
import type { RefClass, Source } from '@/lib/types'

export const dynamic = 'force-dynamic'

const COOKIE = 'lb_uid'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function classifyReferrer(referrer: string, src: string | null): RefClass {
  const allowed = ['instagram', 'instagram_dm', 'whatsapp', 'messages', 'direct', 'other']
  if (src && allowed.includes(src)) return src as RefClass
  if (!referrer) return 'direct'          // iMessage and most native share sheets strip it
  let host = ''
  try { host = new URL(referrer).hostname } catch { return 'other' }
  if (host.includes('instagram')) return 'instagram'
  if (host.includes('whatsapp')) return 'whatsapp'
  if (host.includes('messenger') || host.includes('messages')) return 'messages'
  return 'other'
}

/**
 * The whole instrumentation surface. A link Sofia already pastes, pointed at here
 * first. It sets a cookie, notes where the click came from, records the open and
 * bounces on. The audience does nothing different and sees nothing new.
 *
 *   ?p=E-03.4   the post whose caption carried this link
 *   ?d=BUDGET   the DM job this reply was answering (E-01's labels)
 *   ?v=<uid>    whoever passed the link on
 *   ?s=<id>     ManyChat subscriber id, filled in by the flow
 *   ?h=<handle> Instagram handle, if the flow passes it through
 *   ?src=       force the arrival channel, for demonstrating a share
 *   ?dry=1      record the open and show the row instead of leaving the site
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const item = getItems().find(i => i.slug === slug)
  if (!item) return NextResponse.json({ error: `unknown item: ${slug}` }, { status: 404 })

  const url = new URL(req.url)
  const postRef = url.searchParams.get('p')
  const dmJob = url.searchParams.get('d')
  const via = url.searchParams.get('v')
  // ManyChat resolves {{subscriber_id}} inside the URL before it sends the message,
  // so an identified click costs nothing more than a longer link.
  const subscriberId = url.searchParams.get('s')
  const handle = url.searchParams.get('h')?.replace(/^@/, '') ?? null
  const dry = url.searchParams.get('dry') === '1'

  const existing = req.cookies.get(COOKIE)?.value
  // When ManyChat tells us who this is, identity keys on the subscriber rather than
  // the cookie — which is what makes the same person merge across their phone and
  // their laptop instead of counting as two strangers.
  const uid = subscriberId ? `u_mc_${subscriberId}` : (existing ?? `u_live_${Math.random().toString(36).slice(2, 8)}`)
  const referrer = req.headers.get('referer') ?? ''
  const refClass = classifyReferrer(referrer, url.searchParams.get('src'))
  const source: Source = via || refClass === 'whatsapp' || refClass === 'messages'
    ? 'share'
    : dmJob ? 'dm' : 'post'

  const event = {
    id: `e_live_${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    uid,
    slug,
    postRef,
    source,
    dmJob,
    via,
    subscriberId,
    handle,
    refClass,
    referrer,
    device: req.headers.get('user-agent')?.slice(0, 60) ?? 'unknown',
    live: true,
  }
  appendLiveEvent(event)

  if (dry) {
    return NextResponse.json(
      { recorded: event, wouldRedirectTo: item.destination, returningVisitor: Boolean(existing) },
      { headers: { 'Set-Cookie': `${COOKIE}=${uid}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax` } },
    )
  }

  const res = NextResponse.redirect(item.destination, 302)
  res.cookies.set(COOKIE, uid, { maxAge: COOKIE_MAX_AGE, path: '/', sameSite: 'lax' })
  return res
}
