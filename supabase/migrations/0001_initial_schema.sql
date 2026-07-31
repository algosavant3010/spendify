-- ============================================================
-- 0001_initial_schema.sql
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. ENUMS
do $$
begin
  create type public.transaction_type as enum ('income', 'expense');
exception
  when duplicate_object then null;
end
$$;

-- 3. TABLES
create table if not exists public.categories (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  name text not null,
  color text default '#6366f1',
  icon text default 'tag',
  type public.transaction_type not null,
  created_at timestamptz default now(),
  constraint categories_pkey primary key (id),
  constraint categories_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);

create table if not exists public.transactions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  category_id uuid,
  title text not null,
  amount numeric(12, 2) not null,
  type public.transaction_type not null,
  description text,
  receipt_url text,
  date date default current_date not null,
  is_recurring boolean default false,
  recurring_frequency text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint transactions_category_id_fkey foreign key (category_id) references public.categories(id) on delete set null
);

create table if not exists public.budgets (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  category_id uuid,
  amount numeric(12, 2) not null,
  period text default 'monthly' not null,
  alert_threshold numeric(3, 2) default 0.80,
  start_date date not null,
  end_date date,
  created_at timestamptz default now(),
  constraint budgets_pkey primary key (id),
  constraint budgets_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint budgets_category_id_fkey foreign key (category_id) references public.categories(id) on delete cascade
);

create table if not exists public.savings_goals (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  target_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint savings_goals_pkey primary key (id)
);

create table if not exists public.expense_splits (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  title text not null,
  total_amount numeric not null,
  split_with jsonb default '[]'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  settled boolean default false,
  constraint expense_splits_pkey primary key (id)
);

create table if not exists public.profiles (
  id uuid not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade
);

-- 4. INDEXES
create index if not exists categories_user_type_idx on public.categories (user_id, type);
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_user_type_date_idx on public.transactions (user_id, type, date desc);
create index if not exists transactions_user_category_date_idx on public.transactions (user_id, category_id, date desc);
create index if not exists transactions_user_recurring_idx on public.transactions (user_id, is_recurring) where is_recurring = true;
create index if not exists budgets_user_period_idx on public.budgets (user_id, period);
create index if not exists budgets_user_category_idx on public.budgets (user_id, category_id);
create index if not exists savings_goals_user_created_idx on public.savings_goals (user_id, created_at desc);
create index if not exists expense_splits_user_created_idx on public.expense_splits (user_id, created_at desc);

-- 5. ENABLE ROW LEVEL SECURITY
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.expense_splits enable row level security;
alter table public.profiles enable row level security;

-- 6. RLS POLICIES
create policy "Users can view own categories" on public.categories for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own categories" on public.categories for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own categories" on public.categories for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own categories" on public.categories for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view own transactions" on public.transactions for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view own budgets" on public.budgets for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own budgets" on public.budgets for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view their own savings goals" on public.savings_goals for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own savings goals" on public.savings_goals for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own savings goals" on public.savings_goals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own savings goals" on public.savings_goals for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view own expense splits" on public.expense_splits for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own expense splits" on public.expense_splits for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own expense splits" on public.expense_splits for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own expense splits" on public.expense_splits for delete to authenticated using (auth.uid() = user_id);

create policy "Users can view their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can create their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can delete their own profile" on public.profiles for delete to authenticated using (auth.uid() = id);

-- 7. STORAGE BUCKETS
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 8. STORAGE POLICIES
create policy "Users can upload own receipts" on storage.objects for insert to authenticated
with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view own receipts" on storage.objects for select to authenticated
using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update own receipts" on storage.objects for update to authenticated
using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own receipts" on storage.objects for delete to authenticated
using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- 9. FUNCTIONS / TRIGGERS
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, color, icon, type) values
    (new.id, 'Salary', '#10b981', 'briefcase', 'income'),
    (new.id, 'Investment', '#3b82f6', 'trending-up', 'income'),
    (new.id, 'Food & Dining', '#ef4444', 'utensils', 'expense'),
    (new.id, 'Transportation', '#f59e0b', 'car', 'expense'),
    (new.id, 'Shopping', '#ec4899', 'shopping-bag', 'expense'),
    (new.id, 'Entertainment', '#8b5cf6', 'film', 'expense'),
    (new.id, 'Bills & Utilities', '#06b6d4', 'receipt', 'expense'),
    (new.id, 'Healthcare', '#14b8a6', 'heart', 'expense');
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger update_transactions_updated_at before update on public.transactions
for each row execute function public.update_updated_at_column();
create trigger update_savings_goals_updated_at before update on public.savings_goals
for each row execute function public.update_updated_at_column();
create trigger update_expense_splits_updated_at before update on public.expense_splits
for each row execute function public.update_updated_at_column();
create trigger update_profiles_updated_at before update on public.profiles
for each row execute function public.update_profile_updated_at();
create trigger on_auth_user_created_categories after insert on auth.users
for each row execute function public.create_default_categories();
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.handle_new_user_profile();

revoke all on function public.create_default_categories() from public, anon, authenticated;
revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;
revoke all on function public.update_profile_updated_at() from public, anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- 10. REALTIME
-- none
