import fs from 'node:fs'
import path from 'node:path'
import type { Profile, SegmentKey } from './types'

/**
 * Instagram only permits a message to someone who contacted the account within the
 * last 24 hours. So a group send is not a blast — it is a queue. Everyone in the
 * group is walked one at a time and sorted: the open window goes now, everyone else
 * is armed and delivered automatically the next time they comment or DM.
 *
 * Nobody is dropped, nothing is sent unsolicited, and the account does not get
 * flagged for spam — which matters more than speed, because the account is the business.
 */
export const WINDOW_HOURS = 24

export type Recipient = {
  uid: string
  handle: string | null
  status: 'sending' | 'queued'
  hoursSinceContact: number
  link: string
  message: string
}

export type SendResult = {
  group: SegmentKey
  item: string
  total: number
  sending: number
  queued: number
  recipients: Recipient[]
  ranAt: string
}

export function buildRecipientLink(opts: {
  origin: string; item: string; group: SegmentKey; profile: Profile
}) {
  const { origin, item, group, profile } = opts
  const params = new URLSearchParams({ g: group, src: 'instagram_dm' })
  // Prefer the ManyChat subscriber id when we have one; fall back to our own id.
  params.set('s', profile.subscriberId ?? profile.uid)
  if (profile.handle) params.set('h', profile.handle)
  return `${origin}/r/${item}?${params}`
}

export function planSend(opts: {
  origin: string
  group: SegmentKey
  item: string
  message: string
  profiles: Profile[]
  now?: Date
}): SendResult {
  const { origin, group, item, message, profiles } = opts
  const now = opts.now ?? new Date()

  const members = profiles.filter(p => p.segment === group)
  const recipients: Recipient[] = members.map(p => {
    const hours = (now.getTime() - Date.parse(p.lastTs)) / 3_600_000
    const link = buildRecipientLink({ origin, item, group, profile: p })
    return {
      uid: p.uid,
      handle: p.handle,
      status: (hours <= WINDOW_HOURS ? 'sending' : 'queued') as Recipient['status'],
      hoursSinceContact: Math.max(0, Math.round(hours)),
      link,
      message: message.replaceAll('{link}', link),
    }
  }).sort((a, b) => a.hoursSinceContact - b.hoursSinceContact)

  return {
    group,
    item,
    total: recipients.length,
    sending: recipients.filter(r => r.status === 'sending').length,
    queued: recipients.filter(r => r.status === 'queued').length,
    recipients,
    ranAt: now.toISOString(),
  }
}

/** Append a record of the run, so the page can show what was armed and when. */
export function logSend(result: SendResult) {
  const file = path.join(process.cwd(), 'data', 'send-log.local.json')
  let all: Omit<SendResult, 'recipients'>[] = []
  try { all = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { /* first run */ }
  const { recipients, ...summary } = result
  all.push(summary)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(all.slice(-50), null, 1))
}
