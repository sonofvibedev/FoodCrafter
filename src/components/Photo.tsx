import { ImageIcon } from 'lucide-react'
import { useState } from 'react'

interface Props {
  src?: string
  emoji?: string
  alt: string
  className?: string
  /** Размер эмодзи, если фото нет. */
  emojiClass?: string
}

/** Фото со скелетоном на время загрузки и эмодзи-запасным вариантом. */
export default function Photo({ src, emoji, alt, className = '', emojiClass = 'text-3xl' }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={`grid place-items-center bg-placeholder ${className}`}
        role="img"
        aria-label={alt}
      >
        {emoji ? (
          <span className={emojiClass} aria-hidden>
            {emoji}
          </span>
        ) : (
          <ImageIcon className="size-1/4 text-ink2" aria-hidden />
        )}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-placeholder ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-placeholder" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`size-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
