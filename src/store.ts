import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CategoryId,
  Days,
  Dish,
  Ingredient,
  ManualCartItem,
  Meal,
  Portion,
  Profile,
} from './types'
import { DEMO_IDS, demoDays, demoDishes, demoIngredients } from './data/demo'

export const uid = () => Math.random().toString(36).slice(2, 10)

const DEFAULT_PROFILE: Profile = {
  name: '',
  sex: 'male',
  age: 30,
  height: 178,
  weight: 75,
  activity: 1.375,
  goal: 'keep',
  macroSplit: { protein: 30, fat: 30, carbs: 40 },
  theme: 'system',
}

export interface CartState {
  /** Отмеченные «куплено», ключ — id ингредиента или ручной позиции. */
  checked: Record<string, boolean>
  /** Ручная правка количества в граммах, прибавляется к расчётному. */
  adjust: Record<string, number>
  manual: ManualCartItem[]
}

interface State {
  ingredients: Ingredient[]
  dishes: Dish[]
  days: Days
  profile: Profile
  cart: CartState
  /** id ингредиентов и блюд в порядке последнего использования. */
  recent: string[]
  demo: boolean

  // библиотека
  saveIngredient: (i: Ingredient) => void
  removeIngredient: (id: string) => void
  saveDish: (d: Dish) => void
  removeDish: (id: string) => void
  touchRecent: (id: string) => void

  // план
  addMeal: (date: string, name: string) => string
  renameMeal: (date: string, mealId: string, name: string) => void
  removeMeal: (date: string, mealId: string) => void
  restoreMeal: (date: string, meal: Meal, index: number) => void
  setMeals: (date: string, meals: Meal[]) => void
  addPortion: (date: string, mealId: string, portion: Portion) => void
  setPortionGrams: (date: string, mealId: string, portionId: string, grams: number) => void
  removePortion: (date: string, mealId: string, portionId: string) => void
  copyMeal: (from: string, mealId: string, to: string) => void
  copyDay: (from: string, to: string) => void

  // корзина
  toggleBought: (key: string) => void
  adjustLine: (key: string, deltaGrams: number) => void
  addManual: (name: string, grams: number, category: CategoryId) => void
  removeManual: (id: string) => void
  resetCartMarks: () => void

  // профиль и данные
  setProfile: (patch: Partial<Profile>) => void
  clearDemo: () => void
  resetAll: () => void
  importAll: (raw: unknown) => void
}

const emptyCart = (): CartState => ({ checked: {}, adjust: {}, manual: [] })

/** Обновляет массив приёмов пищи одного дня и подчищает пустые дни. */
function withDay(days: Days, date: string, fn: (meals: Meal[]) => Meal[]): Days {
  const next = fn(days[date] ?? [])
  const copy = { ...days }
  if (next.length === 0) delete copy[date]
  else copy[date] = next
  return copy
}

