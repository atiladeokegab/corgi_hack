/**
 * Everything is stored as UTC ISO strings. Sofia, the team and the judges are all
 * in London, which is BST for half the year — so display is pinned to the zone
 * rather than left to whatever the machine happens to be set to.
 */
export const LONDON = 'Europe/London'

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: LONDON, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})

export const londonTime = (iso: string) => timeFmt.format(new Date(iso))
