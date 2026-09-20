// Generates a synthetic redirect log + brand order table from the case-file evidence.
//
// Everything here is SYNTHETIC. What it is not allowed to do is contradict the
// evidence: post-level views/saves/purchases come straight out of broadcast-log.csv,
// item prices out of wardrobe.csv, and the behavioural mix is tuned until it
// reproduces the four E-09 statistics. If the printed reconciliation at the bottom
// drifts, the data is wrong, not the case file.
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
const weighted = table => {
  let r = rnd(), acc = 0
  for (const [k, w] of table) { acc += w; if (r <= acc) return k }
  return table[table.length - 1][0]
}

// ---------------------------------------------------------------- evidence in
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const items = ev('wardrobe.csv').map(r => ({
  slug: slug(r.item),
  ref: r.ref,
  name: r.item,
  category: r.category,
  price: Number(r.price_gbp),
  size: r.size,
  style: r.style,
  status: r.status,
  sofiaSays: r.sofia_says,
  // Placeholder storefront. Swap for real affiliate destinations.
  destination: `https://www.net-a-porter.com/en-gb/shop/search?q=${encodeURIComponent(r.item)}`,
}))
const itemBySlug = Object.fromEntries(items.map(i => [i.slug, i]))

// Which items each post links to is not in the CSVs; it is read off E-03 titles and
// E-05.6 (her most curated post converts best, her sprawling one converts worst).
const POST_META = {
  'E-03.1': { publishedAt: '2026-08-13', items: ['red-slingback', 'wide-leg-denim', 'vintage-leather'] },
  'E-03.2': { publishedAt: '2026-08-04', items: ['silk-skirt', 'white-tee', 'grey-knit', 'wide-leg-denim', 'vintage-leather'] },
  'E-03.3': { publishedAt: '2026-08-29', items: ['white-tee', 'red-slingback'] },
  'E-03.4': { publishedAt: '2026-09-05', items: ['black-blazer'] },
  'E-03.5': { publishedAt: '2026-08-22', items: ['grey-knit'] },
}

const posts = ev('broadcast-log.csv').map(r => ({
  ref: r.ref,
  title: r.post,
  views: Number(r.views),
  saves: Number(r.saves),
  purchases: Number(r.purchases),
  organiserLabel: r.organiser_label,
  ...POST_META[r.ref],
  linkCount: POST_META[r.ref].items.length,
}))

// ------------------------------------------------------------------- behaviour
// Archetypes are the four tracked audience members in E-07, plus the two paths the
// evidence implies but does not name: the friend on the receiving end of Ella's
// share, and the fast clicker who is the only person Sofia can currently measure.
const ARCHETYPES = {
  CLICKER:  { share: 0.345, lag: [0.05, 1.0],  saves: [1, 2], returns: [0, 1], priceBias: 'low'  },
  FRIEND:   { share: 0.34, lag: [0.40, 9.2],  saves: [0, 2], returns: [0, 2], priceBias: 'mid'  },
  ELLA:     { share: 0.075, lag: [2.0, 6.0],   saves: [4, 9], returns: [2, 5], priceBias: 'mid'  },
  PRIYA:    { share: 0.11, lag: [3.0, 8.0],   saves: [4, 9], returns: [2, 4], priceBias: 'high' },
  CLARA:    { share: 0.06, lag: [2.0, 9.0],   saves: [5, 9], returns: [4, 7], priceBias: 'high' },
  JAMIE:    { share: 0.07, lag: [5.0, 12.0],  saves: [3, 7], returns: [3, 8], priceBias: 'mid'  },
}

// Share of engaged non-purchasers who save heavily. Saves are the strongest
// predictor of purchase in E-09 (2.2x), so this is the knob that reproduces it.
const BROWSER_HEAVY_SAVER_RATE = 0.122
const PURCHASE_MIX = Object.entries(ARCHETYPES).map(([k, v]) => [k, v.share])

