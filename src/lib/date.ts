const DAY_MS = 86_400_000

export const WEEKDAYS = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
]
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS_GEN = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]
const MONTHS_NOM = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

/** YYYY-MM-DD в локальной зоне (не UTC — иначе «сегодня» уезжает на день). */
export function iso(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): string {
  return iso(new Date())
}

export function addDays(s: string, n: number): string {
  return iso(new Date(fromIso(s).getTime() + n * DAY_MS))
}

/** Понедельник недели, в которую попадает дата. */
export function weekStart(s: string): string {
  const d = fromIso(s)
  const shift = (d.getDay() + 6) % 7
  return addDays(s, -shift)
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function monthStart(s: string): string {
  const d = fromIso(s)
  return iso(new Date(d.getFullYear(), d.getMonth(), 1))
}

/** Сетка месяца: полные недели пн–вс, покрывающие месяц даты. */
export function monthGrid(s: string): string[] {
  const first = monthStart(s)
  const d = fromIso(first)
  const last = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))
  const from = weekStart(first)
  const to = addDays(weekStart(last), 6)
  const out: string[] = []
  for (let cur = from; cur <= to; cur = addDays(cur, 1)) out.push(cur)
  return out
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** «29 сен - 5 окт» */
export function formatRange(from: string, to: string): string {
  const a = fromIso(from)
  const b = fromIso(to)
  const left = `${a.getDate()} ${MONTHS_GEN[a.getMonth()]}`
  const right = `${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`
  return `${left} – ${right}`
}

/** «29 сентября» → короткая форма «29 сен» */
export function formatDay(s: string): string {
  const d = fromIso(s)
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

export function formatMonth(s: string): string {
  const d = fromIso(s)
  return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`
}

export function weekdayName(s: string): string {
  return WEEKDAYS[(fromIso(s).getDay() + 6) % 7]
}

export function dayNumber(s: string): number {
  return fromIso(s).getDate()
}
