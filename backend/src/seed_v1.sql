insert into institutions (id, name, slug, country_code, website_url, status)
values
  (gen_random_uuid(), 'Uzimtumo tarnyba', 'uzt', 'LT', 'https://uzt.lt', 'active')
on conflict (slug) do nothing;

insert into strategy_cycles (id, institution_id, title, state, results_published, starts_at)
select
  gen_random_uuid(),
  i.id,
  'UZT skaitmenizacijos strategijos ciklas',
  'open',
  false,
  now()
from institutions i
where i.slug = 'uzt'
  and not exists (
    select 1
    from strategy_cycles c
    where c.institution_id = i.id
      and c.state in ('open', 'closed')
  );
