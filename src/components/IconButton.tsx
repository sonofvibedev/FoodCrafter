import { motion } from 'framer-motion'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'glass' | 'accent' | 'outline'

interface Props extends Omit<ComponentProps<typeof motion.button>, 'children'> {
  children: ReactNode
  label: string
  variant?: Variant
}

const STYLES: Record<Variant, string> = {
  glass: 'bg-surface text-ink shadow-[0_2px_10px_rgba(0,0,0,0.14)]',
  accent: 'bg-accent text-white',
  outline: 'border border-ink text-ink',
}

/** Круглая кнопка из макета (назад, «+», подтверждение). */
export default function IconButton({ children, label, variant = 'glass', ...rest }: Props) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      {...rest}
      className={`grid size-11 shrink-0 place-items-center rounded-full ${STYLES[variant]} ${
        rest.className ?? ''
      }`}
    >
      {children}
    </motion.button>
  )
}
