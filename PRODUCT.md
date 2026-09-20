# Lookbook — the decision record

Kept separate from `README.md` because that file is being edited live. This is the
"one file, one owner" copy of what was settled and why.

## The gate (E-08)

> If you cannot name the person and the decision, you do not have a product yet.

**Person:** Sofia. Not an audience member — a deliberate call, taken with the judges,
on the grounds that the audience should absorb no new friction for this to work.
Nobody signs up, fills in a form, or visits a page.

**Decision:** *What should I make next, and which DMs are worth answering first?*

**Scope, explicitly:** visibility into her customer base. Who is clicking, and which
post or which DM brought them. There is no revenue, attribution or money anywhere in
this system. The job is to give her better information, not to measure her earnings.

**Constraint she set:** instrumentation is a redirect and nothing else.

## What it does

The links Sofia already pastes point at her own redirect first. It bounces on
instantly. From the shape of how someone opens those links it sorts her audience
into five groups, and cross-references them against the post or the DM that brought
each person in.

Five groups, each defined by something a redirect can observe on its own:

| Group | How you spot them | Evidence |
|---|---|---|
| The Regular | 3+ different posts, including old ones | E-07.2 Jamie |
| The Researcher | one item, reopened 3+ times | E-07.1 Clara · E-07.3 Priya |
| The Connector | passed the link to someone else | E-07.4 Ella |
| Arrived from a friend | came from off-platform, not Instagram | E-01.5 · E-01.11 |
| The Quick Ask | one open, no return | E-01.1 exact item request |

**Sofia no longer needs to guess who she is talking to, because the links she already
sends now tell her which kind of person opened them, and which post or question
brought them in.**

## The finding the demo turns on

E-01 labels each DM with the job it is really asking for. Once her reply link carries
that label, the question she answered becomes a property of the person who clicked —
and the DM queue stops being a queue and starts being a sorting mechanism:

| DM job | Volume | Who it brings |
|---|---|---|
| EXACT ITEM REQUEST | highest | 76% The Quick Ask |
| FIT / DECISION / BUDGET / INTENT | high | ~70% The Researcher |
| ADAPTATION / POST-PURCHASE / CONSTRAINT / TRUST | medium | 54–73% The Regular |
| SOCIAL SHARING | low | 44% The Connector |
| SECOND-HAND DISCOVERY | lowest | 57% The Connector |

Her loudest DM — *"WHERE is this blazer I'm begging you"* — brings people who open
the link once and never come back. Her quietest two bring the people who pass her
taste on to someone else. That is a priority order she cannot currently see, and it
is the opposite of the one volume would suggest.

## What the redirect can and cannot see

Observable, with zero audience friction:

| Signal | Mechanism |
|---|---|
| Repeat consideration | same cookie, separate days |
| Breadth across her catalogue | which posts the opens belong to |
| Fixation on one piece | repeated opens of a single item |
| Shares | `Referer` is WhatsApp/iMessage/nothing rather than Instagram |
| Who shared | `?v=<uid>` survives when the link that travelled was still hers |
| Which post earned it | `?p=<postRef>` on the caption link |
| Which DM earned it | `?d=<job>` on the reply link, using E-01's labels |

**Not observable, and not faked here:** who saved a post. Instagram does not expose
per-person saves or shares to anyone, at any price. That is why the model reads the
shape of returns instead — and the dashboard reports how well the classifier recovers
real behaviour (96% against held-out truth) rather than asserting that it works.

Partial by construction: a forwarded link only names its sender about half the time.
Anonymous share arrivals are counted and used to estimate how many Connectors the log
cannot name, rather than quietly dropped.

## Real vs synthetic

**Real and running:** the redirect (`app/r/[slug]/route.ts`), cookie issuance,
Referer classification, DM-job tagging, share attribution, the live feed.

**Synthetic:** the click history. No such dataset was provided and none can be
obtained from Instagram. `scripts/seed.mjs` generates it, pinned to the evidence:
per-post traffic proportional to E-03's save counts, the DM mix built on E-01's
twelve labelled jobs, items from E-04. The three assumptions that are *not* in the
evidence are named as constants at the top of that file so they can be argued with:

- `CLICK_RATE_OF_SAVERS` — E-03 gives views and saves but no click counts
- `DM_REPLIES_WITH_A_LINK` — derived from 3.1k DMs/month and E-02
- `SHARER_ATTRIBUTION_RATE` — how often a forwarded link still carries its sender

`data/reconciliation.json` regenerates on every seed run and renders at the bottom of
the dashboard, so drift is visible rather than buried.

## Running it

```bash
npm install
node scripts/seed.mjs     # regenerate data/ from evidence/
npm run dev               # http://localhost:3000
```

Live endpoints:

```
/r/black-blazer?p=E-03.4                    # from a caption link
/r/white-tee?d=BUDGET                       # from a DM reply, tagged with E-01's job
/r/black-blazer?src=whatsapp&v=<uid>        # passed on by a friend
...&dry=1                                   # record it, show the row, stay on site
```

Use `?dry=1` on stage — it proves the mechanism without leaving the app or needing
the room's wifi to reach a retailer.

## The 90 seconds

1. **What we took.** Her judgement is the asset, but she cannot see who is receiving
   it. Instagram reports how many people saw a post, never which kind of person.
2. **The product.** Open the dashboard. Her audience splits five ways. Then the post
   breakdown, then the DM breakdown.
3. **It runs.** Click a `/r/` link — the row lands in the live feed in two seconds.
   Click it again with `&src=whatsapp` — same link, now classified as a share.
4. **Impact.** The DM she gets most of brings people who never come back. The two she
   gets least of bring the people who pass her taste on. That is a content brief.

## Known limits, stated rather than papered over

- `wardrobe.csv` is 8 of 36 items.
- E-04 names a numeric "Sofia rating"; it does not exist in the printed evidence, so
  nothing here invents one. Her verdicts are quoted, never scored.
- Which items each post links to is inferred from the E-03 titles and E-05.6.
- The relative frequency of E-01's twelve DM jobs is an assumption.
- Share attribution is partial: the group is always sizeable, the individual is
  identifiable about half the time.
