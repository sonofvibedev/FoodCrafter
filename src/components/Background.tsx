/** Фиксированный фон: градиент палитры и три плавающих акцентных пятна. */
export default function Background() {
  return (
    <div className="fc-bg" aria-hidden>
      <span className="fc-blob fc-blob-1" />
      <span className="fc-blob fc-blob-2" />
      <span className="fc-blob fc-blob-3" />
    </div>
  )
}
