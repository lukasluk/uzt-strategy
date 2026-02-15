-- Bootstrap dataset for EIMIN AI strategy from:
-- Nacionalines+DI+strategines+gaires_derinimui.pdf
-- (provided by project owner).
--
-- What this script does:
-- 1) Ensures institution "eimin" and an active strategy cycle exist.
-- 2) Inserts/updates parent, child, and orphan guidelines.
-- 3) Inserts/updates initiatives and links them to child guidelines.
-- 4) Forces automatic map line-side for all EIMIN cycle guidelines/initiatives.
-- 5) Assigns test@test.com to EIMIN as institution_admin (active).
--
-- Idempotent: safe to run multiple times.

insert into institutions (id, name, slug, country_code, website_url, status)
values (
  gen_random_uuid(),
  'EIMIN',
  'eimin',
  'LT',
  'https://eimin.lrv.lt',
  'active'
)
on conflict (slug) do nothing;

update institutions
set
  name = case when coalesce(trim(name), '') = '' then 'EIMIN' else name end,
  country_code = case when coalesce(trim(country_code), '') = '' then 'LT' else country_code end,
  website_url = case
    when coalesce(trim(website_url), '') = '' then 'https://eimin.lrv.lt'
    else website_url
  end,
  status = 'active'
where slug = 'eimin';

insert into strategy_cycles (id, institution_id, title, state, results_published, starts_at, mission_text, vision_text)
select
  gen_random_uuid(),
  i.id,
  'EIMIN DI strategijos ciklas',
  'open',
  false,
  now(),
  'Sistemingai plėtoti Lietuvos DI ekosistemą per kompetencijas, saugią infrastruktūrą, visuomenei naudingus sprendimus ir ekonominę vertę.',
  'Vizija 2035: valstybė, kurioje DI įgalina žmogų ir tampa pažangios, saugios ir atsakingos skaitmeninės visuomenės pagrindu.'
from institutions i
where i.slug = 'eimin'
  and not exists (
    select 1
    from strategy_cycles c
    where c.institution_id = i.id
  );

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eimin'
  order by c.created_at desc
  limit 1
)
update strategy_cycles c
set
  title = case when coalesce(trim(c.title), '') = '' then 'EIMIN DI strategijos ciklas' else c.title end,
  mission_text = case
    when coalesce(trim(c.mission_text), '') = '' then 'Sistemingai plėtoti Lietuvos DI ekosistemą per kompetencijas, saugią infrastruktūrą, visuomenei naudingus sprendimus ir ekonominę vertę.'
    else c.mission_text
  end,
  vision_text = case
    when coalesce(trim(c.vision_text), '') = '' then 'Vizija 2035: valstybė, kurioje DI įgalina žmogų ir tampa pažangios, saugios ir atsakingos skaitmeninės visuomenės pagrindu.'
    else c.vision_text
  end
