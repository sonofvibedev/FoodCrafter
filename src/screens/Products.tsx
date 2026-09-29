import { motion } from 'framer-motion'
import { Plus, Search, SlidersHorizontal, SquarePen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'
import CategoryFilter from '../components/CategoryFilter'
import DashedAddCard from '../components/DashedAddCard'
import IconButton from '../components/IconButton'
import { categoryEmoji, macroLine } from '../components/LibraryPicker'
import Photo from '../components/Photo'
import ProductRow from '../components/ProductRow'
import Screen from '../components/Screen'
import SegmentedControl from '../components/SegmentedControl'
import { useStore } from '../store'
import type { CategoryId } from '../types'

export default function ProductsScreen() {
  const navigate = useNavigate()
  const dishes = useStore((s) => s.dishes)
  const ingredients = useStore((s) => s.ingredients)
  const recent = useStore((s) => s.recent)

  const [tab, setTab] = useState<'ingredient' | 'dish'>('ingredient')
  const [query, setQuery] = useState('')
  const [cats, setCats] = useState<CategoryId[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const q = query.trim().toLowerCase()

  const visibleDishes = useMemo(
    () => dishes.filter((d) => !q || d.name.toLowerCase().includes(q)),
    [dishes, q],
  )
  const visibleIngredients = useMemo(
    () =>
      ingredients.filter(
        (i) =>
          (!q || i.name.toLowerCase().includes(q)) &&
          (cats.length === 0 || cats.includes(i.category)),
      ),
    [ingredients, q, cats],
  )

  const recentTiles = useMemo(
    () =>
      recent
        .map((id) => {
          const d = dishes.find((x) => x.id === id)
          if (d) return { id, name: d.name, photo: d.photo, emoji: d.emoji ?? '🍽️', to: `/products/dish/${d.id}` }
          const i = ingredients.find((x) => x.id === id)
          if (i)
            return {
              id,
              name: i.name,
              photo: i.photo,
              emoji: i.emoji ?? categoryEmoji(i.category),
              to: `/products/ingredient/${i.id}/edit`,
            }
          return null
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .slice(0, 8),
    [recent, dishes, ingredients],
  )

  return (
    <Screen>
      <header className="mb-4 flex items-center gap-3">
        <span className="size-11 shrink-0" aria-hidden />
        <h1 className="flex-1 text-center text-[17px] font-semibold">Продукты</h1>
        <IconButton label="Создать" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="size-6" aria-hidden />
        </IconButton>
      </header>

      <div className="mb-4 flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-surface px-4 py-3">
          <Search className="size-5 shrink-0 text-ink2" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск"
            aria-label="Поиск по библиотеке"
            className="min-w-0 flex-1 bg-transparent text-[17px] outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="Фильтры"
          className={`grid size-11 shrink-0 place-items-center rounded-full ${
            cats.length ? 'bg-accent text-white' : 'bg-surface'
          }`}
        >
          <SlidersHorizontal className="size-5" aria-hidden />
        </button>
      </div>

      <SegmentedControl
        className="mb-4"
        label="Тип"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'ingredient', label: 'Ингредиенты' },
          { value: 'dish', label: 'Блюда' },
        ]}
      />

      {recentTiles.length > 0 && !q && (
        <section className="mb-5">
          <h2 className="mb-2 text-[24px] font-bold">Недавно выбирали</h2>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {recentTiles.map((t) => (
              <li key={t.id}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(t.to)}
                  className="w-full"
                  aria-label={t.name}
                >
                  <Photo
                    src={t.photo}
                    emoji={t.emoji}
                    alt={t.name}
                    className="aspect-square w-full rounded-tile bg-surface"
                    emojiClass="text-3xl"
                  />
                  <span className="mt-1 block truncate text-center text-[12px]">{t.name}</span>
                </motion.button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'dish' ? (
        <section>
          <h2 className="mb-2 text-[24px] font-bold">Блюда</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {visibleDishes.map((d, i) => (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.25 }}
              >
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/products/dish/${d.id}`)}
                  className="w-full overflow-hidden rounded-card bg-muted text-left"
                >
                  <Photo
                    src={d.photo}
                    emoji={d.emoji ?? '🍽️'}
                    alt={d.name}
                    className="aspect-square w-full"
                    emojiClass="text-5xl"
                  />
                  <span className="block truncate px-3 py-2 text-[15px] font-bold">{d.name}</span>
                </motion.button>
              </motion.li>
            ))}
            <li>
              <DashedAddCard
                onClick={() => navigate('/products/dish/new')}
                className="aspect-square"
                ariaLabel="Создать блюдо"
              >
                Добавить
              </DashedAddCard>
            </li>
          </ul>
        </section>
      ) : (
        <section>
          <h2 className="mb-2 text-[24px] font-bold">Ингредиенты</h2>
          {visibleIngredients.length === 0 ? (
            <p className="py-4 text-[15px] text-ink2">Ничего не нашлось</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {visibleIngredients.map((ing) => (
                <li key={ing.id}>
                  <ProductRow
                    name={ing.name}
                    photo={ing.photo}
                    emoji={ing.emoji ?? categoryEmoji(ing.category)}
                    subtitle={macroLine(ing)}
                    onClick={() => navigate(`/products/ingredient/${ing.id}/edit`)}
                    right={
                      <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
                        <SquarePen className="size-4" aria-hidden />
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <DashedAddCard
            onClick={() => navigate('/products/ingredient/new')}
            className="mt-4 py-5"
            ariaLabel="Создать ингредиент"
          >
            Добавить ингредиент
          </DashedAddCard>
        </section>
      )}

      {/* Lofi 19: что создаём */}
      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)} title="Что создать">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/products/dish/new')}
            className="rounded-card bg-muted px-4 py-8 text-left text-[17px] font-bold"
          >
            Блюдо
            <span className="mt-1 block text-[14px] font-normal text-ink2">
              Состав из ингредиентов, КБЖУ считается сам
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/products/ingredient/new')}
            className="rounded-card bg-muted px-4 py-8 text-left text-[17px] font-bold"
          >
            Ингредиент
            <span className="mt-1 block text-[14px] font-normal text-ink2">
              Название, категория и КБЖУ на 100 г
            </span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Фильтры">
        <CategoryFilter value={cats} onChange={setCats} />
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="mt-5 w-full rounded-full bg-accent px-4 py-3 text-[17px] font-semibold text-white"
        >
          Поиск
        </button>
      </BottomSheet>
    </Screen>
  )
}
