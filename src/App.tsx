import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Background from './components/Background'
import TabBar from './components/TabBar'
import TabSwipe from './components/TabSwipe'
import { WhatsNewOnUpdate } from './components/WhatsNew'
import DishScreen from './screens/Dish'
import DishEditScreen from './screens/DishEdit'
import IngredientEditScreen from './screens/IngredientEdit'
import { useStore } from './store'
import { TABS, isOverlayScreen } from './tabs'

/** Тема: палитра (1–5) и режим — светлый, тёмный или системный. */
function useTheme() {
  const theme = useStore((s) => s.profile.theme)
  const palette = useStore((s) => s.profile.palette)

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.dataset.theme = dark ? 'dark' : 'light'
      root.dataset.palette = palette
      // theme-color берём из той же переменной, что красит фон.
      const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
    }

    // Пока висит класс, цвета переезжают плавно, а не рывком.
    root.classList.add('theme-switching')
    const off = setTimeout(() => root.classList.remove('theme-switching'), 320)

    apply()
    if (theme !== 'system') return () => clearTimeout(off)
    media.addEventListener('change', apply)
    return () => {
      clearTimeout(off)
      media.removeEventListener('change', apply)
    }
  }, [theme, palette])
}

/**
 * Разделы живут в свайп-контейнере и смонтированы одновременно,
 * а экраны библиотеки открываются поверх них отдельным роутом.
 */
function Body() {
  const { pathname } = useLocation()

  if (isOverlayScreen(pathname)) {
    return (
      <div className="fixed inset-0 overflow-y-auto lg:pl-[110px]">
        <Routes>
          <Route path="/products/dish/new" element={<DishEditScreen />} />
          <Route path="/products/dish/:id" element={<DishScreen />} />
          <Route path="/products/dish/:id/edit" element={<DishEditScreen />} />
          <Route path="/products/ingredient/new" element={<IngredientEditScreen />} />
          <Route path="/products/ingredient/:id/edit" element={<IngredientEditScreen />} />
        </Routes>
      </div>
    )
  }

  if (!TABS.some((t) => pathname.startsWith(t.to))) return <Navigate to="/plan" replace />

  return <TabSwipe />
}

export default function App() {
  useTheme()

  return (
    <HashRouter>
      <Background />
      <Body />
      <TabBar />
      <WhatsNewOnUpdate />
    </HashRouter>
  )
}
