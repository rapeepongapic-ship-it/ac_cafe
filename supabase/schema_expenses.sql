-- ──────────────────────────────────────────────────────────────────────────────
-- Ingredients (master list per user — permanent, not re-entered each month)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists ingredients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

alter table ingredients enable row level security;

create policy "users_own_ingredients" on ingredients
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────────
-- Expense entries (each individual purchase — price entered fresh each time)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists expense_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  date          date not null,
  amount        numeric(10,2) not null,
  photo_url     text,
  note          text,
  created_at    timestamptz default now()
);

alter table expense_entries enable row level security;

create policy "users_own_expense_entries" on expense_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────────
-- Storage bucket for receipt/ingredient photos
-- Run this section in Supabase Dashboard → SQL Editor
-- ──────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('expense-photos', 'expense-photos', true)
  on conflict (id) do nothing;

create policy "auth_upload_expense_photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'expense-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "public_read_expense_photos" on storage.objects
  for select using (bucket_id = 'expense-photos');

create policy "auth_delete_expense_photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'expense-photos' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
