import { useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import type { Dish, Ingredient } from './types'
import { dailyMacros } from './lib/calc'

export function useIngredientMap(): Map<string, Ingredient> {
  const ingredients = useStore((s) => s.ingredients)
  return useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients])
}

export function useDishMap(): Map<string, Dish> {
  const dishes = useStore((s) => s.dishes)
  return useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes])
}

/** Дневная норма КБЖУ из профиля. */
export function useTargets() {
  const profile = useStore((s) => s.profile)
  return useMemo(() => dailyMacros(profile), [profile])
}

export function usePrefersReducedMotion(): boolean {
  return useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
}

/** Реагирует на media query: нужен для вертикального таб-бара на десктопе. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const apply = () => setMatches(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [query])

  return matches
}
