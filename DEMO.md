# Edna — demo script

## Before you start

```bash
node scripts/seed.mjs                 # fresh data
rm -f data/templates.json data/reply-log.local.json
echo '[]' > data/live-log.local.json  # clear the live feed
npm run dev
```

Open two tabs: **`/`** and **`/inbox`**. Leave the inbox scrolled to the top.
Have a phone or a second window ready if you want to tap a link live.

Numbers below are what the seed currently produces. Re-read them after seeding —
they shift slightly each run.

---

## 30 seconds — what we took

> Sofia has fifty thousand followers and answers three thousand DMs a month by
> hand. Her taste is the whole business, and it only exists in real time — the
> moment she stops typing, it stops working.
>
> What we took is her judgement. Not her wardrobe, not her follower count. The
> part of her that decides what is worth buying.

---

## 90 seconds — the product

**Tab 1 — the dashboard.**

> Instagram tells her 184,000 people saw a post. It never tells her what kind of
> person any of them were.

Point at the bar.

> Edna sorts everyone who taps her links into five groups, from nothing but how
> they tap. A third of them take the link and never come back. A fifth open the
> same piece over and over for days before deciding. Nine percent forward it to
> somebody else.
>
> No forms. No sign-ups. Nobody notices anything.

**Tab 2 — the inbox.** This is the bit that matters.

> Ninety-four messages waiting. Forty-five of them are questions she has answered
> a hundred times.

Scroll one card into view.

> "What size are you in the grey knit?" — and the reply is already written. Her
> size, from her wardrobe. Her verdict on it, word for word: *soft but pills*.
> Her affiliate link, already tagged to this person.

Hit **Send this**. The phone mock-up appears.

> That is what lands in their DMs.

Click the **Needs you** tab.

> And these are the ones she has to answer herself. "If you were me, which one
> would you actually buy?" There is no template for that, and there shouldn't be
> — that is the thing they came for. Edna does not try.

Open **Your reply templates** at the top.

> She writes these, not us. Change a word, save, and every draft underneath
> rewrites itself.

---

## 60 seconds — the impact

Back to the dashboard, click **Unpaid**.

> Three thousand one hundred people came back to one of her links more than a day
> after the first time. That is counted, not guessed — it is her own link
> recording it.
>
> Her affiliate link stops paying after twenty-four hours. People take three days
> to decide. So the moment they take a moment to think, she stops getting paid.

Point at the estimate.

> We won't pretend we can see individual purchases — nobody can, that happens on
> the shop's site. This is her click data times the rate her own affiliate
> statement already shows. It is deliberately the cautious version.

Click the button.

> And this writes the message to the brand asking for a discount code, because a
> code stays on the order and never expires.

**Close on:**

> **Sofia no longer needs to be awake for her taste to work, because the links
> she already sends carry it for her.**

---

## If something breaks

| Problem | Do this |
|---|---|
| No wifi | Every page works offline. Use `?dry=1` on any link so nothing leaves the site. |
| Live feed empty | `/links` → **Send it to them** fires a real click in two seconds. |
| Clipboard blocked | The reply is still marked sent; the phone mock still appears. |
| Asked "is this real data?" | Say yes to the clicks, no to the purchases, and open `/how`. |

## Questions you will get

**"Where does the click data come from?"**
Her own redirect. Every affiliate link points at Edna first, which records the tap
and bounces on. `/links` shows one being built.

**"Is the behaviour data real?"**
No — simulated, and `/how` says so on the page. Instagram does not release who
saved or shared a post, to anyone. The volumes are pinned to her real save counts
and her real twelve questions.

**"How do you know someone bought?"**
We don't, and we say so. That is why the money figure is an estimate with its
arithmetic printed next to it, and why the page ends by asking the brand for a
discount code — which would make it exact.

**"Does it send the DMs?"**
Not today. The reply is built and copied; sending needs a ManyChat Pro account
and an API key. The architecture is one server call, and nothing about the
product changes.
