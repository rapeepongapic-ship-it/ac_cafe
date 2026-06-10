import { DailySale, MenuItem, Platform } from '../types';

export interface MenuRowData {
  menuItemId: string;
  name: string;
  pricePerCup: number;
  costPerCup: number;
  quantity: number;
  revenue: number;
  costDeduct: number;
  feeDeduct: number;
  profit: number;
}

export interface PlatformSummary {
  platform: Platform;
  rows: MenuRowData[];
  totalQty: number;
  totalRevenue: number;
  totalCost: number;
  totalFee: number;
  totalProfit: number;
}

export function calcPlatformSummary(
  sales: DailySale[],
  platform: Platform,
  menuItems: MenuItem[]
): PlatformSummary {
  // รวม qty ต่อ menuItemId สำหรับ platform นี้
  const qtys: Record<string, number> = {};
  sales
    .filter((s) => s.platformId === platform.id)
    .forEach((s) =>
      s.items.forEach((item) => {
        qtys[item.menuItemId] = (qtys[item.menuItemId] ?? 0) + item.quantity;
      })
    );

  const rows: MenuRowData[] = [];
  for (const [menuItemId, quantity] of Object.entries(qtys)) {
    if (quantity === 0) continue;
    const menuItem = menuItems.find((m) => m.id === menuItemId);
    if (!menuItem) continue;

    // ราคาขายอ่านจาก menuItem.platformPrices
    const platformPrice = menuItem.platformPrices.find(
      (p) => p.platformId === platform.id
    );
    const pricePerCup = platformPrice?.pricePerCup ?? 0;
    const revenue = quantity * pricePerCup;
    const costDeduct = quantity * menuItem.costPerCup;
    const feeDeduct = Math.round(revenue * (platform.feePercent / 100));
    const profit = revenue - costDeduct - feeDeduct;

    rows.push({
      menuItemId,
      name: menuItem.name,
      pricePerCup,
      costPerCup: menuItem.costPerCup,
      quantity,
      revenue,
      costDeduct,
      feeDeduct,
      profit,
    });
  }

  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.costDeduct, 0);
  const totalFee = rows.reduce((s, r) => s + r.feeDeduct, 0);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);

  return { platform, rows, totalQty, totalRevenue, totalCost, totalFee, totalProfit };
}
