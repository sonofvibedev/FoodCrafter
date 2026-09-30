import type { Meal } from '../types'

/** Плитки коллажа: фото или эмодзи каждой порции за день. */
export function tilesOf(
  meals: Meal[],
  ingredients: Map<string, { name: string; emoji?: string; photo?: string }>,
  dishes: Map<string, { name: string; emoji?: string; photo?: string }>,
) {
  return meals.flatMap((m) =>
    m.items.map((p) => {
      const src =
        p.ref.kind === 'dish' ? dishes.get(p.ref.dishId) : ingredients.get(p.ref.ingredientId)
      return { src: src?.photo, emoji: src?.emoji, alt: src?.name ?? 'Блюдо' }
    }),
  )
}
