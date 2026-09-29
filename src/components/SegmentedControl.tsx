import { motion } from 'framer-motion'
import { useId } from 'react'

interface Props<T extends string> {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
  className?: string
}

/** Переключатель-сегменты из макета: серая дорожка, белая «таблетка». */
export default function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className = '',
}: Props<T>) {
  const id = useId()

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`flex rounded-full bg-muted p-1 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className="relative flex-1 rounded-full px-3 py-2 text-[15px] font-semibold"
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                transition={{ type: 'spring', stiffness: 460, damping: 38 }}
              />
            )}
            <span className={`relative ${active ? '' : 'text-ink2'}`}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
