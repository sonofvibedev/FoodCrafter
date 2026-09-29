export type CategoryId =
  | 'vegetables'
  | 'fruits'
  | 'meat'
  | 'fish'
  | 'dairy'
  | 'grains'
  | 'bakery'
  | 'drinks'
  | 'sweets'
  | 'other'

export const CATEGORIES: { id: CategoryId; title: string; emoji: string }[] = [
  { id: 'vegetables', title: 'Овощи', emoji: '🥦' },
  { id: 'fruits', title: 'Фрукты', emoji: '🍎' },
  { id: 'meat', title: 'Мясо', emoji: '🥩' },
  { id: 'fish', title: 'Рыба', emoji: '🐟' },
  { id: 'dairy', title: 'Молочное', emoji: '🥛' },
  { id: 'grains', title: 'Крупы', emoji: '🌾' },
  { id: 'bakery', title: 'Выпечка', emoji: '🥐' },
  { id: 'drinks', title: 'Напитки', emoji: '☕' },
  { id: 'sweets', title: 'Сладкое', emoji: '🍫' },
  { id: 'other', title: 'Другое', emoji: '🧂' },
]

/** КБЖУ на 100 г. */
export interface Macros {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

export interface Ingredient extends Macros {
  id: string
  name: string
  /** Эмодзи-иконка, если нет фото. */
  emoji?: string
  /** URL из public/images или base64 с устройства. */
  photo?: string
  category: CategoryId
  /** Вес одной штуки в граммах, необязательно. */
  pieceWeight?: number
  /** Цена за килограмм, BYN. */
  pricePerKg?: number
  createdAt: number
}

export interface DishItem {
  ingredientId: string
  grams: number
}

export interface Dish {
  id: string
  name: string
  emoji?: string
  photo?: string
  items: DishItem[]
  description?: string
  /** Время готовки в минутах. */
  cookMinutes?: number
  /** Число порций, на которое рассчитан состав. */
  servings: number
  createdAt: number
}

export type PortionRef =
  | { kind: 'dish'; dishId: string }
  | { kind: 'ingredient'; ingredientId: string }

export interface Portion {
  id: string
  ref: PortionRef
  /** Вес порции в граммах. */
  grams: number
}

export interface Meal {
  id: string
  name: string
  items: Portion[]
}

/** Ключ — дата в формате YYYY-MM-DD. */
export type Days = Record<string, Meal[]>

export type Sex = 'male' | 'female'
export type Goal = 'lose' | 'keep' | 'gain'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface Profile {
  name: string
  sex: Sex
  age: number
  height: number
  weight: number
  /** Коэффициент активности Миффлина—Сан Жеора. */
  activity: number
  goal: Goal
  /** Ручное переопределение дневной нормы, ккал. */
  kcalOverride?: number
  /** Распределение БЖУ в процентах от калорийности. */
  macroSplit: { protein: number; fat: number; carbs: number }
  theme: ThemeMode
}

export interface ManualCartItem {
  id: string
  name: string
  grams: number
  category: CategoryId
}

export interface CartLine {
  key: string
  name: string
  emoji?: string
  photo?: string
  category: CategoryId
  grams: number
  price?: number
  manual: boolean
}
