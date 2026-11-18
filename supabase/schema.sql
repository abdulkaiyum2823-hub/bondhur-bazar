-- =============================================================================
-- বন্ধুর বাজার (Bondhur Bazar) – ডাটাবেস স্কিমা + নিরাপত্তা নিয়ম (Supabase)
-- -----------------------------------------------------------------------------
-- কীভাবে চালাবেন: Supabase → SQL Editor → New query → এই ফাইলের সব লেখা বসান → Run।
-- এরপর seed.sql, তারপর rls_test.sql চালান। ফাইলটি আবার চালালেও ডেটা মুছবে না।
--
-- নিরাপত্তার মূল নিয়ম:
--  • সব টেবিলে RLS (Row Level Security) চালু।
--  • সাধারণ ক্রেতা (anon) শুধু পণ্য/ক্যাটাগরি/স্লাইডার/FAQ/সেটিংস পড়তে পারে।
--  • অর্ডার টেবিলে ক্রেতা সরাসরি কিছু পড়তে বা লিখতে পারে না। অর্ডার তৈরি হয় শুধু
--    place_order() ফাংশনে, যেটি দাম নিজে ডাটাবেস থেকে হিসাব করে (ক্রেতার পাঠানো দাম ধরা হয় না)।
--  • অর্ডার ট্র্যাকিং শুধু track_order() ফাংশনে, Order ID + ফোন নম্বর দুটো মিললে।
--  • অ্যাডমিন = শুধু public.admins টেবিলের তালিকায় থাকা ইমেইল। ফ্রন্টএন্ডে ইমেইল লুকানো নয়,
--    প্রতিটি নিয়ম ডাটাবেসে is_admin() দিয়ে যাচাই হয়।
-- =============================================================================

-- ---------- অ্যাডমিন তালিকা ----------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
insert into public.admins (email) values ('akabdulkaiyumofficial@gmail.com')
  on conflict do nothing;

-- is_admin(): লগইন করা ব্যক্তির ইমেইল তালিকায় আছে কি না
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(auth.jwt() ->> 'aud', '') = 'authenticated'
     and exists (
       select 1 from public.admins a
       where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
     );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.bb_norm_phone(p text)
returns text language sql immutable as $$
  select regexp_replace(
           regexp_replace(translate(coalesce(p, ''), '০১২৩৪৫৬৭৮৯', '0123456789'), '[\s\-]', '', 'g'),
           '^\+?88', '');
$$;

create or replace function public.bb_sizes_valid(s numeric[])
returns boolean language sql immutable as $$
  select s is not null and cardinality(s) between 1 and 10
     and not exists (select 1 from unnest(s) x where x is null or x <= 0 or x > 1000);
$$;

-- ---------- টেবিল ----------
create table if not exists public.districts (
  name text primary key,
  sort int not null default 0
);

