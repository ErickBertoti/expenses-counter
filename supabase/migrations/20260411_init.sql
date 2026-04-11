create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cards_id_user_id_unique'
  ) then
    alter table public.cards
      add constraint cards_id_user_id_unique unique (id, user_id);
  end if;
end;
$$;

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null,
  description text not null check (char_length(trim(description)) between 1 and 160),
  purchase_date date not null,
  first_installment_month date not null,
  installment_count integer not null check (installment_count >= 1 and installment_count <= 120),
  total_amount_cents integer not null check (total_amount_cents > 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint first_installment_month_is_month_start
    check (date_trunc('month', first_installment_month::timestamp)::date = first_installment_month),
  constraint first_installment_not_before_purchase_month
    check (first_installment_month >= date_trunc('month', purchase_date::timestamp)::date),
  constraint purchases_card_fk
    foreign key (card_id, user_id) references public.cards (id, user_id) on delete cascade
);

create unique index if not exists cards_default_per_user_idx
  on public.cards (user_id)
  where is_default;

create index if not exists cards_user_id_idx on public.cards (user_id);
create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_card_id_idx on public.purchases (card_id);
create index if not exists purchases_first_installment_month_idx
  on public.purchases (first_installment_month);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cards (user_id, name, is_default)
  values (new.id, 'Cartão principal', true);

  return new;
end;
$$;

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

drop trigger if exists purchases_set_updated_at on public.purchases;
create trigger purchases_set_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.cards enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "cards_select_own" on public.cards;
create policy "cards_select_own"
  on public.cards
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "cards_insert_own" on public.cards;
create policy "cards_insert_own"
  on public.cards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "cards_update_own" on public.cards;
create policy "cards_update_own"
  on public.cards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cards_delete_own" on public.cards;
create policy "cards_delete_own"
  on public.cards
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "purchases_insert_own" on public.purchases;
create policy "purchases_insert_own"
  on public.purchases
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "purchases_update_own" on public.purchases;
create policy "purchases_update_own"
  on public.purchases
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "purchases_delete_own" on public.purchases;
create policy "purchases_delete_own"
  on public.purchases
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.cards to authenticated;
grant select, insert, update, delete on public.purchases to authenticated;
