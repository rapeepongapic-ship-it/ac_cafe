export interface MenuItem {
  id: string;
  name: string;
  costPerCup: number;
}

export interface PlatformMenuPrice {
  menuItemId: string;
  pricePerCup: number;
}

export interface Platform {
  id: string;
  name: string;
  feePercent: number;
  feeLabel: string;
  menuPrices: PlatformMenuPrice[];
}

export interface SaleItem {
  menuItemId: string;
  quantity: number;
}

export interface DailySale {
  id: string;
  date: string; // "YYYY-MM-DD"
  platformId: string;
  items: SaleItem[];
}
