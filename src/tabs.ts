import { motionValue } from 'framer-motion'
import { Apple, CircleUserRound, ShoppingBasket, UtensilsCrossed } from 'lucide-react'

/** Четыре основных раздела в порядке таб-бара — он же порядок свайпа. */
export const TABS = [
  { to: '/plan', label: 'План', Icon: UtensilsCrossed },
  { to: '/products', label: 'Библиотека', Icon: Apple },
  { to: '/cart', label: 'Корзина', Icon: ShoppingBasket },
  { to: '/profile', label: 'Профиль', Icon: CircleUserRound },
] as const

/** Дробный индекс активного раздела: таб-бар двигает индикатор за пальцем. */
export const tabProgress = motionValue(0)

export function tabIndexOf(pathname: string): number {
  const i = TABS.findIndex((t) => pathname.startsWith(t.to))
  return i < 0 ? 0 : i
}

/** Вложенные экраны: свайп между разделами на них выключен. */
export function isNestedScreen(pathname: string): boolean {
  return /^\/plan\/day\//.test(pathname) || /^\/products\/(dish|ingredient)\b/.test(pathname)
}

/** Экраны библиотеки открываются поверх разделов, а не внутри свайпа. */
export function isOverlayScreen(pathname: string): boolean {
  return /^\/products\/(dish|ingredient)\b/.test(pathname)
}
