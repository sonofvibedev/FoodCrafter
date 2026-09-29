import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Экран внутри вкладки: отступы, безопасные зоны, место под таб-бар. */
export default function Screen({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`
        mx-auto w-full max-w-[1200px] px-4
        pt-[calc(env(safe-area-inset-top)+16px)]
        pb-[calc(env(safe-area-inset-bottom)+120px)]
        lg:pb-10
        ${className}
      `}
    >
      {children}
    </motion.main>
  )
}