const mapMeal = (meals: Meal[], mealId: string, fn: (m: Meal) => Meal) =>
  meals.map((m) => (m.id === mealId ? fn(m) : m))

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ingredients: demoIngredients(),
      dishes: demoDishes(),
      days: demoDays(),
      profile: DEFAULT_PROFILE,
      cart: emptyCart(),
      recent: [],
      demo: true,

      saveIngredient: (i) =>
        set((s) => {
          const exists = s.ingredients.some((x) => x.id === i.id)
          return {
            ingredients: exists
              ? s.ingredients.map((x) => (x.id === i.id ? i : x))
              : [...s.ingredients, i],
          }
        }),

      removeIngredient: (id) =>
        set((s) => ({
          ingredients: s.ingredients.filter((x) => x.id !== id),
          // состав блюд чистим, иначе останутся ссылки в никуда
          dishes: s.dishes.map((d) => ({
            ...d,
            items: d.items.filter((it) => it.ingredientId !== id),
          })),
          days: Object.fromEntries(
            Object.entries(s.days).map(([date, meals]) => [
              date,
              meals.map((m) => ({
                ...m,
                items: m.items.filter(
                  (p) => !(p.ref.kind === 'ingredient' && p.ref.ingredientId === id),
                ),
              })),
            ]),
          ),
          recent: s.recent.filter((x) => x !== id),
        })),

      saveDish: (d) =>
        set((s) => {
          const exists = s.dishes.some((x) => x.id === d.id)
          return {
            dishes: exists ? s.dishes.map((x) => (x.id === d.id ? d : x)) : [...s.dishes, d],
          }
        }),

      removeDish: (id) =>
        set((s) => ({
          dishes: s.dishes.filter((x) => x.id !== id),
          days: Object.fromEntries(
            Object.entries(s.days).map(([date, meals]) => [
              date,
              meals.map((m) => ({
                ...m,
                items: m.items.filter((p) => !(p.ref.kind === 'dish' && p.ref.dishId === id)),
              })),
            ]),
          ),
          recent: s.recent.filter((x) => x !== id),
        })),

      touchRecent: (id) =>
        set((s) => ({ recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 12) })),

      addMeal: (date, name) => {
        const id = uid()
        set((s) => ({
          days: withDay(s.days, date, (meals) => [...meals, { id, name, items: [] }]),
        }))
        return id
      },

      renameMeal: (date, mealId, name) =>
        set((s) => ({
          days: withDay(s.days, date, (meals) => mapMeal(meals, mealId, (m) => ({ ...m, name }))),
        })),

      removeMeal: (date, mealId) =>
        set((s) => ({
          days: withDay(s.days, date, (meals) => meals.filter((m) => m.id !== mealId)),
        })),

      restoreMeal: (date, meal, index) =>
        set((s) => ({
          days: withDay(s.days, date, (meals) => {
            const next = [...meals]
            next.splice(Math.min(index, next.length), 0, meal)
            return next
          }),
        })),

      setMeals: (date, meals) => set((s) => ({ days: withDay(s.days, date, () => meals) })),

      addPortion: (date, mealId, portion) =>
        set((s) => ({
          days: withDay(s.days, date, (meals) =>
            mapMeal(meals, mealId, (m) => ({ ...m, items: [...m.items, portion] })),
          ),
        })),

      setPortionGrams: (date, mealId, portionId, grams) =>
        set((s) => ({
          days: withDay(s.days, date, (meals) =>
            mapMeal(meals, mealId, (m) => ({
              ...m,
              items: m.items.map((p) => (p.id === portionId ? { ...p, grams } : p)),
            })),
          ),
        })),

      removePortion: (date, mealId, portionId) =>
        set((s) => ({
          days: withDay(s.days, date, (meals) =>
            mapMeal(meals, mealId, (m) => ({
              ...m,
              items: m.items.filter((p) => p.id !== portionId),
            })),
          ),
        })),

      copyMeal: (from, mealId, to) => {
        const meal = (get().days[from] ?? []).find((m) => m.id === mealId)
        if (!meal) return
        set((s) => ({
          days: withDay(s.days, to, (meals) => [
            ...meals,
            { ...meal, id: uid(), items: meal.items.map((p) => ({ ...p, id: uid() })) },
          ]),
        }))
      },

      copyDay: (from, to) => {
        const src = get().days[from] ?? []
        if (src.length === 0) return
        set((s) => ({
          days: withDay(s.days, to, (meals) => [
            ...meals,
            ...src.map((m) => ({
              ...m,
              id: uid(),
              items: m.items.map((p) => ({ ...p, id: uid() })),
            })),
          ]),
        }))
      },

      toggleBought: (key) =>
        set((s) => ({
          cart: { ...s.cart, checked: { ...s.cart.checked, [key]: !s.cart.checked[key] } },
        })),

      adjustLine: (key, deltaGrams) =>
        set((s) => ({
          cart: {
            ...s.cart,
            adjust: { ...s.cart.adjust, [key]: (s.cart.adjust[key] ?? 0) + deltaGrams },
          },
        })),

      addManual: (name, grams, category) =>
        set((s) => ({
          cart: { ...s.cart, manual: [...s.cart.manual, { id: uid(), name, grams, category }] },
        })),

      removeManual: (id) =>
        set((s) => ({ cart: { ...s.cart, manual: s.cart.manual.filter((m) => m.id !== id) } })),

      resetCartMarks: () => set((s) => ({ cart: { ...s.cart, checked: {}, adjust: {} } })),

      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      clearDemo: () =>
        set((s) => ({
          ingredients: s.ingredients.filter((x) => !DEMO_IDS.ingredients.includes(x.id)),
          dishes: s.dishes.filter((x) => !DEMO_IDS.dishes.includes(x.id)),
          days: Object.fromEntries(
            Object.entries(s.days)
              .map(([date, meals]) => [date, meals.filter((m) => !m.id.startsWith('demo-'))] as const)
              .filter(([, meals]) => meals.length > 0),
          ),
          cart: emptyCart(),
          recent: [],
          demo: false,
        })),

      resetAll: () =>
        set({
          ingredients: [],
          dishes: [],
          days: {},
          profile: DEFAULT_PROFILE,
          cart: emptyCart(),
          recent: [],
          demo: false,
        }),

      importAll: (raw) => {
        const d = raw as Partial<State>
        if (!d || typeof d !== 'object') throw new Error('Файл не похож на выгрузку FoodCrafter')
        if (!Array.isArray(d.ingredients) || !Array.isArray(d.dishes) || typeof d.days !== 'object')
          throw new Error('В файле нет полей ingredients, dishes и days')
        set({
          ingredients: d.ingredients,
          dishes: d.dishes,
          days: d.days ?? {},
          profile: { ...DEFAULT_PROFILE, ...(d.profile ?? {}) },
          cart: { ...emptyCart(), ...(d.cart ?? {}) },
          recent: d.recent ?? [],
          demo: false,
        })
      },
    }),
    {
      name: 'foodcrafter',
      version: 1,
      partialize: (s) => ({
        ingredients: s.ingredients,
        dishes: s.dishes,
        days: s.days,
        profile: s.profile,
        cart: s.cart,
        recent: s.recent,
        demo: s.demo,
      }),
    },
  ),
)

/** Данные для экспорта в JSON. */
export function exportPayload() {
  const { ingredients, dishes, days, profile, cart, recent } = useStore.getState()
  return { version: 1, exportedAt: new Date().toISOString(), ingredients, dishes, days, profile, cart, recent }
}
