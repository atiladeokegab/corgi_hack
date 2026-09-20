// Generates a synthetic click log from the case-file evidence.
//
// The product measures ONE thing: who is clicking Sofia's links, and which post or
// which DM brought them. There is no purchase data here and no money anywhere in
// the system — the job is visibility into her audience, not attribution of revenue.
//
// Everything is SYNTHETIC. What it is not allowed to do is contradict the evidence:
// per-post volume is proportional to the save counts in E-03, the DM mix comes from
// the twelve labelled jobs in E-01, and items come from E-04. Assumptions that are
// not in the evidence are named as constants at the top so they can be argued with.
import fs from 'node:fs'
import path from 'node:path'
import { parseCsv } from '../lib/csv.mjs'

const ROOT = process.cwd()
const ev = f => parseCsv(fs.readFileSync(path.join(ROOT, 'evidence', f), 'utf8'))

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260920)
const pick = arr => arr[Math.floor(rnd() * arr.length)]
const between = (lo, hi) => lo + rnd() * (hi - lo)
const int = (lo, hi) => Math.round(between(lo, hi))
const weighted = table => {
  let r = rnd(), acc = 0
  for (const [k, w] of table) { acc += w; if (r <= acc) return k }
  return table[table.length - 1][0]
}

// ------------------------------------------------- assumptions, not evidence
// E-03 gives views and saves but no click counts. This is the one volume
// assumption in the model: roughly this share of savers eventually opens a link.
const CLICK_RATE_OF_SAVERS = 0.15
// The brief gives 3.1k DMs/month and E-02 has her pasting links into replies.
// This is the share of those replies that carry a link, over the ~6.5 week window.
const DM_REPLIES_WITH_A_LINK = 1400
// A forwarded link only carries its sender's id when what travelled was still
// Sofia's redirect URL. Otherwise the share is visible but the sharer is not.
const SHARER_ATTRIBUTION_RATE = 0.55

// ---------------------------------------------------------------- evidence in
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const tierOf = p => (p < 80 ? 'entry' : p <= 120 ? 'mid' : 'premium')

// Real retailer pages, where we have them. Anything not listed falls back to a
// search URL so the redirect still resolves to something sensible in a demo.
const DESTINATIONS = {
  'black-blazer': 'https://www.zara.com/uk/en/tailored-blazer-with-shoulder-pads-p02753329.html?v1=595638605&v2=2420925',
}

const items = ev('wardrobe.csv').map(r => ({
  slug: slugify(r.item),
  ref: r.ref,
  name: r.item,
  category: r.category,
  tier: tierOf(Number(r.price_gbp)),
  style: r.style,
  status: r.status,
  sofiaSays: r.sofia_says,
  destination: DESTINATIONS[slugify(r.item)]
    ?? `https://www.net-a-porter.com/en-gb/shop/search?q=${encodeURIComponent(r.item)}`,
  realDestination: Boolean(DESTINATIONS[slugify(r.item)]),
}))
const itemBySlug = Object.fromEntries(items.map(i => [i.slug, i]))

// Which items each post links to is not in the CSVs; it is read off the E-03
// titles and E-05.6 (her most curated post carries one link, her widest carries five).
const POST_META = {
  'E-03.1': { slug: 'fashion-week', publishedAt: '2026-08-13', items: ['red-slingback', 'wide-leg-denim', 'vintage-leather'] },
  'E-03.2': { slug: 'copenhagen', publishedAt: '2026-08-04', items: ['silk-skirt', 'white-tee', 'grey-knit', 'wide-leg-denim', 'vintage-leather'] },
  'E-03.3': { slug: 'outfit-challenge', publishedAt: '2026-08-29', items: ['white-tee', 'red-slingback'] },
  'E-03.4': { slug: 'the-blazer', publishedAt: '2026-09-05', items: ['black-blazer'] },
  'E-03.5': { slug: 'never-buy-again', publishedAt: '2026-08-22', items: ['grey-knit'] },
}

