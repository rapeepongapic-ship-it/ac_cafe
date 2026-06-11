import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { MenuItem, Platform, DailySale } from '../types'

interface Store {
  menuItems: MenuItem[]
  platforms: Platform[]
  sales: DailySale[]
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
}

const uid = () => crypto.randomUUID()

export const useStore = create<Store>()((set, get) => ({
  menuItems: [],
  platforms: [],
  sales: [],
  shopName: '',
  userId: null,
  loading: false,

  reset: () => set({ menuItems: [], platforms: [], sales: [], shopName: '', userId: null, loading: false }),

  loadData: async (userId, shopName) => {
    set({ loading: true, userId, shopName })
    const [platRes, menuRes, salesRes] = await Promise.all([
      supabase.from('platforms').select('*').eq('user_id', userId),
      supabase.from('menu_items').select('*, platform_prices(*)').eq('user_id', userId),
      supabase.from('daily_sales').select('*, sale_items(*)').eq('user_id', userId),
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

    set({ platforms, menuItems, sales, loading: false })
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
}))