from target_cycle t
where c.id = t.id;

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eimin'
  order by c.created_at desc
  limit 1
),
guidelines_src(code, parent_code, relation_type, title, description) as (
  values
    -- Parent guidelines (kryptys)
    ('P1', null, 'parent', 'I kryptis: DI įgalinantis žmogų', 'Kompetencijos ir talentai, leidžiantys visuomenei ir specialistams kurti bei atsakingai taikyti DI.'),
    ('P2', null, 'parent', 'II kryptis: DI sklaidą remianti saugi technologijų infrastruktūra ir duomenys', 'Patikima duomenų ir technologijų infrastruktūra DI sprendimų kūrimui, diegimui ir mastelio didinimui.'),
    ('P3', null, 'parent', 'III kryptis: DI tarnaujantis visuomenei', 'Koordinuotas, etiškas ir vertę viešajam sektoriui kuriantis DI taikymas.'),
    ('P4', null, 'parent', 'IV kryptis: DI kaip ekonominis variklis', 'Priemonės, kurios spartina DI diegimą versle ir didina Lietuvos konkurencingumą.'),

    -- Child guidelines (uždaviniai)
    ('C1_1', 'P1', 'child', 'Uždavinys 1.1: Didinti visuomenės DI raštingumo lygį', 'Kelti visuomenės DI raštingumą per programas, modelius ir švietimo sistemą.'),
    ('C1_2', 'P1', 'child', 'Uždavinys 1.2: Didinti DI specialistų skaičių', 'Auginti DI specialistų pasiūlą per studijas, talentų pritraukimą ir perkvalifikavimą.'),
    ('C1_3', 'P1', 'child', 'Uždavinys 1.3: Stiprinti aukšto lygio DI kompetencijas', 'Stiprinti DI mokslinių tyrimų ir doktorantūros potencialą.'),

    ('C2_1', 'P2', 'child', 'Uždavinys 2.1: Užtikrinti prieigą prie duomenų infrastruktūrų, duomenų kokybę, saugią prieigą prie duomenų ir efektyvų jų panaudojimą', 'Didinti duomenų prieinamumą, kokybę ir pakartotinį panaudojimą DI poreikiams.'),
    ('C2_2', 'P2', 'child', 'Uždavinys 2.2: Sukurti modernią, saugią, suverenią DI technologijų infrastruktūrą', 'Vystyti nacionalinius ir tarptautinius skaičiavimo bei debesijos pajėgumus.'),
    ('C2_3', 'P2', 'child', 'Uždavinys 2.3: Įveiklinti modernią, saugią ir suverenią DI duomenų ir technologijų infrastruktūrą', 'Užtikrinti infrastruktūros panaudojimą per investicijas, saugumą ir valdymo modelį.'),

    ('C3_1', 'P3', 'child', 'Uždavinys 3.1: Skatinti koordinuotą DI sprendimų kūrimą ir diegimą viešajame sektoriuje', 'Kurti mechanizmus, metodiką ir paskatas saugiam DI diegimui viešajame sektoriuje.'),
    ('C3_2', 'P3', 'child', 'Uždavinys 3.2: Didinti viešojo sektoriaus darbuotojų DI kompetencijas', 'Diegti nuolatinį viešojo sektoriaus DI kompetencijų ugdymo modelį.'),
    ('C3_3', 'P3', 'child', 'Uždavinys 3.3: Pasitelkti viešuosius pirkimus patikimų DI sprendimų įsigijimui', 'Viešųjų pirkimų priemonėmis didinti patikimų DI sprendimų paklausą ir diegimą.'),

    ('C4_1', 'P4', 'child', 'Uždavinys 4.1: Didinti įmonių, naudojančių DI, skaičių', 'Skatinti DI diegimą įmonėse per finansines ir organizacines priemones.'),
    ('C4_2', 'P4', 'child', 'Uždavinys 4.2: Pritraukti finansavimą DI sprendimų diegimui ir vystymui', 'Didinti privataus ir viešojo kapitalo prieinamumą DI sprendimams.'),
    ('C4_3', 'P4', 'child', 'Uždavinys 4.3: Sukurti aiškią ir palankią DI reguliacinę sistemą', 'Sukurti reguliacinį aiškumą ir testavimo aplinkas saugiam DI diegimui.'),

    -- Orphan guidelines (skersinės temos)
    ('O1', null, 'orphan', 'Skersinė tema: Rodiklių stebėsena ir poveikio vertinimas', 'Stebėti tikslų ir uždavinių pažangą bei vertinti iniciatyvų poveikį nacionaliniu mastu.'),
    ('O2', null, 'orphan', 'Skersinė tema: Iniciatyvų įgyvendinimo užtikrinimas', 'Užtikrinti koordinuotą įgyvendinimą, atsakomybes, terminus ir finansinį tvarumą.')
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
  case
    when s.relation_type = 'child' then (
      select gp.id
      from guidelines_src ps
      join strategy_guidelines gp
        on lower(gp.title) = lower(ps.title)
      where ps.code = s.parent_code
        and gp.cycle_id = t.id
      limit 1
    )
    else null
  end,
  'auto',
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
  where i.slug = 'eimin'
  order by c.created_at desc
  limit 1
),
guidelines_src(code, parent_code, relation_type, title, description) as (
  values
    ('P1', null, 'parent', 'I kryptis: DI įgalinantis žmogų', 'Kompetencijos ir talentai, leidžiantys visuomenei ir specialistams kurti bei atsakingai taikyti DI.'),
    ('P2', null, 'parent', 'II kryptis: DI sklaidą remianti saugi technologijų infrastruktūra ir duomenys', 'Patikima duomenų ir technologijų infrastruktūra DI sprendimų kūrimui, diegimui ir mastelio didinimui.'),
    ('P3', null, 'parent', 'III kryptis: DI tarnaujantis visuomenei', 'Koordinuotas, etiškas ir vertę viešajam sektoriui kuriantis DI taikymas.'),
    ('P4', null, 'parent', 'IV kryptis: DI kaip ekonominis variklis', 'Priemonės, kurios spartina DI diegimą versle ir didina Lietuvos konkurencingumą.'),
    ('C1_1', 'P1', 'child', 'Uždavinys 1.1: Didinti visuomenės DI raštingumo lygį', 'Kelti visuomenės DI raštingumą per programas, modelius ir švietimo sistemą.'),
    ('C1_2', 'P1', 'child', 'Uždavinys 1.2: Didinti DI specialistų skaičių', 'Auginti DI specialistų pasiūlą per studijas, talentų pritraukimą ir perkvalifikavimą.'),
    ('C1_3', 'P1', 'child', 'Uždavinys 1.3: Stiprinti aukšto lygio DI kompetencijas', 'Stiprinti DI mokslinių tyrimų ir doktorantūros potencialą.'),
    ('C2_1', 'P2', 'child', 'Uždavinys 2.1: Užtikrinti prieigą prie duomenų infrastruktūrų, duomenų kokybę, saugią prieigą prie duomenų ir efektyvų jų panaudojimą', 'Didinti duomenų prieinamumą, kokybę ir pakartotinį panaudojimą DI poreikiams.'),
    ('C2_2', 'P2', 'child', 'Uždavinys 2.2: Sukurti modernią, saugią, suverenią DI technologijų infrastruktūrą', 'Vystyti nacionalinius ir tarptautinius skaičiavimo bei debesijos pajėgumus.'),
    ('C2_3', 'P2', 'child', 'Uždavinys 2.3: Įveiklinti modernią, saugią ir suverenią DI duomenų ir technologijų infrastruktūrą', 'Užtikrinti infrastruktūros panaudojimą per investicijas, saugumą ir valdymo modelį.'),
    ('C3_1', 'P3', 'child', 'Uždavinys 3.1: Skatinti koordinuotą DI sprendimų kūrimą ir diegimą viešajame sektoriuje', 'Kurti mechanizmus, metodiką ir paskatas saugiam DI diegimui viešajame sektoriuje.'),
    ('C3_2', 'P3', 'child', 'Uždavinys 3.2: Didinti viešojo sektoriaus darbuotojų DI kompetencijas', 'Diegti nuolatinį viešojo sektoriaus DI kompetencijų ugdymo modelį.'),
    ('C3_3', 'P3', 'child', 'Uždavinys 3.3: Pasitelkti viešuosius pirkimus patikimų DI sprendimų įsigijimui', 'Viešųjų pirkimų priemonėmis didinti patikimų DI sprendimų paklausą ir diegimą.'),
    ('C4_1', 'P4', 'child', 'Uždavinys 4.1: Didinti įmonių, naudojančių DI, skaičių', 'Skatinti DI diegimą įmonėse per finansines ir organizacines priemones.'),
    ('C4_2', 'P4', 'child', 'Uždavinys 4.2: Pritraukti finansavimą DI sprendimų diegimui ir vystymui', 'Didinti privataus ir viešojo kapitalo prieinamumą DI sprendimams.'),
    ('C4_3', 'P4', 'child', 'Uždavinys 4.3: Sukurti aiškią ir palankią DI reguliacinę sistemą', 'Sukurti reguliacinį aiškumą ir testavimo aplinkas saugiam DI diegimui.'),
    ('O1', null, 'orphan', 'Skersinė tema: Rodiklių stebėsena ir poveikio vertinimas', 'Stebėti tikslų ir uždavinių pažangą bei vertinti iniciatyvų poveikį nacionaliniu mastu.'),
    ('O2', null, 'orphan', 'Skersinė tema: Iniciatyvų įgyvendinimo užtikrinimas', 'Užtikrinti koordinuotą įgyvendinimą, atsakomybes, terminus ir finansinį tvarumą.')
)
update strategy_guidelines g
set
  description = s.description,
  relation_type = s.relation_type,
  parent_guideline_id = case when s.relation_type = 'child' then gp.id else null end,
  status = 'active',
  line_side = 'auto',
  updated_at = now()
