import CountUp from './CountUp'

interface Props {
  /** Съедено сегодня, ккал. */
  value: number
  /** Дневная норма, ккал. */
  target: number
  size?: number
}

/** Кольцо «съедено сегодня / норма». Перебор кольцо красит в цвет ошибки. */
export default function ProgressRing({ value, target, size = 116 }: Props) {
  const stroke = 12
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const ratio = target > 0 ? Math.min(value / target, 1) : 0
  const over = target > 0 && value > target * 1.05

  return (
    <div
      className="flex items-center gap-4"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={Math.round(target)}
      aria-valuenow={Math.round(value)}
      aria-label={`Съедено сегодня ${Math.round(value)} из ${Math.round(target)} ккал`}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-placeholder"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
            className={`transition-[stroke-dashoffset] duration-700 ${
              over ? 'stroke-danger' : 'stroke-accent'
            }`}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-center">
          <span className="text-[22px] font-bold tabular-nums">
            <CountUp value={Math.round(value)} />
          </span>
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-bold">Съедено сегодня</p>
        <p className="text-[14px] text-ink2 tabular-nums">
          из {Math.round(target)} ккал · осталось {Math.max(0, Math.round(target - value))}
        </p>
      </div>
    </div>
  )
}
