const GUIDE_INTRO_LEGACY_KEY = 'guide_intro_text';
const ABOUT_TEXT_LEGACY_KEY = 'about_text';
const GUIDE_INTRO_LT_KEY = 'guide_intro_text_lt';
const GUIDE_INTRO_EN_KEY = 'guide_intro_text_en';
const ABOUT_TEXT_LT_KEY = 'about_text_lt';
const ABOUT_TEXT_EN_KEY = 'about_text_en';
const LANDING_TRANSLATIONS_LT_KEY = 'landing_translations_lt';
const LANDING_TRANSLATIONS_EN_KEY = 'landing_translations_en';
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

const DEFAULT_GUIDE_INTRO_TEXT_EN = [
  'digistrategija.lt is designed to make your institution strategy process practical and collaborative. Build a clear guideline structure and connect concrete initiatives to guideline delivery.',
  'The platform has 2 core parts:',
  '1. Card management module (Guidelines and Initiatives) where your colleagues can comment, suggest strategic directions, and vote on proposals.',
  '2. Strategy map - a visual tool to review structure and links between different strategy elements.',
  'Publish your interactive strategy map in intranet or internal pages using embed functionality. The system is designed for public institutions that want to run strategy creation more effectively.'
].join('\n');

const DEFAULT_ABOUT_TEXT_EN = [
  'Across public institutions, digital transformation is no longer seen as a set of isolated IT projects but as a systemic shift that affects service quality, data governance, and responsible adoption of emerging technologies.',
  'That is exactly why digistrategija.lt was created: to provide a practical, transparent workspace where strategy priorities can be discussed, structured, and translated into initiatives with clear ownership.',
  'The platform helps teams agree faster on what matters most, while preserving context and traceability for long-term institutional continuity.'
].join('\n\n');

