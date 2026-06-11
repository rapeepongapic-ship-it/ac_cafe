import { useState, useMemo, useRef } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns'
import { th } from 'date-fns/locale'
import { Plus, Trash2, Camera, X, ShoppingCart, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

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

export default function ExpenseScreen() {
  const { ingredients, expenseEntries, userId, addIngredient, deleteIngredient, addExpenseEntry, deleteExpenseEntry } = useStore()

  const [tab, setTab]             = useState<'entries' | 'ingredients'>('entries')
  const [filter, setFilter]       = useState<PeriodFilter>('this_month')
  const [customFrom, setCustomFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [customTo, setCustomTo]     = useState(today)

  // Add entry state
  const [addingFor, setAddingFor]         = useState<string | null>(null)
  const [entryDate, setEntryDate]         = useState(today)
  const [entryAmount, setEntryAmount]     = useState('')
  const [entryNote, setEntryNote]         = useState('')
  const [entryPhoto, setEntryPhoto]       = useState<File | null>(null)
  const [entryPreview, setEntryPreview]   = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)
  const [expanded, setExpanded]           = useState<Record<string, boolean>>({})
  const fileInputRef                       = useRef<HTMLInputElement>(null)

  // Add ingredient state
  const [newName, setNewName] = useState('')
  const [addingIng, setAddingIng] = useState(false)

  const { from, to } = getRange(filter, customFrom, customTo)

  const filteredEntries = useMemo(() =>
    expenseEntries.filter(e => {
      try { return isWithinInterval(parseISO(e.date), { start: from, end: to }) }
      catch { return false }
    }),
    [expenseEntries, from, to]
  )

  const totalExpense = filteredEntries.reduce((s, e) => s + e.amount, 0)

  const openAdd = (ingredientId: string) => {
    setAddingFor(ingredientId)
    setEntryDate(today)
    setEntryAmount('')
    setEntryNote('')
    setEntryPhoto(null)
    setEntryPreview(null)
  }

  const closeAdd = () => {
    setAddingFor(null)
    setEntryPhoto(null)
    setEntryPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEntryPhoto(file)
    setEntryPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!addingFor || !entryAmount || !userId) return
    const amount = parseFloat(entryAmount)
    if (isNaN(amount) || amount <= 0) return
    setSaving(true)

    let photoUrl: string | null = null
    if (entryPhoto) {
      const ext = entryPhoto.name.split('.').pop() || 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('expense-photos').upload(path, entryPhoto)
      if (!error) {
        photoUrl = supabase.storage.from('expense-photos').getPublicUrl(path).data.publicUrl
      }
    }

    await addExpenseEntry({
      ingredientId: addingFor,
      date: entryDate,
      amount,
      photoUrl,
      note: entryNote.trim() || null,
    })

    setSaving(false)
    closeAdd()
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

  const PERIODS: { key: PeriodFilter; label: string }[] = [
    { key: 'this_month', label: 'เดือนนี้' },
    { key: 'last_month', label: 'เดือนที่แล้ว' },
    { key: 'custom',     label: 'กำหนดเอง' },
  ]

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
          {/* Period filter */}
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
                <input type="text" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="flex-1 bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 text-sm text-cafe-text outline-none focus:border-cafe-accent" />
                <span className="text-cafe-muted text-sm">→</span>
                <input type="text" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="flex-1 bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 text-sm text-cafe-text outline-none focus:border-cafe-accent" />
              </div>
            )}
          </div>

          {/* Total card */}
          {filteredEntries.length > 0 && (
            <div className="bg-cafe-card border border-cafe-border rounded-xl px-4 lg:px-5 py-3 lg:py-4 flex items-center gap-3 shadow-sm">
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-cafe-muted uppercase tracking-wide mb-1">รายจ่ายรวม</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-600">{fmt(totalExpense)} ฿</p>
              </div>
              <div className="text-right text-xs text-cafe-muted space-y-0.5">
                <p>{filteredEntries.length} รายการ</p>
                <p>{ingredients.filter(i => filteredEntries.some(e => e.ingredientId === i.id)).length} วัตถุดิบ</p>
              </div>
            </div>
          )}

          {/* No ingredients */}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {ingredients.map(ingredient => {
                const entries  = filteredEntries.filter(e => e.ingredientId === ingredient.id)
                const total    = entries.reduce((s, e) => s + e.amount, 0)
                const isAdding = addingFor === ingredient.id
                const isOpen   = expanded[ingredient.id] ?? false

                return (
                  <div key={ingredient.id} className="bg-cafe-card border border-cafe-border rounded-xl overflow-hidden shadow-sm">

                    {/* Card header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-cafe-section border-b border-cafe-border">
                      <Package size={14} className="text-cafe-accent shrink-0" />
                      <span className="font-bold text-cafe-text flex-1 text-sm truncate">{ingredient.name}</span>
                      {entries.length > 0 && (
                        <>
                          <span className="text-sm font-bold text-red-600 shrink-0">{fmt(total)} ฿</span>
                          <span className="text-[10px] font-semibold text-cafe-muted bg-cafe-input border border-cafe-border rounded-full px-2 py-0.5 shrink-0">
                            {entries.length} ครั้ง
                          </span>
                          <button
                            onClick={() => toggleExpand(ingredient.id)}
                            className="p-1 text-cafe-muted hover:text-cafe-text transition-colors cursor-pointer"
                          >
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Entry list (collapsible) */}
                    {entries.length > 0 && isOpen && (
                      <div className="divide-y divide-cafe-border-light">
                        {entries.map(entry => (
                          <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                            {entry.photoUrl && (
                              <a href={entry.photoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                <img
                                  src={entry.photoUrl}
                                  alt="receipt"
                                  className="w-10 h-10 rounded-lg object-cover border border-cafe-border"
                                />
                              </a>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-cafe-text">{fmt(entry.amount)} ฿</span>
                                <span className="text-xs text-cafe-muted">{fmtDate(entry.date)}</span>
                              </div>
                              {entry.note && (
                                <p className="text-xs text-cafe-muted truncate">{entry.note}</p>
                              )}
                            </div>
                            <button
                              onClick={() => { if (confirm('ลบรายการนี้?')) deleteExpenseEntry(entry.id) }}
                              className="p-1.5 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add entry form (inline) */}
                    {isAdding ? (
                      <div className="px-4 py-3 border-t border-cafe-border bg-cafe-section/50 space-y-2.5">
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={entryDate}
                            onChange={e => setEntryDate(e.target.value)}
                            className="flex-1 bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 text-sm text-cafe-text outline-none focus:border-cafe-accent"
                          />
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={entryAmount}
                              onChange={e => setEntryAmount(e.target.value)}
                              placeholder="ราคา"
                              autoFocus
                              className="w-full bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 pr-7 text-sm text-cafe-text outline-none focus:border-cafe-accent"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cafe-muted">฿</span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={entryNote}
                          onChange={e => setEntryNote(e.target.value)}
                          placeholder="โน้ต (ไม่บังคับ) เช่น ซื้อจากตลาดสด"
                          className="w-full bg-cafe-card border border-cafe-border rounded-xl px-3 py-2 text-sm text-cafe-text outline-none focus:border-cafe-accent"
                        />

                        {/* Photo upload */}
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer px-3 py-2 border border-cafe-border rounded-xl text-xs font-semibold text-cafe-text-2 bg-cafe-card hover:bg-cafe-section transition-colors">
                            <Camera size={13} className="text-cafe-accent" />
                            {entryPreview ? 'เปลี่ยนรูป' : 'แนบรูปใบเสร็จ'}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handlePhotoChange}
                              className="hidden"
                            />
                          </label>
                          {entryPreview && (
                            <div className="relative">
                              <img
                                src={entryPreview}
                                alt="preview"
                                className="w-10 h-10 rounded-lg object-cover border border-cafe-border"
                              />
                              <button
                                onClick={() => { setEntryPhoto(null); setEntryPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                              >
                                <X size={8} className="text-white" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            disabled={saving || !entryAmount}
                            className="flex-1 bg-cafe-accent hover:bg-cafe-accent-dark text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                          </button>
                          <button
                            onClick={closeAdd}
                            className="px-4 bg-cafe-card border border-cafe-border text-cafe-text-2 text-sm font-semibold py-2.5 rounded-xl hover:bg-cafe-section transition-colors cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAdd(ingredient.id)}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-cafe-border text-sm font-semibold text-cafe-accent hover:bg-cafe-section transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                        บันทึกการซื้อ
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── INGREDIENTS TAB ─────────────────────────────────────────────── */}
      {tab === 'ingredients' && (
        <div className="space-y-3 lg:max-w-lg">
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
