import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { CalendarDays, Store, Minus, Plus, CheckCircle, Trash2, AlertCircle, Coffee, ArrowRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import DatePicker from '../components/DatePicker'
import SaveSuccess from '../components/SaveSuccess'

type PlatformQtys = Record<string, Record<string, string>>

const today = format(new Date(), 'yyyy-MM-dd')

export default function SalesScreen({ onNavigate }: { onNavigate: (page: number) => void }) {
  const { menuItems, platforms, sales, addSale, deleteSale } = useStore()
  const [date, setDate]             = useState(today)
  const [platformId, setPlatformId] = useState(platforms[0]?.id ?? '')
  const [allQtys, setAllQtys]       = useState<PlatformQtys>({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSuccess, setShowSuccess]   = useState(false)

  if (menuItems.length === 0) return <Onboarding onNavigate={onNavigate} />

  const selectedPlatform = platforms.find((p) => p.id === platformId)
  const dateSales        = sales.filter((s) => s.date === date)

  const getQty = (menuItemId: string) => allQtys[platformId]?.[menuItemId] ?? ''
  const setQty = (menuItemId: string, val: string) =>
    setAllQtys((prev) => ({
      ...prev,
      [platformId]: { ...(prev[platformId] ?? {}), [menuItemId]: val },
    }))

  const runningTotal = useMemo(() => {
    if (!selectedPlatform) return null
    let qty = 0, revenue = 0, cost = 0
    menuItems.forEach((m) => {
      const q = parseInt(allQtys[platformId]?.[m.id] ?? '0') || 0
      const price = m.platformPrices.find((x) => x.platformId === platformId)?.pricePerCup ?? 0
      qty += q; revenue += q * price; cost += q * m.costPerCup
    })
    const fee = Math.round(revenue * ((selectedPlatform.feePercent || 0) / 100))
    return { qty, revenue, profit: revenue - cost - fee }
  }, [allQtys, platformId, menuItems, selectedPlatform])

  const filledCount = platforms.filter((p) =>
    menuItems.some((m) => parseInt(allQtys[p.id]?.[m.id] ?? '0') > 0)
  ).length

  const handleSave = () => {
    let n = 0
    platforms.forEach((p) => {
      const items = menuItems
        .map((m) => ({ menuItemId: m.id, quantity: parseInt(allQtys[p.id]?.[m.id] ?? '0') || 0 }))
        .filter((i) => i.quantity > 0)
      if (items.length > 0) { addSale({ date, platformId: p.id, items }); n++ }
    })
    if (n === 0) { alert('กรุณากรอกจำนวนแก้วอย่างน้อย 1 รายการ'); return }
    setAllQtys({})
    setShowSuccess(true)
  }

  const menuName     = (id: string) => menuItems.find((m) => m.id === id)?.name ?? id
  const platformName = (id: string) => platforms.find((p) => p.id === id)?.name ?? id

  return (
    <>
      {showSuccess && <SaveSuccess onDone={() => setShowSuccess(false)} />}
      {showCalendar && (
        <DatePicker
          value={date}
          onChange={setDate}
          onClose={() => setShowCalendar(false)}
        />
      )}

      <div className="p-4 lg:px-8 lg:py-6 space-y-4 pb-8 lg:max-w-2xl lg:mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1">
          <h1 className="flex-1 text-xl font-bold text-cafe-text">บันทึกยอดขาย</h1>
          {filledCount > 0 && (
            <span className="text-xs font-semibold text-cafe-accent bg-cafe-section border border-cafe-border rounded-full px-3 py-1">
              ยังไม่บันทึก
            </span>
          )}
        </div>

        {/* Date — calendar icon opens picker */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">วันที่</p>
          <button
            onClick={() => setShowCalendar(true)}
            className="w-full flex items-center gap-3 bg-cafe-card border border-cafe-border rounded-xl px-4 py-3 hover:bg-cafe-section transition-colors"
          >
            <CalendarDays size={17} className="text-cafe-accent shrink-0" />
            <span className="flex-1 text-left text-sm font-semibold text-cafe-text">
              {fmtDate(date)}
            </span>
            <span className="text-xs text-cafe-muted">{date}</span>
          </button>
        </div>

        {/* Platform selector */}
        {platforms.length === 0 ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              ยังไม่มีแพลตฟอร์ม{' '}
              <button onClick={() => onNavigate(3)} className="font-bold underline">ไปตั้งค่า</button>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">แพลตฟอร์ม</p>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {platforms.map((p) => {
                const hasData = menuItems.some((m) => parseInt(allQtys[p.id]?.[m.id] ?? '0') > 0)
                const active  = platformId === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatformId(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border whitespace-nowrap transition-all ${
                      active
                        ? 'bg-cafe-accent border-cafe-accent text-white'
                        : 'bg-cafe-card border-cafe-border text-cafe-text-2 hover:bg-cafe-section'
                    }`}
                  >
                    <Store size={12} />
                    {p.name}
                    {hasData && !active && <span className="w-1.5 h-1.5 rounded-full bg-cafe-accent" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Menu qty inputs */}
        {selectedPlatform && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">จำนวนแก้วที่ขายได้</p>
              {runningTotal && runningTotal.qty > 0 && (
                <p className="text-xs font-semibold text-cafe-text-2">
                  {runningTotal.qty} แก้ว ·{' '}
                  <span className={runningTotal.profit >= 0 ? 'text-green-700' : 'text-red-600'}>
                    กำไร {runningTotal.profit.toLocaleString()} ฿
                  </span>
                </p>
              )}
            </div>

            <div className="bg-cafe-card border border-cafe-border rounded-xl overflow-hidden shadow-sm">
              {menuItems.map((m) => {
                const pp    = m.platformPrices.find((x) => x.platformId === selectedPlatform.id)
                const qty   = getQty(m.id)
                const filled = parseInt(qty || '0') > 0
                return (
                  <div
                    key={m.id}
                    className={`flex items-center px-4 py-3 border-b border-cafe-border-light last:border-0 transition-colors ${filled ? 'bg-amber-50/60' : ''}`}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-semibold text-cafe-text truncate">{m.name}</p>
                      {pp && pp.pricePerCup > 0 ? (
                        <p className="text-xs text-cafe-muted mt-0.5">{pp.pricePerCup} ฿/แก้ว · ต้นทุน {m.costPerCup} ฿</p>
                      ) : (
                        <p className="text-xs text-red-500 mt-0.5">ยังไม่ตั้งราคา</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { const c = parseInt(qty || '0') || 0; if (c > 0) setQty(m.id, String(c - 1)) }}
                        className="w-8 h-8 rounded-lg bg-cafe-input border border-cafe-border flex items-center justify-center hover:bg-cafe-section active:scale-95 transition-transform"
                      >
                        <Minus size={13} className="text-cafe-accent" />
                      </button>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(m.id, e.target.value)}
                        placeholder="0"
                        className={`w-12 h-9 text-center text-sm font-bold rounded-lg border outline-none ${
                          filled
                            ? 'bg-cafe-section border-cafe-accent text-cafe-text'
                            : 'bg-cafe-input border-cafe-border text-cafe-text'
                        }`}
                      />
                      <button
                        onClick={() => { const c = parseInt(qty || '0') || 0; setQty(m.id, String(c + 1)) }}
                        className="w-8 h-8 rounded-lg bg-cafe-input border border-cafe-border flex items-center justify-center hover:bg-cafe-section active:scale-95 transition-transform"
                      >
                        <Plus size={13} className="text-cafe-accent" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 bg-cafe-accent hover:bg-cafe-accent-dark text-white font-bold text-base py-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              <CheckCircle size={19} />
              บันทึกยอดขาย{filledCount > 1 ? ` (${filledCount} platform)` : ''}
            </button>
          </div>
        )}

        {/* Saved entries */}
        {dateSales.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">
              รายการที่บันทึกแล้ว — {fmtDate(date)}
            </p>
            {dateSales.map((sale) => {
              const plat     = platforms.find((p) => p.id === sale.platformId)
              const totalQty = sale.items.reduce((s, i) => s + i.quantity, 0)
              const revenue  = sale.items.reduce((sum, item) => {
                const mi = menuItems.find((m) => m.id === item.menuItemId)
                const pr = mi?.platformPrices.find((x) => x.platformId === sale.platformId)?.pricePerCup ?? 0
                return sum + item.quantity * pr
              }, 0)
              return (
                <div key={sale.id} className="bg-cafe-card border border-cafe-border rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Store size={13} className="text-cafe-accent shrink-0" />
                    <span className="text-sm font-bold text-cafe-accent flex-1">{platformName(sale.platformId)}</span>
                    {plat && plat.feePercent > 0 && (
                      <span className="text-[10px] font-semibold text-cafe-muted bg-cafe-input border border-cafe-border rounded-full px-2 py-0.5">
                        หัก {plat.feePercent}%
                      </span>
                    )}
                    <span className="text-xs font-semibold text-cafe-text-2">{totalQty} แก้ว</span>
                    {revenue > 0 && (
                      <span className="text-xs font-semibold text-cafe-accent">· {revenue.toLocaleString()} ฿</span>
                    )}
                    <button
                      onClick={() => { if (confirm('ต้องการลบรายการนี้?')) deleteSale(sale.id) }}
                      className="ml-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {sale.items.map((item) => (
                      <div key={item.menuItemId} className="flex items-center gap-1.5 text-xs text-cafe-text-2">
                        <span className="text-cafe-muted">·</span>
                        <span>{menuName(item.menuItemId)}</span>
                        <span className="text-cafe-muted">× {item.quantity} แก้ว</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function Onboarding({ onNavigate }: { onNavigate: (page: number) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
      <div className="w-24 h-24 bg-cafe-section border border-cafe-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Coffee size={44} className="text-cafe-accent" />
      </div>
      <h2 className="text-2xl font-bold text-cafe-text mb-1">ยินดีต้อนรับ</h2>
      <p className="text-base font-semibold text-cafe-accent mb-2">ร้านของคุณมีเมนูอะไรบ้าง?</p>
      <p className="text-sm text-cafe-text-2 leading-relaxed mb-8">
        เริ่มต้นด้วยการตั้งค่าเมนูและแพลตฟอร์มที่ขาย<br />เพื่อให้คำนวณรายได้ได้อย่างถูกต้อง
      </p>
      <div className="w-full bg-cafe-card border border-cafe-border rounded-xl divide-y divide-cafe-border-light mb-8 text-left">
        {['1. เพิ่มเมนูพร้อมต้นทุน', '2. เพิ่มแพลตฟอร์มที่ขาย', '3. บันทึกยอดขายรายวัน', '4. ดูรายงานสรุป'].map((s) => (
          <div key={s} className="px-4 py-3 text-sm text-cafe-text">{s}</div>
        ))}
      </div>
      <button
        onClick={() => onNavigate(3)}
        className="w-full flex items-center justify-center gap-2 bg-cafe-accent hover:bg-cafe-accent-dark text-white font-bold py-4 rounded-xl shadow-md transition-colors"
      >
        ไปตั้งค่าเมนูเลย <ArrowRight size={16} />
      </button>
    </div>
  )
}

function fmtDate(s: string) {
  try { return format(new Date(s), 'd MMM yyyy', { locale: th }) }
  catch { return s }
}
