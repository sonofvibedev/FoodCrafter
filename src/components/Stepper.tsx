import { Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  label: string
  /** Компактный вид для строк списка. */
  compact?: boolean
}

/** Степпер «− 1 +» из макета (Frame 192). */
export default function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 100000,
  suffix = '',
  label,
  compact = false,
}: Props) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10) / 10))
  const size = compact ? 'size-8' : 'size-10'

  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={`${label}: уменьшить`}
        className={`grid ${size} place-items-center rounded-full bg-muted disabled:opacity-40`}
      >
        <Minus className="size-4" aria-hidden />
      </motion.button>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
        className={`${
          compact ? 'w-14 text-[14px]' : 'w-20 text-[17px]'
        } rounded-lg bg-transparent px-1 py-1 text-center font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
      />
      {suffix ? <span className="text-[14px] text-ink2">{suffix}</span> : null}

      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={`${label}: увеличить`}
        className={`grid ${size} place-items-center rounded-full bg-accent text-white disabled:opacity-40`}
      >
        <Plus className="size-4" aria-hidden />
      </motion.button>
    </div>
  )
}
