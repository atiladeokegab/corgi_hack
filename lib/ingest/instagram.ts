import fs from 'node:fs/promises'
import path from 'node:path'
import { parseCsv } from '@/lib/csv.mjs'
import type { SourceAdapter, UnifiedMessage } from './types'

type EvidenceRow = { ref: string; handle: string; job: string; message: string }

/**
 * ManyChat can POST its subscriber id, Instagram handle, message id/text and
 * created_at value to /api/ingest. Until that flow is configured, this adapter
 * reads the twelve hand-labelled E-01 messages without pretending they are live.
 */
export const instagramAdapter: SourceAdapter = {
  platform: 'instagram',
  isLive: Boolean(process.env.MANYCHAT_TOKEN),
  describe() {
    return this.isLive
      ? 'ManyChat webhook configured; E-01 remains the local evidence baseline.'
      : 'E-01 evidence baseline. Add MANYCHAT_TOKEN and point a ManyChat webhook at /api/ingest.'
  },
  async fetch(): Promise<UnifiedMessage[]> {
    const csv = await fs.readFile(path.join(process.cwd(), 'evidence', 'inbox.csv'), 'utf8')
    const rows = parseCsv(csv) as EvidenceRow[]

    return rows.map((row, index) => ({
      id: `instagram:${row.ref}`,
      platform: 'instagram',
      externalId: row.ref,
      handle: row.handle,
      receivedAt: new Date(Date.UTC(2026, 8, 20, 8, index)).toISOString(),
      text: row.message,
      subscriberId: null,
      raw: { evidenceRef: row.ref, job: row.job, source: 'evidence/inbox.csv' },
    }))
  },
}
