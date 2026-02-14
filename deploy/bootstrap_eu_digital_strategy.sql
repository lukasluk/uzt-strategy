-- Bootstrap dataset for EU Digital Strategy / Digital Decade 2030.
-- Sources:
-- 1) https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/europe-fit-digital-age/europes-digital-decade-digital-targets-2030_en
-- 2) https://digital-strategy.ec.europa.eu/en/policies/europes-digital-decade
-- 3) https://digital-strategy.ec.europa.eu/en/policies/digital-decade-policy-programme

insert into institutions (id, name, slug, country_code, website_url, status)
values (
  gen_random_uuid(),
  'European Commission (EU Digital Strategy)',
  'eu-digital-strategy',
  'EU',
  'https://digital-strategy.ec.europa.eu/en/policies/europes-digital-decade',
  'active'
)
on conflict (slug) do nothing;

update institutions
set
  name = 'European Commission (EU Digital Strategy)',
  country_code = case when coalesce(trim(country_code), '') = '' then 'EU' else country_code end,
  website_url = case
    when coalesce(trim(website_url), '') = '' then 'https://digital-strategy.ec.europa.eu/en/policies/europes-digital-decade'
    else website_url
  end,
  status = 'active'
where slug = 'eu-digital-strategy';

insert into strategy_cycles (id, institution_id, title, state, results_published, starts_at, mission_text, vision_text)
select
  gen_random_uuid(),
  i.id,
  'EU Digital Strategy 2030 Cycle',
  'open',
  false,
  now(),
  'Coordinate Europe''s digital transformation through measurable targets in skills, business, infrastructure and public services.',
  'A sovereign, secure and inclusive European digital ecosystem where people, businesses and public institutions benefit from trustworthy digital services.'
from institutions i
where i.slug = 'eu-digital-strategy'
  and not exists (
    select 1
    from strategy_cycles c
    where c.institution_id = i.id
  );

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eu-digital-strategy'
  order by c.created_at desc
  limit 1
)
update strategy_cycles c
set
  title = case when coalesce(trim(c.title), '') = '' then 'EU Digital Strategy 2030 Cycle' else c.title end,
  mission_text = case
    when coalesce(trim(c.mission_text), '') = '' then 'Coordinate Europe''s digital transformation through measurable targets in skills, business, infrastructure and public services.'
    else c.mission_text
  end,
  vision_text = case
    when coalesce(trim(c.vision_text), '') = '' then 'A sovereign, secure and inclusive European digital ecosystem where people, businesses and public institutions benefit from trustworthy digital services.'
    else c.vision_text
  end
from target_cycle t
where c.id = t.id;

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eu-digital-strategy'
  order by c.created_at desc
  limit 1
),
guidelines_src(title, description, relation_type, line_side) as (
  values
    ('Digital skills and inclusion', 'Raise digital literacy and specialist talent so all citizens can participate in the digital economy.', 'parent', 'left'),
    ('Digital transformation of businesses', 'Accelerate cloud, AI and data adoption across SMEs and large enterprises.', 'parent', 'left'),
    ('Secure and sovereign digital infrastructure', 'Build resilient connectivity, semiconductors and trusted edge/cloud capacity across Europe.', 'parent', 'right'),
    ('Digital public services and trust', 'Deliver user-centric digital public services, digital identity and trustworthy governance.', 'parent', 'right')
)
insert into strategy_guidelines (
  id,
  cycle_id,
  title,
  description,
  status,
  relation_type,
  parent_guideline_id,
  line_side,
  created_by
)
select
  gen_random_uuid(),
  t.id,
  s.title,
  s.description,
  'active',
  s.relation_type,
  null,
  s.line_side,
  null