// Affiliate networks credit a sale only if the purchase lands inside the cookie
// window measured from the LAST click. 24h is typical for creator-commerce
// networks. E-09's "did not click Sofia's affiliate link" is read here as "had no
// attributable click before buying" — most of these people did pass through her
// link, days earlier, outside the window. That is the gap her own redirect closes.
const AFFILIATE_COOKIE_HOURS = 24

const REFERRERS = {
  instagram:     ['https://l.instagram.com/', 'https://www.instagram.com/'],
  instagram_dm:  ['https://l.instagram.com/?dm=1'],
  whatsapp:      ['https://web.whatsapp.com/', 'android-app://com.whatsapp'],
  messages:      [''],            // iMessage strips the referrer entirely
  direct:        [''],
  other:         ['https://www.pinterest.co.uk/', 'https://mail.google.com/'],
}
const refClassFor = archetype => {
  if (archetype === 'FRIEND') return weighted([['whatsapp', 0.45], ['messages', 0.38], ['instagram_dm', 0.12], ['other', 0.05]])
  if (archetype === 'JAMIE') return weighted([['instagram', 0.6], ['instagram_dm', 0.35], ['direct', 0.05]])
  return weighted([['instagram', 0.82], ['instagram_dm', 0.12], ['direct', 0.06]])
}

const DEVICES = ['ios-safari', 'ios-instagram', 'android-chrome', 'desktop-chrome']
const hours = h => h * 3600 * 1000
const iso = ms => new Date(ms).toISOString()

let uidN = 0
const nextUid = () => `u_${(++uidN).toString(36).padStart(5, '0')}`

const events = []
const orders = []
const truth = []
let orderN = 0

// A share only carries a sharer id when the link that travelled was still Sofia's
// redirect URL (a ManyChat DM reply, a forwarded story link). If the friend copied
// the destination out of their address bar instead, the trail is anonymous. So the
// segment is always sizeable; the individual sharer is identifiable ~55% of the time.
const SHARER_ATTRIBUTION_RATE = 0.55

const BROWSER_MIX = [['CLICKER', 0.600], ['FRIEND', 0.273], ['JAMIE', 0.060], ['PRIYA', 0.045], ['ELLA', 0.022]]

function priceFor(post, bias) {
  const sorted = post.items.map(s => itemBySlug[s]).filter(Boolean).sort((a, b) => a.price - b.price)
  const n = sorted.length
  // Skewed rather than deterministic: a bargain-hunter still occasionally splurges.
  const u = rnd()
  const t = bias === 'low' ? Math.pow(u, 1.8) : bias === 'high' ? 1 - Math.pow(u, 1.8) : u
  return sorted[Math.min(n - 1, Math.floor(t * n))]
}

function emit(uid, ts, item, post, refClass, via) {
  events.push({
    id: `e_${events.length.toString(36)}`,
    ts: iso(ts),
    uid,
    slug: item.slug,
    postRef: post.ref,
    via: via ?? null,
    refClass,
    referrer: pick(REFERRERS[refClass]),
    device: pick(DEVICES),
  })
}

