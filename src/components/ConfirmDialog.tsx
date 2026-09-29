import BottomSheet from './BottomSheet'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Удалить',
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <BottomSheet open={open} onClose={onCancel} title={title}>
      {description ? <p className="mb-4 text-[15px] text-ink2">{description}</p> : null}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-full px-4 py-3 text-[17px] font-semibold text-white ${
            destructive ? 'bg-danger' : 'bg-accent'
          }`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full bg-muted px-4 py-3 text-[17px] font-semibold"
        >
          Отмена
        </button>
      </div>
    </BottomSheet>
  )
}
