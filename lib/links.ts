import type { SegmentKey } from './types'

/**
 * A link addressed to one person. It carries who they are and which group they
 * were in when it was sent, so afterwards you can tell whether the approach
 * worked on that kind of person.
 */
export function buildPersonalLink(opts: {
  origin: string
  item: string
  group: SegmentKey
  subscriberId: string
  handle: string | null
}) {
  const { origin, item, group, subscriberId, handle } = opts
  const params = new URLSearchParams({ g: group, src: 'instagram_dm', s: subscriberId })
  if (handle) params.set('h', handle)
  return `${origin}/r/${item}?${params}`
}
