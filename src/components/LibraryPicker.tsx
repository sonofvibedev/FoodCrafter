import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { CategoryId, Dish, Ingredient } from '../types'
import { useIngredientMap } from '../hooks'
import { dishMacrosPer100, dishWeight } from '../lib/calc'
import { categoryEmoji, macroLine } from '../lib/format'
import ProductRow from './ProductRow'
import SegmentedControl from './SegmentedControl'
import CategoryFilter from './CategoryFilter'

export type Picked =
  | { kind: 'dish'; dish: Dish }
  | { kind: 'ingredient'; ingredient: Ingredient }

interface Props {
  onPick: (p: Picked) => void
  /** Ограничить выбор одним типом. */
  only?: 'dish' | 'ingredient'
}

/** Поиск по библиотеке с фильтрами и блоком «Недавно выбирали». */
export default function LibraryPicker({ onPick, only }: Props) {
  const dishes = useStore((s) => s.dishes)
  const ingredients = useStore((s) => s.ingredients)
  const recent = useStore((s) => s.recent)
  const ingMap = useIngredientMap()

  const [tab, setTab] = useState<'dish' | 'ingredient'>(only ?? 'dish')
  const [query, setQuery] = useState('')
  const [cats, setCats] = useState<CategoryId[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

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

  const recentPicked = useMemo(() => {
    const out: Picked[] = []
    for (const id of recent) {
      const d = dishes.find((x) => x.id === id)
      if (d && tab === 'dish') out.push({ kind: 'dish', dish: d })
      const i = ingredients.find((x) => x.id === id)
      if (i && tab === 'ingredient') out.push({ kind: 'ingredient', ingredient: i })
    }
    return out.slice(0, 5)
  }, [recent, dishes, ingredients, tab])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-muted px-4 py-3">
          <Search className="size-5 shrink-0 text-ink2" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск"
            aria-label="Поиск по библиотеке"
            className="min-w-0 flex-1 bg-transparent text-[17px] outline-none"
          />
        </label>
        {tab === 'ingredient' && (
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label="Фильтры"
            aria-expanded={filtersOpen}
            className={`grid size-11 shrink-0 place-items-center rounded-full ${
              cats.length ? 'bg-accent text-white' : 'bg-muted'
            }`}
          >
            <SlidersHorizontal className="size-5" aria-hidden />
          </button>
        )}
      </div>

      {filtersOpen && tab === 'ingredient' && (
        <CategoryFilter value={cats} onChange={setCats} />
      )}

      {!only && (
        <SegmentedControl
          label="Тип"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'ingredient', label: 'Ингредиенты' },
            { value: 'dish', label: 'Блюда' },
          ]}
        />
      )}

      {recentPicked.length > 0 && !q && (
        <section>
          <h3 className="mb-1 text-[17px] font-bold">Недавно выбирали</h3>
          <ul className="flex flex-col">
            {recentPicked.map((p) => (
              <li key={p.kind === 'dish' ? p.dish.id : p.ingredient.id}>
                <Row picked={p} onPick={onPick} ingMap={ingMap} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-1 text-[17px] font-bold">
          {tab === 'dish' ? 'Блюда' : 'Ингредиенты'}
        </h3>
        {(tab === 'dish' ? visibleDishes.length : visibleIngredients.length) === 0 ? (
          <p className="py-4 text-center text-[15px] text-ink2">Ничего не нашлось</p>
        ) : (
          <ul className="flex flex-col">
            {tab === 'dish'
              ? visibleDishes.map((d) => (
                  <li key={d.id}>
                    <Row picked={{ kind: 'dish', dish: d }} onPick={onPick} ingMap={ingMap} />
                  </li>
                ))
              : visibleIngredients.map((i) => (
                  <li key={i.id}>
                    <Row
                      picked={{ kind: 'ingredient', ingredient: i }}
                      onPick={onPick}
                      ingMap={ingMap}
                    />
                  </li>
                ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Row({
  picked,
  onPick,
  ingMap,
}: {
  picked: Picked
  onPick: (p: Picked) => void
  ingMap: Map<string, Ingredient>
}) {
  if (picked.kind === 'dish') {
    const m = dishMacrosPer100(picked.dish, ingMap)
    return (
      <ProductRow
        name={picked.dish.name}
        photo={picked.dish.photo}
        emoji={picked.dish.emoji ?? '🍽️'}
        subtitle={macroLine(m)}
        right={<span className="text-[13px] text-ink2">{Math.round(dishWeight(picked.dish))} г</span>}
        onClick={() => onPick(picked)}
      />
    )
  }
  const i = picked.ingredient
  return (
    <ProductRow
      name={i.name}
      photo={i.photo}
      emoji={i.emoji ?? categoryEmoji(i.category)}
      subtitle={macroLine(i)}
      onClick={() => onPick(picked)}
    />
  )
}
