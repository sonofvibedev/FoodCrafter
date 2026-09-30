import { Camera, Trash2 } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { compressAvatar } from '../lib/image'
import { dailyKcal } from '../lib/calc'
import type { Goal, Profile, Sex } from '../types'
import { ACTIVITY, GOAL_TITLE } from '../types'
import Avatar from './Avatar'
import BottomSheet from './BottomSheet'
import SegmentedControl from './SegmentedControl'

const LIMITS = {
  age: [10, 120],
  height: [100, 250],
  weight: [25, 300],
  kcal: [800, 8000],
} as const

interface Props {
  open: boolean
  profile: Profile
  onClose: () => void
  onSave: (patch: Partial<Profile>) => void
}

type Draft = {
  name: string
  sex: Sex
  age: string
  height: string
  weight: string
  activity: number
  goal: Goal
  kcalOverride: string
  macroSplit: Profile['macroSplit']
  avatar?: string
}

const toDraft = (p: Profile): Draft => ({
  name: p.name,
  sex: p.sex,
  age: String(p.age),
  height: String(p.height),
  weight: String(p.weight),
  activity: p.activity,
  goal: p.goal,
  kcalOverride: p.kcalOverride ? String(p.kcalOverride) : '',
  macroSplit: p.macroSplit,
  avatar: p.avatar,
})

function checkRange(raw: string, [min, max]: readonly [number, number]): string | null {
  const n = Number(raw.replace(',', '.'))
  if (!raw.trim() || Number.isNaN(n)) return 'Введите число'
  if (n < min || n > max) return `Допустимо от ${min} до ${max}`
  return null
}

