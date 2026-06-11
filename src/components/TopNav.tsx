import { BarChart2, PenLine, Settings, Coffee } from 'lucide-react'

const TABS = [
  { icon: BarChart2, label: 'รายงาน' },
  { icon: PenLine,   label: 'บันทึกขาย' },
  { icon: Settings,  label: 'ตั้งค่า' },
]

interface Props {
  page: number
  onNavigate: (page: number) => void
}

export default function TopNav({ page, onNavigate }: Props) {
  return (
    <div className="bg-cafe-card border-b border-cafe-border px-4 pt-4 pb-3 shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-center gap-1.5 mb-2.5">
        <Coffee size={14} className="text-cafe-accent" />
        <span className="text-[13px] font-bold text-cafe-accent tracking-wide">AC Café</span>
      </div>
      <div className="flex gap-1 bg-cafe-input rounded-full p-[3px] border border-cafe-border">
        {TABS.map((tab, i) => {
          const Icon = tab.icon
          const active = page === i
          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-cafe-accent text-white shadow-sm'
                  : 'text-cafe-muted hover:text-cafe-text-2'
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
