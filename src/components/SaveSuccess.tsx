import { useEffect, useState } from 'react'

export default function SaveSuccess({ onDone }: { onDone: () => void }) {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setClosing(true), 1800)
    const t2 = setTimeout(onDone, 2050)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className={closing ? 'save-modal-out' : 'save-modal-in'}>
        <div className="bg-white rounded-3xl px-14 py-10 shadow-2xl flex flex-col items-center">
          <svg viewBox="0 0 100 100" width="96" height="96" fill="none">
            <circle
              cx="50" cy="50" r="44"
              stroke="#15803d" strokeWidth="4"
              className="save-circle"
            />
            <polyline
              points="26,52 42,68 74,32"
              stroke="#15803d" strokeWidth="6"
              strokeLinecap="round" strokeLinejoin="round"
              className="save-check"
            />
          </svg>
          <p className="mt-5 font-bold text-green-700 text-lg tracking-wide save-label">
            บันทึกสำเร็จ
          </p>
        </div>
      </div>
    </div>
  )
}
