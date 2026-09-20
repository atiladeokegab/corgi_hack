/**
 * One place that knows how a tracked link is shaped.
 *
 * The redirect at app/r/[slug]/route.ts reads these parameters; the link builder
 * and the triage queue both write them. Keeping the assembly here means a change
 * to the link format cannot drift between the thing that writes links and the
 * thing that reads them.
 *
 * Isomorphic on purpose — no node:fs, so a client component can import it.
 */

/** ManyChat swaps this for the real subscriber id before the message is sent. */
export const MERGE_FIELD = '{{subscriber_id}}'
export const SAMPLE_SUBSCRIBER = 'mc_demo_8841'

export type LinkSpec = {
  slug: string
  postRef?: string | null
  job?: string | null
  via?: string | null
  manychat?: boolean
  origin?: string
}

export function buildLink({ slug, postRef, job, via, manychat = true, origin = '' }: LinkSpec): string {
  const parts: string[] = []
  if (postRef) parts.push(`p=${postRef}`)
  if (job) parts.push(`d=${encodeURIComponent(job)}`)
  if (via) parts.push(`v=${encodeURIComponent(via)}`)
  // Never URL-encode the merge field — ManyChat has to recognise it to swap it out.
  if (manychat) parts.push(`s=${MERGE_FIELD}`)
  return `${origin}/r/${slug}${parts.length ? '?' + parts.join('&') : ''}`
}

/** The same link, safe to click on stage: a real subscriber id and ?dry=1. */
export function testLink(url: string): string {
  const resolved = url.replace(MERGE_FIELD, SAMPLE_SUBSCRIBER)
  return resolved + (resolved.includes('?') ? '&' : '?') + 'dry=1'
}
