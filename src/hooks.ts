import { useMemo } from 'react'
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
