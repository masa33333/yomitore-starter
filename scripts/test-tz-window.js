// Simple sanity test for the TIMEZONE day window logic (Asia/Tokyo)

function getTZParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortOffset',
  })
  const parts = dtf.formatToParts(date)
  const map = {}
  for (const p of parts) map[p.type] = p.value
  const [year, month, day] = (map.year + '-' + map.month + '-' + map.day).split('-').map(Number)
  const offStr = map.timeZoneName || 'GMT+0'
  const m = offStr.match(/GMT([+\-])(\d{1,2})(?::?(\d{2}))?/)
  let offsetMinutes = 0
  if (m) {
    const sign = m[1] === '-' ? -1 : 1
    const hh = parseInt(m[2] || '0', 10)
    const mm = parseInt(m[3] || '0', 10)
    offsetMinutes = sign * (hh * 60 + mm)
  } else if (timeZone === 'Asia/Tokyo') {
    offsetMinutes = 9 * 60
  }
  return { year, month, day, offsetMinutes }
}

function computeWindow(now, tz) {
  const { year, month, day, offsetMinutes } = getTZParts(now, tz)
  const startUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - offsetMinutes * 60 * 1000)
  const endUtc = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - 1 - offsetMinutes * 60 * 1000)
  return { startUtc, endUtc }
}

function fmt(d) { return d.toISOString() }

const tz = 'Asia/Tokyo'

// Case 1: A UTC time that is Aug 25, 12:00 UTC -> local Tokyo is 21:00 same day
const now1 = new Date(Date.UTC(2025, 7, 25, 12, 0, 0, 0))
const { startUtc: s1, endUtc: e1 } = computeWindow(now1, tz)
console.log('Now(UTC):', fmt(now1), 'TZ:', tz)
console.log('Window start UTC:', fmt(s1))
console.log('Window end   UTC:', fmt(e1))

// Expected for Asia/Tokyo: start = 2025-08-24T15:00:00.000Z, end = 2025-08-25T14:59:59.999Z

// Case 2: Midnight Tokyo edge: Aug 26 00:10 JST -> 2025-08-25 15:10 UTC
const now2 = new Date(Date.UTC(2025, 7, 25, 15, 10, 0, 0))
const { startUtc: s2, endUtc: e2 } = computeWindow(now2, tz)
console.log('\nEdge case around midnight JST:')
console.log('Now(UTC):', fmt(now2), 'TZ:', tz)
console.log('Window start UTC:', fmt(s2))
console.log('Window end   UTC:', fmt(e2))

// Case 3: DST-agnostic check (Tokyo has no DST). Using Jan 15, 2025.
const now3 = new Date(Date.UTC(2025, 0, 15, 3, 0, 0, 0))
const { startUtc: s3, endUtc: e3 } = computeWindow(now3, tz)
console.log('\nWinter check:')
console.log('Now(UTC):', fmt(now3), 'TZ:', tz)
console.log('Window start UTC:', fmt(s3))
console.log('Window end   UTC:', fmt(e3))