create table if not exists public.categories (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,40}$'),
  name text not null check (length(name) between 1 and 80),
  icon text not null default '',
  description text not null default '',
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.products (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  name text not null check (length(name) between 1 and 150),
  category text not null references public.categories (id) on update cascade on delete restrict,
  price numeric(10,2) not null check (price >= 0),                 -- প্রতি ১ ইউনিট (কেজি)
  offer_price numeric(10,2) check (offer_price is null or (offer_price >= 0 and offer_price < price)),
  unit text not null default 'কেজি',
  sizes numeric[] not null default '{1}' check (public.bb_sizes_valid(sizes)),
  image text not null default '',
  short text not null default '',
  description text not null default '',
  features text[] not null default '{}',
  popular boolean not null default false,
  is_new boolean not null default false,
  in_stock boolean not null default true,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  image text not null default '',
  mobile_image text not null default '',
  title text not null default '',
  subtitle text not null default '',
  button_text text not null default '',
  button_link text not null default 'shop.html',
  theme text not null default 'green',
  art text not null default '',
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(question) between 1 and 300),
  answer text not null check (length(answer) between 1 and 2000),
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists public.settings (
  key text primary key check (length(key) between 1 and 60),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (length(name) between 2 and 100),
  phone text not null check (phone ~ '^01[3-9][0-9]{8}$'),
  district text not null,
  upazila text not null check (length(upazila) between 2 and 100),
  address text not null check (length(address) between 10 and 400),
  note text not null default '' check (length(note) <= 500),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery numeric(12,2) not null check (delivery >= 0),
  delivery_pending boolean not null default false,
  total numeric(12,2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('cod', 'bkash')),
  bkash_txn text,
  bkash_sender text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'pending_verification', 'paid', 'rejected', 'refunded')),
  order_status text not null default 'pending'
    check (order_status in ('pending', 'payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  check (payment_method <> 'bkash' or (bkash_txn ~ '^[A-Z0-9]{6,20}$' and bkash_sender ~ '^01[3-9][0-9]{8}$'))
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (phone, created_at desc);

-- ট্র্যাকিংয়ে ভুল চেষ্টার হিসাব (শুধু ফাংশন ব্যবহার করে; কেউ সরাসরি পড়তে পারে না)
create table if not exists public.track_attempts (
  id bigint generated always as identity primary key,
  phone text not null,
  at timestamptz not null default now()
);
create index if not exists track_attempts_idx on public.track_attempts (phone, at desc);

drop trigger if exists products_updated on public.products;
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();
drop trigger if exists orders_updated on public.orders;
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
drop trigger if exists settings_updated on public.settings;
create trigger settings_updated before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------- অর্ডার তৈরি (দাম সার্ভারে হিসাব) ----------
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text; v_phone text; v_district text; v_upazila text; v_address text; v_note text;
  v_method text; v_txn text; v_sender text;
  v_in jsonb; v_elem jsonb; v_items jsonb := '[]'::jsonb; v_p public.products%rowtype;
  v_size numeric; v_qty int; v_unit numeric; v_line numeric;
  v_sub numeric := 0; v_del numeric := 0; v_pending boolean := false;
  v_set jsonb; v_pay jsonb; v_charge numeric; v_free numeric;
  v_oid text; v_rand bytea; v_try int := 0; v_pstat text; v_ostat text; v_now timestamptz := now();
  c_alpha constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then raise exception 'bb:invalid'; end if;
  if coalesce(payload ->> 'website', '') <> '' then raise exception 'bb:invalid'; end if;  -- বট ফাঁদ

  v_name    := btrim(coalesce(payload ->> 'name', ''));
  v_phone   := public.bb_norm_phone(payload ->> 'phone');
  v_district:= btrim(coalesce(payload ->> 'district', ''));
  v_upazila := btrim(coalesce(payload ->> 'upazila', ''));
  v_address := btrim(coalesce(payload ->> 'address', ''));
  v_note    := btrim(coalesce(payload ->> 'note', ''));
  v_method  := coalesce(payload ->> 'payment_method', '');
  v_txn     := upper(regexp_replace(coalesce(payload ->> 'bkash_txn', ''), '\s', '', 'g'));
  v_sender  := public.bb_norm_phone(payload ->> 'bkash_sender');

  if length(v_name) not between 2 and 100 then raise exception 'bb:invalid_name'; end if;
  if v_phone !~ '^01[3-9][0-9]{8}$' then raise exception 'bb:invalid_phone'; end if;
  if not exists (select 1 from public.districts d where d.name = v_district) then raise exception 'bb:invalid_district'; end if;
  if length(v_upazila) not between 2 and 100 then raise exception 'bb:invalid_upazila'; end if;
  if length(v_address) not between 10 and 400 then raise exception 'bb:invalid_address'; end if;
  if length(v_note) > 500 then raise exception 'bb:invalid_note'; end if;

  -- পণ্য: শুধু id, size, qty নেওয়া হয়; দাম/নাম ডাটাবেস থেকে
  v_in := payload -> 'items';
  if v_in is null or jsonb_typeof(v_in) <> 'array' or jsonb_array_length(v_in) not between 1 and 30 then
    raise exception 'bb:invalid_items';
  end if;
  for v_elem in select * from jsonb_array_elements(v_in) loop
    begin
      v_size := (v_elem ->> 'size')::numeric;
      v_qty  := (v_elem ->> 'qty')::int;
    exception when others then
      raise exception 'bb:invalid_items';
    end;
    if v_qty is null or v_qty not between 1 and 99 then raise exception 'bb:invalid_items'; end if;
    select * into v_p from public.products p where p.id = (v_elem ->> 'id') and p.active;
    if not found then raise exception 'bb:product_missing'; end if;
    if not v_p.in_stock then raise exception 'bb:out_of_stock:%', v_p.name; end if;
    if v_size is null or not (v_p.sizes @> array[v_size]) then raise exception 'bb:invalid_size:%', v_p.name; end if;
    v_unit := round(coalesce(v_p.offer_price, v_p.price) * v_size);
    v_line := v_unit * v_qty;
    v_sub  := v_sub + v_line;
    v_items := v_items || jsonb_build_object(
      'id', v_p.id, 'name', v_p.name, 'size', v_size, 'unit', v_p.unit,
      'qty', v_qty, 'unit_price', v_unit, 'total', v_line);
  end loop;

  -- ডেলিভারি চার্জ (অ্যাডমিন সেট না করলে "পরে জানানো হবে")
  select s.value into v_set from public.settings s where s.key = 'delivery';
  if v_set is null then
    v_pending := true;
  else
    v_charge := nullif(v_set -> 'district_charges' ->> v_district, '')::numeric;
    if v_charge is null then
      if v_district = coalesce(v_set ->> 'inside_district', '') then
        v_charge := nullif(v_set ->> 'inside_charge', '')::numeric;
      else
        v_charge := nullif(v_set ->> 'outside_charge', '')::numeric;
      end if;
    end if;
    v_free := coalesce(nullif(v_set ->> 'free_above', '')::numeric, 0);
    if v_charge is null then v_pending := true;
    elsif v_free > 0 and v_sub >= v_free then v_del := 0;
    else v_del := v_charge;
    end if;
  end if;

  -- পেমেন্ট
  select s.value into v_pay from public.settings s where s.key = 'payment';
  if v_method = 'cod' then
    if not coalesce((v_pay ->> 'cod_enabled')::boolean, true) then raise exception 'bb:payment_disabled'; end if;
    v_pstat := 'pending'; v_ostat := 'pending';
  elsif v_method = 'bkash' then
    if not coalesce((v_pay ->> 'bkash_enabled')::boolean, true) then raise exception 'bb:payment_disabled'; end if;
    if v_pending then raise exception 'bb:delivery_not_set'; end if;
    if v_txn !~ '^[A-Z0-9]{6,20}$' then raise exception 'bb:invalid_txn'; end if;
    if v_sender !~ '^01[3-9][0-9]{8}$' then raise exception 'bb:invalid_sender'; end if;
    v_pstat := 'pending_verification'; v_ostat := 'payment_pending';
  else
    raise exception 'bb:invalid_payment';
  end if;
  if v_method <> 'bkash' then v_txn := null; v_sender := null; end if;

  -- ক্রেতা যে মোট টাকা দেখে অর্ডার করছে (bKash-এ যে টাকা পাঠাবে), সার্ভারের হিসাবের সঙ্গে না মিললে থামো
  if payload ? 'expected_total' then
    begin
      if (payload ->> 'expected_total')::numeric <> v_sub + v_del then raise exception 'bb:price_changed'; end if;
    exception when invalid_text_representation then raise exception 'bb:invalid';
    end;
  end if;

  -- স্প্যাম সীমা
  if (select count(*) from public.orders o where o.phone = v_phone and o.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'bb:too_many_orders';
  end if;
  if (select count(*) from public.orders o where o.created_at > now() - interval '1 minute') >= 40 then
    raise exception 'bb:busy';
  end if;

  -- অনুমান করা কঠিন Order ID, যেমন BB-261118-K7M2PX
  loop
    v_try := v_try + 1;
    v_rand := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_oid := 'BB-' || to_char(v_now at time zone 'Asia/Dhaka', 'YYMMDD') || '-';
    for i in 0..5 loop
      v_oid := v_oid || substr(c_alpha, (get_byte(v_rand, i) % 32) + 1, 1);
    end loop;
    begin
      insert into public.orders (order_id, name, phone, district, upazila, address, note, items,
                                 subtotal, delivery, delivery_pending, total,
                                 payment_method, bkash_txn, bkash_sender, payment_status, order_status, created_at)
      values (v_oid, v_name, v_phone, v_district, v_upazila, v_address, v_note, v_items,
              v_sub, v_del, v_pending, v_sub + v_del,
              v_method, v_txn, v_sender, v_pstat, v_ostat, v_now);
      exit;
    exception when unique_violation then
      if v_try >= 5 then raise exception 'bb:busy'; end if;
    end;
  end loop;

  return jsonb_build_object(
    'order_id', v_oid, 'created_at', v_now, 'items', v_items,
    'subtotal', v_sub, 'delivery', v_del, 'delivery_pending', v_pending, 'total', v_sub + v_del,
    'payment_method', v_method, 'payment_status', v_pstat, 'order_status', v_ostat);
end;
$$;

-- ---------- অর্ডার ট্র্যাকিং (Order ID + ফোন মিললে তবেই; ব্যক্তিগত তথ্য ফেরত যায় না) ----------
create or replace function public.track_order(p_order_id text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_phone text := public.bb_norm_phone(p_phone);
  v_oid text := upper(btrim(coalesce(p_order_id, '')));
  o public.orders%rowtype;
begin
  if v_phone !~ '^01[3-9][0-9]{8}$' or v_oid !~ '^BB-[0-9]{6}-[A-Z0-9]{6}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  delete from public.track_attempts where at < now() - interval '1 day';
  if (select count(*) from public.track_attempts t where t.phone = v_phone and t.at > now() - interval '15 minutes') >= 8
     or (select count(*) from public.track_attempts t where t.at > now() - interval '5 minutes') >= 300 then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;

  select * into o from public.orders x where x.order_id = v_oid and x.phone = v_phone;
  if not found then
    insert into public.track_attempts (phone) values (v_phone);
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  return jsonb_build_object('ok', true, 'order', jsonb_build_object(
    'order_id', o.order_id, 'created_at', o.created_at, 'updated_at', o.updated_at,
    'order_status', o.order_status, 'payment_status', o.payment_status,
    'payment_method', o.payment_method, 'district', o.district,
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
                'name', e ->> 'name', 'size', e -> 'size', 'unit', e ->> 'unit',
                'qty', e -> 'qty', 'total', e -> 'total')), '[]'::jsonb)
              from jsonb_array_elements(o.items) e),
    'subtotal', o.subtotal, 'delivery', o.delivery, 'delivery_pending', o.delivery_pending, 'total', o.total));