/** Единственное место, где профиль редактируется: шторка снизу, модалка на десктопе. */
export default function ProfileEditSheet({ open, profile, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile))
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const id = useId()

  // Каждое открытие начинается с актуальных данных профиля.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(toDraft(profile))
      setPhotoError(null)
    }
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const splitSum = draft.macroSplit.protein + draft.macroSplit.fat + draft.macroSplit.carbs
  const errors = {
    age: checkRange(draft.age, LIMITS.age),
    height: checkRange(draft.height, LIMITS.height),
    weight: checkRange(draft.weight, LIMITS.weight),
    kcalOverride: draft.kcalOverride.trim() ? checkRange(draft.kcalOverride, LIMITS.kcal) : null,
    macroSplit: splitSum === 100 ? null : `Сумма процентов ${splitSum}%, а должно быть 100%`,
  }
  const valid = Object.values(errors).every((e) => e === null)

  const num = (raw: string) => Number(raw.replace(',', '.'))

  const submit = () => {
    if (!valid) return
    onSave({
      name: draft.name.trim().slice(0, 40),
      sex: draft.sex,
      age: Math.round(num(draft.age)),
      height: Math.round(num(draft.height)),
      weight: Math.round(num(draft.weight) * 10) / 10,
      activity: draft.activity,
      goal: draft.goal,
      kcalOverride: draft.kcalOverride.trim() ? Math.round(num(draft.kcalOverride)) : undefined,
      macroSplit: draft.macroSplit,
      avatar: draft.avatar,
    })
  }

  /** «Рассчитать» подставляет норму по Миффлину—Сан Жеору из текущих полей. */
  const recalc = () => {
    if (errors.age || errors.height || errors.weight) return
    const kcal = dailyKcal({
      ...profile,
      sex: draft.sex,
      age: Math.round(num(draft.age)),
      height: Math.round(num(draft.height)),
      weight: num(draft.weight),
      activity: draft.activity,
      goal: draft.goal,
      kcalOverride: undefined,
    })
    set('kcalOverride', String(kcal))
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Изменить профиль">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center gap-4">
          <Avatar name={draft.name} src={draft.avatar} size={72} />
          <div className="flex min-w-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-[15px] font-semibold"
            >
              <Camera className="size-4" aria-hidden />
              {draft.avatar ? 'Заменить фото' : 'Загрузить фото'}
            </button>
            {draft.avatar && (
              <button
                type="button"
                onClick={() => set('avatar', undefined)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-semibold text-danger"
              >
                <Trash2 className="size-4" aria-hidden />
                Удалить фото
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="Фото профиля"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try {
              set('avatar', await compressAvatar(file))
              setPhotoError(null)
            } catch {
              setPhotoError('Не удалось обработать файл')
            }
          }}
        />
        {photoError && (
          <p role="alert" className="text-[14px] text-danger">
            {photoError}
          </p>
        )}

        <Labeled label="Имя" htmlFor={`${id}-name`}>
          <input
            id={`${id}-name`}
            value={draft.name}
            maxLength={40}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Как вас зовут"
            className="w-full rounded-tile bg-muted px-4 py-3 text-[17px]"
          />
        </Labeled>

        <SegmentedControl
          label="Пол"
          value={draft.sex}
          onChange={(sex) => set('sex', sex as Sex)}
          options={[
            { value: 'male', label: 'Мужчина' },
            { value: 'female', label: 'Женщина' },
          ]}
        />

        <div className="grid grid-cols-3 gap-3">
          <NumberInput
            id={`${id}-age`}
            label="Возраст"
            suffix="лет"
            value={draft.age}
            error={errors.age}
            onChange={(v) => set('age', v)}
          />
          <NumberInput
            id={`${id}-height`}
            label="Рост"
            suffix="см"
            value={draft.height}
            error={errors.height}
            onChange={(v) => set('height', v)}
          />
          <NumberInput
            id={`${id}-weight`}
            label="Вес"
            suffix="кг"
            value={draft.weight}
            error={errors.weight}
            onChange={(v) => set('weight', v)}
          />
        </div>

        <Labeled label="Уровень активности" htmlFor={`${id}-activity`}>
          <select
            id={`${id}-activity`}
            value={draft.activity}
            onChange={(e) => set('activity', Number(e.target.value))}
            className="w-full rounded-tile bg-muted px-4 py-3 text-[15px]"
          >
            {ACTIVITY.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </Labeled>

        <div>
          <span className="mb-2 block text-[14px] text-ink2">Цель</span>
          <SegmentedControl
            label="Цель"
            value={draft.goal}
            onChange={(goal) => set('goal', goal as Goal)}
            options={(Object.keys(GOAL_TITLE) as Goal[]).map((g) => ({
              value: g,
              label: GOAL_TITLE[g],
            }))}
          />
        </div>

        <Labeled label="Норма калорий" htmlFor={`${id}-kcal`} error={errors.kcalOverride}>
          <div className="flex gap-2">
            <input
              id={`${id}-kcal`}
              inputMode="numeric"
              value={draft.kcalOverride}
              onChange={(e) => set('kcalOverride', e.target.value)}
              placeholder="авто"
              aria-invalid={errors.kcalOverride ? true : undefined}
              className="min-w-0 flex-1 rounded-tile bg-muted px-4 py-3 text-[17px] tabular-nums"
            />
            <button
              type="button"
              onClick={recalc}
              className="shrink-0 rounded-tile bg-accent-soft px-4 py-3 text-[15px] font-semibold text-[var(--add-text)]"
            >
              Рассчитать
            </button>
          </div>
        </Labeled>

        <fieldset className="min-w-0">
          <legend className="mb-2 text-[14px] text-ink2">Распределение БЖУ, %</legend>
          {(['protein', 'fat', 'carbs'] as const).map((k) => (
            <label key={k} className="mb-2 flex items-center gap-3">
              <span className="w-20 shrink-0 text-[15px]">
                {k === 'protein' ? 'Белки' : k === 'fat' ? 'Жиры' : 'Углеводы'}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={draft.macroSplit[k]}
                data-no-swipe
                onChange={(e) =>
                  set('macroSplit', { ...draft.macroSplit, [k]: Number(e.target.value) })
                }
                className="min-w-0 flex-1 accent-[var(--accent)]"
              />
              <span className="w-12 shrink-0 text-right text-[15px] tabular-nums">
                {draft.macroSplit[k]}%
              </span>
            </label>
          ))}
          {errors.macroSplit && (
            <p role="alert" className="text-[14px] text-danger">
              {errors.macroSplit}
            </p>
          )}
        </fieldset>

        <div className="sticky bottom-0 -mx-4 flex gap-2 bg-surface px-4 pt-3 pb-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-muted px-4 py-3 text-[17px] font-semibold"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="flex-1 rounded-full bg-accent px-4 py-3 text-[17px] font-semibold text-on-accent disabled:opacity-40"
          >
            Сохранить
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}

function Labeled({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[14px] text-ink2">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function NumberInput({
  id,
  label,
  suffix,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  suffix: string
  value: string
  error: string | null
  onChange: (v: string) => void
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-[14px] text-ink2">
        {label}, {suffix}
      </label>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-tile bg-muted px-3 py-3 text-[17px] tabular-nums ${
          error ? 'outline outline-danger' : ''
        }`}
      />
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
