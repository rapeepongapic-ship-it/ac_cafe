-- ========================================================
-- ยอดดี — Database Schema
-- วิธีใช้: copy ทั้งหมดนี้ไป run ใน Supabase SQL Editor
-- ========================================================

-- ── profiles (ชื่อร้านของแต่ละ user) ────────────────────
CREATE TABLE public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  shop_name  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── platforms ────────────────────────────────────────────
CREATE TABLE public.platforms (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  fee_percent NUMERIC(5,2) DEFAULT 0,
  fee_label   TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── menu_items ───────────────────────────────────────────
CREATE TABLE public.menu_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  cost_per_cup INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── platform_prices (ราคาเมนูแต่ละ platform) ────────────
CREATE TABLE public.platform_prices (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id  UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  platform_id   UUID REFERENCES public.platforms(id) ON DELETE CASCADE NOT NULL,
  price_per_cup INTEGER DEFAULT 0,
  UNIQUE(menu_item_id, platform_id)
);

-- ── daily_sales ──────────────────────────────────────────
CREATE TABLE public.daily_sales (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── sale_items ───────────────────────────────────────────
CREATE TABLE public.sale_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id      UUID REFERENCES public.daily_sales(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  quantity     INTEGER NOT NULL DEFAULT 0
);

-- ── audit_logs (IP + user agent ตอน login) ──────────────
CREATE TABLE public.audit_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════
-- Row Level Security — แต่ละ user เห็นแค่ข้อมูลตัวเอง
-- ════════════════════════════════════════════════════════

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile"
  ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "own platforms"
  ON public.platforms FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own menu_items"
  ON public.menu_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own platform_prices"
  ON public.platform_prices FOR ALL
  USING (menu_item_id IN (SELECT id FROM public.menu_items WHERE user_id = auth.uid()));

CREATE POLICY "own daily_sales"
  ON public.daily_sales FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own sale_items"
  ON public.sale_items FOR ALL
  USING (sale_id IN (SELECT id FROM public.daily_sales WHERE user_id = auth.uid()));

CREATE POLICY "own audit_logs"
  ON public.audit_logs FOR ALL USING (auth.uid() = user_id);
