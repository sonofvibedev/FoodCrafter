import type {
  CartLine,
  CategoryId,
  Dish,
  Ingredient,
  Macros,
  ManualCartItem,
  Meal,
  Portion,
  Profile,
} from '../types'

export const ZERO: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 }

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs,
  }
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    kcal: m.kcal * factor,
    protein: m.protein * factor,
    fat: m.fat * factor,
    carbs: m.carbs * factor,
  }
}

export function roundMacros(m: Macros): Macros {
  return {
    kcal: Math.round(m.kcal),
    protein: Math.round(m.protein * 10) / 10,
    fat: Math.round(m.fat * 10) / 10,
    carbs: Math.round(m.carbs * 10) / 10,
  }
}

/** Суммарный вес состава блюда, г. */
export function dishWeight(dish: Dish): number {
  return dish.items.reduce((s, it) => s + it.grams, 0)
}

/** КБЖУ всего блюда целиком (на весь состав, не на 100 г). */
export function dishMacros(dish: Dish, byId: Map<string, Ingredient>): Macros {
  return dish.items.reduce((acc, it) => {
    const ing = byId.get(it.ingredientId)
    if (!ing) return acc
    return addMacros(acc, scaleMacros(ing, it.grams / 100))
  }, ZERO)
}

/** КБЖУ блюда на 100 г. Пустое блюдо — нули, без деления на ноль. */
export function dishMacrosPer100(dish: Dish, byId: Map<string, Ingredient>): Macros {
  const w = dishWeight(dish)
  if (w <= 0) return ZERO
  return scaleMacros(dishMacros(dish, byId), 100 / w)
}

export function portionMacros(
  p: Portion,
  ingredients: Map<string, Ingredient>,
  dishes: Map<string, Dish>,
): Macros {
  if (p.ref.kind === 'ingredient') {
    const ing = ingredients.get(p.ref.ingredientId)
    return ing ? scaleMacros(ing, p.grams / 100) : ZERO
  }
  const dish = dishes.get(p.ref.dishId)
  if (!dish) return ZERO
  return scaleMacros(dishMacrosPer100(dish, ingredients), p.grams / 100)
}

export function mealMacros(
  meal: Meal,
  ingredients: Map<string, Ingredient>,
  dishes: Map<string, Dish>,
): Macros {
  return meal.items.reduce((acc, p) => addMacros(acc, portionMacros(p, ingredients, dishes)), ZERO)
}

export function dayMacros(
  meals: Meal[],
  ingredients: Map<string, Ingredient>,
  dishes: Map<string, Dish>,
): Macros {
  return meals.reduce((acc, m) => addMacros(acc, mealMacros(m, ingredients, dishes)), ZERO)
}

/* ------------------------------ Норма калорий ----------------------------- */

/** Базовый обмен по формуле Миффлина—Сан Жеора. */
export function bmr(p: Pick<Profile, 'sex' | 'age' | 'height' | 'weight'>): number {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age
  return p.sex === 'male' ? base + 5 : base - 161
}

const GOAL_FACTOR: Record<Profile['goal'], number> = { lose: 0.85, keep: 1, gain: 1.15 }

/** Дневная норма: BMR × активность × цель, либо ручное значение из профиля. */
export function dailyKcal(p: Profile): number {
  if (p.kcalOverride && p.kcalOverride > 0) return Math.round(p.kcalOverride)
  return Math.round(bmr(p) * p.activity * GOAL_FACTOR[p.goal])
}

/** Норма БЖУ в граммах из процентного распределения. */
export function dailyMacros(p: Profile): Macros {
  const kcal = dailyKcal(p)
  const { protein, fat, carbs } = p.macroSplit
  return {
    kcal,
    protein: Math.round((kcal * protein) / 100 / 4),
    fat: Math.round((kcal * fat) / 100 / 9),
    carbs: Math.round((kcal * carbs) / 100 / 4),
  }
}

/* -------------------------------- Корзина -------------------------------- */

/**
 * Разворачивает все приёмы пищи за период в список продуктов.
 * Блюда раскладываются на ингредиенты пропорционально весу порции.
 * Одинаковые ингредиенты суммируются.
 */
export function buildShoppingList(
  mealsByDay: Meal[][],
  ingredients: Map<string, Ingredient>,
  dishes: Map<string, Dish>,
  manual: ManualCartItem[] = [],
  adjust: Record<string, number> = {},
): CartLine[] {
  const totals = new Map<string, number>()

  const bump = (id: string, grams: number) => totals.set(id, (totals.get(id) ?? 0) + grams)

  for (const meals of mealsByDay) {
    for (const meal of meals) {
      for (const p of meal.items) {
        if (p.ref.kind === 'ingredient') {
          bump(p.ref.ingredientId, p.grams)
          continue
        }
        const dish = dishes.get(p.ref.dishId)
        if (!dish) continue
        const w = dishWeight(dish)
        if (w <= 0) continue
        const factor = p.grams / w
        for (const it of dish.items) bump(it.ingredientId, it.grams * factor)
      }
    }
  }

  const lines: CartLine[] = []
  for (const [id, grams] of totals) {
    const ing = ingredients.get(id)
    if (!ing) continue
    const adjusted = Math.max(0, grams + (adjust[id] ?? 0))
    if (adjusted === 0) continue
    lines.push({
      key: id,
      name: ing.name,
      emoji: ing.emoji,
      photo: ing.photo,
      category: ing.category,
      grams: Math.round(adjusted),
      price: ing.pricePerKg ? (adjusted / 1000) * ing.pricePerKg : undefined,
      manual: false,
    })
  }

  for (const m of manual) {
    const grams = Math.max(0, m.grams + (adjust[m.id] ?? 0))
    if (grams === 0) continue
    lines.push({
      key: m.id,
      name: m.name,
      category: m.category,
      grams: Math.round(grams),
      manual: true,
    })
  }

  return lines.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export function groupByCategory(lines: CartLine[]): { category: CategoryId; lines: CartLine[] }[] {
  const map = new Map<CategoryId, CartLine[]>()
  for (const l of lines) {
    const arr = map.get(l.category)
    if (arr) arr.push(l)
    else map.set(l.category, [l])
  }
  return [...map].map(([category, ls]) => ({ category, lines: ls }))
}

/** Красивый вес: 1200 г → «1.2 кг». */
export function formatGrams(g: number): string {
  if (g >= 1000) {
    const kg = g / 1000
    return `${kg % 1 === 0 ? kg : kg.toFixed(1)} кг`
  }
  return `${Math.round(g)} г`
}

export function formatPrice(byn: number): string {
  return `${byn.toFixed(2)} BYN`
}
