import type { Dm, Item } from './types'

/**
 * Which of E-01's twelve jobs is a message really asking for?
 *
 * E-01 did the hard part already: twelve real DMs, each labelled with the job
 * behind it. That is a specification, not a training set, so this matches text
 * against the twelve rather than inferring categories from scratch.
 *
 * Deliberately no model. E-08 says the build must not depend on expensive
 * inference to be impressive, and a creator answering 3.1K DMs a month should
 * not be paying per message to find out which of twelve questions she is
 * looking at. Every decision here is inspectable: each result carries the
 * phrases that produced it.
 */

export const JOBS = [
  'EXACT ITEM REQUEST', 'DECISION', 'ADAPTATION', 'BUDGET', 'SOCIAL SHARING', 'FIT',
  'INTENT', 'POST-PURCHASE', 'CONSTRAINT', 'TRUST', 'SECOND-HAND DISCOVERY', 'CONSIDERATION',
] as const

export type Job = (typeof JOBS)[number]

/** What each job is actually asking her for, in her terms. */
export const JOB_ASK: Record<Job, string> = {
  'EXACT ITEM REQUEST': 'Name the piece and hand over the link',
  'DECISION': 'Choose for me',
  'ADAPTATION': 'Make this work for my life, not yours',
  'BUDGET': 'Same eye, less money',
  'SOCIAL SHARING': 'I am passing this on',
  'FIT': 'Will it fit a body that is not yours',
  'INTENT': 'I have an occasion, not an item',
  'POST-PURCHASE': 'I already bought it, now what',
  'CONSTRAINT': 'Help me not buy anything',
  'TRUST': 'I am telling you I trust you',
  'SECOND-HAND DISCOVERY': 'Someone sent me here, who are you',
  'CONSIDERATION': 'I keep coming back and cannot decide',
}

const RULES: Record<Job, RegExp[]> = {
  'EXACT ITEM REQUEST': [
    /\bwhere (is|are|can i (get|find|buy))\b/i, /\bdrop the link\b/i, /\blink (please|pls|plz)\b/i,
    /\bbegging you\b/i, /\bwhat (is|are) (this|these|the)\b/i, /\bname of (the|this)\b/i,
  ],
  'DECISION': [
    /\bif you were me\b/i, /\bwhich one would you\b/i, /\bwhat would you (buy|pick|choose|get)\b/i,
    /\bworth it\b/i, /\bshould i (buy|get)\b/i, /\bwhich (one|of these) should\b/i,
  ],
  'ADAPTATION': [
    /\bhow would you (change|style|adapt|wear)\b/i, /\bbut i live in\b/i,
    /\bdress (it )?(up|down)\b/i, /\bmake it (more|less)\b/i, /\bversion i could actually wear\b/i,
  ],
  'BUDGET': [
    /£\s?\d/i, /\bunder \d/i, /\bcheaper\b/i, /\bdupe\b/i, /\baffordable\b/i,
    /\bbudget\b/i, /\bnot paying\b/i, /\bcan'?t afford\b/i,
  ],
  'SOCIAL SHARING': [
    /\bsending this to\b/i, /\bsent this to\b/i, /\bshowing (this )?to my\b/i,
    /\bshare this with\b/i, /\btagging (my|her|him)\b/i, /\bshe needs this\b/i,
  ],
  'FIT': [
    /\bwhat size\b/i, /\bsizing\b/i, /\bdoes it run\b/i, /\btrue to size\b/i,
    /\bi'?m usually a[n]? \d/i, /\b(petite|tall|curvy)\b/i, /\bwhat size are you\b/i,
  ],
  'INTENT': [
    /\bfor a (wedding|holiday|interview|party|funeral|christening|date)\b/i,
    /\bsame energy\b/i, /\bversion of this for\b/i, /\bfor an? occasion\b/i, /\bsomething like this for\b/i,
  ],
  'POST-PURCHASE': [
    /\bi (bought|got|ordered|received)\b/i, /\bit arrived\b/i,
    /\bwhat should i wear with\b/i, /\bnow i have\b/i, /\bhow do i style (my|mine|it)\b/i,
  ],
  'CONSTRAINT': [
    /\btrying not to buy\b/i, /\buse what i (own|have|already)\b/i, /\bno.?buy\b/i,
    /\balready own\b/i, /\bshop my (own )?wardrobe\b/i, /\bdon'?t need more\b/i,
  ],
  'TRUST': [
    /\bfirst creator\b/i, /\bi actually save\b/i, /\bi trust (you|your)\b/i,
    /\bonly (person|account) i\b/i, /\byour (taste|eye)\b/i, /\bi save everything\b/i,
  ],
  'SECOND-HAND DISCOVERY': [
    /\b(my|his|her|their) (bf|boyfriend|gf|girlfriend|sister|brother|friend|mum|mate|partner|colleague)\b[^.?!]*\bsent\b/i,
    /\bsomeone sent me\b/i, /\bfound you (through|via)\b/i, /\bwas sent your\b/i, /\bnew here\b/i,
  ],
  'CONSIDERATION': [
    /\bopened (this|it) \w+ times\b/i, /\bstill deciding\b/i, /\bthinking about it\b/i,
    /\bcan'?t decide\b/i, /\bkeep coming back\b/i, /\bbeen looking at\b/i,
  ],
}

