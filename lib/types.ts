export type RefClass = 'instagram' | 'instagram_dm' | 'whatsapp' | 'messages' | 'direct' | 'other'
export type Source = 'post' | 'dm' | 'share'

export type ClickEvent = {
  id: string
  ts: string
  uid: string
  slug: string
  postRef: string | null
  source: Source
  dmJob: string | null      // which of E-01's twelve jobs the reply was answering
  via: string | null        // uid of whoever passed the link on, when recoverable
  subscriberId: string | null // ManyChat subscriber id, when the link came from a flow
  handle: string | null       // Instagram handle, when ManyChat passes it through
  group: string | null        // which group's message this link was sent with
  refClass: RefClass
  referrer: string
  device: string
  live?: boolean            // recorded by the running redirect rather than seeded
}

export type Item = {
  slug: string; ref: string; name: string; category: string
  price: number
  size: string
  tier: 'entry' | 'mid' | 'premium'
  style: string; status: string; sofiaSays: string
  destination: string; realDestination: boolean
}

export type Post = {
  ref: string; slug: string; title: string; views: number; saves: number
  organiserLabel: string; publishedAt: string; items: string[]; linkCount: number
}

export type Dm = { ref: string; handle: string; job: string; message: string }

export type PendingDm = {
  id: string
  uid: string
  handle: string
  job: string
  slug: string
  text: string
  ts: string
}

export type SegmentKey =
  | 'CONNECTOR'    // passes looks on to someone else
  | 'SENT_ON'      // arrived because a friend sent it
  | 'RESEARCHER'   // reopens the same item again and again
  | 'REGULAR'      // ranges across posts, including old ones
  | 'QUICK'        // wanted the link, took it, gone
  | 'BROWSING'     // not enough signal yet

export type Profile = {
  uid: string
  segment: SegmentKey
  reason: string
  touches: number
  returnDays: number
  distinctPosts: number
  distinctSlugs: number
  firstTs: string
  lastTs: string
  spanDays: number
  arrivedFrom: RefClass
  source: Source
  dmJob: string | null
  entryPost: string | null
  topSlug: string
  sharerUid: string | null
  sharedToCount: number
  subscriberId: string | null
  handle: string | null
}