for (const post of posts) {
  const pubMs = Date.parse(post.publishedAt + 'T09:00:00Z')

  // Pass 1 — assign every person in this post's cohort an archetype and an id, so
  // that the sharers exist before the people they share to.
  const cohort = []
  for (let i = 0; i < post.purchases; i++) {
    cohort.push({ uid: nextUid(), archetype: weighted(PURCHASE_MIX), purchased: true })
  }
  const browsers = Math.round(post.saves / 9)
  for (let i = 0; i < browsers; i++) {
    cohort.push({ uid: nextUid(), archetype: weighted(BROWSER_MIX), purchased: false })
  }
  const ellaPool = cohort.filter(c => c.archetype === 'ELLA').map(c => c.uid)

  // Pass 2 — emit the redirect events and the brand orders.
  for (const person of cohort) {
    const { uid, archetype, purchased } = person
    const spec = ARCHETYPES[archetype]
    const item = priceFor(post, spec.priceBias)
    const returns = Math.round(between(spec.returns[0], spec.returns[1]))
    const refClass = refClassFor(archetype)
    const via = archetype === 'FRIEND' && ellaPool.length && rnd() < SHARER_ATTRIBUTION_RATE
      ? pick(ellaPool)
      : null

    if (purchased) {
      const daysToBuy = between(spec.lag[0], spec.lag[1])
      const firstTouch = pubMs + hours(between(0.2, 18))
      const buyAt = firstTouch + hours(daysToBuy * 24)
      // CLARA never touches the link at all. Her order exists only in the brand's table.
      const inLog = archetype !== 'CLARA'
      if (inLog) {
        emit(uid, firstTouch, item, post, refClass, via)
        for (let r = 0; r < returns; r++) {
          emit(uid, firstTouch + hours(between(6, daysToBuy * 24 + 36)), item, post, refClass, via)
        }
      }
      orders.push({
        orderId: `o_${(++orderN).toString(36).padStart(5, '0')}`,
        ts: iso(buyAt),
        slug: item.slug,
        value: item.price,
        subid: inLog ? uid : null,          // what her own redirect can attribute
        affiliateCredited: inLog && daysToBuy * 24 <= AFFILIATE_COOKIE_HOURS, // what she was paid for
        postRef: post.ref,
      })
      truth.push({ uid, archetype, saves: Math.round(between(spec.saves[0], spec.saves[1])), returns, purchased: true, daysToBuy: +daysToBuy.toFixed(2), inLog })
    } else {
      const firstTouch = pubMs + hours(between(0.2, 60))
      emit(uid, firstTouch, item, post, refClass, via)
      for (let r = 0; r < returns; r++) emit(uid, firstTouch + hours(between(6, 260)), item, post, refClass, null)
      const saves = Math.round(between(spec.saves[0], spec.saves[1]))
      truth.push({ uid, archetype, saves, returns, purchased: false, daysToBuy: null, inLog: true })
    }
  }
}

events.sort((a, b) => a.ts.localeCompare(b.ts))
orders.sort((a, b) => a.ts.localeCompare(b.ts))

// ------------------------------------------------------------------ reconcile
const median = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
const buyers = truth.filter(t => t.purchased)
const highValue = orders.filter(o => o.value >= 110)
const shareLinked = buyers.filter(b => b.archetype === 'FRIEND' || b.archetype === 'ELLA')
const savers3 = truth.filter(t => t.saves >= 3)
const savers0 = truth.filter(t => t.saves < 3)
const rate = g => g.length ? g.filter(t => t.purchased).length / g.length : 0

const report = {
  'purchases total (broadcast-log = 1048)': orders.length,
  'E-09  62% of high-value purchasers not credited': `${(100 * highValue.filter(o => !o.affiliateCredited).length / highValue.length).toFixed(1)}%`,
  'E-09  3.4d median days-to-buy': median(buyers.map(b => b.daysToBuy)).toFixed(2),
  'E-09  41% of purchases follow a share': `${(100 * shareLinked.length / buyers.length).toFixed(1)}%`,
  'E-09  2.2x purchase rate at 3+ saves': (rate(savers3) / rate(savers0)).toFixed(2) + 'x',
  'redirect events': events.length,
  'tracked uids': uidN,
  'revenue seen by affiliate network': '£' + orders.filter(o => o.affiliateCredited).reduce((a, o) => a + o.value, 0).toLocaleString(),
  'revenue seen by her own redirect': '£' + orders.filter(o => o.subid).reduce((a, o) => a + o.value, 0).toLocaleString(),
  'revenue invisible to both (Clara path)': '£' + orders.filter(o => !o.subid).reduce((a, o) => a + o.value, 0).toLocaleString(),
}

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true })
const w = (f, d) => fs.writeFileSync(path.join(ROOT, 'data', f), JSON.stringify(d, null, 1))
w('items.json', items)
w('posts.json', posts)
w('redirect-log.json', events)
w('orders.json', orders)
w('ground-truth.json', truth)
w('reconciliation.json', report)

console.log('\n  seed reconciliation\n  ' + '-'.repeat(52))
for (const [k, v] of Object.entries(report)) console.log(`  ${k.padEnd(46)} ${v}`)
console.log()
