import { AnimatePresence, Reorder, motion } from 'framer-motion'
import { Copy, GripVertical, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'
import AddCard from '../components/AddCard'
import MacroBar from '../components/MacroBar'
import MealCollage from '../components/MealCollage'
import ScreenHeader from '../components/ScreenHeader'
import { useDishMap, useIngredientMap, useTargets } from '../hooks'
import { dayMacros, mealMacros } from '../lib/calc'
import { formatDay, today, weekdayName } from '../lib/date'
import { useStore } from '../store'
import type { Meal } from '../types'
import { tilesOf } from '../lib/tiles'

const PRESETS = ['Завтрак', 'Обед', 'Ужин', 'Перекус']

/** Один и тот же пустой массив: новая ссылка на каждое чтение стора зациклила бы рендер. */
const NO_MEALS: Meal[] = []

export default function DayScreen() {
  const { date = today() } = useParams()
  const navigate = useNavigate()
  const meals = useStore((s) => s.days[date]) ?? NO_MEALS
  const ingredients = useIngredientMap()
  const dishes = useDishMap()
  const target = useTargets()

  const [editing, setEditing] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [undo, setUndo] = useState<{ meal: Meal; index: number } | null>(null)

  const addMeal = useStore((s) => s.addMeal)
  const setMeals = useStore((s) => s.setMeals)
  const removeMeal = useStore((s) => s.removeMeal)
  const restoreMeal = useStore((s) => s.restoreMeal)
  const renameMeal = useStore((s) => s.renameMeal)
  const copyDay = useStore((s) => s.copyDay)

  const macros = useMemo(() => dayMacros(meals, ingredients, dishes), [meals, ingredients, dishes])

  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => setUndo(null), 6000)
    return () => clearTimeout(t)
  }, [undo])

  const lowProtein = meals.length > 0 && macros.protein < target.protein * 0.8

  const handleDelete = (meal: Meal, index: number) => {
    removeMeal(date, meal.id)
    setUndo({ meal, index })
  }

  return (
    <section className="lg:rounded-card lg:bg-surface lg:p-5">
      <ScreenHeader
        backTo="/plan"
        right={
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="shrink-0 px-1 text-[17px] font-semibold text-accent"
          >
            {editing ? 'Готово' : 'Изменить'}
          </button>
        }
      />

      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h1 className="text-[34px] leading-tight font-bold">{weekdayName(date)}</h1>
        <span className="text-[14px] text-ink2">{formatDay(date)}</span>
      </div>

      <MacroBar macros={macros} target={target} className="mb-4" />

      {lowProtein && (
        <p className="mb-4 rounded-tile bg-accent/10 px-3 py-2 text-[14px] text-accent">
          Сегодня недобор белка: {Math.round(macros.protein)} г из {target.protein} г.
        </p>
      )}

      {editing ? (
        <Reorder.Group
          axis="y"
          values={meals}
          onReorder={(next) => setMeals(date, next)}
          className="mb-4 flex flex-col gap-2"
        >
          {meals.map((meal, i) => (
            <Reorder.Item key={meal.id} value={meal} className="list-none">
              <motion.div
                drag="x"
                dragConstraints={{ left: -96, right: 0 }}
                dragElastic={{ left: 0.4, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) handleDelete(meal, i)
                }}
                className="flex items-center gap-2 rounded-tile bg-muted px-2 py-2"
              >
                <GripVertical className="size-5 shrink-0 cursor-grab text-ink2" aria-hidden />
                <input
                  value={meal.name}
                  onChange={(e) => renameMeal(date, meal.id, e.target.value)}
                  aria-label={`Название приёма пищи ${i + 1}`}
                  className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-[17px] font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(meal, i)}
                  aria-label={`Удалить «${meal.name}»`}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-danger"
                >
                  <Trash2 className="size-5" aria-hidden />
                </button>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <ul className="mb-4 flex flex-col gap-5">
          {meals.map((meal, i) => {
            const m = mealMacros(meal, ingredients, dishes)
            const tiles = tilesOf([meal], ingredients, dishes)
            return (
              <motion.li
                key={meal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/plan/day/${date}/meal/${meal.id}`)}
                  className="w-full text-left"
                  aria-label={`${meal.name}, ${Math.round(m.kcal)} ккал`}
                >
                  <span className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="text-[24px] font-bold">{meal.name}</span>
                    <span className="text-[14px] text-ink2 tabular-nums">
                      {Math.round(m.kcal)} ккал
                    </span>
                  </span>
                  {tiles.length > 0 ? (
                    <MealCollage tiles={tiles} />
                  ) : (
                    <AddCard className="h-24">Добавить блюдо</AddCard>
                  )}
                </motion.button>
              </motion.li>
            )
          })}
        </ul>
      )}

      <AddCard onClick={() => setAddOpen(true)} className="mb-3 py-8">
        Добавить приём пищи
      </AddCard>

      {meals.length > 0 && (
        <button
          type="button"
          onClick={() => setCopyOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[15px] font-semibold"
        >
          <Copy className="size-4" aria-hidden />
          Скопировать день
        </button>
      )}

      <AddMealSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onPick={(name) => {
          const id = addMeal(date, name)
          setAddOpen(false)
          navigate(`/plan/day/${date}/meal/${id}`)
        }}
      />

      <CopySheet
        open={copyOpen}
        title="Скопировать день"
        onClose={() => setCopyOpen(false)}
        onPick={(to) => {
          copyDay(date, to)
          setCopyOpen(false)
        }}
      />

      <AnimatePresence>
        {undo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status"
            className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+110px)] z-40 mx-auto flex max-w-[420px] items-center justify-between gap-3 rounded-full bg-ink px-4 py-3 text-[15px] text-[var(--fc-surface)]"
          >
            <span className="truncate">«{undo.meal.name}» удалён</span>
            <button
              type="button"
              onClick={() => {
                restoreMeal(date, undo.meal, undo.index)
                setUndo(null)
              }}
              className="shrink-0 font-semibold text-accent"
            >
              Отменить
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function AddMealSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (name: string) => void
}) {
  const [custom, setCustom] = useState('')

  return (
    <BottomSheet open={open} onClose={onClose} title="Приём пищи">
      <div className="flex flex-col gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="rounded-tile bg-muted px-4 py-3 text-left text-[17px] font-semibold"
          >
            {p}
          </button>
        ))}
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const name = custom.trim()
            if (name) {
              onPick(name)
              setCustom('')
            }
          }}
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Своё название"
            aria-label="Своё название приёма пищи"
            className="min-w-0 flex-1 rounded-full bg-muted px-4 py-3 text-[17px]"
          />
          <button
            type="submit"
            disabled={!custom.trim()}
            className="rounded-full bg-accent px-5 py-3 text-[17px] font-semibold text-white disabled:opacity-40"
          >
            Добавить
          </button>
        </form>
      </div>
    </BottomSheet>
  )
}

export function CopySheet({
  open,
  title,
  onClose,
  onPick,
}: {
  open: boolean
  title: string
  onClose: () => void
  onPick: (date: string) => void
}) {
  const [date, setDate] = useState(() => today())

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <label className="mb-3 block text-[15px] text-ink2" htmlFor="copy-date">
        Выберите день
      </label>
      <input
        id="copy-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 w-full rounded-tile bg-muted px-4 py-3 text-[17px]"
      />
      <button
        type="button"
        onClick={() => onPick(date)}
        className="w-full rounded-full bg-accent px-4 py-3 text-[17px] font-semibold text-white"
      >
        Скопировать
      </button>
    </BottomSheet>
  )
}
