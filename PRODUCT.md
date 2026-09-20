# Edna — decision record

Kept separate from `README.md` because that file is edited live. `DEMO.md` has the
run of show; this is what was decided and why.

## The gate (E-08)

> If you cannot name the person and the decision, you do not have a product yet.

**Person:** Sofia. Taken with the judges, on the grounds that her audience should
absorb no new friction. Nobody signs up, fills anything in, or visits a page.

**Decision:** *Which messages do I answer myself, and what do I make next?*

## The design rule

**Edna is deliberately stupid, and must stay that way.**

It substitutes text into templates. It sorts people with six ordered rules. It does
arithmetic and shows its working. That is the entire system.

Every time it looks like cleverness would help, it would not:

- A template could always fall back to `{link}`, and then it answers *"I'm trying
  not to buy more stuff"* with a link to a £145 blazer.
- The cheaper-alternative rule could look outside the category, and then it offers
  £120 loafers to someone who asked for a blazer under £120.
- The money page could name which people bought, and it cannot know that.

In each case the stupid version refuses and hands the message back to her. **Refusing
is a feature.** Her judgement is the asset; anything that forges it destroys the thing
being sold. If a future change makes Edna smarter, check what it now does when it is
wrong.

## What it does

| Page | What it is for |
|---|---|
| `/` | Dashboard. Audience in one bar, the two things to act on today. |
| `/inbox` | Triage. Repeat questions come pre-drafted; the rest are kept separate. |
| `/owed` | The gap between the 24-hour pay window and how long people take. |
| `/links` | Build an affiliate link. Run the comment automation demo. |
| `/posts` `/questions` `/pieces` | Which posts, questions and pieces bring which group. |
| `/how` | What is counted, estimated, and unknowable. |

Five groups, each a description of behaviour rather than a guess at personality:
Regular (3+ different posts), Researcher (same piece 3+ times), Connector (forwarded
a link), Arrived from a friend (came from a text, not Instagram), Quick Ask (opened
once, gone).

## Templates

Plain text with placeholders. Every placeholder has exactly one rule: `{link}`,
`{piece}`, `{size}`, `{verdict}`, `{cheaper}`, `{cheaper_link}`. Rendering is pure
substitution — what is in the box is what goes out.

All twelve question types are editable. Seven ship with a draft. Five ship empty
because a template would be a forgery, and the page says so — but that is a default,
not a rule, and writing one moves those messages across immediately. **A template
does not have to contain a link.** A reply that buys her a day is still a reply.

If a placeholder cannot be filled, nothing is drafted and the message goes to her.

## Real, simulated, and unknowable

**Real and running:** the redirect (`app/r/[slug]/route.ts`) — cookie issuance,
referrer classification, post and question tagging, subscriber and handle capture,
the live feed. Every click on this site is genuinely recorded.

**Simulated:** the click history, and the sending of any message. Edna is not
connected to ManyChat. The comment demo on `/links` simulates the sending and
records the clicks for real; the panel says which half is which.

**Unknowable, and not faked:** who saved a post, whether a named person bought, and
any link forwarded by text message. Instagram releases none of it to anyone.

The generator (`scripts/seed.mjs`) is pinned to the evidence — traffic per post
follows the real save counts, the questions are the real twelve, the pieces are the
real wardrobe. Its three assumptions are named as constants at the top of that file.
`data/reconciliation.json` regenerates on every run and renders on `/how`.

## Running it

```bash
npm install
node scripts/seed.mjs
npm run dev
```

## Known limits

- 8 of 36 wardrobe pieces. Most categories have no cheaper sibling, which is why 13
  budget questions have no draft.
- Her pieces have no rating and none is invented. Her words are quoted, never scored.
- Which items each post linked to is read off the post titles, not recorded.
- Share attribution is partial: the group is always countable, the individual behind
  a forward is identifiable about half the time, and never over text message.
- The money figure is an estimate with its arithmetic printed beside it. A per-person
  discount code would make it exact, because a code stays on the order and never
  expires.
