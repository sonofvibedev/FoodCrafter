import { Sparkles } from 'lucide-react'
import { APP_VERSION, CHANGELOG, KIND_ORDER, KIND_TITLE, type ChangeKind } from '../changelog'
import { useStore } from '../store'
import BottomSheet from './BottomSheet'

const KIND_STYLE: Record<ChangeKind, string> = {
  global: 'bg-accent text-on-accent',
  important: 'bg-accent-soft text-[var(--add-text)]',
  local: 'bg-muted text-ink2',
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

interface Props {
  open: boolean
  onClose: () => void
  /** Показывать все выпуски, а не только текущий. */
  full?: boolean
}

/** Окно «Что нового»: изменения текущей версии, разбитые по важности. */
export default function WhatsNew({ open, onClose, full = false }: Props) {
  const releases = full ? CHANGELOG : CHANGELOG.slice(0, 1)

  return (
    <BottomSheet open={open} onClose={onClose} title="Что нового" hideTitle>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[22px] leading-tight font-bold">Что нового</h2>
          <p className="text-[14px] text-ink2 tabular-nums">
            Версия {APP_VERSION} · {formatDate(CHANGELOG[0].date)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {releases.map((release) => (
          <section key={release.version}>
            {full && (
              <h3 className="mb-2 text-[17px] font-bold tabular-nums">
                {release.version} — {release.title}
              </h3>
            )}
            {!full && <p className="mb-4 text-[15px] text-ink2">{release.title}</p>}

            <div className="flex flex-col gap-4">
              {KIND_ORDER.filter((kind) => release.changes[kind]?.length).map((kind) => (
                <div key={kind}>
                  <span
                    className={`mb-2 inline-block rounded-full px-3 py-1 text-[12px] font-semibold ${KIND_STYLE[kind]}`}
                  >
                    {KIND_TITLE[kind]}
                  </span>
                  <ul className="flex flex-col gap-2">
                    {release.changes[kind]?.map((text) => (
                      <li key={text} className="flex gap-2 text-[15px] leading-snug">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full rounded-full bg-accent px-4 py-3 text-[17px] font-semibold text-on-accent"
      >
        Понятно
      </button>
    </BottomSheet>
  )
}

/** Показывается сам, когда пользователь ещё не видел изменения этой версии. */
export function WhatsNewOnUpdate() {
  const seen = useStore((s) => s.seenVersion)
  const setSeen = useStore((s) => s.setSeenVersion)

  return <WhatsNew open={seen !== APP_VERSION} onClose={() => setSeen(APP_VERSION)} />
}
