import { useState, type ReactNode } from 'react'
import { Plus, Pencil, Trash2, Store, Coffee, ChevronDown, ChevronUp, AlertTriangle, LogOut } from 'lucide-react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import type { MenuItem, Platform } from '../types'

type Tab = 'menu' | 'platform'

export default function SettingsScreen() {
  const { menuItems, platforms } = useStore()
  const [tab, setTab] = useState<Tab>('menu')

  return (
    <div className="flex flex-col h-full lg:max-w-2xl lg:mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-cafe-border-light">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="flex-1 text-xl font-bold text-cafe-text">ตั้งค่า</h1>
          <span className="text-xs font-semibold text-cafe-muted bg-cafe-input border border-cafe-border rounded-full px-2.5 py-1">
            {menuItems.length} เมนู · {platforms.length} platform
          </span>
        </div>
        <div className="flex gap-1 bg-cafe-input rounded-xl p-1 border border-cafe-border">
          {(['menu', 'platform'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-cafe-accent shadow-sm' : 'text-cafe-muted hover:text-cafe-text-2'
              }`}
            >
              {t === 'menu' ? <Coffee size={14} /> : <Store size={14} />}
              {t === 'menu' ? 'เมนู' : 'แพลตฟอร์ม'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-6">
        {tab === 'menu' ? <MenuTab /> : <PlatformTab />}
        <SignOutButton />
      </div>
    </div>
  )
}

// ─── Menu Tab ──────────────────────────────────────────────────────────────────

function MenuTab() {
  const { menuItems, platforms, addMenuItem, updateMenuItem, deleteMenuItem } = useStore()
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [showForm, setShowForm] = useState(false)

  const openAdd  = () => { setEditItem(null); setShowForm(true) }
  const openEdit = (m: MenuItem) => { setEditItem(m); setShowForm(true) }
  const close    = () => { setEditItem(null); setShowForm(false) }

  if (showForm) {
    return (
      <MenuForm
        platforms={platforms}
        initialItem={editItem}
        onSave={(data) => {
          editItem ? updateMenuItem(editItem.id, data) : addMenuItem(data)
          close()
        }}
        onCancel={close}
      />
    )
  }

  return (
    <div className="space-y-3">
      {platforms.length === 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
          <span>แนะนำ: เพิ่มแพลตฟอร์มก่อน เพื่อตั้งราคาขายต่อแพลตฟอร์มได้</span>
        </div>
      )}

      <button
        onClick={openAdd}
        className="w-full flex items-center justify-center gap-2 bg-cafe-accent hover:bg-cafe-accent-dark text-white font-semibold py-3 rounded-xl transition-colors"
      >
        <Plus size={16} />
        เพิ่มเมนูใหม่
      </button>

      {menuItems.length === 0 ? (
        <EmptyState icon={<Coffee size={40} />} title="ยังไม่มีเมนู" sub="กดปุ่มด้านบนเพื่อเพิ่มเมนูแรก" />
      ) : (
        menuItems.map((item) => {
          const prices = item.platformPrices.filter((p) => p.pricePerCup > 0)
          const minP   = prices.length ? Math.min(...prices.map((p) => p.pricePerCup)) : 0
          const maxP   = prices.length ? Math.max(...prices.map((p) => p.pricePerCup)) : 0
          return (
            <div key={item.id} className="bg-cafe-card border border-cafe-border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 bg-cafe-section border border-cafe-border rounded-xl flex items-center justify-center shrink-0">
                  <Coffee size={16} className="text-cafe-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-cafe-text text-sm truncate">{item.name}</p>
                  <p className="text-xs text-cafe-muted mt-0.5">
                    ต้นทุน {item.costPerCup} ฿
                    {prices.length > 0 && ` · ขาย ${minP === maxP ? minP : `${minP}–${maxP}`} ฿`}
                  </p>
                </div>
                <button onClick={() => openEdit(item)} className="p-1.5 text-cafe-accent hover:bg-cafe-section rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => { if (confirm(`ลบเมนู "${item.name}"?`)) deleteMenuItem(item.id) }}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {prices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {prices.map((pp) => {
                    const plat = platforms.find((x) => x.id === pp.platformId)
                    if (!plat) return null
                    return (
                      <span key={pp.platformId} className="flex items-center gap-1 text-[11px] font-semibold text-cafe-text-2 bg-cafe-input border border-cafe-border rounded-full px-2.5 py-0.5">
                        <Store size={9} className="text-cafe-accent" />
                        {plat.name} · {pp.pricePerCup} ฿
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function MenuForm({ platforms, initialItem, onSave, onCancel }: {
  platforms: Platform[]
  initialItem: MenuItem | null
  onSave: (data: Omit<MenuItem, 'id'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialItem?.name ?? '')
  const [cost, setCost] = useState(initialItem ? String(initialItem.costPerCup) : '')
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    platforms.forEach((p) => {
      const found = initialItem?.platformPrices.find((x) => x.platformId === p.id)
      init[p.id] = found ? String(found.pricePerCup) : ''
    })
    return init
  })

  const handleSave = () => {
    if (!name.trim()) { alert('กรุณากรอกชื่อเมนู'); return }
    const costNum = parseFloat(cost)
    if (!cost || isNaN(costNum)) { alert('กรุณากรอกต้นทุน'); return }
    const platformPrices = platforms
      .map((p) => ({ platformId: p.id, pricePerCup: parseFloat(prices[p.id] ?? '0') || 0 }))
      .filter((pp) => pp.pricePerCup > 0)
    onSave({ name: name.trim(), costPerCup: costNum, platformPrices })
  }

  return (
    <div className="space-y-4">
      <div className="bg-cafe-card border border-cafe-border rounded-xl p-4 space-y-3">
        <h2 className="font-bold text-cafe-text">{initialItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
        <Field label="ชื่อเมนู">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น โกโก้โอริโอนมสด"
            className={inputCls} />
        </Field>
        <Field label="ต้นทุน/แก้ว (฿)">
          <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" placeholder="25"
            className={inputCls} />
        </Field>
      </div>

      {platforms.length > 0 && (
        <div className="bg-cafe-card border border-cafe-border rounded-xl p-4 space-y-3">
          <div>
            <h2 className="font-bold text-cafe-text">ราคาขายต่อแพลตฟอร์ม</h2>
            <p className="text-xs text-cafe-muted mt-0.5">เว้นว่างหากไม่ได้ขายใน platform นั้น</p>
          </div>
          {platforms.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-cafe-border-light last:border-0">
              <div className="flex-1">
                <p className="text-sm font-semibold text-cafe-text">{p.name}</p>
                <p className="text-xs text-cafe-muted">{p.feePercent > 0 ? `หัก ${p.feePercent}%` : 'ไม่หักค่าธรรมเนียม'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={prices[p.id] ?? ''}
                  onChange={(e) => setPrices((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder="–"
                  className="w-20 text-right bg-cafe-input border border-cafe-border rounded-lg px-2 py-1.5 text-sm text-cafe-text outline-none"
                />
                <span className="text-cafe-muted text-sm">฿</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormActions onSave={handleSave} onCancel={onCancel} />
    </div>
  )
}

// ─── Platform Tab ──────────────────────────────────────────────────────────────

function PlatformTab() {
  const { platforms, menuItems, addPlatform, updatePlatform, deletePlatform } = useStore()
  const [editItem, setEditItem]   = useState<Platform | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)

  const openAdd  = () => { setEditItem(null); setShowForm(true) }
  const openEdit = (p: Platform) => { setEditItem(p); setShowForm(true) }
  const close    = () => { setEditItem(null); setShowForm(false) }

  if (showForm) {
    return (
      <PlatformForm
        initialItem={editItem}
        onSave={(data) => {
          editItem ? updatePlatform(editItem.id, data) : addPlatform(data)
          close()
        }}
        onCancel={close}
      />
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={openAdd}
        className="w-full flex items-center justify-center gap-2 bg-cafe-accent hover:bg-cafe-accent-dark text-white font-semibold py-3 rounded-xl transition-colors"
      >
        <Plus size={16} />
        เพิ่มแพลตฟอร์ม
      </button>

      {platforms.length === 0 ? (
        <EmptyState icon={<Store size={40} />} title="ยังไม่มีแพลตฟอร์ม" sub="เพิ่มช่องทางขาย เช่น Line OA, Lineman" />
      ) : (
        platforms.map((p) => {
          const isOpen   = expanded === p.id
          const menuCount = menuItems.filter((m) => m.platformPrices.some((x) => x.platformId === p.id && x.pricePerCup > 0)).length
          return (
            <div key={p.id} className="bg-cafe-card border border-cafe-border rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 bg-cafe-section border border-cafe-border rounded-xl flex items-center justify-center shrink-0">
                  <Store size={16} className="text-cafe-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-cafe-text text-sm">{p.name}</p>
                  <p className="text-xs text-cafe-muted mt-0.5">
                    {p.feePercent > 0 ? `หัก ${p.feePercent}% (${p.feeLabel})` : 'ไม่หักค่าธรรมเนียม'}
                    {menuCount > 0 && ` · ${menuCount} เมนู`}
                  </p>
                </div>
                <button onClick={() => setExpanded(isOpen ? null : p.id)} className="p-1.5 text-cafe-muted hover:text-cafe-text transition-colors">
                  {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                <button onClick={() => openEdit(p)} className="p-1.5 text-cafe-accent hover:bg-cafe-section rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => { if (confirm(`ลบแพลตฟอร์ม "${p.name}"?`)) deletePlatform(p.id) }}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {isOpen && menuCount > 0 && (
                <div className="px-4 pb-3 border-t border-cafe-border-light">
                  <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-wide py-2">ราคาเมนูใน {p.name}</p>
                  <div className="space-y-1">
                    {menuItems
                      .map((m) => ({ m, pp: m.platformPrices.find((x) => x.platformId === p.id) }))
                      .filter(({ pp }) => pp && pp.pricePerCup > 0)
                      .map(({ m, pp }) => (
                        <div key={m.id} className="flex items-center justify-between text-sm py-1">
                          <span className="text-cafe-text-2">{m.name}</span>
                          <span className="font-semibold text-cafe-accent">{pp!.pricePerCup} ฿</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function PlatformForm({ initialItem, onSave, onCancel }: {
  initialItem: Platform | null
  onSave: (data: Omit<Platform, 'id'>) => void
  onCancel: () => void
}) {
  const [name,     setName]     = useState(initialItem?.name ?? '')
  const [fee,      setFee]      = useState(initialItem ? String(initialItem.feePercent) : '')
  const [feeLabel, setFeeLabel] = useState(initialItem?.feeLabel ?? '')

  const handleSave = () => {
    if (!name.trim()) { alert('กรุณากรอกชื่อแพลตฟอร์ม'); return }
    const feeNum = parseFloat(fee)
    if (fee === '' || isNaN(feeNum)) { alert('กรุณากรอกค่าธรรมเนียม'); return }
    onSave({ name: name.trim(), feePercent: feeNum, feeLabel: feeLabel.trim() || 'ค่าธรรมเนียม' })
  }

  return (
    <div className="space-y-4">
      <div className="bg-cafe-card border border-cafe-border rounded-xl p-4 space-y-3">
        <h2 className="font-bold text-cafe-text">{initialItem ? 'แก้ไขแพลตฟอร์ม' : 'เพิ่มแพลตฟอร์ม'}</h2>
        <Field label="ชื่อแพลตฟอร์ม">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Line OA, Lineman"
            className={inputCls} />
        </Field>
        <Field label="ค่าธรรมเนียม (%)">
          <input value={fee} onChange={(e) => setFee(e.target.value)} type="number" placeholder="0"
            className={inputCls} />
        </Field>
        <Field label="ชื่อคอลัมน์ค่าธรรมเนียมในรายงาน">
          <input value={feeLabel} onChange={(e) => setFeeLabel(e.target.value)}
            placeholder="เช่น GP+Ad+ส่วนลดแอพ" className={inputCls} />
        </Field>
      </div>
      <FormActions onSave={handleSave} onCancel={onCancel} />
    </div>
  )
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-cafe-input border border-cafe-border rounded-xl px-3 py-2.5 text-sm text-cafe-text outline-none focus:border-cafe-accent transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-cafe-muted">{label}</label>
      {children}
    </div>
  )
}

function FormActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onSave} className="flex-1 bg-cafe-accent hover:bg-cafe-accent-dark text-white font-semibold py-3 rounded-xl transition-colors">
        บันทึก
      </button>
      <button onClick={onCancel} className="px-5 bg-cafe-card border border-cafe-border text-cafe-text-2 font-semibold py-3 rounded-xl hover:bg-cafe-section transition-colors">
        ยกเลิก
      </button>
    </div>
  )
}

function SignOutButton() {
  const { reset } = useStore()
  const handleSignOut = async () => {
    if (!confirm('ออกจากระบบ?')) return
    reset()
    await supabase.auth.signOut()
  }
  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-3 rounded-xl transition-colors"
    >
      <LogOut size={15} />
      ออกจากระบบ
    </button>
  )
}

function EmptyState({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 text-cafe-border">{icon}</div>
      <p className="font-semibold text-cafe-text-2 mb-1">{title}</p>
      <p className="text-sm text-cafe-muted">{sub}</p>
    </div>
  )
}
