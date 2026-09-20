import type { Item } from './types'

export type ReplyContext = {
  item: Item
  link: string
  cheaper: Item | null
  cheaperLink: string | null
}

type Template = {
  /** Can this be answered without her having to think? */
  autoable: boolean
  /** Shown when it is not — why this one needs her. */
  needsHer?: string
  /** What the question is really asking, in three words. */
  asking: string
  build: (ctx: ReplyContext) => string | null
}

/**
 * The replies she can send without thinking, and the ones she cannot.
 *
 * The split is the whole point. Answering "where is it" is clerical work — the
 * answer is a link and nothing else. Answering "which one would you buy" is the
 * thing her audience is actually there for, and a template would be a forgery.
 *
 * The sendable ones are built out of her own notes: the size comes from her
 * wardrobe, the cheaper suggestion is the piece she already said was enough,
 * and the verdicts are quoted exactly as she wrote them.
 */
export const TEMPLATES: Record<string, Template> = {
  'EXACT ITEM REQUEST': {
    autoable: true,
    asking: 'Where is it',
    build: ({ link }) => `${link} — that's the one x`,
  },
  'FIT': {
    autoable: true,
    asking: 'What size',
    build: ({ item, link }) =>
      `I'm a ${item.size} in this one and took my usual size x\n${link}\nfor what it's worth — ${item.sofiaSays}.`,
  },
  'BUDGET': {
    autoable: true,
    asking: 'Something cheaper',
    // Falls through to her when there is no honest cheaper answer. Offering
    // £120 shoes to someone who asked for a blazer under £120 is worse than
    // saying nothing, and it is exactly the kind of thing that loses her their trust.
    needsHer: "Nothing cheaper of the same kind in here. Only 8 of your 36 pieces are loaded, so you may own one this cannot see.",
    build: ({ cheaper, cheaperLink }) =>
      cheaper && cheaperLink
        ? `honestly? ${cheaper.name.toLowerCase()} for a lot less — ${cheaperLink}\n${cheaper.sofiaSays} x`
        : null,
  },
  'SOCIAL SHARING': {
    autoable: true,
    asking: 'Passing it on',
    build: ({ link }) => `ahh send it to her! here's the link so she doesn't have to go digging — ${link} x`,
  },
  'TRUST': {
    autoable: true,
    asking: 'Saying thank you',
    build: () => `this is genuinely the nicest thing to read. thank you x`,
  },
  'SECOND-HAND DISCOVERY': {
    autoable: true,
    asking: 'Where is it',
    build: ({ link }) => `good shout from whoever sent you that. here it is — ${link} x`,
  },
  'CONSIDERATION': {
    autoable: true,
    asking: 'Still deciding',
    build: ({ item, link }) =>
      `you've come back to this one a few times x here it is again — ${link}\nfor what it's worth: ${item.sofiaSays}.`,
  },

  'DECISION': {
    autoable: false,
    asking: 'Choose for me',
    needsHer: "They want you to choose. That is what they came for.",
    build: () => null,
  },
  'ADAPTATION': {
    autoable: false,
    asking: 'Restyle it for me',
    needsHer: "They need it restyled for their life, not yours. No link answers this.",
    build: () => null,
  },
  'INTENT': {
    autoable: false,
    asking: 'Same feel, different occasion',
    needsHer: "Different occasion. Needs your eye, not a link.",
    build: () => null,
  },
  'POST-PURCHASE': {
    autoable: false,
    asking: 'What goes with it',
    needsHer: "They already bought it. They want styling, not a link.",
    build: () => null,
  },
  'CONSTRAINT': {
    autoable: false,
    asking: 'Use what I own',
    needsHer: "They do not want to buy anything. Nothing to link here.",
    build: () => null,
  },
}

/**
 * The best piece she owns that is the same kind of thing and costs less — her own
 * "£35 is enough" logic.
 *
 * Same category only, deliberately. A cross-category fallback produces answers like
 * recommending loafers to someone asking for a cheaper blazer, which is not a
 * cheaper blazer. When there is no honest answer this returns null and the message
 * goes to her instead.
 */
export function cheaperThan(item: Item, items: Item[]): Item | null {
  const under = items.filter(i =>
    i.slug !== item.slug && i.category === item.category && i.price < item.price)
  return under.sort((a, b) => b.price - a.price)[0] ?? null
}
