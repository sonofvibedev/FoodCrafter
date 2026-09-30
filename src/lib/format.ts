import { CATEGORIES, type CategoryId } from '../types'

const r = (n: number) => Math.round(n * 10) / 10

/** Короткая строка КБЖУ для карточек и списков. */
export function macroLine(m: { kcal: number; protein: number; fat: number; carbs: number }) {
  return `К ${Math.round(m.kcal)}  Б ${r(m.protein)}  Ж ${r(m.fat)}  У ${r(m.carbs)}`
}

export function categoryEmoji(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.emoji ?? '🍽️'
}

export function categoryTitle(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.title ?? 'Другое'
}
