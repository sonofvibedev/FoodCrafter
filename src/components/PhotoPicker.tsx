import { Camera, X } from 'lucide-react'
import { useId, useState } from 'react'
import { compressImage } from '../lib/image'
import Photo from './Photo'

interface Props {
  value?: string
  emoji?: string
  onChange: (photo: string | undefined) => void
  alt: string
}

/** Серая область с иконкой камеры из макета: загрузка фото с устройства. */
export default function PhotoPicker({ value, emoji, onChange, alt }: Props) {
  const id = useId()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="relative h-[320px] w-full bg-[var(--fc-photo-fallback)]">
      {value ? (
        <Photo src={value} alt={alt} className="size-full" />
      ) : emoji ? (
        <div className="grid size-full place-items-center text-7xl" aria-hidden>
          {emoji}
        </div>
      ) : null}

      <label
        htmlFor={id}
        className="absolute inset-0 grid cursor-pointer place-items-center"
        aria-label="Выбрать фото"
      >
        {!value && !emoji && (
          <span className="grid size-24 place-items-center rounded-lg border-4 border-dashed border-white/90">
            <Camera className="size-10 text-white" aria-hidden />
          </span>
        )}
        {!value && emoji && (
          <span className="absolute right-4 bottom-4 grid size-12 place-items-center rounded-full bg-black/50">
            <Camera className="size-6 text-white" aria-hidden />
          </span>
        )}
      </label>

      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          try {
            onChange(await compressImage(file))
            setError(null)
          } catch {
            setError('Не удалось обработать файл')
          }
        }}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label="Убрать фото"
          className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full bg-black/60 text-white"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}

      {error && (
        <p role="alert" className="absolute inset-x-4 bottom-4 rounded-lg bg-danger px-3 py-2 text-[14px] text-white">
          {error}
        </p>
      )}
    </div>
  )
}
