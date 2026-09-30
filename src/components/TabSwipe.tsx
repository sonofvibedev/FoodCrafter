import { animate, useMotionTemplate, useMotionValue, motion } from 'framer-motion'
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePrefersReducedMotion } from '../hooks'
import CartScreen from '../screens/Cart'
import PlanLayout from '../screens/Plan'
import ProductsScreen from '../screens/Products'
import ProfileScreen from '../screens/Profile'
import { TABS, isNestedScreen, tabIndexOf, tabProgress } from '../tabs'

const PANES = [PlanLayout, ProductsScreen, CartScreen, ProfileScreen]

/** Доля ширины экрана, после которой свайп считается переключением. */
const DISTANCE_RATIO = 0.25
const VELOCITY = 500
/** Пока не сдвинулись на 10px, направление жеста неизвестно. */
const DIRECTION_LOCK = 10

const SPRING = { type: 'spring', stiffness: 420, damping: 40 } as const

/** Элемент запрещает свайп: поле ввода, слайдер или горизонтальный скролл. */
function blocksSwipe(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest('[data-no-swipe],input,textarea,select,[role="slider"],[contenteditable]')) {
    return true
  }
  for (let el: Element | null = target; el; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 1) {
      const overflow = getComputedStyle(el).overflowX
      if (overflow === 'auto' || overflow === 'scroll') return true
    }
  }
  return false
}

export default function TabSwipe() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const reduced = usePrefersReducedMotion()
  const index = tabIndexOf(pathname)
  const enabled = !isNestedScreen(pathname)

  const viewport = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const transform = useMotionTemplate`translateX(calc(${-index * 25}% + ${x}px))`

  const gesture = useRef({ id: -1, x0: 0, y0: 0, t0: 0, axis: '' as '' | 'x' | 'y', width: 1 })
  /** Свайп сам доводит трек до места; смена раздела мимо свайпа обнуляет сдвиг. */
  const committing = useRef(false)
  const wheel = useRef({ sum: 0, until: 0 })

  // Индикатор таб-бара догоняет активный раздел после перехода.
  useEffect(() => {
    if (!committing.current) x.set(0)
    committing.current = false
    const controls = animate(tabProgress, index, reduced ? { duration: 0 } : SPRING)
    return () => controls.stop()
  }, [index, reduced, x])

  const go = (next: number) => {
    if (next < 0 || next >= TABS.length || next === index) return false
    navigate(TABS[next].to)
    return true
  }

  // Перелистывание после отпускания: экран доезжает, x возвращается в ноль.
  const settle = (dx: number, dir: -1 | 0 | 1) => {
    if (dir !== 0 && go(index + dir)) {
      committing.current = true
      x.set(dx + dir * gesture.current.width)
    }
    if (reduced) x.set(0)
    else animate(x, 0, SPRING)
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!enabled || e.pointerType === 'mouse') return
    // Открытая шторка или диалог забирает жест себе.
    if (document.querySelector('[role="dialog"]')) return
    if (blocksSwipe(e.target)) return
    const width = viewport.current?.clientWidth ?? 1
    gesture.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), axis: '', width }
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    const g = gesture.current
    if (g.id !== e.pointerId) return
    const dx = e.clientX - g.x0
    const dy = e.clientY - g.y0

    if (g.axis === '') {
      if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (g.axis === 'y') {
        g.id = -1
        return
      }
    }

    // На крайних разделах ход резиновый.
    const edge = (index === 0 && dx > 0) || (index === TABS.length - 1 && dx < 0)
    const shift = edge ? dx * 0.28 : dx
    x.set(shift)
    tabProgress.set(index - shift / g.width)
  }

  const onPointerUp = (e: ReactPointerEvent) => {
    const g = gesture.current
    if (g.id !== e.pointerId) return
    g.id = -1
    if (g.axis !== 'x') return

    const dx = e.clientX - g.x0
    const dt = Math.max(1, performance.now() - g.t0)
    const velocity = (dx / dt) * 1000
    const far = Math.abs(dx) > g.width * DISTANCE_RATIO || Math.abs(velocity) > VELOCITY
    settle(dx, far ? ((dx < 0 ? 1 : -1) as 1 | -1) : 0)
  }

  // Десктоп: стрелки и горизонтальный трекпад.
  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (document.querySelector('[role="dialog"]')) return
      if (blocksSwipe(e.target)) return
      go(index + (e.key === 'ArrowRight' ? 1 : -1))
    }

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      if (document.querySelector('[role="dialog"]')) return
      if (blocksSwipe(e.target)) return
      const now = performance.now()
      if (now < wheel.current.until) return
      wheel.current.sum += e.deltaX
      if (Math.abs(wheel.current.sum) < 80) return
      const moved = go(index + (wheel.current.sum > 0 ? 1 : -1))
      wheel.current = { sum: 0, until: moved ? now + 500 : now + 150 }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, index])

  return (
    <div
      ref={viewport}
      className="fixed inset-0 overflow-hidden lg:pl-[110px]"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <motion.div className="flex h-full w-[400%]" style={{ transform }}>
        {PANES.map((Pane, i) => (
          <div
            key={TABS[i].to}
            className="h-full w-1/4 shrink-0 overflow-y-auto overscroll-y-contain"
            aria-hidden={i === index ? undefined : true}
            inert={i !== index}
          >
            {/* Держим в памяти активный раздел и соседей: остальное не рисуем. */}
            {Math.abs(i - index) <= 1 ? <Pane /> : null}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
