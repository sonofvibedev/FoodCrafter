import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Plus, Share2, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import BottomSheet from '../components/BottomSheet'
import { categoryEmoji, categoryTitle } from '../lib/format'
import Screen from '../components/Screen'
import SegmentedControl from '../components/SegmentedControl'
import Stepper from '../components/Stepper'
import { useDishMap, useIngredientMap } from '../hooks'
import { buildShoppingList, formatGrams, formatPrice, groupByCategory } from '../lib/calc'
import { addDays, formatRange, monthGrid, today, weekDays, weekStart } from '../lib/date'
import { useStore } from '../store'
import { CATEGORIES, type CartLine, type CategoryId } from '../types'

type Period = 'day' | 'week' | 'month' | 'custom'

export default function CartScreen() {
  const [period, setPeriod] = useState<Period>('week')
  const [from, setFrom] = useState(() => today())
  const [to, setTo] = useState(() => addDays(today(), 6))
  const [addOpen, setAddOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const days = useStore((s) => s.days)
  const cart = useStore((s) => s.cart)
  const toggleBought = useStore((s) => s.toggleBought)
  const adjustLine = useStore((s) => s.adjustLine)
  const removeManual = useStore((s) => s.removeManual)
  const resetCartMarks = useStore((s) => s.resetCartMarks)
  const ingredients = useIngredientMap()
  const dishes = useDishMap()

  const range = useMemo(() => {
    const now = today()
    if (period === 'day') return [now, now] as const
    if (period === 'week') {
      const w = weekDays(weekStart(now))
      return [w[0], w[6]] as const
    }
    if (period === 'month') {
      const g = monthGrid(now)
      return [g[0], g[g.length - 1]] as const
    }
    return [from <= to ? from : to, from <= to ? to : from] as const
  }, [period, from, to])

  const lines = useMemo(() => {
    const dates: string[] = []
    for (let d = range[0]; d <= range[1]; d = addDays(d, 1)) dates.push(d)
    return buildShoppingList(
      dates.map((d) => days[d] ?? []),
      ingredients,
      dishes,
      cart.manual,
      cart.adjust,
    )
  }, [range, days, ingredients, dishes, cart.manual, cart.adjust])

  const pending = lines.filter((l) => !cart.checked[l.key])
  const bought = lines.filter((l) => cart.checked[l.key])
  const groups = groupByCategory(pending)
  const total = lines.reduce((s, l) => s + (l.price ?? 0), 0)

  const asText = () =>
    [
      `Список покупок · ${formatRange(range[0], range[1])}`,
      ...groups.flatMap((g) => [
        '',
        categoryTitle(g.category),
        ...g.lines.map((l) => `— ${l.name} ${formatGrams(l.grams)}`),
      ]),
      ...(total > 0 ? ['', `Итого: ${formatPrice(total)}`] : []),
    ].join('\n')

  const copy = async () => {
    await navigator.clipboard.writeText(asText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const share = async () => {
    const text = asText()
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Список покупок', text })
        return
      } catch {
        // отменили диалог — падаем в копирование
      }
    }
    await copy()
  }

  return (
    <Screen>
      <h1 className="mb-4 text-[34px] leading-tight font-bold">Корзина</h1>

      <SegmentedControl
        className="mb-3"
        label="Период"
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'day', label: 'День' },
          { value: 'week', label: 'Неделя' },
          { value: 'month', label: 'Месяц' },
          { value: 'custom', label: 'Свой' },
        ]}
      />

      {period === 'custom' ? (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Начало периода"
            className="min-w-0 flex-1 rounded-tile bg-surface px-3 py-2 text-[15px]"
          />
          <span className="text-ink2">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Конец периода"
            className="min-w-0 flex-1 rounded-tile bg-surface px-3 py-2 text-[15px]"
          />
        </div>
      ) : (
        <p className="mb-4 text-[15px] text-ink2">{formatRange(range[0], range[1])}</p>
      )}

      {lines.length === 0 ? (
        <p className="rounded-card bg-surface p-6 text-center text-[15px] text-ink2">
          За этот период ничего не запланировано. Добавьте блюда во вкладке «План».
        </p>
      ) : (
        <>
          {groups.map((g) => (
            <section key={g.category} className="mb-5">
              <h2 className="mb-2 text-[17px] font-bold">
                {categoryEmoji(g.category)} {categoryTitle(g.category)}
              </h2>
              <ul className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {g.lines.map((l) => (
                    <CartRow
                      key={l.key}
                      line={l}
                      checked={false}
                      onToggle={() => toggleBought(l.key)}
                      onAdjust={(d) => adjustLine(l.key, d)}
                      onRemove={l.manual ? () => removeManual(l.key) : undefined}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}

          {bought.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 text-[17px] font-bold text-ink2">Куплено</h2>
              <ul className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {bought.map((l) => (
                    <CartRow
                      key={l.key}
                      line={l}
                      checked
                      onToggle={() => toggleBought(l.key)}
                      onAdjust={(d) => adjustLine(l.key, d)}
                      onRemove={l.manual ? () => removeManual(l.key) : undefined}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          )}

          {total > 0 && (
            <div className="mb-4 flex items-baseline justify-between rounded-tile bg-surface px-4 py-3">
              <span className="text-[17px] font-bold">Итого</span>
              <span className="text-[20px] font-bold tabular-nums">{formatPrice(total)}</span>
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[15px] font-semibold"
        >
          <Plus className="size-4" aria-hidden />
          Добавить позицию
        </button>
        <button
          type="button"
          onClick={copy}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-[15px] font-semibold"
        >
          <Copy className="size-4" aria-hidden />
          {copied ? 'Скопировано' : 'Скопировать'}
        </button>
        <button
          type="button"
          onClick={share}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-[15px] font-semibold text-white"
        >
          <Share2 className="size-4" aria-hidden />
          Поделиться
        </button>
      </div>

      {(bought.length > 0 || Object.keys(cart.adjust).length > 0) && (
        <button
          type="button"
          onClick={resetCartMarks}
          className="mt-2 w-full rounded-full px-4 py-3 text-[15px] font-semibold text-ink2"
        >
          Сбросить отметки и правки
        </button>
      )}

      <AddManualSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </Screen>
  )
}

function CartRow({
  line,
  checked,
  onToggle,
  onAdjust,
  onRemove,
}: {
  line: CartLine
  checked: boolean
  onToggle: () => void
  onAdjust: (deltaGrams: number) => void
  onRemove?: () => void
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 rounded-tile bg-surface px-3 py-2"
    >
      <button
        type="button"
        onClick={onToggle}
        role="checkbox"
        aria-checked={checked}
        aria-label={`${line.name}: ${checked ? 'вернуть в список' : 'отметить купленным'}`}
        className={`grid size-7 shrink-0 place-items-center rounded-full border-2 ${
          checked ? 'border-accent bg-accent text-white' : 'border-line'
        }`}
      >
        {checked && <Check className="size-4" aria-hidden />}
      </button>

      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-bold ${checked ? 'text-ink2 line-through' : ''}`}>
          {line.emoji ?? categoryEmoji(line.category)} {line.name}
        </span>
        <span className="block text-[13px] text-ink2 tabular-nums">
          {formatGrams(line.grams)}
          {line.price ? ` · ${formatPrice(line.price)}` : ''}
        </span>
      </span>

      <Stepper
        compact
        label={`Количество: ${line.name}`}
        value={line.grams}
        step={50}
        min={0}
        onChange={(v) => onAdjust(v - line.grams)}
      />

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Удалить ${line.name}`}
          className="grid size-8 shrink-0 place-items-center rounded-full text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      )}
    </motion.li>
  )
}

function AddManualSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addManual = useStore((s) => s.addManual)
  const [name, setName] = useState('')
  const [grams, setGrams] = useState(500)
  const [category, setCategory] = useState<CategoryId>('other')

  return (
    <BottomSheet open={open} onClose={onClose} title="Своя позиция">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          addManual(name.trim(), grams, category)
          setName('')
          setGrams(500)
          onClose()
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название"
          aria-label="Название позиции"
          className="rounded-full bg-muted px-4 py-3 text-[17px]"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] text-ink2">Количество</span>
          <Stepper label="Количество, г" suffix="г" value={grams} step={50} min={0} onChange={setGrams} />
        </div>
        <label className="flex items-center justify-between gap-2">
          <span className="text-[15px] text-ink2">Категория</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId)}
            className="rounded-lg bg-muted px-3 py-2 text-[17px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-full bg-accent px-4 py-3 text-[17px] font-semibold text-white disabled:opacity-40"
        >
          Добавить
        </button>
      </form>
    </BottomSheet>
  )
}
