import type { Days, Dish, Ingredient } from '../types'
import { iso, weekStart } from '../lib/date'

const img = (name: string) => `${import.meta.env.BASE_URL}images/${name}`

type IngSeed = Omit<Ingredient, 'createdAt'>

const SEED_INGREDIENTS: IngSeed[] = [
  {
    id: 'salmon',
    name: 'Лосось',
    emoji: '🐟',
    category: 'fish',
    kcal: 208,
    protein: 20,
    fat: 13,
    carbs: 0,
    pricePerKg: 32,
  },
  {
    id: 'rice',
    name: 'Рис',
    emoji: '🍚',
    category: 'grains',
    kcal: 130,
    protein: 2.7,
    fat: 0.3,
    carbs: 28,
    pricePerKg: 4.2,
  },
  {
    id: 'cucumber',
    name: 'Огурец',
    emoji: '🥒',
    category: 'vegetables',
    kcal: 15,
    protein: 0.8,
    fat: 0.1,
    carbs: 3.6,
    pieceWeight: 110,
    pricePerKg: 5.5,
  },
  {
    id: 'tomato',
    name: 'Помидор',
    emoji: '🍅',
    category: 'vegetables',
    kcal: 18,
    protein: 0.9,
    fat: 0.2,
    carbs: 3.9,
    pieceWeight: 120,
    pricePerKg: 6.9,
  },
  {
    id: 'egg',
    name: 'Яйцо куриное',
    emoji: '🥚',
    category: 'other',
    kcal: 157,
    protein: 12.7,
    fat: 11.5,
    carbs: 0.7,
    pieceWeight: 60,
    pricePerKg: 8,
  },
  {
    id: 'coffee',
    name: 'Кофе молотый',
    emoji: '☕',
    category: 'drinks',
    kcal: 2,
    protein: 0.2,
    fat: 0.5,
    carbs: 0,
    pricePerKg: 45,
  },
  {
    id: 'milk',
    name: 'Молоко 3,2%',
    emoji: '🥛',
    category: 'dairy',
    kcal: 60,
    protein: 2.9,
    fat: 3.2,
    carbs: 4.7,
    pricePerKg: 3.1,
  },
  {
    id: 'beef',
    name: 'Говядина',
    emoji: '🥩',
    category: 'meat',
    kcal: 187,
    protein: 18.6,
    fat: 12.6,
    carbs: 0,
    pricePerKg: 24,
  },
  {
    id: 'potato',
    name: 'Картофель',
    emoji: '🥔',
    category: 'vegetables',
    kcal: 77,
    protein: 2,
    fat: 0.4,
    carbs: 17,
    pieceWeight: 90,
    pricePerKg: 2.4,
  },
  {
    id: 'bun',
    name: 'Булочка для бургера',
    emoji: '🥯',
    category: 'bakery',
    kcal: 280,
    protein: 9,
    fat: 5,
    carbs: 50,
    pieceWeight: 70,
    pricePerKg: 9.5,
  },
  {
    id: 'cheddar',
    name: 'Сыр чеддер',
    emoji: '🧀',
    category: 'dairy',
    kcal: 402,
    protein: 25,
    fat: 33,
    carbs: 1.3,
    pricePerKg: 28,
  },
  {
    id: 'banana',
    name: 'Банан',
    emoji: '🍌',
    category: 'fruits',
    kcal: 89,
    protein: 1.1,
    fat: 0.3,
    carbs: 23,
    pieceWeight: 120,
    pricePerKg: 6.2,
  },
]

type DishSeed = Omit<Dish, 'createdAt'>

const SEED_DISHES: DishSeed[] = [
  {
    id: 'bowl',
    name: 'Боул с лососем',
    photo: img('salad.webp'),
    servings: 2,
    cookMinutes: 20,
    description:
      'Тёплый боул: запечённый лосось, рассыпчатый рис и свежие овощи. Заправьте оливковым маслом с лимоном и подавайте сразу.',
    items: [
      { ingredientId: 'salmon', grams: 220 },
      { ingredientId: 'rice', grams: 180 },
      { ingredientId: 'cucumber', grams: 80 },
      { ingredientId: 'tomato', grams: 80 },
      { ingredientId: 'egg', grams: 60 },
    ],
  },
  {
    id: 'latte',
    name: 'Латте',
    photo: img('coffee.webp'),
    servings: 1,
    cookMinutes: 5,
    description: 'Двойной эспрессо и вспененное молоко. Кофе мелкого помола, молоко до 65 °C.',
    items: [
      { ingredientId: 'coffee', grams: 18 },
      { ingredientId: 'milk', grams: 200 },
    ],
  },
  {
    id: 'steak',
    name: 'Стейк с картофелем',
    photo: img('steak.webp'),
    servings: 1,
    cookMinutes: 35,
    description:
      'Говядина на раскалённой сковороде по три минуты с каждой стороны, затем отдых под фольгой. Картофель — запечённый дольками.',
    items: [
      { ingredientId: 'beef', grams: 250 },
      { ingredientId: 'potato', grams: 200 },
      { ingredientId: 'tomato', grams: 60 },
    ],
  },
  {
    id: 'burger',
    name: 'Бургер',
    photo: img('burger.webp'),
    servings: 1,
    cookMinutes: 25,
    description: 'Котлета из рубленой говядины, чеддер, помидор и соус в поджаренной булочке.',
    items: [
      { ingredientId: 'bun', grams: 70 },
      { ingredientId: 'beef', grams: 150 },
      { ingredientId: 'cheddar', grams: 30 },
      { ingredientId: 'tomato', grams: 40 },
    ],
  },
  {
    id: 'smoothie',
    name: 'Банановый смузи',
    emoji: '🥤',
    servings: 1,
    cookMinutes: 5,
    description: 'Банан с молоком в блендере. Для густоты добавьте лёд.',
    items: [
      { ingredientId: 'banana', grams: 120 },
      { ingredientId: 'milk', grams: 200 },
    ],
  },
]

export function demoIngredients(): Ingredient[] {
  const now = Date.now()
  return SEED_INGREDIENTS.map((x, i) => ({ ...x, createdAt: now + i }))
}

export function demoDishes(): Dish[] {
  const now = Date.now()
  return SEED_DISHES.map((x, i) => ({ ...x, createdAt: now + i }))
}

/** Заполненный понедельник текущей недели. */
export function demoDays(): Days {
  const monday = weekStart(iso(new Date()))
  return {
    [monday]: [
      {
        id: 'demo-breakfast',
        name: 'Завтрак',
        items: [
          { id: 'demo-p1', ref: { kind: 'dish', dishId: 'latte' }, grams: 220 },
          { id: 'demo-p2', ref: { kind: 'dish', dishId: 'smoothie' }, grams: 320 },
        ],
      },
      {
        id: 'demo-lunch',
        name: 'Обед',
        items: [{ id: 'demo-p3', ref: { kind: 'dish', dishId: 'bowl' }, grams: 310 }],
      },
      {
        id: 'demo-dinner',
        name: 'Ужин',
        items: [
          { id: 'demo-p4', ref: { kind: 'dish', dishId: 'steak' }, grams: 380 },
          { id: 'demo-p5', ref: { kind: 'ingredient', ingredientId: 'cucumber' }, grams: 110 },
        ],
      },
    ],
  }
}

export const DEMO_IDS = {
  ingredients: SEED_INGREDIENTS.map((x) => x.id),
  dishes: SEED_DISHES.map((x) => x.id),
}
