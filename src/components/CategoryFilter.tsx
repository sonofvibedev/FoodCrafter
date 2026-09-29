import { Check } from 'lucide-react'
import { CATEGORIES, type CategoryId } from '../types'

interface Props {
  value: CategoryId[]
  onChange: (v: CategoryId[]) => void
}

/** Экран фильтров из макета: чипы категорий, «Все» сбрасывает выбор. */
export default function CategoryFilter({ value, onChange }: Props) {
  const toggle = (id: CategoryId) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Фильтр по категориям">
      <Chip active={value.length === 0} onClick={() => onChange([])} label="Все" />
      {CATEGORIES.map((c) => (
        <Chip
          key={c.id}
          active={value.includes(c.id)}
          onClick={() => toggle(c.id)}
          label={`${c.emoji} ${c.title}`}
        />
      ))}
    </div>
  )
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-full border px-3 py-2 text-[15px] ${
        active ? 'border-accent bg-accent text-white' : 'border-line bg-transparent'
      }`}
    >
      {active && <Check className="size-4" aria-hidden />}
      {label}
    </button>
  )
}
