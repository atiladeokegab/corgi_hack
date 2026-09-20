# Roadmap — the hub, and what fits before 18:00

Written 2026-09-20 15:10 BST, against the three-phase hub plan. It takes each item in
that plan, checks it against what is already running and against the case file, and
says what ships today versus what is roadmap you describe out loud.

The scope line that was in the source plan about registering a backend and operational
headquarters to a residential address is deliberately not carried into this document.

## The clock is the constraint

| Time | What | Build minutes left |
|---|---|---|
| 15:10 | now | — |
| 16:00 | intelligence drop, then a 30-minute mandated reassessment window | 50 |
| 16:30 | build resumes | 50 |
| 17:30 | freeze, reseed, rehearse | 110 |
| 18:00 | judging | 0 |
| 19:00 | top six pitch · 20:00 exfiltration, 90 seconds, product first | — |

Roughly **110 usable minutes.** The three phases as written are several weeks. The job
of this document is to choose the slice of them that survives that number.

E-08 is explicit about the bar: *"Ship the sharpest proof of your idea, not the largest
codebase."* Judge question 1 is *would I use it*, not *is it complete*.

---

## What already runs

Everything in this list is built, committed and demonstrable at `cc7c448`.

| Capability | Where | Phase it belongs to |
|---|---|---|
| Tracked redirect — cookie, Referer class, post/DM/share attribution | `app/r/[slug]/route.ts` | 1 (ingestion) |
| ManyChat identity passthrough — `?s=<subscriber_id>`, `?h=<handle>` | `app/r/[slug]/route.ts:46` | 1 (ingestion) |
| Five-segment audience classifier | `lib/classify.ts` | 2 (intelligence) |
| Dashboard — segments, per-post and per-DM breakdown | `app/page.tsx` | 1 (interface) |
| Link builder, the ManyChat stand-in | `app/links/LinkBuilder.tsx` | 1 (ingestion) |
| Live feed, two-second round trip | `app/components/LiveFeed.tsx`, `app/api/live/route.ts` | 1 (interface) |
| Evidence-pinned seed and drift reconciliation | `scripts/seed.mjs`, `data/reconciliation.json` | 1 (datastore) |

So Phase 1 is substantially done, in the only form it can honestly take today. The
gap between what exists and the written plan is mostly Phases 2 and 3.

---

## The plan, item by item

Verdicts: **done** · **cheap** (fits in the 110) · **expensive** (does not) ·
**conflicts** (contradicts something already settled).

### Phase 1 — Unified hub and ingestion

| Item | Verdict | Why |
|---|---|---|
| Instagram / TikTok / YouTube / email APIs for 3.1K DMs | **expensive** | Not a coding problem. IG Messaging needs a Business account plus Meta app review; TikTok exposes no public DM API at all; YouTube has no DM concept. None of this is obtainable in 110 minutes or in a week. |
| Single datastore for cross-platform metrics | **done, narrower** | `data/*.json` plus the redirect log is the datastore. It is one platform, not four. |
| Drag-and-drop visual whiteboard | **expensive, and competing** | A whiteboard is a second interface next to the dashboard that already tells the story. Highest build cost and lowest judge value of anything in the plan. |

**The honest version of Phase 1 is ManyChat**, which is already half-built and is also
how Sofia actually works today — `README.md` records her process as *"copies links into
replies — literally her copying the link and ManyChat."* A ManyChat flow is a real
ingestion path, not a stand-in for one, and `?s=<subscriber_id>` already merges a person
across their phone and their laptop instead of counting them twice.

### Phase 2 — Intelligence and routing

| Item | Verdict | Why |
|---|---|---|
| Semantic categorisation of recurring inquiries | **cheap** | E-01 has already done the labelling: twelve DMs, each tagged with the job it is really asking for. Matching new text to twelve known jobs needs keywords, not inference — and E-08 says impressiveness must not depend on expensive inference. |
| Delegation matrix — route to the VA or an agent | **cheap** | A rules table over the DM job. `EXACT ITEM REQUEST` is a link paste, so the VA sends it. `FIT` / `BUDGET` / `TRUST` carry her judgement, so they stay with Sofia. This is her stated want: *less admin*. |
| Stripe link for monetisation events | **conflicts** | See below. |

### Phase 3 — Contextual automation

| Item | Verdict | Why |
|---|---|---|
| Sync notebook data and draft replies to the dashboard | **cheap, and the strongest item in the plan** | `items.json` already carries `sofiaSays` — her actual verdict per item, from E-04. A draft reply that quotes her own words is the literal preservation of judgement that judge question 2 asks about. |
| Background recommendation scanner — B-roll, past posts, charts by context | **expensive** | Pleasant, invisible in 90 seconds, and it earns nothing against the four judge questions. |
| One-to-many response broadcaster | **cheap, and it is the punchline** | 3.1K DMs a month collapse into roughly twelve answers. Answer the job once, send it to everyone who asked it. This is the direct fix for *her judgement only exists in real time*. |

