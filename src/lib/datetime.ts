export function formatInTimeZone(iso: string, timeZone: string, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return ''
  const d = new Date(iso)
  const fmt = new Intl.DateTimeFormat('ja-JP', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  })
  return fmt.format(d)
}

