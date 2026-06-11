import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { MenuItem, Platform, DailySale, Ingredient, ExpenseEntry } from '../types'

interface Store {
  menuItems: MenuItem[]
  platforms: Platform[]
  sales: DailySale[]
  ingredients: Ingredient[]
  expenseEntries: ExpenseEntry[]
  shopName: string
  userId: string | null
  loading: boolean

  loadData: (userId: string, shopName: string) => Promise<void>
  reset: () => void

  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>
  updateMenuItem: (id: string, item: Omit<MenuItem, 'id'>) => Promise<void>
  deleteMenuItem: (id: string) => Promise<void>

  addPlatform: (p: Omit<Platform, 'id'>) => Promise<void>
  updatePlatform: (id: string, p: Omit<Platform, 'id'>) => Promise<void>
  deletePlatform: (id: string) => Promise<void>

  addSale: (sale: Omit<DailySale, 'id'>) => Promise<void>
  updateSale: (id: string, sale: Omit<DailySale, 'id'>) => Promise<void>
  deleteSale: (id: string) => Promise<void>

  addIngredient: (name: string) => Promise<void>
  deleteIngredient: (id: string) => Promise<void>

  addExpenseEntry: (entry: Omit<ExpenseEntry, 'id'>) => Promise<void>
  deleteExpenseEntry: (id: string) => Promise<void>
}

const uid = () => crypto.randomUUID()

