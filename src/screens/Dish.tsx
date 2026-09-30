import { motion } from 'framer-motion'
import { CalendarPlus, ChevronLeft, Clock, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'
import ConfirmDialog from '../components/ConfirmDialog'
import IconButton from '../components/IconButton'
import { categoryEmoji, macroLine } from '../lib/format'
import MacroBar from '../components/MacroBar'
import Photo from '../components/Photo'
import ProductRow from '../components/ProductRow'
import Screen from '../components/Screen'
import { useIngredientMap } from '../hooks'
import { dishMacros, dishWeight, formatGrams } from '../lib/calc'
import { today } from '../lib/date'
import { uid, useStore } from '../store'

const PRESETS = ['Завтрак', 'Обед', 'Ужин', 'Перекус']

export default function DishScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const dish = useStore((s) => s.dishes.find((d) => d.id === id))
  const ingredients = useIngredientMap()
  const removeDish = useStore((s) => s.removeDish)

  const [confirm, setConfirm] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)

  const macros = useMemo(
    () => (dish ? dishMacros(dish, ingredients) : { kcal: 0, protein: 0, fat: 0, carbs: 0 }),
    [dish, ingredients],
  )

  if (!dish) {
    return (
      <Screen>
        <p className="text-[15px] text-ink2">Блюдо не найдено.</p>
      </Screen>
    )
  }

  const weight = dishWeight(dish)

  return (
    <>
      <div className="relative">
        <Photo
          src={dish.photo}
          emoji={dish.emoji ?? '🍽️'}
          alt={dish.name}
          className="h-[320px] w-full"
          emojiClass="text-7xl"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)]">
          <IconButton label="Назад" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-6" aria-hidden />
          </IconButton>
          <button
            type="button"
            onClick={() => navigate(`/products/dish/${dish.id}/edit`)}
            className="rounded-full bg-surface px-4 py-2 text-[17px] font-semibold text-accent"
          >
            Изменить
          </button>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-[1200px] px-4 pb-[calc(env(safe-area-inset-bottom)+120px)]"
      >
        <div className="flex items-center justify-between gap-2 pt-4">
          <span className="flex items-center gap-1.5 text-[14px]">
            <Clock className="size-4" aria-hidden />
            {dish.cookMinutes ?? 0} мин
          </span>
          <span className="text-[20px] font-bold">{formatGrams(weight)}</span>
        </div>

        <h1 className="mt-1 mb-3 text-[34px] leading-tight font-bold">{dish.name}</h1>

        <MacroBar macros={macros} className="mb-5" />

        <p className="mb-3 text-[14px] text-ink2">
          Порций: {dish.servings} · на одну порцию {formatGrams(weight / Math.max(1, dish.servings))}
        </p>

        <h2 className="mb-2 text-[17px] font-bold">Продукты</h2>
        <ul className="mb-5 flex flex-col gap-2">
          {dish.items.map((it) => {
            const ing = ingredients.get(it.ingredientId)
            return (
              <li key={it.ingredientId}>
                <ProductRow
                  className="bg-muted"
                  name={ing?.name ?? 'Удалённый ингредиент'}
                  photo={ing?.photo}
                  emoji={ing ? (ing.emoji ?? categoryEmoji(ing.category)) : '❓'}
                  subtitle={ing ? macroLine(ing) : undefined}
                  right={<span className="text-[15px] font-semibold">{formatGrams(it.grams)}</span>}
                />
              </li>
            )
          })}
          {dish.items.length === 0 && <li className="text-[15px] text-ink2">Состав пуст</li>}
        </ul>

        {dish.description && (
          <>
            <h2 className="mb-2 text-[17px] font-bold">Описание</h2>
            <p className="mb-5 text-[15px] whitespace-pre-line">{dish.description}</p>
          </>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setPlanOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-[17px] font-semibold text-white"
          >
            <CalendarPlus className="size-5" aria-hidden />
            Добавить в план
          </button>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[17px] font-semibold text-danger"
          >
            <Trash2 className="size-5" aria-hidden />
            Удалить блюдо
          </button>
        </div>
      </motion.section>

      <ConfirmDialog
        open={confirm}
        title={`Удалить «${dish.name}»?`}
        description="Блюдо пропадёт из библиотеки и из всех приёмов пищи."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          removeDish(dish.id)
          setConfirm(false)
          navigate('/products')
        }}
      />

      <AddToPlanSheet
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        dishId={dish.id}
        defaultGrams={Math.round(weight / Math.max(1, dish.servings)) || 100}
      />
    </>
  )
}

function AddToPlanSheet({
  open,
  onClose,
  dishId,
  defaultGrams,
}: {
  open: boolean
  onClose: () => void
  dishId: string
  defaultGrams: number
}) {
  const [date, setDate] = useState(() => today())
  const days = useStore((s) => s.days)
  const addMeal = useStore((s) => s.addMeal)
  const addPortion = useStore((s) => s.addPortion)
  const touchRecent = useStore((s) => s.touchRecent)
  const meals = days[date] ?? []

  const put = (mealId: string) => {
    addPortion(date, mealId, {
      id: uid(),
      ref: { kind: 'dish', dishId },
      grams: defaultGrams,
    })
    touchRecent(dishId)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Добавить в план">
      <label className="mb-2 block text-[15px] text-ink2" htmlFor="plan-date">
        День
      </label>
      <input
        id="plan-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-4 w-full rounded-tile bg-muted px-4 py-3 text-[17px]"
      />

      <p className="mb-2 text-[15px] text-ink2">Приём пищи</p>
      <div className="flex flex-col gap-2">
        {meals.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => put(m.id)}
            className="rounded-tile bg-muted px-4 py-3 text-left text-[17px] font-semibold"
          >
            {m.name}
          </button>
        ))}
        {PRESETS.filter((p) => !meals.some((m) => m.name === p)).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => put(addMeal(date, p))}
            className="rounded-tile border-[1.5px] border-dashed border-[var(--add-border)] bg-[var(--add-bg)] px-4 py-3 text-left text-[17px] font-semibold text-[var(--add-text)]"
          >
            + {p}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
