'use client'

import { useState } from 'react'
import { londonTime } from '@/lib/time'

type Row = {
  uid: string; handle: string | null; item: string
  value: number; commission: number; daysAfterSeeing: number; ts: string
}

const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')
const day = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short' }).format(new Date(iso))

export function OwedList({ rows, total }: { rows: Row[]; total: number }) {
  const [copied, setCopied] = useState(false)

  const copyForBrand = () => {
    const lines = rows.map(r =>
      `${day(r.ts)}  ${r.item}  ${gbp(r.value)}  bought ${r.daysAfterSeeing.toFixed(1)} days after seeing the post`)
    const text = [
      `Sales from my posts that fell outside the 24-hour window:`,
      '',
      ...lines,
      '',
      `${total} sales in total. Commission owed at 10%: ${gbp(rows.reduce((a, r) => a + r.commission, 0))} (from this sample).`,
    ].join('\n')
    navigator.clipboard?.writeText(text).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000) },
      () => setCopied(false),
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <h2 className="text-lg font-semibold tracking-tight">The sales themselves</h2>
        <button
          type="button" onClick={copyForBrand}
          className="text-xs rounded-lg px-3 py-2 font-medium text-white ml-auto"
          style={{ background: 'var(--seg-4)' }}
        >
          {copied ? '✓ Copied — paste it to the brand' : 'Copy this list for the brand'}
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-ink-3">
              <th className="font-medium pb-2 pr-4">Who</th>
              <th className="font-medium pb-2 pr-4">Bought</th>
              <th className="font-medium pb-2 pr-4 text-right">Days after seeing it</th>
              <th className="font-medium pb-2 pr-4 text-right">They spent</th>
              <th className="font-medium pb-2 text-right">Your cut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.uid + i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-2.5 pr-4">
                  {r.handle
                    ? <span className="font-medium">@{r.handle}</span>
                    : <code className="text-xs text-ink-3">someone who didn&apos;t DM you</code>}
                  <span className="block text-[11px] text-ink-3">{day(r.ts)} · {londonTime(r.ts)}</span>
                </td>
                <td className="py-2.5 pr-4 text-ink-2">{r.item}</td>
                <td className="py-2.5 pr-4 text-right tnum">
                  <span style={{ color: 'var(--seg-4)' }}>{r.daysAfterSeeing.toFixed(1)}</span>
                </td>
                <td className="py-2.5 pr-4 text-right tnum text-ink-2">{gbp(r.value)}</td>
                <td className="py-2.5 text-right tnum font-semibold">{gbp(r.commission)}</td>
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
