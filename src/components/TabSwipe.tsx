import { animate, motion, useMotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
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

/** Доводка трека: короткий tween предсказуемее пружины на широких экранах. */
const SETTLE = { type: 'tween', duration: 0.28, ease: [0.22, 0.61, 0.36, 1] } as const

/**
 * Открыта шторка или диалог. Смотрим на замок прокрутки body, а не на узел
 * [role="dialog"]: он ещё живёт, пока шторка доигрывает закрытие.
 */
function modalOpen(): boolean {
  return document.body.style.overflow === 'hidden'
}

/** Элемент запрещает свайп: поле ввода, слайдер или помеченный контейнер. */
function blocksSwipe(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest('[data-no-swipe],input,textarea,select,[role="slider"],[contenteditable]'),
  )
}

export default function TabSwipe() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const reduced = usePrefersReducedMotion()
  const index = tabIndexOf(pathname)
  const enabled = !isNestedScreen(pathname)

  const viewport = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  /** Сдвиг трека в пикселях: и база раздела, и то, что тянет палец. */
  const trackX = useMotionValue(0)
  const prevWidth = useRef(0)
  const wheel = useRef({ sum: 0, until: 0 })

  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // Трек и индикатор таб-бара едут к активному разделу: и после свайпа,
  // и после нажатия в таб-баре, и после кнопки «Назад» в браузере.
  useEffect(() => {
    if (!width) return
    const instant = prevWidth.current !== width || reduced
    prevWidth.current = width
    const track = animate(trackX, -index * width, instant ? { duration: 0 } : SETTLE)
    const bar = animate(tabProgress, index, reduced ? { duration: 0 } : SETTLE)
    return () => {
      track.stop()
      bar.stop()
    }
  }, [index, width, reduced, trackX])

  /**
   * Жест слушаем через touch-события, а не pointer: браузер считает
   * горизонтальное движение началом прокрутки и забирает pointer-жест себе
   * через pointercancel. Здесь мы гасим прокрутку через preventDefault —
   * для этого слушатель touchmove должен быть неленивым (passive: false).
   */
  useEffect(() => {
    const el = viewport.current
    if (!el || !enabled || !width) return

    let id = -1
    let x0 = 0
    let y0 = 0
    let t0 = 0
    let axis: '' | 'x' | 'y' = ''

    const settleTo = (target: number) =>
      animate(trackX, target, reduced ? { duration: 0 } : SETTLE)

    const onStart = (e: TouchEvent) => {
      id = -1
      if (e.touches.length !== 1) return
      if (modalOpen()) return
      if (blocksSwipe(e.target)) return
      const t = e.touches[0]
      id = t.identifier
      x0 = t.clientX
      y0 = t.clientY
      t0 = performance.now()
      axis = ''
    }

    const onMove = (e: TouchEvent) => {
      if (id < 0) return
      const t = Array.from(e.touches).find((touch) => touch.identifier === id)
      if (!t) return
      const dx = t.clientX - x0
      const dy = t.clientY - y0

      if (axis === '') {
        if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        // Вертикальный жест отдаём браузеру: это обычная прокрутка.
        if (axis === 'y') {
          id = -1
          return
        }
      }

      if (e.cancelable) e.preventDefault()
      // На крайних разделах ход резиновый.
      const edge = (index === 0 && dx > 0) || (index === TABS.length - 1 && dx < 0)
      const shift = edge ? dx * 0.28 : dx
      trackX.set(-index * width + shift)
      tabProgress.set(index - shift / width)
    }

    const onEnd = (e: TouchEvent) => {
      if (id < 0) return
      const t = Array.from(e.changedTouches).find((touch) => touch.identifier === id)
      id = -1
      if (!t || axis !== 'x') return

      const dx = t.clientX - x0
      const velocity = (dx / Math.max(1, performance.now() - t0)) * 1000
      const far = Math.abs(dx) > width * DISTANCE_RATIO || Math.abs(velocity) > VELOCITY
      const next = index + (dx < 0 ? 1 : -1)

      // Переход доедет сам: эффект выше догонит трек до нового индекса.
      if (far && next >= 0 && next < TABS.length) navigate(TABS[next].to)
      else {
        settleTo(-index * width)
        animate(tabProgress, index, reduced ? { duration: 0 } : SETTLE)
      }
    }

    const onCancel = () => {
      if (id < 0) return
      id = -1
      settleTo(-index * width)
      animate(tabProgress, index, reduced ? { duration: 0 } : SETTLE)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onCancel)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onCancel)
    }
  }, [enabled, width, index, reduced, navigate, trackX])

  // Десктоп: стрелки и горизонтальный трекпад.
  useEffect(() => {
    if (!enabled) return

    const go = (next: number) => {
      if (next < 0 || next >= TABS.length || next === index) return false
      navigate(TABS[next].to)
      return true
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (modalOpen()) return
      if (blocksSwipe(e.target)) return
      go(index + (e.key === 'ArrowRight' ? 1 : -1))
    }

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      if (modalOpen()) return
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
  }, [enabled, index, navigate])

  return (
    <div className="fixed inset-0 lg:pl-[110px]">
      {/* Отдельный слой обрезки: иначе соседний раздел вылезает под сайдбар. */}
      <div ref={viewport} className="h-full touch-pan-y overflow-hidden">
        <motion.div className="flex h-full w-[400%]" style={{ x: trackX }}>
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
    </div>
  )
}
