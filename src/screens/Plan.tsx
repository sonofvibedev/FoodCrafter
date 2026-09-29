import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Outlet, useMatch, useNavigate } from 'react-router-dom'
import MealCollage from '../components/MealCollage'
import Screen from '../components/Screen'
import SegmentedControl from '../components/SegmentedControl'
import { useDishMap, useIngredientMap, useTargets } from '../hooks'
import { dayMacros } from '../lib/calc'
import {
  WEEKDAYS_SHORT,
  addDays,
  dayNumber,
  formatMonth,
  formatRange,
  monthGrid,
  sameMonth,
  today,
  weekDays,
  weekStart,
  weekdayName,
} from '../lib/date'
import { useStore } from '../store'
import type { Meal } from '../types'

type Mode = 'week' | 'month'

export default function PlanLayout() {
  const detail = useMatch('/plan/day/*')

  return (
    <Screen>
      <div
        className={`lg:grid lg:items-start lg:gap-8 ${
          detail ? 'lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]' : 'lg:grid-cols-1'
        }`}
      >
        <div className={`@container ${detail ? 'hidden lg:block' : ''}`}>
          <PlanList />
        </div>
        {detail && (
          <div className="lg:sticky lg:top-6">
            <Outlet />
          </div>
        )}
      </div>
    </Screen>
  )
}

function PlanList() {
  const [mode, setMode] = useState<Mode>('week')
  const [anchor, setAnchor] = useState(() => today())

  return (
    <>
      <SegmentedControl
        className="mb-5"
        label="Период плана"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
        ]}
      />
      {mode === 'week' ? (
        <WeekView anchor={anchor} setAnchor={setAnchor} />
      ) : (
        <MonthView anchor={anchor} setAnchor={setAnchor} />
      )}
    </>
  )
}

function useDayKcal() {
  const days = useStore((s) => s.days)
  const ingredients = useIngredientMap()
  const dishes = useDishMap()
  return useMemo(
    () => (date: string) => Math.round(dayMacros(days[date] ?? [], ingredients, dishes).kcal),
    [days, ingredients, dishes],
  )
}

function useDayTiles() {
  const days = useStore((s) => s.days)
  const ingredients = useIngredientMap()
  const dishes = useDishMap()
  return useMemo(
    () => (date: string) => tilesOf(days[date] ?? [], ingredients, dishes),
    [days, ingredients, dishes],
  )
}

export function tilesOf(
  meals: Meal[],
  ingredients: Map<string, { name: string; emoji?: string; photo?: string }>,
  dishes: Map<string, { name: string; emoji?: string; photo?: string }>,
) {
  return meals.flatMap((m) =>
    m.items.map((p) => {
      const src = p.ref.kind === 'dish' ? dishes.get(p.ref.dishId) : ingredients.get(p.ref.ingredientId)
      return { src: src?.photo, emoji: src?.emoji, alt: src?.name ?? 'Блюдо' }
    }),
  )
}

/* --------------------------------- Неделя -------------------------------- */

function WeekView({ anchor, setAnchor }: { anchor: string; setAnchor: (s: string) => void }) {
  const navigate = useNavigate()
  const start = weekStart(anchor)
  const days = weekDays(start)
  const kcalOf = useDayKcal()
  const tilesOfDay = useDayTiles()
  const now = today()

  return (
    <>
      <header className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[34px] leading-tight font-bold">Неделя</h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Предыдущая неделя"
              onClick={() => setAnchor(addDays(start, -7))}
              className="grid size-10 place-items-center rounded-full bg-muted"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setAnchor(now)}
              className="rounded-full bg-muted px-3 py-2 text-[14px] font-semibold"
            >
              Сегодня
            </button>
            <button
              type="button"
              aria-label="Следующая неделя"
              onClick={() => setAnchor(addDays(start, 7))}
              className="grid size-10 place-items-center rounded-full bg-muted"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <p className="mt-1 text-[18px] text-ink2">{formatRange(days[0], days[6])}</p>
      </header>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 @md:grid-cols-4 @4xl:grid-cols-7">
        {days.map((d, i) => {
          const tiles = tilesOfDay(d)
          const kcal = kcalOf(d)
          return (
            <motion.li
              key={d}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/plan/day/${d}`)}
                className="w-full text-left"
                aria-label={`${weekdayName(d)}, ${kcal} ккал`}
              >
                <span className="mb-2 block">
                  <span
                    className={`block truncate text-[17px] font-bold ${d === now ? 'text-accent' : ''}`}
                  >
                    {weekdayName(d)}
                  </span>
                  <span className="block text-[13px] text-ink2 tabular-nums">
                    {kcal > 0 ? `${kcal} ккал` : ' '}
                  </span>
                </span>
                {tiles.length > 0 ? (
                  <MealCollage tiles={tiles} className="aspect-square" />
                ) : (
                  <span className="flex aspect-square items-center justify-center rounded-dashed border-2 border-dashed border-ink text-[17px] font-semibold">
                    Добавить
                  </span>
                )}
              </motion.button>
            </motion.li>
          )
        })}
      </ul>
    </>
  )
}

/* --------------------------------- Месяц --------------------------------- */

function MonthView({ anchor, setAnchor }: { anchor: string; setAnchor: (s: string) => void }) {
  const navigate = useNavigate()
  const grid = monthGrid(anchor)
  const kcalOf = useDayKcal()
  const target = useTargets()
  const now = today()

  return (
    <>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-[28px] leading-tight font-bold">{formatMonth(anchor)}</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Предыдущий месяц"
            onClick={() => setAnchor(addDays(grid[0], -1))}
            className="grid size-10 place-items-center rounded-full bg-muted"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Текущий месяц"
            onClick={() => setAnchor(now)}
            className="grid size-10 place-items-center rounded-full bg-muted"
          >
            <CalendarDays className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            onClick={() => setAnchor(addDays(grid[grid.length - 1], 1))}
            className="grid size-10 place-items-center rounded-full bg-muted"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </header>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[12px] text-ink2">
        {WEEKDAYS_SHORT.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <ul className="grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const kcal = kcalOf(d)
          const ratio = target.kcal > 0 ? kcal / target.kcal : 0
          const dim = !sameMonth(d, anchor)
          return (
            <li key={d}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => navigate(`/plan/day/${d}`)}
                aria-label={`${d}, ${kcal} ккал`}
                className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-tile ${
                  d === now ? 'bg-accent/15 ring-2 ring-accent' : 'bg-muted'
                } ${dim ? 'opacity-40' : ''}`}
              >
                <span className="text-[14px] font-semibold tabular-nums">{dayNumber(d)}</span>
                {kcal > 0 ? (
                  <>
                    <span className="text-[10px] text-ink2 tabular-nums">{kcal}</span>
                    <span
                      className={`size-1.5 rounded-full ${
                        ratio > 1.1 ? 'bg-danger' : ratio >= 0.8 ? 'bg-accent' : 'bg-ink2'
                      }`}
                      aria-hidden
                    />
                  </>
                ) : (
                  <span className="size-1.5" aria-hidden />
                )}
              </motion.button>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink2">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-ink2" aria-hidden /> меньше нормы
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden /> в норме
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-danger" aria-hidden /> перебор
        </span>
      </p>
    </>
  )
}
