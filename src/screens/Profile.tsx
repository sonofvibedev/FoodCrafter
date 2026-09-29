import { Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import MacroBar from '../components/MacroBar'
import Screen from '../components/Screen'
import SegmentedControl from '../components/SegmentedControl'
import { useTargets } from '../hooks'
import { bmr, dailyKcal } from '../lib/calc'
import { exportPayload, useStore } from '../store'
import type { Goal, Sex, ThemeMode } from '../types'

const ACTIVITY = [
  { value: 1.2, label: 'Сидячий образ жизни' },
  { value: 1.375, label: 'Лёгкая активность, 1–3 тренировки' },
  { value: 1.55, label: 'Средняя активность, 3–5 тренировок' },
  { value: 1.725, label: 'Высокая активность, 6–7 тренировок' },
  { value: 1.9, label: 'Очень высокая, физическая работа' },
]

export default function ProfileScreen() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const demo = useStore((s) => s.demo)
  const clearDemo = useStore((s) => s.clearDemo)
  const resetAll = useStore((s) => s.resetAll)
  const importAll = useStore((s) => s.importAll)
  const targets = useTargets()

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const split = profile.macroSplit
  const splitSum = split.protein + split.fat + split.carbs

  const setSplit = (key: keyof typeof split, value: number) =>
    setProfile({ macroSplit: { ...split, [key]: Math.max(0, Math.min(100, value)) } })

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `foodcrafter-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = async (file: File) => {
    try {
      importAll(JSON.parse(await file.text()))
      setMessage('Данные загружены')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Не удалось прочитать файл')
    }
  }

  return (
    <Screen>
      <h1 className="mb-4 text-[34px] leading-tight font-bold">Профиль</h1>

      <section className="mb-6 rounded-card bg-surface p-4">
        <Field label="Имя">
          <input
            value={profile.name}
            onChange={(e) => setProfile({ name: e.target.value })}
            placeholder="—"
            aria-label="Имя"
            className="w-40 rounded-lg bg-transparent text-right text-[17px]"
          />
        </Field>

        <div className="border-b border-line py-3">
          <SegmentedControl
            label="Пол"
            value={profile.sex}
            onChange={(sex) => setProfile({ sex: sex as Sex })}
            options={[
              { value: 'male', label: 'Мужчина' },
              { value: 'female', label: 'Женщина' },
            ]}
          />
        </div>

        <NumberField
          label="Возраст, лет"
          value={profile.age}
          onChange={(age) => setProfile({ age })}
        />
        <NumberField
          label="Рост, см"
          value={profile.height}
          onChange={(height) => setProfile({ height })}
        />
        <NumberField
          label="Вес, кг"
          value={profile.weight}
          onChange={(weight) => setProfile({ weight })}
          step={0.1}
        />

        <label className="flex flex-col gap-2 border-b border-line py-3">
          <span className="text-[17px]">Уровень активности</span>
          <select
            value={profile.activity}
            onChange={(e) => setProfile({ activity: Number(e.target.value) })}
            className="rounded-lg bg-muted px-3 py-2 text-[15px]"
          >
            {ACTIVITY.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <div className="py-3">
          <SegmentedControl
            label="Цель"
            value={profile.goal}
            onChange={(goal) => setProfile({ goal: goal as Goal })}
            options={[
              { value: 'lose', label: 'Похудение' },
              { value: 'keep', label: 'Поддержание' },
              { value: 'gain', label: 'Набор' },
            ]}
          />
        </div>
      </section>

      <section className="mb-6 rounded-card bg-surface p-4">
        <h2 className="mb-3 text-[20px] font-bold">Дневная норма</h2>
        <p className="mb-3 text-[14px] text-ink2">
          Базовый обмен по Миффлину—Сан Жеору: {Math.round(bmr(profile))} ккал. Расчётная норма:{' '}
          {dailyKcal({ ...profile, kcalOverride: undefined })} ккал.
        </p>

        <Field label="Своя норма, ккал">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={profile.kcalOverride ?? ''}
            onChange={(e) => setProfile({ kcalOverride: Number(e.target.value) || undefined })}
            placeholder="авто"
            aria-label="Своя дневная норма калорий"
            className="w-28 rounded-lg bg-transparent text-right text-[17px] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
        </Field>

        <div className="mt-4">
          <MacroBar macros={targets} />
        </div>

        <h3 className="mt-4 mb-2 text-[17px] font-bold">Распределение БЖУ, %</h3>
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
              value={split[k]}
              onChange={(e) => setSplit(k, Number(e.target.value))}
              className="min-w-0 flex-1 accent-[var(--fc-accent)]"
            />
            <span className="w-24 shrink-0 text-right text-[15px] whitespace-nowrap tabular-nums">
              {split[k]}% · {targets[k]} г
            </span>
          </label>
        ))}
        {splitSum !== 100 && (
          <p role="alert" className="text-[14px] text-danger">
            Сумма процентов {splitSum}%, а должно быть 100%.
          </p>
        )}
      </section>

      <section className="mb-6 rounded-card bg-surface p-4">
        <h2 className="mb-3 text-[20px] font-bold">Тема</h2>
        <SegmentedControl
          label="Тема оформления"
          value={profile.theme}
          onChange={(theme) => setProfile({ theme: theme as ThemeMode })}
          options={[
            { value: 'light', label: 'Светлая' },
            { value: 'dark', label: 'Тёмная' },
            { value: 'system', label: 'Системная' },
          ]}
        />
      </section>

      <section className="rounded-card bg-surface p-4">
        <h2 className="mb-3 text-[20px] font-bold">Данные</h2>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={doExport}
            className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[15px] font-semibold"
          >
            <Download className="size-4" aria-hidden />
            Выгрузить в JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[15px] font-semibold"
          >
            <Upload className="size-4" aria-hidden />
            Загрузить из JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void doImport(f)
            }}
          />
          {demo && (
            <button
              type="button"
              onClick={() => {
                clearDemo()
                setMessage('Демо-данные удалены')
              }}
              className="rounded-full bg-muted px-4 py-3 text-[15px] font-semibold"
            >
              Очистить демо-данные
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[15px] font-semibold text-danger"
          >
            <RotateCcw className="size-4" aria-hidden />
            Сбросить все данные
          </button>
        </div>
        {message && (
          <p role="status" className="mt-3 text-center text-[14px] text-ink2">
            {message}
          </p>
        )}
      </section>

      <ConfirmDialog
        open={confirmReset}
        title="Сбросить все данные?"
        description="Библиотека, план и профиль будут очищены. Отменить будет нельзя — выгрузите JSON, если данные нужны."
        confirmLabel="Сбросить"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll()
          setConfirmReset(false)
          setMessage('Данные сброшены')
        }}
      />
    </Screen>
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

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={0}
        step={step}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        aria-label={label}
        className="w-24 rounded-lg bg-transparent text-right text-[17px] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
    </Field>
  )
}