const posts = ev('broadcast-log.csv').map(r => ({
  ref: r.ref,
  title: r.post,
  views: Number(r.views),
  saves: Number(r.saves),
  organiserLabel: r.organiser_label,
  ...POST_META[r.ref],
  linkCount: POST_META[r.ref].items.length,
}))

// E-01: twelve DMs, each labelled with the job it is really asking for. Those
// labels are the second dimension of the product — which question brings which person.
const dms = ev('inbox.csv').map(r => ({ ref: r.ref, handle: r.handle, job: r.job, message: r.message }))
const DM_JOBS = [...new Set(dms.map(d => d.job))]

// How often each job comes up relative to the others, and who it tends to bring.
// Weights are an assumption; the lean of each job is read off the message text.
const JOB_MODEL = {
  'EXACT ITEM REQUEST':    { weight: 0.19, lean: 'SAME_DAY',   tier: null },
  'DECISION':              { weight: 0.11, lean: 'RESEARCHER', tier: null },
  'ADAPTATION':            { weight: 0.09, lean: 'REGULAR',    tier: null },
  'BUDGET':                { weight: 0.10, lean: 'RESEARCHER', tier: 'entry' },
  'SOCIAL SHARING':        { weight: 0.08, lean: 'CONNECTOR',  tier: null },
  'FIT':                   { weight: 0.11, lean: 'RESEARCHER', tier: null },
  'INTENT':                { weight: 0.07, lean: 'RESEARCHER', tier: 'premium' },
  'POST-PURCHASE':         { weight: 0.06, lean: 'REGULAR',    tier: null },
  'CONSTRAINT':            { weight: 0.05, lean: 'REGULAR',    tier: null },
  'TRUST':                 { weight: 0.05, lean: 'REGULAR',    tier: null },
  'SECOND-HAND DISCOVERY': { weight: 0.04, lean: 'CONNECTOR',  tier: null },
  'CONSIDERATION':         { weight: 0.05, lean: 'RESEARCHER', tier: null },
}

// -------------------------------------------------------------- behaviour model
// Five ways of behaving, each defined by what a redirect can actually observe.
const ARCHETYPES = {
  SAME_DAY:   { touches: [1, 1], slugs: [1, 1], postSpread: [1, 1], days: [1, 1], window: [0, 14] },
  RESEARCHER: { touches: [3, 7], slugs: [1, 1], postSpread: [1, 1], days: [2, 5], window: [0, 30] },
  REGULAR:    { touches: [4, 9], slugs: [3, 5], postSpread: [3, 5], days: [3, 7], window: [6, 120] },
  CONNECTOR:  { touches: [1, 3], slugs: [1, 2], postSpread: [1, 2], days: [1, 2], window: [0, 20] },
  SENT_ON:    { touches: [1, 2], slugs: [1, 1], postSpread: [1, 1], days: [1, 2], window: [2, 60] },
}

// The mix arriving from a caption link, before shares are layered on top.
const POST_MIX = [['SAME_DAY', 0.46], ['RESEARCHER', 0.22], ['REGULAR', 0.16], ['CONNECTOR', 0.16]]

const REFERRERS = {
  instagram:    ['https://l.instagram.com/', 'https://www.instagram.com/'],
  instagram_dm: ['https://l.instagram.com/?dm=1'],
  whatsapp:     ['https://web.whatsapp.com/', 'android-app://com.whatsapp'],
  messages:     [''],   // iMessage and most native share sheets strip the referrer
  direct:       [''],
  other:        ['https://www.pinterest.co.uk/'],
}
const DEVICES = ['ios-safari', 'ios-instagram', 'android-chrome', 'desktop-chrome']

const hours = h => h * 3600 * 1000
const iso = ms => new Date(ms).toISOString()

// Nothing may be dated after the moment the data was generated. Without this,
// long-running behaviour (a Regular ranging over four months) spills into the
// future, and every recency calculation downstream quietly goes wrong.
const NOW_MS = Date.now()
const DAY = hours(24)

