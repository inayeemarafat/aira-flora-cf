create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null,
  price integer not null,
  compare_price integer,
  stock integer not null default 0,
  sizes jsonb not null default '["S","M","L","XL","XXL"]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  image text not null,
  gallery jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_flash_sale boolean not null default false,
  flash_sale_price integer,
  flash_ends_at timestamptz,
  rating numeric(2,1) not null default 4.8,
  reviews_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  customer_name text not null,
  address text not null,
  shipping_area text not null,
  mobile text not null,
  email text,
  remarks text,
  total_amount integer not null,
  subtotal integer not null default 0,
  shipping_cost integer not null default 0,
  discount_amount integer not null default 0,
  coupon_code text,
  status text not null default 'pending' check (status in ('pending','processing','on_the_way','delivered','cancelled')),
  payment_method text not null default 'cod',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  image text,
  size text not null,
  color text,
  quantity integer not null default 1,
  price integer not null
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent','fixed')),
  value integer not null,
  min_order integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  used_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  author text not null,
  rating integer not null,
  comment text not null,
  created_at timestamptz not null default now()
);

create table public.visits (
  day date primary key,
  count integer not null default 0
);

grant select on public.products to anon;
grant select on public.product_reviews to anon;
grant select on public.coupons to anon;
grant insert on public.newsletter_subscribers to anon;
grant all on public.products to service_role;
grant all on public.orders to service_role;
grant all on public.order_items to service_role;
grant all on public.coupons to service_role;
grant all on public.newsletter_subscribers to service_role;
grant all on public.product_reviews to service_role;
grant all on public.visits to service_role;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.product_reviews enable row level security;
alter table public.visits enable row level security;

create policy "Public can browse products" on public.products for select to anon using (true);
create policy "Public can read reviews" on public.product_reviews for select to anon using (true);
create policy "Public can validate coupons" on public.coupons for select to anon using (true);
create policy "Public can subscribe" on public.newsletter_subscribers for insert to anon with check (true);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();