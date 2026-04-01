create extension if not exists pgcrypto;

create table if not exists institutions (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  ai_provider text not null default 'openai',
  country_code text,
  website_url text,
  clarity_gremlin_extra_scans integer not null default 0,
  clarity_gremlin_strategic_link_extra_scans integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists institution_strategies (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (institution_id, slug)
);

create table if not exists platform_users (
  id uuid primary key,
  email text not null unique,
  display_name text not null,
  password_salt text not null,
  password_hash text not null,
  status text not null default 'active' check (status in ('active', 'blocked', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists institution_memberships (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  user_id uuid not null references platform_users(id) on delete cascade,
  role text not null check (role in ('member', 'institution_admin')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamptz not null default now(),
  unique (institution_id, user_id)
);

create table if not exists institution_invites (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  email text not null,
  role text not null check (role in ('member', 'institution_admin')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists strategy_cycles (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  strategy_id uuid references institution_strategies(id) on delete set null,
  title text not null,
  state text not null default 'open' check (state in ('open', 'closed')),
  results_published boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  finalized_at timestamptz,
  mission_text text,
  vision_text text,
  created_at timestamptz not null default now()
);

create table if not exists strategy_guidelines (
  id uuid primary key,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  title text not null,
  description text,
  implementation_target_date date,
  implementation_owner text,
  implementation_completed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'merged', 'hidden')),
  line_side text not null default 'auto',
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists strategy_guideline_links (
  id uuid primary key,
  source_guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  target_guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source_guideline_id, target_guideline_id),
  check (source_guideline_id <> target_guideline_id)
);

create table if not exists strategy_comments (
  id uuid primary key,
  guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  author_id uuid not null references platform_users(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists strategy_votes (
  id uuid primary key,
  guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  voter_id uuid not null references platform_users(id) on delete cascade,
  score integer not null check (score between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guideline_id, voter_id)
);

create table if not exists strategy_initiatives (
  id uuid primary key,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  title text not null,
  description text,
  implementation_target_date date,
  implementation_owner text,
  implementation_completed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'disabled', 'merged', 'hidden')),
  line_side text not null default 'auto',
  map_x integer,
  map_y integer,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists strategy_initiative_guidelines (
  id uuid primary key,
  initiative_id uuid not null references strategy_initiatives(id) on delete cascade,
  guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (initiative_id, guideline_id)
);

create table if not exists strategy_initiative_comments (
  id uuid primary key,
  initiative_id uuid not null references strategy_initiatives(id) on delete cascade,
  author_id uuid not null references platform_users(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists strategy_initiative_votes (
  id uuid primary key,
  initiative_id uuid not null references strategy_initiatives(id) on delete cascade,
  voter_id uuid not null references platform_users(id) on delete cascade,
  score integer not null check (score between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (initiative_id, voter_id)
);

create table if not exists audit_events (
  id uuid primary key,
  institution_id uuid references institutions(id) on delete cascade,
  actor_id uuid references platform_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists platform_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key,
  user_id uuid not null references platform_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by_scope text not null default 'meta_admin',
  created_by_id text,
  created_at timestamptz not null default now()
);

create table if not exists access_requests (
  id uuid primary key,
  request_code text not null unique,
  institution_id uuid references institutions(id) on delete set null,
  institution_name text not null,
  full_name text not null,
  work_email text not null,
  phone text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by_scope text,
  reviewed_by_id text,
  created_at timestamptz not null default now()
);

insert into platform_settings (key, value)
values
  ('guide_intro_text', $$digistrategy.eu sistema skirta patogiam jūsų institucijos strategijos rengimo procesui. Patogiai susikurkite gairių struktūrą ir priskirkite konkrečias iniciatyvas tų gairių įgyvendinimui.
Sistema susideda iš 2 pagrindinių dalių:
1. Kortelių valdymo modulio (Gairės ir Iniciatyvos) - čia jūsų kolegos gali komentuoti, siūlyti įvairias strategijos kryptis, balsuoti už vieni kitų teiktus pasiūlymus.
2. Strategijų žemėlapis - patogus vizualinis įrankis peržiūrėti strategijos struktūrą ir ryšius tarp skirtingų jų elementų.
Galutinį savo interaktyvų strategijos žemėlapį įkelkite į intranetą ar vidinį puslapį su embeding funkcionalumu. Sistema skirta valstybinėms institucijoms kurios nori savo strategijos kūrimo procesą vykdyti efektyviai.$$),
  ('about_text', $$Lietuvos viešajame sektoriuje skaitmenizacija vis dažniau suvokiama ne kaip pavienių IT projektų rinkinys, o kaip sisteminis pokytis, apimantis paslaugų kokybę, duomenų valdymą ir naujų technologijų taikymą. Todėl vis didesnę reikšmę įgyja ne tik technologiniai sprendimai, bet ir aiškios, įgyvendinamos skaitmenizacijos strategijos (arba IT plėtros planai).

Praktika rodo, kad tradiciniai, didelės apimties strateginiai dokumentai dažnai tampa sunkiai pritaikomi greitai besikeičiančioje aplinkoje. Dėl to vis daugiau dėmesio skiriama lanksčioms, įtraukioms ir duomenimis grįstoms strategijų formavimo praktikoms, kurios leidžia greičiau susitarti dėl prioritetų ir krypties.

Vienas iš būdų tai pasiekti - aiškiai išsigryninti pagrindines ašis, aplink kurias sukasi dauguma sprendimų:

- Kokybiškų paslaugų teikimas (vidiniams ir išoriniams naudotojams).
- Duomenų kokybė ir duomenų valdymas (data governance).
- Tikslingas dirbtinio intelekto taikymas (AI with purpose).

Svarbi ne tik strategijos kryptis, bet ir pats jos rengimo procesas - jis turi būti suprantamas, įtraukiantis ir skatinantis bendrą atsakomybę. Tam vis dažniau pasitelkiami paprasti skaitmeniniai įrankiai, leidžiantys dalyviams siūlyti gaires, jas komentuoti, balsuoti ir viešai matyti bendrus rezultatus. Tokie sprendimai skatina skaidrumą, tarpinstitucinį mokymąsi ir gerosios praktikos dalijimąsi.

Šiame kontekste atsirado digistrategy.eu - eksperimentinis, atviras įrankis, skirtas skaitmenizacijos strategijų ar IT plėtros planų gairėms formuoti ir prioritetizuoti. Jis leidžia dalyviams struktūruotai įsitraukti į strateginį procesą ir padeda greičiau pereiti nuo abstrakčių idėjų prie aiškių sprendimų krypčių.

Svarbu pabrėžti, kad tai nėra enterprise lygio ar sertifikuotas sprendimas - veikiau praktinis eksperimentas, skirtas parodyti, kaip pasitelkiant šiuolaikines technologijas ir dirbtinį intelektą galima greitai sukurti veikiančius, naudotojams suprantamus įrankius.

Dirbtinis intelektas ir skaitmeniniai sprendimai jau keičia viešojo sektoriaus veiklos modelius. Organizacijos, kurios drąsiai eksperimentuoja, augina kompetencijas ir taiko technologijas tikslingai, turi realią galimybę judėti greičiau ir išlikti konkurencingos sparčiai besikeičiančioje aplinkoje.$$)
on conflict (key) do nothing;

create index if not exists idx_memberships_institution on institution_memberships(institution_id);
create index if not exists idx_memberships_user on institution_memberships(user_id);
create index if not exists idx_invites_institution on institution_invites(institution_id);
create index if not exists idx_invites_email on institution_invites(email);
create index if not exists idx_strategies_institution on institution_strategies(institution_id);
alter table if exists strategy_cycles
  add column if not exists strategy_id uuid references institution_strategies(id) on delete set null;
alter table if exists institution_strategies
  add column if not exists clarity_gremlin_calls_used integer not null default 0;
alter table if exists institution_strategies
  add column if not exists clarity_gremlin_strategic_link_calls_used integer not null default 0;
alter table if exists institutions
  add column if not exists ai_provider text not null default 'openai';
alter table if exists institutions
  add column if not exists ai_openai_model text;
alter table if exists institutions
  add column if not exists ai_mistral_model text;
alter table if exists institutions
  drop constraint if exists institutions_ai_provider_check;
alter table if exists institutions
  add constraint institutions_ai_provider_check
  check (ai_provider in ('openai', 'mistral'));
create index if not exists idx_cycles_institution on strategy_cycles(institution_id);
create index if not exists idx_cycles_strategy on strategy_cycles(strategy_id);
create index if not exists idx_guidelines_cycle on strategy_guidelines(cycle_id);
create index if not exists idx_guideline_links_source on strategy_guideline_links(source_guideline_id);
create index if not exists idx_guideline_links_target on strategy_guideline_links(target_guideline_id);

create table if not exists clarity_gremlin_strategic_link_searches (
  strategy_id uuid primary key references institution_strategies(id) on delete cascade,
  institution_id uuid not null references institutions(id) on delete cascade,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  response_language text not null default 'lt' check (response_language in ('lt', 'en')),
  model text,
  last_scanned_at timestamptz not null default now(),
  last_scanned_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clarity_gremlin_strategic_link_suggestions (
  id uuid primary key,
  strategy_id uuid not null references institution_strategies(id) on delete cascade,
  institution_id uuid not null references institutions(id) on delete cascade,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  source_guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  target_guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  target_institution_id uuid references institutions(id) on delete set null,
  target_strategy_id uuid references institution_strategies(id) on delete set null,
  target_cycle_id uuid references strategy_cycles(id) on delete set null,
  group_key text not null check (group_key in ('sameInstitution', 'otherInstitutions')),
  status text not null default 'suggested' check (status in ('suggested', 'dismissed', 'accepted')),
  rationale text,
  confidence text,
  meta_json jsonb not null default '{}'::jsonb,
  accepted_link_id uuid references strategy_guideline_links(id) on delete set null,
  accepted_at timestamptz,
  accepted_by uuid references platform_users(id) on delete set null,
  dismissed_at timestamptz,
  dismissed_by uuid references platform_users(id) on delete set null,
  last_suggested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(strategy_id, source_guideline_id, target_guideline_id)
);

create index if not exists idx_clarity_gremlin_strategic_link_suggestions_strategy
  on clarity_gremlin_strategic_link_suggestions(strategy_id, status, updated_at desc);
create index if not exists idx_comments_guideline on strategy_comments(guideline_id);
create index if not exists idx_votes_guideline on strategy_votes(guideline_id);
create index if not exists idx_votes_voter on strategy_votes(voter_id);
create index if not exists idx_initiatives_cycle on strategy_initiatives(cycle_id);
create index if not exists idx_initiative_guidelines_initiative on strategy_initiative_guidelines(initiative_id);
create index if not exists idx_initiative_guidelines_guideline on strategy_initiative_guidelines(guideline_id);
create index if not exists idx_initiative_comments_initiative on strategy_initiative_comments(initiative_id);
create index if not exists idx_initiative_votes_initiative on strategy_initiative_votes(initiative_id);
create index if not exists idx_initiative_votes_voter on strategy_initiative_votes(voter_id);
create index if not exists idx_password_reset_user on password_reset_tokens(user_id);
create index if not exists idx_password_reset_expires on password_reset_tokens(expires_at);
create index if not exists idx_access_requests_status on access_requests(status);
create index if not exists idx_access_requests_created_at on access_requests(created_at);
create index if not exists idx_access_requests_institution on access_requests(institution_id);

alter table if exists strategy_guidelines
  add column if not exists relation_type text not null default 'orphan';

alter table if exists strategy_guidelines
  add column if not exists parent_guideline_id uuid references strategy_guidelines(id) on delete set null;

alter table if exists strategy_guidelines
  add column if not exists implementation_target_date date;

alter table if exists strategy_guidelines
  add column if not exists implementation_owner text;

alter table if exists strategy_guidelines
  add column if not exists implementation_completed_at timestamptz;

create index if not exists idx_guidelines_parent on strategy_guidelines(parent_guideline_id);

create table if not exists strategy_card_proposals (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  strategy_id uuid references institution_strategies(id) on delete set null,
  entity_kind text not null check (entity_kind in ('guideline', 'initiative')),
  title text not null,
  description text,
  relation_type text check (relation_type in ('orphan', 'parent', 'child')),
  parent_guideline_id uuid references strategy_guidelines(id) on delete set null,
  line_side text check (line_side in ('auto', 'left', 'right', 'top', 'bottom')),
  guideline_ids_json jsonb not null default '[]'::jsonb,
  source_meta_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  review_decision text check (review_decision in ('approved', 'rejected', 'approved_with_changes')),
  review_note text,
  requested_by uuid references platform_users(id) on delete set null,
  reviewed_by uuid references platform_users(id) on delete set null,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  final_entity_id uuid,
  final_title text,
  final_description text,
  final_relation_type text check (final_relation_type in ('orphan', 'parent', 'child')),
  final_parent_guideline_id uuid references strategy_guidelines(id) on delete set null,
  final_line_side text check (final_line_side in ('auto', 'left', 'right', 'top', 'bottom')),
  final_guideline_ids_json jsonb
);

create table if not exists strategy_card_proposal_comments (
  id uuid primary key,
  proposal_id uuid not null references strategy_card_proposals(id) on delete cascade,
  author_id uuid not null references platform_users(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists strategy_card_proposal_events (
  id uuid primary key,
  proposal_id uuid not null references strategy_card_proposals(id) on delete cascade,
  institution_id uuid not null references institutions(id) on delete cascade,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  actor_id uuid references platform_users(id) on delete set null,
  event_type text not null check (event_type in ('created', 'commented', 'approved', 'approved_with_changes', 'rejected')),
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_proposals_cycle on strategy_card_proposals(cycle_id);
create index if not exists idx_proposals_institution on strategy_card_proposals(institution_id);
create index if not exists idx_proposals_status on strategy_card_proposals(status);
create index if not exists idx_proposals_kind on strategy_card_proposals(entity_kind);
create index if not exists idx_proposals_strategy on strategy_card_proposals(strategy_id);
create index if not exists idx_proposal_comments_proposal on strategy_card_proposal_comments(proposal_id);
create index if not exists idx_proposal_events_proposal on strategy_card_proposal_events(proposal_id);
create index if not exists idx_proposal_events_cycle on strategy_card_proposal_events(cycle_id);

alter table if exists strategy_cycles
  add column if not exists map_x integer;

alter table if exists strategy_cycles
  add column if not exists map_y integer;

alter table if exists institution_strategies
  add column if not exists description text;

alter table if exists institution_strategies
  add column if not exists is_default boolean not null default false;

insert into institution_strategies (id, institution_id, title, slug, description, status, is_default, created_at)
select gen_random_uuid(),
       i.id,
       coalesce(
         nullif(regexp_replace(coalesce(c.title, ''), '\s*ciklas\s*$', '', 'i'), ''),
         i.name || ' strategija'
       ) as title,
       'default' as slug,
       null as description,
       'active' as status,
       true as is_default,
       coalesce(c.created_at, now()) as created_at
from institutions i
left join lateral (
  select sc.title, sc.created_at
  from strategy_cycles sc
  where sc.institution_id = i.id
  order by sc.created_at asc
  limit 1
) c on true
where not exists (
  select 1
  from institution_strategies s
  where s.institution_id = i.id
);

with ranked_strategies as (
  select id,
         row_number() over (partition by institution_id order by is_default desc, created_at asc, id asc) as rn
  from institution_strategies
)
update institution_strategies s
set is_default = (r.rn = 1)
from ranked_strategies r
where s.id = r.id
  and s.is_default is distinct from (r.rn = 1);

create unique index if not exists idx_strategies_default_institution
  on institution_strategies(institution_id)
  where is_default = true;

update strategy_cycles sc
set strategy_id = s.id
from institution_strategies s
where sc.institution_id = s.institution_id
  and s.is_default = true
  and sc.strategy_id is null;

alter table if exists strategy_cycles
  add column if not exists mission_text text;

alter table if exists strategy_cycles
  add column if not exists vision_text text;

alter table if exists strategy_guidelines
  add column if not exists map_x integer;

alter table if exists strategy_guidelines
  add column if not exists map_y integer;

alter table if exists strategy_guidelines
  add column if not exists line_side text not null default 'auto';

update strategy_guidelines
set line_side = 'auto'
where line_side is distinct from 'auto';

alter table if exists strategy_guidelines
  drop constraint if exists strategy_guidelines_status_check;

alter table if exists strategy_guidelines
  add constraint strategy_guidelines_status_check
  check (status in ('active', 'disabled', 'merged', 'hidden'));

alter table if exists strategy_initiatives
  add column if not exists line_side text not null default 'auto';

alter table if exists strategy_initiatives
  add column if not exists implementation_target_date date;

alter table if exists strategy_initiatives
  add column if not exists implementation_owner text;

alter table if exists strategy_initiatives
  add column if not exists implementation_completed_at timestamptz;

update strategy_initiatives
set line_side = 'auto'
where line_side is distinct from 'auto';

update strategy_card_proposals
set line_side = 'auto'
where line_side is distinct from 'auto';

alter table if exists strategy_card_proposals
  add column if not exists source_meta_json jsonb not null default '{}'::jsonb;

update strategy_card_proposals
set final_line_side = 'auto'
where final_line_side is not null
  and final_line_side is distinct from 'auto';

alter table if exists strategy_initiatives
  add column if not exists map_x integer;

alter table if exists strategy_initiatives
  add column if not exists map_y integer;

alter table if exists strategy_initiatives
  drop constraint if exists strategy_initiatives_status_check;

alter table if exists strategy_initiatives
  add constraint strategy_initiatives_status_check
  check (status in ('active', 'disabled', 'merged', 'hidden'));

alter table if exists platform_users
  drop constraint if exists platform_users_status_check;

alter table if exists platform_users
  add constraint platform_users_status_check
  check (status in ('active', 'blocked', 'archived'));

alter table if exists strategy_cycles
  drop constraint if exists strategy_cycles_state_check;

update strategy_cycles
set state = case
  when state = 'open' then 'open'
  when state = 'closed' then 'closed'
  else 'closed'
end
where state not in ('open', 'closed')
   or state is null;

alter table if exists strategy_cycles
  alter column state set default 'open';

alter table if exists strategy_cycles
  add constraint strategy_cycles_state_check
  check (state in ('open', 'closed'));

alter table if exists institutions
  add column if not exists country_code text;

alter table if exists institutions
  add column if not exists website_url text;

alter table if exists institutions
  add column if not exists clarity_gremlin_extra_scans integer not null default 0;
alter table if exists institutions
  add column if not exists clarity_gremlin_strategic_link_extra_scans integer not null default 0;

create table if not exists strategy_ai_generations (
  id uuid primary key,
  institution_id uuid references institutions(id) on delete cascade,
  strategy_id uuid references institution_strategies(id) on delete set null,
  cycle_id uuid references strategy_cycles(id) on delete set null,
  requested_by_scope text not null default 'meta_admin',
  requested_by_id text,
  request_note text,
  source_files_json jsonb not null default '[]'::jsonb,
  model text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'applying', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_strategy_ai_generations_created_at
  on strategy_ai_generations(created_at);
create index if not exists idx_strategy_ai_generations_institution
  on strategy_ai_generations(institution_id);

alter table if exists strategy_ai_generations
  alter column institution_id drop not null;

alter table if exists strategy_ai_generations
  alter column status set default 'pending';

alter table if exists strategy_ai_generations
  drop constraint if exists strategy_ai_generations_status_check;

alter table if exists strategy_ai_generations
  add constraint strategy_ai_generations_status_check
  check (status in ('pending', 'processing', 'applying', 'completed', 'failed'));

create table if not exists strategy_catalog_classifications (
  strategy_id uuid primary key references institution_strategies(id) on delete cascade,
  sector text not null,
  theme text not null,
  region text not null,
  confidence numeric(4,3),
  model text,
  raw_json jsonb,
  classified_at timestamptz not null default now()
);

create index if not exists idx_strategy_catalog_sector
  on strategy_catalog_classifications(sector);
create index if not exists idx_strategy_catalog_theme
  on strategy_catalog_classifications(theme);
create index if not exists idx_strategy_catalog_region
  on strategy_catalog_classifications(region);
create index if not exists idx_strategy_catalog_classified_at
  on strategy_catalog_classifications(classified_at);

create table if not exists policy_alignment_frameworks (
  id uuid primary key,
  institution_id uuid references institutions(id) on delete cascade,
  strategy_id uuid references institution_strategies(id) on delete set null,
  cycle_id uuid references strategy_cycles(id) on delete set null,
  title text not null,
  slug text,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  source_hash text,
  meta_json jsonb not null default '{}'::jsonb,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists policy_alignment_analyses (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  strategy_id uuid references institution_strategies(id) on delete set null,
  cycle_id uuid references strategy_cycles(id) on delete cascade,
  target_framework_id uuid references policy_alignment_frameworks(id) on delete set null,
  title text not null,
  description text,
  source_mode text not null check (source_mode in ('uploaded_document', 'existing_strategy', 'existing_cycle', 'mixed')),
  target_mode text not null check (target_mode in ('uploaded_document', 'framework')),
  status text not null default 'draft' check (status in ('draft', 'queued', 'processing', 'completed', 'failed')),
  source_summary_json jsonb not null default '{}'::jsonb,
  target_summary_json jsonb not null default '{}'::jsonb,
  summary_json jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists policy_alignment_documents (
  id uuid primary key,
  analysis_id uuid references policy_alignment_analyses(id) on delete cascade,
  framework_id uuid references policy_alignment_frameworks(id) on delete cascade,
  role text not null check (role in ('source', 'target')),
  source_kind text not null check (
    source_kind in ('uploaded_pdf', 'existing_strategy_export', 'existing_cycle_export', 'framework_document')
  ),
  filename text not null,
  mime_type text,
  file_bytes integer,
  page_count integer,
  sha256_hash text,
  extracted_text text not null default '',
  extraction_status text not null default 'pending' check (extraction_status in ('pending', 'completed', 'failed')),
  extraction_error text,
  meta_json jsonb not null default '{}'::jsonb,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (analysis_id is not null or framework_id is not null)
);

create table if not exists policy_alignment_chunks (
  id uuid primary key,
  analysis_id uuid references policy_alignment_analyses(id) on delete cascade,
  document_id uuid not null references policy_alignment_documents(id) on delete cascade,
  chunk_role text not null check (chunk_role in ('source', 'target')),
  ordinal integer not null,
  page_from integer,
  page_to integer,
  section_path text,
  heading text,
  token_estimate integer,
  text_excerpt text not null,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, ordinal)
);

create table if not exists policy_alignment_requirements (
  id uuid primary key,
  framework_id uuid references policy_alignment_frameworks(id) on delete cascade,
  analysis_id uuid references policy_alignment_analyses(id) on delete cascade,
  source_document_id uuid references policy_alignment_documents(id) on delete set null,
  requirement_key text,
  theme text,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  ordinal integer not null default 0,
  evidence_json jsonb not null default '[]'::jsonb,
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (framework_id is not null or analysis_id is not null)
);

create table if not exists policy_alignment_source_refs (
  id uuid primary key,
  analysis_id uuid not null references policy_alignment_analyses(id) on delete cascade,
  entity_kind text not null check (entity_kind in ('document', 'guideline', 'initiative', 'cycle', 'strategy_framework')),
  entity_id uuid,
  title text not null,
  description text,
  source_document_id uuid references policy_alignment_documents(id) on delete set null,
  source_chunk_id uuid references policy_alignment_chunks(id) on delete set null,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists policy_alignment_findings (
  id uuid primary key,
  analysis_id uuid not null references policy_alignment_analyses(id) on delete cascade,
  requirement_id uuid references policy_alignment_requirements(id) on delete set null,
  theme text,
  requirement_title text not null,
  requirement_description text,
  coverage_status text not null default 'unclear' check (
    coverage_status in ('covered', 'partial', 'weak', 'missing', 'contradicted', 'unclear')
  ),
  confidence numeric(4,3),
  explanation text,
  overlap_summary text,
  evidence_json jsonb not null default '[]'::jsonb,
  matched_source_refs_json jsonb not null default '[]'::jsonb,
  actionability text not null default 'review' check (
    actionability in ('none', 'review', 'suggest_guideline', 'suggest_initiative')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists policy_alignment_suggestions (
  id uuid primary key,
  analysis_id uuid not null references policy_alignment_analyses(id) on delete cascade,
  finding_id uuid references policy_alignment_findings(id) on delete cascade,
  suggestion_kind text not null check (suggestion_kind in ('guideline', 'initiative')),
  title text not null,
  description text,
  rationale text,
  status text not null default 'draft' check (status in ('draft', 'converted', 'dismissed')),
  linked_guideline_id uuid references strategy_guidelines(id) on delete set null,
  linked_initiative_id uuid references strategy_initiatives(id) on delete set null,
  proposal_id uuid references strategy_card_proposals(id) on delete set null,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_policy_alignment_frameworks_slug
  on policy_alignment_frameworks(institution_id, slug)
  where slug is not null;
create index if not exists idx_policy_alignment_frameworks_strategy
  on policy_alignment_frameworks(strategy_id);
create index if not exists idx_policy_alignment_frameworks_cycle
  on policy_alignment_frameworks(cycle_id);
create index if not exists idx_policy_alignment_frameworks_status
  on policy_alignment_frameworks(status);

create index if not exists idx_policy_alignment_analyses_cycle
  on policy_alignment_analyses(cycle_id);
create index if not exists idx_policy_alignment_analyses_institution
  on policy_alignment_analyses(institution_id);
create index if not exists idx_policy_alignment_analyses_strategy
  on policy_alignment_analyses(strategy_id);
create index if not exists idx_policy_alignment_analyses_status
  on policy_alignment_analyses(status);
create index if not exists idx_policy_alignment_analyses_created_at
  on policy_alignment_analyses(created_at desc);

create index if not exists idx_policy_alignment_documents_analysis
  on policy_alignment_documents(analysis_id);
create index if not exists idx_policy_alignment_documents_framework
  on policy_alignment_documents(framework_id);
create index if not exists idx_policy_alignment_documents_role
  on policy_alignment_documents(role);
create index if not exists idx_policy_alignment_documents_sha256
  on policy_alignment_documents(sha256_hash);

create index if not exists idx_policy_alignment_chunks_document
  on policy_alignment_chunks(document_id, ordinal);
create index if not exists idx_policy_alignment_chunks_analysis
  on policy_alignment_chunks(analysis_id);
create index if not exists idx_policy_alignment_chunks_role
  on policy_alignment_chunks(chunk_role);

create index if not exists idx_policy_alignment_requirements_framework
  on policy_alignment_requirements(framework_id, ordinal);
create index if not exists idx_policy_alignment_requirements_analysis
  on policy_alignment_requirements(analysis_id, ordinal);
create index if not exists idx_policy_alignment_requirements_theme
  on policy_alignment_requirements(theme);
create index if not exists idx_policy_alignment_requirements_key
  on policy_alignment_requirements(requirement_key);

create index if not exists idx_policy_alignment_source_refs_analysis
  on policy_alignment_source_refs(analysis_id);
create index if not exists idx_policy_alignment_source_refs_kind
  on policy_alignment_source_refs(entity_kind);
create index if not exists idx_policy_alignment_source_refs_entity
  on policy_alignment_source_refs(entity_id);

create index if not exists idx_policy_alignment_findings_analysis
  on policy_alignment_findings(analysis_id);
create index if not exists idx_policy_alignment_findings_requirement
  on policy_alignment_findings(requirement_id);
create index if not exists idx_policy_alignment_findings_status
  on policy_alignment_findings(coverage_status);
create index if not exists idx_policy_alignment_findings_theme
  on policy_alignment_findings(theme);

create index if not exists idx_policy_alignment_suggestions_analysis
  on policy_alignment_suggestions(analysis_id);
create index if not exists idx_policy_alignment_suggestions_finding
  on policy_alignment_suggestions(finding_id);
create index if not exists idx_policy_alignment_suggestions_status
  on policy_alignment_suggestions(status);
create index if not exists idx_policy_alignment_suggestions_kind
  on policy_alignment_suggestions(suggestion_kind);

create table if not exists clarity_gremlin_analyses (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  strategy_id uuid not null references institution_strategies(id) on delete cascade,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  view text not null,
  entity_kind text check (entity_kind in ('guideline', 'initiative')),
  entity_id uuid,
  page_label text not null,
  context_label text not null,
  locale text not null default 'lt',
  provider text not null default 'openai',
  model text,
  analysis_json jsonb not null default '{}'::jsonb,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table if exists clarity_gremlin_analyses
  add column if not exists provider text not null default 'openai';
alter table if exists clarity_gremlin_analyses
  add column if not exists status text not null default 'completed';
alter table if exists clarity_gremlin_analyses
  add column if not exists error_message text;
alter table if exists clarity_gremlin_analyses
  add column if not exists started_at timestamptz;
alter table if exists clarity_gremlin_analyses
  add column if not exists completed_at timestamptz;
alter table if exists clarity_gremlin_analyses
  add column if not exists failed_at timestamptz;
update clarity_gremlin_analyses
set status = 'completed'
where status is null;
alter table if exists clarity_gremlin_analyses
  drop constraint if exists clarity_gremlin_analyses_status_check;
alter table if exists clarity_gremlin_analyses
  add constraint clarity_gremlin_analyses_status_check
  check (status in ('running', 'completed', 'failed'));

create index if not exists idx_clarity_gremlin_strategy
  on clarity_gremlin_analyses(strategy_id, created_at desc);
create index if not exists idx_clarity_gremlin_cycle
  on clarity_gremlin_analyses(cycle_id, created_at desc);
create index if not exists idx_clarity_gremlin_entity
  on clarity_gremlin_analyses(entity_id, created_at desc);
