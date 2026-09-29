import { motion } from 'framer-motion'
import { Apple, CircleUserRound, ShoppingBasket, UtensilsCrossed } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/plan', label: 'План', Icon: UtensilsCrossed },
  { to: '/products', label: 'Продукты', Icon: Apple },
  { to: '/cart', label: 'Корзина', Icon: ShoppingBasket },
  { to: '/profile', label: 'Профиль', Icon: CircleUserRound },
]

export default function TabBar() {
  const { pathname } = useLocation()

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
          pointer-events-auto flex items-center gap-1 rounded-[100px] bg-tabbar px-2 py-1
          shadow-[0_8px_28px_rgba(0,0,0,0.22)]
          lg:flex-col lg:gap-2 lg:px-1 lg:py-2
        "
      >
        {TABS.map(({ to, label, Icon }) => {
          const active = pathname.startsWith(to)
          return (
            <li key={to}>
              <NavLink
                to={to}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className="relative grid size-[70px] place-items-center rounded-full"
              >
                {active ? (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-full bg-[var(--fc-tabbar-item)]" />
                )}
                <Icon
                  className="relative size-7"
                  strokeWidth={active ? 2.4 : 2}
                  color={active ? '#fff' : 'rgba(255,255,255,0.72)'}
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
