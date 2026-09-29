import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import Photo from './Photo'

interface Props {
  name: string
  /** Вторая строка: «К 54 Б 10 Ж 10 У 10» или вес. */
  subtitle?: ReactNode
  photo?: string
  emoji?: string
  right?: ReactNode
  onClick?: () => void
  className?: string
  strikethrough?: boolean
}

/** Строка продукта (компонент Courier из макета). */
export default function ProductRow({
  name,
  subtitle,
  photo,
  emoji,
  right,
  onClick,
  className = '',
  strikethrough = false,
}: Props) {
  const body = (
    <>
      <Photo
        src={photo}
        emoji={emoji}
        alt={name}
        className="size-11 shrink-0 rounded-[10px]"
        emojiClass="text-xl"
      />
      <span className="min-w-0 flex-1 text-left">
        <span
          className={`block truncate text-[15px] font-bold ${
            strikethrough ? 'text-ink2 line-through' : ''
          }`}
        >
          {name}
        </span>
        {subtitle ? <span className="block truncate text-[13px] text-ink2">{subtitle}</span> : null}
      </span>
      {right ? <span className="shrink-0">{right}</span> : null}
    </>
  )

  if (!onClick) {
    return (
      <div className={`flex items-center gap-3 rounded-tile px-2 py-2 ${className}`}>{body}</div>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`flex w-full items-center gap-3 rounded-tile px-2 py-2 text-left ${className}`}
    >
      {body}
    </motion.button>
  )
}
