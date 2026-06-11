import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameDay, isSameMonth, parseISO,
} from 'date-fns'
import { th } from 'date-fns/locale'

interface Props {
  value: string   // YYYY-MM-DD
  onChange: (date: string) => void
  onClose: () => void
}

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export default function DatePicker({ value, onChange, onClose }: Props) {
  const selected = value ? parseISO(value) : new Date()
  const [viewing, setViewing] = useState(() => startOfMonth(selected))
  const today = new Date()

  // Build day grid
  const gridStart = startOfWeek(startOfMonth(viewing), { weekStartsOn: 0 })
  const gridEnd   = endOfWeek(endOfMonth(viewing),     { weekStartsOn: 0 })
  const days: Date[] = []
  let d = gridStart
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1) }

  const pick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'))
    onClose()
  }

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-72 overflow-hidden save-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Month header */}
        <div className="flex items-center bg-cafe-accent text-white px-4 py-3">
          <button
            onClick={() => setViewing(subMonths(viewing, 1))}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={17} />
          </button>
          <span className="flex-1 text-center text-sm font-bold">
            {format(viewing, 'MMMM yyyy', { locale: th })}
          </span>
          <button
            onClick={() => setViewing(addMonths(viewing, 1))}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 px-3 pt-3 pb-1">
          {DAY_LABELS.map((l) => (
            <span key={l} className="text-center text-[11px] font-semibold text-cafe-muted">{l}</span>
          ))}
        </div>

        {/* Day buttons */}
        <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
          {days.map((day, i) => {
            const isSel     = isSameDay(day, selected)
            const isToday   = isSameDay(day, today)
            const inMonth   = isSameMonth(day, viewing)

            return (
              <button
                key={i}
                onClick={() => pick(day)}
                className={[
                  'flex items-center justify-center w-9 h-9 mx-auto rounded-full text-sm transition-colors',
                  isSel    ? 'bg-cafe-accent text-white font-bold'                           : '',
                  isToday && !isSel ? 'border-2 border-cafe-accent text-cafe-accent font-bold' : '',
                  !isSel && !isToday && inMonth  ? 'text-cafe-text hover:bg-cafe-section'   : '',
                  !inMonth ? 'text-cafe-muted/30 pointer-events-none'                        : '',
                ].join(' ')}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        {/* Today shortcut */}
        <div className="px-4 pb-4">
          <button
            onClick={() => pick(today)}
            className="w-full py-2 text-sm font-semibold text-cafe-accent bg-cafe-section rounded-xl hover:bg-cafe-input transition-colors"
          >
            วันนี้
          </button>
        </div>
      </div>
    </div>
  )
}
