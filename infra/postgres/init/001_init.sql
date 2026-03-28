create extension if not exists pgcrypto;

create table if not exists teams (
  id text primary key,
  name text not null,
  logo text not null,
  category text not null check (category in ('nacionais', 'internacionais', 'selecoes')),
  league text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  description text not null,
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) check (original_price is null or original_price >= 0),
  image text not null,
  team_id text not null references teams(id),
  sizes text[] not null default '{}',
  in_stock boolean not null default true,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'client')),
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('fixed', 'percentage')),
  value numeric(10,2) not null check (value >= 0),
  min_value numeric(10,2),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  user_id uuid references users(id),
  total numeric(10,2) not null check (total >= 0),
  status text not null check (status in ('aguardando_pagamento', 'pronto_envio', 'enviado', 'entregue')),
  shipping_cep text,
  shipping_street text,
  shipping_number text,
  shipping_complement text,
  shipping_neighborhood text,
  shipping_city text,
  shipping_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_products_team_id on products(team_id);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_items_order_id on order_items(order_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_teams_updated_at on teams;
create trigger trg_teams_updated_at
before update on teams
for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_coupons_updated_at on coupons;
create trigger trg_coupons_updated_at
before update on coupons
for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
before update on orders
for each row execute function set_updated_at();
