import type { Profile } from './types'
import type { QueueRow } from './triage'

/**
 * Answer once, reach everyone who asked.
 *
 * E-02 has her doing two DM sprints a day against 3.1K messages a month and the
 * queue still growing. The arithmetic she is losing to is that she answers the
 * same twelve questions individually, forever. A cohort is every person whose
 * link carried the same `?d=<job>` tag — so the same answer, sent once, lands
 * with all of them, and every one of those sends still reports back separately.
 *
 * Nothing here merges people. The reply is one-to-many; the measurement stays
 * one-to-one, which is what keeps the audience breakdown honest afterwards.
 */

/** E-01 prints twelve DMs. She receives roughly 3.1K a month (E-02, case file). */
export const MONTHLY_DM_VOLUME = 3100

export type Cohort = {
  job: string
  /** People in the seeded history who arrived on this job. */
  observed: number
  /** Share of her observed DM traffic. */
  share: number
  /** That share applied to the real monthly number, stated as an estimate. */
  monthlyEstimate: number
  sendable: boolean
  owner: QueueRow['owner']
  sample: string[]
}

export function cohorts(rows: QueueRow[], profiles: Profile[]): Cohort[] {
  const dmPeople = profiles.filter(p => p.dmJob)
  const seen = new Map<string, QueueRow>()
  for (const r of rows) if (r.job && !seen.has(r.job)) seen.set(r.job, r)

  return [...seen.entries()].map(([job, row]) => {
    const g = dmPeople.filter(p => p.dmJob === job)
    const share = dmPeople.length ? g.length / dmPeople.length : 0
    return {
      job,
      observed: g.length,
      share,
      monthlyEstimate: Math.round(share * MONTHLY_DM_VOLUME),
      sendable: row.owner !== 'SOFIA',
      owner: row.owner,
      sample: g.slice(0, 3).map(p => p.subscriberId ? `@${p.subscriberId}` : p.uid),
    }
  }).sort((a, b) => b.observed - a.observed)
}

/** The headline: how many individual replies one broadcast removes from her month. */
export function broadcastSaving(list: Cohort[]) {
  const sendable = list.filter(c => c.sendable)
  const repliesAvoided = sendable.reduce((a, c) => a + c.monthlyEstimate, 0)
  return {
    cohorts: sendable.length,
    repliesAvoided,
    ofMonthly: repliesAvoided / MONTHLY_DM_VOLUME,
    /** One send per cohort replaces every individual reply in it. */
    sendsRequired: sendable.length,
  }
}
