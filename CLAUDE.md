# corgi_hack — Operation Lookbook

Read this cold, before touching anything. Nothing has been built yet and **no product
decision has been made.** This file exists so that whoever picks the work up — including
an agent that never saw the planning conversation — starts from the same evidence.

## The brief

TANO Creator Heist, **Case 002 // Operation Lookbook**. The full case file is at
`evidence/Operation Lookbook Case File.pdf` (17 sheets); a text extract sits beside it.

> **Build one working product that uses Sofia's judgement to help one real audience member
> make one better decision.**

Eight hours. A working demo shown in under a minute. **Not a deck.**

### The target

Sofia Bennett, 27, London. Fashion creator and stylist. 34K Instagram + 16K TikTok = 50K
followers, 2.4M monthly reach, 3.1K+ DMs/month. Team is Sofia plus one part-time VA.
Revenue is affiliate + brand + UGC, plus paid styling and creator-led edits.

Her rule: *"I would rather link 3 things I truly love than 30 things I was paid to post."*

The organiser's assessment: **her taste is the asset, and the value of her judgement is
still trapped inside the creator.** Two DM sprints a day and the queue still grows — the
bottleneck is not effort, it is that her judgement only exists in real time.

Her own words, from the margin of E-05: *"People want my eye, not my inventory."*

### What the build must do (E-08)

1. Help a real audience member make a better decision.
2. Preserve a meaningful piece of Sofia's judgement / taste.
3. Work with the evidence provided.
4. Be demonstrable in a few clicks.
5. Not require expensive AI inference to be impressive.

Explicitly not needed: a giant model, a huge backend, a pitch deck pretending to be a
product. *"Ship the sharpest proof of your idea, not the largest codebase."*

The gate the case file sets: **if you cannot name the person and the decision, you do not
have a product yet.**

## The twist — read this before choosing anything

Sheet 13 is a sealed envelope, opened at 16:00. Sheet 14 (E-09) is what's inside, and it
is aimed squarely at the obvious product:

> **You have been looking at the wrong signal.** The purchase is often not the click.

- **62%** of high-value purchasers did not click Sofia's affiliate link
- **3.4 days** median between saving her content and purchasing
- **41%** of purchases followed a share to a friend or partner
- **2.2x** higher purchase rate when someone saved 3+ looks before buying

E-03 says the same thing from the other side: the 184K-view Copenhagen post produced 92
purchases; the 28K-view blazer post produced 427. Reach is loud, intent is quiet.

E-10 then hands over per-user intent data and says the link-click column is *deliberately
incomplete* — "you are supposed to decide what matters, then decide what to instrument."

**Implication to argue with, not to assume:** a product measured on clicks is measuring
the minority path. Saves, returns and shares are where the signal lives.

## The evidence

| File | Sheet | What it is |
|---|---|---|
| `evidence/Operation Lookbook Case File.pdf` | all 17 | The original case file |
| `evidence/case-file-extracted.txt` | all 17 | Plain-text extract of the above |
| `evidence/inbox.csv` | E-01 | 12 DMs, labelled with the job each one is really asking for |
| `evidence/broadcast-log.csv` | E-03 | 5 posts: views, saves, purchases |
| `evidence/wardrobe.csv` | E-04 | 8 wardrobe items with Sofia's verdict on each |
| `evidence/audience.csv` | E-07 | 4 tracked audience members |
| `evidence/intent.csv` | E-10 | 12 users: saves, shares, returns, click, purchase, days-to-buy |

Not tabulated, but in the PDF and worth reading directly: **E-02** (Sofia's Tuesday, hour
by hour), **E-05** (her recovered notebook — BUY/MAYBE/NO, the questions she keeps
answering, and a stated contradiction), **E-06** (a voice-note transcript).

### Data caveats — do not paper over these

- `wardrobe.csv` is **8 of 36 items**. The case file says so explicitly.
- E-04 names a *"Sofia rating"* and a *"Would I buy again?"* field as useful, but the
  printed extract carries only the free-text `sofia_says` note. There is no numeric rating
  in the evidence. Inventing one is fabricating the primary asset.
- `intent.csv`'s `link_click` column is **intentionally incomplete**. That is the puzzle,
  not a data-quality bug.
- The four people in `audience.csv` are anonymised behavioural records; photos are withheld.
- The E-06 QR code and audio are placeholders in the printed file.
- E-04's own data note: *"The dataset intentionally mixes objective facts with Sofia's
  subjective judgement. The subjective layer is not noise. It is the product."*

## Judged on

At 18:00 the judges ask four questions (sheet 16):

1. **Would I use it?** — does it solve a real problem in my actual workflow?
2. **Would I trust it?** — does it preserve the thing my audience comes to me for?
3. **Would my audience use it?** — does it make a decision easier, faster or better?
4. **Would I share it?** — would I put this in my content / bio / DMs tomorrow?

The demo rule: *don't just tell what you've built — show how it makes their life easier.*

### Run of day

| Time | What |
|---|---|
| 16:00 | Intelligence drop (E-09), then a 30-minute window to reassess the product |
| 18:00 | Judging |
| 19:00 | Top six pitch |
| 20:00 | Exfiltration — 90 seconds, product first, no deck |

The 90 seconds breaks down as 30s "what were you stealing?", 90s "show us the product",
60s "show us the impact" — and closes on a fill-in-the-blank line:
**"Sofia no longer needs to ______ because ______."** That sentence is a good test of an
idea long before it is a closing slide.

## Still undecided

Deliberately open, to be settled with the human before anyone writes code:

- **Which audience member** and **which decision**. The gate in E-08 is naming both.
- **The product itself.** Nothing is chosen.
- **The stack.** Nothing installed, nothing scaffolded, no framework picked.
- **What to instrument**, given E-10 leaves that to us.

Do not resolve any of these unilaterally. Prep work that survives any of these choices is
welcome; work that presumes one of them is not.

## Working here

Hub-coordinated like the other projects on this box — see `/home/atilade/hub/HUB.md`.

```bash
apollo corgi_hack        # or hermes / athena / prometheus — lands here, scoped to corgi_hack
echo $HUB_PROJECT        # should print corgi_hack
hub brief                # inbox, your work, what peers hold
```

`hub` tasks from this repo are tagged `project: corgi_hack` automatically because
`_hub_enter` derives the tag from the git root's basename. Tag manually with
`--project corgi_hack` if you create a task from anywhere else, or scoped agents will
never see it.

**One file, one owner** for the duration of a cycle, written into the task. With a
deadline this tight, a silent overwrite is the expensive failure. Check `git status`
before you start.

### Git identity

Already configured locally, and worth not undoing:

```
user.email = 153107440+atiladeokegab@users.noreply.github.com
```

Committing as `okeatilade@gmail.com` attributes to a second GitHub account
(`Atilmatrix`). On the Refinery repo that silently blocked deploys for two months —
see `~/hub/runbooks/vercel-deploy-blocked.md`. If anything here ends up on Vercel, the
same trap applies.
