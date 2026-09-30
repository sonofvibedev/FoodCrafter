import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  /** Подпись под «плюсом». */
  children?: ReactNode
  /**
   * Обработчик нажатия. Если его нет, карточка рисуется как span —
   * так её можно положить внутрь другой кнопки, не ломая разметку.
   */
  onClick?: () => void
  className?: string
  ariaLabel?: string
}

const FACE = `
  group flex w-full flex-col items-center justify-center gap-2
  rounded-card border-[1.5px] border-dashed border-[var(--add-border)]
  bg-[var(--add-bg)] px-4 py-5 text-[15px] font-semibold text-[var(--add-text)]
  transition-[background-color,transform] duration-200
  hover:bg-[var(--add-bg-strong)] active:bg-[var(--add-bg-strong)] active:scale-[0.98]
`

function Face({ children }: { children: ReactNode }) {
  return (
    <>
      <span
        className="
          grid size-8 shrink-0 place-items-center rounded-full bg-accent text-on-accent
          transition-transform duration-200 group-hover:rotate-90 group-active:rotate-90
        "
        aria-hidden
      >
        <Plus className="size-5" strokeWidth={2.6} />
      </span>
      {children ? <span className="text-center">{children}</span> : null}
    </>
  )
}

/** Единая карточка «Добавить»: пунктир на акцентной подложке и круглый «плюс». */
export default function AddCard({
  children = 'Добавить',
  onClick,
  className = '',
  ariaLabel,
}: Props) {
  if (!onClick) {
    return (
      <span className={`${FACE} ${className}`}>
        <Face>{children}</Face>
      </span>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={`${FACE} ${className}`}>
      <Face>{children}</Face>
    </button>
  )
}
