import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick: () => void
  className?: string
  ariaLabel?: string
}

/** Пунктирная карточка «Добавить» из макета. */
export default function DashedAddCard({ children, onClick, className = '', ariaLabel }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.97 }}
      className={`
        flex w-full items-center justify-center rounded-dashed border-2 border-dashed
        border-ink px-4 py-[18px] text-[17px] font-semibold
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
