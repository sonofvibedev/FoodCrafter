import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import IconButton from './IconButton'

interface Props {
  /** Куда вернуться. Без него — история назад. */
  backTo?: string
  title?: string
  right?: ReactNode
}

/** Верхняя строка экрана: круглая «назад», заголовок по центру, действие справа. */
export default function ScreenHeader({ backTo, title, right }: Props) {
  const navigate = useNavigate()

  return (
    <div className="mb-4 flex min-h-11 items-center gap-3">
      <IconButton
        label="Назад"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        variant="glass"
      >
        <ChevronLeft className="size-6" aria-hidden />
      </IconButton>
      {title ? <h1 className="flex-1 truncate text-center text-[17px] font-semibold">{title}</h1> : <span className="flex-1" />}
      {right ?? <span className="size-11 shrink-0" aria-hidden />}
    </div>
  )
}
