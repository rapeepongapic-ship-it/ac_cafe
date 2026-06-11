export interface MenuItemPlatformPrice {
  platformId: string;
  pricePerCup: number;
}

export interface MenuItem {
  id: string;
  name: string;
  costPerCup: number;
  platformPrices: MenuItemPlatformPrice[]; // ราคาขายในแต่ละ platform
}

export interface Platform {
  id: string;
  name: string;
  feePercent: number;
  feeLabel: string;
  // ไม่มี menuPrices แล้ว — ย้ายไปอยู่ใน MenuItem แทน
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

export interface Ingredient {
  id: string;
  name: string;
}

export interface ExpenseEntry {
  id: string;
  ingredientId: string;
  date: string; // "YYYY-MM-DD"
  amount: number;
  photoUrl: string | null;
  note: string | null;
  sessionId: string | null;
}

export interface ExpenseSessionItem {
  id: string;
  ingredientId: string;
  amount: number;
}

export interface ExpenseSession {
  id: string;
  date: string; // "YYYY-MM-DD"
  photoUrl: string | null;
  note: string | null;
  items: ExpenseSessionItem[];
}
