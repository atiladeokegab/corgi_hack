import fs from 'node:fs'
import path from 'node:path'
import type { Profile, SegmentKey } from './types'

/**
 * Preparing a group send: every member of the group gets their own tagged link,
 * with the message their behaviour earned them.
 *
 * DELIVERY IS DELIBERATELY LIMITED TO ONE ACCOUNT. Instagram does not carry an
 * unsolicited group DM — it only permits a message to someone who made contact in
 * the last 24 hours — and there is no ManyChat connection wired up here anyway.
 * So the group is built for real and one nominated account is actually delivered
 * to. The page says which account that is.
 */
export type Recipient = {
  uid: string
  handle: string | null
  link: string
  message: string
}

export type SendResult = {
  group: SegmentKey
  item: string
  total: number
  recipients: Recipient[]   // a sample of the prepared group
  delivery: Recipient | null // the one that actually goes out
  ranAt: string
}

export function buildRecipientLink(opts: {
  origin: string; item: string; group: SegmentKey
  subscriberId: string; handle: string | null
}) {
  const { origin, item, group, subscriberId, handle } = opts
  const params = new URLSearchParams({ g: group, src: 'instagram_dm', s: subscriberId })
  if (handle) params.set('h', handle)
  return `${origin}/r/${item}?${params}`
}

const render = (message: string, link: string) => message.replaceAll('{link}', link)

export function planSend(opts: {
  origin: string
  group: SegmentKey
  item: string
  message: string
  profiles: Profile[]
  deliverTo?: string | null
  now?: Date
}): SendResult {
  const { origin, group, item, message, profiles, deliverTo } = opts
  const now = opts.now ?? new Date()

  const members = profiles.filter(p => p.segment === group)
  const recipients: Recipient[] = members.map(p => {
    const link = buildRecipientLink({
      origin, item, group,
      subscriberId: p.subscriberId ?? p.uid,
      handle: p.handle,
    })
    return { uid: p.uid, handle: p.handle, link, message: render(message, link) }
  })

  // The single real delivery, addressed to whoever is running the demo.
  const handle = deliverTo?.replace(/^@/, '').trim() || null
  const delivery = handle
    ? (() => {
        const link = buildRecipientLink({
          origin, item, group, subscriberId: `mc_demo_${handle}`, handle,
        })
        return { uid: `u_mc_mc_demo_${handle}`, handle, link, message: render(message, link) }
      })()
    : null

  return { group, item, total: recipients.length, recipients, delivery, ranAt: now.toISOString() }
}

/** Append a record of the run, so there is a trail of what was prepared and when. */
export function logSend(result: SendResult) {
  const file = path.join(process.cwd(), 'data', 'send-log.local.json')
  let all: unknown[] = []
  try { all = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { /* first run */ }
  const { recipients, delivery, ...summary } = result
  all.push({ ...summary, deliveredTo: delivery?.handle ?? null })
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(all.slice(-50), null, 1))
}
