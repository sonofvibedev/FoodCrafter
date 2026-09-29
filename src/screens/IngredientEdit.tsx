import { Check, ChevronLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import IconButton from '../components/IconButton'
import PhotoPicker from '../components/PhotoPicker'
import { uid, useStore } from '../store'
import { CATEGORIES, type CategoryId, type Ingredient } from '../types'

const blank = (): Ingredient => ({
  id: uid(),
  name: '',
  category: 'other',
  kcal: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  createdAt: Date.now(),
})

const MACRO_FIELDS = [
  { key: 'kcal', label: 'ККАЛ' },
  { key: 'protein', label: 'Белок' },
  { key: 'fat', label: 'Жиры' },
  { key: 'carbs', label: 'Углеводы' },
] as const

export default function IngredientEditScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = useStore((s) => s.ingredients.find((i) => i.id === id))
  const saveIngredient = useStore((s) => s.saveIngredient)
  const removeIngredient = useStore((s) => s.removeIngredient)
  const touchRecent = useStore((s) => s.touchRecent)

  const [ing, setIng] = useState<Ingredient>(() => existing ?? blank())
  const [confirm, setConfirm] = useState(false)

  const patch = (p: Partial<Ingredient>) => setIng((x) => ({ ...x, ...p }))

  const save = () => {
    const name = ing.name.trim()
    if (!name) return
    saveIngredient({ ...ing, name })
    touchRecent(ing.id)
    navigate('/products', { replace: true })
  }

  return (
    <>
      <div className="relative">
        <PhotoPicker
          value={ing.photo}
          emoji={ing.emoji}
          alt={ing.name || 'Ингредиент'}
          onChange={(photo) => patch({ photo })}
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)]">
          <IconButton label="Назад" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-6" aria-hidden />
          </IconButton>
          <IconButton
            label="Сохранить ингредиент"
            variant="accent"
            onClick={save}
            disabled={!ing.name.trim()}
            className={ing.name.trim() ? '' : 'opacity-50'}
          >
            <Check className="size-6" aria-hidden />
          </IconButton>
        </div>
      </div>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-[calc(env(safe-area-inset-bottom)+120px)]">
        <p className="pt-4 text-right text-[15px] text-ink2">КБЖУ на 100 г</p>

        <input
          value={ing.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Имя ингредиента"
          aria-label="Название ингредиента"
          className="mb-3 w-full rounded-lg bg-transparent text-[34px] leading-tight font-bold placeholder:text-ink2"
        />

        <div className="mb-5 grid grid-cols-4 gap-1 rounded-tile bg-muted px-2 py-3">
          {MACRO_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={ing[f.key]}
                onChange={(e) => patch({ [f.key]: Number(e.target.value) || 0 } as Partial<Ingredient>)}
                className="w-full rounded-lg bg-transparent text-center text-[17px] font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[11px] text-ink2">{f.label}</span>
            </label>
          ))}
        </div>

        <Field label="Эмодзи">
          <input
            value={ing.emoji ?? ''}
            onChange={(e) => patch({ emoji: e.target.value.slice(0, 4) || undefined })}
            placeholder="🥦"
            aria-label="Эмодзи-иконка"
            className="w-20 rounded-lg bg-transparent text-right text-[17px]"
          />
        </Field>

        <Field label="Категория">
          <select
            value={ing.category}
            onChange={(e) => patch({ category: e.target.value as CategoryId })}
            aria-label="Категория"
            className="rounded-lg bg-transparent text-right text-[17px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Вес штуки, г">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={ing.pieceWeight ?? ''}
            onChange={(e) => patch({ pieceWeight: Number(e.target.value) || undefined })}
            placeholder="—"
            aria-label="Вес одной штуки в граммах"
            className="w-24 rounded-lg bg-transparent text-right text-[17px] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </Field>

        <Field label="Цена за кг, BYN">
          <input
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            value={ing.pricePerKg ?? ''}
            onChange={(e) => patch({ pricePerKg: Number(e.target.value) || undefined })}
            placeholder="—"
            aria-label="Цена за килограмм в белорусских рублях"
            className="w-24 rounded-lg bg-transparent text-right text-[17px] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </Field>

        {existing && (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[17px] font-semibold text-danger"
          >
            <Trash2 className="size-5" aria-hidden />
            Удалить ингредиент
          </button>
        )}
      </section>

      <ConfirmDialog
        open={confirm}
        title={`Удалить «${ing.name}»?`}
        description="Ингредиент пропадёт из библиотеки, из состава блюд и из планов."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          removeIngredient(ing.id)
          setConfirm(false)
          navigate('/products', { replace: true })
        }}
      />
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3">
      <span className="text-[17px]">{label}</span>
      {children}
    </div>
  )
}
