-- Coupons: validate a single code server-side instead of exposing the table.
-- The storefront only ever needs "is this code valid for this subtotal".
create or replace function public.validate_coupon(_code text, _subtotal integer)
returns table (valid boolean, discount integer, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.coupons%rowtype;
  d integer;
begin
  if _code is null or btrim(_code) = '' then
    return query select false::boolean, 0::integer, 'Enter a code.'::text;
    return;
  end if;

  select * into c from public.coupons
    where code = upper(btrim(_code)) and active = true
    limit 1;
  if not found then
    return query select false::boolean, 0::integer, 'This code isn''t valid.'::text;
    return;
  end if;

  if c.expires_at is not null and c.expires_at < now() then
    return query select false::boolean, 0::integer, 'This code has expired.'::text;
    return;
  end if;

  if _subtotal is null or _subtotal < c.min_order then
    return query select false::boolean, 0::integer,
      ('Minimum order for this code is ৳' || to_char(c.min_order, 'FM999,999,999') || '.')::text;
    return;
  end if;

  d := case
    when c.type = 'percent' then round((_subtotal * c.value)::numeric / 100.0)::integer
    else least(c.value, _subtotal)
  end;

  return query select true::boolean, d, 'Code applied.'::text;
end;
$$;

grant execute on function public.validate_coupon(text, integer) to anon, authenticated, service_role;

drop policy "Public can validate coupons" on public.coupons;
revoke select on public.coupons from anon;

-- Newsletter: the app adds subscribers through the server (service role);
-- the open anonymous sign-up rule is unused, so close it.
drop policy "Public can subscribe" on public.newsletter_subscribers;
revoke insert on public.newsletter_subscribers from anon;