let uidN = 0
const nextUid = () => `u_${(++uidN).toString(36).padStart(5, '0')}`

const events = []
const truth = []

function emitPerson({ uid, archetype, source, post, dmJob, anchorMs, refClass, via, tierPref }) {
  const spec = ARCHETYPES[archetype]
  const touches = int(spec.touches[0], spec.touches[1])
  const dayCount = Math.min(touches, int(spec.days[0], spec.days[1]))

  // Which items this person opens. REGULARs range across posts; everyone else
  // stays inside the one post (or the one item) that brought them.
  const pool = post ? post.items.slice() : items.map(i => i.slug)
  const filtered = tierPref ? pool.filter(s => itemBySlug[s]?.tier === tierPref) : pool
  const usable = filtered.length ? filtered : pool
  const slugCount = Math.min(usable.length, int(spec.slugs[0], spec.slugs[1]))
  const chosen = []
  while (chosen.length < slugCount) {
    const s = pick(usable)
    if (!chosen.includes(s)) chosen.push(s)
  }

  // REGULARs are the ones who go back to older posts — that is their signature.
  const postPool = archetype === 'REGULAR' ? posts : (post ? [post] : posts)
  const postCount = Math.min(postPool.length, int(spec.postSpread[0], spec.postSpread[1]))
  const chosenPosts = []
  while (chosenPosts.length < postCount) {
    const p = pick(postPool)
    if (!chosenPosts.includes(p)) chosenPosts.push(p)
  }
  if (!chosenPosts.length) chosenPosts.push(post ?? pick(posts))

  // How long this person can plausibly have been active: their own window, but
  // never longer than the time that has actually elapsed since they arrived.
  const elapsedDays = Math.max(1, Math.floor((NOW_MS - anchorMs) / DAY))
  const spanMax = Math.max(1, Math.min(spec.window[1] || 20, elapsedDays))
  const dayOffsets = [0]
  for (let d = 1; d < dayCount; d++) dayOffsets.push(int(1, spanMax))
  dayOffsets.sort((a, b) => a - b)

  for (let t = 0; t < touches; t++) {
    const dayOffset = dayOffsets[Math.min(t, dayOffsets.length - 1)]
    const p = chosenPosts[t % chosenPosts.length]
    const itemSlug = chosen[t % chosen.length]
    // Never place an open before the post that carried the link existed.
    const postLive = Date.parse(p.publishedAt + 'T09:00:00Z') + hours(between(2, 40))
    const at = Math.min(
      Math.max(anchorMs + hours(dayOffset * 24 + between(0.2, 15)), postLive),
      NOW_MS - hours(between(0.05, 3)),
    )
    events.push({
      id: `e_${events.length.toString(36)}`,
      ts: iso(at),
      uid,
      slug: itemSlug,
      postRef: p.ref,
      source,                       // 'post' | 'dm' | 'share'
      dmJob: dmJob ?? null,
      via: via ?? null,
      subscriberId: null,   // seeded history predates the ManyChat link format
      handle: null,
      group: null,
      refClass,
      referrer: pick(REFERRERS[refClass]),
      device: pick(DEVICES),
    })
  }
  truth.push({ uid, archetype, source, dmJob: dmJob ?? null, touches })
  return chosen[0]
}

// ---------------------------------------------------------- caption-link traffic
const connectorsByPost = new Map()

for (const post of posts) {
  const pubMs = Date.parse(post.publishedAt + 'T09:00:00Z')
  const n = Math.round(post.saves * CLICK_RATE_OF_SAVERS)
  const connectors = []
  for (let i = 0; i < n; i++) {
    const archetype = weighted(POST_MIX)
    const uid = nextUid()
    emitPerson({
      uid, archetype, source: 'post', post, dmJob: null,
      anchorMs: pubMs,
      refClass: weighted([['instagram', 0.88], ['instagram_dm', 0.08], ['direct', 0.04]]),
      via: null, tierPref: null,
    })
    if (archetype === 'CONNECTOR') connectors.push({ uid, pubMs })
  }
  connectorsByPost.set(post.ref, connectors)
}

