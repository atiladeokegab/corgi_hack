export type RefClass = 'instagram' | 'instagram_dm' | 'whatsapp' | 'messages' | 'direct' | 'other'

export type RedirectEvent = {
  id: string
  ts: string
  uid: string
  slug: string
  postRef: string | null
  via: string | null        // uid of the person who shared this link, when recoverable
  refClass: RefClass
  referrer: string
  device: string
  live?: boolean            // recorded by the running redirect rather than seeded
}

export type Order = {
  orderId: string
  ts: string
  slug: string
  value: number
  subid: string | null      // what Sofia's own redirect can attribute (1-year cookie)
  affiliateCredited: boolean // what the affiliate network actually paid her for (24h cookie)
  postRef: string | null
}

export type Item = {
  slug: string; ref: string; name: string; category: string; price: number
  size: string; style: string; status: string; sofiaSays: string; destination: string
}

export type Post = {
  ref: string; title: string; views: number; saves: number; purchases: number
  organiserLabel: string; publishedAt: string; items: string[]; linkCount: number
}

export type SegmentKey =
  | 'CONNECTOR'     // E-07.4 Ella — sends outfits on; the friend buys
  | 'SENT_ON'       // the friend at the other end of that share
  | 'DELIBERATOR'   // E-07.3 Priya — saves "worth it", buys late and big
  | 'REGULAR'       // E-07.2 Jamie — returns to old posts, rarely converts alone
  | 'IMPULSE'       // the fast clicker: the only person the affiliate dashboard sees
  | 'BROWSING'      // insufficient signal

export type Profile = {
  uid: string
  segment: SegmentKey
  reason: string
  touches: number
  returnDays: number
  distinctPosts: number
  lagDays: number | null    // post publish -> first touch. The save proxy.
  firstTs: string
  lastTs: string
  arrivedFrom: RefClass
  sharerUid: string | null
  sharedToCount: number
  purchased: boolean
  revenue: number
  affiliateCredited: boolean
  daysToBuy: number | null
}