end;
$$;

-- =============================================================================
-- নিরাপত্তা: RLS চালু + ন্যূনতম অনুমতি
-- =============================================================================
alter table public.admins          enable row level security;
alter table public.districts       enable row level security;
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.slides          enable row level security;
alter table public.faqs            enable row level security;
alter table public.settings        enable row level security;
alter table public.orders          enable row level security;
alter table public.track_attempts  enable row level security;

-- আগের সব অনুমতি তুলে নিয়ে শুধু দরকারিগুলো দেওয়া
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant select on public.districts, public.categories, public.products, public.slides, public.faqs, public.settings
  to anon, authenticated;
-- নিচের অনুমতি শুধু "authenticated"-কে; RLS নিয়ম অনুযায়ী কার্যত শুধু অ্যাডমিন পারবে
grant insert, update, delete on public.districts, public.categories, public.products, public.slides,
  public.faqs, public.settings to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select on public.admins to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
-- টেবিলের CHECK নিয়মে ব্যবহৃত ফাংশন: যে ভূমিকা লিখছে (অ্যাডমিন) তার চালানোর অনুমতি লাগে
grant execute on function public.bb_sizes_valid(numeric[]) to authenticated;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- পাবলিক পড়া (শুধু সক্রিয় সারি) + অ্যাডমিন সব
do $$
declare t text;
begin
  foreach t in array array['categories', 'products', 'slides', 'faqs'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (active or public.is_admin())', t);
  end loop;
  foreach t in array array['districts', 'settings'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
  end loop;
  foreach t in array array['districts', 'categories', 'products', 'slides', 'faqs', 'settings', 'orders'] loop
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "admin read" on public.admins;
create policy "admin read" on public.admins for select to authenticated using (public.is_admin());
-- admins ও track_attempts-এ অন্য কোনো পলিসি নেই: অ্যাডমিন তালিকা বদলাতে হয় শুধু SQL Editor থেকে।

-- ---------- ছবির জায়গা (Storage): সবাই দেখতে পারে, আপলোড/মোছা শুধু অ্যাডমিন ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "bb admin read images"   on storage.objects;
drop policy if exists "bb admin insert images" on storage.objects;
drop policy if exists "bb admin update images" on storage.objects;
drop policy if exists "bb admin delete images" on storage.objects;
create policy "bb admin read images"   on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "bb admin insert images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "bb admin update images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "bb admin delete images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