// ---------------------------------------------------------------- DM-reply traffic
const jobTable = DM_JOBS.map(j => [j, JOB_MODEL[j]?.weight ?? 0.02])
for (let i = 0; i < DM_REPLIES_WITH_A_LINK; i++) {
  const job = weighted(jobTable)
  const model = JOB_MODEL[job] ?? { lean: 'SAME_DAY', tier: null }
  // The lean holds most of the time; the rest is ordinary variation.
  const archetype = rnd() < 0.62 ? model.lean : weighted(POST_MIX)
  const post = pick(posts)
  const anchorMs = Math.min(
    Date.parse(post.publishedAt + 'T09:00:00Z') + hours(between(2, 300)),
    NOW_MS - hours(between(1, 72)),
  )
  const uid = nextUid()
  emitPerson({
    uid, archetype, source: 'dm', post, dmJob: job, anchorMs,
    refClass: 'instagram_dm', via: null, tierPref: model.tier,
  })
  if (archetype === 'CONNECTOR') {
    const list = connectorsByPost.get(post.ref) ?? []
    list.push({ uid, pubMs: anchorMs })
    connectorsByPost.set(post.ref, list)
  }
}

// ------------------------------------------------------------------ share traffic
// Every Connector passes the link to someone. Those arrivals are always visible
// (the referrer is not Instagram); the sender is only named about half the time.
for (const post of posts) {
  const pubMs = Date.parse(post.publishedAt + 'T09:00:00Z')
  for (const c of connectorsByPost.get(post.ref) ?? []) {
    const fanOut = int(1, 3)
    for (let f = 0; f < fanOut; f++) {
      emitPerson({
        uid: nextUid(),
        archetype: 'SENT_ON',
        source: 'share',
        post,
        dmJob: null,
        anchorMs: c.pubMs + hours(between(4, 96)),
        refClass: weighted([['whatsapp', 0.46], ['messages', 0.40], ['instagram_dm', 0.09], ['other', 0.05]]),
        via: rnd() < SHARER_ATTRIBUTION_RATE ? c.uid : null,
        tierPref: null,
      })
    }
  }
}

events.sort((a, b) => a.ts.localeCompare(b.ts))

// ------------------------------------------------------------------- reconcile
const bySource = s => events.filter(e => e.source === s)
const peopleIn = s => new Set(bySource(s).map(e => e.uid)).size
const totalSaves = posts.reduce((a, p) => a + p.saves, 0)

const report = {
  'people tracked': uidN,
  'link opens recorded': events.length,
  'from a caption link': `${peopleIn('post')} people`,
  'from a DM reply': `${peopleIn('dm')} people`,
  'from a friend passing it on': `${peopleIn('share')} people`,
  'assumed: savers who open a link': `${(100 * CLICK_RATE_OF_SAVERS).toFixed(0)}% of ${totalSaves.toLocaleString()} saves`,
  'assumed: DM replies carrying a link': DM_REPLIES_WITH_A_LINK.toLocaleString(),
  'shares where the sender is identifiable': `${(100 * SHARER_ATTRIBUTION_RATE).toFixed(0)}%`,
  'kinds of question tracked': DM_JOBS.length,
  'wardrobe pieces linked (of 36)': items.length,
}

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true })
const w = (f, d) => fs.writeFileSync(path.join(ROOT, 'data', f), JSON.stringify(d, null, 1))
w('items.json', items)
w('posts.json', posts)
w('dms.json', dms)
w('click-log.json', events)
w('ground-truth.json', truth)
w('reconciliation.json', report)
for (const stale of ['orders.json', 'redirect-log.json']) {
  fs.rmSync(path.join(ROOT, 'data', stale), { force: true })
}

console.log('\n  seed reconciliation\n  ' + '-'.repeat(54))
for (const [k, v] of Object.entries(report)) console.log(`  ${k.padEnd(44)} ${v}`)
console.log()
