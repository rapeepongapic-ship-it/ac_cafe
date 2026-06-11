import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MenuItem, Platform, DailySale } from '../types';

interface Store {
  menuItems: MenuItem[];
  platforms: Platform[];
  sales: DailySale[];

  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Omit<MenuItem, 'id'>) => void;
  deleteMenuItem: (id: string) => void;

  addPlatform: (platform: Omit<Platform, 'id'>) => void;
  updatePlatform: (id: string, platform: Omit<Platform, 'id'>) => void;
  deletePlatform: (id: string) => void;

  addSale: (sale: Omit<DailySale, 'id'>) => void;
  updateSale: (id: string, sale: Omit<DailySale, 'id'>) => void;
  deleteSale: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<Store>()(
  persist(
    (set) => ({
      menuItems: [],
      platforms: [],
      sales: [],

      addMenuItem: (item) =>
        set((s) => ({ menuItems: [...s.menuItems, { ...item, id: uid() }] })),
      updateMenuItem: (id, item) =>
        set((s) => ({
          menuItems: s.menuItems.map((m) => (m.id === id ? { ...item, id } : m)),
        })),
      deleteMenuItem: (id) =>
        set((s) => ({ menuItems: s.menuItems.filter((m) => m.id !== id) })),

      addPlatform: (platform) =>
        set((s) => ({ platforms: [...s.platforms, { ...platform, id: uid() }] })),
      updatePlatform: (id, platform) =>
        set((s) => ({
          platforms: s.platforms.map((p) => (p.id === id ? { ...platform, id } : p)),
        })),
      deletePlatform: (id) =>
        set((s) => ({ platforms: s.platforms.filter((p) => p.id !== id) })),

      addSale: (sale) =>
        set((s) => ({ sales: [...s.sales, { ...sale, id: uid() }] })),
      updateSale: (id, sale) =>
        set((s) => ({
          sales: s.sales.map((x) => (x.id === id ? { ...sale, id } : x)),
        })),
      deleteSale: (id) =>
        set((s) => ({ sales: s.sales.filter((x) => x.id !== id) })),
    }),
    {
      name: 'ac-cafe-store-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
