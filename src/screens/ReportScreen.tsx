import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, subDays, parseISO, isWithinInterval } from 'date-fns'
import { TrendingUp, TrendingDown, Store } from 'lucide-react'
import { useStore } from '../store/useStore'
import { calcPlatformSummary } from '../utils/calculations'

type QuickFilter = 'today' | 'week' | 'month' | 'last_month' | 'custom'

const FILTERS: { key: QuickFilter; label: string }[] = [
  { key: 'today',      label: 'วันนี้' },
  { key: 'week',       label: '7 วัน' },
  { key: 'month',      label: 'เดือนนี้' },
  { key: 'last_month', label: 'เดือนที่แล้ว' },
  { key: 'custom',     label: 'กำหนดเอง' },
]

function getRange(filter: QuickFilter, from: string, to: string) {
  const now = new Date()
  switch (filter) {
    case 'today':
      return { from: new Date(format(now, 'yyyy-MM-dd')), to: new Date(format(now, 'yyyy-MM-dd') + 'T23:59:59') }
    case 'week':
      return { from: subDays(now, 6), to: now }
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'last_month': {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    }
    case 'custom':
      try {
        return {
          from: from ? parseISO(from) : startOfMonth(now),
          to:   to   ? new Date(to + 'T23:59:59') : endOfMonth(now),
        }
      } catch { return { from: startOfMonth(now), to: endOfMonth(now) } }
  }
}

const fmt = (n: number) => n.toLocaleString()

