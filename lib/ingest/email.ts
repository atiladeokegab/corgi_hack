// A real connection needs provider OAuth/IMAP credentials, mailbox-read scope and a messages endpoint or IMAP host.
import { fixtureMessages, type SourceAdapter } from './types'

export const emailAdapter: SourceAdapter = {
  platform: 'email',
  isLive: false,
  describe: () => 'Synthetic stand-in: connect a scoped mailbox or provider webhook.',
  fetch: () => fixtureMessages('email'),
}
