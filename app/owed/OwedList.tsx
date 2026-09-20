'use client'

import { useState } from 'react'
import { londonTime } from '@/lib/time'

type Row = {
  uid: string; handle: string | null; item: string
  firstTs: string; lastTs: string; daysApart: number; opens: number
}

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')
const day = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short' }).format(new Date(iso))

export function OwedList({ rows, total, estimate }: { rows: Row[]; total: number; estimate: number }) {
  const [copied, setCopied] = useState(false)

  const copyForBrand = () => {
    const text = [
      `Hi — a note on attribution.`,
      ``,
      `${total.toLocaleString('en-GB')} people who clicked my links came back to them more than`,
      `24 hours after the first visit. The affiliate window closes at 24 hours, so any of`,
      `those who went on to buy were not credited to me.`,
      ``,
      `Based on the conversion rate my own affiliate statement shows, that is roughly`,
      `${gbp(estimate)} in commission that went uncredited.`,
      ``,
      `Could we set up a discount code in my name? A code stays on the order regardless`,
      `of when they buy, so we would both be able to see which sales came from my posts.`,
    ].join('\n')
    navigator.clipboard?.writeText(text).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2200) },
      () => setCopied(false),
    )
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <h2 className="text-lg font-semibold tracking-tight">The people themselves</h2>
        <button
          type="button" onClick={copyForBrand}
          className="text-xs rounded-lg px-3 py-2 font-medium text-white ml-auto"
          style={{ background: 'var(--seg-4)' }}
        >
          {copied ? '✓ Copied — send it to the brand' : 'Write the brand a message about this'}
        </button>
      </div>
      <p className="text-sm text-ink-2 mb-4 max-w-2xl leading-relaxed">
        Real people and real timestamps, from your own affiliate links. Whether each one
        bought is the part nobody can see.
      </p>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm border-collapse min-w-[620px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
              <th className="font-medium pb-2 pr-4">Who</th>
              <th className="font-medium pb-2 pr-4">Kept looking at</th>
              <th className="font-medium pb-2 pr-4 text-right">First click</th>
              <th className="font-medium pb-2 pr-4 text-right">Came back</th>
              <th className="font-medium pb-2 text-right">Days apart</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.uid} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2.5 pr-4">
                  {r.handle
                    ? <span className="font-medium">@{r.handle}</span>
                    : <span className="text-xs text-ink-3">someone who never messaged you</span>}
                  <span className="block text-[11px] text-ink-3">{r.opens} opens</span>
                </td>
                <td className="py-2.5 pr-4 text-ink-2">{r.item}</td>
                <td className="py-2.5 pr-4 text-right text-xs text-ink-3 whitespace-nowrap">
                  {day(r.firstTs)} · {londonTime(r.firstTs)}
                </td>
                <td className="py-2.5 pr-4 text-right text-xs text-ink-3 whitespace-nowrap">
                  {day(r.lastTs)} · {londonTime(r.lastTs)}
                </td>
                <td className="py-2.5 text-right tnum font-semibold" style={{ color: 'var(--seg-4)' }}>
                  {r.daysApart.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > rows.length && (
        <p className="text-xs text-ink-3 mt-4">
          Showing the {rows.length} most recent of {total.toLocaleString('en-GB')}.
        </p>
      )}
    </div>
  )
}