from target_cycle t
join guidelines_src s on true
left join guidelines_src ps on ps.code = s.parent_code
left join strategy_guidelines gp
  on gp.cycle_id = t.id
 and lower(gp.title) = lower(ps.title)
where g.cycle_id = t.id
  and lower(g.title) = lower(s.title);

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eimin'
  order by c.created_at desc
  limit 1
),
guideline_src(code, title) as (
  values
    ('C1_1', 'Uždavinys 1.1: Didinti visuomenės DI raštingumo lygį'),
    ('C1_2', 'Uždavinys 1.2: Didinti DI specialistų skaičių'),
    ('C1_3', 'Uždavinys 1.3: Stiprinti aukšto lygio DI kompetencijas'),
    ('C2_1', 'Uždavinys 2.1: Užtikrinti prieigą prie duomenų infrastruktūrų, duomenų kokybę, saugią prieigą prie duomenų ir efektyvų jų panaudojimą'),
    ('C2_2', 'Uždavinys 2.2: Sukurti modernią, saugią, suverenią DI technologijų infrastruktūrą'),
    ('C2_3', 'Uždavinys 2.3: Įveiklinti modernią, saugią ir suverenią DI duomenų ir technologijų infrastruktūrą'),
    ('C3_1', 'Uždavinys 3.1: Skatinti koordinuotą DI sprendimų kūrimą ir diegimą viešajame sektoriuje'),
    ('C3_2', 'Uždavinys 3.2: Didinti viešojo sektoriaus darbuotojų DI kompetencijas'),
    ('C3_3', 'Uždavinys 3.3: Pasitelkti viešuosius pirkimus patikimų DI sprendimų įsigijimui'),
    ('C4_1', 'Uždavinys 4.1: Didinti įmonių, naudojančių DI, skaičių'),
    ('C4_2', 'Uždavinys 4.2: Pritraukti finansavimą DI sprendimų diegimui ir vystymui'),
    ('C4_3', 'Uždavinys 4.3: Sukurti aiškią ir palankią DI reguliacinę sistemą')
),
initiatives_src(guideline_code, title, description) as (
  values
    -- 1.1
    ('C1_1', 'Parengti ir vykdyti visuomenei skirtas DI kompetencijų didinimo programas', 'Skirtingoms gyventojų grupėms pritaikytos DI raštingumo programos.'),
    ('C1_1', 'Sukurti ir įgyvendinti DI kompetencijų valdymo modelį, skatinantį tolygų mokymų prieinamumą tarp institucijų ir regionų', 'Nacionalinis modelis, mažinantis kompetencijų atotrūkius tarp regionų ir institucijų.'),
    ('C1_1', 'Plėsti STEM ugdymą visais švietimo lygiais', 'Nuosekliai stiprinti STEM pagrindą DI kompetencijų augimui.'),

    -- 1.2
    ('C1_2', 'Didinti studentų, pasirengusių taikyti DI tarpdiscipliniškai, skaičių', 'Skatinti tarpdisciplinines DI studijas ir praktinį taikymą.'),
    ('C1_2', 'Pritraukti ir išlaikyti DI talentus', 'Kurti konkurencingas sąlygas Lietuvos ir užsienio DI talentams.'),
    ('C1_2', 'Organizuoti kvalifikacijos kėlimo ir perkvalifikavimo programas, orientuotas į praktinius DI diegimo, atsakingo naudojimo ir vystymo įgūdžius specialistams bei vadovams', 'Plėtoti nuolatinį specialistų ir vadovų perkvalifikavimą DI srityje.'),

    -- 1.3
    ('C1_3', 'Didinti DI doktorantų skaičių', 'Plėsti DI doktorantūros vietas ir finansavimą.'),
    ('C1_3', 'Pritraukti ir išlaikyti DI tyrėjus', 'Stiprinti aukšto lygio tyrėjų pritraukimo ir išlaikymo priemones.'),
    ('C1_3', 'Plėtoti aukšto lygio DI mokslinių tyrimų potencialą', 'Gerinti infrastruktūrą ir tarptautinį bendradarbiavimą pažangiems DI tyrimams.'),

    -- 2.1
    ('C2_1', 'Skatinti duomenų, sukurtų už viešąsias lėšas, tvarkymą, pakartotinį panaudojimą ir atvėrimą', 'Didinti viešojo sektoriaus duomenų kokybę, atvėrimą ir pakartotinį panaudojimą.'),
    ('C2_1', 'Didinti struktūruotų įmonių bei viešojo sektoriaus duomenų rinkinių apimtis', 'Auginti struktūruotų ir DI paruoštų duomenų rinkinių kiekį.'),
    ('C2_1', 'Supaprastinti prieigos prie viešojo sektoriaus ir ES duomenų infrastruktūrų procesus, sudarant sąlygas įmonėms, mokslo ir viešojo sektoriaus institucijoms jomis efektyviai naudotis', 'Mažinti duomenų prieigos kliūtis verslui, mokslui ir viešajam sektoriui.'),

    -- 2.2
    ('C2_2', 'Vystyti nacionalinius debesijos išteklius', 'Plėtoti saugią ir suverenią nacionalinę debesijos infrastruktūrą.'),
    ('C2_2', 'Vystyti nacionalinius aukštos spartos skaičiavimo infrastruktūros išteklius', 'Didinti HPC pajėgumus DI modelių kūrimui ir diegimui.'),
    ('C2_2', 'Gerinti prieigą prie tarptautinių debesijos ir aukštos spartos skaičiavimo resursų', 'Išplėsti prieigą prie ES ir kitų tarptautinių skaičiavimo išteklių.'),

    -- 2.3
    ('C2_3', 'Pritraukti tiesiogines užsienio investicijas duomenų ir technologijų infrastruktūros vystymui', 'Skatinti FDI į duomenų centrus, infrastruktūrą ir DI ekosistemą.'),
    ('C2_3', 'Sukurti tvarią kibernetinio saugumo ekosistemą, užtikrinančią duomenų ir technologijų infrastruktūros apsaugą', 'Užtikrinti infrastruktūros atsparumą ir kibernetinį saugumą.'),
    ('C2_3', 'Sukurti ir įdiegti sisteminį, tvarų ir atsakingą duomenų ir technologijų infrastruktūros valdymo bei finansavimo modelį', 'Įtvirtinti ilgalaikį infrastruktūros valdymo ir finansavimo modelį.'),

    -- 3.1
    ('C3_1', 'Sukurti metodinius įrankius ir teikti ekspertines konsultacijas dėl saugaus DI sprendimų kūrimo ir diegimo', 'Parengti metodiką ir ekspertinę pagalbą atsakingam DI diegimui viešajame sektoriuje.'),
    ('C3_1', 'Sukurti finansines paskatas brandžioms DI inovacijoms', 'Skatinti aukštos vertės DI inovacijų kūrimą ir taikymą viešajame sektoriuje.'),
    ('C3_1', 'Skatinti bendro naudojimo DI sprendimus ir sukurti nacionalinį DI duomenų ir modelių katalogą, paremtą atviros prieigos principu', 'Mažinti dubliavimą ir didinti bendrą DI sprendimų panaudojimą.'),

    -- 3.2
    ('C3_2', 'Sukurti nacionalinį DI kompetencijų tobulinimo modelį viešajam sektoriui', 'Įdiegti sisteminį viešojo sektoriaus darbuotojų DI gebėjimų tobulinimą.'),
    ('C3_2', 'Sukurti ir įgyvendinti DI mokymų programas, kurios atlieptų valdžios institucijų ir įstaigų veiklos poreikius', 'Užtikrinti praktinius, institucijų poreikius atitinkančius DI mokymus.'),
    ('C3_2', 'Sukurti DI kompetencijų stebėsenos ir vertinimo sistemą', 'Matuoti DI kompetencijų augimą ir planuoti tikslines intervencijas.'),

    -- 3.3
    ('C3_3', 'Parengti viešųjų pirkimų gaires, kurios padėtų valdžios institucijoms ir įstaigoms užsakyti patikimus DI sprendimus', 'Standartizuoti DI pirkimus ir mažinti įsigijimo rizikas.'),
    ('C3_3', 'Sukurti mechanizmą, kuris įgalintų centralizuotus DI sprendimų pirkimus', 'Sudaryti sąlygas bendriems ir efektyvesniems DI pirkimams.'),
    ('C3_3', 'Įsteigti ankstyvo viešojo sektoriaus ir rinkos dialogo platformą', 'Ankstyvu dialogu gerinti viešojo sektoriaus ir rinkos DI sprendimų atitiktį.'),

    -- 4.1
    ('C4_1', 'Esamų finansavimo mechanizmų efektyvinimas', 'Greitinti ir supaprastinti finansavimo instrumentų veikimą DI projektams.'),
    ('C4_1', 'Tikslinių finansavimo priemonių kūrimas', 'Kurti specializuotas finansines priemones DI diegimui versle.'),
    ('C4_1', 'Privačių įmonių skatinimas finansuoti DI MTEPI', 'Skatinti privataus sektoriaus investicijas į DI mokslinius tyrimus ir eksperimentinę plėtrą.'),

    -- 4.2
    ('C4_2', 'Pritraukti užsienio rizikos kapitalo fondus', 'Didinti tarptautinio rizikos kapitalo prieinamumą Lietuvos DI įmonėms.'),
    ('C4_2', 'Skatinti ILTE priemones, didinančias rizikos kapitalo investicijas į įmones', 'Plėsti ILTE instrumentus DI orientuotam investavimui.'),
    ('C4_2', 'Supažindinti Lietuvoje veikiančius subjektus su ES finansavimo priemonėmis bei konsultuoti paraiškų teikimo procese', 'Padėti įmonėms ir institucijoms efektyviai pritraukti ES finansavimą.'),

    -- 4.3
    ('C4_3', 'Plėsti reguliacinės DI smėliadėžės veiklos apimtis, kuriant konkretiems sektoriams pritaikytas aplinkas ir pritraukiant DI įmones', 'Sektorinėmis smėliadėžėmis spartinti patikimų DI sprendimų testavimą ir diegimą.'),
    ('C4_3', 'Užtikrinti aktyvų Lietuvos interesų atstovavimą ES lygmeniu', 'Nuosekliai atstovauti Lietuvos poziciją formuojant ES DI reguliavimą.'),
    ('C4_3', 'Sukurti viešojo sektoriaus DI smėliadėžę, leidžiančią saugiai kurti ir testuoti DI sprendimus', 'Viešajame sektoriuje sudaryti saugią aplinką DI sprendimų kūrimui ir testavimui.')
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
  i.title,
  i.description,
  'active',
  'auto',
  null
from target_cycle t
cross join initiatives_src i
where not exists (
  select 1
  from strategy_initiatives si
  where si.cycle_id = t.id
    and lower(si.title) = lower(i.title)
);

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eimin'
  order by c.created_at desc
  limit 1
)
update strategy_initiatives si
set
  status = 'active',
  line_side = 'auto',
  updated_at = now()
