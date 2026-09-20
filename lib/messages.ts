import fs from 'node:fs'
import path from 'node:path'
import type { SegmentKey } from './types'

const FILE = path.join(process.cwd(), 'data', 'messages.json')

/**
 * One message per group. {link} is replaced with that person's own tagged link
 * when the send runs, so every recipient gets a link that knows who they are.
 *
 * Written in her voice, not a marketer's — the whole asset is that her audience
 * believes a person wrote it. "If I wouldn't text this to my sister, I don't link it."
 */
export const DEFAULT_MESSAGES: Record<SegmentKey, string> = {
  CONNECTOR:
    "here's the blazer — {link}\nhonestly though, you know who'd wear this better than me. send it on, I don't mind at all x",
  RESEARCHER:
    "here you go — {link}\nI'm a UK 8 and took my normal size, it's properly tailored so there's no give in the shoulders. worn it twice a week since January. if you're still deciding in a few days, that's usually a yes tbh",
  REGULAR:
    "{link} — this one.\nyou've been through most of my stuff by now so you'll know: this is the one I actually reach for. goes with the wide-leg denim too",
  SENT_ON:
    "someone's got good taste sending you this — {link}\nno pressure at all, but the rest of the outfit's in my highlights x",
  QUICK:
    "{link} — that's the one x",
  BROWSING:
    "{link} — here you go x",
}

export function getMessages(): Record<SegmentKey, string> {
  try {
    return { ...DEFAULT_MESSAGES, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }
  } catch {
    return { ...DEFAULT_MESSAGES }
  }
}

export function saveMessages(next: Partial<Record<SegmentKey, string>>) {
  const merged = { ...getMessages(), ...next }
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(merged, null, 1))
  return merged
}