export default function ReportScreen() {
  const { sales, platforms, menuItems } = useStore()
  const [filter, setFilter]             = useState<QuickFilter>('month')
  const [customFrom, setCustomFrom]     = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [customTo, setCustomTo]         = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [platformFilter, setPlatformFilter] = useState('all')

  const { from, to } = getRange(filter, customFrom, customTo)

  const filteredSales = useMemo(() =>
    sales.filter((s) => {
      const d = parseISO(s.date)
      return isWithinInterval(d, { start: from, end: to }) &&
        (platformFilter === 'all' || s.platformId === platformFilter)
    }),
    [sales, from, to, platformFilter]
  )

  const activePlatforms = platformFilter === 'all'
    ? platforms
    : platforms.filter((p) => p.id === platformFilter)

  const summaries = useMemo(() =>
    activePlatforms
      .map((p) => calcPlatformSummary(filteredSales, p, menuItems))
      .filter((s) => s.rows.length > 0),
    [filteredSales, activePlatforms, menuItems]
  )

  const grand = useMemo(() => ({
    qty:     summaries.reduce((s, p) => s + p.totalQty, 0),
    revenue: summaries.reduce((s, p) => s + p.totalRevenue, 0),
    cost:    summaries.reduce((s, p) => s + p.totalCost, 0),
    fee:     summaries.reduce((s, p) => s + p.totalFee, 0),
    profit:  summaries.reduce((s, p) => s + p.totalProfit, 0),
  }), [summaries])

  return (
    <div className="p-4 space-y-4 pb-8">
      <h1 className="text-xl font-bold text-cafe-text pt-1">รายงาน</h1>

      {/* Quick filter */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">ช่วงเวลา</p>
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-cafe-accent border-cafe-accent text-white'
                  : 'bg-cafe-card border-cafe-border text-cafe-text-2 hover:bg-cafe-section'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {filter === 'custom' && (
          <div className="flex gap-2 items-center">
            <input
              type="text" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="flex-1 bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 text-sm text-cafe-text outline-none"
            />
            <span className="text-cafe-muted text-sm">→</span>
            <input
              type="text" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="flex-1 bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 text-sm text-cafe-text outline-none"
            />
          </div>
        )}
      </div>

      {/* Platform filter */}
      {platforms.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors ${
              platformFilter === 'all'
                ? 'bg-cafe-accent border-cafe-accent text-white'
                : 'bg-cafe-card border-cafe-border text-cafe-text-2 hover:bg-cafe-section'
            }`}
          >
            ทุกแพลตฟอร์ม
          </button>
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatformFilter(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors ${
                platformFilter === p.id
                  ? 'bg-cafe-accent border-cafe-accent text-white'
                  : 'bg-cafe-card border-cafe-border text-cafe-text-2 hover:bg-cafe-section'
              }`}
            >
              <Store size={12} />
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* No data */}
      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📊</span>
          <p className="text-cafe-text-2 font-semibold mb-1">ยังไม่มีข้อมูลในช่วงนี้</p>
          <p className="text-cafe-muted text-sm">บันทึกยอดขายในแท็บ "บันทึกขาย"</p>
        </div>
      ) : (
        <>
          {/* Grand summary cards */}
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="รายได้รวม"  value={`${fmt(grand.revenue)} ฿`} sub={`${fmt(grand.qty)} แก้ว`} />
            <StatCard
              label="กำไรสุทธิ"
              value={`${fmt(grand.profit)} ฿`}
              sub={grand.revenue > 0 ? `${Math.round(grand.profit / grand.revenue * 100)}%` : '-'}
              positive={grand.profit >= 0}
            />
            <StatCard label="ต้นทุนรวม" value={`${fmt(grand.cost)} ฿`}  sub="" dim />
            <StatCard label="ค่าธรรมเนียม" value={`${fmt(grand.fee)} ฿`} sub="" dim />
          </div>

          {/* Per-platform tables */}
          {summaries.map((s) => (
            <div key={s.platform.id} className="bg-cafe-card border border-cafe-border rounded-xl overflow-hidden shadow-sm">
              {/* Platform header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-cafe-section border-b border-cafe-border">
                <Store size={14} className="text-cafe-accent" />
                <span className="font-bold text-cafe-accent text-sm flex-1">{s.platform.name}</span>
                {s.platform.feePercent > 0 && (
                  <span className="text-[10px] font-semibold text-cafe-muted bg-cafe-input border border-cafe-border rounded-full px-2 py-0.5">
                    หัก {s.platform.feePercent}% {s.platform.feeLabel}
                  </span>
                )}
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 px-3 py-2 bg-cafe-input/50 text-[10px] font-semibold text-cafe-muted uppercase tracking-wide">
                <span>เมนู</span>
                <span className="text-right w-10">แก้ว</span>
                <span className="text-right w-14">รายได้</span>
                {s.platform.feePercent > 0 && <span className="text-right w-12">ค่า GP</span>}
                <span className="text-right w-14">กำไร</span>
              </div>

              {/* Rows */}
              {s.rows.map((row) => (
                <div
                  key={row.menuItemId}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 px-3 py-2.5 border-t border-cafe-border-light text-sm"
                >
                  <span className="text-cafe-text font-medium truncate">{row.name}</span>
                  <span className="text-right w-10 text-cafe-text-2">{row.quantity}</span>
                  <span className="text-right w-14 text-cafe-text-2">{fmt(row.revenue)}</span>
                  {s.platform.feePercent > 0 && (
                    <span className="text-right w-12 text-cafe-muted">-{fmt(row.feeDeduct)}</span>
                  )}
                  <span className={`text-right w-14 font-semibold ${row.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {fmt(row.profit)}
                  </span>
                </div>
              ))}

              {/* Platform total */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 px-3 py-2.5 border-t border-cafe-border bg-cafe-section text-sm font-bold">
                <span className="text-cafe-text-2">รวม</span>
                <span className="text-right w-10 text-cafe-text">{s.totalQty}</span>
                <span className="text-right w-14 text-cafe-text">{fmt(s.totalRevenue)}</span>
                {s.platform.feePercent > 0 && (
                  <span className="text-right w-12 text-cafe-muted">-{fmt(s.totalFee)}</span>
                )}
                <span className={`text-right w-14 ${s.totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {fmt(s.totalProfit)}
                </span>
              </div>
            </div>
          ))}

          {/* Grand total row */}
          {summaries.length > 1 && (
            <div className="bg-cafe-accent text-white rounded-xl px-4 py-3 flex items-center gap-3">
              {grand.profit >= 0
                ? <TrendingUp size={20} className="shrink-0" />
                : <TrendingDown size={20} className="shrink-0" />
              }
              <div className="flex-1">
                <p className="text-xs font-semibold opacity-80">กำไรสุทธิรวมทุก platform</p>
                <p className="text-xl font-bold">{fmt(grand.profit)} ฿</p>
              </div>
              <div className="text-right text-xs opacity-80 space-y-0.5">
                <p>{fmt(grand.qty)} แก้ว</p>
                <p>รายได้ {fmt(grand.revenue)} ฿</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, positive, dim }: {
  label: string; value: string; sub: string; positive?: boolean; dim?: boolean
}) {
  return (
    <div className="bg-cafe-card border border-cafe-border rounded-xl px-3 py-3 shadow-sm">
      <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg font-bold ${dim ? 'text-cafe-text-2' : positive === false ? 'text-red-600' : positive ? 'text-green-700' : 'text-cafe-text'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-cafe-muted mt-0.5">{sub}</p>}
    </div>
  )
}
