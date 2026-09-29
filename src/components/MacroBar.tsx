import type { Macros } from '../types'
import CountUp from './CountUp'

interface Props {
  macros: Macros
  /** Норма из профиля. Если задана — под числами рисуется прогресс. */
  target?: Macros
  className?: string
}

const CELLS = [
  { key: 'kcal', label: 'ККАЛ', decimals: 0 },
  { key: 'protein', label: 'Белок', decimals: 1 },
  { key: 'fat', label: 'Жиры', decimals: 1 },
  { key: 'carbs', label: 'Углеводы', decimals: 1 },
] as const

/** Плашка КБЖУ из макета: четыре колонки «число / подпись». */
export default function MacroBar({ macros, target, className = '' }: Props) {
  return (
    <div
      className={`grid grid-cols-4 gap-1 rounded-tile bg-muted px-2 py-3 ${className}`}
      role="group"
      aria-label="КБЖУ"
    >
      {CELLS.map(({ key, label, decimals }) => {
        const value = macros[key]
        const goal = target?.[key]
        const ratio = goal && goal > 0 ? Math.min(value / goal, 1) : 0
        const over = goal ? value > goal * 1.05 : false
        return (
          <div key={key} className="flex flex-col items-center gap-1 px-1">
            <span className="text-[17px] font-bold tabular-nums">
              <CountUp value={value} decimals={decimals} />
            </span>
            <span className="text-[11px] text-ink2">{label}</span>
            {goal ? (
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-placeholder"
                role="progressbar"
                aria-valuenow={Math.round(value)}
                aria-valuemin={0}
                aria-valuemax={Math.round(goal)}
                aria-label={`${label}: ${Math.round(value)} из ${Math.round(goal)}`}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${
                    over ? 'bg-danger' : 'bg-accent'
                  }`}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