from target_cycle t
where si.cycle_id = t.id;

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eimin'
  order by c.created_at desc
  limit 1
),
guideline_src(code, title) as (
  values
    ('C1_1', 'Uždavinys 1.1: Didinti visuomenės DI raštingumo lygį'),
    ('C1_2', 'Uždavinys 1.2: Didinti DI specialistų skaičių'),
    ('C1_3', 'Uždavinys 1.3: Stiprinti aukšto lygio DI kompetencijas'),
    ('C2_1', 'Uždavinys 2.1: Užtikrinti prieigą prie duomenų infrastruktūrų, duomenų kokybę, saugią prieigą prie duomenų ir efektyvų jų panaudojimą'),
    ('C2_2', 'Uždavinys 2.2: Sukurti modernią, saugią, suverenią DI technologijų infrastruktūrą'),
    ('C2_3', 'Uždavinys 2.3: Įveiklinti modernią, saugią ir suverenią DI duomenų ir technologijų infrastruktūrą'),
    ('C3_1', 'Uždavinys 3.1: Skatinti koordinuotą DI sprendimų kūrimą ir diegimą viešajame sektoriuje'),
    ('C3_2', 'Uždavinys 3.2: Didinti viešojo sektoriaus darbuotojų DI kompetencijas'),
    ('C3_3', 'Uždavinys 3.3: Pasitelkti viešuosius pirkimus patikimų DI sprendimų įsigijimui'),
    ('C4_1', 'Uždavinys 4.1: Didinti įmonių, naudojančių DI, skaičių'),
    ('C4_2', 'Uždavinys 4.2: Pritraukti finansavimą DI sprendimų diegimui ir vystymui'),
    ('C4_3', 'Uždavinys 4.3: Sukurti aiškią ir palankią DI reguliacinę sistemą')
),
initiative_link_src(guideline_code, initiative_title) as (
  values
    ('C1_1', 'Parengti ir vykdyti visuomenei skirtas DI kompetencijų didinimo programas'),
    ('C1_1', 'Sukurti ir įgyvendinti DI kompetencijų valdymo modelį, skatinantį tolygų mokymų prieinamumą tarp institucijų ir regionų'),
    ('C1_1', 'Plėsti STEM ugdymą visais švietimo lygiais'),

    ('C1_2', 'Didinti studentų, pasirengusių taikyti DI tarpdiscipliniškai, skaičių'),
    ('C1_2', 'Pritraukti ir išlaikyti DI talentus'),
    ('C1_2', 'Organizuoti kvalifikacijos kėlimo ir perkvalifikavimo programas, orientuotas į praktinius DI diegimo, atsakingo naudojimo ir vystymo įgūdžius specialistams bei vadovams'),

    ('C1_3', 'Didinti DI doktorantų skaičių'),
    ('C1_3', 'Pritraukti ir išlaikyti DI tyrėjus'),
    ('C1_3', 'Plėtoti aukšto lygio DI mokslinių tyrimų potencialą'),

    ('C2_1', 'Skatinti duomenų, sukurtų už viešąsias lėšas, tvarkymą, pakartotinį panaudojimą ir atvėrimą'),
    ('C2_1', 'Didinti struktūruotų įmonių bei viešojo sektoriaus duomenų rinkinių apimtis'),
    ('C2_1', 'Supaprastinti prieigos prie viešojo sektoriaus ir ES duomenų infrastruktūrų procesus, sudarant sąlygas įmonėms, mokslo ir viešojo sektoriaus institucijoms jomis efektyviai naudotis'),

    ('C2_2', 'Vystyti nacionalinius debesijos išteklius'),
    ('C2_2', 'Vystyti nacionalinius aukštos spartos skaičiavimo infrastruktūros išteklius'),
    ('C2_2', 'Gerinti prieigą prie tarptautinių debesijos ir aukštos spartos skaičiavimo resursų'),

    ('C2_3', 'Pritraukti tiesiogines užsienio investicijas duomenų ir technologijų infrastruktūros vystymui'),
    ('C2_3', 'Sukurti tvarią kibernetinio saugumo ekosistemą, užtikrinančią duomenų ir technologijų infrastruktūros apsaugą'),
    ('C2_3', 'Sukurti ir įdiegti sisteminį, tvarų ir atsakingą duomenų ir technologijų infrastruktūros valdymo bei finansavimo modelį'),

    ('C3_1', 'Sukurti metodinius įrankius ir teikti ekspertines konsultacijas dėl saugaus DI sprendimų kūrimo ir diegimo'),
    ('C3_1', 'Sukurti finansines paskatas brandžioms DI inovacijoms'),
    ('C3_1', 'Skatinti bendro naudojimo DI sprendimus ir sukurti nacionalinį DI duomenų ir modelių katalogą, paremtą atviros prieigos principu'),

    ('C3_2', 'Sukurti nacionalinį DI kompetencijų tobulinimo modelį viešajam sektoriui'),
    ('C3_2', 'Sukurti ir įgyvendinti DI mokymų programas, kurios atlieptų valdžios institucijų ir įstaigų veiklos poreikius'),
    ('C3_2', 'Sukurti DI kompetencijų stebėsenos ir vertinimo sistemą'),

    ('C3_3', 'Parengti viešųjų pirkimų gaires, kurios padėtų valdžios institucijoms ir įstaigoms užsakyti patikimus DI sprendimus'),
    ('C3_3', 'Sukurti mechanizmą, kuris įgalintų centralizuotus DI sprendimų pirkimus'),
    ('C3_3', 'Įsteigti ankstyvo viešojo sektoriaus ir rinkos dialogo platformą'),

    ('C4_1', 'Esamų finansavimo mechanizmų efektyvinimas'),
    ('C4_1', 'Tikslinių finansavimo priemonių kūrimas'),
    ('C4_1', 'Privačių įmonių skatinimas finansuoti DI MTEPI'),

    ('C4_2', 'Pritraukti užsienio rizikos kapitalo fondus'),
    ('C4_2', 'Skatinti ILTE priemones, didinančias rizikos kapitalo investicijas į įmones'),
    ('C4_2', 'Supažindinti Lietuvoje veikiančius subjektus su ES finansavimo priemonėmis bei konsultuoti paraiškų teikimo procese'),

    ('C4_3', 'Plėsti reguliacinės DI smėliadėžės veiklos apimtis, kuriant konkretiems sektoriams pritaikytas aplinkas ir pritraukiant DI įmones'),
    ('C4_3', 'Užtikrinti aktyvų Lietuvos interesų atstovavimą ES lygmeniu'),
    ('C4_3', 'Sukurti viešojo sektoriaus DI smėliadėžę, leidžiančią saugiai kurti ir testuoti DI sprendimus')
)
insert into strategy_initiative_guidelines (id, initiative_id, guideline_id)
select
  gen_random_uuid(),
  si.id,
  sg.id