from target_cycle t
cross join guidelines_src s
where not exists (
  select 1
  from strategy_guidelines g
  where g.cycle_id = t.id
    and lower(g.title) = lower(s.title)
);

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eu-digital-strategy'
  order by c.created_at desc
  limit 1
),
initiatives_src(title, description, line_side) as (
  values
    ('Basic digital skills to 80% of citizens', 'Coordinate national programmes so at least 80% of people have basic digital skills by 2030.', 'left'),
    ('Grow ICT specialist pipeline to 20M', 'Increase ICT specialists and strengthen gender balance through education and reskilling pathways.', 'left'),
    ('Cloud, AI and data adoption in enterprises', 'Enable broad enterprise uptake of cloud, AI and big data capabilities.', 'left'),
    ('SME digital intensity acceleration', 'Support SMEs to reach at least a basic level of digital intensity with targeted advisory and funding.', 'left'),
    ('Scale-up and unicorn growth programme', 'Improve scale-up financing and market access to strengthen Europe''s innovation ecosystem.', 'left'),
    ('Gigabit and 5G coverage for all populated areas', 'Expand high-capacity networks and 5G coverage to eliminate connectivity gaps.', 'right'),
    ('European semiconductor capacity expansion', 'Increase Europe''s semiconductor design and manufacturing capability to improve strategic autonomy.', 'right'),
    ('Secure edge and cloud node deployment', 'Develop climate-neutral, highly secure edge and cloud capacity across member states.', 'right'),
    ('EU Digital Identity Wallet rollout', 'Implement interoperable digital identity services for citizens and businesses across the EU.', 'right'),
    ('100% key public services online', 'Digitise priority public services end-to-end for both citizens and businesses.', 'right'),
    ('Cross-border digital health record access', 'Enable secure and interoperable access to electronic health records across member states.', 'right'),
    ('Cybersecurity baseline across sectors', 'Adopt common cybersecurity capabilities and incident preparedness in public and private sectors.', 'right')
)
insert into strategy_initiatives (
  id,
  cycle_id,
  title,
  description,
  status,
  line_side,
  created_by
)
select
  gen_random_uuid(),
  t.id,
  s.title,
  s.description,
  'active',
  s.line_side,
  null
from target_cycle t
cross join initiatives_src s
where not exists (
  select 1
  from strategy_initiatives i
  where i.cycle_id = t.id
    and lower(i.title) = lower(s.title)
);

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eu-digital-strategy'
  order by c.created_at desc
  limit 1
),
links_src(initiative_title, guideline_title) as (
  values
    ('Basic digital skills to 80% of citizens', 'Digital skills and inclusion'),
    ('Grow ICT specialist pipeline to 20M', 'Digital skills and inclusion'),
    ('Cloud, AI and data adoption in enterprises', 'Digital transformation of businesses'),
    ('SME digital intensity acceleration', 'Digital transformation of businesses'),
    ('Scale-up and unicorn growth programme', 'Digital transformation of businesses'),
    ('Gigabit and 5G coverage for all populated areas', 'Secure and sovereign digital infrastructure'),
    ('European semiconductor capacity expansion', 'Secure and sovereign digital infrastructure'),
    ('Secure edge and cloud node deployment', 'Secure and sovereign digital infrastructure'),
    ('Secure edge and cloud node deployment', 'Digital public services and trust'),
    ('EU Digital Identity Wallet rollout', 'Digital public services and trust'),
    ('EU Digital Identity Wallet rollout', 'Secure and sovereign digital infrastructure'),
    ('100% key public services online', 'Digital public services and trust'),
    ('Cross-border digital health record access', 'Digital public services and trust'),
    ('Cybersecurity baseline across sectors', 'Secure and sovereign digital infrastructure'),
    ('Cybersecurity baseline across sectors', 'Digital public services and trust')
)
insert into strategy_initiative_guidelines (id, initiative_id, guideline_id)
select
  gen_random_uuid(),
  i.id,
  g.id
from target_cycle t
join links_src s on true
join strategy_initiatives i
  on i.cycle_id = t.id
 and lower(i.title) = lower(s.initiative_title)
join strategy_guidelines g
  on g.cycle_id = t.id
 and lower(g.title) = lower(s.guideline_title)
where not exists (
  select 1
  from strategy_initiative_guidelines ig
  where ig.initiative_id = i.id
    and ig.guideline_id = g.id
);
