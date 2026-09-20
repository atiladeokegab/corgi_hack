import { LiveFeed } from './components/LiveFeed'
import { getEvents, getItems, getOrders, getPosts, getReconciliation, getTruth } from '@/lib/data'
import { buildProfiles, SEGMENTS } from '@/lib/classify'
import { bySegment, byPost, headline, saveProxyAccuracy, topConnectors } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')
const pct = (n: number, d = 0) => (n * 100).toFixed(d) + '%'
const num = (n: number) => n.toLocaleString('en-GB')

function Section({ kicker, title, sub, children }: {
  kicker: string; title: string; sub?: string; children: React.ReactNode
}) {
  return (
    <section className="mt-14">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">{kicker}</p>
      <h2 className="text-xl sm:text-2xl font-semibold mt-1.5 tracking-tight">{title}</h2>
      {sub && <p className="text-sm text-ink-2 mt-2 max-w-2xl leading-relaxed">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Tile({ label, value, foot, accent }: {
  label: string; value: string; foot: string; accent?: string
}) {
  return (
    <div
      className="rounded-xl border p-4 bg-surface-2"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2">
        {accent && <span className="size-2 rounded-full" style={{ background: accent }} />}
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-semibold mt-2 tnum tracking-tight">{value}</p>
      <p className="text-xs text-ink-3 mt-1.5 leading-snug">{foot}</p>
    </div>
  )
}

/** Inline magnitude bar — sequential single hue, 4px rounded end, anchored left. */
function Bar({ value, max, color = 'var(--series-credited)' }: {
  value: number; max: number; color?: string
}) {
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: 'var(--grid)' }}>
      <div
        className="h-1.5 rounded-full"
        style={{ width: `${max ? Math.max(1.5, (value / max) * 100) : 0}%`, background: color }}
      />
    </div>
  )
}

