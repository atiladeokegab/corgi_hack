import fs from 'node:fs'
import path from 'node:path'
import type { Item } from './types'

export type ReplyContext = {
  item: Item
  link: string
  cheaper: Item | null
  cheaperLink: string | null
}

/**
 * What a template may refer to, and the rule that fills each one in.
 *
 * These are the rules, not suggestions — every reply is built by substitution
 * and nothing else, so what you see in the box is exactly what goes out.
 */
export const PLACEHOLDERS = [
  { token: '{link}', rule: 'Affiliate link to the piece they asked about' },
  { token: '{piece}', rule: 'Name of that piece' },
  { token: '{size}', rule: 'Your size in it, from your wardrobe' },
  { token: '{verdict}', rule: 'What you wrote about it, word for word' },
  { token: '{cheaper}', rule: 'A cheaper piece of the same kind' },
  { token: '{cheaper_link}', rule: 'Affiliate link to that cheaper piece' },
] as const

export const TEMPLATE_FILE = path.join(process.cwd(), 'data', 'templates.json')

/**
 * The replies that can go out without you thinking, and the ones that cannot.
 *
 * The split is the point. "Where is it" is clerical — the answer is a link.
 * "Which one would you buy" is what your audience is there for, and a template
 * would be a forgery. Those get no draft at all.
 */
export const DEFAULT_TEMPLATES: Record<string, string> = {
  'EXACT ITEM REQUEST': `{link} — that's the one x`,
  'FIT': `I'm a {size} in this one and took my usual size x\n{link}\nfor what it's worth — {verdict}.`,
  'BUDGET': `honestly? {cheaper} for a lot less — {cheaper_link}\n{verdict} x`,
  'SOCIAL SHARING': `ahh send it to her! here's the link so she doesn't have to go digging — {link} x`,
  'TRUST': `this is genuinely the nicest thing to read. thank you x`,
  'SECOND-HAND DISCOVERY': `good shout from whoever sent you that. here it is — {link} x`,
  'CONSIDERATION': `you've come back to this one a few times x here it is again — {link}\nfor what it's worth: {verdict}.`,
}

/**
 * Questions that ship WITHOUT a draft. This is a default, not a rule — every one
 * of these has an empty template you can write, and the moment you do, those
 * messages move over to the sendable pile. We only pre-write the ones where a
 * template cannot get it wrong.
 */
export const NEEDS_YOU: Record<string, string> = {
  'DECISION': 'They want you to choose. That is what they came for.',
  'ADAPTATION': 'They need it restyled for their life, not yours.',
  'INTENT': 'Different occasion. Needs your eye, not a link.',
  'POST-PURCHASE': 'They already bought it. They want styling, not a link.',
  'CONSTRAINT': 'They do not want to buy anything. Nothing to link here.',
}

/** Every question type, whether or not it ships with a draft. */
export const ALL_JOBS = [
  'EXACT ITEM REQUEST', 'FIT', 'BUDGET', 'SOCIAL SHARING', 'TRUST',
  'SECOND-HAND DISCOVERY', 'CONSIDERATION',
  'DECISION', 'ADAPTATION', 'INTENT', 'POST-PURCHASE', 'CONSTRAINT',
] as const

export const ASKING: Record<string, string> = {
  'EXACT ITEM REQUEST': 'Where is it',
  'FIT': 'What size',
  'BUDGET': 'Something cheaper',
  'SOCIAL SHARING': 'Passing it on',
  'TRUST': 'Saying thank you',
  'SECOND-HAND DISCOVERY': 'Where is it',
  'CONSIDERATION': 'Still deciding',
  'DECISION': 'Choose for me',
  'ADAPTATION': 'Restyle it for me',
  'INTENT': 'Same feel, different occasion',
  'POST-PURCHASE': 'What goes with it',
  'CONSTRAINT': 'Use what I own',
}

export function getTemplates(): Record<string, string> {
  const blank = Object.fromEntries(ALL_JOBS.map(j => [j, '']))
  try {
    return { ...blank, ...DEFAULT_TEMPLATES, ...JSON.parse(fs.readFileSync(TEMPLATE_FILE, 'utf8')) }
  } catch {
    return { ...blank, ...DEFAULT_TEMPLATES }
  }
}

export function saveTemplates(next: Record<string, string>) {
  const merged = { ...getTemplates(), ...next }
  fs.mkdirSync(path.dirname(TEMPLATE_FILE), { recursive: true })
  fs.writeFileSync(TEMPLATE_FILE, JSON.stringify(merged, null, 1))
  return merged
}

/**
 * Fills a template in. Pure substitution — no cleverness.
 *
 * If the template asks for something that does not exist for this piece (a
 * cheaper version when there is no cheaper version), it returns null and the
 * message goes to you instead. Better no answer than a wrong one: offering
 * £120 shoes to someone who asked for a blazer under £120 costs you their trust.
 */
export function renderTemplate(text: string, ctx: ReplyContext): string | null {
  if (!text.trim()) return null
  const values: Record<string, string | null> = {
    '{link}': ctx.link,
    '{piece}': ctx.item.name.toLowerCase(),
    '{size}': ctx.item.size,
    '{verdict}': ctx.item.sofiaSays,
    '{cheaper}': ctx.cheaper ? ctx.cheaper.name.toLowerCase() : null,
    '{cheaper_link}': ctx.cheaperLink,
  }
  let out = text
  for (const [token, value] of Object.entries(values)) {
    if (!out.includes(token)) continue
    if (value == null) return null
    out = out.replaceAll(token, value)
  }
  return out
}

/**
 * The cheaper piece rule: same kind of thing, costs less, closest in price.
 * Same category only — a cross-category fallback recommends loafers to someone
 * asking for a cheaper blazer, which is not a cheaper blazer.
 */
export function cheaperThan(item: Item, items: Item[]): Item | null {
  const under = items.filter(i =>
    i.slug !== item.slug && i.category === item.category && i.price < item.price)
  return under.sort((a, b) => b.price - a.price)[0] ?? null
}
