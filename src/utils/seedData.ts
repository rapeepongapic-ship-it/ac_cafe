import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'

export async function seedIfEmpty(userId: string) {
  const { menuItems, platforms, loadData, shopName } = useStore.getState()
  if (platforms.length > 0 || menuItems.length > 0) return

  const P_LINE     = crypto.randomUUID()
  const P_LINE_MAN = crypto.randomUUID()

  await supabase.from('platforms').insert([
    { id: P_LINE,     user_id: userId, name: 'Line Official', fee_percent: 0,  fee_label: 'หักส่วนลด'       },
    { id: P_LINE_MAN, user_id: userId, name: 'Lineman',        fee_percent: 30, fee_label: 'GP+Ad+ส่วนลดแอพ' },
  ])

  const menus = [
    { name: 'โกโก้โอริโอนมสด',     cost: 25, linePrice: 60, linemanPrice: 70 },
    { name: 'โอวัลตินเย็น',         cost: 25, linePrice: 45, linemanPrice: 60 },
    { name: 'นมชมพู',               cost: 25, linePrice: 45, linemanPrice: 60 },
    { name: 'นมสดสตอเบอร์รี่',      cost: 30, linePrice: 60, linemanPrice: 70 },
    { name: 'พุดดิ้งนมสตอเบอร์รี่', cost: 35, linePrice: 65, linemanPrice: 75 },
    { name: 'มัทฉะลาเต้',           cost: 40, linePrice: 75, linemanPrice: 85 },
    { name: 'มัทฉะสตอเบอร์รี่',     cost: 45, linePrice: 80, linemanPrice: 90 },
    { name: 'พุดดิ้งนม',            cost: 5,  linePrice: 10, linemanPrice: 10 },
  ]

  const menuRows = menus.map(m => ({ id: crypto.randomUUID(), user_id: userId, name: m.name, cost_per_cup: m.cost }))
  await supabase.from('menu_items').insert(menuRows)
  await supabase.from('platform_prices').insert(
    menuRows.flatMap((row, i) => [
      { menu_item_id: row.id, platform_id: P_LINE,     price_per_cup: menus[i].linePrice    },
      { menu_item_id: row.id, platform_id: P_LINE_MAN, price_per_cup: menus[i].linemanPrice },
    ])
  )

  await loadData(userId, shopName)
}