export type JobMatch = {
  job: Job | null
  confidence: number
  matched: string[]
  runnerUp: Job | null
}

/**
 * Confidence is a stated heuristic, not a probability: one matched phrase is a
 * weak call, several is a strong one, and a close runner-up pulls it back down.
 * It is surfaced so a wrong call is visible rather than silent.
 */
export function classifyMessage(text: string): JobMatch {
  const scored = JOBS.map(job => {
    const matched = RULES[job].filter(re => re.test(text)).map(re => re.source)
    return { job, matched, score: matched.length }
  }).sort((a, b) => b.score - a.score)

  const [top, second] = scored
  if (!top.score) return { job: null, confidence: 0, matched: [], runnerUp: null }

  let confidence = Math.min(0.95, 0.6 + 0.15 * (top.score - 1))
  if (second.score >= top.score) confidence -= 0.2
  else if (second.score > 0) confidence -= 0.1

  return {
    job: top.job,
    confidence: Math.max(0.3, Number(confidence.toFixed(2))),
    matched: top.matched,
    runnerUp: second.score > 0 ? second.job : null,
  }
}

/** Words that point at a wardrobe piece but are not its name. */
const SYNONYMS: Record<string, string> = {
  blazer: 'black-blazer', jacket: 'vintage-leather', coat: 'vintage-leather',
  leather: 'vintage-leather', skirt: 'silk-skirt', silk: 'silk-skirt',
  tee: 'white-tee', 't-shirt': 'white-tee', tshirt: 'white-tee',
  loafer: 'loafers', loafers: 'loafers', shoes: 'loafers',
  slingback: 'red-slingback', heels: 'red-slingback', heel: 'red-slingback',
  knit: 'grey-knit', jumper: 'grey-knit', sweater: 'grey-knit',
  denim: 'wide-leg-denim', jeans: 'wide-leg-denim',
}

export type ItemMatch = { slug: string; named: boolean; why: string }

/**
 * Which piece is a message about? Named beats inferred, and the distinction is
 * carried through so the UI can say "she mentioned the blazer" rather than
 * implying we know something we guessed.
 */
export function matchItem(text: string, items: Item[], fallback?: string): ItemMatch | null {
  const lower = text.toLowerCase()

  for (const item of items) {
    const words = item.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const hit = words.find(w => lower.includes(w))
    if (hit) return { slug: item.slug, named: true, why: `she said “${hit}”` }
  }

  for (const [word, slug] of Object.entries(SYNONYMS)) {
    if (!new RegExp(`\\b${word}\\b`).test(lower)) continue
    if (!items.some(i => i.slug === slug)) continue
    return { slug, named: true, why: `she said “${word}”` }
  }

  if (!fallback) return null
  const item = items.find(i => i.slug === fallback)
  return item ? { slug: item.slug, named: false, why: 'no piece named — using her most-opened' } : null
}

/** Re-label the printed evidence with the same rules, to show where they disagree. */
export function auditAgainstEvidence(dms: Dm[]) {
  return dms.map(dm => {
    const m = classifyMessage(dm.message)
    return { ref: dm.ref, message: dm.message, labelled: dm.job, predicted: m.job, agrees: m.job === dm.job, confidence: m.confidence }
  })
}
