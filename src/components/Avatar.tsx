interface Props {
  name: string
  src?: string
  size?: number
  className?: string
}

/** Инициалы: «Иван Петров» → «ИП», пустое имя → «FC». */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'FC'
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

/** Аватар профиля: фото или инициалы на акцентной заливке. */
export default function Avatar({ name, src, size = 92, className = '' }: Props) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: src ? 'var(--surface-2)' : 'var(--accent-grad, var(--accent))',
      }}
    >
      {src ? (
        <img src={src} alt={name || 'Аватар'} className="size-full object-cover" />
      ) : (
        <span
          className="font-bold text-on-accent"
          style={{ fontSize: size * 0.36 }}
          aria-hidden
        >
          {initials(name)}
        </span>
      )}
    </span>
  )
}
