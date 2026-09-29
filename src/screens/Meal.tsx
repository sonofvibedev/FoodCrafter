import { motion } from 'framer-motion'
import { Check, Copy, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'
import DashedAddCard from '../components/DashedAddCard'
import IconButton from '../components/IconButton'
import LibraryPicker, { categoryEmoji, type Picked } from '../components/LibraryPicker'
import MacroBar from '../components/MacroBar'
import Photo from '../components/Photo'
import ScreenHeader from '../components/ScreenHeader'
import Stepper from '../components/Stepper'
import { useDishMap, useIngredientMap } from '../hooks'
import { dishWeight, formatGrams, mealMacros, portionMacros } from '../lib/calc'
import { today } from '../lib/date'
import { uid, useStore } from '../store'
import type { Portion } from '../types'
import { CopySheet } from './Day'

export default function MealScreen() {
  const { date = today(), mealId = '' } = useParams()
  const navigate = useNavigate()

  const meal = useStore((s) => (s.days[date] ?? []).find((m) => m.id === mealId))
  const ingredients = useIngredientMap()
  const dishes = useDishMap()

  const renameMeal = useStore((s) => s.renameMeal)
  const addPortion = useStore((s) => s.addPortion)
  const setPortionGrams = useStore((s) => s.setPortionGrams)
  const removePortion = useStore((s) => s.removePortion)
  const copyMeal = useStore((s) => s.copyMeal)
  const touchRecent = useStore((s) => s.touchRecent)

  const [sourceOpen, setSourceOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  const macros = useMemo(
    () => (meal ? mealMacros(meal, ingredients, dishes) : { kcal: 0, protein: 0, fat: 0, carbs: 0 }),
    [meal, ingredients, dishes],
  )

  if (!meal) {
    return (
      <section className="lg:rounded-card lg:bg-surface lg:p-5">
        <ScreenHeader backTo={`/plan/day/${date}`} title="Приём пищи" />
        <p className="text-[15px] text-ink2">Этот приём пищи удалён.</p>
      </section>
    )
  }

  const handlePick = (p: Picked) => {
    const portion: Portion =
      p.kind === 'dish'
        ? {
            id: uid(),
            ref: { kind: 'dish', dishId: p.dish.id },
            grams: Math.round(dishWeight(p.dish) / Math.max(1, p.dish.servings)) || 100,
          }
        : { id: uid(), ref: { kind: 'ingredient', ingredientId: p.ingredient.id }, grams: 100 }
    addPortion(date, meal.id, portion)
    touchRecent(p.kind === 'dish' ? p.dish.id : p.ingredient.id)
    setPickerOpen(false)
    setEditing(portion.id)
  }

  const editingPortion = meal.items.find((p) => p.id === editing)

  return (
    <section className="lg:rounded-card lg:bg-surface lg:p-5">
      <ScreenHeader
        backTo={`/plan/day/${date}`}
        right={
          <IconButton
            label="Готово"
            variant="accent"
            onClick={() => navigate(`/plan/day/${date}`)}
          >
            <Check className="size-6" aria-hidden />
          </IconButton>
        }
      />

      <input
        value={meal.name}
        onChange={(e) => renameMeal(date, meal.id, e.target.value)}
        aria-label="Название приёма пищи"
        className="mb-3 w-full rounded-lg bg-transparent text-[34px] leading-tight font-bold"
      />

      <MacroBar macros={macros} className="mb-4" />

      <ul className="mb-4 grid grid-cols-2 gap-3">
        {meal.items.map((p, i) => {
          const src =
            p.ref.kind === 'dish' ? dishes.get(p.ref.dishId) : ingredients.get(p.ref.ingredientId)
          const m = portionMacros(p, ingredients, dishes)
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setEditing(p.id)}
                aria-label={`${src?.name ?? 'Позиция'}, ${formatGrams(p.grams)}`}
                className="w-full overflow-hidden rounded-card bg-muted text-left"
              >
                <Photo
                  src={src?.photo}
                  emoji={
                    src && 'category' in src ? categoryEmoji(src.category) : (src?.emoji ?? '🍽️')
                  }
                  alt={src?.name ?? 'Позиция'}
                  className="aspect-square w-full"
                  emojiClass="text-5xl"
                />
                <span className="block px-3 py-2">
                  <span className="block truncate text-[15px] font-bold">
                    {src?.name ?? 'Удалено'}
                  </span>
                  <span className="block text-[13px] text-ink2 tabular-nums">
                    {formatGrams(p.grams)} · {Math.round(m.kcal)} ккал
                  </span>
                </span>
              </motion.button>
            </motion.li>
          )
        })}
      </ul>

      <DashedAddCard onClick={() => setSourceOpen(true)} className="mb-3 py-8">
        Добавить блюдо
      </DashedAddCard>

      <button
        type="button"
        onClick={() => setCopyOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[15px] font-semibold"
      >
        <Copy className="size-4" aria-hidden />
        Скопировать приём пищи
      </button>

      {/* Lofi 20: новое или из каталога */}
      <BottomSheet open={sourceOpen} onClose={() => setSourceOpen(false)} title="Что добавить">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setSourceOpen(false)
              setPickerOpen(true)
            }}
            className="rounded-card bg-muted px-4 py-6 text-left text-[17px] font-bold"
          >
            Каталог
            <span className="mt-1 block text-[14px] font-normal text-ink2">
              Блюда и ингредиенты, которые уже сохранены
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/products/dish/new')}
            className="rounded-card bg-muted px-4 py-6 text-left text-[17px] font-bold"
          >
            Новое
            <span className="mt-1 block text-[14px] font-normal text-ink2">
              Создать блюдо или ингредиент
            </span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Каталог">
        <LibraryPicker onPick={handlePick} />
      </BottomSheet>

      <BottomSheet
        open={!!editingPortion}
        onClose={() => setEditing(null)}
        title="Порция"
      >
        {editingPortion && (
          <PortionEditor
            portion={editingPortion}
            onGrams={(g) => setPortionGrams(date, meal.id, editingPortion.id, g)}
            onOpen={() => {
              if (editingPortion.ref.kind === 'dish')
                navigate(`/products/dish/${editingPortion.ref.dishId}`)
              else navigate(`/products/ingredient/${editingPortion.ref.ingredientId}/edit`)
            }}
            onDelete={() => {
              removePortion(date, meal.id, editingPortion.id)
              setEditing(null)
            }}
          />
        )}
      </BottomSheet>

      <CopySheet
        open={copyOpen}
        title="Скопировать приём пищи"
        onClose={() => setCopyOpen(false)}
        onPick={(to) => {
          copyMeal(date, meal.id, to)
          setCopyOpen(false)
        }}
      />
    </section>
  )
}

