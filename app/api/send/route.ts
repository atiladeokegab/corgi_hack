import { NextRequest, NextResponse } from 'next/server'
import { getEvents } from '@/lib/data'
import { buildProfiles } from '@/lib/classify'
import { getMessages } from '@/lib/messages'
import { logSend, planSend } from '@/lib/send'
import type { SegmentKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const group = body.group as SegmentKey
  const item = (body.item as string) ?? 'black-blazer'
  if (!group) return NextResponse.json({ error: 'group is required' }, { status: 400 })

  const message = (body.message as string) ?? getMessages()[group]
  const origin = new URL(req.url).origin
  const profiles = buildProfiles(getEvents())

  const result = planSend({ origin, group, item, message, profiles })
  if (!body.preview) logSend(result)

  // The full recipient list can run to thousands; send back a workable sample.
  return NextResponse.json({ ...result, recipients: result.recipients.slice(0, 40) })
}