from target_cycle t
join initiative_link_src l on true
join guideline_src gs on gs.code = l.guideline_code
join strategy_initiatives si
  on si.cycle_id = t.id
 and lower(si.title) = lower(l.initiative_title)
join strategy_guidelines sg
  on sg.cycle_id = t.id
 and lower(sg.title) = lower(gs.title)
where not exists (
  select 1
  from strategy_initiative_guidelines ig
  where ig.initiative_id = si.id
    and ig.guideline_id = sg.id
);

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eimin'
  order by c.created_at desc
  limit 1
)
update strategy_guidelines g
set
  line_side = 'auto',
  updated_at = now()
from target_cycle t
where g.cycle_id = t.id;

with target_cycle as (
  select c.id
  from strategy_cycles c
  join institutions i on i.id = c.institution_id
  where i.slug = 'eimin'
  order by c.created_at desc
  limit 1
)
update strategy_initiatives i
set
  line_side = 'auto',
  updated_at = now()
from target_cycle t
where i.cycle_id = t.id;

do $$
declare
  v_institution_id uuid;
  v_user_id uuid;
begin
  select id into v_institution_id
  from institutions
  where slug = 'eimin'
  limit 1;

  if v_institution_id is null then
    raise exception 'Institution with slug eimin was not found or created.';
  end if;

  select id into v_user_id
  from platform_users
  where lower(email) = 'test@test.com'
  limit 1;

  if v_user_id is null then
    raise exception 'User test@test.com not found. Create/activate this user first, then rerun.';
  end if;

  update platform_users
  set status = 'active'
  where id = v_user_id;

  insert into institution_memberships (id, institution_id, user_id, role, status)
  values (gen_random_uuid(), v_institution_id, v_user_id, 'institution_admin', 'active')
  on conflict (institution_id, user_id)
  do update set role = 'institution_admin', status = 'active';
end $$;
