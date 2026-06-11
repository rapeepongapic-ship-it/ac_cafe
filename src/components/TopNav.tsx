import { BarChart2, PenLine, Settings } from 'lucide-react'

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
    <div className="bg-cafe-card border-b border-cafe-border px-3 py-2 shadow-sm sticky top-0 z-10">
      <div className="flex gap-1 bg-cafe-input rounded-xl p-1 border border-cafe-border">
        {TABS.map((tab, i) => {
          const Icon = tab.icon
          const active = page === i
          return (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                active
                  ? 'bg-cafe-accent text-white shadow-sm'
                  : 'text-cafe-muted hover:text-cafe-text-2'
              }`}
            >
              <Icon size={14} strokeWidth={active ? 2.5 : 2} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
