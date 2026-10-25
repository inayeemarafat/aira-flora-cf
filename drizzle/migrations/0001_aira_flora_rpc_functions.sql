create or replace function public.increment_visits()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visits (day, count) values (current_date, 1)
  on conflict (day) do update set count = public.visits.count + 1;
$$;

create or replace function public.increment_coupon_usage(_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.coupons set used_count = used_count + 1 where code = _code;
$$;

revoke execute on function public.increment_visits() from public;
revoke execute on function public.increment_visits() from anon;
revoke execute on function public.increment_visits() from authenticated;
revoke execute on function public.increment_coupon_usage(text) from public;
revoke execute on function public.increment_coupon_usage(text) from anon;
revoke execute on function public.increment_coupon_usage(text) from authenticated;
grant execute on function public.increment_visits() to service_role;
grant execute on function public.increment_coupon_usage(text) to service_role;