function normalizeStoredValue(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeParseObject(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function normalizeTranslationsObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  Object.entries(value).forEach(([key, raw]) => {
    const normalizedKey = String(key || '').trim();
    if (!normalizedKey) return;
    const normalizedValue = String(raw || '').trim();
    if (!normalizedValue) return;
    out[normalizedKey] = normalizedValue;
  });
  return out;
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

async function upsertContentSetting(query, key, value) {
  await query(
    `insert into platform_settings (key, value, updated_at)
     values ($1, $2, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, value]
  );
}

async function loadContentSettings(query) {
  await ensureContentSettingsTable(query);
  const result = await query(
    'select key, value from platform_settings where key = any($1::text[])',
    [[
      GUIDE_INTRO_LEGACY_KEY,
      ABOUT_TEXT_LEGACY_KEY,
      GUIDE_INTRO_LT_KEY,
      GUIDE_INTRO_EN_KEY,
      ABOUT_TEXT_LT_KEY,
      ABOUT_TEXT_EN_KEY,
      LANDING_TRANSLATIONS_LT_KEY,
      LANDING_TRANSLATIONS_EN_KEY
    ]]
  );
  const byKey = Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
  const legacyGuideIntroText = normalizeStoredValue(byKey[GUIDE_INTRO_LEGACY_KEY], DEFAULT_GUIDE_INTRO_TEXT);
  const legacyAboutText = normalizeStoredValue(byKey[ABOUT_TEXT_LEGACY_KEY], DEFAULT_ABOUT_TEXT);
  const guideIntroTextLt = normalizeStoredValue(byKey[GUIDE_INTRO_LT_KEY], legacyGuideIntroText);
  const guideIntroTextEn = normalizeStoredValue(byKey[GUIDE_INTRO_EN_KEY], DEFAULT_GUIDE_INTRO_TEXT_EN);
  const aboutTextLt = normalizeStoredValue(byKey[ABOUT_TEXT_LT_KEY], legacyAboutText);
  const aboutTextEn = normalizeStoredValue(byKey[ABOUT_TEXT_EN_KEY], DEFAULT_ABOUT_TEXT_EN);
  return {
    guideIntroText: guideIntroTextLt,
    aboutText: aboutTextLt,
    guideIntroTextLt,
    guideIntroTextEn,
    aboutTextLt,
    aboutTextEn,
    landingTranslationsLt: normalizeTranslationsObject(safeParseObject(byKey[LANDING_TRANSLATIONS_LT_KEY])),
    landingTranslationsEn: normalizeTranslationsObject(safeParseObject(byKey[LANDING_TRANSLATIONS_EN_KEY]))
  };
}

function normalizeContentSettingsPatch(payload = {}) {
  const hasGuideIntroText = Object.prototype.hasOwnProperty.call(payload, 'guideIntroText');
  const hasAboutText = Object.prototype.hasOwnProperty.call(payload, 'aboutText');
  const hasGuideIntroTextLt = Object.prototype.hasOwnProperty.call(payload, 'guideIntroTextLt');
  const hasGuideIntroTextEn = Object.prototype.hasOwnProperty.call(payload, 'guideIntroTextEn');
  const hasAboutTextLt = Object.prototype.hasOwnProperty.call(payload, 'aboutTextLt');
  const hasAboutTextEn = Object.prototype.hasOwnProperty.call(payload, 'aboutTextEn');
  const hasLandingTranslationsLt = Object.prototype.hasOwnProperty.call(payload, 'landingTranslationsLt');
  const hasLandingTranslationsEn = Object.prototype.hasOwnProperty.call(payload, 'landingTranslationsEn');

  const normalizeTextPatch = (value) => {
    const normalized = String(value || '').trim();
    if (normalized.length > MAX_CONTENT_TEXT_LENGTH) throw createBadRequestError('content text too long');
    return normalized;
  };

  const patch = {};
  if (hasGuideIntroText) {
    patch.guideIntroTextLt = normalizeTextPatch(payload.guideIntroText);
  }
  if (hasAboutText) {
    patch.aboutTextLt = normalizeTextPatch(payload.aboutText);
  }
  if (hasGuideIntroTextLt) {
    patch.guideIntroTextLt = normalizeTextPatch(payload.guideIntroTextLt);
  }
  if (hasGuideIntroTextEn) {
    patch.guideIntroTextEn = normalizeTextPatch(payload.guideIntroTextEn);
  }
  if (hasAboutTextLt) {
    patch.aboutTextLt = normalizeTextPatch(payload.aboutTextLt);
  }
  if (hasAboutTextEn) {
    patch.aboutTextEn = normalizeTextPatch(payload.aboutTextEn);
  }
  if (hasLandingTranslationsLt) {
    const normalized = normalizeTranslationsObject(payload.landingTranslationsLt);
    const serialized = JSON.stringify(normalized);
    if (serialized.length > MAX_CONTENT_TEXT_LENGTH) throw createBadRequestError('content text too long');
    patch.landingTranslationsLt = normalized;
  }
  if (hasLandingTranslationsEn) {
    const normalized = normalizeTranslationsObject(payload.landingTranslationsEn);
    const serialized = JSON.stringify(normalized);
    if (serialized.length > MAX_CONTENT_TEXT_LENGTH) throw createBadRequestError('content text too long');
    patch.landingTranslationsEn = normalized;
  }
  return patch;
}

async function updateContentSettings(query, patch) {
  await ensureContentSettingsTable(query);
  if (Object.prototype.hasOwnProperty.call(patch, 'guideIntroTextLt')) {
    const value = normalizeStoredValue(patch.guideIntroTextLt, DEFAULT_GUIDE_INTRO_TEXT);
    await upsertContentSetting(query, GUIDE_INTRO_LEGACY_KEY, value);
    await upsertContentSetting(query, GUIDE_INTRO_LT_KEY, value);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'guideIntroTextEn')) {
    const value = normalizeStoredValue(patch.guideIntroTextEn, DEFAULT_GUIDE_INTRO_TEXT_EN);
    await upsertContentSetting(query, GUIDE_INTRO_EN_KEY, value);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'aboutTextLt')) {
    const value = normalizeStoredValue(patch.aboutTextLt, DEFAULT_ABOUT_TEXT);
    await upsertContentSetting(query, ABOUT_TEXT_LEGACY_KEY, value);
    await upsertContentSetting(query, ABOUT_TEXT_LT_KEY, value);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'aboutTextEn')) {
    const value = normalizeStoredValue(patch.aboutTextEn, DEFAULT_ABOUT_TEXT_EN);
    await upsertContentSetting(query, ABOUT_TEXT_EN_KEY, value);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'landingTranslationsLt')) {
    await upsertContentSetting(
      query,
      LANDING_TRANSLATIONS_LT_KEY,
      JSON.stringify(normalizeTranslationsObject(patch.landingTranslationsLt))
    );
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'landingTranslationsEn')) {
    await upsertContentSetting(
      query,
      LANDING_TRANSLATIONS_EN_KEY,
      JSON.stringify(normalizeTranslationsObject(patch.landingTranslationsEn))
    );
  }
  return loadContentSettings(query);
}

module.exports = {
  DEFAULT_GUIDE_INTRO_TEXT,
  DEFAULT_ABOUT_TEXT,
  DEFAULT_GUIDE_INTRO_TEXT_EN,
  DEFAULT_ABOUT_TEXT_EN,
  loadContentSettings,
  normalizeContentSettingsPatch,
  updateContentSettings
};