---

## Two conflicts to settle before anyone writes code

**1. Stripe contradicts the settled scope.** `PRODUCT.md` states it flatly: *"There is
no revenue, attribution or money anywhere in this system. The job is to give her better
information, not to measure her earnings."* E-09 makes it worse than a scope question —
62% of high-value purchasers never clicked the affiliate link, and the median gap between
saving and buying is 3.4 days. A Stripe integration measures the click path, which the
intelligence drop says is the minority path. Building it would have us instrument the
signal the case file warns against.

*Recommendation:* leave money out today. If it belongs anywhere it is post-hackathon, and
it should read her verdicts against outcomes, not attribute clicks to charges.

**2. The whiteboard competes with the dashboard.** Both are the main interface. Shipping a
half-built whiteboard next to a working dashboard makes the product look less finished
than it is. *Recommendation:* keep the dashboard, describe the whiteboard as roadmap.

If the call goes the other way on either, this plan is wrong and the cut below changes —
which is the point of writing it down before 15:30 rather than at 17:45.

---

## The cut — what ships before 18:00

One build, three parts, all on data already in the repo. No new dependency, no API key,
no model call. Together they are Phase 2's routing plus Phase 3's draft replies and
broadcaster, sitting on the Phase 1 ingestion that already works.

### Part A · The triage queue — 30 min

A new route showing the twelve E-01 DMs ordered by **who each job brings**, not by volume.
`PRODUCT.md` already has the finding: `EXACT ITEM REQUEST` is her loudest DM and 76% of
the people it brings are Quick Asks who never return; `SOCIAL SHARING` and `SECOND-HAND
DISCOVERY` are her quietest and they bring Connectors. Volume order and value order are
opposites, and she cannot currently see that.

- Files: `app/queue/page.tsx` (new), `lib/triage.ts` (new)
- Reads: `data/dms.json`, `lib/analytics.ts`
- Done when: the queue renders in a priority order that is visibly not the volume order

### Part B · Draft reply carrying her verdict — 40 min

Each queue row opens a reply already written: her `sofiaSays` line for the item, quoted
verbatim, plus a tracked link built by the logic already in `LinkBuilder.tsx`. Nothing is
generated. Nothing is scored. Her words, her link, one click to copy.

- Files: `lib/reply.ts` (new), `app/queue/page.tsx`
- Reuses: the URL assembly in `app/links/LinkBuilder.tsx` — extract it, do not fork it
- Done when: copying a draft yields a real `/r/...?d=<job>` link that lands in the live feed
- Constraint: no invented rating. E-04 names a numeric "Sofia rating" that does not exist
  in the printed evidence, and `PRODUCT.md` commits to quoting her verdicts, never scoring
  them. Breaking that breaks judge question 2.

### Part C · Send once, reach everyone who asked — 25 min

The broadcaster, in its smallest honest form: a row per job showing how many people asked
it, and one action that sends the one draft to all of them. Demo it against the twelve;
state the monthly number rather than faking it.

- Files: `app/queue/page.tsx`, `lib/triage.ts`
- Done when: one action visibly answers a cohort, and the count is traceable to E-01

### 17:30 freeze

`node scripts/seed.mjs`, check `data/reconciliation.json` renders, walk the 90 seconds
twice, use `?dry=1` for the live click so the demo never depends on the room's wifi
reaching a retailer.

### The sentence it has to earn

> **Sofia no longer needs to answer the same question forty times, because one answer —
> in her words, with her link — reaches everyone who asked it, and tells her who acted.**

---

## Roadmap — said out loud, not built today

Ordered by value, not by phase number.

1. **ManyChat flow in production.** The one item here that is genuinely close. Her replies
   already go out through ManyChat; the link format is already supported.
2. **Learned DM classification.** Twelve hand-labelled jobs is a training set. Cheap
   classical model, no inference bill.
3. **Notebook ingestion.** E-05 is a recovered paper notebook; E-02 has her at voice notes
   at 09:00 and 17:00. Getting scattered judgement into one findable place is problem #9
   in `docs/problem-map.md` and it is a real product on its own.
4. **The whiteboard**, if the dashboard proves too rigid in real use.
5. **TikTok and YouTube**, when a platform offers an ingestion path that exists.
6. **Outcome reading, not payment attribution** — and only after E-09's argument about
   saves, returns and shares has been answered properly.

## What we will not claim

- Not four platforms. One platform, honestly instrumented.
- Not semantic AI search. Twelve labelled jobs and keyword matching, which is enough and
  is cheaper to defend.
- Not revenue tracking. The case file argues the click is the wrong signal; we agree with
  it rather than instrumenting against it.
- Not per-person saves or shares from Instagram. It does not expose them to anyone, at any
  price, and `PRODUCT.md` already says so.

## Open, and needing the human

- Stripe: dropped, or kept against `PRODUCT.md`?
- Whiteboard: roadmap, or does it replace the dashboard?
- The 16:00 drop may move all of this. Do not start Part C before 16:30.
