import Photo from './Photo'

interface Tile {
  src?: string
  emoji?: string
  alt: string
}

interface Props {
  tiles: Tile[]
  /** Пропорции карточки. Передайте свои, если нужен другой размер. */
  className?: string
}

/** Коллаж из фото блюд: одно фото во всю карточку, два в ряд, три и больше — сетка 2×2. */
export default function MealCollage({ tiles, className = 'aspect-[3/2]' }: Props) {
  const shown = tiles.slice(0, 4)
  const rest = tiles.length - shown.length
  const grid =
    shown.length === 1
      ? 'grid-cols-1 grid-rows-1'
      : shown.length === 2
        ? 'grid-cols-2 grid-rows-1'
        : 'grid-cols-2 grid-rows-2'

  return (
    <div className={`relative grid gap-1.5 rounded-card bg-placeholder p-1.5 ${grid} ${className}`}>
      {shown.map((t, i) => (
        <Photo
          key={i}
          src={t.src}
          emoji={t.emoji}
          alt={t.alt}
          className={`size-full rounded-tile ${shown.length === 3 && i === 0 ? 'row-span-2' : ''}`}
          emojiClass="text-4xl"
        />
      ))}
      {rest > 0 && (
        <span className="absolute right-3 bottom-3 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
          +{rest}
        </span>
      )}
    </div>
  )
}
