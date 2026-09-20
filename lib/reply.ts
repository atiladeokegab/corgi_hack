import type { Item } from './types'
import { buildLink } from './link'
import { DELEGATION, type Owner } from './triage'
import type { Job } from './jobs'

/**
 * A reply already written, in her words.
 *
 * The rule this file exists to hold: nothing here generates an opinion. Every
 * draft that carries a verdict quotes `sofiaSays` from E-04 verbatim, in
 * quotation marks, unchanged. E-04 names a numeric "Sofia rating" that does not
 * exist in the printed evidence, and PRODUCT.md commits to never inventing one,
 * so no draft scores, ranks or paraphrases her taste.
 *
 * Where a question genuinely needs her eye, the draft says so and stops. A
 * half-written line in her voice that she did not write is worse than a blank
 * box, because she would have to read it before trusting it.
 */

type Template = (item: Item | null, link: string) => string

const piece = (item: Item | null) => item ? item.name.toLowerCase() : 'that piece'
const verdict = (item: Item | null) => item ? `“${item.sofiaSays}”` : ''

const TEMPLATES: Record<Job, Template> = {
  'EXACT ITEM REQUEST': (i, l) =>
    `It's the ${piece(i)} — ${verdict(i)}. Here you go: ${l}`,

  'SOCIAL SHARING': (i, l) =>
    `Please do! Here's the link so she lands on the right one: ${l}`,

  'SECOND-HAND DISCOVERY': (i, l) =>
    `Welcome in — good taste on their part. That's the ${piece(i)}: ${verdict(i)}. ${l}`,

  'CONSIDERATION': (i, l) =>
    `Still on your mind? My take hasn't changed: ${verdict(i)}. Whenever you're ready — ${l}`,

  'DECISION': (i, l) =>
    `[needs your line] They want you to choose. Your note on the ${piece(i)} is ${verdict(i)}. ${l}`,

  'ADAPTATION': (i, l) =>
    `[needs your line] They want it restyled for their life, not yours. The ${piece(i)} is ${verdict(i)}. ${l}`,

  'BUDGET': (i, l) =>
    `[needs your line] They want the same eye for less. Cheapest piece you have stood behind is the ${piece(i)}: ${verdict(i)}. ${l}`,

  'FIT': (i, l) =>
    `[needs your line] Sizing — every verdict in your wardrobe notes is anchored to your own body, so this one is yours to answer. ${l}`,

  'INTENT': (i, l) =>
    `[needs your line] An occasion, not an item. Closest thing in your notes is the ${piece(i)}: ${verdict(i)}. ${l}`,

  'POST-PURCHASE': (i, l) =>
    `[needs your line] They already bought. This is the styling answer only you can give. ${l}`,

  'CONSTRAINT': () =>
    `[needs your line] They are asking you to help them NOT buy. Worth answering properly — it is the trust play.`,

  'TRUST': () =>
    `[needs your line] Someone just told you they trust you more than anyone else they follow. Two sentences from you is worth more than any link.`,
}

export type Draft = {
  text: string
  link: string
  owner: Owner
  /** True when the draft is complete and could be sent without her. */
  sendable: boolean
  /** The exact verdict quoted, so the UI can show what was and was not invented. */
  quoted: string | null
  note: string
}

export function draftReply(
  job: Job,
  item: Item | null,
  opts: { origin?: string; postRef?: string | null } = {},
): Draft {
  const link = buildLink({ slug: item?.slug ?? 'black-blazer', job, postRef: opts.postRef ?? null, origin: opts.origin ?? '' })
  const template = TEMPLATES[job]
  const owner = DELEGATION[job]?.owner ?? 'SOFIA'
  const text = template ? template(item, link) : `[needs your line] ${link}`
  const sendable = owner !== 'SOFIA'
  // Only claim a quote when the draft genuinely carries one — some templates
  // (SOCIAL SHARING) deliberately say nothing about the piece at all.
  const quoted = item && text.includes(`“${item.sofiaSays}”`) ? item.sofiaSays : null

  return {
    text,
    link,
    owner,
    sendable,
    quoted,
    note: !sendable
      ? 'Deliberately unfinished. This one needs her eye — the draft carries the context, not an opinion.'
      : quoted
        ? 'Complete. Her verdict, quoted exactly, with a link that reports back who opened it.'
        : 'Complete. Says nothing about the piece on her behalf — just the link, which reports back who opened it.',
  }
}
