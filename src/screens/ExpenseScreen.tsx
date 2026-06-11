import { useState, useMemo, useRef } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns'
import { th } from 'date-fns/locale'
import { Plus, Trash2, Camera, X, ShoppingCart, Package, ChevronDown, ChevronUp, Receipt } from 'lucide-react'
import { useStore } from '../store/useStore'

type PeriodFilter = 'this_month' | 'last_month' | 'custom'

function getRange(filter: PeriodFilter, customFrom: string, customTo: string) {
  const now = new Date()
  switch (filter) {
    case 'this_month':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'last_month': {
      const d = subMonths(now, 1)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    }
    case 'custom':
      try {
        return {
          from: customFrom ? parseISO(customFrom) : startOfMonth(now),
          to: customTo ? new Date(customTo + 'T23:59:59') : endOfMonth(now),
        }
      } catch { return { from: startOfMonth(now), to: endOfMonth(now) } }
  }
}

const fmt = (n: number) => n.toLocaleString()
const today = format(new Date(), 'yyyy-MM-dd')
const uid = () => crypto.randomUUID()

type TripItem = { rowId: string; ingredientId: string; amount: string }

export default function ExpenseScreen() {
  const { ingredients, expenseEntries, expenseSessions, userId, addIngredient, deleteIngredient, addExpenseSession, deleteExpenseSession } = useStore()

  const [tab, setTab] = useState<'entries' | 'ingredients'>('entries')
  const [filter, setFilter]       = useState<PeriodFilter>('this_month')
  const [customFrom, setCustomFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [customTo, setCustomTo]     = useState(today)

  // Trip form state
  const [tripDate, setTripDate]       = useState(today)
  const [tripNote, setTripNote]       = useState('')
  const [tripPhoto, setTripPhoto]     = useState<File | null>(null)
  const [tripPreview, setTripPreview] = useState<string | null>(null)
  const [tripItems, setTripItems]     = useState<TripItem[]>([{ rowId: uid(), ingredientId: '', amount: '' }])
  const [saving, setSaving]           = useState(false)
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({})
  const fileInputRef                   = useRef<HTMLInputElement>(null)

  // Add ingredient state
  const [newName, setNewName]   = useState('')
  const [addingIng, setAddingIng] = useState(false)

  const { from, to } = getRange(filter, customFrom, customTo)

  const filteredSessions = useMemo(() =>
    expenseSessions.filter(s => {
      try { return isWithinInterval(parseISO(s.date), { start: from, end: to }) }
      catch { return false }
    }),
    [expenseSessions, from, to]
  )

  const filteredEntries = useMemo(() =>
    expenseEntries.filter(e => {
      try { return isWithinInterval(parseISO(e.date), { start: from, end: to }) }
      catch { return false }
    }),
    [expenseEntries, from, to]
  )

  const totalExpense = filteredEntries.reduce((s, e) => s + e.amount, 0)

  // Trip form helpers
  const addRow = () =>
    setTripItems(prev => [...prev, { rowId: uid(), ingredientId: '', amount: '' }])

  const removeRow = (rowId: string) =>
    setTripItems(prev => prev.length > 1 ? prev.filter(r => r.rowId !== rowId) : prev)

  const updateRow = (rowId: string, field: 'ingredientId' | 'amount', val: string) =>
    setTripItems(prev => prev.map(r => r.rowId === rowId ? { ...r, [field]: val } : r))

  const tripTotal = tripItems.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const validItems = tripItems.filter(r => r.ingredientId && parseFloat(r.amount) > 0)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setTripPhoto(file)
    setTripPreview(URL.createObjectURL(file))
  }

  const clearPhoto = () => {
    setTripPhoto(null)
    setTripPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setTripDate(today)
    setTripNote('')
    setTripPhoto(null)
    setTripPreview(null)
    setTripItems([{ rowId: uid(), ingredientId: '', amount: '' }])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    if (!userId || validItems.length === 0) return
    setSaving(true)
    await addExpenseSession({
      date: tripDate,
      note: tripNote.trim() || null,
      photo: tripPhoto,
      items: validItems.map(r => ({ ingredientId: r.ingredientId, amount: parseFloat(r.amount) })),
    })
    resetForm()
    setSaving(false)
  }

  const handleAddIngredient = async () => {
    const name = newName.trim()
    if (!name || addingIng) return
    setAddingIng(true)
    await addIngredient(name)
    setNewName('')
    setAddingIng(false)
  }

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const ingName = (id: string) => ingredients.find(i => i.id === id)?.name ?? '?'

  const PERIODS: { key: PeriodFilter; label: string }[] = [
    { key: 'this_month', label: 'เดือนนี้' },
    { key: 'last_month', label: 'เดือนที่แล้ว' },
    { key: 'custom',     label: 'กำหนดเอง' },
  ]

  const inputCls = 'bg-cafe-card border border-cafe-border rounded-xl px-3 py-2.5 text-sm text-cafe-text outline-none focus:border-cafe-accent transition-colors'

  return (
    <div className="p-4 lg:px-8 lg:py-6 pb-8 space-y-4 lg:space-y-5">
      <h1 className="text-xl lg:text-2xl font-bold text-cafe-text pt-1">รายจ่ายวัตถุดิบ</h1>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-cafe-input rounded-xl p-1 border border-cafe-border">
        {([
          { key: 'entries' as const,     icon: ShoppingCart, label: 'บันทึกซื้อ' },
          { key: 'ingredients' as const, icon: Package,       label: 'วัตถุดิบ' },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              tab === key ? 'bg-cafe-accent text-white shadow-sm' : 'text-cafe-muted hover:text-cafe-text-2'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── ENTRIES TAB ─────────────────────────────────────────────────── */}
      {tab === 'entries' && (
        <>
          {/* ── Trip form ─── */}
          {ingredients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package size={48} className="mb-4 text-cafe-border" />
              <p className="text-cafe-text-2 font-semibold mb-1">ยังไม่มีวัตถุดิบ</p>
              <p className="text-cafe-muted text-sm mb-4">เพิ่มวัตถุดิบก่อนบันทึกรายจ่าย</p>
              <button
                onClick={() => setTab('ingredients')}
                className="px-4 py-2.5 bg-cafe-accent text-white rounded-xl text-sm font-bold cursor-pointer"
              >
                ไปเพิ่มวัตถุดิบ
              </button>
            </div>
          ) : (
            <div className="bg-cafe-card border border-cafe-border rounded-xl shadow-sm overflow-hidden">
              {/* Form header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-cafe-section border-b border-cafe-border">
                <Receipt size={15} className="text-cafe-accent" />
                <span className="text-sm font-bold text-cafe-text">บันทึกการซื้อ</span>
              </div>

              <div className="p-4 space-y-3">
                {/* Date + Note row */}
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tripDate}
                    onChange={e => setTripDate(e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    type="text"
                    value={tripNote}
                    onChange={e => setTripNote(e.target.value)}
                    placeholder="โน้ต (เช่น ตลาดสด)"
                    className={`${inputCls} flex-1`}
                  />
                </div>

                {/* Ingredient rows */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">รายการที่ซื้อ</p>
                  {tripItems.map((row, i) => (
                    <div key={row.rowId} className="flex gap-2 items-center">
                      <select
                        value={row.ingredientId}
                        onChange={e => updateRow(row.rowId, 'ingredientId', e.target.value)}
                        className={`${inputCls} flex-1 min-w-0`}
                      >
                        <option value="">เลือกวัตถุดิบ</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                      </select>
                      <div className="relative w-28 shrink-0">
                        <input
                          type="number"
                          value={row.amount}
                          onChange={e => updateRow(row.rowId, 'amount', e.target.value)}
                          placeholder="ราคา"
                          className={`${inputCls} w-full pr-6`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cafe-muted">฿</span>
                      </div>
                      <button
                        onClick={() => removeRow(row.rowId)}
                        disabled={tripItems.length === 1 && i === 0}
                        className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addRow}
                    className="flex items-center gap-1.5 text-sm font-semibold text-cafe-accent hover:text-cafe-accent-dark transition-colors cursor-pointer py-1"
                  >
                    <Plus size={14} />
                    เพิ่มรายการ
                  </button>
                </div>

                {/* Photo + total row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border border-cafe-border rounded-xl text-xs font-semibold text-cafe-text-2 bg-cafe-input hover:bg-cafe-section transition-colors">
                    <Camera size={13} className="text-cafe-accent" />
                    {tripPreview ? 'เปลี่ยนสลิป' : 'แนบสลิป'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {tripPreview && (
                    <div className="relative shrink-0">
                      <img src={tripPreview} alt="slip" className="w-10 h-10 rounded-lg object-cover border border-cafe-border" />
                      <button
                        onClick={clearPhoto}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X size={8} className="text-white" />
                      </button>
                    </div>
                  )}
                  {tripTotal > 0 && (
                    <div className="ml-auto text-right">
                      <p className="text-[10px] text-cafe-muted font-semibold">รวม</p>
                      <p className="text-base font-bold text-red-600">{fmt(tripTotal)} ฿</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || validItems.length === 0}
                  className="w-full bg-cafe-accent hover:bg-cafe-accent-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'กำลังบันทึก...' : `บันทึก${validItems.length > 0 ? ` (${validItems.length} รายการ)` : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* ── Period filter ─── */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">ช่วงเวลา</p>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setFilter(p.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                    filter === p.key
                      ? 'bg-cafe-accent border-cafe-accent text-white'
                      : 'bg-cafe-card border-cafe-border text-cafe-text-2 hover:bg-cafe-section'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {filter === 'custom' && (
              <div className="flex gap-2 items-center">
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="flex-1 bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 text-sm text-cafe-text outline-none focus:border-cafe-accent" />
                <span className="text-cafe-muted text-sm">→</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="flex-1 bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 text-sm text-cafe-text outline-none focus:border-cafe-accent" />
              </div>
            )}
          </div>

          {/* ── Total summary ─── */}
          {filteredEntries.length > 0 && (
            <div className="bg-cafe-card border border-cafe-border rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-wide mb-1">รายจ่ายรวม</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-600">{fmt(totalExpense)} ฿</p>
              </div>
              <div className="text-right text-xs text-cafe-muted space-y-0.5">
                <p>{filteredSessions.length} ครั้งที่ซื้อ</p>
                <p>{filteredEntries.length} รายการ</p>
              </div>
            </div>
          )}

          {/* ── Session history ─── */}
          {filteredSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-widest">ประวัติการซื้อ</p>
              {filteredSessions.map(session => {
                const total   = session.items.reduce((s, i) => s + i.amount, 0)
                const isOpen  = expanded[session.id] ?? false
                return (
                  <div key={session.id} className="bg-cafe-card border border-cafe-border rounded-xl overflow-hidden shadow-sm">
                    {/* Session header */}
                    <div className="flex items-center gap-2.5 px-4 py-3">
                      {session.photoUrl ? (
                        <a href={session.photoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img src={session.photoUrl} alt="slip" className="w-9 h-9 rounded-lg object-cover border border-cafe-border" />
                        </a>
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-cafe-section border border-cafe-border flex items-center justify-center shrink-0">
                          <Receipt size={14} className="text-cafe-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-cafe-text">{fmtDate(session.date)}</span>
                          <span className="text-xs text-cafe-muted">{session.items.length} รายการ</span>
                        </div>
                        {session.note && (
                          <p className="text-xs text-cafe-muted truncate">{session.note}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-red-600 shrink-0">{fmt(total)} ฿</span>
                      <button
                        onClick={() => toggleExpand(session.id)}
                        className="p-1 text-cafe-muted hover:text-cafe-text transition-colors cursor-pointer"
                      >
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button
                        onClick={() => { if (confirm('ลบการซื้อครั้งนี้ทั้งหมด?')) deleteExpenseSession(session.id) }}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Items breakdown (expandable) */}
                    {isOpen && (
                      <div className="border-t border-cafe-border-light divide-y divide-cafe-border-light">
                        {session.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 px-4 py-2.5">
                            <Package size={12} className="text-cafe-accent shrink-0" />
                            <span className="flex-1 text-sm text-cafe-text">{ingName(item.ingredientId)}</span>
                            <span className="text-sm font-semibold text-cafe-text-2">{fmt(item.amount)} ฿</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {filteredSessions.length === 0 && ingredients.length > 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart size={40} className="mb-3 text-cafe-border" />
              <p className="font-semibold text-cafe-text-2 mb-1">ยังไม่มีรายการซื้อ</p>
              <p className="text-sm text-cafe-muted">บันทึกการซื้อวัตถุดิบด้านบน</p>
            </div>
          )}
        </>
      )}

      {/* ── INGREDIENTS TAB ─────────────────────────────────────────────── */}
      {tab === 'ingredients' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddIngredient()}
              placeholder="ชื่อวัตถุดิบ เช่น นมสด, น้ำตาล, กาแฟ"
              className="flex-1 bg-cafe-card border border-cafe-border rounded-xl px-4 py-3 text-sm text-cafe-text outline-none focus:border-cafe-accent transition-colors"
            />
            <button
              onClick={handleAddIngredient}
              disabled={!newName.trim() || addingIng}
              className="px-4 bg-cafe-accent hover:bg-cafe-accent-dark text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>

          {ingredients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Package size={40} className="mb-3 text-cafe-border" />
              <p className="font-semibold text-cafe-text-2 mb-1">ยังไม่มีวัตถุดิบ</p>
              <p className="text-sm text-cafe-muted">กรอกชื่อแล้วกด Enter หรือปุ่ม +</p>
            </div>
          ) : (
            <div className="bg-cafe-card border border-cafe-border rounded-xl overflow-hidden shadow-sm">
              {ingredients.map((ing, i) => {
                const usageCount = expenseEntries.filter(e => e.ingredientId === ing.id).length
                return (
                  <div
                    key={ing.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-cafe-border-light' : ''}`}
                  >
                    <Package size={14} className="text-cafe-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cafe-text">{ing.name}</p>
                      {usageCount > 0 && (
                        <p className="text-xs text-cafe-muted">{usageCount} รายการซื้อ</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const warn = usageCount > 0 ? ` (มี ${usageCount} รายการซื้อจะถูกลบด้วย)` : ''
                        if (confirm(`ลบ "${ing.name}"?${warn}`)) deleteIngredient(ing.id)
                      }}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function fmtDate(s: string) {
  try { return format(parseISO(s), 'd MMM yy', { locale: th }) }
  catch { return s }
}
