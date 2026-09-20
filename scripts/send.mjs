#!/usr/bin/env node
// Walk a group one person at a time and send each of them their own tagged link.
//
//   node scripts/send.mjs --group CONNECTOR
//   node scripts/send.mjs --group RESEARCHER --item black-blazer --preview
//
// Talks to the running app so there is exactly one copy of the sending logic.
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') === false ? arr[i + 1] : true])
    return acc
  }, []),
)

const host = args.host ?? 'http://localhost:3000'
const group = args.group
const item = args.item ?? 'black-blazer'

if (!group) {
  console.error('\n  --group is required. One of: CONNECTOR RESEARCHER REGULAR SENT_ON QUICK\n')
  process.exit(1)
}

const res = await fetch(`${host}/api/send`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ group, item, deliverTo: args.to ?? null, preview: Boolean(args.preview) }),
}).catch(e => { console.error(`\n  Could not reach ${host} — is npm run dev running?\n`, e.message); process.exit(1) })

if (!res.ok) { console.error('  ' + (await res.text())); process.exit(1) }
const r = await res.json()

console.log(`\n  ${r.group} · ${r.item}`)
console.log('  ' + '-'.repeat(58))
console.log(`  ${r.total} messages prepared, each with its own link`)
if (r.delivery) console.log(`  delivered to @${r.delivery.handle} — one account only`)
console.log('\n  first few prepared:')
for (const p of r.recipients.slice(0, 5)) {
  console.log(`   · ${(p.handle ? '@' + p.handle : p.uid).padEnd(22)} ${p.link.slice(0, 64)}`)
}
console.log(`\n  ${args.preview ? 'Preview only — nothing logged.' : 'Run recorded.'}\n`)
