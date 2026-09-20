import fs from 'node:fs/promises'
import path from 'node:path'

export type Platform = 'instagram' | 'tiktok' | 'youtube' | 'email'

export interface UnifiedMessage {
  id: string
  platform: Platform
  externalId: string
  handle: string
  receivedAt: string
  text: string
  subscriberId: string | null
  raw: unknown
}

export interface SourceAdapter {
  platform: Platform
  isLive: boolean
  describe(): string
  fetch(): Promise<UnifiedMessage[]>
}

type IncomingMessage = Partial<Omit<UnifiedMessage, 'platform' | 'raw'>> & {
  platform?: Platform
  raw?: unknown
}

const platforms: Platform[] = ['instagram', 'tiktok', 'youtube', 'email']
const fixturePath = path.join(process.cwd(), 'data', 'ingest-fixtures.json')

export type FixtureStore = {
  synthetic: UnifiedMessage[]
  received: UnifiedMessage[]
}

export async function readFixtureStore(): Promise<FixtureStore> {
  const parsed = JSON.parse(await fs.readFile(fixturePath, 'utf8')) as Partial<FixtureStore>
  return { synthetic: parsed.synthetic ?? [], received: parsed.received ?? [] }
}

export async function fixtureMessages(platform: Platform): Promise<UnifiedMessage[]> {
  const store = await readFixtureStore()
  return [...store.synthetic, ...store.received].filter(message => message.platform === platform)
}

export async function writeFixtureStore(store: FixtureStore): Promise<void> {
  await fs.writeFile(fixturePath, `${JSON.stringify(store, null, 2)}\n`)
}

export function normaliseMessage(
  input: IncomingMessage,
  fallbackPlatform?: Platform,
): UnifiedMessage {
  const platform = input.platform ?? fallbackPlatform
  if (!platform || !platforms.includes(platform)) {
    throw new Error('platform must be instagram, tiktok, youtube or email')
  }

  const externalId = String(input.externalId ?? input.id ?? crypto.randomUUID())
  const text = String(input.text ?? '').trim()
  if (!text) throw new Error('text is required')

  return {
    id: String(input.id ?? `${platform}:${externalId}`),
    platform,
    externalId,
    handle: String(input.handle ?? 'unknown'),
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    text,
    subscriberId: input.subscriberId ? String(input.subscriberId) : null,
    raw: input.raw ?? input,
  }
}
