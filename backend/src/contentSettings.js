const GUIDE_INTRO_KEY = 'guide_intro_text';
const ABOUT_TEXT_KEY = 'about_text';
const MAX_CONTENT_TEXT_LENGTH = 40000;
let contentSettingsSchemaReady = false;

async function tableExists(query, qualifiedTableName) {
  const result = await query('select to_regclass($1) as table_name', [qualifiedTableName]);
  return Boolean(result.rows?.[0]?.table_name);
}

const DEFAULT_GUIDE_INTRO_TEXT = [
  'digistrategija.lt sistema skirta patogiam jūsų institucijos strategijos rengimo procesui. Patogiai susikurkite gairių struktūrą ir priskirkite konkrečias iniciatyvas tų gairių įgyvendinimui.',
  'Sistema susideda iš 2 pagrindinių dalių:',
  '1. Kortelių valdymo modulio (Gairės ir Iniciatyvos) - čia jūsų kolegos gali komentuoti, siūlyti įvairias strategijos kryptis, balsuoti už vieni kitų teiktus pasiūlymus.',
  '2. Strategijų žemėlapis - patogus vizualinis įrankis peržiūrėti strategijos struktūrą ir ryšius tarp skirtingų jų elementų.',
  'Galutinį savo interaktyvų strategijos žemėlapį įkelkite į intranetą ar vidinį puslapį su embeding funkcionalumu. Sistema skirta valstybinėms institucijoms kurios nori savo strategijos kūrimo procesą vykdyti efektyviai.'
].join('\n');

const DEFAULT_ABOUT_TEXT = [
  'Lietuvos viešajame sektoriuje skaitmenizacija vis dažniau suvokiama ne kaip pavienių IT projektų rinkinys, o kaip sisteminis pokytis, apimantis paslaugų kokybę, duomenų valdymą ir naujų technologijų taikymą. Todėl vis didesnę reikšmę įgyja ne tik technologiniai sprendimai, bet ir aiškios, įgyvendinamos skaitmenizacijos strategijos (arba IT plėtros planai).',
  'Praktika rodo, kad tradiciniai, didelės apimties strateginiai dokumentai dažnai tampa sunkiai pritaikomi greitai besikeičiančioje aplinkoje. Dėl to vis daugiau dėmesio skiriama lanksčioms, įtraukioms ir duomenimis grįstoms strategijų formavimo praktikoms, kurios leidžia greičiau susitarti dėl prioritetų ir krypties.',
  'Vienas iš būdų tai pasiekti - aiškiai išsigryninti pagrindines ašis, aplink kurias sukasi dauguma sprendimų:',
  '- Kokybiškų paslaugų teikimas (vidiniams ir išoriniams naudotojams).\n- Duomenų kokybė ir duomenų valdymas (data governance).\n- Tikslingas dirbtinio intelekto taikymas (AI with purpose).',
  'Svarbi ne tik strategijos kryptis, bet ir pats jos rengimo procesas - jis turi būti suprantamas, įtraukiantis ir skatinantis bendrą atsakomybę. Tam vis dažniau pasitelkiami paprasti skaitmeniniai įrankiai, leidžiantys dalyviams siūlyti gaires, jas komentuoti, balsuoti ir viešai matyti bendrus rezultatus. Tokie sprendimai skatina skaidrumą, tarpinstitucinį mokymąsi ir gerosios praktikos dalijimąsi.',
  'Šiame kontekste atsirado www.digistrategija.lt - eksperimentinis, atviras įrankis, skirtas skaitmenizacijos strategijų ar IT plėtros planų gairėms formuoti ir prioritetizuoti. Jis leidžia dalyviams struktūruotai įsitraukti į strateginį procesą ir padeda greičiau pereiti nuo abstrakčių idėjų prie aiškių sprendimų krypčių.',
  'Svarbu pabrėžti, kad tai nėra enterprise lygio ar sertifikuotas sprendimas - veikiau praktinis eksperimentas, skirtas parodyti, kaip pasitelkiant šiuolaikines technologijas ir dirbtinį intelektą galima greitai sukurti veikiančius, naudotojams suprantamus įrankius.',
  'Dirbtinis intelektas ir skaitmeniniai sprendimai jau keičia viešojo sektoriaus veiklos modelius. Organizacijos, kurios drąsiai eksperimentuoja, augina kompetencijas ir taiko technologijas tikslingai, turi realią galimybę judėti greičiau ir išlikti konkurencingos sparčiai besikeičiančioje aplinkoje.'
].join('\n\n');

function normalizeStoredValue(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}

function createBadRequestError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function ensureContentSettingsTable(query) {
  if (contentSettingsSchemaReady) return;
  try {
    await query(
      `create table if not exists platform_settings (
        key text primary key,
        value text not null,
        updated_at timestamptz not null default now()
      )`
    );
    contentSettingsSchemaReady = true;
  } catch (error) {
    if (String(error?.code || '') === '42501') {
      const exists = await tableExists(query, 'public.platform_settings');
      if (exists) {
        contentSettingsSchemaReady = true;
        return;
      }
    }
    throw error;
  }
}

async function loadContentSettings(query) {
  await ensureContentSettingsTable(query);
  const result = await query(
    'select key, value from platform_settings where key = any($1::text[])',
    [[GUIDE_INTRO_KEY, ABOUT_TEXT_KEY]]
  );
  const byKey = Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
  return {
    guideIntroText: normalizeStoredValue(byKey[GUIDE_INTRO_KEY], DEFAULT_GUIDE_INTRO_TEXT),
    aboutText: normalizeStoredValue(byKey[ABOUT_TEXT_KEY], DEFAULT_ABOUT_TEXT)
  };
}

function normalizeContentSettingsPatch(payload = {}) {
  const hasGuideIntroText = Object.prototype.hasOwnProperty.call(payload, 'guideIntroText');
  const hasAboutText = Object.prototype.hasOwnProperty.call(payload, 'aboutText');

  const patch = {};
  if (hasGuideIntroText) {
    const guideIntroText = String(payload.guideIntroText || '').trim();
    if (guideIntroText.length > MAX_CONTENT_TEXT_LENGTH) throw createBadRequestError('content text too long');
    patch.guideIntroText = guideIntroText;
  }
  if (hasAboutText) {
    const aboutText = String(payload.aboutText || '').trim();
    if (aboutText.length > MAX_CONTENT_TEXT_LENGTH) throw createBadRequestError('content text too long');
    patch.aboutText = aboutText;
  }
  return patch;
}

async function updateContentSettings(query, patch) {
  await ensureContentSettingsTable(query);
  if (Object.prototype.hasOwnProperty.call(patch, 'guideIntroText')) {
    const value = normalizeStoredValue(patch.guideIntroText, DEFAULT_GUIDE_INTRO_TEXT);
    await query(
      `insert into platform_settings (key, value, updated_at)
       values ($1, $2, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [GUIDE_INTRO_KEY, value]
    );
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'aboutText')) {
    const value = normalizeStoredValue(patch.aboutText, DEFAULT_ABOUT_TEXT);
    await query(
      `insert into platform_settings (key, value, updated_at)
       values ($1, $2, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [ABOUT_TEXT_KEY, value]
    );
  }
  return loadContentSettings(query);
}

module.exports = {
  DEFAULT_GUIDE_INTRO_TEXT,
  DEFAULT_ABOUT_TEXT,
  loadContentSettings,
  normalizeContentSettingsPatch,
  updateContentSettings
};