export const useStore = create<Store>()((set, get) => ({
  menuItems: [],
  platforms: [],
  sales: [],
  ingredients: [],
  expenseEntries: [],
  shopName: '',
  userId: null,
  loading: false,

  reset: () => set({
    menuItems: [], platforms: [], sales: [],
    ingredients: [], expenseEntries: [],
    shopName: '', userId: null, loading: false,
  }),

  loadData: async (userId, shopName) => {
    set({ loading: true, userId, shopName })
    const [platRes, menuRes, salesRes, ingRes, expRes] = await Promise.all([
      supabase.from('platforms').select('*').eq('user_id', userId),
      supabase.from('menu_items').select('*, platform_prices(*)').eq('user_id', userId),
      supabase.from('daily_sales').select('*, sale_items(*)').eq('user_id', userId),
      supabase.from('ingredients').select('*').eq('user_id', userId).order('name'),
      supabase.from('expense_entries').select('*').eq('user_id', userId).order('date', { ascending: false }),
    ])

    const platforms: Platform[] = (platRes.data ?? []).map(p => ({
      id: p.id, name: p.name, feePercent: p.fee_percent, feeLabel: p.fee_label,
    }))

    const menuItems: MenuItem[] = (menuRes.data ?? []).map((m: any) => ({
      id: m.id, name: m.name, costPerCup: m.cost_per_cup,
      platformPrices: (m.platform_prices ?? []).map((pp: any) => ({
        platformId: pp.platform_id, pricePerCup: pp.price_per_cup,
      })),
    }))

    const sales: DailySale[] = (salesRes.data ?? []).map((s: any) => ({
      id: s.id, date: s.date, platformId: s.platform_id,
      items: (s.sale_items ?? []).map((si: any) => ({
        menuItemId: si.menu_item_id, quantity: si.quantity,
      })),
    }))

    const ingredients: Ingredient[] = (ingRes.data ?? []).map((i: any) => ({
      id: i.id, name: i.name,
    }))

    const expenseEntries: ExpenseEntry[] = (expRes.data ?? []).map((e: any) => ({
      id: e.id, ingredientId: e.ingredient_id, date: e.date,
      amount: Number(e.amount), photoUrl: e.photo_url ?? null, note: e.note ?? null,
    }))

    set({ platforms, menuItems, sales, ingredients, expenseEntries, loading: false })
  },

  // ── MenuItem ──────────────────────────────────────────────────────────────

  addMenuItem: async (item) => {
    const { userId } = get()
    if (!userId) return
    const id = uid()
    set(s => ({ menuItems: [...s.menuItems, { ...item, id }] }))
    await supabase.from('menu_items').insert({ id, user_id: userId, name: item.name, cost_per_cup: item.costPerCup })
    if (item.platformPrices.length > 0) {
      await supabase.from('platform_prices').insert(
        item.platformPrices.map(pp => ({ menu_item_id: id, platform_id: pp.platformId, price_per_cup: pp.pricePerCup }))
      )
    }
  },

  updateMenuItem: async (id, item) => {
    set(s => ({ menuItems: s.menuItems.map(m => m.id === id ? { ...item, id } : m) }))
    await supabase.from('menu_items').update({ name: item.name, cost_per_cup: item.costPerCup }).eq('id', id)
    await supabase.from('platform_prices').delete().eq('menu_item_id', id)
    if (item.platformPrices.length > 0) {
      await supabase.from('platform_prices').insert(
        item.platformPrices.map(pp => ({ menu_item_id: id, platform_id: pp.platformId, price_per_cup: pp.pricePerCup }))
      )
    }
  },

  deleteMenuItem: async (id) => {
    set(s => ({ menuItems: s.menuItems.filter(m => m.id !== id) }))
    await supabase.from('menu_items').delete().eq('id', id)
  },

  // ── Platform ──────────────────────────────────────────────────────────────

  addPlatform: async (p) => {
    const { userId } = get()
    if (!userId) return
    const id = uid()
    set(s => ({ platforms: [...s.platforms, { ...p, id }] }))
    await supabase.from('platforms').insert({ id, user_id: userId, name: p.name, fee_percent: p.feePercent, fee_label: p.feeLabel })
  },

  updatePlatform: async (id, p) => {
    set(s => ({ platforms: s.platforms.map(pl => pl.id === id ? { ...p, id } : pl) }))
    await supabase.from('platforms').update({ name: p.name, fee_percent: p.feePercent, fee_label: p.feeLabel }).eq('id', id)
  },

  deletePlatform: async (id) => {
    set(s => ({ platforms: s.platforms.filter(p => p.id !== id) }))
    await supabase.from('platforms').delete().eq('id', id)
  },

  // ── Sale ──────────────────────────────────────────────────────────────────

  addSale: async (sale) => {
    const { userId } = get()
    if (!userId) return
    const id = uid()
    set(s => ({ sales: [...s.sales, { ...sale, id }] }))
    await supabase.from('daily_sales').insert({ id, user_id: userId, date: sale.date, platform_id: sale.platformId })
    if (sale.items.length > 0) {
      await supabase.from('sale_items').insert(
        sale.items.map(i => ({ sale_id: id, menu_item_id: i.menuItemId, quantity: i.quantity }))
      )
    }
  },

  updateSale: async (id, sale) => {
    set(s => ({ sales: s.sales.map(x => x.id === id ? { ...sale, id } : x) }))
    await supabase.from('daily_sales').update({ date: sale.date, platform_id: sale.platformId }).eq('id', id)
    await supabase.from('sale_items').delete().eq('sale_id', id)
    if (sale.items.length > 0) {
      await supabase.from('sale_items').insert(
        sale.items.map(i => ({ sale_id: id, menu_item_id: i.menuItemId, quantity: i.quantity }))
      )
    }
  },

  deleteSale: async (id) => {
    set(s => ({ sales: s.sales.filter(x => x.id !== id) }))
    await supabase.from('daily_sales').delete().eq('id', id)
  },

  // ── Ingredient ────────────────────────────────────────────────────────────

  addIngredient: async (name) => {
    const { userId } = get()
    if (!userId) return
    const id = uid()
    set(s => ({ ingredients: [...s.ingredients, { id, name }].sort((a, b) => a.name.localeCompare(b.name, 'th')) }))
    await supabase.from('ingredients').insert({ id, user_id: userId, name })
  },

  deleteIngredient: async (id) => {
    set(s => ({ ingredients: s.ingredients.filter(i => i.id !== id) }))
    await supabase.from('ingredients').delete().eq('id', id)
  },

  // ── ExpenseEntry ──────────────────────────────────────────────────────────

  addExpenseEntry: async (entry) => {
    const { userId } = get()
    if (!userId) return
    const id = uid()
    const newEntry: ExpenseEntry = { ...entry, id }
    set(s => ({ expenseEntries: [newEntry, ...s.expenseEntries] }))
    await supabase.from('expense_entries').insert({
      id,
      user_id: userId,
      ingredient_id: entry.ingredientId,
      date: entry.date,
      amount: entry.amount,
      photo_url: entry.photoUrl,
      note: entry.note,
    })
  },

  deleteExpenseEntry: async (id) => {
    const entry = get().expenseEntries.find(e => e.id === id)
    set(s => ({ expenseEntries: s.expenseEntries.filter(e => e.id !== id) }))
    await supabase.from('expense_entries').delete().eq('id', id)
    if (entry?.photoUrl) {
      const path = entry.photoUrl.split('/expense-photos/')[1]
      if (path) await supabase.storage.from('expense-photos').remove([path])
    }
  },
}))
