// A real connection needs OAuth, a DM-read scope and a DM-list endpoint; TikTok currently offers no public DM API.
import { fixtureMessages, type SourceAdapter } from './types'

export const tiktokAdapter: SourceAdapter = {
  platform: 'tiktok',
  isLive: false,
  describe: () => 'Synthetic stand-in: TikTok does not publish a direct-message API.',
  fetch: () => fixtureMessages('tiktok'),
}
