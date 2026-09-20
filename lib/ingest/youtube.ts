// A real connection would need Google OAuth, a message-read scope and endpoint; YouTube has no direct-message product or API.
import { fixtureMessages, type SourceAdapter } from './types'

export const youtubeAdapter: SourceAdapter = {
  platform: 'youtube',
  isLive: false,
  describe: () => 'Synthetic stand-in: YouTube has comments, but no direct messages.',
  fetch: () => fixtureMessages('youtube'),
}
