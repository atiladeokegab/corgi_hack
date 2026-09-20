import { NextRequest, NextResponse } from 'next/server'
import { appendLiveEvent, getItems } from '@/lib/data'
import type { RefClass } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Her own cookie outlives the affiliate network's. That is the entire trick: the
// affiliate window is typically 24h, and the median purchase lands 3.4 days out.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const COOKIE = 'lb_uid'

function classifyReferrer(referrer: string, src: string | null): RefClass {
  if (src && ['instagram', 'instagram_dm', 'whatsapp', 'messages', 'direct', 'other'].includes(src)) {
    return src as RefClass
  }
  if (!referrer) return 'direct'          // iMessage and most native share sheets strip it
  let host = ''
  try { host = new URL(referrer).hostname } catch { return 'other' }
  if (host.includes('instagram')) return 'instagram'
  if (host.includes('whatsapp')) return 'whatsapp'
  if (host.includes('messenger') || host.includes('messages')) return 'messages'
  return 'other'
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const item = getItems().find(i => i.slug === slug)
  if (!item) return NextResponse.json({ error: `unknown item: ${slug}` }, { status: 404 })

  const url = new URL(req.url)
  const postRef = url.searchParams.get('p')
  const via = url.searchParams.get('v')
  const dry = url.searchParams.get('dry') === '1'

  const existing = req.cookies.get(COOKIE)?.value
  const uid = existing ?? `u_live_${Math.random().toString(36).slice(2, 8)}`
  const referrer = req.headers.get('referer') ?? ''

  const event = {
    id: `e_live_${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    uid,
    slug,
    postRef,
    via,
    refClass: classifyReferrer(referrer, url.searchParams.get('src')),
    referrer,
    device: req.headers.get('user-agent')?.slice(0, 60) ?? 'unknown',
    live: true,
  }
  appendLiveEvent(event)

  const destination = new URL(item.destination)
  destination.searchParams.set('subid', uid)  // handed to the brand / affiliate network

  // ?dry=1 records the hit and shows what happened instead of leaving the site.
  // Useful on stage, and when there is no network in the room.
  if (dry) {
    return NextResponse.json(
      { recorded: event, wouldRedirectTo: destination.toString(), returningVisitor: Boolean(existing) },
      { headers: { 'Set-Cookie': `${COOKIE}=${uid}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax` } },
    )
  }

  const res = NextResponse.redirect(destination, 302)
  res.cookies.set(COOKIE, uid, { maxAge: COOKIE_MAX_AGE, path: '/', sameSite: 'lax' })
  return res
}
