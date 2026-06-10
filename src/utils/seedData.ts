import { useStore } from '../store/useStore';

const P_LINE = 'seed_line_oa';
const P_LINE_MAN = 'seed_lineman';

export function seedIfEmpty() {
  const { menuItems, platforms, addMenuItem, addPlatform } = useStore.getState();

  if (platforms.length > 0 || menuItems.length > 0) return;

  // ─── Platforms ───────────────────────────────────────────────────────────────
  // inject with fixed IDs so menuItems can reference them
  useStore.setState((s) => ({
    platforms: [
      { id: P_LINE,     name: 'Line Official', feePercent: 0,  feeLabel: 'หักส่วนลด'         },
      { id: P_LINE_MAN, name: 'Lineman',        feePercent: 30, feeLabel: 'GP+Ad+ส่วนลดแอพ'   },
    ],
  }));

  // ─── Menu items ───────────────────────────────────────────────────────────────
  const uid = () => Math.random().toString(36).slice(2, 10);

  const menus: Array<{ name: string; cost: number; linePrice: number; linemanPrice: number }> = [
    { name: 'โกโก้โอริโอนมสด',    cost: 25, linePrice: 60, linemanPrice: 70 },
    { name: 'โอวัลตินเย็น',        cost: 25, linePrice: 45, linemanPrice: 60 },
    { name: 'นมชมพู',              cost: 25, linePrice: 45, linemanPrice: 60 },
    { name: 'นมสดสตอเบอร์รี่',     cost: 30, linePrice: 60, linemanPrice: 70 },
    { name: 'พุดดิ้งนมสตอเบอร์รี่',cost: 35, linePrice: 65, linemanPrice: 75 },
    { name: 'มัทฉะลาเต้',          cost: 40, linePrice: 75, linemanPrice: 85 },
    { name: 'มัทฉะสตอเบอร์รี่',    cost: 45, linePrice: 80, linemanPrice: 90 },
    { name: 'พุดดิ้งนม',           cost: 5,  linePrice: 10, linemanPrice: 10 },
  ];

  useStore.setState((s) => ({
    menuItems: menus.map((m) => ({
      id: uid(),
      name: m.name,
      costPerCup: m.cost,
      platformPrices: [
        { platformId: P_LINE,     pricePerCup: m.linePrice     },
        { platformId: P_LINE_MAN, pricePerCup: m.linemanPrice  },
      ],
    })),
  }));
}