function PortionEditor({
  portion,
  onGrams,
  onOpen,
  onDelete,
}: {
  portion: Portion
  onGrams: (g: number) => void
  onOpen: () => void
  onDelete: () => void
}) {
  const ingredients = useIngredientMap()
  const dishes = useDishMap()
  const [unit, setUnit] = useState<'g' | 'pcs'>('g')

  const ing = portion.ref.kind === 'ingredient' ? ingredients.get(portion.ref.ingredientId) : undefined
  const dish = portion.ref.kind === 'dish' ? dishes.get(portion.ref.dishId) : undefined
  const name = ing?.name ?? dish?.name ?? 'Позиция'
  const pieceWeight = ing?.pieceWeight

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[20px] font-bold">{name}</p>

      {pieceWeight ? (
        <div className="flex gap-2 text-[14px]">
          <button
            type="button"
            onClick={() => setUnit('g')}
            aria-pressed={unit === 'g'}
            className={`rounded-full px-3 py-1 ${unit === 'g' ? 'bg-accent text-white' : 'bg-muted'}`}
          >
            граммы
          </button>
          <button
            type="button"
            onClick={() => setUnit('pcs')}
            aria-pressed={unit === 'pcs'}
            className={`rounded-full px-3 py-1 ${unit === 'pcs' ? 'bg-accent text-white' : 'bg-muted'}`}
          >
            штуки
          </button>
        </div>
      ) : null}

      {unit === 'pcs' && pieceWeight ? (
        <Stepper
          label="Количество, шт"
          suffix="шт"
          value={Math.round((portion.grams / pieceWeight) * 10) / 10}
          step={1}
          min={0.5}
          onChange={(v) => onGrams(Math.round(v * pieceWeight))}
        />
      ) : (
        <Stepper
          label="Вес порции, г"
          suffix="г"
          value={portion.grams}
          step={10}
          min={10}
          onChange={onGrams}
        />
      )}

      <button
        type="button"
        onClick={onOpen}
        className="rounded-full bg-muted px-4 py-3 text-[17px] font-semibold"
      >
        Открыть карточку
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex items-center justify-center gap-2 rounded-full bg-danger px-4 py-3 text-[17px] font-semibold text-white"
      >
        <Trash2 className="size-5" aria-hidden />
        Убрать из приёма пищи
      </button>
    </div>
  )
}
