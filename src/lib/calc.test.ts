import { describe, expect, it } from 'vitest'
import {
  bmr,
  buildShoppingList,
  dailyKcal,
  dailyMacros,
  dishMacros,
  dishMacrosPer100,
  dishWeight,
  formatGrams,
  groupByCategory,
  mealMacros,
} from './calc'
import { monthGrid, weekDays, weekStart, addDays, formatRange } from './date'
import type { Dish, Ingredient, Meal, Profile } from '../types'

const ing = (id: string, over: Partial<Ingredient> = {}): Ingredient => ({
  id,
  name: id,
  category: 'other',
  kcal: 100,
  protein: 10,
  fat: 5,
  carbs: 20,
  createdAt: 0,
  ...over,
})

const chicken = ing('chicken', { name: 'Курица', kcal: 165, protein: 31, fat: 3.6, carbs: 0 })
const rice = ing('rice', { name: 'Рис', kcal: 130, protein: 2.7, fat: 0.3, carbs: 28 })

const ingredients = new Map([
  [chicken.id, chicken],
  [rice.id, rice],
])

const bowl: Dish = {
  id: 'bowl',
  name: 'Боул',
  items: [
    { ingredientId: 'chicken', grams: 200 },
    { ingredientId: 'rice', grams: 300 },
  ],
  servings: 2,
  createdAt: 0,
}
const dishes = new Map([[bowl.id, bowl]])

describe('КБЖУ блюда', () => {
  it('складывает вес состава', () => {
    expect(dishWeight(bowl)).toBe(500)
  })

  it('считает КБЖУ всего состава', () => {
    const m = dishMacros(bowl, ingredients)
    expect(m.kcal).toBeCloseTo(165 * 2 + 130 * 3) // 720
    expect(m.protein).toBeCloseTo(31 * 2 + 2.7 * 3)
  })

  it('считает КБЖУ на 100 г', () => {
    const m = dishMacrosPer100(bowl, ingredients)
    expect(m.kcal).toBeCloseTo(720 / 5)
  })

  it('пустое блюдо не делит на ноль', () => {
    const empty: Dish = { ...bowl, id: 'e', items: [] }
    expect(dishMacrosPer100(empty, ingredients)).toEqual({ kcal: 0, protein: 0, fat: 0, carbs: 0 })
  })

  it('игнорирует удалённый ингредиент', () => {
    const broken: Dish = { ...bowl, items: [{ ingredientId: 'ghost', grams: 100 }] }
    expect(dishMacros(broken, ingredients).kcal).toBe(0)
  })
})

describe('КБЖУ приёма пищи', () => {
  it('порция блюда масштабируется по весу', () => {
    const meal: Meal = {
      id: 'm',
      name: 'Обед',
      items: [{ id: 'p1', ref: { kind: 'dish', dishId: 'bowl' }, grams: 250 }],
    }
    // половина состава = 360 ккал
    expect(mealMacros(meal, ingredients, dishes).kcal).toBeCloseTo(360)
  })

  it('отдельный ингредиент считается на 100 г', () => {
    const meal: Meal = {
      id: 'm',
      name: 'Перекус',
      items: [{ id: 'p1', ref: { kind: 'ingredient', ingredientId: 'rice' }, grams: 50 }],
    }
    expect(mealMacros(meal, ingredients, dishes).kcal).toBeCloseTo(65)
  })
})

describe('норма калорий', () => {
  const p: Profile = {
    name: '',
    sex: 'male',
    age: 30,
    height: 180,
    weight: 80,
    activity: 1.375,
    goal: 'keep',
    macroSplit: { protein: 30, fat: 30, carbs: 40 },
    theme: 'system',
  }

  it('Миффлин—Сан Жеор для мужчины', () => {
    expect(bmr(p)).toBeCloseTo(10 * 80 + 6.25 * 180 - 5 * 30 + 5) // 1780
  })

  it('для женщины на 166 ккал меньше', () => {
    expect(bmr({ ...p, sex: 'female' })).toBeCloseTo(bmr(p) - 166)
  })

  it('цель «похудение» снижает норму', () => {
    expect(dailyKcal({ ...p, goal: 'lose' })).toBeLessThan(dailyKcal(p))
  })

  it('ручное значение перебивает расчёт', () => {
    expect(dailyKcal({ ...p, kcalOverride: 2000 })).toBe(2000)
  })

  it('БЖУ в граммах из процентов', () => {
    const m = dailyMacros({ ...p, kcalOverride: 2000 })
    expect(m.protein).toBe(150) // 30% от 2000 / 4
    expect(m.fat).toBe(67) // 30% от 2000 / 9
    expect(m.carbs).toBe(200)
  })
})

