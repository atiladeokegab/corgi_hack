import { emailAdapter } from './email'
import { instagramAdapter } from './instagram'
import { tiktokAdapter } from './tiktok'
import { readFixtureStore, writeFixtureStore, type SourceAdapter, type UnifiedMessage } from './types'
import { youtubeAdapter } from './youtube'

export const adapters: SourceAdapter[] = [
  instagramAdapter,
  tiktokAdapter,
  youtubeAdapter,
  emailAdapter,
]

export async function ingestAll(): Promise<UnifiedMessage[]> {
  const messageSets = await Promise.all(adapters.map(adapter => adapter.fetch()))
  return messageSets.flat().sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
}

export async function appendReceivedMessage(message: UnifiedMessage): Promise<void> {
  const store = await readFixtureStore()
  store.received.push(message)
  await writeFixtureStore(store)
}

export type { Platform, SourceAdapter, UnifiedMessage } from './types'
export { normaliseMessage } from './types'
