insert into institutions (id, name, slug, country_code, website_url, status)
values
  (gen_random_uuid(), 'Uzimtumo tarnyba', 'uzt', 'LT', 'https://uzt.lt', 'active')
on conflict (slug) do nothing;

insert into institution_strategies (id, institution_id, title, slug, description, status, is_default)
select
  gen_random_uuid(),
  i.id,
  'Skaitmenizacijos strategija',
  'default',
  null,
  'active',
  true
from institutions i
where i.slug = 'uzt'
  and not exists (
    select 1
    from institution_strategies s
    where s.institution_id = i.id
      and s.slug = 'default'
  );

insert into strategy_cycles (id, institution_id, strategy_id, title, state, results_published, starts_at)
select
  gen_random_uuid(),
  i.id,
  s.id,
  'UZT skaitmenizacijos strategijos ciklas',
  'open',
  false,
  now()
from institutions i
join institution_strategies s on s.institution_id = i.id and s.slug = 'default'
where i.slug = 'uzt'
  and not exists (
    select 1
    from strategy_cycles c
    where c.institution_id = i.id
      and c.strategy_id = s.id
      and c.state in ('open', 'closed')
  );
