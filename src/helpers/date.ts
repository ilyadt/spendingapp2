// https://stackoverflow.com/a/2998822/15347300

const DAY_IN_MS = 24 * 60 * 60 * 1000

function pad(num: number, size: number): string {
  const s = '00' + num
  return s.substring(s.length - size)
}

export function dateFormat(d: Date): string {
  return pad(d.getDate(), 2) + '.' + pad(d.getMonth() + 1, 2) + '.' + d.getFullYear()
}

export function dateISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export function dateRangePlusItemSet(dateFrom: Date, dateTo: Date, items: Set<string>): string[] {
  const dateSet = new Set<string>()
  const current = new Date(dateFrom)
  while (current <= dateTo) {
    dateSet.add(dateISO(current))
    current.setDate(current.getDate() + 1)
  }

  const merged = new Set([...dateSet, ...items])

  return [...merged].sort()
}

export function dayName(d: Date): string {
  const dayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

  return dayNames[d.getDay()]!
}

export function daysLeft(today: Date, deadline: Date): number {
  const left = Math.floor(deadline.getTime() / DAY_IN_MS) - Math.floor(today.getTime() / DAY_IN_MS) + 1

  if (left < 0) {
    return 0
  }

  return left
}

interface DateRange {
  dateFrom: Date
  dateTo: Date
}

export function percentPassed(today: Date, interval: DateRange): number {
  const result = Math.floor(
      ((Math.floor(today.getTime() / DAY_IN_MS) - Math.floor(interval.dateFrom.getTime() / DAY_IN_MS))
        /
      (Math.floor(interval.dateTo.getTime() / DAY_IN_MS) - Math.floor(interval.dateFrom.getTime() / DAY_IN_MS) + 1)
    ) * 100,
  )

  if (result > 100) return 100
  if (result < 0) return 0

  return result
}

export function daysFrom2000UTC(dt: Date):number {
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const d = dt.getUTCDate();

  const base = Date.UTC(2000, 0, 1);
  const current = Date.UTC(y, m, d);

  return Math.floor((current - base) / 86_400_000) + 1;
}

