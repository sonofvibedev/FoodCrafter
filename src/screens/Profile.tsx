import { AnimatePresence, motion } from 'framer-motion'
import {
  Camera,
  Download,
  Flame,
  HeartPulse,
  Pencil,
  RotateCcw,
  Ruler,
  Upload,
  Weight,
} from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import Avatar from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import CountUp from '../components/CountUp'
import MacroBar from '../components/MacroBar'
import ProfileEditSheet from '../components/ProfileEditSheet'
import ProgressRing from '../components/ProgressRing'
import Screen from '../components/Screen'
import SegmentedControl from '../components/SegmentedControl'
import { useDishMap, useIngredientMap, useTargets } from '../hooks'
import { bmr, dailyKcal, dayMacros } from '../lib/calc'
import { today } from '../lib/date'
import { exportPayload, useStore } from '../store'
import {
  ACTIVITY,
  GOAL_TITLE,
  PALETTES,
  type PaletteId,
  type Profile,
  type ThemeMode,
} from '../types'

/** ИМТ и его словесная оценка. */
function bmiOf(p: Profile): { value: number; label: string } {
  const m = p.height / 100
  const value = m > 0 ? p.weight / (m * m) : 0
  const label =
    value < 18.5 ? 'недовес' : value < 25 ? 'норма' : value < 30 ? 'избыток' : 'ожирение'
  return { value: Math.round(value * 10) / 10, label }
}

