import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, subDays, parseISO, isWithinInterval } from 'date-fns'
import { TrendingUp, TrendingDown, Store, BarChart2, ShoppingCart } from 'lucide-react'
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
  const { sales, platforms, menuItems, expenseEntries, ingredients } = useStore()
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
    <div className="p-4 lg:px-8 lg:py-6 space-y-4 lg:space-y-5 pb-8">
      <h1 className="text-xl lg:text-2xl font-bold text-cafe-text pt-1">รายงาน</h1>

      {/* Quick filter + Platform filter — same row on desktop */}
      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Period */}
        <div className="space-y-2 lg:flex-1">
          <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">ช่วงเวลา</p>
          <div className="flex flex-wrap gap-2">
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
          <div className="space-y-2 mt-4 lg:mt-0 lg:shrink-0">
            <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">แพลตฟอร์ม</p>
            <div className="flex flex-wrap gap-2">
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
          </div>
        )}
      </div>

      {/* No data */}
      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart2 size={48} className="mb-4 text-cafe-border" />
          <p className="text-cafe-text-2 font-semibold mb-1">ยังไม่มีข้อมูลในช่วงนี้</p>
          <p className="text-cafe-muted text-sm">บันทึกยอดขายในแท็บ "บันทึกขาย"</p>
        </div>
      ) : (
        <>
          {/* Grand summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 px-3 lg:px-5 py-2 bg-cafe-input/50 text-[10px] font-semibold text-cafe-muted uppercase tracking-wide">
                <span>เมนู</span>
                <span className="text-right w-10 lg:w-16">แก้ว</span>
                <span className="text-right w-16 lg:w-28">รายได้</span>
                {s.platform.feePercent > 0 && <span className="text-right w-14 lg:w-24">{s.platform.feeLabel || 'ค่า GP'}</span>}
                <span className="text-right w-16 lg:w-28">กำไร</span>
              </div>

              {/* Rows */}
              {s.rows.map((row) => (
                <div
                  key={row.menuItemId}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 px-3 lg:px-5 py-2.5 lg:py-3 border-t border-cafe-border-light text-sm"
                >
                  <span className="text-cafe-text font-medium truncate">{row.name}</span>
                  <span className="text-right w-10 lg:w-16 text-cafe-text-2">{row.quantity}</span>
                  <span className="text-right w-16 lg:w-28 text-cafe-text-2">{fmt(row.revenue)}</span>
                  {s.platform.feePercent > 0 && (
                    <span className="text-right w-14 lg:w-24 text-cafe-muted">-{fmt(row.feeDeduct)}</span>
                  )}
                  <span className={`text-right w-16 lg:w-28 font-semibold ${row.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {fmt(row.profit)}
                  </span>
                </div>
              ))}

              {/* Platform total */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 px-3 lg:px-5 py-2.5 lg:py-3 border-t border-cafe-border bg-cafe-section text-sm font-bold">
                <span className="text-cafe-text-2">รวม</span>
                <span className="text-right w-10 lg:w-16 text-cafe-text">{s.totalQty}</span>
                <span className="text-right w-16 lg:w-28 text-cafe-text">{fmt(s.totalRevenue)}</span>
                {s.platform.feePercent > 0 && (
                  <span className="text-right w-14 lg:w-24 text-cafe-muted">-{fmt(s.totalFee)}</span>
                )}
                <span className={`text-right w-16 lg:w-28 ${s.totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
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

          {/* Expense summary */}
          <ExpenseSummary
            expenseEntries={expenseEntries}
            ingredients={ingredients}
            from={from}
            to={to}
            saleProfit={grand.profit}
          />
        </>
      )}
    </div>
  )
}

function ExpenseSummary({ expenseEntries, ingredients, from, to, saleProfit }: {
  expenseEntries: import('../types').ExpenseEntry[]
  ingredients: import('../types').Ingredient[]
  from: Date
  to: Date
  saleProfit: number
}) {
  const filtered = expenseEntries.filter(e => {
    try { return isWithinInterval(parseISO(e.date), { start: from, end: to }) }
    catch { return false }
  })
  if (filtered.length === 0) return null

  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const byIngredient = ingredients
    .map(ing => ({
      name: ing.name,
      total: filtered.filter(e => e.ingredientId === ing.id).reduce((s, e) => s + e.amount, 0),
      count: filtered.filter(e => e.ingredientId === ing.id).length,
    }))
    .filter(x => x.total > 0)
    .sort((a, b) => b.total - a.total)

  const net = saleProfit - total

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">รายจ่ายวัตถุดิบ</p>

      <div className="bg-cafe-card border border-cafe-border rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-4 lg:px-5 py-3 bg-red-50 border-b border-cafe-border">
          <ShoppingCart size={14} className="text-red-500 shrink-0" />
          <span className="font-bold text-red-600 text-sm flex-1">รายจ่ายรวม</span>
          <span className="text-sm font-bold text-red-600">{fmt(total)} ฿</span>
          <span className="text-[10px] font-semibold text-cafe-muted bg-cafe-input border border-cafe-border rounded-full px-2 py-0.5">
            {filtered.length} รายการ
          </span>
        </div>
        {byIngredient.map((x, i) => (
          <div key={x.name} className={`flex items-center px-4 lg:px-5 py-2.5 lg:py-3 text-sm ${i > 0 ? 'border-t border-cafe-border-light' : ''}`}>
            <span className="flex-1 text-cafe-text font-medium">{x.name}</span>
            <span className="text-cafe-muted text-xs mr-3">{x.count} ครั้ง</span>
            <span className="font-semibold text-red-600">{fmt(x.total)} ฿</span>
          </div>
        ))}
      </div>

      {saleProfit > 0 && (
        <div className={`rounded-xl px-4 py-3 flex items-center justify-between border ${net >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div>
            <p className={`text-xs font-semibold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>กำไรหลังหักรายจ่าย</p>
            <p className={`text-xl font-bold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(net)} ฿</p>
          </div>
          <div className={`text-right text-xs space-y-0.5 ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            <p>กำไรขาย +{fmt(saleProfit)} ฿</p>
            <p>รายจ่าย -{fmt(total)} ฿</p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, positive, dim }: {
  label: string; value: string; sub: string; positive?: boolean; dim?: boolean
}) {
  return (
    <div className="bg-cafe-card border border-cafe-border rounded-xl px-3 lg:px-5 py-3 lg:py-4 shadow-sm">
      <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-lg lg:text-2xl font-bold ${dim ? 'text-cafe-text-2' : positive === false ? 'text-red-600' : positive ? 'text-green-700' : 'text-cafe-text'}`}>
        {value}
      </p>
      {sub && <p className="text-xs lg:text-sm text-cafe-muted mt-0.5">{sub}</p>}
    </div>
  )
}
