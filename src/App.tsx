import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import TabBar from './components/TabBar'
import CartScreen from './screens/Cart'
import DayScreen from './screens/Day'
import DishScreen from './screens/Dish'
import DishEditScreen from './screens/DishEdit'
import IngredientEditScreen from './screens/IngredientEdit'
import MealScreen from './screens/Meal'
import PlanLayout from './screens/Plan'
import ProductsScreen from './screens/Products'
import ProfileScreen from './screens/Profile'
import { useStore } from './store'

/** Тема: светлая, тёмная или системная. */
function useTheme() {
  const theme = useStore((s) => s.profile.theme)

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.dataset.theme = dark ? 'dark' : 'light'
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#000000' : '#f2f2f2')
    }
    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}

function AnimatedRoutes() {
  const location = useLocation()
  // анимируем смену вкладки, а не каждый вложенный экран плана
  const key = location.pathname.split('/')[1] || 'plan'

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={key}>
        <Route path="/" element={<Navigate to="/plan" replace />} />
        <Route path="/plan" element={<PlanLayout />}>
          <Route path="day/:date" element={<DayScreen />} />
          <Route path="day/:date/meal/:mealId" element={<MealScreen />} />
        </Route>
        <Route path="/products" element={<ProductsScreen />} />
        <Route path="/products/dish/new" element={<DishEditScreen />} />
        <Route path="/products/dish/:id" element={<DishScreen />} />
        <Route path="/products/dish/:id/edit" element={<DishEditScreen />} />
        <Route path="/products/ingredient/new" element={<IngredientEditScreen />} />
        <Route path="/products/ingredient/:id/edit" element={<IngredientEditScreen />} />
        <Route path="/cart" element={<CartScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="*" element={<Navigate to="/plan" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  useTheme()

  return (
    <HashRouter>
      <div className="min-h-full lg:pl-[110px]">
        <AnimatedRoutes />
        <TabBar />
      </div>
    </HashRouter>
  )
}