export default function Page() {
  const posts = getPosts()
  const orders = getOrders()
  const events = getEvents()
  const items = getItems()
  const profiles = buildProfiles(events, orders, posts)

  const h = headline(orders)
  const segs = bySegment(profiles, orders)
  const postRows = byPost(posts, orders, profiles)
  const connectors = topConnectors(profiles, 6)
  const proxy = saveProxyAccuracy(profiles, getTruth())
  const recon = getReconciliation()

  const maxRevenue = Math.max(...postRows.map(p => p.revenue))
  const maxSegValue = Math.max(...segs.map(s => s.totalValue))
  const recovered = h.ownRedirect - h.affiliate
  const stack = [
    { label: 'Paid out by the affiliate network', value: h.affiliate, color: 'var(--series-credited)' },
    { label: 'Recovered by her own redirect', value: recovered, color: 'var(--series-recovered)' },
    { label: 'Still invisible', value: h.untouched, color: 'var(--series-dark)' },
  ]

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">

      <header>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          Operation Lookbook · Case 002
        </p>
        <h1 className="text-3xl sm:text-[2.6rem] font-semibold mt-2 tracking-tight leading-[1.1]">
          Sofia is paid for {pct(1 - h.blindSpotPct)} of what she sells.
        </h1>
        <p className="text-base text-ink-2 mt-4 max-w-2xl leading-relaxed">
          Her affiliate dashboard credits a sale only if it lands inside a 24-hour click window.
          The median purchase arrives <strong className="font-semibold text-foreground">3.4 days</strong> after
          she posts. Everything in between is real revenue she cannot see, cannot get paid for,
          and cannot learn from.
        </p>
      </header>

      {/* Hero figure — the one number the dashboard leads with */}
      <div className="mt-9 rounded-2xl border p-6 sm:p-8 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-3 font-medium">
          Revenue her affiliate dashboard never reports
        </p>
        <p className="text-5xl sm:text-6xl font-semibold mt-3 tnum tracking-tight">{gbp(h.blindSpot)}</p>
        <p className="text-sm text-ink-2 mt-3">
          of {gbp(h.total)} across {num(h.orders)} purchases · {pct(h.blindSpotPct)} of her sales
        </p>

        {/* Part-to-whole: one total, three fates. Every segment direct-labelled, so
            identity never rests on colour alone. */}
        <div className="mt-7 flex gap-0.5 h-9">
          {stack.map(s => (
            <div
              key={s.label}
              className="first:rounded-l-md last:rounded-r-md"
              style={{ width: `${(s.value / h.total) * 100}%`, background: s.color }}
              title={`${s.label}: ${gbp(s.value)}`}
            />
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4">
          {stack.map(s => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="size-2 rounded-full shrink-0 translate-y-[-1px]" style={{ background: s.color }} />
              <dt className="text-xs text-ink-2 leading-snug">{s.label}</dt>
              <dd className="text-xs font-semibold tnum ml-auto sm:ml-0">{gbp(s.value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          label="Recovered"
          value={gbp(recovered)}
          foot={`${pct(h.recoveredPct)} of revenue, restored by a cookie that outlives the affiliate window`}
          accent="var(--series-recovered)"
        />
        <Tile
          label="Tracked people"
          value={num(profiles.length)}
          foot="Anonymous ids. No login, no form, no page to visit."
        />
        <Tile
          label="Save signal recovered"
          value={pct(proxy.recall)}
          foot={`Instagram never says who saved. Return visits catch ${pct(proxy.recall)} of savers at ${pct(proxy.precision)} precision.`}
        />
        <Tile
          label="Median days to buy"
          value={String(recon['E-09  3.4d median days-to-buy'] ?? '—')}
          foot="Against a 24-hour attribution window."
        />
      </div>

      <Section
        kicker="The answer"
        title="Who is actually important"
        sub="Segments are inferred from four things a redirect can see — its own cookie, the timestamp, the Referer header, and which link was asked for. Nothing the audience has to fill in. Connectors are credited with what the people they shared to went on to spend."
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm border-collapse min-w-[760px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <th className="font-medium pb-2 pr-4">Segment</th>
                <th className="font-medium pb-2 pr-4">Evidence</th>
                <th className="font-medium pb-2 pr-4 text-right">People</th>
                <th className="font-medium pb-2 pr-4 text-right">Value</th>
                <th className="font-medium pb-2 pr-4 w-40">Share of revenue</th>
                <th className="font-medium pb-2 pr-4 text-right">Avg order</th>
                <th className="font-medium pb-2 text-right">Affiliate sees</th>
              </tr>
            </thead>
            <tbody>
              {segs.map(s => (
                <tr key={s.key} className="border-t align-top" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-3 pr-4">
                    <p className="font-medium">{s.label}</p>
                    <p className="text-xs text-ink-3 mt-0.5 max-w-[19rem] leading-snug">{s.blurb}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-3 whitespace-nowrap">{s.evidence}</td>
                  <td className="py-3 pr-4 text-right tnum">{num(s.people)}</td>
                  <td className="py-3 pr-4 text-right tnum font-medium">
                    {gbp(s.totalValue)}
                    {s.influenced > 0 && (
                      <span className="block text-[11px] text-ink-3 font-normal">
                        incl. {gbp(s.influenced)} via friends
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Bar value={s.totalValue} max={maxSegValue} />
                    <span className="text-[11px] text-ink-3 tnum mt-1 block">{pct(s.shareOfRevenue, 1)}</span>
                  </td>
                  <td className="py-3 pr-4 text-right tnum">{s.avgOrder ? gbp(s.avgOrder) : '—'}</td>
                  <td className="py-3 text-right tnum">
                    <span style={{ color: s.pctAffiliateCredited < 0.25 ? 'var(--series-dark)' : undefined }}>
                      {s.buyers ? pct(s.pctAffiliateCredited) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-3 pr-4">
                  <p className="font-medium">Never touched a link</p>
                  <p className="text-xs text-ink-3 mt-0.5 max-w-[19rem] leading-snug">
                    Saw the post, went to the retailer directly. Sized by subtraction from the
                    brand&apos;s order table — real revenue, no individuals attached.
                  </p>
                </td>
                <td className="py-3 pr-4 text-xs text-ink-3 whitespace-nowrap">E-07.1 Clara</td>
                <td className="py-3 pr-4 text-right tnum text-ink-3">unknown</td>
                <td className="py-3 pr-4 text-right tnum font-medium">{gbp(h.untouched)}</td>
                <td className="py-3 pr-4">
                  <Bar value={h.untouched} max={maxSegValue} color="var(--series-dark)" />
                  <span className="text-[11px] text-ink-3 tnum mt-1 block">
                    {pct(h.untouched / h.total, 1)}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right tnum text-ink-3">—</td>
                <td className="py-3 text-right tnum" style={{ color: 'var(--series-dark)' }}>0%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-3 mt-4 max-w-2xl leading-relaxed">
          The rightmost column is the point. The one segment her affiliate dashboard reports
          almost completely — The Impulse — is also the one that spends the least per order.
          She has been optimising against her cheapest customer because they are the only one
          she could measure. Two rows have no revenue beside them and both are instructions:
          The Regular is {num(segs.find(s => s.key === 'REGULAR')?.people ?? 0)} people who keep
          coming back and have never once bought, and Never touched a link is {gbp(h.untouched)}
          she is already earning from people she cannot see at all.
        </p>
      </Section>

      <Section
        kicker="Named, not just sized"
        title="Her highest-value connectors"
        sub="A share only carries a sharer id when the link that travelled was still Sofia's redirect URL — a DM reply, a forwarded story. When the friend copies the destination out of their address bar instead, the trail is anonymous. The segment is always sizeable; the individual is identifiable about half the time."
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <th className="font-medium pb-2 pr-4">Anon id</th>
                <th className="font-medium pb-2 pr-4 text-right">Shared to</th>
                <th className="font-medium pb-2 pr-4 text-right">Friends who bought</th>
                <th className="font-medium pb-2 pr-4 text-right">Own spend</th>
                <th className="font-medium pb-2 text-right">Revenue they caused</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map(c => (
                <tr key={c.uid} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2.5 pr-4"><code className="text-xs">{c.uid}</code></td>
                  <td className="py-2.5 pr-4 text-right tnum">{c.sharedTo}</td>
                  <td className="py-2.5 pr-4 text-right tnum">{c.buyers}</td>
                  <td className="py-2.5 pr-4 text-right tnum text-ink-2">{gbp(c.ownRevenue)}</td>
                  <td className="py-2.5 text-right tnum font-semibold" style={{ color: 'var(--series-recovered)' }}>
                    {gbp(c.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        kicker="The reranking"
        title="Instagram's best post is not her best post"
        sub="Reach and revenue disagree, and E-05.6 says why: her most curated post carries one link, her widest post carries five. The column that matters is revenue per thousand views."
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm border-collapse min-w-[820px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <th className="font-medium pb-2 pr-4">Post</th>
                <th className="font-medium pb-2 pr-4 text-right">Links</th>
                <th className="font-medium pb-2 pr-4 text-right">Views</th>
                <th className="font-medium pb-2 pr-4 text-center">IG rank</th>
                <th className="font-medium pb-2 pr-4 text-center">£ rank</th>
                <th className="font-medium pb-2 pr-4 w-36">Revenue</th>
                <th className="font-medium pb-2 pr-4 text-right">£ / 1k views</th>
                <th className="font-medium pb-2 text-right">Recruits</th>
              </tr>
            </thead>
            <tbody>
              {postRows.map(p => {
                const moved = p.rankByViews - p.rankByRevenue
                return (
                  <tr key={p.ref} className="border-t align-top" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 pr-4">
                      <p className="font-medium max-w-[17rem] leading-snug">{p.title}</p>
                      <p className="text-[11px] text-ink-3 mt-0.5">{p.ref} · {p.organiserLabel}</p>
                    </td>
                    <td className="py-3 pr-4 text-right tnum">{p.linkCount}</td>
                    <td className="py-3 pr-4 text-right tnum text-ink-2">{num(p.views)}</td>
                    <td className="py-3 pr-4 text-center tnum text-ink-3">#{p.rankByViews}</td>
                    <td className="py-3 pr-4 text-center tnum font-semibold">
                      #{p.rankByRevenue}
                      {moved !== 0 && (
                        <span
                          className="block text-[11px] font-normal"
                          style={{ color: moved > 0 ? 'var(--series-recovered)' : 'var(--series-dark)' }}
                        >
                          {moved > 0 ? `▲${moved}` : `▼${-moved}`}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Bar value={p.revenue} max={maxRevenue} />
                      <span className="text-[11px] text-ink-3 tnum mt-1 block">{gbp(p.revenue)}</span>
                    </td>
                    <td className="py-3 pr-4 text-right tnum font-medium">{gbp(p.revenuePer1kViews)}</td>
                    <td className="py-3 text-right text-xs text-ink-2">
                      {p.topSegment ? SEGMENTS[p.topSegment].label : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        kicker="It actually runs"
        title="The redirect, live"
        sub="These are real endpoints. Opening one sets a one-year cookie, classifies the Referer, records the hit and bounces to the retailer with a subid attached. ?dry=1 shows the recorded row instead of leaving the site. Add &src=whatsapp to arrive as a friend rather than a follower."
      >
        <div className="flex flex-wrap gap-2">
          {items.slice(0, 5).map(i => (
            <a
              key={i.slug}
              href={`/r/${i.slug}?p=E-03.4&dry=1`}
              target="_blank"
              rel="noreferrer"
              className="text-xs rounded-lg border px-3 py-2 hover:bg-surface-2 transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <code>/r/{i.slug}</code>
              <span className="text-ink-3 ml-2">{i.name}</span>
            </a>
          ))}
          <a
            href="/r/black-blazer?p=E-03.4&src=whatsapp&dry=1"
            target="_blank"
            rel="noreferrer"
            className="text-xs rounded-lg border px-3 py-2 hover:bg-surface-2 transition-colors"
            style={{ borderColor: 'var(--series-recovered)', color: 'var(--series-recovered)' }}
          >
            <code>/r/black-blazer</code>
            <span className="ml-2">arriving as a shared link</span>
          </a>
        </div>
        <div className="mt-5 rounded-xl border px-4 bg-surface-2" style={{ borderColor: 'var(--border)' }}>
          <LiveFeed />
        </div>
      </Section>

      <Section
        kicker="Provenance"
        title="Every number here reconciles to the case file"
        sub="The behavioural log is synthetic — no such dataset was provided, and Instagram does not expose per-person saves or shares to anyone. What it is not allowed to do is contradict the evidence: post totals come from E-03, prices from E-04, and the generator is tuned until it reproduces the four E-09 statistics."
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
          {Object.entries(recon).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3 border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
              <dt className="text-ink-2 text-xs leading-snug">{k}</dt>
              <dd className="ml-auto font-semibold tnum text-xs whitespace-nowrap">{String(v)}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-ink-3 mt-5 max-w-2xl leading-relaxed">
          Known gaps, stated rather than papered over: wardrobe.csv is 8 of 36 items; E-04&apos;s
          numeric &ldquo;Sofia rating&rdquo; does not exist in the printed evidence, so nothing here
          invents one; intent.csv&apos;s link_click column is deliberately incomplete, which is the
          puzzle this instruments rather than a bug to clean.
        </p>
      </Section>

      <footer className="mt-16 pt-6 border-t text-sm text-ink-2" style={{ borderColor: 'var(--border)' }}>
        <p className="max-w-2xl leading-relaxed">
          <strong className="text-foreground font-semibold">Sofia no longer needs to guess who her
          audience is</strong> — because the people who never click are now the ones she can see.
        </p>
      </footer>
    </main>
  )
}
