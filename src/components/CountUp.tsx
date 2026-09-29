import { animate, useMotionValue, useTransform, motion } from 'framer-motion'
import { useEffect } from 'react'
import { usePrefersReducedMotion } from '../hooks'

interface Props {
  value: number
  decimals?: number
  className?: string
}

/** Число, которое «докручивается» до значения. */
export default function CountUp({ value, decimals = 0, className }: Props) {
  const reduced = usePrefersReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => v.toFixed(decimals))

  useEffect(() => {
    if (reduced) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 0.6, ease: 'easeOut' })
    return () => controls.stop()
  }, [value, mv, reduced])

  return <motion.span className={className}>{text}</motion.span>
}
