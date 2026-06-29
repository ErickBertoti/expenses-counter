alter table public.purchases
  add column if not exists is_disabled boolean not null default false;

create index if not exists purchases_is_disabled_idx
  on public.purchases (is_disabled);

create table if not exists public.monthly_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null,
  description text not null check (char_length(trim(description)) between 1 and 160),
  amount_cents integer not null check (amount_cents > 0),
  start_month date not null,
  end_month date,
  notes text,
  is_disabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint monthly_expenses_start_month_is_month_start
    check (date_trunc('month', start_month::timestamp)::date = start_month),
  constraint monthly_expenses_end_month_is_month_start
    check (end_month is null or date_trunc('month', end_month::timestamp)::date = end_month),
  constraint monthly_expenses_end_not_before_start
    check (end_month is null or end_month >= start_month),
  constraint monthly_expenses_card_fk
    foreign key (card_id, user_id) references public.cards (id, user_id) on delete cascade
);

create index if not exists monthly_expenses_user_id_idx
  on public.monthly_expenses (user_id);

create index if not exists monthly_expenses_card_id_idx
  on public.monthly_expenses (card_id);

create index if not exists monthly_expenses_start_month_idx
  on public.monthly_expenses (start_month);

create index if not exists monthly_expenses_is_disabled_idx
  on public.monthly_expenses (is_disabled);

drop trigger if exists monthly_expenses_set_updated_at on public.monthly_expenses;
create trigger monthly_expenses_set_updated_at
before update on public.monthly_expenses
for each row execute function public.set_updated_at();

alter table public.monthly_expenses enable row level security;

drop policy if exists "monthly_expenses_select_own" on public.monthly_expenses;
create policy "monthly_expenses_select_own"
  on public.monthly_expenses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "monthly_expenses_insert_own" on public.monthly_expenses;
create policy "monthly_expenses_insert_own"
  on public.monthly_expenses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "monthly_expenses_update_own" on public.monthly_expenses;
create policy "monthly_expenses_update_own"
  on public.monthly_expenses
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "monthly_expenses_delete_own" on public.monthly_expenses;
create policy "monthly_expenses_delete_own"
  on public.monthly_expenses
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.monthly_expenses to authenticated;
