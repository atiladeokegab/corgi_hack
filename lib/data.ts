import fs from 'node:fs'
import path from 'node:path'
import type { ClickEvent, Dm, Item, Post } from './types'

const DATA = path.join(process.cwd(), 'data')
const read = <T,>(f: string, fallback: T): T => {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')) as T }
  catch { return fallback }
}

export const getItems = (): Item[] => read<Item[]>('items.json', [])
export const getPosts = (): Post[] => read<Post[]>('posts.json', [])
export const getDms = (): Dm[] => read<Dm[]>('dms.json', [])
export const getCustomers = (): { uid: string; orders: number; totalSpent: number }[] =>
  read<{ uid: string; orders: number; totalSpent: number }[]>('customers.json', [])
export const getTruth = () => read<{ uid: string; archetype: string }[]>('ground-truth.json', [])
export const getReconciliation = () => read<Record<string, string | number>>('reconciliation.json', {})

export const getLiveEvents = (): ClickEvent[] => read<ClickEvent[]>('live-log.local.json', [])

/** Seeded history plus anything the running redirect has recorded this session. */
export const getEvents = (): ClickEvent[] =>
  [...read<ClickEvent[]>('click-log.json', []), ...getLiveEvents()]
    .sort((a, b) => a.ts.localeCompare(b.ts))

export function appendLiveEvent(e: ClickEvent) {
  const all = getLiveEvents()
  all.push(e)
  fs.mkdirSync(DATA, { recursive: true })
  fs.writeFileSync(path.join(DATA, 'live-log.local.json'), JSON.stringify(all, null, 1))
}
