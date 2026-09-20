import type { Dm, Item, Profile } from './types'
import { SEGMENTS } from './classify'
import { classifyMessage, matchItem, type Job, type ItemMatch } from './jobs'

/**
 * Which DMs are worth answering first, and which do not need Sofia at all.
 *
 * The queue she has today is chronological, so the loudest question wins. The
 * evidence says the loudest question is the least valuable one: EXACT ITEM
 * REQUEST is her highest-volume DM and 76% of the people it brings are Quick
 * Asks who open the link once and never return, while her two quietest jobs
 * bring Connectors who pass her taste on to someone else.
 *
 * So the order here is computed from measured behaviour, not from volume.
 */

export type Owner = 'SOFIA' | 'VA' | 'AGENT'

export const OWNERS: Record<Owner, { label: string; blurb: string }> = {
  SOFIA: { label: 'Sofia', blurb: 'Needs her eye. Nobody else can answer it.' },
  VA: { label: 'The VA', blurb: 'Lookup and paste. No judgement in it.' },
  AGENT: { label: 'Auto-reply', blurb: 'Her words, sent for her, with a link that reports back.' },
}

/**
 * The delegation matrix. This is an editorial call, made against E-01 and E-05
 * and written down so it can be argued with rather than buried in a condition.
 *
 * The test applied to each job: could this be answered correctly by someone who
 * does not have Sofia's taste? If yes it leaves her desk. If it needs her eye,
 * her body, or her relationship with the person, it stays.
 */
export const DELEGATION: Record<Job, { owner: Owner; why: string }> = {
  'EXACT ITEM REQUEST': { owner: 'VA', why: 'Pure lookup — the piece is already in her wardrobe list' },
  'SOCIAL SHARING': { owner: 'AGENT', why: 'Nothing is being asked. Acknowledge and make the link easy to pass on' },
  'SECOND-HAND DISCOVERY': { owner: 'AGENT', why: 'A stranger arriving. Orient them, do not spend her on it' },
  'CONSIDERATION': { owner: 'AGENT', why: 'They have already seen the piece. Send her verdict and stop' },
  'DECISION': { owner: 'SOFIA', why: 'They are asking to borrow her judgement. That is the whole asset' },
  'ADAPTATION': { owner: 'SOFIA', why: 'Restyling for a life that is not hers needs her eye' },
  'BUDGET': { owner: 'SOFIA', why: 'A cheaper alternative she would actually stand behind is a taste call' },
  'FIT': { owner: 'SOFIA', why: 'Every verdict in E-04 is anchored to her own body. Nobody else holds that' },
  'INTENT': { owner: 'SOFIA', why: 'An occasion, not an item. She has to translate it' },
  'POST-PURCHASE': { owner: 'SOFIA', why: 'Styling something they already own is the work she is best at' },
  'CONSTRAINT': { owner: 'SOFIA', why: 'Helping someone not buy is the trust play. It has to be her' },
  'TRUST': { owner: 'SOFIA', why: 'Someone telling her they trust her should hear back from her' },
}

export type JobValue = {
  job: string
  people: number
  onwardReach: number
  returnRate: number
  connectorShare: number
  quickShare: number
  score: number
  topSegment: string | null
}

/**
 * Value per reply, from behaviour the redirect actually observed.
 *
 * Two measured components, and one stated modelling choice in how they combine:
 *
 *   onwardReach  people this cohort demonstrably passed the link on to, per person
 *   returnRate   share of the cohort who came back on a second day
 *
 *   score = (1 + onwardReach) x (1 + returnRate)
 *
 * The multiplication is the assumption: that a reply which travels AND is
 * reconsidered is worth more than one that does either alone. It is named here
 * rather than hidden so it can be challenged. Both inputs are counted, not
 * weighted by hand, so the ordering moves when her audience moves.
 */
export function jobValues(profiles: Profile[]): JobValue[] {
  const dmPeople = profiles.filter(p => p.dmJob)
  const jobs = [...new Set(dmPeople.map(p => p.dmJob!))]

  return jobs.map(job => {
    const g = dmPeople.filter(p => p.dmJob === job)
    const onwardReach = g.reduce((a, p) => a + p.sharedToCount, 0) / g.length
    const returnRate = g.filter(p => p.returnDays >= 2).length / g.length
    const counts = new Map<string, number>()
    for (const p of g) counts.set(p.segment, (counts.get(p.segment) ?? 0) + 1)
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null

    return {
      job,
      people: g.length,
      onwardReach: Number(onwardReach.toFixed(2)),
      returnRate: Number(returnRate.toFixed(2)),
      connectorShare: (counts.get('CONNECTOR') ?? 0) / g.length,
      quickShare: (counts.get('QUICK') ?? 0) / g.length,
      score: Number(((1 + onwardReach) * (1 + returnRate)).toFixed(3)),
      topSegment: top ? SEGMENTS[top[0] as keyof typeof SEGMENTS].label : null,
    }
  }).sort((a, b) => b.score - a.score)
}

export type QueueRow = {
  ref: string
  handle: string
  message: string
  job: Job | null
  labelledJob: string
  confidence: number
  agrees: boolean
  owner: Owner
  why: string
  item: ItemMatch | null
  value: JobValue | null
  rank: number
  volumeRank: number
  moved: number
}

/**
 * The twelve DMs, re-ordered. `moved` is the point of the whole screen: how far
 * up or down a message travels once it is ranked by who it brings rather than
 * by how many people send it.
 */
export function triageQueue(dms: Dm[], profiles: Profile[], items: Item[]): QueueRow[] {
  const values = jobValues(profiles)
  const byJob = new Map(values.map(v => [v.job, v]))
  const valueRank = new Map(values.map((v, i) => [v.job, i + 1]))
  const volumeRank = new Map(
    [...values].sort((a, b) => b.people - a.people).map((v, i) => [v.job, i + 1]),
  )

  const topSlug = [...items].sort((a, b) =>
    profiles.filter(p => p.topSlug === b.slug).length - profiles.filter(p => p.topSlug === a.slug).length,
  )[0]?.slug

  return dms.map(dm => {
    const m = classifyMessage(dm.message)
    const job = (m.job ?? dm.job) as Job
    const delegation = DELEGATION[job] ?? { owner: 'SOFIA' as Owner, why: 'Unrecognised question — she should look at it' }
    const vRank = valueRank.get(job) ?? 99
    const volRank = volumeRank.get(job) ?? 99

    return {
      ref: dm.ref,
      handle: dm.handle,
      message: dm.message,
      job: m.job,
      labelledJob: dm.job,
      confidence: m.confidence,
      agrees: m.job === dm.job,
      owner: delegation.owner,
      why: delegation.why,
      item: matchItem(dm.message, items, job === 'BUDGET' ? items.find(i => i.tier === 'entry')?.slug ?? topSlug : topSlug),
      value: byJob.get(job) ?? null,
      rank: vRank,
      volumeRank: volRank,
      moved: volRank - vRank,
    }
  }).sort((a, b) => a.rank - b.rank || a.ref.localeCompare(b.ref))
}

/** How much of her DM load stops reaching her desk at all. */
export function delegationLoad(rows: QueueRow[]) {
  const total = rows.length
  const by = (o: Owner) => rows.filter(r => r.owner === o).length
  return {
    total,
    sofia: by('SOFIA'),
    va: by('VA'),
    agent: by('AGENT'),
    offHerDesk: by('VA') + by('AGENT'),
    offHerDeskShare: total ? (by('VA') + by('AGENT')) / total : 0,
  }
}
