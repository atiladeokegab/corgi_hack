import fs from 'node:fs'
import path from 'node:path'
import type { Item, Order, Post, RedirectEvent } from './types'

const DATA = path.join(process.cwd(), 'data')
const read = <T,>(f: string, fallback: T): T => {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')) as T }
  catch { return fallback }
}

export const LIVE_LOG = path.join(DATA, 'live-log.local.json')

export const getItems = (): Item[] => read<Item[]>('items.json', [])
export const getPosts = (): Post[] => read<Post[]>('posts.json', [])
export const getOrders = (): Order[] => read<Order[]>('orders.json', [])
export const getTruth = (): { uid: string; saves: number }[] => read<{ uid: string; saves: number }[]>('ground-truth.json', [])
export const getReconciliation = () => read<Record<string, string | number>>('reconciliation.json', {})

export const getLiveEvents = (): RedirectEvent[] => read<RedirectEvent[]>('live-log.local.json', [])

/** Seeded history plus anything the running redirect has recorded this session. */
export const getEvents = (): RedirectEvent[] =>
  [...read<RedirectEvent[]>('redirect-log.json', []), ...getLiveEvents()]
    .sort((a, b) => a.ts.localeCompare(b.ts))

export function appendLiveEvent(e: RedirectEvent) {
  const all = getLiveEvents()
  all.push(e)
  fs.mkdirSync(DATA, { recursive: true })
  fs.writeFileSync(LIVE_LOG, JSON.stringify(all, null, 1))
}