describe('корзина', () => {
  const meals: Meal[][] = [
    [
      {
        id: 'm1',
        name: 'Обед',
        items: [{ id: 'p1', ref: { kind: 'dish', dishId: 'bowl' }, grams: 250 }],
      },
    ],
    [
      {
        id: 'm2',
        name: 'Ужин',
        items: [
          { id: 'p2', ref: { kind: 'dish', dishId: 'bowl' }, grams: 500 },
          { id: 'p3', ref: { kind: 'ingredient', ingredientId: 'rice' }, grams: 100 },
        ],
      },
    ],
  ]

  it('раскладывает блюда на ингредиенты и суммирует', () => {
    const lines = buildShoppingList(meals, ingredients, dishes)
    const byName = Object.fromEntries(lines.map((l) => [l.name, l.grams]))
    // курица: 200*0.5 + 200*1 = 300; рис: 300*0.5 + 300*1 + 100 = 550
    expect(byName['Курица']).toBe(300)
    expect(byName['Рис']).toBe(550)
    expect(lines).toHaveLength(2)
  })

  it('считает цену по цене за килограмм', () => {
    const withPrice = new Map(ingredients)
    withPrice.set('rice', { ...rice, pricePerKg: 4 })
    const line = buildShoppingList(meals, withPrice, dishes).find((l) => l.name === 'Рис')
    expect(line?.price).toBeCloseTo(0.55 * 4)
  })

  it('ручная правка количества применяется', () => {
    const lines = buildShoppingList(meals, ingredients, dishes, [], { rice: -50 })
    expect(lines.find((l) => l.name === 'Рис')?.grams).toBe(500)
  })

  it('правка в ноль убирает позицию', () => {
    const lines = buildShoppingList(meals, ingredients, dishes, [], { rice: -1000 })
    expect(lines.find((l) => l.name === 'Рис')).toBeUndefined()
  })

  it('ручные позиции попадают в список', () => {
    const lines = buildShoppingList(meals, ingredients, dishes, [
      { id: 'man1', name: 'Соль', grams: 100, category: 'other' },
    ])
    expect(lines.find((l) => l.name === 'Соль')?.manual).toBe(true)
  })

  it('группирует по категориям', () => {
    const veg = ing('cuc', { name: 'Огурец', category: 'vegetables' })
    const map = new Map(ingredients)
    map.set(veg.id, veg)
    const withVeg: Meal[][] = [
      [
        {
          id: 'm',
          name: 'Салат',
          items: [{ id: 'p', ref: { kind: 'ingredient', ingredientId: 'cuc' }, grams: 100 }],
        },
      ],
      ...meals,
    ]
    const groups = groupByCategory(buildShoppingList(withVeg, map, dishes))
    expect(groups.map((g) => g.category).sort()).toEqual(['other', 'vegetables'])
  })
})

describe('форматирование и даты', () => {
  it('граммы переходят в килограммы', () => {
    expect(formatGrams(950)).toBe('950 г')
    expect(formatGrams(1000)).toBe('1 кг')
    expect(formatGrams(1250)).toBe('1.3 кг')
  })

  it('неделя начинается с понедельника', () => {
    // 2026-09-30 — среда
    expect(weekStart('2026-09-30')).toBe('2026-09-28')
    expect(weekStart('2026-09-28')).toBe('2026-09-28')
    // воскресенье остаётся в своей неделе
    expect(weekStart('2026-10-04')).toBe('2026-09-28')
  })

  it('в неделе 7 дней подряд', () => {
    const d = weekDays('2026-09-28')
    expect(d).toHaveLength(7)
    expect(d[6]).toBe('2026-10-04')
  })

  it('сетка месяца кратна 7 и начинается с понедельника', () => {
    const g = monthGrid('2026-09-15')
    expect(g.length % 7).toBe(0)
    expect(weekStart(g[0])).toBe(g[0])
    expect(g).toContain('2026-09-01')
    expect(g).toContain('2026-09-30')
  })

  it('addDays переходит через границу месяца', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('диапазон читается по-русски', () => {
    expect(formatRange('2026-09-28', '2026-10-04')).toBe('28 сен – 4 окт')
  })
})