export default function ProfileScreen() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const days = useStore((s) => s.days)
  const demo = useStore((s) => s.demo)
  const clearDemo = useStore((s) => s.clearDemo)
  const resetAll = useStore((s) => s.resetAll)
  const importAll = useStore((s) => s.importAll)
  const targets = useTargets()
  const ingredients = useIngredientMap()
  const dishes = useDishMap()

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const eaten = useMemo(
    () => dayMacros(days[today()] ?? [], ingredients, dishes).kcal,
    [days, ingredients, dishes],
  )
  const bmi = bmiOf(profile)
  const split = profile.macroSplit
  const activityLabel =
    ACTIVITY.find((a) => a.value === profile.activity)?.label ?? `коэффициент ${profile.activity}`

  const say = (text: string) => {
    setToast(text)
    setTimeout(() => setToast(null), 2400)
  }

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
      say('Данные загружены')
    } catch (e) {
      say(e instanceof Error ? e.message : 'Не удалось прочитать файл')
    }
  }

  return (
    <Screen>
      {/* ------------------------------ Шапка ------------------------------ */}
      <section className="mb-5 overflow-hidden rounded-card bg-surface">
        <div
          className="relative h-[132px] px-4 pt-4"
          style={{ background: 'var(--accent-grad, var(--accent))' }}
        >
          <span
            aria-hidden
            className="absolute -top-10 -left-8 size-40 rounded-full bg-white/15"
          />
          <span
            aria-hidden
            className="absolute top-6 right-24 size-20 rounded-full bg-white/10"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-end gap-6 px-6 pb-3 text-[30px] opacity-20 select-none"
          >
            🥑 🍅 🥕 🍓 🥦
          </span>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="
              absolute top-4 right-4 flex items-center gap-2 rounded-full border border-white/40
              bg-white/20 px-4 py-2 text-[15px] font-semibold text-white backdrop-blur-sm
              transition-colors hover:bg-white/30
            "
          >
            <Pencil className="size-4" aria-hidden />
            Изменить
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="-mt-12 mb-3 flex items-end gap-3">
            <span className="relative">
              <Avatar
                name={profile.name}
                src={profile.avatar}
                size={92}
                className="ring-4 ring-[var(--surface)]"
              />
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                aria-label="Изменить фото"
                className="
                  absolute right-0 bottom-0 grid size-8 place-items-center rounded-full
                  bg-accent text-on-accent ring-4 ring-[var(--surface)]
                "
              >
                <Camera className="size-4" aria-hidden />
              </button>
            </span>
          </div>

          <h1 className="text-[28px] leading-tight font-bold">
            {profile.name.trim() || 'Без имени'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-soft px-3 py-1 text-[14px] font-semibold text-[var(--add-text)]">
              {GOAL_TITLE[profile.goal]}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-[14px] text-ink2">
              {profile.sex === 'male' ? 'Мужчина' : 'Женщина'}, {profile.age}
            </span>
          </div>
        </div>
      </section>

      {/* --------------------------- Кольцо и плитки ------------------------ */}
      <section className="mb-5 rounded-card bg-surface p-4">
        <ProgressRing value={eaten} target={targets.kcal} />
      </section>

      <ul className="mb-5 grid grid-cols-2 gap-3">
        <Tile icon={<Ruler className="size-5" aria-hidden />} tint="#0ea5e9" label="Рост">
          <CountUp value={profile.height} /> см
        </Tile>
        <Tile icon={<Weight className="size-5" aria-hidden />} tint="#10b981" label="Вес">
          <CountUp value={profile.weight} decimals={profile.weight % 1 ? 1 : 0} /> кг
        </Tile>
        <Tile icon={<Flame className="size-5" aria-hidden />} tint="#f59e0b" label="Норма ккал">
          <CountUp value={targets.kcal} />
        </Tile>
        <Tile
          icon={<HeartPulse className="size-5" aria-hidden />}
          tint="#f43f5e"
          label={`ИМТ · ${bmi.label}`}
        >
          <CountUp value={bmi.value} decimals={1} />
        </Tile>
      </ul>

      {/* ------------------------------ Оформление -------------------------- */}
      <section className="mb-5 rounded-card bg-surface p-4">
        <h2 className="mb-3 text-[20px] font-bold">Оформление</h2>
        <ul className="mb-4 flex flex-wrap gap-3">
          {PALETTES.map((p) => {
            const active = profile.palette === p.id
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setProfile({ palette: p.id as PaletteId })}
                  aria-label={p.title}
                  aria-pressed={active}
                  title={p.title}
                  className={`size-12 rounded-full transition-transform active:scale-95 ${
                    active ? 'ring-3 ring-accent ring-offset-3 ring-offset-[var(--surface)]' : ''
                  }`}
                  style={{ background: p.preview }}
                />
              </li>
            )
          })}
        </ul>
        <p className="mb-3 text-[14px] text-ink2">
          Тема: {PALETTES.find((p) => p.id === profile.palette)?.title}
        </p>
        <SegmentedControl
          label="Режим оформления"
          value={profile.theme}
          onChange={(theme) => setProfile({ theme: theme as ThemeMode })}
          options={[
            { value: 'light', label: 'Светлая' },
            { value: 'dark', label: 'Тёмная' },
            { value: 'system', label: 'Системная' },
          ]}
        />
      </section>

      {/* ---------------------------- Дневная норма ------------------------- */}
      <section className="mb-5 rounded-card bg-surface p-4">
        <h2 className="mb-3 text-[20px] font-bold">Дневная норма</h2>
        <MacroBar macros={targets} />
        <dl className="mt-4 flex flex-col gap-2 text-[15px]">
          <Row term="Базовый обмен">{Math.round(bmr(profile))} ккал</Row>
          <Row term="Расчётная норма">
            {dailyKcal({ ...profile, kcalOverride: undefined })} ккал
          </Row>
          <Row term="Своя норма">{profile.kcalOverride ? `${profile.kcalOverride} ккал` : '—'}</Row>
          <Row term="Активность">{activityLabel}</Row>
          <Row term="БЖУ">
            {split.protein} / {split.fat} / {split.carbs} %
          </Row>
        </dl>
      </section>

      {/* ------------------------------- Данные ----------------------------- */}
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
                say('Демо-данные удалены')
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
      </section>

      <ProfileEditSheet
        open={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSave={(patch) => {
          setProfile(patch)
          setEditOpen(false)
          say('Сохранено')
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Сбросить все данные?"
        description="Библиотека, план и профиль будут очищены. Отменить будет нельзя — выгрузите JSON, если данные нужны."
        confirmLabel="Сбросить"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAll()
          setConfirmReset(false)
          say('Данные сброшены')
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="
              fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+110px)] z-40 mx-auto
              max-w-[420px] rounded-full bg-ink px-4 py-3 text-center text-[15px]
              text-[var(--surface)]
            "
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </Screen>
  )
}

function Tile({
  icon,
  tint,
  label,
  children,
}: {
  icon: ReactNode
  tint: string
  label: string
  children: ReactNode
}) {
  return (
    <li className="rounded-card bg-surface p-4">
      <span
        className="mb-3 grid size-10 place-items-center rounded-full text-white"
        style={{ background: tint }}
      >
        {icon}
      </span>
      <span className="block text-[13px] text-ink2">{label}</span>
      <span className="block text-[24px] font-bold tabular-nums">{children}</span>
    </li>
  )
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2 last:border-0">
      <dt className="text-ink2">{term}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}
