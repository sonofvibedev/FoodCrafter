import { Check, ChevronLeft, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'
import AddCard from '../components/AddCard'
import IconButton from '../components/IconButton'
import LibraryPicker from '../components/LibraryPicker'
import { categoryEmoji } from '../lib/format'
import MacroBar from '../components/MacroBar'
import PhotoPicker from '../components/PhotoPicker'
import ProductRow from '../components/ProductRow'
import Stepper from '../components/Stepper'
import { useIngredientMap } from '../hooks'
import { dishMacros, dishWeight, formatGrams } from '../lib/calc'
import { uid, useStore } from '../store'
import type { Dish } from '../types'

const blank = (): Dish => ({
  id: uid(),
  name: '',
  items: [],
  servings: 1,
  cookMinutes: 0,
  createdAt: Date.now(),
})

export default function DishEditScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = useStore((s) => s.dishes.find((d) => d.id === id))
  const saveDish = useStore((s) => s.saveDish)
  const touchRecent = useStore((s) => s.touchRecent)
  const ingredients = useIngredientMap()

  const [dish, setDish] = useState<Dish>(() => existing ?? blank())
  const [pickerOpen, setPickerOpen] = useState(false)

  const patch = (p: Partial<Dish>) => setDish((d) => ({ ...d, ...p }))
  const macros = useMemo(() => dishMacros(dish, ingredients), [dish, ingredients])
  const weight = dishWeight(dish)

  const save = () => {
    const name = dish.name.trim()
    if (!name) return
    saveDish({ ...dish, name })
    touchRecent(dish.id)
    navigate(`/products/dish/${dish.id}`, { replace: true })
  }

  return (
    <>
      <div className="relative">
        <PhotoPicker
          value={dish.photo}
          emoji={dish.emoji}
          alt={dish.name || 'Блюдо'}
          onChange={(photo) => patch({ photo })}
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)]">
          <IconButton label="Назад" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-6" aria-hidden />
          </IconButton>
          <IconButton
            label="Сохранить блюдо"
            variant="accent"
            onClick={save}
            disabled={!dish.name.trim()}
            className={dish.name.trim() ? '' : 'opacity-50'}
          >
            <Check className="size-6" aria-hidden />
          </IconButton>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-[calc(env(safe-area-inset-bottom)+120px)]">
        <p className="pt-4 text-right text-[20px] font-bold">{formatGrams(weight)}</p>

        <input
          value={dish.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Имя блюда"
          aria-label="Название блюда"
          className="mb-3 w-full rounded-lg bg-transparent text-[34px] leading-tight font-bold placeholder:text-ink2"
        />

        <MacroBar macros={macros} className="mb-5" />

        <h2 className="mb-2 text-[17px] font-bold">Продукты</h2>
        <ul className="mb-3 flex flex-col gap-2">
          {dish.items.map((it) => {
            const ing = ingredients.get(it.ingredientId)
            return (
              <li key={it.ingredientId} className="rounded-tile bg-muted p-2">
                <ProductRow
                  name={ing?.name ?? 'Удалённый ингредиент'}
                  photo={ing?.photo}
                  emoji={ing ? (ing.emoji ?? categoryEmoji(ing.category)) : '❓'}
                  right={
                    <button
                      type="button"
                      aria-label={`Убрать ${ing?.name ?? 'ингредиент'}`}
                      onClick={() =>
                        patch({ items: dish.items.filter((x) => x.ingredientId !== it.ingredientId) })
                      }
                      className="grid size-9 place-items-center rounded-full text-danger"
                    >
                      <Trash2 className="size-5" aria-hidden />
                    </button>
                  }
                />
                <div className="mt-1 flex justify-end">
                  <Stepper
                    compact
                    label={`Вес: ${ing?.name ?? 'ингредиент'}`}
                    suffix="г"
                    step={10}
                    min={1}
                    value={it.grams}
                    onChange={(g) =>
                      patch({
                        items: dish.items.map((x) =>
                          x.ingredientId === it.ingredientId ? { ...x, grams: g } : x,
                        ),
                      })
                    }
                  />
                </div>
              </li>
            )
          })}
        </ul>

        <AddCard onClick={() => setPickerOpen(true)} className="mb-5 py-4">
          Добавить продукты
        </AddCard>

        <h2 className="mb-2 text-[17px] font-bold">Описание</h2>
        <textarea
          value={dish.description ?? ''}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Как готовить"
          aria-label="Описание блюда"
          rows={4}
          className="mb-5 w-full rounded-tile bg-muted p-3 text-[15px] placeholder:text-ink2"
        />

        <div className="mb-5">
          <div className="mb-1 flex items-baseline justify-between">
            <label htmlFor="cook-time" className="text-[17px] font-bold">
              Время готовки
            </label>
            <span className="text-[17px] font-bold tabular-nums">{dish.cookMinutes ?? 0} мин</span>
          </div>
          <input
            id="cook-time"
            type="range"
            min={0}
            max={180}
            step={5}
            value={dish.cookMinutes ?? 0}
            onChange={(e) => patch({ cookMinutes: Number(e.target.value) })}
            className="w-full accent-[var(--fc-accent)]"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[17px] font-bold">Порций</span>
          <Stepper
            label="Число порций"
            value={dish.servings}
            min={1}
            max={20}
            onChange={(v) => patch({ servings: Math.round(v) })}
          />
        </div>
      </section>

      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Добавить продукт">
        <LibraryPicker
          only="ingredient"
          onPick={(p) => {
            if (p.kind !== 'ingredient') return
            if (!dish.items.some((x) => x.ingredientId === p.ingredient.id))
              patch({ items: [...dish.items, { ingredientId: p.ingredient.id, grams: 100 }] })
            setPickerOpen(false)
          }}
        />
        <button
          type="button"
          onClick={() => navigate('/products/ingredient/new')}
          className="mt-4 w-full rounded-full bg-muted px-4 py-3 text-[17px] font-semibold"
        >
          Создать новый ингредиент
        </button>
      </BottomSheet>
    </>
  )
}
