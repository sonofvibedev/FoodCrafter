import { motion, useTransform } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import { useMediaQuery } from '../hooks'
import { TABS, tabIndexOf, tabProgress } from '../tabs'

/** Шаг индикатора: кнопка 70px + промежуток 4px. */
const STEP = 74

export default function TabBar() {
  const { pathname } = useLocation()
  const active = tabIndexOf(pathname)
  const vertical = useMediaQuery('(min-width: 1024px)')

  const offset = useTransform(tabProgress, (p) => p * STEP)
  const zero = useTransform(tabProgress, () => 0)

  return (
    <nav
      aria-label="Основная навигация"
      className="
        pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center
        pb-[calc(env(safe-area-inset-bottom)+14px)]
        lg:inset-y-0 lg:right-auto lg:left-0 lg:bottom-auto lg:items-center lg:pb-0 lg:pl-5
      "
    >
      <ul
        className="
          pointer-events-auto relative flex items-center gap-1 rounded-[100px] bg-tabbar px-2 py-1
          shadow-[0_8px_28px_rgba(0,0,0,0.22)]
          lg:flex-col lg:gap-2 lg:px-1 lg:py-2
        "
      >
        <motion.span
          aria-hidden
          style={{ x: vertical ? zero : offset, y: vertical ? offset : zero }}
          className="absolute top-1 left-2 size-[70px] rounded-full bg-accent lg:top-2 lg:left-1"
        />
        {TABS.map(({ to, label, Icon }, i) => {
          const isActive = i === active
          return (
            <li key={to}>
              <NavLink
                to={to}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="relative grid size-[70px] place-items-center rounded-full"
              >
                {!isActive && (
                  <span className="absolute inset-0 rounded-full bg-[var(--fc-tabbar-item)]" />
                )}
                <Icon
                  className="relative size-7"
                  strokeWidth={isActive ? 2.4 : 2}
                  color={isActive ? 'var(--accent-contrast)' : 'rgba(255,255,255,0.72)'}
                  aria-hidden
                />
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
