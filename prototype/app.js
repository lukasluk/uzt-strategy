const steps = [
  {
    id: 'guidelines',
    title: 'GairÄ—s',
    hint: 'Aptarimas, balsavimas, komentarai',
    prompt: 'Kur link judesime ir kokia nauda kursime?'
  },
  {
    id: 'initiatives',
    title: 'Iniciatyvos',
    hint: 'Veiksmai, balsavimas, komentarai',
    prompt: 'Kokias konkrecias iniciatyvas igyvendinsime?'
  }
];

const introSlides = [
  {
    title: '1. Pasirinkite institucija',
    body: 'digistrategy.eu sistema skirta patogiam jusu institucijos strategijos rengimo procesui.',
    points: [
      'Virsuje desineje pasirinkite institucija, kurios strategija norite perziureti ar administruoti.',
      'Institucija galima keisti bet kada, duomenys persikrauna automatiskai.'
    ]
  },
  {
    title: '2. Sukurkite gairiu struktura',
    body: 'Patogiai susikurkite gairiu struktura ir aiskiai apibrezkite strategijos kryptis.',
    points: [
      'Gaires grupuojamos pagal rysius: tevines, vaikines ir naslaitines.',
      'Tai pagrindinis korteliu valdymo modulio etapas.'
    ]
  },
  {
    title: '3. Priskirkite iniciatyvas',
    body: 'Skiltyje "Iniciatyvos" priskirkite konkrecias iniciatyvas gairiu igyvendinimui.',
    points: [
      'Kiekviena iniciatyva turi buti susieta bent su viena gaire.',
      'Taip kuriamas aiskus rysys tarp krypties ir veiksmu.'
    ]
  },
  {
    title: '4. Komentuokite ir siulykite kryptis',
    body: 'Korteliu valdymo modulyje jusu kolegos gali komentuoti ir siulyti ivairias strategijos kryptis.',
    points: [
      'Diskusijos vyksta prie konkreciu gairiu ir iniciatyvu.',
      'Neprisijunges lankytojas mato tik viesa informacija.'
    ]
  },
  {
    title: '5. Balsuokite uz pasiulymus',
    body: 'Nariai gali balsuoti uz vieni kitu teiktus pasiulymus gairiuose ir iniciatyvose.',
    points: [
      'Balsai skiriami "+" ir "-" mygtukais.',
      'Kol ciklas atviras, balsus galima koreguoti.'
    ]
  },
  {
    title: '6. Naudokite strategiju zemelapi',
    body: 'Strategiju zemelapis yra patogus vizualinis irankis perziureti strategijos struktura ir elementu rysius.',
    points: [
      'Galite perjungti sluoksnius "GairÄ—s" ir "Iniciatyvos".',
      'Galima centruoti vaizda, priartinti ir naudoti pilno ekrano rezima.'
    ]
  },
  {
    title: '7. Uzbaikite strategijos cikla',
    body: 'Kai diskusijos baigtos, administratorius uzdaro cikla ir strategija lieka perziuros rezime.',
    points: [
      'Uzdarytame cikle balsavimas ir komentavimas isjungiami.',
      'Santrauka galima eksportuoti i teksta arba JSON.'
    ]
  },
  {
    title: '8. Ikelkite zemelapi su embed funkcija',
    body: 'Galutini interaktyvu strategijos zemelapi ikelkite i intraneta ar vidini puslapi naudodami embedding funkcionaluma.',
    points: [
      'Admin skiltyje "Embed: Strategiju zemelapis" nukopijuokite paruosta iframe koda.',
      'Sistema skirta valstybinems institucijoms, siekiancioms strategijos kurimo procesa vykdyti efektyviai.'
    ]
  }
];

const DEFAULT_MISSION_TEXT = 'Organizacijos paskirtis ir vertes kurimo logika.';
const DEFAULT_VISION_TEXT = 'Ilgalaike kryptis ir siekiama pokycio busena.';
const DEFAULT_GUIDE_INTRO_TEXT = [
  'digistrategy.eu sistema skirta patogiam jusu institucijos strategijos rengimo procesui. Patogiai susikurkite gairiu struktura ir priskirkite konkrecias iniciatyvas tu gairiu igyvendinimui.',
  'Sistema susideda is 2 pagrindiniu daliu:',
  '1. Korteliu valdymo modulio (GairÄ—s ir Iniciatyvos) - cia jusu kolegos gali komentuoti, siulyti ivairias strategijos kryptis, balsuoti uz vieni kitu teiktus pasiulymus.',
  '2. Strategiju zemelapis - patogus vizualinis irankis perziureti strategijos struktura ir rysius tarp skirtingu jos elementu.',
  'Galutini savo interaktyvu strategijos zemelapi ikelkite i intraneta ar vidini puslapi su embeding funkcionalumu. Sistema skirta valstybinems institucijoms, kurios nori savo strategijos kurimo procesa vykdyti efektyviai.'
].join('\\n');
const DEFAULT_ABOUT_TEXT = [
  'Lietuvos vieÅ¡ajame sektoriuje skaitmenizacija vis daÅ¾niau suvokiama ne kaip pavieniÅ³ IT projektÅ³ rinkinys, o kaip sisteminis pokytis, apimantis paslaugÅ³ kokybÄ™, duomenÅ³ valdymÄ… ir naujÅ³ technologijÅ³ taikymÄ…. TodÄ—l vis didesnÄ™ reikÅ¡mÄ™ Ä¯gyja ne tik technologiniai sprendimai, bet ir aiÅ¡kios, Ä¯gyvendinamos skaitmenizacijos strategijos (arba IT plÄ—tros planai).',
  'Praktika rodo, kad tradiciniai, didelÄ—s apimties strateginiai dokumentai daÅ¾nai tampa sunkiai pritaikomi greitai besikeiÄianÄioje aplinkoje. DÄ—l to vis daugiau dÄ—mesio skiriama lanksÄioms, Ä¯traukioms ir duomenimis grÄ¯stoms strategijÅ³ formavimo praktikoms, kurios leidÅ¾ia greiÄiau susitarti dÄ—l prioritetÅ³ ir krypties.',
  'Vienas iÅ¡ bÅ«dÅ³ tai pasiekti - aiÅ¡kiai iÅ¡sigryninti pagrindines aÅ¡is, aplink kurias sukasi dauguma sprendimÅ³:',
  '- KokybiÅ¡kÅ³ paslaugÅ³ teikimas (vidiniams ir iÅ¡oriniams naudotojams).\n- DuomenÅ³ kokybÄ— ir duomenÅ³ valdymas (data governance).\n- Tikslingas dirbtinio intelekto taikymas (AI with purpose).',
  'Svarbi ne tik strategijos kryptis, bet ir pats jos rengimo procesas - jis turi bÅ«ti suprantamas, Ä¯traukiantis ir skatinantis bendrÄ… atsakomybÄ™. Tam vis daÅ¾niau pasitelkiami paprasti skaitmeniniai Ä¯rankiai, leidÅ¾iantys dalyviams siÅ«lyti gaires, jas komentuoti, balsuoti ir vieÅ¡ai matyti bendrus rezultatus. Tokie sprendimai skatina skaidrumÄ…, tarpinstitucinÄ¯ mokymÄ…si ir gerosios praktikos dalijimÄ…si.',
  'Å iame kontekste atsirado digistrategy.eu - eksperimentinis, atviras Ä¯rankis, skirtas skaitmenizacijos strategijÅ³ ar IT plÄ—tros planÅ³ gairÄ—ms formuoti ir prioritetizuoti. Jis leidÅ¾ia dalyviams struktÅ«ruotai Ä¯sitraukti Ä¯ strateginÄ¯ procesÄ… ir padeda greiÄiau pereiti nuo abstrakÄiÅ³ idÄ—jÅ³ prie aiÅ¡kiÅ³ sprendimÅ³ krypÄiÅ³.',
  'Svarbu pabrÄ—Å¾ti, kad tai nÄ—ra enterprise lygio ar sertifikuotas sprendimas - veikiau praktinis eksperimentas, skirtas parodyti, kaip pasitelkiant Å¡iuolaikines technologijas ir dirbtinÄ¯ intelektÄ… galima greitai sukurti veikianÄius, naudotojams suprantamus Ä¯rankius.',
  'Dirbtinis intelektas ir skaitmeniniai sprendimai jau keiÄia vieÅ¡ojo sektoriaus veiklos modelius. Organizacijos, kurios drÄ…siai eksperimentuoja, augina kompetencijas ir taiko technologijas tikslingai, turi realiÄ… galimybÄ™ judÄ—ti greiÄiau ir iÅ¡likti konkurencingos sparÄiai besikeiÄianÄioje aplinkoje.'
].join('\n\n');
const DEFAULT_GUIDE_INTRO_TEXT_EN = [
  'digistrategy.eu is designed to make your institution strategy process practical and collaborative. Build a clear guideline structure and connect concrete initiatives to guideline delivery.',
  'The platform has 2 core parts:',
  '1. Card management module (Guidelines and Initiatives) where your colleagues can comment, suggest strategic directions, and vote on proposals.',
  '2. Strategy map - a visual tool to review structure and links between different strategy elements.',
  'Publish your interactive strategy map in intranet or internal pages using embed functionality. The system is designed for public institutions that want to run strategy creation more effectively.'
].join('\n');
const DEFAULT_ABOUT_TEXT_EN = [
  'Across public institutions, digital transformation is no longer seen as a set of isolated IT projects but as a systemic shift that affects service quality, data governance, and responsible adoption of emerging technologies.',
  'That is exactly why digistrategy.eu was created: to provide a practical, transparent workspace where strategy priorities can be discussed, structured, and translated into initiatives with clear ownership.',
  'The platform helps teams agree faster on what matters most, while preserving context and traceability for long-term institutional continuity.'
].join('\n\n');

const AUTH_STORAGE_KEY = 'uzt-strategy-v1-auth';
const STRATEGY_SELECTION_MEMORY_KEY = 'uzt-strategy-v1-strategy-memory';
const INTRO_COLLAPSED_KEY = 'uzt-strategy-v1-intro-collapsed';
const INTRO_VISITED_KEY = 'uzt-strategy-v1-intro-visited';
const VOTE_FLOATING_COLLAPSED_KEY = 'uzt-strategy-v1-vote-floating-collapsed';
const SIDEBAR_COLLAPSED_KEY = 'uzt-strategy-v1-sidebar-collapsed';
const DEFAULT_INSTITUTION_SLUG = '';
const WRITABLE_CYCLE_STATES = new Set(['open']);
const ALLOWED_VIEWS = new Set([
  'guidelines',
  'guideline-detail',
  'initiatives',
  'initiative-detail',
  'implementation-plan',
  'policy-alignment',
  'history',
  'admin',
  'map',
  'guide'
]);
const ADMIN_CACHE_BUST_PARAM = 't';
const EMBED_QUERY_KEY = 'embed';
const EMBED_MAP_VALUE = 'map';
const EMBED_MAP_PATH_PREFIX = '/embed/strategy-map';
const EMBED_BRAND_LINK = 'https://digistrategy.eu';
const APP_PATH_INSTITUTION_SEGMENT = 'institution';
const APP_PATH_STRATEGY_SEGMENT = 'strategy';
const APP_PATH_GUIDELINE_SEGMENT = 'guideline';
const APP_PATH_INITIATIVE_SEGMENT = 'initiative';
const FOCUS_GUIDELINE_QUERY_KEY = 'focusGuideline';
const FOCUS_INITIATIVE_QUERY_KEY = 'focusInitiative';
const IMPLEMENTATION_PLAN_QUERY_KEY = 'implementation';
const MAP_INSTITUTION_PULSE_MS = 10000;
const MAP_PLAN_PLAYBACK_MS = 10000;
const MAP_PLAN_PLAYBACK_OPTIONS = Object.freeze([10000, 30000, 60000, 300000]);
const STEP_ADD_SECTION_IDS = Object.freeze({
  guidelines: 'guidelineAddSection',
  initiatives: 'initiativeAddSection'
});
const INSTITUTION_INFO_FALLBACK = Object.freeze({
  uzt: { countryCode: 'LT', websiteUrl: 'https://uzt.lt' },
  eimin: { countryCode: 'LT', websiteUrl: 'https://eimin.lrv.lt' },
  govtech: { countryCode: 'LT', websiteUrl: 'https://govtechlab.lt' },
  vmi: { countryCode: 'LT', websiteUrl: 'https://www.vmi.lt' },
  vssa: { countryCode: 'LT', websiteUrl: '' }
});
const COUNTRY_LABELS = Object.freeze({
  LT: 'Lithuania'
});

const elements = {
  steps: document.getElementById('steps'),
  stepView: document.getElementById('stepView'),
  introDeck: document.getElementById('introDeck'),
  institutionPicker: document.getElementById('institutionPicker'),
  mainLayout: document.getElementById('mainLayout'),
  userBar: document.getElementById('userBar'),
  exportPanel: document.getElementById('exportPanel'),
  summaryText: document.getElementById('summaryText')
};

const EMBED_MAP_MODE = resolveEmbedMapMode();

const state = {
  embedMapMode: EMBED_MAP_MODE,
  institutionSlug: resolveInstitutionSlug(),
  strategySlug: resolveStrategySlug(),
  activeView: resolveInitialView(),
  introFirstVisit: hydrateIntroFirstVisit(),
  introCollapsed: hydrateIntroCollapsed(),
  introTogglePulse: false,
  introScrollAutoCollapsed: false,
  loading: false,
  busy: false,
  error: '',
  notice: '',
  institutions: [],
  institutionsLoaded: false,
  institution: null,
  strategy: null,
  cycle: null,
  summary: null,
  guidelines: [],
  initiatives: [],
  mapData: null,
  mapError: '',
  token: null,
  user: null,
  role: null,
  accountContext: null,
  context: null,
  userVotes: {},
  contentSettings: {
    guideIntroTextLt: DEFAULT_GUIDE_INTRO_TEXT,
    guideIntroTextEn: DEFAULT_GUIDE_INTRO_TEXT_EN,
    aboutTextLt: DEFAULT_ABOUT_TEXT,
    aboutTextEn: DEFAULT_ABOUT_TEXT_EN
  },
  commentsVisible: false,
  policyAlignments: [],
  policyAlignmentFrameworks: [],
  policyAlignmentFrameworkLoading: false,
  policyAlignmentFrameworkError: '',
  policyAlignmentFrameworkSelectedId: '',
  policyAlignmentFrameworkCurrent: null,
  policyAlignmentFrameworkDetailLoading: false,
  policyAlignmentFrameworkPollTimerId: 0,
  policyAlignmentAnalysisPollTimerId: 0,
  policyAlignmentLoading: false,
  policyAlignmentError: '',
  policyAlignmentCycleId: '',
  policyAlignmentSelectedId: '',
  policyAlignmentCurrent: null,
  policyAlignmentDetailLoading: false,
  policyAlignmentWorkspaceTab: 'frameworks',
  policyAlignmentAnalysisSubview: 'overview',
  policyAlignmentSidebarCollapsed: false,
  sidebarCollapsed: hydrateSidebarCollapsed(),
  policyAlignmentFilterStatus: 'all',
  policyAlignmentFilterTheme: 'all',
  policyAlignmentGroupBy: 'theme',
  historyEntries: [],
  historyRows: [],
  historyLoading: false,
  historyError: '',
  historyCycleId: '',
  historySortOrder: 'desc',
  mapLayer: 'guidelines',
  implementationPlanLayer: resolveInitialImplementationPlanLayer(),
  implementationPlanSubview: resolveInitialImplementationPlanSubview(),
  mapStrategicLinksData: null,
  mapStrategicLinksLoading: false,
  mapStrategicLinksError: '',
  mapStrategicLinksPromise: null,
  voteFloatingCollapsed: hydrateVoteFloatingCollapsed(),
  mapInitiativeFocusId: '',
  mapInitiativeHoverId: '',
  mapGuidelineFocusId: '',
  mapGuidelineHoverId: '',
  mapTransform: { x: 120, y: 80, scale: 1 },
  mapPlanProgress: 0,
  mapPlanPlaying: false,
  mapPlanAnimationFrameId: 0,
  mapZoomAnimationFrameId: 0,
  mapPlanPlaybackStartedAt: 0,
  mapPlanPlaybackMs: MAP_PLAN_PLAYBACK_MS,
  mapPlanSoundEnabled: true,
  mapSecretAnthracite: false,
  expandedStepId: '',
  strategySwitcherDialogOpen: false,
  routeEntityKind: resolveRouteEntityKind(),
  routeEntityId: resolveRouteEntityId(),
  pendingAddSectionScrollId: '',
  pendingGuidelineFocusId: resolveGuidelineFocusId(),
  pendingInitiativeFocusId: resolveInitiativeFocusId(),
  pendingMapFocusKind: '',
  pendingMapFocusId: '',
  mapInstitutionPulseUntil: 0,
  mapInstitutionPulseTimerId: 0
};
let adminAppLoadPromise = null;
let implementationPlanCalendarConnectorFrameId = 0;

hydrateAuthFromStorage();
markIntroVisited();
bindGlobal();
bootstrap();

function ensureAdminAppLoaded() {
  if (window.DigiAdminApp && typeof window.DigiAdminApp.mount === 'function') {
    return Promise.resolve(window.DigiAdminApp);
  }

  if (adminAppLoadPromise) return adminAppLoadPromise;

  adminAppLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('adminScriptLoader');
    if (existing) {
      const onLoad = () => {
        if (window.DigiAdminApp && typeof window.DigiAdminApp.mount === 'function') {
          resolve(window.DigiAdminApp);
        } else {
          reject(new Error('Admin scenarijus neinicijuotas.'));
        }
      };
      const onError = () => reject(new Error('Nepavyko Ä¯kelti admin.js'));
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'adminScriptLoader';
    script.async = true;
    script.src = `admin.js?${ADMIN_CACHE_BUST_PARAM}=${Date.now()}`;
    script.onload = () => {
      if (window.DigiAdminApp && typeof window.DigiAdminApp.mount === 'function') {
        resolve(window.DigiAdminApp);
      } else {
        reject(new Error('Admin scenarijus neinicijuotas.'));
      }
    };
    script.onerror = () => reject(new Error('Nepavyko Ä¯kelti admin.js'));
    document.body.appendChild(script);
  }).catch((error) => {
    adminAppLoadPromise = null;
    throw error;
  });

  return adminAppLoadPromise;
}

function hydrateIntroFirstVisit() {
  return localStorage.getItem(INTRO_VISITED_KEY) !== '1';
}

function markIntroVisited() {
  localStorage.setItem(INTRO_VISITED_KEY, '1');
}

function decodePathSegment(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseAppPathRoute() {
  const parts = String(window.location.pathname || '').split('/').filter(Boolean);
  if (!parts.length) {
    return {
      institutionSlug: '',
      strategySlug: '',
      focusKind: '',
      focusId: ''
    };
  }

  const first = String(parts[0] || '').trim().toLowerCase();
  if (first === APP_PATH_INSTITUTION_SEGMENT) {
    const institutionSlug = normalizeSlug(decodePathSegment(parts[1]));
    if (!institutionSlug) {
      return {
        institutionSlug: '',
        strategySlug: '',
        focusKind: '',
        focusId: ''
      };
    }

    const third = String(parts[2] || '').trim().toLowerCase();
    if (third !== APP_PATH_STRATEGY_SEGMENT) {
      return {
        institutionSlug,
        strategySlug: '',
        focusKind: '',
        focusId: ''
      };
    }

    const strategySlug = normalizeSlug(decodePathSegment(parts[3]));
    if (!strategySlug) {
      return {
        institutionSlug,
        strategySlug: '',
        focusKind: '',
        focusId: ''
      };
    }

    const focusSegment = String(parts[4] || '').trim().toLowerCase();
    const focusId = String(decodePathSegment(parts[5]) || '').trim();
    if (!focusSegment || !focusId) {
      return {
        institutionSlug,
        strategySlug,
        focusKind: '',
        focusId: ''
      };
    }

    const focusKind = focusSegment === APP_PATH_GUIDELINE_SEGMENT
      ? 'guideline'
      : (focusSegment === APP_PATH_INITIATIVE_SEGMENT ? 'initiative' : '');
    return {
      institutionSlug,
      strategySlug,
      focusKind,
      focusId: focusKind ? focusId : ''
    };
  }

  return {
    institutionSlug: '',
    strategySlug: '',
    focusKind: '',
    focusId: ''
  };
}

function resolveRouteEntityFromLocation() {
  const fromPath = parseAppPathRoute();
  if (fromPath.focusKind && fromPath.focusId) {
    return {
      kind: fromPath.focusKind,
      id: fromPath.focusId
    };
  }

  const params = new URLSearchParams(window.location.search);
  const guidelineId = String(params.get(FOCUS_GUIDELINE_QUERY_KEY) || '').trim();
  if (guidelineId) {
    return { kind: 'guideline', id: guidelineId };
  }

  const initiativeId = String(params.get(FOCUS_INITIATIVE_QUERY_KEY) || '').trim();
  if (initiativeId) {
    return { kind: 'initiative', id: initiativeId };
  }

  return { kind: '', id: '' };
}

function resolveRouteEntityKind() {
  return resolveRouteEntityFromLocation().kind;
}

function resolveRouteEntityId() {
  return resolveRouteEntityFromLocation().id;
}

function resolveInstitutionSlug() {
  const fromPath = parseAppPathRoute();
  if (fromPath.institutionSlug) return fromPath.institutionSlug;

  const params = new URLSearchParams(window.location.search);
  const querySlug = normalizeSlug(params.get('institution'));
  if (querySlug) return querySlug;
  if (EMBED_MAP_MODE) return DEFAULT_INSTITUTION_SLUG || null;

  const parts = window.location.pathname.split('/').filter(Boolean);
  if (!parts.length) return DEFAULT_INSTITUTION_SLUG || null;

  const last = parts[parts.length - 1];
  if (last === 'index.html') {
    return normalizeSlug(parts[parts.length - 2]) || DEFAULT_INSTITUTION_SLUG || null;
  }
  if (last === 'app' || last === 'landing.html' || last === 'landing') {
    return DEFAULT_INSTITUTION_SLUG || null;
  }
  if (last === 'admin.html') {
    return normalizeSlug(parts[parts.length - 2]) || DEFAULT_INSTITUTION_SLUG || null;
  }
  return normalizeSlug(last) || DEFAULT_INSTITUTION_SLUG || null;
}

function resolveStrategySlug() {
  const fromPath = parseAppPathRoute();
  if (fromPath.strategySlug) return fromPath.strategySlug;

  const params = new URLSearchParams(window.location.search);
  return normalizeSlug(params.get('strategy'));
}

function resolveGuidelineFocusId() {
  const focus = resolveRouteEntityFromLocation();
  if (focus.kind !== 'guideline') return '';
  return focus.id || '';
}

function resolveInitiativeFocusId() {
  const focus = resolveRouteEntityFromLocation();
  if (focus.kind !== 'initiative') return '';
  return focus.id || '';
}

function resolveEmbedMapMode() {
  const params = new URLSearchParams(window.location.search);
  const embed = String(params.get(EMBED_QUERY_KEY) || '').trim().toLowerCase();
  if (embed === EMBED_MAP_VALUE) return true;

  const path = String(window.location.pathname || '').trim().toLowerCase();
  return path === EMBED_MAP_PATH_PREFIX || path.startsWith(`${EMBED_MAP_PATH_PREFIX}/`);
}

function resolveInitialView() {
  if (EMBED_MAP_MODE) return 'map';
  const fromPath = parseAppPathRoute();
  if (fromPath.focusKind === 'guideline') return 'guideline-detail';
  if (fromPath.focusKind === 'initiative') return 'initiative-detail';
  const routeEntity = resolveRouteEntityFromLocation();
  if (routeEntity.kind === 'guideline') return 'guideline-detail';
  if (routeEntity.kind === 'initiative') return 'initiative-detail';
  const params = new URLSearchParams(window.location.search);
  const view = String(params.get('view') || '').trim().toLowerCase();
  return ALLOWED_VIEWS.has(view) ? view : 'guidelines';
}

function resolveInitialImplementationPlanTarget() {
  const params = new URLSearchParams(window.location.search);
  const target = String(params.get(IMPLEMENTATION_PLAN_QUERY_KEY) || '').trim().toLowerCase();
  if (target === 'initiatives' || target === 'calendar') return target;
  return 'guidelines';
}

function resolveInitialImplementationPlanLayer() {
  return resolveInitialImplementationPlanTarget() === 'initiatives' ? 'initiatives' : 'guidelines';
}

function resolveInitialImplementationPlanSubview() {
  return resolveInitialImplementationPlanTarget() === 'calendar' ? 'calendar' : 'table';
}

function buildCanonicalAppPath({ slug, strategySlug, focusKind, focusId }) {
  const nextSlug = normalizeSlug(slug);
  const nextStrategySlug = normalizeSlug(strategySlug);
  const nextFocusKind = String(focusKind || '').trim().toLowerCase();
  const nextFocusId = String(focusId || '').trim();

  if (!nextSlug) return '/index.html';
  if (!nextStrategySlug) return `/${APP_PATH_INSTITUTION_SEGMENT}/${encodeURIComponent(nextSlug)}`;

  let path = `/${APP_PATH_INSTITUTION_SEGMENT}/${encodeURIComponent(nextSlug)}/${APP_PATH_STRATEGY_SEGMENT}/${encodeURIComponent(nextStrategySlug)}`;
  if (nextFocusKind === 'guideline' && nextFocusId) {
    path += `/${APP_PATH_GUIDELINE_SEGMENT}/${encodeURIComponent(nextFocusId)}`;
  } else if (nextFocusKind === 'initiative' && nextFocusId) {
    path += `/${APP_PATH_INITIATIVE_SEGMENT}/${encodeURIComponent(nextFocusId)}`;
  }
  return path;
}

function buildCurrentPageHref({
  slug = state.institutionSlug,
  strategySlug = state.strategySlug,
  view = state.activeView,
  routeEntityKind = state.routeEntityKind,
  routeEntityId = state.routeEntityId
} = {}) {
  const params = new URLSearchParams(window.location.search);
  const nextSlug = normalizeSlug(slug);
  const nextStrategySlug = normalizeSlug(strategySlug);
  const nextView = state.embedMapMode ? 'map' : (ALLOWED_VIEWS.has(view) ? view : 'guidelines');
  let path = window.location.pathname || '/index.html';

  if (state.embedMapMode) {
    if (nextSlug) params.set('institution', nextSlug);
    else params.delete('institution');

    if (nextStrategySlug) params.set('strategy', nextStrategySlug);
    else params.delete('strategy');

    params.delete(FOCUS_GUIDELINE_QUERY_KEY);
    params.delete(FOCUS_INITIATIVE_QUERY_KEY);
    params.set(EMBED_QUERY_KEY, EMBED_MAP_VALUE);
  } else {
    params.delete('institution');
    params.delete('strategy');
    params.delete(FOCUS_GUIDELINE_QUERY_KEY);
    params.delete(FOCUS_INITIATIVE_QUERY_KEY);
    params.delete(EMBED_QUERY_KEY);
    path = buildCanonicalAppPath({
      slug: nextSlug,
      strategySlug: nextStrategySlug,
      focusKind: routeEntityKind,
      focusId: routeEntityId
    });
  }

  const shouldOmitViewParam = !state.embedMapMode
    && (
      (nextView === 'guideline-detail' && String(routeEntityKind || '').trim().toLowerCase() === 'guideline' && String(routeEntityId || '').trim())
      || (nextView === 'initiative-detail' && String(routeEntityKind || '').trim().toLowerCase() === 'initiative' && String(routeEntityId || '').trim())
    );
  if (nextView !== 'guidelines' && !shouldOmitViewParam) params.set('view', nextView);
  else params.delete('view');

  if (nextView === 'implementation-plan') {
    const implementationTarget = state.implementationPlanSubview === 'calendar'
      ? 'calendar'
      : (state.implementationPlanLayer === 'initiatives' ? 'initiatives' : 'guidelines');
    params.set(IMPLEMENTATION_PLAN_QUERY_KEY, implementationTarget);
  } else {
    params.delete(IMPLEMENTATION_PLAN_QUERY_KEY);
  }

  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

function syncRouteState() {
  const nextHref = buildCurrentPageHref();
  const currentHref = `${window.location.pathname}${window.location.search}`;
  if (nextHref !== currentHref) {
    window.history.replaceState(null, '', nextHref);
  }
}

function setRouteEntity(kind, entityId) {
  const normalizedKind = String(kind || '').trim().toLowerCase();
  const normalizedId = String(entityId || '').trim();
  if ((normalizedKind !== 'guideline' && normalizedKind !== 'initiative') || !normalizedId) {
    state.routeEntityKind = '';
    state.routeEntityId = '';
    return;
  }
  state.routeEntityKind = normalizedKind;
  state.routeEntityId = normalizedId;
}

function clearRouteEntity() {
  state.routeEntityKind = '';
  state.routeEntityId = '';
  if (state.activeView === 'guideline-detail') {
    state.activeView = 'guidelines';
  } else if (state.activeView === 'initiative-detail') {
    state.activeView = 'initiatives';
  }
}

function clearRouteEntityForView(nextView) {
  const normalizedView = String(nextView || '').trim().toLowerCase();
  if (normalizedView === 'guideline-detail' && state.routeEntityKind === 'guideline') return;
  if (normalizedView === 'initiative-detail' && state.routeEntityKind === 'initiative') return;
  clearRouteEntity();
}

function buildAbsoluteUrlFromHref(href) {
  return new URL(String(href || ''), window.location.origin).toString();
}

function buildStrategyHref({ institutionSlug = state.institutionSlug, strategySlug = state.strategySlug } = {}) {
  return buildCurrentPageHref({
    slug: institutionSlug,
    strategySlug,
    view: 'guidelines',
    routeEntityKind: '',
    routeEntityId: ''
  });
}

function buildGuidelineHref(guidelineId, options = {}) {
  return buildCurrentPageHref({
    slug: options.institutionSlug || state.institutionSlug,
    strategySlug: options.strategySlug || state.strategySlug,
    view: 'guideline-detail',
    routeEntityKind: 'guideline',
    routeEntityId: guidelineId
  });
}

function buildInitiativeHref(initiativeId, options = {}) {
  return buildCurrentPageHref({
    slug: options.institutionSlug || state.institutionSlug,
    strategySlug: options.strategySlug || state.strategySlug,
    view: 'initiative-detail',
    routeEntityKind: 'initiative',
    routeEntityId: initiativeId
  });
}

function strategyShareUrl() {
  return buildAbsoluteUrlFromHref(buildStrategyHref());
}

function guidelineShareUrl(guidelineId) {
  return buildAbsoluteUrlFromHref(buildGuidelineHref(guidelineId));
}

function initiativeShareUrl(initiativeId) {
  return buildAbsoluteUrlFromHref(buildInitiativeHref(initiativeId));
}

async function copyTextToClipboard(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', 'readonly');
    helper.style.position = 'fixed';
    helper.style.top = '-9999px';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    helper.remove();
    return copied;
  }
}

function strategyUrlInlineBlockMarkup() {
  const canShareStrategy = Boolean(normalizeSlug(state.institutionSlug) && normalizeSlug(state.strategySlug));
  const strategyUrl = canShareStrategy ? strategyShareUrl() : '';
  const strategyUrlLabel = langText('Strategijos nuoroda', 'Strategy URL');
  const copyStrategyUrlLabel = langText('Kopijuoti nuoroda', 'Copy URL');
  if (!canShareStrategy) return '';
  return `
    <section class="strategy-url-inline-card" data-intro-stop-toggle>
      <span class="strategy-url-inline-label">${escapeHtml(strategyUrlLabel)}</span>
      <div class="strategy-url-inline-row">
        <a class="strategy-url-inline-link" href="${escapeHtml(strategyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(strategyUrl)}</a>
        <button type="button" class="btn btn-ghost strategy-url-inline-copy" data-action="copy-strategy-main-url" data-url="${escapeHtml(strategyUrl)}">${escapeHtml(copyStrategyUrlLabel)}</button>
      </div>
    </section>
  `;
}

function renderStrategyUrlInlineBlock() {
  if (!elements.introDeck) return;
  const slot = elements.introDeck.querySelector('[data-strategy-url-inline-slot]');
  if (!(slot instanceof HTMLElement)) return;
  slot.innerHTML = strategyUrlInlineBlockMarkup();
  const copyButton = slot.querySelector('[data-action="copy-strategy-main-url"]');
  if (copyButton instanceof HTMLButtonElement) {
    copyButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const value = String(copyButton.dataset.url || '').trim();
      const copied = await copyTextToClipboard(value);
      if (copied) {
        notifySuccess(langText('Strategijos nuoroda nukopijuota.', 'Strategy URL copied.'));
      } else {
        notifyError(langText('Nepavyko nukopijuoti nuorodos.', 'Failed to copy URL.'));
      }
    });
  }
}

function refreshBrandMapLink() {
  const link = document.getElementById('brandMapLink');
  if (!(link instanceof HTMLAnchorElement)) return;

  link.href = buildCurrentPageHref({ view: 'map' });
  if (link.dataset.bound === '1') return;
  link.dataset.bound = '1';

  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (state.activeView !== 'map') {
      clearRouteEntityForView('map');
      state.activeView = 'map';
      render();
      return;
    }
    syncRouteState();
  });
}

function normalizeSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (!slug) return '';
  return /^[a-z0-9-]+$/.test(slug) ? slug : '';
}

function hydrateIntroCollapsed() {
  if (localStorage.getItem(INTRO_VISITED_KEY) === '1') return true;
  return localStorage.getItem(INTRO_COLLAPSED_KEY) === '1';
}

function persistIntroCollapsed() {
  localStorage.setItem(INTRO_COLLAPSED_KEY, state.introCollapsed ? '1' : '0');
}

function hydrateVoteFloatingCollapsed() {
  return localStorage.getItem(VOTE_FLOATING_COLLAPSED_KEY) === '1';
}

function persistVoteFloatingCollapsed() {
  localStorage.setItem(VOTE_FLOATING_COLLAPSED_KEY, state.voteFloatingCollapsed ? '1' : '0');
}

function hydrateSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
}

function persistSidebarCollapsed() {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, state.sidebarCollapsed ? '1' : '0');
}

function readStrategySelectionMemory() {
  const raw = localStorage.getItem(STRATEGY_SELECTION_MEMORY_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function rememberedStrategySlugForInstitution(institutionSlug) {
  const normalizedInstitutionSlug = normalizeSlug(institutionSlug);
  if (!normalizedInstitutionSlug) return '';
  const memory = readStrategySelectionMemory();
  return normalizeSlug(memory[normalizedInstitutionSlug]);
}

function rememberStrategySlugForInstitution(institutionSlug, strategySlug) {
  const normalizedInstitutionSlug = normalizeSlug(institutionSlug);
  if (!normalizedInstitutionSlug) return;
  const normalizedStrategySlug = normalizeSlug(strategySlug);
  const memory = readStrategySelectionMemory();
  if (normalizedStrategySlug) memory[normalizedInstitutionSlug] = normalizedStrategySlug;
  else delete memory[normalizedInstitutionSlug];
  localStorage.setItem(STRATEGY_SELECTION_MEMORY_KEY, JSON.stringify(memory));
}

function hydrateAuthFromStorage() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.token) return;
    state.token = parsed.token;
    state.user = parsed.user || null;
    state.role = parsed.role || null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function persistAuthToStorage() {
  if (!state.token) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      homeSlug: state.accountContext?.institution?.slug || null,
      token: state.token,
      user: state.user,
      role: state.role
    })
  );
}

function clearSession() {
  state.token = null;
  state.user = null;
  state.role = null;
  state.accountContext = null;
  state.context = null;
  state.strategy = null;
  state.commentsVisible = false;
  state.userVotes = {};
  state.historyEntries = [];
  state.historyRows = [];
  state.historyError = '';
  state.historyCycleId = '';
  state.initiatives = [];
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function setSession(payload) {
  state.token = payload.token || null;
  state.user = payload.user || null;
  state.role = payload.role || null;
  const payloadStrategy = normalizeStrategyRecord(payload.strategy);
  const selectedStrategySlug = normalizeSlug(state.strategySlug);
  if (payloadStrategy && selectedStrategySlug && normalizeSlug(payloadStrategy.slug) === selectedStrategySlug) {
    state.strategy = payloadStrategy;
  }
  state.accountContext = null;
  persistAuthToStorage();
}

function syncAuthStateFromStorage() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    state.token = null;
    state.user = null;
    state.role = null;
    state.accountContext = null;
    state.context = null;
    state.strategy = null;
    state.userVotes = {};
    state.historyEntries = [];
    state.historyRows = [];
    state.historyError = '';
    state.historyCycleId = '';
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.token) {
      state.token = null;
      state.user = null;
      state.role = null;
      state.accountContext = null;
      state.context = null;
      state.strategy = null;
      state.userVotes = {};
      state.historyEntries = [];
      state.historyRows = [];
      state.historyError = '';
      state.historyCycleId = '';
      resetPolicyAlignmentState();
      return;
    }
    state.token = parsed.token;
    state.user = parsed.user || null;
    state.role = parsed.role || null;
    state.accountContext = null;
    state.context = null;
    state.userVotes = {};
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    state.token = null;
    state.user = null;
    state.role = null;
    state.accountContext = null;
    state.context = null;
    state.userVotes = {};
  }
}

function isLoggedIn() {
  return Boolean(state.token && state.context);
}

function isAuthenticated() {
  return Boolean(state.token && state.user);
}

function isEmbeddedContext() {
  const params = new URLSearchParams(window.location.search);
  return window.self !== window.top || params.get('frame') === 'admin';
}

function canEditMapLayout() {
  if (state.embedMapMode) return false;
  if (!isAuthenticated()) return false;
  if (state.role !== 'institution_admin') return false;
  const homeSlug = normalizeSlug(state.accountContext?.institution?.slug);
  const currentSlug = normalizeSlug(state.institutionSlug);
  return Boolean(homeSlug && currentSlug && homeSlug === currentSlug);
}

function canManageSelectedInstitution() {
  if (state.embedMapMode) return false;
  if (!isAuthenticated()) return false;
  if (state.role !== 'institution_admin') return false;
  const homeSlug = normalizeSlug(state.accountContext?.institution?.slug);
  const currentSlug = normalizeSlug(state.institutionSlug);
  return Boolean(homeSlug && currentSlug && homeSlug === currentSlug);
}

function isViewingExternalStrategy() {
  if (state.embedMapMode) return false;
  if (!isAuthenticated()) return false;
  const homeSlug = normalizeSlug(state.accountContext?.institution?.slug);
  const currentSlug = normalizeSlug(state.institutionSlug);
  return Boolean(homeSlug && currentSlug && homeSlug !== currentSlug);
}

function getExternalImportTarget() {
  if (!isViewingExternalStrategy()) return null;
  const cycleId = String(state.accountContext?.cycle?.id || '').trim();
  const cycleState = String(state.accountContext?.cycle?.state || '').trim().toLowerCase();
  if (!cycleId || cycleState !== 'open') return null;
  return {
    cycleId,
    cycleTitle: String(state.accountContext?.cycle?.title || '').trim(),
    institutionSlug: normalizeSlug(state.accountContext?.institution?.slug),
    institutionName: String(state.accountContext?.institution?.name || '').trim(),
    strategySlug: normalizeSlug(state.accountContext?.strategy?.slug),
    strategyTitle: String(state.accountContext?.strategy?.title || '').trim()
  };
}

function normalizeExternalImportTargetFromContext(context, preferredStrategy = null) {
  const cycleId = String(context?.cycle?.id || '').trim();
  const cycleState = String(context?.cycle?.state || '').trim().toLowerCase();
  const institutionSlug = normalizeSlug(context?.institution?.slug);
  const institutionName = String(context?.institution?.name || '').trim();
  const strategy = normalizeStrategyRecord(preferredStrategy || context?.strategy);
  if (!cycleId || cycleState !== 'open' || !institutionSlug || !strategy?.slug) return null;
  return {
    cycleId,
    cycleTitle: String(context?.cycle?.title || '').trim(),
    institutionSlug,
    institutionName,
    strategySlug: strategy.slug,
    strategyTitle: String(strategy.title || strategy.slug || '').trim()
  };
}

async function loadExternalImportTargets() {
  if (!isViewingExternalStrategy()) return [];
  const strategies = (Array.isArray(state.accountContext?.strategies) ? state.accountContext.strategies : [])
    .map((item) => normalizeStrategyRecord(item))
    .filter(Boolean);
  const fallbackStrategy = normalizeStrategyRecord(state.accountContext?.strategy);
  const orderedStrategies = strategies.length
    ? strategies
    : (fallbackStrategy ? [fallbackStrategy] : []);
  if (!orderedStrategies.length) return [];

  const targetsBySlug = new Map();
  const currentTarget = normalizeExternalImportTargetFromContext(state.accountContext, fallbackStrategy);
  if (currentTarget?.strategySlug) targetsBySlug.set(currentTarget.strategySlug, currentTarget);

  const pendingStrategies = orderedStrategies.filter((strategy) => !targetsBySlug.has(strategy.slug));
  const pendingResults = await Promise.allSettled(
    pendingStrategies.map((strategy) => api(`/api/v1/me/context?strategy=${encodeURIComponent(strategy.slug)}`))
  );

  pendingResults.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const strategy = pendingStrategies[index];
    const target = normalizeExternalImportTargetFromContext(result.value, strategy);
    if (!target?.strategySlug) return;
    targetsBySlug.set(target.strategySlug, target);
  });

  return orderedStrategies
    .map((strategy) => targetsBySlug.get(strategy.slug))
    .filter(Boolean);
}

function pickPreferredExternalImportTarget(targets) {
  const targetList = Array.isArray(targets) ? targets : [];
  if (!targetList.length) return null;
  const currentStrategySlug = normalizeSlug(state.accountContext?.strategy?.slug);
  return targetList.find((item) => normalizeSlug(item?.strategySlug) === currentStrategySlug) || targetList[0];
}

function canImportExternalItem(item) {
  const source = item && typeof item === 'object' ? item : null;
  if (!source) return false;
  if (!isViewingExternalStrategy()) return false;
  if (!getExternalImportTarget()) {
    const ownStrategies = Array.isArray(state.accountContext?.strategies) ? state.accountContext.strategies : [];
    if (!ownStrategies.length) return false;
  }
  return !isPendingStatus(source.status);
}

function cycleIsWritable() {
  return WRITABLE_CYCLE_STATES.has(String(state.cycle?.state || '').toLowerCase());
}

function voteBudget() {
  return Number(state.context?.rules?.voteBudget || 20);
}

function minPerGuideline() {
  return Number(state.context?.rules?.minPerGuideline ?? 0);
}

function maxPerGuideline() {
  return Number(state.context?.rules?.maxPerGuideline ?? 5);
}

function minPerInitiative() {
  return Number(state.context?.rules?.minPerInitiative ?? 0);
}

function maxPerInitiative() {
  return Number(state.context?.rules?.maxPerInitiative ?? 5);
}

function usedVotesTotal() {
  return Object.values(state.userVotes).reduce((sum, value) => sum + Number(value || 0), 0);
}

function cycleMissionText() {
  const raw = state.cycle?.mission_text ?? state.cycle?.missionText ?? '';
  const text = String(raw || '').trim();
  return text || DEFAULT_MISSION_TEXT;
}

function cycleVisionText() {
  const raw = state.cycle?.vision_text ?? state.cycle?.visionText ?? '';
  const text = String(raw || '').trim();
  return text || DEFAULT_VISION_TEXT;
}

function normalizeGuideAboutContent(payload) {
  const source = payload?.contentSettings || payload || {};
  const guideIntroTextLt = String(source.guideIntroTextLt || source.guideIntroText || '').trim() || DEFAULT_GUIDE_INTRO_TEXT;
  const guideIntroTextEn = String(source.guideIntroTextEn || '').trim() || DEFAULT_GUIDE_INTRO_TEXT_EN;
  const aboutTextLt = String(source.aboutTextLt || source.aboutText || '').trim() || DEFAULT_ABOUT_TEXT;
  const aboutTextEn = String(source.aboutTextEn || '').trim() || DEFAULT_ABOUT_TEXT_EN;
  return { guideIntroTextLt, guideIntroTextEn, aboutTextLt, aboutTextEn };
}

function currentLanguage() {
  const fromQuery = String(new URLSearchParams(window.location.search).get('lang') || '').trim().toLowerCase();
  if (fromQuery === 'en' || fromQuery === 'lt') return fromQuery;
  const fromStorage = String(localStorage.getItem('uzt-strategy-v1-lang') || '').trim().toLowerCase();
  if (fromStorage === 'en' || fromStorage === 'lt') return fromStorage;
  const fromI18n = String(window.DigiI18n?.getLanguage?.() || '').trim().toLowerCase();
  if (fromI18n === 'en' || fromI18n === 'lt') return fromI18n;
  const fromHtml = String(document.documentElement?.lang || '').trim().toLowerCase();
  if (fromHtml === 'en' || fromHtml === 'lt') return fromHtml;
  return 'lt';
}

function langText(lt, en) {
  return currentLanguage() === 'en' ? en : lt;
}

function stepPrompt(stepId) {
  const id = String(stepId || '').trim().toLowerCase();
  if (id === 'initiatives') {
    return langText(
      'Kokias konkrecias iniciatyvas igyvendinsime?',
      'Which concrete initiatives will we implement?'
    );
  }
  if (id === 'policy-alignment') {
    return langText(
      'Kaip dabartine strategija atitinka pasirinktÄ… politikos ar reikalavimu dokumenta?',
      'How well does the current strategy align with the selected policy or requirements document?'
    );
  }
  return langText(
    'Kur link judesime ir kokia nauda kursime?',
    'Where are we heading and what value will we create?'
  );
}

function guideIntroText() {
  const lang = currentLanguage();
  if (lang === 'en') {
    return String(state.contentSettings?.guideIntroTextEn || '').trim()
      || String(state.contentSettings?.guideIntroTextLt || '').trim()
      || DEFAULT_GUIDE_INTRO_TEXT_EN;
  }
  return String(state.contentSettings?.guideIntroTextLt || '').trim() || DEFAULT_GUIDE_INTRO_TEXT;
}

function aboutText() {
  const lang = currentLanguage();
  if (lang === 'en') {
    return String(state.contentSettings?.aboutTextEn || '').trim()
      || String(state.contentSettings?.aboutTextLt || '').trim()
      || DEFAULT_ABOUT_TEXT_EN;
  }
  return String(state.contentSettings?.aboutTextLt || '').trim() || DEFAULT_ABOUT_TEXT;
}

function renderMultilineText(text) {
  return escapeHtml(String(text || '')).replace(/\r\n/g, '\n').replace(/\n/g, '<br />');
}

function renderAboutBlocks(text) {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return '<p>Tekstas nepateiktas.</p>';
  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return '';
    const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));
    if (bulletLines.length === lines.length) {
      return `<ul class="about-list">${bulletLines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
    }
    return `<p>${lines.map((line) => escapeHtml(line)).join('<br />')}</p>`;
  }).join('');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const MAP_LINE_SIDES = new Set(['auto', 'left', 'right', 'top', 'bottom']);
const MAP_VOTE_SQUARES_PER_ROW = 12;
const MAP_COMMENT_ICON_SVG = `
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
    <path d="M5 6.5h14a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H10l-4.5 3.2c-.7.5-1.5 0-1.5-.8V17H3a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1h2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M8 10.2h8M8 13.2h5.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
`;
const MAP_FULLSCREEN_ICON_ENTER = `
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M9 5H5v4M15 5h4v4M19 15v4h-4M9 19H5v-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;
const MAP_FULLSCREEN_ICON_EXIT = `
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M9 5v4H5M15 5v4h4M19 15h-4v4M5 15h4v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

function normalizeLineSide(value) {
  const side = String(value || 'auto').trim().toLowerCase();
  return MAP_LINE_SIDES.has(side) ? side : 'auto';
}

function toUserMessage(error) {
  const raw = String(error?.message || error || '').trim();
  const map = {
    unauthorized: 'Reikia prisijungti.',
    'invalid token': 'Sesija nebegalioja. Prisijunkite iÅ¡ naujo.',
    'institution not found': `Institucija "${state.institutionSlug}" nerasta.`,
    'strategy not found': 'Pasirinkta strategija nerasta.',
    'cycle not found': 'Aktyvus strategijos ciklas nerastas.',
    'cycle not writable': 'Ciklas nebeleidÅ¾ia redaguoti (tik skaitymas).',
    'guideline voting disabled': 'Å i gairÄ— iÅ¡jungta: balsuoti negalima.',
    'initiative voting disabled': 'Å i iniciatyva iÅ¡jungta: balsuoti negalima.',
    'vote budget exceeded': 'VirÅ¡ytas balsÅ³ biudÅ¾etas.',
    forbidden: 'Veiksmas neleidÅ¾iamas.',
    'membership inactive': 'NarystÄ— neaktyvi.',
    'invalid credentials': 'Neteisingi prisijungimo duomenys.',
    'invite not found': 'Kvietimas nerastas.',
    'invite expired': 'Kvietimas nebegalioja.',
    'invite revoked': 'Kvietimas atÅ¡auktas.',
    'invite already used': 'Kvietimas jau panaudotas.',
    'too many requests': 'Per daug uÅ¾klausÅ³. Pabandykite po keliÅ³ sekundÅ¾iÅ³.',
    'guidelineId and score(0..5) required': 'Balsas turi bÅ«ti tarp 0 ir 5.',
    'initiativeId and score(0..5) required': 'Balsas turi bÅ«ti tarp 0 ir 5.',
    'initiativeId and body required': 'Komentaras negali bÅ«ti tuÅ¡Äias.',
    'layout payload required': 'Nepateikti Å¾emÄ—lapio iÅ¡dÄ—stymo duomenys.',
    'guideline not in cycle': 'GairÄ— nepriklauso Å¡iam ciklui.',
    'initiative not in cycle': 'Iniciatyva nepriklauso Å¡iam ciklui.',
    'initiative not found': 'Iniciatyva nerasta.',
    'proposal not found': 'PasiÅ«lymas nerastas.',
    'proposal already reviewed': 'PasiÅ«lymas jau perÅ¾iÅ«rÄ—tas.',
    'invalid decision': 'Neteisingas sprendimo tipas.',
    'at least one guideline required': 'Iniciatyva turi bÅ«ti priskirta bent vienai gairei.',
    'name required': 'Nurodykite pavadinimÄ….',
    'token and displayName required': 'Nurodykite kvietimo Å¾etonÄ… ir vardÄ….',
    'institutionId required': 'Pasirinkite institucijÄ….',
    'institutionName required': 'Įveskite institucijos pavadinimą.',
    'institutionName too long': 'Institucijos pavadinimas per ilgas.',
    'fullName required': 'Įveskite vardą ir pavardę.',
    'workEmail required': 'Įveskite darbinį el. paštą.',
    'phone required': 'Įveskite kontaktinį telefono numerį.',
    'fullName too long': 'Vardas ir pavardė per ilgi.',
    'workEmail too long': 'El. paštas per ilgas.',
    'phone too long': 'Telefono numeris per ilgas.',
    'notes too long': 'Papildoma informacija per ilga.',
    'invalid implementation date': 'Neteisinga įgyvendinimo data.',
    'ai api key not configured': 'AI API raktas nesukonfigÅ«ruotas serveryje.',
    'clarification required': 'Nurodykite AI patikslinimÄ….',
    'at least one pdf file required': 'Ä®kelkite bent vienÄ… PDF failÄ….',
    'only pdf files allowed': 'LeidÅ¾iami tik PDF failai.',
    'pdf file too large': 'PDF failas per didelis.',
    'too many pdf files': 'Ä®kelta per daug PDF failÅ³.',
    'pdf parsing failed': 'Nepavyko nuskaityti PDF turinio.',
    'pdf content too large': 'PDF turinys per didelÄ—s apimties.',
    'ai response invalid': 'AI atsakymas netinkamo formato.',
    'ai response language mismatch': 'AI atsakymas ne ta kalba. Pabandykite dar kartÄ….',
    'generated guidelines missing': 'AI nesugeneravo pakankamai gairiÅ³.',
    'generated initiatives missing': 'AI nesugeneravo pakankamai iniciatyvÅ³.',
    'generationId required': 'TrÅ«ksta generavimo uÅ¾klausos ID.',
    'generation not found': currentLanguage() === 'en'
      ? 'AI generation was not found. Please retry.'
      : 'AI generavimo uÅ¾klausa nerasta. Pabandykite dar kartÄ….',
    'ai generation timeout': currentLanguage() === 'en'
      ? 'AI generation is still running. Please wait and try again shortly.'
      : 'AI generavimas vis dar vyksta. Pabandykite dar po keliÅ³ sekundÅ¾iÅ³.',
    'ai generation failed': currentLanguage() === 'en'
      ? 'AI generation failed.'
      : 'AI generavimas nepavyko.',
    'documents upload failed': 'Nepavyko Ä¯kelti dokumentÅ³.',
    'analysis title required': 'Nurodykite analizÄ—s pavadinimÄ….',
    'analysis not found': 'Policy Alignment analizÄ— nerasta.',
    'analysis access forbidden': 'Neturite prieigos prie Å¡ios analizÄ—s.',
    'analysis target framework required': 'Pasirinkite analizÄ—s karkasÄ… arba Ä¯kelkite tikslinÄ¯ dokumentÄ….',
    'target documents required': 'Ä®kelkite bent vienÄ… tikslinÄ¯ dokumentÄ….',
    'source material required': 'TrÅ«ksta Å¡altinio medÅ¾iagos palyginimui.',
    'target requirements missing': 'Nepavyko iÅ¡gauti tikslinio dokumento reikalavimÅ³.',
    'cannot upload target documents when target framework is selected': 'Pasirinkus karkasÄ… naujÅ³ tiksliniÅ³ dokumentÅ³ Ä¯kelti negalima.',
    'suggestion not found': 'PasiÅ«lymas nerastas.',
    'suggestion already processed': 'Å is pasiÅ«lymas jau buvo apdorotas.',
    'finding not found': 'Atitikties iÅ¡vada nerasta.',
    'initiative suggestion requires linked guidelines': 'Iniciatyvos pasiÅ«lymui reikia bent vienos susietos gairÄ—s.',
    'role required': 'Nurodykite dokumento vaidmenÄ¯.',
    'invalid role': 'Netinkamas dokumento vaidmuo.',
    'framework not found': 'Atitikties karkasas nerastas.',
    'framework title required': 'Nurodykite karkaso pavadinimą.',
    'HTTP 504': currentLanguage() === 'en'
      ? 'AI processing took longer than gateway timeout. Checking server result...'
      : 'AI apdorojimas truko ilgiau nei gateway limitas. Tikrinamas serverio rezultatas...',
    'strategy limit reached': currentLanguage() === 'en'
      ? 'This institution already reached the maximum number of strategies (5).'
      : 'Å i institucija jau pasiekÄ— maksimalÅ³ strategijÅ³ limitÄ… (5).'
  };
  return map[raw] || raw || 'Nepavyko Ä¯vykdyti uÅ¾klausos.';
}

function notifySuccess(message) {
  const text = String(message || '').trim();
  if (!text) return;
  if (window.DigiAlerts && typeof window.DigiAlerts.success === 'function') {
    window.DigiAlerts.success(text);
  }
}

function notifyError(message) {
  const text = String(message || '').trim();
  if (!text) return;
  if (window.DigiAlerts && typeof window.DigiAlerts.error === 'function') {
    window.DigiAlerts.error(text);
  }
}

function notifyInfo(message) {
  const text = String(message || '').trim();
  if (!text) return;
  if (window.DigiAlerts && typeof window.DigiAlerts.info === 'function') {
    window.DigiAlerts.info(text);
  }
}

async function api(path, { method = 'GET', body = null, auth = true } = {}) {
  const headers = {};
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== null && !isFormData) headers['Content-Type'] = 'application/json';
  if (auth === true) {
    if (!state.token) throw new Error('unauthorized');
    headers.Authorization = `Bearer ${state.token}`;
  } else if (auth === 'optional' && state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body === null
      ? undefined
      : (isFormData ? body : JSON.stringify(body))
  });

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
  return payload || {};
}

function normalizeInstitutionRecord(value) {
  if (!value || typeof value !== 'object') return null;
  const slug = normalizeSlug(value.slug);
  const countryCodeRaw = String(value.countryCode ?? value.country_code ?? '').trim().toUpperCase();
  const websiteRaw = String(value.websiteUrl ?? value.website_url ?? '').trim();
  const strategiesRaw = Array.isArray(value.strategies) ? value.strategies : [];
  return {
    ...value,
    id: value.id || null,
    name: String(value.name || slug || '').trim(),
    slug,
    countryCode: countryCodeRaw || '',
    websiteUrl: websiteRaw || '',
    status: String(value.status || '').trim(),
    createdAt: value.createdAt || value.created_at || null,
    strategies: strategiesRaw.map((item) => normalizeStrategyRecord(item)).filter(Boolean)
  };
}

function normalizeStrategyRecord(value) {
  if (!value || typeof value !== 'object') return null;
  const slug = normalizeSlug(value.slug);
  if (!slug) return null;
  return {
    ...value,
    id: value.id || null,
    institutionId: value.institutionId || value.institution_id || null,
    title: String(value.title || slug).trim(),
    slug,
    description: String(value.description || '').trim(),
    status: String(value.status || '').trim() || 'active',
    isDefault: Boolean(value.isDefault ?? value.is_default),
    createdAt: value.createdAt || value.created_at || null
  };
}

function strategiesForSelectedInstitution() {
  const selectedInstitution = (state.institutions || []).find((institution) =>
    normalizeSlug(institution.slug) === normalizeSlug(state.institutionSlug)
  ) || null;
  const strategiesFromInstitution = Array.isArray(selectedInstitution?.strategies)
    ? selectedInstitution.strategies
    : [];
  if (strategiesFromInstitution.length) return strategiesFromInstitution;
  if (Array.isArray(state.institution?.strategies) && state.institution.strategies.length) return state.institution.strategies;
  return [];
}

function ensureSelectedStrategySlug() {
  const strategies = strategiesForSelectedInstitution();
  const selectedSlug = normalizeSlug(state.strategySlug);
  if (!strategies.length) {
    if (selectedSlug) clearRouteEntity();
    state.strategySlug = '';
    state.strategy = null;
    return;
  }
  const selectedStrategy = strategies.find((item) => normalizeSlug(item.slug) === selectedSlug) || null;
  if (selectedStrategy) {
    state.strategy = selectedStrategy;
    return;
  }
  if (selectedSlug) clearRouteEntity();
  state.strategySlug = '';
  state.strategy = null;
}

async function loadPublicData() {
  const params = new URLSearchParams();
  if (state.strategySlug) params.set('strategy', state.strategySlug);
  const query = params.toString();
  const base = `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current`;
  const [summaryPayload, guidelinesPayload, initiativesPayload] = await Promise.all([
    api(`${base}/summary${query ? `?${query}` : ''}`, { auth: 'optional' }),
    api(`${base}/guidelines${query ? `?${query}` : ''}`, { auth: 'optional' }),
    api(`${base}/initiatives${query ? `?${query}` : ''}`, { auth: 'optional' })
  ]);

  state.institution = normalizeInstitutionRecord(
    initiativesPayload.institution || guidelinesPayload.institution || summaryPayload.institution || null
  );
  const strategiesPayload = initiativesPayload.strategies || guidelinesPayload.strategies || summaryPayload.strategies;
  if (Array.isArray(strategiesPayload)) {
    state.institution = {
      ...(state.institution || {}),
      strategies: strategiesPayload.map((item) => normalizeStrategyRecord(item)).filter(Boolean)
    };
  }
  state.strategy = normalizeStrategyRecord(
    initiativesPayload.strategy || guidelinesPayload.strategy || summaryPayload.strategy || null
  );
  if (state.strategy?.slug) {
    state.strategySlug = state.strategy.slug;
    rememberStrategySlugForInstitution(state.institutionSlug, state.strategySlug);
  }
  state.cycle = initiativesPayload.cycle || guidelinesPayload.cycle || summaryPayload.cycle || null;
  state.summary = summaryPayload.summary || null;
  state.guidelines = Array.isArray(guidelinesPayload.guidelines) ? guidelinesPayload.guidelines : [];
  state.initiatives = Array.isArray(initiativesPayload.initiatives) ? initiativesPayload.initiatives : [];
  state.commentsVisible = Boolean(
    initiativesPayload.commentsVisible ?? guidelinesPayload.commentsVisible ?? summaryPayload.commentsVisible ?? false
  );
}

async function refreshGuidelines() {
  const params = new URLSearchParams();
  if (state.strategySlug) params.set('strategy', state.strategySlug);
  const payload = await api(
    `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current/guidelines${params.toString() ? `?${params.toString()}` : ''}`,
    { auth: 'optional' }
  );
  state.institution = normalizeInstitutionRecord(payload.institution) || state.institution;
  if (Array.isArray(payload.strategies) && state.institution) {
    state.institution.strategies = payload.strategies.map((item) => normalizeStrategyRecord(item)).filter(Boolean);
  }
  state.strategy = normalizeStrategyRecord(payload.strategy) || state.strategy;
  if (state.strategy?.slug) {
    state.strategySlug = state.strategy.slug;
    rememberStrategySlugForInstitution(state.institutionSlug, state.strategySlug);
  }
  state.cycle = payload.cycle || state.cycle;
  state.guidelines = Array.isArray(payload.guidelines) ? payload.guidelines : [];
  state.commentsVisible = Boolean(payload.commentsVisible ?? state.commentsVisible);
}

async function refreshInitiatives() {
  const params = new URLSearchParams();
  if (state.strategySlug) params.set('strategy', state.strategySlug);
  const payload = await api(
    `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current/initiatives${params.toString() ? `?${params.toString()}` : ''}`,
    { auth: 'optional' }
  );
  state.institution = normalizeInstitutionRecord(payload.institution) || state.institution;
  if (Array.isArray(payload.strategies) && state.institution) {
    state.institution.strategies = payload.strategies.map((item) => normalizeStrategyRecord(item)).filter(Boolean);
  }
  state.strategy = normalizeStrategyRecord(payload.strategy) || state.strategy;
  if (state.strategy?.slug) {
    state.strategySlug = state.strategy.slug;
    rememberStrategySlugForInstitution(state.institutionSlug, state.strategySlug);
  }
  state.cycle = payload.cycle || state.cycle;
  state.initiatives = Array.isArray(payload.initiatives) ? payload.initiatives : [];
  state.commentsVisible = Boolean(payload.commentsVisible ?? state.commentsVisible);
}

async function refreshSummary() {
  const params = new URLSearchParams();
  if (state.strategySlug) params.set('strategy', state.strategySlug);
  const payload = await api(
    `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current/summary${params.toString() ? `?${params.toString()}` : ''}`,
    { auth: 'optional' }
  );
  state.strategy = normalizeStrategyRecord(payload.strategy) || state.strategy;
  if (state.strategy?.slug) {
    state.strategySlug = state.strategy.slug;
    rememberStrategySlugForInstitution(state.institutionSlug, state.strategySlug);
  }
  state.summary = payload.summary || state.summary;
  state.commentsVisible = Boolean(payload.commentsVisible ?? state.commentsVisible);
}

async function refreshHistory() {
  if (!isLoggedIn() || !state.cycle?.id) {
    state.historyEntries = [];
    state.historyRows = [];
    state.historyError = '';
    state.historyCycleId = '';
    return;
  }

  state.historyLoading = true;
  state.historyError = '';
  try {
    const payload = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/history`);
    state.historyEntries = Array.isArray(payload?.entries) ? payload.entries : [];
    state.historyRows = Array.isArray(payload?.rows) ? payload.rows : [];
    state.historyCycleId = String(payload?.cycleId || state.cycle.id || '').trim();
  } catch (error) {
    state.historyEntries = [];
    state.historyRows = [];
    state.historyError = toUserMessage(error);
  } finally {
    state.historyLoading = false;
  }
}

function resetPolicyAlignmentState() {
  if (state.policyAlignmentFrameworkPollTimerId) {
    window.clearTimeout(state.policyAlignmentFrameworkPollTimerId);
  }
  if (state.policyAlignmentAnalysisPollTimerId) {
    window.clearTimeout(state.policyAlignmentAnalysisPollTimerId);
  }
  state.policyAlignments = [];
  state.policyAlignmentFrameworks = [];
  state.policyAlignmentFrameworkLoading = false;
  state.policyAlignmentFrameworkError = '';
  state.policyAlignmentFrameworkSelectedId = '';
  state.policyAlignmentFrameworkCurrent = null;
  state.policyAlignmentFrameworkDetailLoading = false;
  state.policyAlignmentFrameworkPollTimerId = 0;
  state.policyAlignmentAnalysisPollTimerId = 0;
  state.policyAlignmentLoading = false;
  state.policyAlignmentError = '';
  state.policyAlignmentCycleId = '';
  state.policyAlignmentSelectedId = '';
  state.policyAlignmentCurrent = null;
  state.policyAlignmentDetailLoading = false;
  state.policyAlignmentWorkspaceTab = 'frameworks';
  state.policyAlignmentAnalysisSubview = 'overview';
  state.policyAlignmentSidebarCollapsed = false;
  state.policyAlignmentFilterStatus = 'all';
  state.policyAlignmentFilterTheme = 'all';
  state.policyAlignmentGroupBy = 'theme';
}

function normalizePolicyAlignmentAnalysis(value) {
  if (!value || typeof value !== 'object') return null;
  const detailLoaded = (
    Object.prototype.hasOwnProperty.call(value, 'documents')
    || Object.prototype.hasOwnProperty.call(value, 'sourceRefs')
    || Object.prototype.hasOwnProperty.call(value, 'requirements')
    || Object.prototype.hasOwnProperty.call(value, 'findings')
    || Object.prototype.hasOwnProperty.call(value, 'suggestions')
  );
  return {
    ...value,
    id: String(value.id || '').trim(),
    cycleId: String(value.cycleId || value.cycle_id || '').trim(),
    institutionId: String(value.institutionId || value.institution_id || '').trim(),
    strategyId: String(value.strategyId || value.strategy_id || '').trim(),
    targetFrameworkId: String(value.targetFrameworkId || value.target_framework_id || '').trim() || null,
    title: String(value.title || '').trim(),
    description: String(value.description || '').trim(),
    sourceMode: String(value.sourceMode || value.source_mode || 'uploaded_document').trim().toLowerCase(),
    targetMode: String(value.targetMode || value.target_mode || 'uploaded_document').trim().toLowerCase(),
    status: String(value.status || 'draft').trim().toLowerCase(),
    sourceSummary: value.sourceSummary && typeof value.sourceSummary === 'object' ? value.sourceSummary : {},
    targetSummary: value.targetSummary && typeof value.targetSummary === 'object' ? value.targetSummary : {},
    summary: value.summary && typeof value.summary === 'object' ? value.summary : {},
    errorMessage: String(value.errorMessage || value.error_message || '').trim() || null,
    startedAt: value.startedAt || value.started_at || null,
    completedAt: value.completedAt || value.completed_at || null,
    createdBy: value.createdBy || value.created_by || null,
    createdAt: value.createdAt || value.created_at || null,
    updatedAt: value.updatedAt || value.updated_at || null,
    documentCount: Number(value.documentCount || value.document_count || 0) || 0,
    findingCount: Number(value.findingCount || value.finding_count || 0) || 0,
    suggestionCount: Number(value.suggestionCount || value.suggestion_count || 0) || 0,
    detailLoaded,
    documents: Array.isArray(value.documents) ? value.documents : [],
    sourceRefs: Array.isArray(value.sourceRefs) ? value.sourceRefs : [],
    requirements: Array.isArray(value.requirements) ? value.requirements : [],
    findings: Array.isArray(value.findings) ? value.findings : [],
    suggestions: Array.isArray(value.suggestions) ? value.suggestions : []
  };
}

function sortedPolicyAlignments(list) {
  return [...(Array.isArray(list) ? list : [])].sort((left, right) => {
    const leftTime = new Date(left?.updatedAt || left?.createdAt || 0).getTime() || 0;
    const rightTime = new Date(right?.updatedAt || right?.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  });
}

function selectedPolicyAlignmentFromState() {
  const selectedId = String(state.policyAlignmentSelectedId || '').trim();
  if (selectedId && state.policyAlignmentCurrent?.id === selectedId) {
    return state.policyAlignmentCurrent;
  }
  return sortedPolicyAlignments(state.policyAlignments).find((item) => item.id === selectedId) || null;
}

async function loadPolicyAlignmentDetail(analysisId, { silent = false } = {}) {
  const nextId = String(analysisId || '').trim();
  if (!nextId || !isLoggedIn()) return null;
  const cached = sortedPolicyAlignments(state.policyAlignments).find((item) => item.id === nextId) || null;
  if (cached) {
    state.policyAlignmentSelectedId = nextId;
    state.policyAlignmentCurrent = cached;
  }
  if (!silent) {
    state.policyAlignmentDetailLoading = true;
    state.policyAlignmentError = '';
    render();
  }
  try {
    const payload = await api(`/api/v1/policy-alignments/${encodeURIComponent(nextId)}`);
    const analysis = normalizePolicyAlignmentAnalysis(payload?.analysis);
    if (!analysis) throw new Error('analysis not found');
    state.policyAlignmentCurrent = analysis;
    state.policyAlignmentSelectedId = analysis.id;
    state.policyAlignments = sortedPolicyAlignments(
      state.policyAlignments.some((item) => item.id === analysis.id)
        ? state.policyAlignments.map((item) => (item.id === analysis.id ? { ...item, ...analysis } : item))
        : [...state.policyAlignments, analysis]
    );
    return analysis;
  } catch (error) {
    state.policyAlignmentError = toUserMessage(error);
    return null;
  } finally {
    if (!silent) {
      state.policyAlignmentDetailLoading = false;
      render();
    }
  }
}

async function refreshPolicyAlignments({ selectedId = null, silent = false } = {}) {
  if (!isLoggedIn() || !state.cycle?.id) {
    resetPolicyAlignmentState();
    return [];
  }
  if (!silent) {
    state.policyAlignmentLoading = true;
    state.policyAlignmentError = '';
    render();
  }
  try {
    const payload = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/policy-alignments`);
    const analyses = sortedPolicyAlignments(
      (Array.isArray(payload?.analyses) ? payload.analyses : [])
        .map((item) => normalizePolicyAlignmentAnalysis(item))
        .filter(Boolean)
    );
    state.policyAlignments = analyses;
    state.policyAlignmentCycleId = String(payload?.cycleId || state.cycle.id || '').trim();
    const preferredId = String(selectedId || state.policyAlignmentSelectedId || analyses[0]?.id || '').trim();
    state.policyAlignmentSelectedId = preferredId;
    if (!preferredId) {
      state.policyAlignmentCurrent = null;
      return analyses;
    }
    const preferredSummary = analyses.find((item) => item.id === preferredId) || null;
    if (preferredSummary) {
      state.policyAlignmentCurrent = preferredSummary;
    }
    const needsDetail = !preferredSummary || !preferredSummary.detailLoaded;
    if (needsDetail) {
      void loadPolicyAlignmentDetail(preferredId, { silent: true });
    }
    return analyses;
  } catch (error) {
    resetPolicyAlignmentState();
    state.policyAlignmentError = toUserMessage(error);
    return [];
  } finally {
    if (!silent) {
      state.policyAlignmentLoading = false;
      render();
    }
  }
}

async function loadInstitutions() {
  const payload = await api('/api/v1/public/institutions', { auth: false });
  state.institutions = Array.isArray(payload?.institutions)
    ? payload.institutions.map((institution) => normalizeInstitutionRecord(institution)).filter(Boolean)
    : [];
  state.institutionsLoaded = true;
}

async function loadContentSettings() {
  const payload = await api('/api/v1/public/content-settings', { auth: false });
  state.contentSettings = normalizeGuideAboutContent(payload);
}

async function loadStrategyMap() {
  const params = new URLSearchParams();
  if (state.institutionSlug) params.set('institution', state.institutionSlug);
  if (state.strategySlug) params.set('strategy', state.strategySlug);
  params.set('source', state.embedMapMode ? 'embed' : 'app');
  const payload = await api(`/api/v1/public/strategy-map?${params.toString()}`, { auth: 'optional' });
  state.mapData = payload || { institutions: [] };
  state.mapStrategicLinksData = null;
  state.mapStrategicLinksError = '';
  state.mapStrategicLinksLoading = false;
  state.mapStrategicLinksPromise = null;
}

function mapPerspectiveKey() {
  return `${normalizeSlug(state.institutionSlug)}|${normalizeSlug(state.strategySlug)}`;
}

function mapSelectedInstitutionRecord() {
  const selectedSlug = normalizeSlug(state.institutionSlug);
  const institutions = Array.isArray(state.mapData?.institutions) ? state.mapData.institutions : [];
  return institutions.find((item) => normalizeSlug(item?.slug) === selectedSlug) || null;
}

function collectDirectStrategicLinkTargets(activeInstitution) {
  const institution = activeInstitution && typeof activeInstitution === 'object' ? activeInstitution : null;
  if (!institution) {
    return {
      targets: [],
      sourceGuidelineIdsByTarget: {},
      targetGuidelineIdsByTarget: {},
      linksByTarget: {}
    };
  }

  const targetsByKey = new Map();
  const sourceGuidelineIdsByTarget = {};
  const targetGuidelineIdsByTarget = {};
  const linksByTarget = {};
  const guidelines = Array.isArray(institution.guidelines) ? institution.guidelines : [];

  guidelines.forEach((guideline) => {
    const sourceGuidelineId = String(guideline?.id || '').trim();
    if (!sourceGuidelineId) return;
    const links = normalizeGuidelineStrategyLinks(guideline?.strategyLinks);
    links.forEach((link) => {
      if (!link?.isCrossStrategy) return;
      const institutionSlug = normalizeSlug(link.otherInstitutionSlug);
      if (!institutionSlug) return;

      const preferredStrategySlug = normalizeSlug(link.otherStrategySlug);
      const resolvedStrategySlug = resolveStrategySlugForInstitution(institutionSlug, preferredStrategySlug);
      const strategySlug = normalizeSlug(resolvedStrategySlug || preferredStrategySlug);
      if (!strategySlug) return;

      const targetGuidelineId = String(link.otherGuidelineId || '').trim();
      if (!targetGuidelineId) return;

      const key = `${institutionSlug}|${strategySlug}`;
      if (!targetsByKey.has(key)) {
        targetsByKey.set(key, {
          key,
          institutionSlug,
          strategySlug,
          institutionName: String(link.otherInstitutionName || institutionSlug).trim() || institutionSlug,
          strategyTitle: String(link.otherStrategyTitle || strategySlug).trim() || strategySlug
        });
      }

      if (!sourceGuidelineIdsByTarget[key]) sourceGuidelineIdsByTarget[key] = new Set();
      if (!targetGuidelineIdsByTarget[key]) targetGuidelineIdsByTarget[key] = new Set();
      if (!linksByTarget[key]) linksByTarget[key] = [];
      sourceGuidelineIdsByTarget[key].add(sourceGuidelineId);
      targetGuidelineIdsByTarget[key].add(targetGuidelineId);
      linksByTarget[key].push({
        sourceGuidelineId,
        targetGuidelineId
      });
    });
  });

  return {
    targets: Array.from(targetsByKey.values()),
    sourceGuidelineIdsByTarget,
    targetGuidelineIdsByTarget,
    linksByTarget
  };
}

async function loadStrategyMapForPerspective(institutionSlug, strategySlug) {
  const params = new URLSearchParams();
  params.set('institution', normalizeSlug(institutionSlug));
  const normalizedStrategySlug = normalizeSlug(strategySlug);
  if (normalizedStrategySlug) params.set('strategy', normalizedStrategySlug);
  params.set('source', state.embedMapMode ? 'embed' : 'app');
  const payload = await api(`/api/v1/public/strategy-map?${params.toString()}`, { auth: 'optional' });
  const institutions = Array.isArray(payload?.institutions) ? payload.institutions : [];
  return institutions[0] || null;
}

async function ensureStrategicLinksData({ force = false } = {}) {
  const currentKey = mapPerspectiveKey();
  if (!force && state.mapStrategicLinksData?.contextKey === currentKey) {
    return state.mapStrategicLinksData;
  }
  if (!force && state.mapStrategicLinksPromise) {
    return state.mapStrategicLinksPromise;
  }

  const loader = (async () => {
    state.mapStrategicLinksLoading = true;
    state.mapStrategicLinksError = '';

    const activeInstitution = mapSelectedInstitutionRecord();
    if (!activeInstitution) {
      const empty = {
        contextKey: currentKey,
        activeInstitution: null,
        relatedStrategies: [],
        linksByStrategyKey: {},
        hasLinks: false
      };
      state.mapStrategicLinksData = empty;
      return empty;
    }

    const targetCollection = collectDirectStrategicLinkTargets(activeInstitution);
    const targets = Array.isArray(targetCollection.targets) ? targetCollection.targets : [];
    if (!targets.length) {
      const activeKey = `${normalizeSlug(activeInstitution.slug)}|${normalizeSlug(activeInstitution.strategy?.slug || state.strategySlug)}`;
      const empty = {
        contextKey: currentKey,
        activeInstitution,
        relatedStrategies: [],
        linksByStrategyKey: {
          [activeKey]: []
        },
        hasLinks: false
      };
      state.mapStrategicLinksData = empty;
      return empty;
    }

    const loaded = await Promise.all(targets.map(async (target) => {
      try {
        const institution = await loadStrategyMapForPerspective(target.institutionSlug, target.strategySlug);
        if (!institution?.cycle?.id) return null;
        const key = `${normalizeSlug(institution.slug)}|${normalizeSlug(institution.strategy?.slug || target.strategySlug)}`;
        return {
          ...target,
          key,
          institution,
          sourceGuidelineIds: Array.from(targetCollection.sourceGuidelineIdsByTarget[target.key] || []),
          targetGuidelineIds: Array.from(targetCollection.targetGuidelineIdsByTarget[target.key] || []),
          links: Array.isArray(targetCollection.linksByTarget[target.key]) ? targetCollection.linksByTarget[target.key] : []
        };
      } catch {
        return null;
      }
    }));

    const relatedStrategies = loaded.filter(Boolean);
    const activeStrategyKey = `${normalizeSlug(activeInstitution.slug)}|${normalizeSlug(activeInstitution.strategy?.slug || state.strategySlug)}`;
    const linksByStrategyKey = {
      [activeStrategyKey]: Array.from(new Set(relatedStrategies.flatMap((item) => item.sourceGuidelineIds || [])))
    };
    relatedStrategies.forEach((item) => {
      linksByStrategyKey[item.key] = Array.from(new Set(item.targetGuidelineIds || []));
    });

    const hasLinks = relatedStrategies.some((item) => Array.isArray(item.links) && item.links.length > 0);
    const result = {
      contextKey: currentKey,
      activeInstitution,
      relatedStrategies,
      linksByStrategyKey,
      hasLinks
    };
    state.mapStrategicLinksData = result;
    if (!hasLinks) {
      state.mapStrategicLinksError = '';
    }
    return result;
  })()
    .catch((error) => {
      state.mapStrategicLinksData = null;
      state.mapStrategicLinksError = toUserMessage(error);
      throw error;
    })
    .finally(() => {
      state.mapStrategicLinksLoading = false;
      state.mapStrategicLinksPromise = null;
    });

  state.mapStrategicLinksPromise = loader;
  return loader;
}

async function loadMemberContext() {
  const buildContextPath = () => {
    const params = new URLSearchParams();
    if (state.strategySlug) params.set('strategy', state.strategySlug);
    return `/api/v1/me/context${params.toString() ? `?${params.toString()}` : ''}`;
  };

  let context = await api(buildContextPath());
  if (!context?.institution?.slug) throw new Error('Nepavyko gauti naudotojo konteksto.');

  const selectedSlug = normalizeSlug(state.institutionSlug);
  const currentContextSlug = normalizeSlug(context.institution.slug);

  if (selectedSlug && currentContextSlug !== selectedSlug && !state.embedMapMode && normalizeSlug(state.strategySlug)) {
    try {
      await switchInstitutionSession(selectedSlug, state.strategySlug);
      context = await api(buildContextPath());
    } catch {
      state.accountContext = context;
      state.role = context.membership?.role || state.role || 'member';
      state.user = state.user || context.user || null;
      state.context = null;
      state.userVotes = {};
      persistAuthToStorage();
      return;
    }
  }

  state.accountContext = context;
  state.role = context.membership?.role || state.role || 'member';
  state.user = state.user || context.user || null;
  const contextStrategy = normalizeStrategyRecord(context.strategy);
  if (
    contextStrategy
    && normalizeSlug(state.strategySlug)
    && normalizeSlug(contextStrategy.slug) === normalizeSlug(state.strategySlug)
  ) {
    state.strategy = contextStrategy;
  }
  persistAuthToStorage();

  if (normalizeSlug(context.institution?.slug) !== selectedSlug) {
    state.context = null;
    state.userVotes = {};
    return;
  }

  state.context = context;
  if (context.cycle?.id) {
    const votesPayload = await api(`/api/v1/cycles/${encodeURIComponent(context.cycle.id)}/my-votes`);
    const nextVotes = {};
    (votesPayload.guidelineVotes || votesPayload.votes || []).forEach((vote) => {
      nextVotes[vote.guidelineId] = Number(vote.score || 0);
    });
    (votesPayload.initiativeVotes || []).forEach((vote) => {
      nextVotes[vote.initiativeId] = Number(vote.score || 0);
    });
    state.userVotes = nextVotes;
  } else {
    state.userVotes = {};
  }
}

async function switchInstitutionSession(institutionSlug, strategySlug = state.strategySlug) {
  const nextSlug = normalizeSlug(institutionSlug);
  if (!nextSlug || !state.token || state.embedMapMode) return;
  const nextStrategySlug = normalizeSlug(strategySlug);
  const payload = await api('/api/v1/auth/switch-institution', {
    method: 'POST',
    body: {
      institutionSlug: nextSlug,
      strategySlug: nextStrategySlug || undefined
    }
  });
  if (payload?.token) setSession(payload);
}

async function bootstrap() {
  state.loading = true;
  state.error = '';
  render();

  try {
    await loadInstitutions();
    if (state.institutionSlug) ensureSelectedStrategySlug();
    try {
      await loadContentSettings();
    } catch {
      state.contentSettings = normalizeGuideAboutContent(null);
    }
    try {
      await loadStrategyMap();
      state.mapError = '';
    } catch (error) {
      state.mapData = { institutions: [] };
      state.mapError = toUserMessage(error);
    }

    if (!state.institutionSlug) {
      clearRouteEntity();
      state.institution = null;
      state.strategy = null;
      state.strategySlug = '';
      state.cycle = null;
      state.summary = null;
      state.guidelines = [];
      state.initiatives = [];
      state.commentsVisible = false;
      state.userVotes = {};
      state.historyEntries = [];
      state.historyRows = [];
      state.historyError = '';
      state.historyCycleId = '';
      resetPolicyAlignmentState();
      return;
    }

    if (!state.strategySlug) {
      clearRouteEntityForView('guidelines');
      state.activeView = 'guidelines';
      state.institution = normalizeInstitutionRecord(
        (state.institutions || []).find((institution) => normalizeSlug(institution.slug) === normalizeSlug(state.institutionSlug)) || null
      );
      state.strategy = null;
      state.cycle = null;
      state.summary = null;
      state.guidelines = [];
      state.initiatives = [];
      state.commentsVisible = false;
      state.context = null;
      state.userVotes = {};
      state.historyEntries = [];
      state.historyRows = [];
      state.historyError = '';
      state.historyCycleId = '';
      return;
    }

    await loadPublicData();
    ensureSelectedStrategySlug();
    await resolveRouteEntityAliasIfNeeded();
    if (state.token && !state.embedMapMode && state.strategySlug) {
      try {
        await loadMemberContext();
        await refreshHistory();
      } catch (error) {
        const raw = String(error?.message || '').toLowerCase();
        if (raw === 'invalid token' || raw === 'unauthorized') {
          clearSession();
          throw error;
        }
        state.context = null;
        state.userVotes = {};
        state.historyEntries = [];
        state.historyRows = [];
        state.historyError = '';
        state.historyCycleId = '';
        resetPolicyAlignmentState();
      }
    } else if (state.embedMapMode) {
      state.context = null;
      state.userVotes = {};
      state.historyEntries = [];
      state.historyRows = [];
      state.historyError = '';
      state.historyCycleId = '';
      resetPolicyAlignmentState();
    } else {
      state.historyEntries = [];
      state.historyRows = [];
      state.historyError = '';
      state.historyCycleId = '';
      resetPolicyAlignmentState();
    }
  } catch (error) {
    state.error = toUserMessage(error);
    notifyError(state.error);
  } finally {
    state.loading = false;
    render();
  }
}

async function runBusy(task) {
  if (state.busy) return;
  state.busy = true;
  state.notice = '';
  render();
  try {
    await task();
  } catch (error) {
    state.notice = toUserMessage(error);
    notifyError(state.notice);
  } finally {
    state.busy = false;
    render();
  }
}

function formatInstitutionDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getElementCenter(element) {
  if (!(element instanceof HTMLElement)) return null;
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 + window.scrollX,
    y: rect.top + rect.height / 2 + window.scrollY
  };
}

function triggerVoteBurstAt(origin, delta) {
  if (!origin) return;
  const burst = document.createElement('div');
  burst.className = 'vote-burst';
  burst.style.left = `${origin.x}px`;
  burst.style.top = `${origin.y}px`;

  const colors = delta > 0
    ? ['#2b6fbe', '#1f4f84', '#3f8fe6', '#8fc2ff']
    : ['#235896', '#1f4f84', '#2b6fbe', '#8fc2ff'];

  for (let i = 0; i < 10; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'vote-burst-dot';
    const angle = (Math.PI * 2 * i) / 10;
    const distance = 20 + Math.random() * 20;
    dot.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    dot.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    dot.style.setProperty('--color', colors[i % colors.length]);
    dot.style.setProperty('--delay', `${Math.random() * 0.08}s`);
    burst.appendChild(dot);
  }

  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 700);
}

function renderInstitutionPicker() {
  if (!elements.institutionPicker) return;
  elements.institutionPicker.hidden = true;
  elements.institutionPicker.innerHTML = '';
}

function institutionSelectMarkup() {
  const selectedSlug = normalizeSlug(state.institutionSlug);
  const institutions = Array.isArray(state.institutions) ? state.institutions : [];
  const hasInstitutions = institutions.length > 0;
  const loading = state.loading && !state.institutionsLoaded;
  const options = institutions.map((institution) => {
    const slug = normalizeSlug(institution.slug);
    const name = institution.name || slug || '-';
    const selected = slug === selectedSlug ? ' selected' : '';
    return `<option value="${escapeHtml(slug)}"${selected}>${escapeHtml(name)}</option>`;
  }).join('');

  const institutionLabel = langText('Institucija', 'Institution');
  const institutionTitle = langText('Pasirinkite institucija perziurai', 'Select institution for viewing');
  return `
    <label class="institution-switcher" title="${escapeHtml(institutionTitle)}">
      <span>${escapeHtml(institutionLabel)}</span>
      <select id="institutionSwitchSelect" ${loading || !hasInstitutions ? 'disabled' : ''}>
        ${options}
      </select>
    </label>
  `;
}

function strategySelectMarkup() {
  const selectedSlug = normalizeSlug(state.strategySlug);
  const strategies = strategiesForSelectedInstitution();
  const rememberedSlug = rememberedStrategySlugForInstitution(state.institutionSlug);
  const hasStrategies = strategies.length > 0;
  const loading = state.loading && !state.institutionsLoaded;
  const options = strategies.map((strategy) => {
    const slug = normalizeSlug(strategy.slug);
    const isRemembered = rememberedSlug && rememberedSlug === slug;
    const title = String(strategy.title || slug || '-').trim();
    const decoratedTitle = isRemembered
      ? `${title} (${langText('paskutinis pasirinktas', 'last used')})`
      : title;
    const selected = slug === selectedSlug ? ' selected' : '';
    return `<option value="${escapeHtml(slug)}"${selected}>${escapeHtml(decoratedTitle)}</option>`;
  }).join('');
  const placeholder = hasStrategies
    ? `<option value="" ${selectedSlug ? '' : 'selected'} disabled>${escapeHtml(langText('Pasirinkite strategija', 'Select strategy'))}</option>`
    : '';

  const strategyLabel = langText('Strategija', 'Strategy');
  const strategyTitle = langText('Pasirinkite strategija perziurai', 'Select strategy for viewing');
  return `
    <label class="institution-switcher strategy-switcher" title="${escapeHtml(strategyTitle)}">
      <span>${escapeHtml(strategyLabel)}</span>
      <select id="strategySwitchSelect" ${loading || !hasStrategies ? 'disabled' : ''}>
        ${placeholder}${options}
      </select>
    </label>
  `;
}

function normalizeInstitutionWebsiteUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(raw)) return `https://${raw}`;
  return '';
}

function selectedInstitutionInfo() {
  const currentSlug = normalizeSlug(state.institutionSlug);
  if (!currentSlug) return null;

  const fromList = (state.institutions || []).find((institution) => normalizeSlug(institution.slug) === currentSlug) || null;
  const fromCurrent = normalizeSlug(state.institution?.slug) === currentSlug
    ? normalizeInstitutionRecord(state.institution)
    : null;
  const base = fromCurrent || fromList;
  if (!base) return null;

  const selectedStrategySlug = normalizeSlug(state.strategySlug);
  const institutionStrategies = Array.isArray(base.strategies) ? base.strategies : [];
  const activeStrategy = institutionStrategies.find((item) => normalizeSlug(item.slug) === selectedStrategySlug)
    || (normalizeSlug(state.strategy?.slug) === selectedStrategySlug ? state.strategy : null);

  const fallback = INSTITUTION_INFO_FALLBACK[currentSlug] || {};
  return {
    name: String(base.name || currentSlug).trim(),
    slug: currentSlug,
    strategyTitle: String(activeStrategy?.title || activeStrategy?.slug || '').trim(),
    countryCode: String(base.countryCode || fallback.countryCode || '').trim().toUpperCase(),
    websiteUrl: normalizeInstitutionWebsiteUrl(base.websiteUrl || fallback.websiteUrl || '')
  };
}

function institutionInfoMarkup() {
  const info = selectedInstitutionInfo();
  if (!info) return '';

  const countryValue = info.countryCode
    ? `${COUNTRY_LABELS[info.countryCode] || info.countryCode} (${info.countryCode})`
    : 'Not set';
  const websiteValue = info.websiteUrl
    ? `<a href="${escapeHtml(info.websiteUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(info.websiteUrl)}</a>`
    : '<span class="institution-info-empty">Not set</span>';

  return `
    <div class="step-utility-card institution-info-card">
      <div class="institution-info-head">
        <strong>${escapeHtml(info.name)}</strong>
      </div>
      <div class="institution-info-row">
        <span class="institution-info-label">Strategy</span>
        <span class="institution-info-value">${escapeHtml(info.strategyTitle || '-')}</span>
      </div>
      <div class="institution-info-row">
        <span class="institution-info-label">Country</span>
        <span>${escapeHtml(countryValue)}</span>
      </div>
      <div class="institution-info-row">
        <span class="institution-info-label">Website</span>
        <span class="institution-info-value">${websiteValue}</span>
      </div>
    </div>
  `;
}

function bindInstitutionSwitch(container) {
  const select = container.querySelector('#institutionSwitchSelect');
  if (!select) return;

  select.addEventListener('change', async () => {
    const slug = normalizeSlug(select.value);
    if (slug === normalizeSlug(state.institutionSlug)) return;

    state.institutionSlug = slug;
    state.strategySlug = '';
    state.strategy = null;
    state.strategySwitcherDialogOpen = false;
    clearRouteEntityForView('guidelines');
    if (state.activeView === 'admin') {
      state.activeView = 'guidelines';
    }
    state.expandedStepId = '';
    syncRouteState();

    if (isAuthenticated() && !state.embedMapMode && normalizeSlug(state.strategySlug)) {
      try {
        await switchInstitutionSession(slug, state.strategySlug);
      } catch (error) {
        const raw = String(error?.message || '').toLowerCase();
        if (raw === 'invalid token' || raw === 'unauthorized') {
          clearSession();
        }
      }
    }

    await bootstrap();
  });
}

function bindStrategySwitch(container) {
  const select = container.querySelector('#strategySwitchSelect');
  if (!select) return;

  select.addEventListener('change', async () => {
    const slug = normalizeSlug(select.value);
    if (!slug) return;
    if (slug === normalizeSlug(state.strategySlug)) return;

    state.strategySlug = slug;
    state.strategy = (strategiesForSelectedInstitution() || []).find((item) => normalizeSlug(item.slug) === slug) || null;
    rememberStrategySlugForInstitution(state.institutionSlug, slug);
    state.strategySwitcherDialogOpen = false;
    clearRouteEntity();
    syncRouteState();

    if (isAuthenticated() && !state.embedMapMode && state.institutionSlug) {
      try {
        await switchInstitutionSession(state.institutionSlug, slug);
      } catch (error) {
        const raw = String(error?.message || '').toLowerCase();
        if (raw === 'invalid token' || raw === 'unauthorized') {
          clearSession();
        }
      }
    }

    await bootstrap();
  });
}

function canOpenAdminView() {
  return Boolean(
    state.institutionSlug &&
    isAuthenticated() &&
    state.role === 'institution_admin' &&
    state.accountContext?.institution?.slug === state.institutionSlug
  );
}

function setActiveView(nextView) {
  if (!ALLOWED_VIEWS.has(nextView)) return;
  if (state.activeView === nextView) return;
  if (nextView !== 'map') {
    resetMapInitiativeFocusState();
  }
  clearRouteEntityForView(nextView);
  state.activeView = nextView;
  syncRouteState();
  render();
}

function canExpandStepWithAddAction(stepId) {
  return stepId === 'guidelines' || stepId === 'initiatives';
}

function quickAddActionLabel(stepId) {
  if (stepId === 'guidelines') return langText('PridÄ—ti naujÄ… gairÄ™', 'Add new guideline');
  if (stepId === 'initiatives') return langText('PridÄ—ti naujÄ… iniciatyvÄ…', 'Add new initiative');
  return '';
}

function scheduleAddSectionScroll(stepId) {
  const targetId = STEP_ADD_SECTION_IDS[stepId];
  if (!targetId) return;
  state.pendingAddSectionScrollId = targetId;
}

function flushPendingAddSectionScroll() {
  if (!state.pendingAddSectionScrollId) return;
  const target = document.getElementById(state.pendingAddSectionScrollId);
  if (!target) return;

  state.pendingAddSectionScrollId = '';
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.remove('jump-target-pulse');
  void target.offsetWidth;
  target.classList.add('jump-target-pulse');
  window.setTimeout(() => target.classList.remove('jump-target-pulse'), 900);

  const focusTarget = target.querySelector('input[type="text"], textarea');
  if (focusTarget instanceof HTMLElement) {
    window.setTimeout(() => {
      focusTarget.focus({ preventScroll: true });
    }, 260);
  }
}

function scheduleGuidelineFocus(guidelineId) {
  const nextId = String(guidelineId || '').trim();
  state.pendingGuidelineFocusId = nextId || '';
}

function scheduleInitiativeFocus(initiativeId) {
  const nextId = String(initiativeId || '').trim();
  state.pendingInitiativeFocusId = nextId || '';
}

function scheduleMapNodeFocus(kind, entityId) {
  const normalizedKind = String(kind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
  const nextId = String(entityId || '').trim();
  if (!nextId) return;
  state.pendingMapFocusKind = normalizedKind;
  state.pendingMapFocusId = nextId;
}

function openGuidelineDetail(guidelineId) {
  const nextId = String(guidelineId || '').trim();
  if (!nextId) return;
  setRouteEntity('guideline', nextId);
  state.activeView = 'guideline-detail';
  syncRouteState();
  render();
}

function openInitiativeDetail(initiativeId) {
  const nextId = String(initiativeId || '').trim();
  if (!nextId) return;
  setRouteEntity('initiative', nextId);
  state.activeView = 'initiative-detail';
  syncRouteState();
  render();
}

function openMapForCard(kind, entityId) {
  const normalizedKind = String(kind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
  const nextId = String(entityId || '').trim();
  if (!nextId) return;

  if (typeof resetMapInitiativeFocusState === 'function') {
    resetMapInitiativeFocusState();
  }
  state.mapInstitutionPulseUntil = 0;
  if (state.mapInstitutionPulseTimerId) {
    window.clearTimeout(state.mapInstitutionPulseTimerId);
    state.mapInstitutionPulseTimerId = 0;
  }
  state.mapLayer = normalizedKind === 'initiative' ? 'initiatives' : 'guidelines';
  scheduleMapNodeFocus(normalizedKind, nextId);
  setActiveView('map');
}

function flushPendingGuidelineFocus() {
  const pendingId = String(state.pendingGuidelineFocusId || '').trim();
  if (!pendingId) return;
  if (state.activeView !== 'guidelines') return;
  if (!(elements.stepView instanceof HTMLElement)) return;

  const cards = Array.from(elements.stepView.querySelectorAll('[data-guideline-id]'));
  const target = cards.find((card) => String(card?.dataset?.guidelineId || '').trim() === pendingId);
  if (!(target instanceof HTMLElement)) return;

  state.pendingGuidelineFocusId = '';
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.classList.remove('guideline-focus-pulse');
  void target.offsetWidth;
  target.classList.add('guideline-focus-pulse');
  window.setTimeout(() => target.classList.remove('guideline-focus-pulse'), 1000);
  clearGuidelineFocusQuery();
}

function flushPendingInitiativeFocus() {
  const pendingId = String(state.pendingInitiativeFocusId || '').trim();
  if (!pendingId) return;
  if (state.activeView !== 'initiatives') return;
  if (!(elements.stepView instanceof HTMLElement)) return;

  const cards = Array.from(elements.stepView.querySelectorAll('[data-initiative-id]'));
  const target = cards.find((card) => String(card?.dataset?.initiativeId || '').trim() === pendingId);
  if (!(target instanceof HTMLElement)) return;

  state.pendingInitiativeFocusId = '';
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.classList.remove('initiative-focus-pulse');
  void target.offsetWidth;
  target.classList.add('initiative-focus-pulse');
  window.setTimeout(() => target.classList.remove('initiative-focus-pulse'), 1000);
  clearInitiativeFocusQuery();
}

function strategySwitcherCardMarkup(options = {}) {
  const topbar = Boolean(options.topbar);
  const info = selectedInstitutionInfo();
  const institutionName = String(info?.name || state.institutionSlug || '-').trim() || '-';
  const strategyTitle = String(
    info?.strategyTitle || state.strategy?.title || state.strategySlug || langText('Pasirinkite strategija', 'Select strategy')
  ).trim() || langText('Pasirinkite strategija', 'Select strategy');
  const loading = state.loading && !state.institutionsLoaded;
  const dialogOpen = Boolean(state.strategySwitcherDialogOpen);
  const showCreateStrategyAction = canManageSelectedInstitution();
  const createButtonLabel = langText('Sukurti strategija', 'Create strategy');
  const guideButtonLabel = langText('Naudojimosi gidas', 'User guide');

  return `
    <div class="step-utility-card strategy-switcher-card ${topbar ? 'strategy-switcher-card-topbar' : ''} ${dialogOpen ? 'is-open' : ''}">
      <button
        id="toggleStrategySwitcherDialogBtn"
        type="button"
        class="strategy-switcher-summary"
        ${loading ? 'disabled' : ''}
        aria-expanded="${dialogOpen ? 'true' : 'false'}"
      >
        <div class="strategy-switcher-inline">
          <span class="strategy-switcher-item">
            <span class="strategy-switcher-label">Institution</span>
            <strong title="${escapeHtml(institutionName)}">${escapeHtml(institutionName)}</strong>
          </span>
          <span class="strategy-switcher-separator" aria-hidden="true">&middot;</span>
          <span class="strategy-switcher-item">
            <span class="strategy-switcher-label">Strategy</span>
            <strong title="${escapeHtml(strategyTitle)}">${escapeHtml(strategyTitle)}</strong>
          </span>
        </div>
      </button>
      <div class="strategy-switcher-dialog" ${dialogOpen ? '' : 'hidden'}>
        ${institutionSelectMarkup()}
        ${strategySelectMarkup()}
        ${showCreateStrategyAction
    ? `<button id="openStrategyCreateModalBtn" type="button" class="btn btn-primary strategy-switcher-create-btn">${escapeHtml(createButtonLabel)}</button>`
    : ''}
        <div class="strategy-switcher-utility-row">
          <button id="openGuideFromSwitcherBtn" type="button" class="btn btn-ghost strategy-switcher-guide-btn">${escapeHtml(guideButtonLabel)}</button>
          <div class="step-utility-card-language strategy-switcher-language" data-language-switch></div>
        </div>
      </div>
    </div>
  `;
}

function bindStrategySwitcherDialog(container) {
  const toggleButton = container.querySelector('#toggleStrategySwitcherDialogBtn');
  if (!toggleButton) return;
  toggleButton.addEventListener('click', () => {
    state.strategySwitcherDialogOpen = !state.strategySwitcherDialogOpen;
    render();
  });
  const guideButton = container.querySelector('#openGuideFromSwitcherBtn');
  if (guideButton) {
    guideButton.addEventListener('click', () => {
      state.strategySwitcherDialogOpen = false;
      setActiveView('guide');
    });
  }
  const createStrategyButton = container.querySelector('#openStrategyCreateModalBtn');
  if (createStrategyButton) {
    createStrategyButton.addEventListener('click', () => {
      showStrategyCreateModal();
    });
  }
}

function clearGuidelineFocusQuery() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has(FOCUS_GUIDELINE_QUERY_KEY)) return;
  params.delete(FOCUS_GUIDELINE_QUERY_KEY);
  const href = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  window.history.replaceState(null, '', href);
}

function clearInitiativeFocusQuery() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has(FOCUS_INITIATIVE_QUERY_KEY)) return;
  params.delete(FOCUS_INITIATIVE_QUERY_KEY);
  const href = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  window.history.replaceState(null, '', href);
}

function resolveStrategySlugForInstitution(institutionSlug, preferredStrategySlug = '') {
  const normalizedInstitutionSlug = normalizeSlug(institutionSlug);
  const normalizedPreferred = normalizeSlug(preferredStrategySlug);
  if (!normalizedInstitutionSlug) return '';

  const institution = (state.institutions || []).find((item) => normalizeSlug(item.slug) === normalizedInstitutionSlug) || null;
  const strategies = Array.isArray(institution?.strategies) ? institution.strategies : [];
  if (!strategies.length) return normalizedPreferred;
  if (normalizedPreferred && strategies.some((item) => normalizeSlug(item.slug) === normalizedPreferred)) {
    return normalizedPreferred;
  }
  const rememberedSlug = rememberedStrategySlugForInstitution(normalizedInstitutionSlug);
  if (rememberedSlug && strategies.some((item) => normalizeSlug(item.slug) === rememberedSlug)) {
    return rememberedSlug;
  }
  return '';
}

async function navigateToStrategyLink(payload = {}) {
  const targetInstitutionSlug = normalizeSlug(
    payload.otherInstitutionSlug || payload.targetInstitutionSlug || payload.institutionSlug
  );
  const targetGuidelineId = String(
    payload.otherGuidelineId || payload.targetGuidelineId || payload.guidelineId || ''
  ).trim();

  if (!targetInstitutionSlug) return;

  const requestedStrategySlug = normalizeSlug(
    payload.otherStrategySlug || payload.targetStrategySlug || payload.strategySlug
  );
  const targetStrategySlug = resolveStrategySlugForInstitution(targetInstitutionSlug, requestedStrategySlug);
  const currentInstitutionSlug = normalizeSlug(state.institutionSlug);
  const currentStrategySlug = normalizeSlug(state.strategySlug);

  if (
    targetInstitutionSlug === currentInstitutionSlug
    && targetStrategySlug === currentStrategySlug
    && state.activeView === 'guidelines'
  ) {
    scheduleGuidelineFocus(targetGuidelineId);
    syncRouteState();
    render();
    return;
  }

  await runBusy(async () => {
    state.institutionSlug = targetInstitutionSlug;
    state.strategySlug = targetStrategySlug;
    state.strategy = null;
    state.activeView = 'guidelines';
    state.expandedStepId = '';
    clearRouteEntityForView('guidelines');
    scheduleGuidelineFocus(targetGuidelineId);
    syncRouteState();

    if (isAuthenticated() && !state.embedMapMode && normalizeSlug(targetStrategySlug)) {
      try {
        await switchInstitutionSession(targetInstitutionSlug, targetStrategySlug);
      } catch (error) {
        const raw = String(error?.message || '').toLowerCase();
        if (raw === 'invalid token' || raw === 'unauthorized') {
          clearSession();
        }
      }
    }

    await bootstrap();
  });
}

async function navigateToStrategyPerspective(payload = {}) {
  const targetInstitutionSlug = normalizeSlug(payload.institutionSlug || payload.targetInstitutionSlug);
  if (!targetInstitutionSlug) return;

  const requestedStrategySlug = normalizeSlug(payload.strategySlug || payload.targetStrategySlug);
  const targetStrategySlug = resolveStrategySlugForInstitution(targetInstitutionSlug, requestedStrategySlug);
  const preserveStrategicLayer = Boolean(payload.preserveStrategicLayer);
  const nextMapLayer = preserveStrategicLayer ? 'strategic-links' : 'guidelines';
  const samePerspective = (
    targetInstitutionSlug === normalizeSlug(state.institutionSlug)
    && targetStrategySlug === normalizeSlug(state.strategySlug)
  );

  if (samePerspective) {
    clearRouteEntityForView('map');
    state.activeView = 'map';
    state.mapLayer = nextMapLayer;
    syncRouteState();
    render();
    return;
  }

  await runBusy(async () => {
    state.institutionSlug = targetInstitutionSlug;
    state.strategySlug = targetStrategySlug;
    state.strategy = null;
    clearRouteEntityForView('map');
    state.activeView = 'map';
    state.mapLayer = nextMapLayer;
    state.expandedStepId = '';
    state.mapStrategicLinksData = null;
    state.mapStrategicLinksError = '';
    state.mapStrategicLinksLoading = false;
    state.mapStrategicLinksPromise = null;
    syncRouteState();

    if (isAuthenticated() && !state.embedMapMode && normalizeSlug(targetStrategySlug)) {
      try {
        await switchInstitutionSession(targetInstitutionSlug, targetStrategySlug);
      } catch (error) {
        const raw = String(error?.message || '').toLowerCase();
        if (raw === 'invalid token' || raw === 'unauthorized') {
          clearSession();
        }
      }
    }

    await bootstrap();
    clearRouteEntityForView('map');
    state.activeView = 'map';
    state.mapLayer = nextMapLayer;
    syncRouteState();
  });
}

function openStepAddSection(stepId) {
  if (!canExpandStepWithAddAction(stepId)) return;
  scheduleAddSectionScroll(stepId);
  state.expandedStepId = stepId;
  if (state.activeView !== stepId) {
    setActiveView(stepId);
    return;
  }
  flushPendingAddSectionScroll();
}

function stepIconMarkup(stepId) {
  const id = String(stepId || '').trim().toLowerCase();
  const wrap = (inner) => `<svg class="step-icon-svg" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;

  if (id === 'guidelines') {
    return wrap(`
      <circle cx="12" cy="12" r="6.6"></circle>
      <circle cx="12" cy="12" r="2.4"></circle>
      <path d="M12 2.8v2.8M12 18.4v2.8M2.8 12h2.8M18.4 12h2.8"></path>
    `);
  }

  if (id === 'initiatives') {
    return wrap(`
      <path d="M7 3.8v16.4"></path>
      <path d="M8 5.2h9l-2.3 3.2L17 11.7H8"></path>
      <circle cx="7" cy="19.2" r="1.4"></circle>
    `);
  }

  if (id === 'implementation-plan') {
    return wrap(`
      <rect x="4.4" y="5.4" width="15.2" height="14.2" rx="2.4"></rect>
      <path d="M8 3.4v4"></path>
      <path d="M16 3.4v4"></path>
      <path d="M4.4 9.4h15.2"></path>
      <path d="M8 12.8h3.1"></path>
      <path d="M8 16h5.4"></path>
    `);
  }

  if (id === 'policy-alignment') {
    return wrap(`
      <path d="M5.4 5.2h6.8v13.6H5.4z"></path>
      <path d="M12.2 7.4h6.4v11.4h-6.4z"></path>
      <path d="M7.2 8.6h3.2"></path>
      <path d="M7.2 11.4h3.2"></path>
      <path d="M14.2 11h2.4"></path>
      <path d="M14.2 13.8h2.4"></path>
      <path d="M9.8 15.8l3.2-2.2"></path>
    `);
  }

  if (id === 'history') {
    return wrap(`
      <path d="M4.2 12a7.8 7.8 0 1 0 2.2-5.4"></path>
      <path d="M4.2 5.4v3.7h3.7"></path>
      <path d="M12 7.6v4.7l3.3 2.1"></path>
    `);
  }

  if (id === 'admin') {
    return wrap(`
      <path d="M4.5 7.2h15"></path>
      <path d="M4.5 16.8h15"></path>
      <circle cx="9" cy="7.2" r="2"></circle>
      <circle cx="15.2" cy="16.8" r="2"></circle>
    `);
  }

  if (id === 'map') {
    return wrap(`
      <path d="M3.6 6.3L9 4.2l6 2.1 5.4-2.1v13.5L15 19.8l-6-2.1-5.4 2.1z"></path>
      <path d="M9 4.2v13.5"></path>
      <path d="M15 6.3v13.5"></path>
    `);
  }

  return wrap('<circle cx="12" cy="12" r="6"></circle>');
}

function renderSteps() {
  if (!elements.steps) return;
  const sidebarCollapseAllowed = !state.embedMapMode && !isEmbeddedContext();
  const sidebarCollapsed = sidebarCollapseAllowed && Boolean(state.sidebarCollapsed);
  elements.steps.classList.toggle('is-collapsed', sidebarCollapsed);
  if (elements.mainLayout) {
    elements.mainLayout.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  }
  elements.steps.innerHTML = '';

  if (!canExpandStepWithAddAction(state.activeView)) {
    state.expandedStepId = '';
  } else if (state.expandedStepId && state.expandedStepId !== state.activeView) {
    state.expandedStepId = '';
  }

  const canOpenAdmin = canOpenAdminView();
  const canOpenHistory = isLoggedIn();
  const canOpenPolicyAlignment = isLoggedIn();
  const openPendingProposalCount = canOpenAdmin
    ? (Array.isArray(state.historyEntries)
      ? state.historyEntries.filter((item) => String(item?.status || '').trim().toLowerCase() === 'pending').length
      : 0)
    : 0;
  const items = [
    { id: 'guidelines', title: langText('GairÄ—s', 'Guidelines'), locked: false },
    { id: 'initiatives', title: langText('Iniciatyvos', 'Initiatives'), locked: false },
    { id: 'history', title: langText('Istorija', 'History'), locked: !canOpenHistory },
    { id: 'admin', title: 'Admin', locked: !canOpenAdmin, alert: openPendingProposalCount > 0 },
    { id: 'map', title: langText('StrategijÅ³ Å¾emÄ—lapis', 'Strategy map'), locked: false },
    { id: 'implementation-plan', title: langText('Įgyvendinimo planas', 'Implementation plan'), locked: false }
  ];

  const visibleItems = state.embedMapMode
    ? items.filter((item) => item.id === 'map')
    : (isEmbeddedContext()
      ? items.filter((item) => item.id !== 'admin' && item.id !== 'history')
      : items);

  if (state.activeView === 'admin' && !visibleItems.some((item) => item.id === 'admin')) {
    clearRouteEntityForView('guidelines');
    state.activeView = 'guidelines';
  }
  if (state.activeView === 'history' && !visibleItems.some((item) => item.id === 'history')) {
    clearRouteEntityForView('guidelines');
    state.activeView = 'guidelines';
  }
  if (state.activeView === 'policy-alignment' && !canOpenPolicyAlignment) {
    clearRouteEntityForView('guidelines');
    state.activeView = 'guidelines';
  }

  if (sidebarCollapseAllowed) {
    const toggleShell = document.createElement('div');
    toggleShell.className = 'steps-header';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'steps-toggle';
    toggleButton.title = sidebarCollapsed
      ? langText('Isskleisti sona meniu', 'Expand side menu')
      : langText('Suskleisti sona meniu', 'Collapse side menu');
    toggleButton.setAttribute('aria-label', toggleButton.title);
    toggleButton.setAttribute('aria-pressed', sidebarCollapsed ? 'true' : 'false');
    toggleButton.innerHTML = `
      <span class="steps-toggle-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="step-icon-svg steps-toggle-svg">
          <rect x="4.5" y="4.5" width="4.5" height="15" rx="1.4"></rect>
          ${sidebarCollapsed
        ? '<path d="M13 7.5l4.5 4.5-4.5 4.5"></path>'
        : '<path d="M17.5 7.5L13 12l4.5 4.5"></path>'}
        </svg>
      </span>
    `;
    toggleButton.addEventListener('click', () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      persistSidebarCollapsed();
      render();
    });
    toggleShell.appendChild(toggleButton);
    elements.steps.appendChild(toggleShell);
  }

  visibleItems.forEach((item) => {
    const isActive = state.activeView === item.id
      || (item.id === 'guidelines' && state.activeView === 'guideline-detail')
      || (item.id === 'initiatives' && state.activeView === 'initiative-detail');
    const canExpand = canExpandStepWithAddAction(item.id);
    const isExpanded = isActive && canExpand && state.expandedStepId === item.id;

    const shell = document.createElement('div');
    shell.className = `step-pill-shell${isExpanded ? ' expanded' : ''}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `step-pill${isActive ? ' active' : ''}${item.locked ? ' locked' : ''}${canExpand ? ' step-pill-expandable' : ''}`;
    button.innerHTML = `
      <div class="step-pill-head">
        <span class="step-icon" aria-hidden="true">${stepIconMarkup(item.id)}</span>
        <h4>${escapeHtml(item.title)}</h4>
        ${item.alert ? '<span class="step-alert-dot" aria-hidden="true"></span>' : ''}
      </div>
    `;
    if (item.locked) {
      button.title = item.id === 'history'
        ? langText('Sis rodinys prieinamas tik prisijungusiems nariams', 'This view is available to signed-in members only')
        : 'Administravimas galimas tik savo institucijos administratoriui';
    } else if (sidebarCollapsed) {
      button.title = item.title;
    }
    if (isActive) button.setAttribute('aria-current', 'page');
    if (canExpand) button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

    if (item.locked) {
      button.disabled = true;
    } else if (!canExpand && isActive) {
      button.disabled = true;
    } else {
      button.addEventListener('click', () => {
        if (!isActive) {
          if (item.id === 'map') {
            state.mapInstitutionPulseUntil = Date.now() + MAP_INSTITUTION_PULSE_MS;
            if (state.mapInstitutionPulseTimerId) {
              window.clearTimeout(state.mapInstitutionPulseTimerId);
              state.mapInstitutionPulseTimerId = 0;
            }
          }
          state.expandedStepId = canExpand ? item.id : '';
          setActiveView(item.id);
          return;
        }
        if (item.id === 'guidelines' && state.activeView === 'guideline-detail') {
          setActiveView('guidelines');
          return;
        }
        if (item.id === 'initiatives' && state.activeView === 'initiative-detail') {
          setActiveView('initiatives');
          return;
        }
        if (!canExpand) return;
        state.expandedStepId = state.expandedStepId === item.id ? '' : item.id;
        render();
      });
    }

    shell.appendChild(button);

    if (isExpanded) {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'step-pill-action';
      actionBtn.textContent = quickAddActionLabel(item.id);
      actionBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openStepAddSection(item.id);
      });
      shell.appendChild(actionBtn);
    }

    elements.steps.appendChild(shell);
  });

  if (!state.embedMapMode) {
    const alignmentShell = document.createElement('div');
    alignmentShell.className = 'step-utility-shell';

    const alignmentCard = document.createElement('div');
    alignmentCard.className = `step-utility-card policy-alignment-nav-card${state.activeView === 'policy-alignment' ? ' active' : ''}${canOpenPolicyAlignment ? '' : ' locked'}`;

    const currentPolicyAlignmentTabRaw = String(state.policyAlignmentWorkspaceTab || 'frameworks').trim().toLowerCase();
    const currentPolicyAlignmentTab = ['frameworks', 'strategy-analysis', 'external-analysis'].includes(currentPolicyAlignmentTabRaw)
      ? currentPolicyAlignmentTabRaw
      : 'frameworks';
    const disabledAttr = canOpenPolicyAlignment ? '' : 'disabled';
    const lockHint = canOpenPolicyAlignment
      ? ''
      : ` title="${escapeHtml(langText('Sis rodinys prieinamas tik prisijungusiems nariams', 'This view is available to signed-in members only'))}"`;

    alignmentCard.innerHTML = sidebarCollapsed
      ? `
        <button type="button" class="step-pill ${state.activeView === 'policy-alignment' ? 'active' : ''}${canOpenPolicyAlignment ? '' : ' locked'}" data-policy-alignment-nav="${escapeHtml(currentPolicyAlignmentTab)}"${disabledAttr}${lockHint} title="${escapeHtml(langText('Politikos atitiktis', 'Policy Alignment'))}">
          <div class="step-pill-head">
            <span class="step-icon" aria-hidden="true">${stepIconMarkup('policy-alignment')}</span>
            <h4>${escapeHtml(langText('Politikos atitiktis', 'Policy Alignment'))}</h4>
          </div>
        </button>
      `
      : `
        <div class="policy-alignment-nav-header">
          <div class="step-pill-head">
            <span class="step-icon" aria-hidden="true">${stepIconMarkup('policy-alignment')}</span>
            <h4>${escapeHtml(langText('Politikos atitiktis', 'Policy Alignment'))}</h4>
          </div>
        </div>
        <div class="policy-alignment-nav-actions">
          <button type="button" class="btn ${state.activeView === 'policy-alignment' && currentPolicyAlignmentTab === 'frameworks' ? 'btn-primary' : 'btn-ghost'}" data-policy-alignment-nav="frameworks"${disabledAttr}${lockHint}>${escapeHtml(langText('Politikos karkasas', 'Policy framework'))}</button>
          <button type="button" class="btn ${state.activeView === 'policy-alignment' && currentPolicyAlignmentTab === 'strategy-analysis' ? 'btn-primary' : 'btn-ghost'}" data-policy-alignment-nav="strategy-analysis"${disabledAttr}${lockHint}>${escapeHtml(langText('Strategijos analizė', 'Strategy analysis'))}</button>
          <button type="button" class="btn ${state.activeView === 'policy-alignment' && currentPolicyAlignmentTab === 'external-analysis' ? 'btn-primary' : 'btn-ghost'}" data-policy-alignment-nav="external-analysis"${disabledAttr}${lockHint}>${escapeHtml(langText('Išorinė analizė', 'External analysis'))}</button>
        </div>
      `;

    alignmentShell.appendChild(alignmentCard);
    elements.steps.appendChild(alignmentShell);

    alignmentCard.querySelectorAll('[data-policy-alignment-nav]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!canOpenPolicyAlignment) return;
        const nextTab = String(button.getAttribute('data-policy-alignment-nav') || 'frameworks').trim().toLowerCase();
        state.policyAlignmentWorkspaceTab = ['frameworks', 'strategy-analysis', 'external-analysis'].includes(nextTab)
          ? nextTab
          : 'frameworks';
        state.policyAlignmentAnalysisSubview = 'overview';
        state.policyAlignmentSelectedId = '';
        state.policyAlignmentCurrent = null;
        state.expandedStepId = '';
        if (state.activeView === 'policy-alignment') {
          syncRouteState();
          render();
          return;
        }
        setActiveView('policy-alignment');
      });
    });
  }

}

function applyIntroGuideState() {
  if (!elements.introDeck) return;
  const guide = elements.introDeck.querySelector('.intro-guide');
  const toggleIntroBtn = elements.introDeck.querySelector('#toggleIntroBtn');
  if (guide) {
    guide.classList.toggle('collapsed', state.introCollapsed);
    guide.setAttribute('aria-expanded', state.introCollapsed ? 'false' : 'true');
  }
  if (toggleIntroBtn) {
    toggleIntroBtn.innerHTML = `<span aria-hidden="true">${state.introCollapsed ? '&#9662;' : '&#9652;'}</span>`;
    toggleIntroBtn.setAttribute('aria-expanded', state.introCollapsed ? 'false' : 'true');
    toggleIntroBtn.setAttribute('aria-label', state.introCollapsed
      ? langText('Isskleisti naudojimosi gida', 'Expand user guide')
      : langText('Suskleisti naudojimosi gida', 'Collapse user guide'));
    toggleIntroBtn.title = state.introCollapsed
      ? langText('Isskleisti naudojimosi gida', 'Expand user guide')
      : langText('Suskleisti naudojimosi gida', 'Collapse user guide');
    toggleIntroBtn.classList.toggle('pulse', state.introTogglePulse);
  }
}

function pulseIntroToggleButton() {
  state.introTogglePulse = true;
  applyIntroGuideState();
  window.setTimeout(() => {
    state.introTogglePulse = false;
    applyIntroGuideState();
  }, 1500);
}

function maybeAutoCollapseIntroOnFirstScroll() {
  if (!state.introFirstVisit) return;
  if (state.introScrollAutoCollapsed || state.introCollapsed) return;
  if (window.scrollY < 40) return;

  state.introScrollAutoCollapsed = true;
  state.introCollapsed = true;
  persistIntroCollapsed();
  applyIntroGuideState();
  pulseIntroToggleButton();
}

function refreshIntroNarrativeTexts() {
  if (!elements.introDeck) return;
  const titleNode = elements.introDeck.querySelector('[data-guide-title]');
  const missionNode = elements.introDeck.querySelector('[data-guide-mission]');
  const visionNode = elements.introDeck.querySelector('[data-guide-vision]');
  if (titleNode) titleNode.textContent = cycleWorkshopTitleText();
  if (missionNode) missionNode.textContent = cycleMissionText();
  if (visionNode) visionNode.textContent = cycleVisionText();
}

function cycleWorkshopTitleText() {
  const strategyTitle = String(state.strategy?.title || '').trim();
  if (strategyTitle) return strategyTitle;
  const cycleTitle = String(state.cycle?.title || '').trim();
  if (cycleTitle) return cycleTitle;
  return langText('Strategijos dirbtuves', 'Strategy workshop');
}

function renderIntroDeck() {
  if (!elements.introDeck) return;
  if (state.embedMapMode || state.activeView === 'policy-alignment') {
    elements.introDeck.hidden = true;
    elements.introDeck.innerHTML = '';
    return;
  }

  const existingGuide = elements.introDeck.querySelector('.intro-guide');
  if (!existingGuide) {
    elements.introDeck.innerHTML = `
      <div class="intro-guide" role="button" tabindex="0" aria-expanded="true">
        <div class="intro-guide-header">
          <div>
            <h3 data-guide-title>${escapeHtml(cycleWorkshopTitleText())}</h3>
          </div>
          <button id="toggleIntroBtn" class="btn btn-ghost intro-toggle-btn" type="button" aria-expanded="true"></button>
        </div>
        <div class="intro-guide-body">
          <section class="guide-structure" aria-label="${escapeHtml(langText('Strategijos struktura', 'Strategy structure'))}">
            <div class="guide-structure-track" role="list">
              <article class="structure-step structure-step-strategic" role="listitem">
                <span class="structure-label">${langText('Misija', 'Mission')}</span>
                <p data-guide-mission>${escapeHtml(cycleMissionText())}</p>
              </article>
              <span class="structure-arrow" aria-hidden="true">&rarr;</span>
              <article class="structure-step structure-step-strategic" role="listitem">
                <span class="structure-label">${langText('Vizija', 'Vision')}</span>
                <p data-guide-vision>${escapeHtml(cycleVisionText())}</p>
              </article>
              <span class="structure-arrow" aria-hidden="true">&rarr;</span>
              <section class="structure-layer-group" role="group" aria-label="${escapeHtml(langText('Platformos dalis', 'Platform scope'))}">
                <div class="structure-layer-group-head">
                  <span class="structure-group-badge">${langText('Platformos apimtis', 'Platform scope')}: digistrategy.eu</span>
                </div>
                <div class="structure-layer-grid">
                  <article class="structure-step structure-step-layer" role="listitem">
                    <span class="structure-label">${langText('GairÄ—s', 'Guidelines')}</span>
                    <p>${langText('Kryptys arba tikslai, atvaizduojami dviem korteliu lygiais.', 'Directions or goals shown in two card levels.')}</p>
                    <div class="structure-mini-cards" aria-hidden="true">
                      <span>${langText('Tevines', 'Parent')}</span>
                      <span>${langText('Vaikines', 'Child')}</span>
                    </div>
                    <span class="structure-badge">${langText('Etapas 1', 'Stage 1')}</span>
                  </article>
                  <span class="structure-arrow structure-arrow-inner" aria-hidden="true">&rarr;</span>
                  <article class="structure-step structure-step-layer" role="listitem">
                    <span class="structure-label">${langText('Iniciatyvos', 'Initiatives')}</span>
                    <p>${langText('Uzdaviniai, kurie ispildo gaires ir kuria apciuopiama rezultata.', 'Tasks that fulfill guidelines and create tangible outcomes.')}</p>
                    <div class="structure-mini-cards" aria-hidden="true">
                      <span>${langText('Veiksmu idejos', 'Action ideas')}</span>
                      <span>${langText('Prioritetai', 'Priorities')}</span>
                    </div>
                    <span class="structure-badge">${langText('Etapas 2', 'Stage 2')}</span>
                  </article>
                  <span class="structure-arrow structure-arrow-inner" aria-hidden="true">&rarr;</span>
                  <article class="structure-step structure-step-layer structure-step-implementation" role="listitem">
                    <span class="structure-label">${langText('Igyvendinimo planas', 'Implementation plan')}</span>
                    <p>${langText('Perkelimas i konkrecias veiklas, terminus ir atsakomybes.', 'Translation into concrete actions, timelines, and ownership.')}</p>
                    <span class="structure-badge">${langText('Etapas 3', 'Stage 3')}</span>
                  </article>
                </div>
              </section>
            </div>
            <div class="structure-note-row">
              <p class="structure-note">${langText('Platformos apimtis: "Gairės", "Iniciatyvos" ir "Įgyvendinimo planas" etapai.', 'Platform scope: "Guidelines", "Initiatives", and "Implementation plan" stages.')}</p>
              <div data-strategy-url-inline-slot></div>
            </div>
          </section>
        </div>
      </div>
    `;

    const introGuide = elements.introDeck.querySelector('.intro-guide');
    const toggleIntroBtn = elements.introDeck.querySelector('#toggleIntroBtn');
    const toggleGuide = () => {
      state.introCollapsed = !state.introCollapsed;
      persistIntroCollapsed();
      applyIntroGuideState();
    };
    if (introGuide) {
      introGuide.addEventListener('click', (event) => {
        const target = event.target;
        if (
          target instanceof HTMLElement
          && target.closest('a, button, input, textarea, select, label, [data-intro-stop-toggle]')
        ) {
          return;
        }
        toggleGuide();
      });
      introGuide.addEventListener('keydown', (event) => {
        if (event.target !== introGuide) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggleGuide();
      });
    }
    if (toggleIntroBtn) {
      toggleIntroBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleGuide();
      });
    }
  }

  refreshIntroNarrativeTexts();
  renderStrategyUrlInlineBlock();
  applyIntroGuideState();
}

function relationLabel(relationType) {
  const relation = String(relationType || 'orphan').toLowerCase();
  if (relation === 'parent') return langText('tevine', 'parent');
  if (relation === 'child') return langText('vaikine', 'child');
  return langText('naslaite', 'orphan');
}

function renderGuideView() {
  const cards = introSlides.map((slide, idx) => `
    <article class="guide-card" style="--card-index:${idx};">
      <div class="guide-head">
        <span class="guide-index">${idx + 1}</span>
        <h4>${escapeHtml(String(slide.title || '').replace(/^\d+\.\s*/, ''))}</h4>
      </div>
      <p>${escapeHtml(slide.body || '')}</p>
      ${Array.isArray(slide.points) && slide.points.length
        ? `<ul class="guide-points">${slide.points.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : ''}
    </article>
  `).join('');

  elements.stepView.innerHTML = `
    <section class="guide-window">
      <div class="step-header">
        <h2>Naudojimosi gidas</h2>
      </div>
      <p class="prompt">${renderMultilineText(guideIntroText())}</p>
      <div class="guide-grid guide-grid-page">
        ${cards}
      </div>
    </section>
  `;
}

function renderAboutView() {
  elements.stepView.innerHTML = `
    <section class="about-window">
      <div class="step-header">
        <h2>Apie</h2>
      </div>
      <div class="card">
        ${renderAboutBlocks(aboutText())}
      </div>
    </section>
  `;
}

function renderAdminView() {
  elements.stepView.innerHTML = `
    <section class="admin-inline-shell">
      <div id="adminRoot" class="admin-inline-host">
        <section class="card">
          <strong>Kraunamas administravimo langas...</strong>
        </section>
      </div>
    </section>
  `;

  const adminRoot = document.getElementById('adminRoot');
  if (!adminRoot) return;

  ensureAdminAppLoaded()
    .then((adminApp) => {
      if (state.activeView !== 'admin') return;
      const mountPoint = document.getElementById('adminRoot');
      if (!mountPoint) return;
      const mounted = adminApp?.mount?.({
        root: mountPoint,
        institutionSlug: state.institutionSlug,
        strategySlug: state.strategySlug,
        forceAuthSync: true
      });
      if (!mounted) {
        mountPoint.innerHTML = `
          <section class="card">
            <strong>Nepavyko inicijuoti administravimo lango.</strong>
          </section>
        `;
      }
    })
    .catch((error) => {
      const mountPoint = document.getElementById('adminRoot');
      if (!mountPoint) return;
      mountPoint.innerHTML = `
        <section class="card">
          <strong>Nepavyko Ä¯kelti administravimo lango</strong>
          <p class="prompt" style="margin-top:8px;">${escapeHtml(toUserMessage(error))}</p>
        </section>
      `;
    });
}

function handleAuthChanged() {
  syncAuthStateFromStorage();
  bootstrap();
}

function normalizeGuidelineRelation(value) {
  const relation = String(value || 'orphan').trim().toLowerCase();
  if (relation === 'parent' || relation === 'child' || relation === 'orphan') return relation;
  return 'orphan';
}

function isPendingStatus(value) {
  return String(value || '').trim().toLowerCase() === 'pending';
}

function normalizeGuidelineStrategyLinks(value) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const otherGuidelineId = String(item.otherGuidelineId || '').trim();
      if (!otherGuidelineId) return null;
      return {
        id: String(item.id || '').trim(),
        direction: String(item.direction || '').trim().toLowerCase(),
        otherGuidelineId,
        otherGuidelineTitle: String(item.otherGuidelineTitle || '').trim(),
        otherInstitutionName: String(item.otherInstitutionName || '').trim(),
        otherInstitutionSlug: normalizeSlug(item.otherInstitutionSlug),
        otherStrategyTitle: String(item.otherStrategyTitle || '').trim(),
        otherStrategySlug: normalizeSlug(item.otherStrategySlug),
        isCrossInstitution: Boolean(item.isCrossInstitution),
        isCrossStrategy: Boolean(item.isCrossStrategy)
      };
    })
    .filter(Boolean);
}

function strategyLinkLabel(link) {
  const institution = link.otherInstitutionSlug || link.otherInstitutionName || '-';
  const strategy = link.otherStrategyTitle || link.otherStrategySlug || 'default';
  return `${institution} / ${strategy}`;
}

function formatCommentDateTime(value) {
  if (!value) return 'Data nenurodyta';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data nenurodyta';
  const lang = window.DigiI18n?.getLanguage?.() || 'lt';
  const locale = lang === 'en' ? 'en-US' : 'lt-LT';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function renderCommentItem(comment) {
  const canShowAuthorIdentity = isAuthenticated();
  const authorName = String(comment?.authorName || '').trim();
  const authorEmail = String(comment?.authorEmail || '').trim();
  const emailShort = authorEmail.includes('@') ? authorEmail.split('@')[0] : authorEmail;
  const rawAuthor = authorName || emailShort;
  const author = canShowAuthorIdentity && rawAuthor ? rawAuthor : langText('Dalyvis', 'Participant');
  const timestamp = formatCommentDateTime(comment?.createdAt);
  return `
    <li class="comment-item">
      <div class="comment-body">${escapeHtml(comment?.body || '')}</div>
      <div class="comment-meta">${escapeHtml(author)} &middot; ${escapeHtml(timestamp)}</div>
    </li>
  `;
}

function commentsHiddenHintText() {
  return currentLanguage() === 'en'
    ? 'Comments are visible only to signed-in users.'
    : 'Komentarai matomi tik prisijungusiems vartotojams.';
}

function commentsReadOnlyHintText(options) {
  if (!options.commentsVisible) return commentsHiddenHintText();
  if (options.member && !options.writable) {
    return currentLanguage() === 'en'
      ? 'Cycle is locked: comments cannot be added.'
      : 'Ciklas uÅ¾rakintas: komentuoti negalima.';
  }
  if (options.authenticated && !options.member) {
    return currentLanguage() === 'en'
      ? 'You are signed in to another institution. Commenting is disabled here.'
      : 'Prisijungta prie kitos institucijos. Komentuoti Äia negalite.';
  }
  return currentLanguage() === 'en'
    ? 'Sign in to add comments.'
    : 'Prisijunkite, jei norite komentuoti.';
}

function renderCardShareRow({ url, entityId, copyAction }) {
  const absoluteUrl = String(url || '').trim();
  const safeEntityId = String(entityId || '').trim();
  const action = String(copyAction || '').trim();
  if (!absoluteUrl || !safeEntityId || !action) return '';
  return '';
}

function buildGuidelineRelationshipGroups(guidelines) {
  const list = Array.isArray(guidelines) ? guidelines : [];
  const byId = Object.fromEntries(list.map((guideline) => [guideline.id, guideline]));
  const childrenByParent = {};

  list.forEach((guideline) => {
    if (normalizeGuidelineRelation(guideline.relationType) !== 'child') return;
    const parentId = guideline.parentGuidelineId;
    const parent = parentId ? byId[parentId] : null;
    if (!parent || normalizeGuidelineRelation(parent.relationType) !== 'parent') return;
    if (!childrenByParent[parent.id]) childrenByParent[parent.id] = [];
    childrenByParent[parent.id].push(guideline);
  });

  const groupedChildIds = new Set();
  const parentGroups = list
    .filter((guideline) => normalizeGuidelineRelation(guideline.relationType) === 'parent')
    .map((parent) => {
      const children = childrenByParent[parent.id] || [];
      children.forEach((child) => groupedChildIds.add(child.id));
      return { parent, children };
    });

  const orphanGuidelines = list.filter((guideline) => normalizeGuidelineRelation(guideline.relationType) === 'orphan');
  const unassignedChildren = list.filter((guideline) => {
    if (normalizeGuidelineRelation(guideline.relationType) !== 'child') return false;
    return !groupedChildIds.has(guideline.id);
  });

  return { parentGroups, orphanGuidelines, unassignedChildren };
}

function normalizeImplementationDateInputValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildImplementationPlanGuidelineRows(guidelines) {
  const source = (Array.isArray(guidelines) ? guidelines : []).filter((guideline) => (
    guideline
    && !String(guideline.pendingProposalId || '').trim()
    && String(guideline.status || '').trim().toLowerCase() !== 'hidden'
  ));
  const groups = buildGuidelineRelationshipGroups(source);
  const rows = [];

  groups.parentGroups.forEach((group) => {
    rows.push({
      kind: 'guideline',
      item: group.parent,
      level: 0,
      relationKey: 'parent'
    });
    group.children.forEach((child) => {
      rows.push({
        kind: 'guideline',
        item: child,
        level: 1,
        relationKey: 'child'
      });
    });
  });

  groups.orphanGuidelines.forEach((guideline) => {
    rows.push({
      kind: 'guideline',
      item: guideline,
      level: 0,
      relationKey: 'orphan'
    });
  });

  groups.unassignedChildren.forEach((guideline) => {
    rows.push({
      kind: 'guideline',
      item: guideline,
      level: 0,
      relationKey: 'child'
    });
  });

  return rows;
}

function buildImplementationPlanInitiativeRows(initiatives) {
  return sortCardsByTitle((Array.isArray(initiatives) ? initiatives : []).filter((initiative) => (
    initiative
    && !String(initiative.pendingProposalId || '').trim()
    && String(initiative.status || '').trim().toLowerCase() !== 'hidden'
  ))).map((initiative) => ({
    kind: 'initiative',
    item: initiative,
    level: 0,
    relationKey: 'initiative'
  }));
}

function parseImplementationPlanDateUtc(rawDate) {
  const match = String(rawDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getCurrentLocalDateKey() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function countImplementationPlanWorkdaysUntil(targetDateKey, fromDateKey = getCurrentLocalDateKey()) {
  const targetUtc = parseImplementationPlanDateUtc(targetDateKey);
  const fromUtc = parseImplementationPlanDateUtc(fromDateKey);
  if (targetUtc === null || fromUtc === null) return null;
  if (targetUtc === fromUtc) return 0;
  const forward = targetUtc > fromUtc;
  const startUtc = forward ? fromUtc : targetUtc;
  const endUtc = forward ? targetUtc : fromUtc;
  let count = 0;
  for (let cursor = startUtc + (24 * 60 * 60 * 1000); cursor <= endUtc; cursor += 24 * 60 * 60 * 1000) {
    const weekday = new Date(cursor).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return forward ? count : -count;
}

function formatImplementationPlanCalendarDay(rawDate) {
  const utc = parseImplementationPlanDateUtc(rawDate);
  if (utc === null) return { dayLabel: '--', monthLabel: '', monthNumber: '', weekdayLabel: '', isWeekend: false };
  const locale = currentLanguage() === 'en' ? 'en-GB' : 'lt-LT';
  const date = new Date(utc);
  const weekday = date.getUTCDay();
  return {
    dayLabel: new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(date),
    monthLabel: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
    monthNumber: new Intl.DateTimeFormat(locale, { month: '2-digit' }).format(date),
    weekdayLabel: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date),
    isWeekend: weekday === 0 || weekday === 6
  };
}

function buildImplementationPlanCalendarEntries({ guidelineRows, initiativeRows }) {
  const todayKey = getCurrentLocalDateKey();
  const sourceRows = [
    ...(Array.isArray(guidelineRows) ? guidelineRows : []),
    ...(Array.isArray(initiativeRows) ? initiativeRows : [])
  ];
  const entries = sourceRows.map((row, index) => {
    const item = row?.item && typeof row.item === 'object' ? row.item : null;
    if (!item) return null;
    const kind = String(row.kind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
    const implementationDate = normalizeImplementationDateInputValue(item.implementationDate);
    const implementationOwner = String(item.implementationOwner || '').trim();
    const workdaysUntilImplementation = implementationDate
      ? countImplementationPlanWorkdaysUntil(implementationDate, todayKey)
      : null;
    const linkedGuidelineNames = kind === 'initiative'
      ? resolveInitiativeLinkedGuidelines(item)
        .map((guideline) => String(guideline?.title || guideline?.id || '').trim())
        .filter(Boolean)
      : [];
    return {
      id: String(item.id || '').trim(),
      kind,
      kindLabel: kind === 'initiative'
        ? langText('Iniciatyva', 'Initiative')
        : langText('Gairė', 'Guideline'),
      relationKey: String(row.relationKey || kind).trim().toLowerCase(),
      level: Number(row.level || 0),
      title: String(item.title || item.id || '-').trim() || '-',
      implementationDate,
      implementationDateDisplay: formatInstitutionDate(implementationDate) || langText('Nenurodyta', 'Not set'),
      workdaysUntilImplementation,
      implementationOwner,
      linkedGuidelineNames,
      originalIndex: index
    };
  }).filter(Boolean);

  const datedEntries = entries
    .filter((entry) => Boolean(entry.implementationDate))
    .sort((left, right) => {
      const byDate = String(left.implementationDate).localeCompare(String(right.implementationDate));
      if (byDate !== 0) return byDate;
      return Number(left.originalIndex || 0) - Number(right.originalIndex || 0);
    });

  const undatedEntries = entries
    .filter((entry) => !entry.implementationDate)
    .sort((left, right) => Number(left.originalIndex || 0) - Number(right.originalIndex || 0));

  const groups = [];
  let currentGroup = null;
  datedEntries.forEach((entry) => {
    if (!currentGroup || currentGroup.key !== entry.implementationDate) {
      currentGroup = {
        key: entry.implementationDate,
        label: formatInstitutionDate(entry.implementationDate) || entry.implementationDate,
        entries: []
      };
      groups.push(currentGroup);
    }
    currentGroup.entries.push(entry);
  });
  if (undatedEntries.length) {
    groups.push({
      key: 'undated',
      label: langText('Be datos', 'No date set'),
      entries: undatedEntries
    });
  }

  const firstDate = datedEntries[0]?.implementationDate || '';
  const lastDate = datedEntries[datedEntries.length - 1]?.implementationDate || firstDate;
  const days = [];
  if (firstDate && lastDate) {
    let cursor = parseImplementationPlanDateUtc(firstDate);
    const end = parseImplementationPlanDateUtc(lastDate);
    while (cursor !== null && end !== null && cursor <= end) {
      const day = new Date(cursor);
      const year = day.getUTCFullYear();
      const month = String(day.getUTCMonth() + 1).padStart(2, '0');
      const date = String(day.getUTCDate()).padStart(2, '0');
      const key = `${year}-${month}-${date}`;
      const formatted = formatImplementationPlanCalendarDay(key);
      days.push({
        key,
        dayLabel: formatted.dayLabel,
        monthLabel: formatted.monthLabel,
        monthNumber: formatted.monthNumber,
        weekdayLabel: formatted.weekdayLabel,
        isWeekend: Boolean(formatted.isWeekend),
        isMonthStart: date === '01' || key === firstDate,
        isToday: key === todayKey
      });
      cursor += 24 * 60 * 60 * 1000;
    }
  }

  const monthGroups = [];
  days.forEach((day, index) => {
    const monthKey = String(day.monthNumber || '').trim();
    const existing = monthGroups[monthGroups.length - 1];
    if (existing && existing.key === monthKey) {
      existing.span += 1;
      existing.endIndex = index;
      return;
    }
    monthGroups.push({
      key: monthKey,
      label: monthKey,
      span: 1,
      startIndex: index,
      endIndex: index
    });
  });

  return {
    entries,
    groups,
    days,
    monthGroups
  };
}

function renderImplementationPlanCalendarMarkup(calendarData) {
  const groups = Array.isArray(calendarData?.groups) ? calendarData.groups : [];
  const days = Array.isArray(calendarData?.days) ? calendarData.days : [];
  const monthGroups = Array.isArray(calendarData?.monthGroups) ? calendarData.monthGroups : [];
  const emptyLabel = langText(
    'Kalendoriuje dar nėra suplanuotų įgyvendinimo datų.',
    'No implementation dates are scheduled in the calendar yet.'
  );
  const gridTemplate = days.length ? `repeat(${days.length}, minmax(34px, 1fr))` : '1fr';
  const boardMinWidth = Math.max(860, 340 + (days.length * 34));
  return `
    <section class="card implementation-plan-calendar-panel" aria-labelledby="implementationPlanCalendarTitle">
      <div class="header-row">
        <div>
          <h3 id="implementationPlanCalendarTitle">${escapeHtml(langText('Įgyvendinimo kalendorius', 'Implementation calendar'))}</h3>
        </div>
      </div>
      ${!groups.length || !days.length
        ? `<div class="card implementation-plan-calendar-empty"><strong>${escapeHtml(emptyLabel)}</strong></div>`
        : `
          <div class="implementation-plan-calendar-scroll">
            <div class="implementation-plan-calendar-board" style="min-width:${boardMinWidth}px;">
              <svg class="implementation-plan-calendar-connector" aria-hidden="true" focusable="false"></svg>
              <div class="implementation-plan-calendar-row implementation-plan-calendar-row-header">
                <div class="implementation-plan-calendar-entry-cell implementation-plan-calendar-entry-cell-header">${escapeHtml(langText('Įrašas', 'Entry'))}</div>
                <div class="implementation-plan-calendar-days implementation-plan-calendar-days-header" style="grid-template-columns:${gridTemplate};">
                  <div class="implementation-plan-calendar-months" style="grid-template-columns:${gridTemplate};">
                    ${monthGroups.map((group) => `
                      <div class="implementation-plan-calendar-month-cell" style="grid-column: span ${Math.max(1, Number(group.span || 1))};">
                        ${escapeHtml(group.label)}
                      </div>
                    `).join('')}
                  </div>
                  ${days.map((day) => `
                    <div class="implementation-plan-calendar-day-head${day.isMonthStart ? ' is-month-start' : ''}${day.isToday ? ' is-today' : ''}${day.isWeekend ? ' is-weekend' : ''}">
                      <span class="implementation-plan-calendar-day-label">${escapeHtml(day.dayLabel)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
              ${groups.map((group) => `
                <div class="implementation-plan-calendar-group">
                  <div class="implementation-plan-calendar-group-row">
                    <div class="implementation-plan-calendar-group-label">${escapeHtml(group.label)}</div>
                    <div class="implementation-plan-calendar-group-fill"></div>
                  </div>
                  ${group.entries.map((entry) => `
                    <div class="implementation-plan-calendar-row">
                      <div class="implementation-plan-calendar-entry-cell">
                        <div class="implementation-plan-calendar-entry-top">
                          <span class="tag implementation-plan-calendar-kind implementation-plan-calendar-kind-${escapeHtml(entry.kind)}">${escapeHtml(entry.kindLabel)}</span>
                          ${entry.workdaysUntilImplementation === null
                            ? ''
                            : `
                              <span
                                class="implementation-plan-calendar-workdays${entry.workdaysUntilImplementation < 0 ? ' is-overdue' : ''}${entry.workdaysUntilImplementation === 0 ? ' is-today' : ''}"
                                tabindex="0"
                                aria-label="${escapeHtml(
                                  entry.workdaysUntilImplementation < 0
                                    ? langText(
                                      `${Math.abs(entry.workdaysUntilImplementation)} darbo dienos po numatytos įgyvendinimo datos. Skaičiuojamos tik darbo dienos, savaitgaliai neįtraukiami.`,
                                      `${Math.abs(entry.workdaysUntilImplementation)} workdays past the implementation date. Only workdays are counted, weekends are excluded.`
                                    )
                                    : entry.workdaysUntilImplementation === 0
                                      ? langText(
                                        'Įgyvendinimo data yra šiandien. Skaičiuojamos tik darbo dienos, savaitgaliai neįtraukiami.',
                                        'The implementation date is today. Only workdays are counted, weekends are excluded.'
                                      )
                                      : langText(
                                        `${entry.workdaysUntilImplementation} darbo dienos iki įgyvendinimo datos. Skaičiuojamos tik darbo dienos, savaitgaliai neįtraukiami.`,
                                        `${entry.workdaysUntilImplementation} workdays until the implementation date. Only workdays are counted, weekends are excluded.`
                                      )
                                )}"
                              >
                                ${escapeHtml(
                                  entry.workdaysUntilImplementation < 0
                                    ? langText(`-${Math.abs(entry.workdaysUntilImplementation)} d.d.`, `-${Math.abs(entry.workdaysUntilImplementation)} wd`)
                                    : entry.workdaysUntilImplementation === 0
                                      ? langText('Šiandien', 'Today')
                                      : langText(`${entry.workdaysUntilImplementation} d.d.`, `${entry.workdaysUntilImplementation} wd`)
                                )}
                                <span class="implementation-plan-calendar-workdays-tooltip">
                                  ${escapeHtml(langText(
                                    'Darbo dienos iki įgyvendinimo datos. Savaitgaliai neįtraukiami.',
                                    'Workdays until the implementation date. Weekends are excluded.'
                                  ))}
                                </span>
                              </span>
                            `}
                          ${entry.implementationOwner ? `<span class="implementation-plan-calendar-owner">${escapeHtml(entry.implementationOwner)}</span>` : ''}
                        </div>
                        <button
                          type="button"
                          class="implementation-plan-calendar-entry-link"
                          data-action="open-implementation-calendar-item"
                          data-kind="${escapeHtml(entry.kind)}"
                          data-id="${escapeHtml(entry.id)}"
                        >${escapeHtml(entry.title)}</button>
                      </div>
                      <div class="implementation-plan-calendar-days implementation-plan-calendar-days-row" style="grid-template-columns:${gridTemplate};">
                        ${days.map((day) => `
                          <div class="implementation-plan-calendar-day-cell${day.isMonthStart ? ' is-month-start' : ''}${day.isToday ? ' is-today' : ''}">
                            ${day.key === entry.implementationDate
                              ? `<span class="implementation-plan-calendar-marker implementation-plan-calendar-marker-${escapeHtml(entry.kind)}"></span>`
                              : ''}
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          </div>
        `}
    </section>
  `;
}

function buildImplementationPlanCalendarConnectorPath(points) {
  if (!Array.isArray(points) || points.length < 2) return '';
  const start = points[0];
  let path = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const deltaX = next.x - current.x;
    const deltaY = next.y - current.y;
    if (Math.abs(deltaX) < 1 || Math.abs(deltaY) < 1) {
      path += ` L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
      continue;
    }
    const radius = Math.min(18, Math.abs(deltaX) / 2, Math.abs(deltaY) / 2);
    const verticalDirection = Math.sign(deltaY) || 1;
    const horizontalDirection = Math.sign(deltaX) || 1;
    const middleY = current.y + (deltaY / 2);
    const firstVerticalY = middleY - (verticalDirection * radius);
    const secondVerticalY = middleY + (verticalDirection * radius);
    const firstHorizontalX = current.x + (horizontalDirection * radius);
    const secondHorizontalX = next.x - (horizontalDirection * radius);
    path += ` L ${current.x.toFixed(2)} ${firstVerticalY.toFixed(2)}`;
    path += ` Q ${current.x.toFixed(2)} ${middleY.toFixed(2)} ${firstHorizontalX.toFixed(2)} ${middleY.toFixed(2)}`;
    path += ` L ${secondHorizontalX.toFixed(2)} ${middleY.toFixed(2)}`;
    path += ` Q ${next.x.toFixed(2)} ${middleY.toFixed(2)} ${next.x.toFixed(2)} ${secondVerticalY.toFixed(2)}`;
    path += ` L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }
  return path;
}

function renderImplementationPlanCalendarConnector() {
  implementationPlanCalendarConnectorFrameId = 0;
  if (state.activeView !== 'implementation-plan' || state.implementationPlanSubview !== 'calendar') return;
  const board = elements.stepView.querySelector('.implementation-plan-calendar-board');
  if (!(board instanceof HTMLElement)) return;
  const svg = board.querySelector('.implementation-plan-calendar-connector');
  if (!(svg instanceof SVGSVGElement)) return;
  const firstDaysRow = board.querySelector('.implementation-plan-calendar-days-row, .implementation-plan-calendar-days-header');
  if (!(firstDaysRow instanceof HTMLElement)) return;
  const firstEntryCell = board.querySelector('.implementation-plan-calendar-entry-cell');
  if (!(firstEntryCell instanceof HTMLElement)) return;
  const markers = Array.from(board.querySelectorAll('.implementation-plan-calendar-marker'));
  const boardRect = board.getBoundingClientRect();
  const leftOffset = Math.max(
    0,
    Math.round(firstEntryCell.getBoundingClientRect().width)
  );
  const width = Math.max(board.scrollWidth - leftOffset, board.clientWidth - leftOffset, 1);
  const height = Math.max(board.scrollHeight, board.clientHeight, 1);
  svg.style.left = `${leftOffset}px`;
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  if (markers.length < 2) {
    svg.innerHTML = '';
    return;
  }
  const points = markers.map((marker) => {
    const rect = marker.getBoundingClientRect();
    return {
      x: (rect.left - boardRect.left - leftOffset) + (rect.width / 2),
      y: (rect.top - boardRect.top) + (rect.height / 2)
    };
  });
  const todayColumn = board.querySelector('.implementation-plan-calendar-day-head.is-today, .implementation-plan-calendar-day-cell.is-today');
  const todayLineMarkup = todayColumn instanceof HTMLElement
    ? (() => {
      const rect = todayColumn.getBoundingClientRect();
      const x = (rect.left - boardRect.left - leftOffset) + (rect.width / 2);
      return `<line class="implementation-plan-calendar-today-line-shadow" x1="${x.toFixed(2)}" y1="0" x2="${x.toFixed(2)}" y2="${height}"></line><line class="implementation-plan-calendar-today-line" x1="${x.toFixed(2)}" y1="0" x2="${x.toFixed(2)}" y2="${height}"></line>`;
    })()
    : '';
  const path = buildImplementationPlanCalendarConnectorPath(points);
  svg.innerHTML = `${todayLineMarkup}${path
    ? `<path class="implementation-plan-calendar-connector-shadow" d="${path}"></path><path class="implementation-plan-calendar-connector-path" d="${path}"></path>`
    : ''}`;
}

function scheduleImplementationPlanCalendarConnectorRender() {
  if (implementationPlanCalendarConnectorFrameId) {
    cancelAnimationFrame(implementationPlanCalendarConnectorFrameId);
  }
  implementationPlanCalendarConnectorFrameId = requestAnimationFrame(() => {
    implementationPlanCalendarConnectorFrameId = requestAnimationFrame(renderImplementationPlanCalendarConnector);
  });
}

function renderImplementationPlanRow(row, { editable = false } = {}) {
  const item = row?.item && typeof row.item === 'object' ? row.item : null;
  if (!item) return '';
  const rowKind = String(row.kind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
  const level = Number(row.level || 0);
  const title = String(item.title || item.id || '-').trim() || '-';
  const linkedGuidelines = rowKind === 'initiative'
    ? resolveInitiativeLinkedGuidelines(item)
    : [];
  const linkedGuidelineNames = linkedGuidelines.map((guideline) => String(guideline?.title || guideline?.id || '').trim()).filter(Boolean);
  const implementationDateValue = normalizeImplementationDateInputValue(item.implementationDate);
  const implementationOwnerValue = String(item.implementationOwner || '').trim();
  const implementationDateDisplay = formatInstitutionDate(implementationDateValue) || langText('Nenurodyta', 'Not set');
  const implementationOwnerDisplay = implementationOwnerValue || langText('Nenurodyta', 'Not set');

  return `
    <div class="implementation-plan-row implementation-plan-row-${escapeHtml(rowKind)} implementation-plan-level-${level}" data-plan-kind="${escapeHtml(rowKind)}" data-plan-id="${escapeHtml(item.id)}">
      <div class="implementation-plan-cell implementation-plan-cell-main">
        <div class="implementation-plan-title-wrap">
          ${level > 0 ? '<span class="implementation-plan-branch" aria-hidden="true"></span>' : ''}
          <div class="implementation-plan-title-stack">
            <button type="button" class="implementation-plan-link" data-action="open-implementation-item" data-kind="${escapeHtml(rowKind)}" data-id="${escapeHtml(item.id)}">${escapeHtml(title)}</button>
            <div class="header-stack">
              ${rowKind === 'initiative' && linkedGuidelineNames.length
      ? `<span class="tag">${escapeHtml(langText('Gairės', 'Guidelines'))}: ${escapeHtml(linkedGuidelineNames.join(', '))}</span>`
      : ''}
            </div>
          </div>
        </div>
      </div>
      <div class="implementation-plan-cell implementation-plan-cell-date">
        <span class="implementation-plan-cell-label">${escapeHtml(langText('Įgyvendinimo data', 'Implementation date'))}</span>
        ${editable
      ? `<input class="implementation-plan-input implementation-plan-date" type="date" name="implementationDate" value="${escapeHtml(implementationDateValue)}" ${state.busy ? 'disabled' : ''} />`
      : `<span class="implementation-plan-read-value${implementationDateValue ? '' : ' is-empty'}">${escapeHtml(implementationDateDisplay)}</span>`}
      </div>
      <div class="implementation-plan-cell implementation-plan-cell-owner">
        <span class="implementation-plan-cell-label">${escapeHtml(langText('Atsakingas asmuo / padalinys', 'Responsible person / unit'))}</span>
        ${editable
      ? `<input class="implementation-plan-input implementation-plan-owner" type="text" name="implementationOwner" value="${escapeHtml(implementationOwnerValue)}" placeholder="${escapeHtml(langText('Atsakingas asmuo ar padalinys', 'Responsible person or unit'))}" ${state.busy ? 'disabled' : ''} />`
      : `<span class="implementation-plan-read-value${implementationOwnerValue ? '' : ' is-empty'}">${escapeHtml(implementationOwnerDisplay)}</span>`}
      </div>
      <div class="implementation-plan-cell implementation-plan-cell-actions">
        ${editable ? '<span class="implementation-plan-row-status"></span>' : ''}
      </div>
    </div>
  `;
}

function renderGuidelineCard(guideline, options) {
  const isLinkable = options?.linkable !== false;
  const commentsVisible = Boolean(options.commentsVisible);
  const showCommentsSection = Boolean(options.authenticated || commentsVisible);
  const commentsHint = commentsReadOnlyHintText(options);
  const userScore = Number(state.userVotes[guideline.id] || 0);
  const comments = Array.isArray(guideline.comments) ? guideline.comments : [];
  const safeComments = commentsVisible
    ? (comments.length
      ? comments.map((comment) => renderCommentItem(comment)).join('')
      : `<li class="comment-item comment-item-empty">${langText('Dar nera komentaru.', 'No comments yet.')}</li>`)
    : `<li class="comment-item comment-item-empty">${escapeHtml(commentsHiddenHintText())}</li>`;
  const relation = relationLabel(guideline.relationType);
  const relationKey = normalizeGuidelineRelation(guideline.relationType);
  const relationTag = relation.charAt(0).toUpperCase() + relation.slice(1);
  const guidelineStatus = String(guideline.status || 'active').toLowerCase();
  const pendingStatus = guidelineStatus === 'pending';
  const votingDisabled = guidelineStatus === 'disabled' || pendingStatus;
  const strategyLinks = relationKey === 'parent'
    ? normalizeGuidelineStrategyLinks(guideline.strategyLinks)
    : [];
  const uniqueStrategyLinks = [];
  const seenStrategyLinkKeys = new Set();
  strategyLinks.forEach((link) => {
    const key = [
      normalizeSlug(link.otherInstitutionSlug),
      normalizeSlug(link.otherStrategySlug),
      String(link.otherGuidelineId || '').trim()
    ].join('|');
    if (!String(link.otherGuidelineId || '').trim()) return;
    if (seenStrategyLinkKeys.has(key)) return;
    seenStrategyLinkKeys.add(key);
    uniqueStrategyLinks.push(link);
  });
  const strategyLinksMarkup = relationKey === 'parent'
    ? `
      <div class="header-stack guideline-strategy-links">
        <span class="tag tag-link-main">${escapeHtml(langText('Strateginiai rysiai', 'Strategic links'))}: ${strategyLinks.length}</span>
        ${uniqueStrategyLinks.slice(0, 3).map((link) => `
          <button
            type="button"
            class="tag tag-link-ref tag-link-button"
            data-action="open-strategy-link"
            data-target-institution="${escapeHtml(link.otherInstitutionSlug)}"
            data-target-strategy="${escapeHtml(link.otherStrategySlug)}"
            data-target-guideline="${escapeHtml(link.otherGuidelineId)}"
            title="${escapeHtml(langText('Atidaryti susietos gaires konteksta', 'Open linked guideline context'))}"
          >${escapeHtml(strategyLinkLabel(link))}</button>
        `).join('')}
        ${uniqueStrategyLinks.length > 3 ? `<span class="tag">+${uniqueStrategyLinks.length - 3}</span>` : ''}
      </div>
    `
    : '';
  const guidelineUrl = guidelineShareUrl(guideline.id);
  const shareMarkup = renderCardShareRow({
    url: guidelineUrl,
    entityId: guideline.id,
    copyAction: 'copy-guideline-link'
  });

  const budget = voteBudget();
  const usedWithoutCurrent = usedVotesTotal() - userScore;
  const maxAllowed = clamp(
    Math.min(maxPerGuideline(), budget - usedWithoutCurrent),
    minPerGuideline(),
    maxPerGuideline()
  );
  const canMinus = options.member && options.writable && !votingDisabled && !state.busy && userScore > minPerGuideline();
  const canPlus = options.member && options.writable && !votingDisabled && !state.busy && userScore < maxAllowed;

  return `
    <article class="card guideline-card ${isLinkable ? 'is-linkable' : ''} guideline-relation-${escapeHtml(relationKey)} ${votingDisabled ? 'guideline-disabled' : ''} ${pendingStatus ? 'card-pending' : ''}" data-guideline-id="${escapeHtml(guideline.id)}">
      <div class="card-top">
        <div class="title-row">
          <h4>${escapeHtml(guideline.title)}</h4>
          <span class="tag">${escapeHtml(relationTag)}</span>
          ${pendingStatus ? `<span class="tag tag-main">${langText('Laukia tvirtinimo', 'Pending')}</span>` : ''}
          ${guidelineStatus === 'disabled' ? `<span class="tag tag-disabled">${langText('Isjungta', 'Disabled')}</span>` : ''}
        </div>
        <p>${escapeHtml(guideline.description || langText('Be paaiskinimo', 'No description provided.'))}</p>
        ${shareMarkup}
        ${strategyLinksMarkup}
      </div>
      ${options.member ? `
        <div class="vote-panel">
          <div class="vote-panel-head">
            <span class="vote-label">${langText('Tavo balas', 'Your vote')}</span>
          </div>
          <div class="vote-panel-body">
            <div class="vote-controls">
              <button class="vote-btn" data-action="vote-minus" data-id="${escapeHtml(guideline.id)}" aria-label="${escapeHtml(langText('Atimti bala', 'Decrease vote'))}" ${canMinus ? '' : 'disabled'}>&minus;</button>
              <span class="vote-score">${userScore}</span>
              <button class="vote-btn" data-action="vote-plus" data-id="${escapeHtml(guideline.id)}" aria-label="${escapeHtml(langText('Prideti bala', 'Increase vote'))}" ${canPlus ? '' : 'disabled'}>+</button>
            </div>
            <div class="vote-total">${langText('Bendras balas', 'Total score')}: <strong>${Number(guideline.totalScore || 0)}</strong></div>
            ${votingDisabled ? `<div class="vote-total">${pendingStatus ? langText('Laukiantis pasiÅ«lymas: balsavimas negalimas', 'Pending proposal: voting is disabled') : langText('Balsavimas isjungtas administratoriaus', 'Voting disabled by administrator')}</div>` : ''}
          </div>
        </div>
      ` : `
        <div class="vote-panel">
          <div class="vote-panel-body">
            <div class="vote-total"><strong>${langText('Bendras balas', 'Total score')}: ${Number(guideline.totalScore || 0)}</strong></div>
          </div>
        </div>
      `}
      ${showCommentsSection ? `
        <div class="card-section">
          <strong>${langText('Komentarai', 'Comments')}</strong>
          <ul class="mini-list">${safeComments}</ul>
          ${options.member && options.writable ? `
            <form data-action="comment" data-id="${escapeHtml(guideline.id)}" class="inline-form">
              <input type="text" name="comment" placeholder="${escapeHtml(langText('Irasykite komentara', 'Write a comment'))}" required ${state.busy ? 'disabled' : ''}/>
              <button class="btn btn-ghost" type="submit" ${state.busy ? 'disabled' : ''}>${langText('Prideti', 'Add')}</button>
            </form>
          ` : `<p class="prompt" style="margin: 8px 0 0;">${escapeHtml(commentsHint)}</p>`}
        </div>
      ` : ''}
    </article>
  `;
}

function resolveInitiativeGuidelineNames(initiative) {
  const links = Array.isArray(initiative.guidelineLinks) ? initiative.guidelineLinks : [];
  if (links.length) {
    return links.map((link) => String(link.guidelineTitle || '').trim()).filter(Boolean);
  }
  const idSet = new Set(Array.isArray(initiative.guidelineIds) ? initiative.guidelineIds : []);
  if (!idSet.size) return [];
  return state.guidelines
    .filter((guideline) => idSet.has(guideline.id))
    .map((guideline) => guideline.title)
    .filter(Boolean);
}

function resolveInitiativeGuidelineIds(initiative) {
  const links = Array.isArray(initiative?.guidelineLinks) ? initiative.guidelineLinks : [];
  const idsFromLinks = links
    .map((link) => String(link?.guidelineId || '').trim())
    .filter(Boolean);
  if (idsFromLinks.length) return Array.from(new Set(idsFromLinks));

  const ids = Array.isArray(initiative?.guidelineIds) ? initiative.guidelineIds : [];
  return Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)));
}

function renderGuidelineCheckboxList(guidelines, { selectedIds = [], name = 'guidelineIds', disabled = false } = {}) {
  const guidelineList = Array.isArray(guidelines) ? guidelines : [];
  const selectedSet = new Set((Array.isArray(selectedIds) ? selectedIds : []).map((id) => String(id || '').trim()));
  if (!guidelineList.length) {
    return '<p class="prompt guideline-checkbox-empty">NÄ—ra aktyviÅ³ gairiÅ³ pasirinkimui.</p>';
  }
  return `
    <div class="guideline-checkbox-list">
      ${guidelineList.map((guideline) => `
        <label class="guideline-checkbox-item">
          <input
            class="guideline-checkbox-input"
            type="checkbox"
            name="${escapeHtml(name)}"
            value="${escapeHtml(guideline.id)}"
            ${selectedSet.has(String(guideline.id || '').trim()) ? 'checked' : ''}
            ${disabled ? 'disabled' : ''}
          />
          <span class="guideline-checkbox-label">${escapeHtml(guideline.title || guideline.id)}</span>
        </label>
      `).join('')}
    </div>
  `;
}

function buildGuidelineInitiativeMatrixRows(guidelines, initiatives) {
  const guidelineList = Array.isArray(guidelines) ? guidelines : [];
  const initiativeList = Array.isArray(initiatives) ? initiatives : [];

  const rows = guidelineList.map((guideline) => ({
    guidelineId: guideline.id,
    guidelineTitle: String(guideline.title || '').trim() || 'Be pavadinimo',
    initiativeTitles: []
  }));
  const rowByGuidelineId = new Map(rows.map((row) => [row.guidelineId, row]));

  initiativeList.forEach((initiative) => {
    const initiativeTitle = String(initiative?.title || '').trim() || 'Be pavadinimo';
    const guidelineIds = resolveInitiativeGuidelineIds(initiative);
    guidelineIds.forEach((guidelineId) => {
      const row = rowByGuidelineId.get(guidelineId);
      if (!row) return;
      row.initiativeTitles.push(initiativeTitle);
    });
  });

  return rows
    .map((row) => {
      const uniqueTitles = Array.from(new Set(row.initiativeTitles)).sort((a, b) => a.localeCompare(b, 'lt'));
      return {
        guidelineId: row.guidelineId,
        guidelineTitle: row.guidelineTitle,
        initiativeTitles: uniqueTitles,
        unassigned: uniqueTitles.length === 0
      };
    })
    .sort((a, b) => a.guidelineTitle.localeCompare(b.guidelineTitle, 'lt'));
}

function renderGuidelineInitiativeMatrix(guidelines, initiatives) {
  const rows = buildGuidelineInitiativeMatrixRows(guidelines, initiatives);
  return `
    <div class="initiative-matrix-card">
      <div class="initiative-matrix-header">
        <strong>${langText('Gairiu ir iniciatyvu susiejimas', 'Guideline-to-initiative mapping')}</strong>
        <span class="tag">${langText('Lentele', 'Table')}</span>
      </div>
      <p class="prompt">${langText('GairÄ—s, kurios neturi nei vienos iniciatyvos, paÅ¾ymÄ—tos atskirai.', 'Guidelines with no initiatives are highlighted separately.')}</p>
      <div class="initiative-matrix-scroll">
        <table class="initiative-matrix-table">
          <thead>
            <tr>
              <th>${langText('Gaire', 'Guideline')}</th>
              <th>${langText('Priskirtos iniciatyvos', 'Assigned initiatives')}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length
              ? rows.map((row) => `
                <tr class="${row.unassigned ? 'is-unassigned' : ''}">
                  <td class="initiative-matrix-guideline">${escapeHtml(row.guidelineTitle)}</td>
                  <td>
                    ${row.unassigned
                      ? `<span class="initiative-matrix-empty">${langText('Nepriskirta nė viena iniciatyva', 'No initiatives assigned')}</span>`
                      : `<div class="initiative-matrix-initiative-list">${row.initiativeTitles.map((title) => `<span class="initiative-matrix-chip">${escapeHtml(title)}</span>`).join('')}</div>`}
                  </td>
                </tr>
              `).join('')
              : `<tr><td colspan="2" class="initiative-matrix-empty-row">${langText('Gairiu dar nera.', 'No guidelines yet.')}</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderInitiativeCard(initiative, options) {
  const isLinkable = options?.linkable !== false;
  const commentsVisible = Boolean(options.commentsVisible);
  const showCommentsSection = Boolean(options.authenticated || commentsVisible);
  const commentsHint = commentsReadOnlyHintText(options);
  const userScore = Number(state.userVotes[initiative.id] || 0);
  const comments = Array.isArray(initiative.comments) ? initiative.comments : [];
  const safeComments = commentsVisible
    ? (comments.length
      ? comments.map((comment) => renderCommentItem(comment)).join('')
      : `<li class="comment-item comment-item-empty">${langText('Dar nera komentaru.', 'No comments yet.')}</li>`)
    : `<li class="comment-item comment-item-empty">${escapeHtml(commentsHiddenHintText())}</li>`;
  const initiativeStatus = String(initiative.status || 'active').toLowerCase();
  const pendingStatus = initiativeStatus === 'pending';
  const votingDisabled = initiativeStatus === 'disabled' || pendingStatus;
  const linkedNames = resolveInitiativeGuidelineNames(initiative);
  const initiativeUrl = initiativeShareUrl(initiative.id);
  const shareMarkup = renderCardShareRow({
    url: initiativeUrl,
    entityId: initiative.id,
    copyAction: 'copy-initiative-link'
  });

  const budget = voteBudget();
  const usedWithoutCurrent = usedVotesTotal() - userScore;
  const maxAllowed = clamp(
    Math.min(maxPerInitiative(), budget - usedWithoutCurrent),
    minPerInitiative(),
    maxPerInitiative()
  );
  const canMinus = options.member && options.writable && !votingDisabled && !state.busy && userScore > minPerInitiative();
  const canPlus = options.member && options.writable && !votingDisabled && !state.busy && userScore < maxAllowed;

  return `
    <article class="card initiative-card ${isLinkable ? 'is-linkable' : ''} ${votingDisabled ? 'guideline-disabled' : ''} ${pendingStatus ? 'card-pending' : ''}" data-initiative-id="${escapeHtml(initiative.id)}">
      <div class="card-top">
        <div class="title-row">
          <h4>${escapeHtml(initiative.title)}</h4>
          ${pendingStatus ? `<span class="tag tag-main">${langText('Laukia tvirtinimo', 'Pending')}</span>` : ''}
          ${initiativeStatus === 'disabled' ? `<span class="tag tag-disabled">${langText('Isjungta', 'Disabled')}</span>` : ''}
        </div>
        <p>${escapeHtml(initiative.description || langText('Be paaiskinimo', 'No description provided.'))}</p>
        ${shareMarkup}
        <div class="header-stack">
          ${(linkedNames.length
            ? linkedNames.map((name) => `<span class="tag">${escapeHtml(name)}</span>`).join('')
            : `<span class="tag">${langText('Nepriskirta gairiu', 'No linked guidelines')}</span>`)}
        </div>
      </div>
      ${options.member ? `
        <div class="vote-panel">
          <div class="vote-panel-head">
            <span class="vote-label">${langText('Tavo balas', 'Your vote')}</span>
          </div>
          <div class="vote-panel-body">
            <div class="vote-controls">
              <button class="vote-btn" data-action="initiative-vote-minus" data-id="${escapeHtml(initiative.id)}" aria-label="${escapeHtml(langText('Atimti bala', 'Decrease vote'))}" ${canMinus ? '' : 'disabled'}>&minus;</button>
              <span class="vote-score">${userScore}</span>
              <button class="vote-btn" data-action="initiative-vote-plus" data-id="${escapeHtml(initiative.id)}" aria-label="${escapeHtml(langText('Prideti bala', 'Increase vote'))}" ${canPlus ? '' : 'disabled'}>+</button>
            </div>
            <div class="vote-total">${langText('Bendras balas', 'Total score')}: <strong>${Number(initiative.totalScore || 0)}</strong></div>
            ${votingDisabled ? `<div class="vote-total">${pendingStatus ? langText('Laukiantis pasiÅ«lymas: balsavimas negalimas', 'Pending proposal: voting is disabled') : langText('Balsavimas isjungtas administratoriaus', 'Voting disabled by administrator')}</div>` : ''}
          </div>
        </div>
      ` : `
        <div class="vote-panel">
          <div class="vote-panel-body">
            <div class="vote-total"><strong>${langText('Bendras balas', 'Total score')}: ${Number(initiative.totalScore || 0)}</strong></div>
          </div>
        </div>
      `}
      ${showCommentsSection ? `
        <div class="card-section">
          <strong>${langText('Komentarai', 'Comments')}</strong>
          <ul class="mini-list">${safeComments}</ul>
          ${options.member && options.writable ? `
            <form data-action="initiative-comment" data-id="${escapeHtml(initiative.id)}" class="inline-form">
              <input type="text" name="comment" placeholder="${escapeHtml(langText('Irasykite komentara', 'Write a comment'))}" required ${state.busy ? 'disabled' : ''}/>
              <button class="btn btn-ghost" type="submit" ${state.busy ? 'disabled' : ''}>${langText('Prideti', 'Add')}</button>
            </form>
          ` : `<p class="prompt" style="margin: 8px 0 0;">${escapeHtml(commentsHint)}</p>`}
        </div>
      ` : ''}
    </article>
  `;
}

function renderImplementationMetaSummary(item) {
  const implementationDate = normalizeImplementationDateInputValue(item?.implementationDate);
  const implementationOwner = String(item?.implementationOwner || '').trim();
  const dateDisplay = formatInstitutionDate(implementationDate) || langText('Nenurodyta', 'Not set');
  const detailSummary = implementationOwner
    ? `${dateDisplay} • ${implementationOwner}`
    : dateDisplay;
  if (!implementationDate && !implementationOwner) {
    return `
      <div class="header-stack implementation-detail-meta">
        <span class="tag">${escapeHtml(langText('Įgyvendinimo data', 'Implementation date'))}: ${escapeHtml(langText('Nenurodyta', 'Not set'))}</span>
      </div>
    `;
  }
  return `
    <div class="header-stack implementation-detail-meta">
      <span class="tag">${escapeHtml(langText('Įgyvendinimo data', 'Implementation date'))}: ${escapeHtml(detailSummary)}</span>
    </div>
  `;
}

function checkedFormValues(form, name) {
  if (!(form instanceof HTMLFormElement)) return [];
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`))
    .map((input) => String(input.value || '').trim())
    .filter(Boolean);
}

function closeInternalEditModal() {
  const overlay = document.getElementById('internalEntityEditOverlay');
  if (overlay) overlay.remove();
}

function openGuidelineAdminEditModal(guideline) {
  if (!canManageSelectedInstitution()) return;
  const item = guideline && typeof guideline === 'object' ? guideline : null;
  if (!item?.id) return;
  closeInternalEditModal();

  const relation = normalizeGuidelineRelation(item.relationType);
  const parentOptions = state.guidelines
    .filter((candidate) => String(candidate?.id || '').trim() !== String(item.id || '').trim())
    .filter((candidate) => normalizeGuidelineRelation(candidate.relationType) === 'parent')
    .map((candidate) => `
      <option value="${escapeHtml(candidate.id)}" ${String(candidate.id || '').trim() === String(item.parentGuidelineId || '').trim() ? 'selected' : ''}>
        ${escapeHtml(candidate.title || candidate.id)}
      </option>
    `)
    .join('');

  const overlay = document.createElement('div');
  overlay.id = 'internalEntityEditOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card" role="dialog" aria-modal="true" aria-labelledby="guidelineEditTitle">
      <div class="auth-modal-header">
        <div>
          <h3 id="guidelineEditTitle">${escapeHtml(langText('Redaguoti gaires', 'Edit guideline'))}</h3>
          <p class="prompt admin-edit-subtitle">${escapeHtml(item.title || item.id)}</p>
        </div>
        <button type="button" class="btn btn-ghost" id="closeInternalEntityEditModal">${escapeHtml(langText('Uzdaryti', 'Close'))}</button>
      </div>
      <form id="guidelineEditForm" class="admin-edit-form">
        <section class="admin-edit-section">
          <h4 class="admin-edit-section-title">${escapeHtml(langText('Pagrindine informacija', 'Basic information'))}</h4>
          <label class="admin-edit-field">
            <span class="admin-edit-field-label">${escapeHtml(langText('Gaires pavadinimas', 'Guideline title'))}</span>
            <input class="admin-edit-title" type="text" name="title" value="${escapeHtml(item.title || '')}" required />
          </label>
          <label class="admin-edit-field">
            <span class="admin-edit-field-label">${escapeHtml(langText('Aprasymas', 'Description'))}</span>
            <textarea class="admin-edit-description" name="description" placeholder="${escapeHtml(langText('Trumpas gaires aprasymas', 'Short guideline description'))}">${escapeHtml(item.description || '')}</textarea>
          </label>
        </section>
        <section class="admin-edit-section">
          <h4 class="admin-edit-section-title">${escapeHtml(langText('Struktura ir planavimas', 'Structure and planning'))}</h4>
          <div class="admin-edit-grid admin-edit-grid-3">
            <label class="admin-edit-field">
              <span class="admin-edit-field-label">${escapeHtml(langText('Busena', 'Status'))}</span>
              <select name="status">
                ${['active', 'disabled', 'merged', 'hidden'].map((status) => `
                  <option value="${status}" ${String(item.status || 'active').trim() === status ? 'selected' : ''}>${escapeHtml(status)}</option>
                `).join('')}
              </select>
            </label>
            <label class="admin-edit-field">
              <span class="admin-edit-field-label">${escapeHtml(langText('Tipas', 'Type'))}</span>
              <select name="relationType">
                <option value="orphan" ${relation === 'orphan' ? 'selected' : ''}>${escapeHtml(langText('Naslaite', 'Orphan'))}</option>
                <option value="parent" ${relation === 'parent' ? 'selected' : ''}>${escapeHtml(langText('Tevine', 'Parent'))}</option>
                <option value="child" ${relation === 'child' ? 'selected' : ''}>${escapeHtml(langText('Vaikine', 'Child'))}</option>
              </select>
            </label>
            <label class="admin-edit-field${relation === 'child' ? '' : ' is-hidden'}" data-admin-parent-field>
              <span class="admin-edit-field-label">${escapeHtml(langText('Tevine gaire', 'Parent guideline'))}</span>
              <select name="parentGuidelineId" ${relation === 'child' ? '' : 'disabled'}>
                <option value="">${escapeHtml(langText('Pasirinkite tevine gaire', 'Select parent guideline'))}</option>
                ${parentOptions}
              </select>
            </label>
          </div>
          <div class="admin-edit-grid admin-edit-grid-2">
            <label class="admin-edit-field">
              <span class="admin-edit-field-label">${escapeHtml(langText('Igyvendinimo data', 'Implementation date'))}</span>
              <input type="date" name="implementationDate" value="${escapeHtml(normalizeImplementationDateInputValue(item.implementationDate))}" />
            </label>
            <label class="admin-edit-field">
              <span class="admin-edit-field-label">${escapeHtml(langText('Atsakingas asmuo ar padalinys', 'Responsible person or unit'))}</span>
              <input type="text" name="implementationOwner" value="${escapeHtml(String(item.implementationOwner || '').trim())}" placeholder="${escapeHtml(langText('Pvz. NPD skyrius', 'For example, Operations unit'))}" />
            </label>
          </div>
        </section>
        <div class="admin-edit-footer">
          <button class="btn btn-danger" type="button" id="deleteInternalGuidelineBtn">${escapeHtml(langText('Istrinti', 'Delete'))}</button>
          <div class="admin-edit-actions">
            <button class="btn btn-primary" type="submit">${escapeHtml(langText('Issaugoti', 'Save'))}</button>
          </div>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector('#closeInternalEntityEditModal');
  const form = overlay.querySelector('#guidelineEditForm');
  const relationSelect = form?.querySelector('[name="relationType"]');
  const parentSelect = form?.querySelector('[name="parentGuidelineId"]');
  const parentField = form?.querySelector('[data-admin-parent-field]');
  const syncRelation = () => {
    if (!(relationSelect instanceof HTMLSelectElement) || !(parentSelect instanceof HTMLSelectElement)) return;
    const needsParent = String(relationSelect.value || 'orphan').trim() === 'child';
    parentSelect.disabled = !needsParent;
    if (!needsParent) parentSelect.value = '';
    parentField?.classList.toggle('is-hidden', !needsParent);
  };
  relationSelect?.addEventListener('change', syncRelation);
  syncRelation();

  closeButton?.addEventListener('click', closeInternalEditModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeInternalEditModal();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim();
    const status = String(fd.get('status') || 'active').trim();
    const relationType = String(fd.get('relationType') || 'orphan').trim();
    const parentGuidelineId = String(fd.get('parentGuidelineId') || '').trim();
    const implementationDate = normalizeImplementationDateInputValue(fd.get('implementationDate'));
    const implementationOwner = String(fd.get('implementationOwner') || '').trim();
    if (!title) return;
    await runBusy(async () => {
      await api(`/api/v1/admin/guidelines/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        body: {
          title,
          description,
          status,
          relationType,
          parentGuidelineId: relationType === 'child' ? parentGuidelineId : null,
          lineSide: 'auto',
          implementationDate,
          implementationOwner
        }
      });
      closeInternalEditModal();
      state.notice = langText('Gaire atnaujinta.', 'Guideline updated.');
      notifySuccess(state.notice);
      await bootstrap();
    });
  });

  overlay.querySelector('#deleteInternalGuidelineBtn')?.addEventListener('click', async () => {
    if (!window.confirm(langText(`Ar tikrai norite istrinti gaire "${item.title || ''}"?`, `Delete guideline "${item.title || ''}"?`))) return;
    await runBusy(async () => {
      await api(`/api/v1/admin/guidelines/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      closeInternalEditModal();
      state.notice = langText('Gaire istrinta.', 'Guideline deleted.');
      notifySuccess(state.notice);
      setActiveView('guidelines');
      await bootstrap();
    });
  });
}

function openInitiativeAdminEditModal(initiative) {
  if (!canManageSelectedInstitution()) return;
  const item = initiative && typeof initiative === 'object' ? initiative : null;
  if (!item?.id) return;
  closeInternalEditModal();

  const selectedGuidelineIds = resolveInitiativeGuidelineIds(item);
  const overlay = document.createElement('div');
  overlay.id = 'internalEntityEditOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card" role="dialog" aria-modal="true" aria-labelledby="initiativeEditTitle">
      <div class="auth-modal-header">
        <div>
          <h3 id="initiativeEditTitle">${escapeHtml(langText('Redaguoti iniciatyva', 'Edit initiative'))}</h3>
          <p class="prompt admin-edit-subtitle">${escapeHtml(item.title || item.id)}</p>
        </div>
        <button type="button" class="btn btn-ghost" id="closeInternalEntityEditModal">${escapeHtml(langText('Uzdaryti', 'Close'))}</button>
      </div>
      <form id="initiativeEditForm" class="admin-edit-form">
        <section class="admin-edit-section">
          <h4 class="admin-edit-section-title">${escapeHtml(langText('Pagrindine informacija', 'Basic information'))}</h4>
          <label class="admin-edit-field">
            <span class="admin-edit-field-label">${escapeHtml(langText('Iniciatyvos pavadinimas', 'Initiative title'))}</span>
            <input class="admin-edit-title" type="text" name="title" value="${escapeHtml(item.title || '')}" required />
          </label>
          <label class="admin-edit-field">
            <span class="admin-edit-field-label">${escapeHtml(langText('Aprasymas', 'Description'))}</span>
            <textarea class="admin-edit-description" name="description" placeholder="${escapeHtml(langText('Trumpas iniciatyvos aprasymas', 'Short initiative description'))}">${escapeHtml(item.description || '')}</textarea>
          </label>
        </section>
        <section class="admin-edit-section">
          <h4 class="admin-edit-section-title">${escapeHtml(langText('Igyvendinimas', 'Implementation'))}</h4>
          <div class="admin-edit-grid admin-edit-grid-3">
            <label class="admin-edit-field">
              <span class="admin-edit-field-label">${escapeHtml(langText('Busena', 'Status'))}</span>
              <select name="status">
                ${['active', 'disabled', 'merged', 'hidden'].map((status) => `
                  <option value="${status}" ${String(item.status || 'active').trim() === status ? 'selected' : ''}>${escapeHtml(status)}</option>
                `).join('')}
              </select>
            </label>
            <label class="admin-edit-field">
              <span class="admin-edit-field-label">${escapeHtml(langText('Igyvendinimo data', 'Implementation date'))}</span>
              <input type="date" name="implementationDate" value="${escapeHtml(normalizeImplementationDateInputValue(item.implementationDate))}" />
            </label>
            <label class="admin-edit-field">
              <span class="admin-edit-field-label">${escapeHtml(langText('Atsakingas asmuo ar padalinys', 'Responsible person or unit'))}</span>
              <input type="text" name="implementationOwner" value="${escapeHtml(String(item.implementationOwner || '').trim())}" placeholder="${escapeHtml(langText('Pvz. Projekto komanda', 'For example, Project team'))}" />
            </label>
          </div>
        </section>
        <section class="admin-edit-section">
          <h4 class="admin-edit-section-title">${escapeHtml(langText('Susietos gaires', 'Linked guidelines'))}</h4>
          <p class="prompt admin-edit-section-hint">${escapeHtml(langText('Pasirinkite, kurias gaires si iniciatyva palaiko.', 'Choose which guidelines this initiative supports.'))}</p>
          <div class="guideline-checkbox-panel">
            ${renderGuidelineCheckboxList(state.guidelines, { selectedIds: selectedGuidelineIds, name: 'guidelineIds' })}
          </div>
        </section>
        <div class="admin-edit-footer">
          <button class="btn btn-danger" type="button" id="deleteInternalInitiativeBtn">${escapeHtml(langText('Istrinti', 'Delete'))}</button>
          <div class="admin-edit-actions">
            <button class="btn btn-primary" type="submit">${escapeHtml(langText('Issaugoti', 'Save'))}</button>
          </div>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#closeInternalEntityEditModal')?.addEventListener('click', closeInternalEditModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeInternalEditModal();
  });

  const form = overlay.querySelector('#initiativeEditForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim();
    const status = String(fd.get('status') || 'active').trim();
    const implementationDate = normalizeImplementationDateInputValue(fd.get('implementationDate'));
    const implementationOwner = String(fd.get('implementationOwner') || '').trim();
    const guidelineIds = checkedFormValues(form, 'guidelineIds');
    if (!title) return;
    await runBusy(async () => {
      await api(`/api/v1/admin/initiatives/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        body: {
          title,
          description,
          status,
          guidelineIds,
          lineSide: 'auto',
          implementationDate,
          implementationOwner
        }
      });
      closeInternalEditModal();
      state.notice = langText('Iniciatyva atnaujinta.', 'Initiative updated.');
      notifySuccess(state.notice);
      await bootstrap();
    });
  });

  overlay.querySelector('#deleteInternalInitiativeBtn')?.addEventListener('click', async () => {
    if (!window.confirm(langText(`Ar tikrai norite istrinti iniciatyva "${item.title || ''}"?`, `Delete initiative "${item.title || ''}"?`))) return;
    await runBusy(async () => {
      await api(`/api/v1/admin/initiatives/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      closeInternalEditModal();
      state.notice = langText('Iniciatyva istrinta.', 'Initiative deleted.');
      notifySuccess(state.notice);
      setActiveView('initiatives');
      await bootstrap();
    });
  });
}

function findGuidelineByRouteEntity() {
  if (state.routeEntityKind !== 'guideline') return null;
  const targetId = String(state.routeEntityId || '').trim();
  if (!targetId) return null;
  return (state.guidelines || []).find((guideline) => String(guideline?.id || '').trim() === targetId) || null;
}

function findInitiativeByRouteEntity() {
  if (state.routeEntityKind !== 'initiative') return null;
  const targetId = String(state.routeEntityId || '').trim();
  if (!targetId) return null;
  return (state.initiatives || []).find((initiative) => String(initiative?.id || '').trim() === targetId) || null;
}

async function resolveRouteEntityAliasIfNeeded() {
  const entityKind = String(state.routeEntityKind || '').trim().toLowerCase();
  const entityId = String(state.routeEntityId || '').trim();
  if (!entityKind || !entityId) return;
  if (entityKind !== 'guideline' && entityKind !== 'initiative') return;
  if (!state.institutionSlug || !state.strategySlug) return;

  const existsInLoadedData = entityKind === 'guideline'
    ? (state.guidelines || []).some((item) => String(item?.id || '').trim() === entityId)
    : (state.initiatives || []).some((item) => String(item?.id || '').trim() === entityId);
  if (existsInLoadedData) return;

  try {
    const params = new URLSearchParams();
    if (state.strategySlug) params.set('strategy', state.strategySlug);
    const payload = await api(
      `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/proposals/${encodeURIComponent(entityId)}/resolve?${params.toString()}`,
      { auth: 'optional' }
    );
    if (!payload?.shouldRedirect) return;
    const finalEntityId = String(payload.finalEntityId || '').trim();
    const finalKind = String(payload.entityKind || '').trim().toLowerCase();
    if (!finalEntityId || (finalKind !== 'guideline' && finalKind !== 'initiative')) return;

    setRouteEntity(finalKind, finalEntityId);
    state.activeView = finalKind === 'guideline' ? 'guideline-detail' : 'initiative-detail';
    syncRouteState();
  } catch {
    // silently keep original URL when alias cannot be resolved
  }
}

function findGuidelineById(guidelineId) {
  const targetId = String(guidelineId || '').trim();
  if (!targetId) return null;
  return (state.guidelines || []).find((guideline) => String(guideline?.id || '').trim() === targetId) || null;
}

function findInitiativeById(initiativeId) {
  const targetId = String(initiativeId || '').trim();
  if (!targetId) return null;
  return (state.initiatives || []).find((initiative) => String(initiative?.id || '').trim() === targetId) || null;
}

function normalizeImportComparableText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canImportExternalEntityByRef(kind, entityId) {
  if (String(kind || '').trim().toLowerCase() === 'initiative') {
    return canImportExternalItem(findInitiativeById(entityId));
  }
  return canImportExternalItem(findGuidelineById(entityId));
}

function resolveGuidelineParent(guideline) {
  const item = guideline && typeof guideline === 'object' ? guideline : null;
  if (!item) return null;
  const relation = String(item.relationType || '').trim().toLowerCase();
  if (relation !== 'child') return null;
  return findGuidelineById(item.parentGuidelineId);
}

function resolveInitiativeLinkedGuidelines(initiative) {
  const item = initiative && typeof initiative === 'object' ? initiative : null;
  if (!item) return [];

  const links = Array.isArray(item.guidelineLinks) ? item.guidelineLinks : [];
  const fromLinks = links
    .map((link) => {
      const guidelineId = String(link?.guidelineId || '').trim();
      if (!guidelineId) return null;
      const fromState = findGuidelineById(guidelineId);
      if (fromState) return fromState;
      const title = String(link?.guidelineTitle || '').trim();
      if (!title) return null;
      return {
        id: guidelineId,
        title
      };
    })
    .filter(Boolean);
  if (fromLinks.length) return fromLinks;

  const ids = Array.isArray(item.guidelineIds) ? item.guidelineIds : [];
  return ids
    .map((guidelineId) => findGuidelineById(guidelineId))
    .filter(Boolean);
}

function sortCardsByTitle(items) {
  const source = Array.isArray(items) ? items : [];
  return [...source].sort((left, right) => {
    const leftLabel = String(left?.title || left?.id || '').trim();
    const rightLabel = String(right?.title || right?.id || '').trim();
    return leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' });
  });
}

function resolveGuidelineRelatedItems(guideline) {
  const item = guideline && typeof guideline === 'object' ? guideline : null;
  if (!item) {
    return {
      heading: langText('Susije korteles', 'Related cards'),
      emptyLabel: langText('Susijusiu korteliu nerasta.', 'No related cards found.'),
      items: []
    };
  }

  const relation = normalizeGuidelineRelation(item.relationType);
  const guidelineId = String(item.id || '').trim();
  const guidelines = Array.isArray(state.guidelines) ? state.guidelines : [];

  if (relation === 'parent') {
    const children = sortCardsByTitle(guidelines.filter((candidate) => {
      if (!candidate || typeof candidate !== 'object') return false;
      if (normalizeGuidelineRelation(candidate.relationType) !== 'child') return false;
      return String(candidate.parentGuidelineId || '').trim() === guidelineId;
    }));
    return {
      heading: langText('Vaikines gaires', 'Child guidelines'),
      emptyLabel: langText('Vaikiniu gairiu dar nera.', 'No child guidelines yet.'),
      items: children
    };
  }

  if (relation === 'child') {
    const parent = resolveGuidelineParent(item);
    return {
      heading: langText('Tevine gaire', 'Parent guideline'),
      emptyLabel: langText('Tevine gaire nepriskirta.', 'No parent guideline is assigned.'),
      items: parent ? [parent] : []
    };
  }

  const otherOrphans = sortCardsByTitle(guidelines.filter((candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    if (normalizeGuidelineRelation(candidate.relationType) !== 'orphan') return false;
    return String(candidate.id || '').trim() !== guidelineId;
  }));
  return {
    heading: langText('Kitos naslaiciu gaires', 'Other orphan guidelines'),
    emptyLabel: langText('Kitu naslaiciu gairiu nera.', 'No other orphan guidelines.'),
    items: otherOrphans
  };
}

function resolveGuidelineRelatedInitiatives(guideline) {
  const item = guideline && typeof guideline === 'object' ? guideline : null;
  if (!item) {
    return {
      heading: langText('Susijusios iniciatyvos', 'Associated initiatives'),
      emptyLabel: langText('Susietu iniciatyvu nerasta.', 'No linked initiatives found.'),
      items: []
    };
  }

  const guidelineIds = new Set();
  const currentGuidelineId = String(item.id || '').trim();
  if (currentGuidelineId) guidelineIds.add(currentGuidelineId);

  if (normalizeGuidelineRelation(item.relationType) === 'parent') {
    (Array.isArray(state.guidelines) ? state.guidelines : []).forEach((candidate) => {
      if (!candidate || typeof candidate !== 'object') return;
      if (normalizeGuidelineRelation(candidate.relationType) !== 'child') return;
      if (String(candidate.parentGuidelineId || '').trim() !== currentGuidelineId) return;
      const childId = String(candidate.id || '').trim();
      if (childId) guidelineIds.add(childId);
    });
  }

  const initiatives = sortCardsByTitle((Array.isArray(state.initiatives) ? state.initiatives : []).filter((initiative) => {
    const linkedGuidelineIds = resolveInitiativeGuidelineIds(initiative);
    return linkedGuidelineIds.some((guidelineId) => guidelineIds.has(String(guidelineId || '').trim()));
  }));

  return {
    heading: langText('Susijusios iniciatyvos', 'Associated initiatives'),
    emptyLabel: langText('Susietu iniciatyvu nerasta.', 'No linked initiatives found.'),
    items: initiatives
  };
}

function renderRelatedDetailSectionMarkup({
  heading,
  emptyLabel,
  items,
  showHeading = true,
  sectionClass = '',
  headingClass = '',
  action = 'open-related-guideline-detail',
  idAttribute = 'data-guideline-id',
  tone = 'guideline'
}) {
  const cards = Array.isArray(items) ? items : [];
  const safeSectionClass = String(sectionClass || '').trim();
  const safeHeadingClass = String(headingClass || '').trim();
  const safeAction = String(action || 'open-related-guideline-detail').trim() || 'open-related-guideline-detail';
  const safeIdAttribute = String(idAttribute || 'data-guideline-id').trim() || 'data-guideline-id';
  const safeTone = String(tone || 'guideline').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
  return `
    <section class="guideline-group detail-related-group detail-related-group-tone-${escapeHtml(safeTone)} ${escapeHtml(safeSectionClass)}">
      ${showHeading ? `
        <div class="guideline-group-header">
          <h3 class="${escapeHtml(safeHeadingClass)}">${escapeHtml(heading)}</h3>
          <span class="tag detail-related-count">${cards.length}</span>
        </div>
      ` : ''}
      ${cards.length
    ? `<div class="detail-related-links">
            ${cards.map((card) => `
              <button
                type="button"
                class="detail-related-link detail-related-link-${escapeHtml(safeTone)}"
                data-action="${escapeHtml(safeAction)}"
                ${safeIdAttribute}="${escapeHtml(card.id)}"
              >${escapeHtml(card.title || card.id)}</button>
            `).join('')}
          </div>`
    : `<div class="card guideline-empty"><strong>${escapeHtml(emptyLabel)}</strong></div>`}
    </section>
  `;
}

function renderGuidelineRelatedSection(guideline, options = {}) {
  return renderRelatedDetailSectionMarkup({
    ...resolveGuidelineRelatedItems(guideline),
    showHeading: Boolean(options.showHeading)
  });
}

function renderInitiativeRelatedGuidelinesSection(initiative) {
  const linked = resolveInitiativeLinkedGuidelines(initiative);
  const uniqueById = new Map();
  linked.forEach((card) => {
    const cardId = String(card?.id || '').trim();
    if (!cardId) return;
    if (uniqueById.has(cardId)) return;
    uniqueById.set(cardId, card);
  });
  return renderRelatedDetailSectionMarkup({
    heading: langText('Palaikomos gaires', 'Supported guidelines'),
    emptyLabel: langText('Susietu gairiu nerasta.', 'No linked guidelines found.'),
    items: sortCardsByTitle(Array.from(uniqueById.values())),
    sectionClass: 'detail-related-group-initiative',
    headingClass: 'detail-related-heading-compact',
    tone: 'guideline'
  });
}

function renderGuidelineDetailRelatedGrid(guideline) {
  return `
    <div class="detail-related-grid">
      ${renderRelatedDetailSectionMarkup({
    ...resolveGuidelineRelatedItems(guideline),
    showHeading: true,
    sectionClass: 'detail-related-group-guideline',
    tone: 'guideline'
  })}
      ${renderRelatedDetailSectionMarkup({
    ...resolveGuidelineRelatedInitiatives(guideline),
    showHeading: true,
    sectionClass: 'detail-related-group-initiative',
    action: 'open-related-initiative-detail',
    idAttribute: 'data-initiative-id',
    tone: 'initiative'
  })}
    </div>
  `;
}

function buildGuidelineDetailBreadcrumbs(guideline) {
  const item = guideline && typeof guideline === 'object' ? guideline : null;
  if (!item) return '';
  const strategyTitle = String(state.strategy?.title || state.strategySlug || '-').trim() || '-';
  const parent = resolveGuidelineParent(item);
  const label = langText('Kelias', 'Breadcrumb');
  const listLabel = langText('GairÄ—s', 'Guidelines');
  const parentLabel = langText('Tevine gaire', 'Parent guideline');
  const currentTitle = String(item.title || item.id || '-').trim() || '-';

  return `
    <nav class="detail-breadcrumbs" aria-label="${escapeHtml(label)}">
      <span class="detail-breadcrumb-label">${escapeHtml(label)}:</span>
      <button type="button" class="detail-breadcrumb-link" data-action="open-guidelines-list">${escapeHtml(listLabel)}</button>
      <span class="detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
      <span class="detail-breadcrumb-node">${escapeHtml(strategyTitle)}</span>
      ${parent ? `
        <span class="detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <button type="button" class="detail-breadcrumb-link" data-action="open-parent-guideline-detail" data-guideline-id="${escapeHtml(parent.id)}" title="${escapeHtml(parentLabel)}">${escapeHtml(parent.title || parent.id)}</button>
      ` : ''}
      <span class="detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
      <span class="detail-breadcrumb-node current">${escapeHtml(currentTitle)}</span>
    </nav>
  `;
}

function buildInitiativeDetailBreadcrumbs(initiative) {
  const item = initiative && typeof initiative === 'object' ? initiative : null;
  if (!item) return '';
  const strategyTitle = String(state.strategy?.title || state.strategySlug || '-').trim() || '-';
  const linkedGuidelines = resolveInitiativeLinkedGuidelines(item);
  const primaryGuideline = linkedGuidelines[0] || null;
  const linkedMoreCount = Math.max(0, linkedGuidelines.length - 1);
  const label = langText('Kelias', 'Breadcrumb');
  const listLabel = langText('Iniciatyvos', 'Initiatives');
  const currentTitle = String(item.title || item.id || '-').trim() || '-';
  const linkedLabel = langText('Susieta gaire', 'Linked guideline');
  const linkedMoreLabel = langText('papildomos', 'more');

  return `
    <nav class="detail-breadcrumbs" aria-label="${escapeHtml(label)}">
      <span class="detail-breadcrumb-label">${escapeHtml(label)}:</span>
      <button type="button" class="detail-breadcrumb-link" data-action="open-initiatives-list">${escapeHtml(listLabel)}</button>
      <span class="detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
      <span class="detail-breadcrumb-node">${escapeHtml(strategyTitle)}</span>
      ${primaryGuideline ? `
        <span class="detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
        <button type="button" class="detail-breadcrumb-link" data-action="open-guideline-detail-from-initiative" data-guideline-id="${escapeHtml(primaryGuideline.id)}" title="${escapeHtml(linkedLabel)}">${escapeHtml(primaryGuideline.title || primaryGuideline.id)}</button>
        ${linkedMoreCount ? `<span class="detail-breadcrumb-extra">+${linkedMoreCount} ${escapeHtml(linkedMoreLabel)}</span>` : ''}
      ` : ''}
      <span class="detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
      <span class="detail-breadcrumb-node current">${escapeHtml(currentTitle)}</span>
    </nav>
  `;
}

function renderGuidelineDetailView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite institucija', 'Select an institution')}</strong>
      </div>
    `;
    return;
  }

  if (state.loading) {
    elements.stepView.innerHTML = `<div class="card"><strong>${langText('Kraunami duomenys...', 'Loading data...')}</strong></div>`;
    return;
  }

  if (state.error) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Nepavyko ikelti duomenu', 'Failed to load data')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.error)}</p>
        <button id="retryLoadBtn" class="btn btn-primary" style="margin-top: 12px;">${langText('Bandyti dar karta', 'Try again')}</button>
      </div>
    `;
    const retryBtn = elements.stepView.querySelector('#retryLoadBtn');
    if (retryBtn) retryBtn.addEventListener('click', bootstrap);
    return;
  }

  const guideline = findGuidelineByRouteEntity();
  if (!guideline) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Gaire nerasta', 'Guideline not found')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${langText('Patikrinkite nuoroda arba grizkite i gairiu sarasa.', 'Check the URL or return to guideline list.')}</p>
        <button id="backToGuidelinesBtn" class="btn btn-ghost" style="margin-top: 12px;">${langText('GrÄ¯Å¾ti Ä¯ gaires', 'Back to guidelines')}</button>
      </div>
    `;
    const backButton = elements.stepView.querySelector('#backToGuidelinesBtn');
    if (backButton) {
      backButton.addEventListener('click', () => {
        setActiveView('guidelines');
      });
    }
    return;
  }

  const member = isLoggedIn();
  const authenticated = isAuthenticated();
  const writable = member && cycleIsWritable();
  const cardUrl = guidelineShareUrl(guideline.id);
  const breadcrumbMarkup = buildGuidelineDetailBreadcrumbs(guideline);
  const relatedGuidelinesMarkup = renderGuidelineDetailRelatedGrid(guideline);
  const canManage = canManageSelectedInstitution();
  const canImport = canImportExternalItem(guideline);
  elements.stepView.innerHTML = `
    <div class="step-header">
      <div></div>
      <div class="header-stack step-header-actions">
        ${canManage ? `<button id="editGuidelineBtn" class="btn btn-primary">${langText('Redaguoti', 'Edit')}</button>` : ''}
        ${canImport ? `<button id="importGuidelineBtn" class="btn btn-primary">${langText('Naudoti mano strategijoje', 'Use in my strategy')}</button>` : ''}
        <button id="backToGuidelinesBtn" class="btn btn-ghost">${langText('GrÄ¯Å¾ti Ä¯ gaires', 'Back to guidelines')}</button>
        <button id="openGuidelineMapBtn" class="btn btn-ghost">${langText('Rodyti Å¾emÄ—lapyje', 'Show on map')}</button>
      </div>
    </div>
    ${breadcrumbMarkup}
    <div class="header-stack" style="margin-bottom: 14px;">
      <span class="tag">${escapeHtml(langText('Nuoroda', 'URL'))}: <a href="${escapeHtml(cardUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cardUrl)}</a></span>
    </div>
    ${renderImplementationMetaSummary(guideline)}
    ${state.notice ? `<div class="card" style="margin-bottom: 16px;"><strong>${escapeHtml(state.notice)}</strong></div>` : ''}
    <section id="guidelineGroups" class="guideline-groups" data-detail-view="1">
      <div class="card-list">
        ${renderGuidelineCard(guideline, {
    member,
    writable,
    authenticated,
    commentsVisible: state.commentsVisible,
    linkable: false
  })}
      </div>
    </section>
    ${relatedGuidelinesMarkup}
  `;

  bindStepEvents();
  const backButton = elements.stepView.querySelector('#backToGuidelinesBtn');
  if (backButton) {
    backButton.addEventListener('click', () => {
      setActiveView('guidelines');
    });
  }
  elements.stepView.querySelectorAll('[data-action="open-guidelines-list"]').forEach((button) => {
    button.addEventListener('click', () => {
      setActiveView('guidelines');
    });
  });
  elements.stepView.querySelectorAll('[data-action="open-parent-guideline-detail"]').forEach((button) => {
    button.addEventListener('click', () => {
      const parentId = String(button.dataset.guidelineId || '').trim();
      if (!parentId) return;
      openGuidelineDetail(parentId);
    });
  });
  elements.stepView.querySelectorAll('[data-action="open-related-guideline-detail"]').forEach((button) => {
    button.addEventListener('click', () => {
      const relatedId = String(button.dataset.guidelineId || '').trim();
      if (!relatedId) return;
      openGuidelineDetail(relatedId);
    });
  });
  elements.stepView.querySelectorAll('[data-action="open-related-initiative-detail"]').forEach((button) => {
    button.addEventListener('click', () => {
      const initiativeId = String(button.dataset.initiativeId || '').trim();
      if (!initiativeId) return;
      openInitiativeDetail(initiativeId);
    });
  });
  const openMapButton = elements.stepView.querySelector('#openGuidelineMapBtn');
  if (openMapButton) {
    openMapButton.addEventListener('click', () => {
      openMapForCard('guideline', guideline.id);
    });
  }
  const editButton = elements.stepView.querySelector('#editGuidelineBtn');
  if (editButton) {
    editButton.addEventListener('click', () => {
      openGuidelineAdminEditModal(guideline);
    });
  }
  const importButton = elements.stepView.querySelector('#importGuidelineBtn');
  if (importButton) {
    importButton.addEventListener('click', () => {
      openExternalItemImportModal('guideline', guideline.id);
    });
  }
}

function bindInitiativeCardInteractions(list) {
  if (!(list instanceof HTMLElement)) return;

  list.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const detailView = list.dataset.detailView === '1';
    const clickedInteractive = target.closest('button, input, textarea, select, a, label, form');
    if (!clickedInteractive && !detailView) {
      const card = target.closest('.initiative-card[data-initiative-id]');
      const initiativeIdFromCard = String(card?.dataset?.initiativeId || '').trim();
      if (initiativeIdFromCard) {
        openInitiativeDetail(initiativeIdFromCard);
        return;
      }
    }
    const actionElement = target.closest('[data-action]');
    if (!(actionElement instanceof HTMLElement)) return;
    const action = actionElement.dataset.action;
    const initiativeId = String(actionElement.dataset.id || '').trim();
    if (!action || !initiativeId) return;

    if (action === 'copy-initiative-link') {
      const url = String(actionElement.dataset.url || initiativeShareUrl(initiativeId)).trim();
      const copied = await copyTextToClipboard(url);
      state.notice = copied
        ? langText('Iniciatyvos nuoroda nukopijuota.', 'Initiative URL copied.')
        : langText('Nepavyko nukopijuoti nuorodos.', 'Failed to copy URL.');
      if (copied) notifySuccess(state.notice);
      else notifyError(state.notice);
      render();
      return;
    }

    if (action === 'initiative-vote-plus' || action === 'initiative-vote-minus') {
      const delta = action === 'initiative-vote-plus' ? 1 : -1;
      const origin = getElementCenter(actionElement);
      await runBusy(async () => {
        const changed = await changeInitiativeVote(initiativeId, delta);
        if (changed) triggerVoteBurstAt(origin, delta);
      });
    }
  });

  list.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.action !== 'initiative-comment') return;
    event.preventDefault();

    const initiativeId = form.dataset.id;
    const value = String(new FormData(form).get('comment') || '').trim();
    if (!initiativeId || !value) return;

    await runBusy(async () => {
      await api(`/api/v1/initiatives/${encodeURIComponent(initiativeId)}/comments`, {
        method: 'POST',
        body: { body: value }
      });
      await Promise.all([refreshInitiatives(), refreshSummary(), loadStrategyMap(), refreshHistory()]);
    });
  });
}

function renderInitiativeDetailView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite institucija', 'Select an institution')}</strong>
      </div>
    `;
    return;
  }

  if (state.loading) {
    elements.stepView.innerHTML = `<div class="card"><strong>${langText('Kraunami duomenys...', 'Loading data...')}</strong></div>`;
    return;
  }

  if (state.error) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Nepavyko ikelti duomenu', 'Failed to load data')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.error)}</p>
        <button id="retryLoadBtn" class="btn btn-primary" style="margin-top: 12px;">${langText('Bandyti dar karta', 'Try again')}</button>
      </div>
    `;
    const retryBtn = elements.stepView.querySelector('#retryLoadBtn');
    if (retryBtn) retryBtn.addEventListener('click', bootstrap);
    return;
  }

  const initiative = findInitiativeByRouteEntity();
  if (!initiative) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Iniciatyva nerasta', 'Initiative not found')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${langText('Patikrinkite nuoroda arba grizkite i iniciatyvu sarasa.', 'Check the URL or return to initiative list.')}</p>
        <button id="backToInitiativesBtn" class="btn btn-ghost" style="margin-top: 12px;">${langText('GrÄ¯Å¾ti Ä¯ iniciatyvas', 'Back to initiatives')}</button>
      </div>
    `;
    const backButton = elements.stepView.querySelector('#backToInitiativesBtn');
    if (backButton) {
      backButton.addEventListener('click', () => {
        setActiveView('initiatives');
      });
    }
    return;
  }

  const member = isLoggedIn();
  const authenticated = isAuthenticated();
  const writable = member && cycleIsWritable();
  const relatedGuidelinesMarkup = renderInitiativeRelatedGuidelinesSection(initiative);
  const canManage = canManageSelectedInstitution();
  const canImport = canImportExternalItem(initiative);
  elements.stepView.innerHTML = `
    <div class="step-header">
      <h2>${langText('Iniciatyvos kortele', 'Initiative card')}</h2>
      <div class="header-stack step-header-actions">
        ${canManage ? `<button id="editInitiativeBtn" class="btn btn-primary">${langText('Redaguoti', 'Edit')}</button>` : ''}
        ${canImport ? `<button id="importInitiativeBtn" class="btn btn-primary">${langText('Naudoti mano strategijoje', 'Use in my strategy')}</button>` : ''}
        <button id="backToInitiativesBtn" class="btn btn-ghost">${langText('GrÄ¯Å¾ti Ä¯ iniciatyvas', 'Back to initiatives')}</button>
        <button id="openInitiativeMapBtn" class="btn btn-ghost">${langText('Rodyti Å¾emÄ—lapyje', 'Show on map')}</button>
      </div>
    </div>
    ${renderImplementationMetaSummary(initiative)}
    ${state.notice ? `<div class="card" style="margin-bottom: 16px;"><strong>${escapeHtml(state.notice)}</strong></div>` : ''}
    <section id="initiativeSection" class="guideline-group" data-detail-view="1">
      <div class="card-list initiative-list">
        ${renderInitiativeCard(initiative, {
    member,
    writable,
    authenticated,
    commentsVisible: state.commentsVisible,
    linkable: false
  })}
      </div>
    </section>
    ${relatedGuidelinesMarkup}
  `;

  const backButton = elements.stepView.querySelector('#backToInitiativesBtn');
  if (backButton) {
    backButton.addEventListener('click', () => {
      setActiveView('initiatives');
    });
  }
  elements.stepView.querySelectorAll('[data-action="open-initiatives-list"]').forEach((button) => {
    button.addEventListener('click', () => {
      setActiveView('initiatives');
    });
  });
  elements.stepView.querySelectorAll('[data-action="open-guideline-detail-from-initiative"]').forEach((button) => {
    button.addEventListener('click', () => {
      const guidelineId = String(button.dataset.guidelineId || '').trim();
      if (!guidelineId) return;
      openGuidelineDetail(guidelineId);
    });
  });
  elements.stepView.querySelectorAll('[data-action="open-related-guideline-detail"]').forEach((button) => {
    button.addEventListener('click', () => {
      const guidelineId = String(button.dataset.guidelineId || '').trim();
      if (!guidelineId) return;
      openGuidelineDetail(guidelineId);
    });
  });
  const openMapButton = elements.stepView.querySelector('#openInitiativeMapBtn');
  if (openMapButton) {
    openMapButton.addEventListener('click', () => {
      openMapForCard('initiative', initiative.id);
    });
  }
  const editButton = elements.stepView.querySelector('#editInitiativeBtn');
  if (editButton) {
    editButton.addEventListener('click', () => {
      openInitiativeAdminEditModal(initiative);
    });
  }
  const importButton = elements.stepView.querySelector('#importInitiativeBtn');
  if (importButton) {
    importButton.addEventListener('click', () => {
      openExternalItemImportModal('initiative', initiative.id);
    });
  }
  const list = elements.stepView.querySelector('#initiativeSection');
  bindInitiativeCardInteractions(list);
}

function renderInitiativesView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite institucija', 'Select an institution')}</strong>
      </div>
    `;
    return;
  }

  if (state.loading) {
    elements.stepView.innerHTML = `<div class="card"><strong>${langText('Kraunami duomenys...', 'Loading data...')}</strong></div>`;
    return;
  }

  if (state.error) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Nepavyko ikelti duomenu', 'Failed to load data')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.error)}</p>
        <button id="retryLoadBtn" class="btn btn-primary" style="margin-top: 12px;">${langText('Bandyti dar karta', 'Try again')}</button>
      </div>
    `;
    const retryBtn = elements.stepView.querySelector('#retryLoadBtn');
    if (retryBtn) retryBtn.addEventListener('click', bootstrap);
    return;
  }

  const member = isLoggedIn();
  const authenticated = isAuthenticated();
  const writable = member && cycleIsWritable();
  const budget = voteBudget();
  const used = member ? usedVotesTotal() : 0;
  const remaining = Math.max(0, budget - used);
  const initiatives = Array.isArray(state.initiatives) ? state.initiatives : [];
  const eligibleGuidelines = state.guidelines.filter((guideline) => {
    const status = String(guideline.status || 'active').toLowerCase();
    return status === 'active';
  });
  const guidelineInitiativeMatrix = renderGuidelineInitiativeMatrix(eligibleGuidelines, initiatives);

  const stats = [
    `${langText('Busena', 'Status')}: ${String(state.cycle?.state || '-').toUpperCase()}`,
    `${langText('Iniciatyvos', 'Initiatives')}: ${Number(state.summary?.initiatives_count || initiatives.length || 0)}`,
    `${langText('Dalyviai', 'Participants')}: ${Number(state.summary?.participant_count || 0)}`
  ];
  if (state.commentsVisible) {
    stats.splice(2, 0, `${langText('Komentarai', 'Comments')}: ${Number(state.summary?.initiative_comments_count || 0)}`);
  }

  elements.stepView.innerHTML = `
    <div class="step-header">
      <div class="header-stack step-header-actions">
        <button id="exportBtnInline" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>${langText('Eksportuoti santrauka', 'Export summary')}</button>
        <span class="tag">${langText('Institucija', 'Institution')}: ${escapeHtml(state.institution?.name || state.institutionSlug)}</span>
        <span class="tag">${langText('Strategija', 'Strategy')}: ${escapeHtml(state.strategy?.title || '-')}</span>
        ${member ? `<span class="tag">${langText('Tavo balsai', 'Your votes')}: ${remaining} / ${budget}</span>` : `<span class="tag">${langText('Viesas rezimas', 'Public mode')}</span>`}
        ${stats.map((line) => `<span class="tag">${escapeHtml(line)}</span>`).join('')}
      </div>
    </div>

    ${state.notice ? `<div class="card" style="margin-bottom: 16px;"><strong>${escapeHtml(state.notice)}</strong></div>` : ''}

    <section id="initiativeSection" class="guideline-group">
      ${initiatives.length
        ? `<div class="card-list initiative-list">
            ${initiatives.map((initiative) => renderInitiativeCard(initiative, {
              member,
              writable,
              authenticated,
              commentsVisible: state.commentsVisible
            })).join('')}
          </div>`
        : `<div class="card guideline-empty">
            <strong>${langText('Iniciatyvu dar nera', 'No initiatives yet')}</strong>
            <p class="prompt" style="margin: 6px 0 0;">${langText('Sioje institucijoje kol kas nera sukurtu iniciatyvu.', 'No initiatives have been created for this institution yet.')}</p>
          </div>`
      }
    </section>

    <section id="initiativeAddSection" class="step-add-anchor">
    ${member ? (writable ? `
      <div class="card initiative-add-card" style="margin-top: 16px;">
        <div class="header-row">
          <strong>${langText('Nauja iniciatyva', 'New initiative')}</strong>
          <span class="tag">${langText('Pasiulymas', 'Suggestion')}</span>
        </div>
        <div class="initiative-add-layout">
          <div class="initiative-add-form-pane">
            <p class="prompt" style="margin-bottom: 10px;">${langText('Iniciatyva turi buti priskirta bent vienai gairei.', 'An initiative must be linked to at least one guideline.')}</p>
            <form id="initiativeAddForm">
              <div class="form-row">
                <input type="text" name="title" placeholder="${escapeHtml(langText('Iniciatyvos pavadinimas', 'Initiative title'))}" required ${state.busy ? 'disabled' : ''}/>
              </div>
              <textarea name="desc" placeholder="${escapeHtml(langText('Trumpas paaiskinimas', 'Short description'))}" ${state.busy ? 'disabled' : ''}></textarea>
              <label class="prompt" style="display:block;margin:10px 0 6px;">${langText('Priskirtos gaires', 'Linked guidelines')}</label>
              <div class="guideline-checkbox-panel">
                ${renderGuidelineCheckboxList(eligibleGuidelines, { name: 'guidelineIds', disabled: state.busy })}
              </div>
              <p class="prompt guideline-checkbox-hint" style="margin: 8px 0 0;">${langText('Pazymekite viena ar kelias gaires.', 'Select one or more guidelines.')}</p>
              <button class="btn btn-primary" type="submit" style="margin-top: 12px;" ${state.busy ? 'disabled' : ''}>${langText('Prideti iniciatyva', 'Add initiative')}</button>
            </form>
          </div>
          <aside class="initiative-add-matrix-pane">
            ${guidelineInitiativeMatrix}
          </aside>
        </div>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>${langText('Ciklas uzrakintas redagavimui', 'Cycle is locked for editing')}</strong>
      </div>
    `) : (authenticated ? `
      <div class="card" style="margin-top: 16px;">
        <strong>${langText('Prisijungta prie kitos institucijos','Signed in to another institution')}</strong>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>${langText('Prisijunkite, kad galetumete aktyviai dalyvauti', 'Sign in to participate actively')}</strong>
        <button id="openAuthFromStep" class="btn btn-primary" style="margin-top: 12px;">${langText('Prisijungti', 'Sign in')}</button>
      </div>
    `)}
    </section>
  `;

  const openAuthFromStep = elements.stepView.querySelector('#openAuthFromStep');
  const exportBtnInline = elements.stepView.querySelector('#exportBtnInline');
  const initiativeForm = elements.stepView.querySelector('#initiativeAddForm');
  const list = elements.stepView.querySelector('#initiativeSection');

  if (openAuthFromStep) {
    openAuthFromStep.addEventListener('click', () => showAuthModal('login'));
  }
  if (exportBtnInline) {
    exportBtnInline.addEventListener('click', exportSummary);
  }
  if (initiativeForm) {
    initiativeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(initiativeForm);
      const title = String(fd.get('title') || '').trim();
      const description = String(fd.get('desc') || '').trim();
      const guidelineIds = Array.from(initiativeForm.querySelectorAll('input[name="guidelineIds"]:checked'))
        .map((input) => String(input.value || '').trim())
        .filter(Boolean);
      if (!title) return;

      await runBusy(async () => {
        await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/initiatives`, {
          method: 'POST',
          body: { title, description, guidelineIds, lineSide: 'auto' }
        });
        await Promise.all([refreshInitiatives(), refreshSummary(), loadStrategyMap(), refreshHistory()]);
      });
    });
  }
  bindInitiativeCardInteractions(list);
}

function renderImplementationPlanView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite institucija', 'Select an institution')}</strong>
      </div>
    `;
    return;
  }

  if (state.loading) {
    elements.stepView.innerHTML = `<div class="card"><strong>${langText('Kraunami duomenys...', 'Loading data...')}</strong></div>`;
    return;
  }

  if (state.error) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Nepavyko ikelti duomenu', 'Failed to load data')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.error)}</p>
        <button id="retryLoadBtn" class="btn btn-primary" style="margin-top: 12px;">${langText('Bandyti dar karta', 'Try again')}</button>
      </div>
    `;
    const retryBtn = elements.stepView.querySelector('#retryLoadBtn');
    if (retryBtn) retryBtn.addEventListener('click', bootstrap);
    return;
  }

  const editable = canManageSelectedInstitution();
  const activeLayer = state.implementationPlanLayer === 'initiatives' ? 'initiatives' : 'guidelines';
  const activeSubview = state.implementationPlanSubview === 'calendar' ? 'calendar' : 'table';
  const guidelineRows = buildImplementationPlanGuidelineRows(state.guidelines);
  const initiativeRows = buildImplementationPlanInitiativeRows(state.initiatives);
  const rows = activeLayer === 'initiatives' ? initiativeRows : guidelineRows;
  const calendarData = buildImplementationPlanCalendarEntries({ guidelineRows, initiativeRows });
  const title = langText('Įgyvendinimo planas', 'Implementation plan');
  const emptyLabel = activeLayer === 'initiatives'
    ? langText('Iniciatyvų įgyvendinimo planas dar neužpildytas.', 'No initiative implementation entries yet.')
    : langText('Gairių įgyvendinimo planas dar neužpildytas.', 'No guideline implementation entries yet.');
  const pageCalendarButtonMarkup = calendarData.entries.length
    ? `<button
        type="button"
        class="btn ${activeSubview === 'calendar' ? 'btn-primary' : 'btn-ghost'} implementation-plan-calendar-btn"
        data-implementation-nav="calendar"
        aria-current="${activeSubview === 'calendar' ? 'page' : 'false'}"
      >${escapeHtml(langText('Kalendorius', 'Calendar'))}</button>`
    : '';
  const pageSaveButtonMarkup = editable
    ? `<button class="btn btn-primary implementation-plan-save-header-btn" type="submit" form="implementationPlanForm" ${(state.busy || activeSubview !== 'table') ? 'disabled' : ''}>${escapeHtml(langText('Išsaugoti planą', 'Save plan'))}</button>`
    : '';
  const pageActionButtonsMarkup = [pageCalendarButtonMarkup, pageSaveButtonMarkup].filter(Boolean).join('');

  elements.stepView.innerHTML = `
    <section class="implementation-plan-shell">
      <div class="step-header implementation-plan-header">
        <div>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <div class="header-stack implementation-plan-header-actions">
          <div class="map-layer-toggle implementation-plan-layer-toggle">
            <button
              type="button"
              class="btn ${activeSubview === 'table' && activeLayer === 'guidelines' ? 'btn-primary' : 'btn-ghost'}"
              data-implementation-nav="guidelines"
              aria-current="${activeSubview === 'table' && activeLayer === 'guidelines' ? 'page' : 'false'}"
            >${escapeHtml(langText('Gairės', 'Guidelines'))}</button>
            <button
              type="button"
              class="btn ${activeSubview === 'table' && activeLayer === 'initiatives' ? 'btn-primary' : 'btn-ghost'}"
              data-implementation-nav="initiatives"
              aria-current="${activeSubview === 'table' && activeLayer === 'initiatives' ? 'page' : 'false'}"
            >${escapeHtml(langText('Iniciatyvos', 'Initiatives'))}</button>
            ${pageCalendarButtonMarkup}
          </div>
          ${pageSaveButtonMarkup}
        </div>
      </div>

      ${state.notice ? `<div class="card implementation-plan-notice"><strong>${escapeHtml(state.notice)}</strong></div>` : ''}

      ${activeSubview === 'calendar'
        ? renderImplementationPlanCalendarMarkup(calendarData)
        : `
          <form id="implementationPlanForm" class="card implementation-plan-board">
            <div class="implementation-plan-table-head">
              <div>${escapeHtml(activeLayer === 'initiatives' ? langText('Iniciatyva', 'Initiative') : langText('Gairė', 'Guideline'))}</div>
              <div>${escapeHtml(langText('Įgyvendinimo data', 'Implementation date'))}</div>
              <div>${escapeHtml(langText('Atsakingas asmuo / padalinys', 'Responsible person / unit'))}</div>
              <div></div>
            </div>
            ${rows.length
              ? rows.map((row) => renderImplementationPlanRow(row, { editable })).join('')
              : `<div class="implementation-plan-empty"><strong>${escapeHtml(emptyLabel)}</strong></div>`}
            ${editable && rows.length ? `<div class="implementation-plan-footer">${pageActionButtonsMarkup}</div>` : ''}
          </form>
        `}
    </section>
  `;

  elements.stepView.querySelectorAll('[data-action="open-implementation-item"]').forEach((button) => {
    button.addEventListener('click', () => {
      const itemKind = String(button.dataset.kind || '').trim().toLowerCase();
      const itemId = String(button.dataset.id || '').trim();
      if (!itemId) return;
      if (itemKind === 'initiative') {
        openInitiativeDetail(itemId);
        return;
      }
      openGuidelineDetail(itemId);
    });
  });

  elements.stepView.querySelectorAll('[data-implementation-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = String(button.dataset.implementationNav || '').trim().toLowerCase();
      if (target === 'calendar') {
        if (state.implementationPlanSubview === 'calendar') return;
        state.implementationPlanSubview = 'calendar';
        syncRouteState();
        render();
        return;
      }
      if (target !== 'guidelines' && target !== 'initiatives') return;
      if (state.implementationPlanSubview === 'table' && state.implementationPlanLayer === target) return;
      state.implementationPlanLayer = target;
      state.implementationPlanSubview = 'table';
      syncRouteState();
      render();
    });
  });

  elements.stepView.querySelectorAll('[data-action="open-implementation-calendar-item"]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = String(button.dataset.kind || '').trim().toLowerCase();
      const id = String(button.dataset.id || '').trim();
      if (!id) return;
      if (kind === 'initiative') {
        openInitiativeDetail(id);
        return;
      }
      openGuidelineDetail(id);
    });
  });

  if (activeSubview === 'calendar') {
    scheduleImplementationPlanCalendarConnectorRender();
  }

  if (!editable || activeSubview !== 'table') return;

  const implementationPlanForm = elements.stepView.querySelector('#implementationPlanForm');
  implementationPlanForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const editableRows = Array.from(implementationPlanForm.querySelectorAll('.implementation-plan-row[data-plan-kind][data-plan-id]'));
    if (!editableRows.length) return;

    await runBusy(async () => {
      for (const row of editableRows) {
        if (!(row instanceof HTMLElement)) continue;
        const planKind = String(row.dataset.planKind || '').trim().toLowerCase();
        const planId = String(row.dataset.planId || '').trim();
        if (!planId || (planKind !== 'guideline' && planKind !== 'initiative')) continue;

        const implementationDate = normalizeImplementationDateInputValue(row.querySelector('[name="implementationDate"]')?.value);
        const implementationOwner = String(row.querySelector('[name="implementationOwner"]')?.value || '').trim();

        if (planKind === 'guideline') {
          const guideline = findGuidelineById(planId);
          if (!guideline) continue;
          await api(`/api/v1/admin/guidelines/${encodeURIComponent(planId)}`, {
            method: 'PUT',
            body: {
              title: guideline.title,
              description: guideline.description || '',
              status: guideline.status || 'active',
              relationType: guideline.relationType || 'orphan',
              parentGuidelineId: guideline.parentGuidelineId || '',
              lineSide: guideline.lineSide || 'auto',
              implementationDate,
              implementationOwner
            }
          });
          continue;
        }

        const initiative = findInitiativeById(planId);
        if (!initiative) continue;
        await api(`/api/v1/admin/initiatives/${encodeURIComponent(planId)}`, {
          method: 'PUT',
          body: {
            title: initiative.title,
            description: initiative.description || '',
            status: initiative.status || 'active',
            lineSide: initiative.lineSide || 'auto',
            guidelineIds: resolveInitiativeGuidelineIds(initiative),
            implementationDate,
            implementationOwner
          }
        });
      }

      if (activeLayer === 'guidelines') {
        await refreshGuidelines();
      } else {
        await refreshInitiatives();
      }
      state.notice = langText('Įgyvendinimo planas atnaujintas.', 'Implementation plan updated.');
      notifySuccess(state.notice);
    });
  });
}

function historyKindLabel(kind) {
  const normalized = String(kind || '').trim().toLowerCase();
  if (normalized === 'strategy') return langText('Strategija', 'Strategy');
  if (normalized === 'guideline') return langText('Gaire', 'Guideline');
  if (normalized === 'initiative') return langText('Iniciatyva', 'Initiative');
  return normalized || '-';
}

function historyEventLabel(action) {
  const key = String(action || '').trim().toLowerCase();
  if (key === 'strategy_created') return langText('Strategija sukurta', 'Strategy created');
  if (key === 'proposal_submitted') return langText('Pasiulymas pateiktas', 'Proposal submitted');
  if (key === 'proposal_approved') return langText('Pasiulymas patvirtintas', 'Proposal approved');
  if (key === 'proposal_approved_with_changes') return langText('Pasiulymas patvirtintas su pakeitimais', 'Proposal approved with changes');
  if (key === 'proposal_rejected') return langText('Pasiulymas atmestas', 'Proposal rejected');
  if (key === 'proposal_cancelled') return langText('Irasas pasalintas administratoriaus', 'Entry deleted by admin');
  if (key === 'guideline_commented') return langText('Gaire pakomentuota', 'Guideline commented');
  if (key === 'initiative_commented') return langText('Iniciatyva pakomentuota', 'Initiative commented');
  if (key === 'proposal_commented') return langText('Pasiulymas pakomentuotas', 'Proposal commented');
  return key || '-';
}

function historyActionPriority(action) {
  const key = String(action || '').trim().toLowerCase();
  if (key === 'strategy_created') return -100;
  if (key === 'proposal_submitted') return -10;
  if (key.endsWith('_commented')) return 0;
  return 10;
}

function normalizeHistoryRowsForTable(rows) {
  const source = Array.isArray(rows) ? rows : [];
  return source
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const occurredAt = String(row.occurredAt || row.occurred_at || '').trim();
      if (!occurredAt) return null;
      return {
        id: String(row.id || '').trim() || occurredAt,
        occurredAt,
        action: String(row.action || '').trim().toLowerCase(),
        entityKind: String(row.entityKind || row.entity_kind || '').trim().toLowerCase(),
        entityId: String(row.entityId || row.entity_id || '').trim(),
        proposalId: String(row.proposalId || row.proposal_id || '').trim(),
        title: String(row.title || '-').trim() || '-',
        actorName: String(row.actorName || row.actor_name || '-').trim() || '-',
        details: String(row.details || '').trim()
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftTs = Date.parse(String(left?.occurredAt || '')) || 0;
      const rightTs = Date.parse(String(right?.occurredAt || '')) || 0;
      if (leftTs !== rightTs) return leftTs - rightTs;
      const byAction = historyActionPriority(left?.action) - historyActionPriority(right?.action);
      if (byAction !== 0) return byAction;
      return String(left?.id || '').localeCompare(String(right?.id || ''));
    });
}

function buildLegacyHistoryTableRows(entries) {
  const source = Array.isArray(entries) ? entries : [];
  const rows = [];

  source.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const proposalId = String(item.id || '').trim();
    const entityKind = String(item.entityKind || '').trim().toLowerCase();
    const title = String(item.finalTitle || item.title || proposalId || '-').trim() || '-';

    if (item.requestedAt) {
      rows.push({
        id: `${proposalId}:proposal_submitted`,
        occurredAt: item.requestedAt,
        action: 'proposal_submitted',
        entityKind,
        entityId: String(item.entityId || item.finalEntityId || '').trim(),
        proposalId,
        title: String(item.title || title).trim() || title,
        actorName: String(item.requestedByName || item.requestedBy || '-').trim() || '-',
        details: String(item.description || '').trim()
      });
    }

    if (item.reviewedAt) {
      const status = String(item.status || '').trim().toLowerCase();
      let action = '';
      if (status === 'rejected') action = 'proposal_rejected';
      else if (status === 'cancelled') action = 'proposal_cancelled';
      else if (status === 'approved') {
        action = String(item.reviewDecision || '').trim().toLowerCase() === 'approved_with_changes'
          ? 'proposal_approved_with_changes'
          : 'proposal_approved';
      }

      if (action) {
        rows.push({
          id: `${proposalId}:${action}`,
          occurredAt: item.reviewedAt,
          action,
          entityKind,
          entityId: String(item.finalEntityId || item.entityId || '').trim(),
          proposalId,
          title,
          actorName: String(item.reviewedByName || item.reviewedBy || '-').trim() || '-',
          details: String(item.reviewNote || item.finalDescription || '').trim()
        });
      }
    }
  });

  return normalizeHistoryRowsForTable(rows);
}

function historyRowNavigationTarget(row) {
  const item = row && typeof row === 'object' ? row : null;
  if (!item) return null;
  const kind = String(item.entityKind || '').trim().toLowerCase();
  if (kind !== 'guideline' && kind !== 'initiative') return null;

  const action = String(item.action || '').trim().toLowerCase();
  const entityId = String(item.entityId || '').trim();
  const proposalId = String(item.proposalId || '').trim();
  const fallbackAllowed = action === 'proposal_approved' || action === 'proposal_approved_with_changes';
  const targetId = entityId || (fallbackAllowed ? proposalId : '');
  if (!targetId) return null;

  return {
    kind,
    targetId,
    href: kind === 'initiative'
      ? buildInitiativeHref(targetId)
      : buildGuidelineHref(targetId)
  };
}

function renderHistoryTableRow(row, index) {
  const item = row && typeof row === 'object' ? row : null;
  if (!item) return '';
  const actionClass = String(item.action || 'unknown').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const kindClass = String(item.entityKind || 'unknown').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const navigationTarget = historyRowNavigationTarget(item);
  const linkLabel = langText('Atidaryti', 'Open');
  const linkCell = navigationTarget
    ? `<a
          class="history-entity-link"
          href="${escapeHtml(navigationTarget.href)}"
          data-action="open-history-entity"
          data-kind="${escapeHtml(navigationTarget.kind)}"
          data-entity-id="${escapeHtml(navigationTarget.targetId)}"
        >${escapeHtml(linkLabel)}</a>`
    : `<span class="history-entity-link is-disabled">-</span>`;

  return `
    <tr class="history-table-row history-action-${escapeHtml(actionClass)} history-kind-${escapeHtml(kindClass)}">
      <td>${index + 1}</td>
      <td>${escapeHtml(formatCommentDateTime(item.occurredAt))}</td>
      <td>${escapeHtml(historyEventLabel(item.action))}</td>
      <td>${escapeHtml(historyKindLabel(item.entityKind))}</td>
      <td>${escapeHtml(item.title || '-')}</td>
      <td>${linkCell}</td>
      <td>${escapeHtml(item.actorName || '-')}</td>
      <td>${escapeHtml(item.details || '-')}</td>
    </tr>
  `;
}

function renderHistoryView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite institucija', 'Select an institution')}</strong>
      </div>
    `;
    return;
  }

  if (!isLoggedIn()) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Prisijunkite', 'Sign in required')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${langText('Istorija rodoma tik prisijungusiems institucijos nariams.', 'History is available to signed-in institution members only.')}</p>
        <button id="openAuthFromHistory" class="btn btn-primary" style="margin-top: 12px;">${langText('Prisijungti', 'Sign in')}</button>
      </div>
    `;
    const authBtn = elements.stepView.querySelector('#openAuthFromHistory');
    if (authBtn) authBtn.addEventListener('click', () => showAuthModal('login'));
    return;
  }

  const apiRows = normalizeHistoryRowsForTable(state.historyRows);
  const fallbackRows = buildLegacyHistoryTableRows(state.historyEntries);
  const chronologicalRows = apiRows.length ? apiRows : fallbackRows;
  const sortOrder = state.historySortOrder === 'desc' ? 'desc' : 'asc';
  const rows = sortOrder === 'desc' ? [...chronologicalRows].reverse() : chronologicalRows;
  const sortLabel = sortOrder === 'desc'
    ? langText('Laikas: nuo naujausio', 'Timestamp: newest first')
    : langText('Laikas: nuo seniausio', 'Timestamp: oldest first');

  elements.stepView.innerHTML = `
    <div class="step-header">
      <div class="header-stack step-header-actions">
        <span class="tag">${langText('Institucija', 'Institution')}: ${escapeHtml(state.institution?.name || state.institutionSlug)}</span>
        <span class="tag">${langText('Strategija', 'Strategy')}: ${escapeHtml(state.strategy?.title || '-')}</span>
        <span class="tag">${langText('Irasu', 'Rows')}: ${rows.length}</span>
      </div>
    </div>
    ${state.historyError ? `<div class="card" style="margin-bottom: 12px;"><strong>${escapeHtml(state.historyError)}</strong></div>` : ''}
    ${state.historyLoading ? `<div class="card" style="margin-bottom: 12px;"><strong>${escapeHtml(langText('Kraunama istorija...', 'Loading history...'))}</strong></div>` : ''}

    <section class="guideline-group">
      <div class="guideline-group-header">
        <button id="historySortToggleBtn" type="button" class="history-sort-btn">${escapeHtml(sortLabel)}</button>
        <span class="tag">${rows.length}</span>
      </div>
      ${rows.length
    ? `
          <div class="history-table-wrap">
            <table class="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${escapeHtml(langText('Laikas', 'Timestamp'))}</th>
                  <th>${escapeHtml(langText('Ivykis', 'Event'))}</th>
                  <th>${escapeHtml(langText('Tipas', 'Type'))}</th>
                  <th>${escapeHtml(langText('Objektas', 'Item'))}</th>
                  <th>${escapeHtml(langText('Nuoroda', 'Link'))}</th>
                  <th>${escapeHtml(langText('Vartotojas', 'User'))}</th>
                  <th>${escapeHtml(langText('Detales', 'Details'))}</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((row, index) => renderHistoryTableRow(row, index)).join('')}
              </tbody>
            </table>
          </div>
        `
    : `<div class="card guideline-empty"><strong>${langText('Ivykiu dar nera', 'No activity yet')}</strong></div>`}
    </section>
  `;

  const sortBtn = elements.stepView.querySelector('#historySortToggleBtn');
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      state.historySortOrder = state.historySortOrder === 'desc' ? 'asc' : 'desc';
      renderHistoryView();
    });
  }
  elements.stepView.querySelectorAll('[data-action="open-history-entity"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const kind = String(link.dataset.kind || '').trim().toLowerCase();
      const entityId = String(link.dataset.entityId || '').trim();
      if (!entityId) return;
      if (kind === 'initiative') {
        openInitiativeDetail(entityId);
        return;
      }
      openGuidelineDetail(entityId);
    });
  });
  const authBtn = elements.stepView.querySelector('#openAuthFromHistory');
  if (authBtn) authBtn.addEventListener('click', () => showAuthModal('login'));
}

function renderStrategySelectionRequiredView() {
  const institutionName = String(state.institution?.name || state.institutionSlug || '-').trim() || '-';
  const strategies = strategiesForSelectedInstitution();
  const rememberedSlug = rememberedStrategySlugForInstitution(state.institutionSlug);
  const heading = langText('Pasirinkite strategija', 'Select a strategy');
  const helper = langText(
    'Pasirinkite, kuria strategija norite perziureti. Be strategijos pasirinkimo turinys nerodomas.',
    'Choose which strategy you want to view. Content stays hidden until a strategy is selected.'
  );
  const lastUsedLabel = langText('Paskutinis pasirinktas', 'Last used');
  const noStrategiesTitle = langText('Strategiju kol kas nera', 'No strategies yet');
  const noStrategiesHint = langText(
    'Siai institucijai dar nera sukurtu strategiju. Paprasykite administratoriaus sukurti bent viena strategija.',
    'No strategies are available for this institution yet. Ask an administrator to create at least one strategy.'
  );

  elements.stepView.innerHTML = `
    <section class="institution-picker">
      <div class="institution-picker-card strategy-pick-card">
        <h3>${escapeHtml(heading)}</h3>
        <p class="prompt">${escapeHtml(helper)}</p>
        <div class="header-stack" style="margin-bottom: 12px;">
          <span class="tag">${langText('Institucija', 'Institution')}: ${escapeHtml(institutionName)}</span>
        </div>
        ${strategies.length
    ? `
            <div class="institution-grid strategy-pick-grid">
              ${strategies.map((strategy) => {
      const slug = normalizeSlug(strategy.slug);
      const isRemembered = rememberedSlug && rememberedSlug === slug;
      return `
                  <button type="button" class="institution-card strategy-pick-option" data-action="pick-strategy" data-strategy-slug="${escapeHtml(slug)}">
                    <div class="institution-card-header">
                      <strong>${escapeHtml(String(strategy.title || slug || '-').trim() || '-')}</strong>
                      ${isRemembered ? `<span class="tag">${escapeHtml(lastUsedLabel)}</span>` : ''}
                    </div>
                    ${strategy.description ? `<p class="prompt" style="margin: 0;">${escapeHtml(String(strategy.description || '').trim())}</p>` : ''}
                  </button>
                `;
    }).join('')}
            </div>
          `
    : `
            <div class="card">
              <strong>${escapeHtml(noStrategiesTitle)}</strong>
              <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(noStrategiesHint)}</p>
            </div>
          `}
      </div>
    </section>
  `;

  elements.stepView.querySelectorAll('[data-action="pick-strategy"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const slug = normalizeSlug(button.dataset.strategySlug);
      if (!slug) return;
      state.strategySlug = slug;
      state.strategy = strategies.find((item) => normalizeSlug(item.slug) === slug) || null;
      rememberStrategySlugForInstitution(state.institutionSlug, slug);
      state.strategySwitcherDialogOpen = false;
      syncRouteState();

      if (isAuthenticated() && !state.embedMapMode && state.institutionSlug) {
        try {
          await switchInstitutionSession(state.institutionSlug, slug);
        } catch (error) {
          const raw = String(error?.message || '').toLowerCase();
          if (raw === 'invalid token' || raw === 'unauthorized') {
            clearSession();
          }
        }
      }

      await bootstrap();
    });
  });
}

function renderStepView() {
  if (state.embedMapMode && state.activeView !== 'map') {
    clearRouteEntityForView('map');
    state.activeView = 'map';
  }
  if (state.activeView !== 'map' && document.fullscreenElement === elements.stepView) {
    document.exitFullscreen().catch(() => {});
  }

  if (state.activeView === 'guide') {
    renderGuideView();
    return;
  }

  if (
    !state.embedMapMode
    && normalizeSlug(state.institutionSlug)
    && !normalizeSlug(state.strategySlug)
    && !state.loading
    && !state.error
  ) {
    renderStrategySelectionRequiredView();
    return;
  }

  if (state.activeView === 'guideline-detail') {
    renderGuidelineDetailView();
    return;
  }

  if (state.activeView === 'initiative-detail') {
    renderInitiativeDetailView();
    return;
  }

  if (state.activeView === 'initiatives') {
    renderInitiativesView();
    return;
  }

  if (state.activeView === 'implementation-plan') {
    renderImplementationPlanView();
    return;
  }

  if (state.activeView === 'policy-alignment') {
    renderPolicyAlignmentView();
    return;
  }

  if (state.activeView === 'history') {
    renderHistoryView();
    return;
  }

  if (state.activeView === 'admin') {
    renderAdminView();
    return;
  }

  if (state.activeView === 'map') {
    renderMapView();
    return;
  }

  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite institucija', 'Select an institution')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">
          ${langText('Kairiajame meniu pasirinkite institucija is isskleidziamo saraso, kad atvertumete jos viesa gairiu puslapi.', 'Use the left menu institution selector to open its public guideline page.')}
        </p>
      </div>
    `;
    return;
  }

  if (state.loading) {
    elements.stepView.innerHTML = `<div class="card"><strong>${langText('Kraunami duomenys...', 'Loading data...')}</strong></div>`;
    return;
  }

  if (state.error) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Nepavyko ikelti duomenu', 'Failed to load data')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.error)}</p>
        <button id="retryLoadBtn" class="btn btn-primary" style="margin-top: 12px;">${langText('Bandyti dar karta', 'Try again')}</button>
      </div>
    `;
    const retryBtn = elements.stepView.querySelector('#retryLoadBtn');
    if (retryBtn) retryBtn.addEventListener('click', bootstrap);
    return;
  }

  const member = isLoggedIn();
  const authenticated = isAuthenticated();
  const writable = member && cycleIsWritable();
  const budget = voteBudget();
  const used = member ? usedVotesTotal() : 0;
  const remaining = Math.max(0, budget - used);

  const stats = [
    `${langText('Busena', 'Status')}: ${String(state.cycle?.state || '-').toUpperCase()}`,
    `${langText('GairÄ—s', 'Guidelines')}: ${Number(state.summary?.guidelines_count || state.guidelines.length || 0)}`,
    `${langText('Dalyviai', 'Participants')}: ${Number(state.summary?.participant_count || 0)}`
  ];
  if (state.commentsVisible) {
    stats.splice(2, 0, `${langText('Komentarai', 'Comments')}: ${Number(state.summary?.comments_count || 0)}`);
  }
  const relationGroups = buildGuidelineRelationshipGroups(state.guidelines);
  const activeParentGuidelines = (state.guidelines || []).filter((guideline) => {
    const status = String(guideline?.status || '').trim().toLowerCase();
    return status === 'active' && normalizeGuidelineRelation(guideline?.relationType) === 'parent';
  });
  const parentGuidelineOptions = activeParentGuidelines
    .map((guideline) => `<option value="${escapeHtml(guideline.id)}">${escapeHtml(guideline.title || guideline.id)}</option>`)
    .join('');

  elements.stepView.innerHTML = `
    <div class="step-header">
      <div class="header-stack step-header-actions">
        <button id="exportBtnInline" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>${langText('Eksportuoti santrauka', 'Export summary')}</button>
        <span class="tag">${langText('Institucija', 'Institution')}: ${escapeHtml(state.institution?.name || state.institutionSlug)}</span>
        <span class="tag">${langText('Strategija', 'Strategy')}: ${escapeHtml(state.strategy?.title || '-')}</span>
        ${member ? `<span class="tag">${langText('Tavo balsai', 'Your votes')}: ${remaining} / ${budget}</span>` : `<span class="tag">${langText('Viesas rezimas', 'Public mode')}</span>`}
        ${stats.map((line) => `<span class="tag">${escapeHtml(line)}</span>`).join('')}
      </div>
    </div>

    ${state.notice ? `<div class="card" style="margin-bottom: 16px;"><strong>${escapeHtml(state.notice)}</strong></div>` : ''}

    <div id="guidelineGroups" class="guideline-groups">
      <section class="guideline-group">
        ${relationGroups.parentGroups.length
          ? relationGroups.parentGroups.map((group) => `
              <div class="relationship-cluster">
                <div class="relationship-cluster-cards">
                  <div class="relationship-parent-slot">
                    ${renderGuidelineCard(group.parent, {
                      member,
                      writable,
                      authenticated,
                      commentsVisible: state.commentsVisible
                    })}
                  </div>
                  <div class="relationship-child-stack">
                    <div class="relationship-child-label">
                      <span class="tag">${langText('Vaikines gaires', 'Child guidelines')}: ${group.children.length}</span>
                    </div>
                    ${group.children.length
                      ? `<div class="card-list relationship-child-grid">
                          ${group.children.map((child) => renderGuidelineCard(child, {
                            member,
                            writable,
                            authenticated,
                            commentsVisible: state.commentsVisible
                          })).join('')}
                        </div>`
                      : `<div class="relationship-child-empty">
                          <p class="prompt">${langText('Vaikiniu gairiu dar nera.', 'No child guidelines yet.')}</p>
                          ${member && writable ? `<button type="button" class="btn btn-primary relationship-child-create-btn" data-action="create-child-guideline" data-parent-id="${escapeHtml(group.parent.id)}">${langText('Sukurti', 'Create')}</button>` : ''}
                        </div>`
                    }
                  </div>
                </div>
              </div>
            `).join('')
          : `<div class="card guideline-empty">
              <strong>${langText('Kol kas nera teviniu gairiu su rysiais','No parent guidelines with links yet')}</strong>
              <p class="prompt" style="margin: 6px 0 0;">${langText('Sukurus rysius, tevines ir vaikines gaires bus rodomos viename bloke.','Once links are created, parent and child guidelines will be displayed in one block.')}</p>
            </div>`
        }
      </section>

      ${relationGroups.unassignedChildren.length ? `
        <section class="guideline-group">
          <div class="guideline-group-header">
            <h3>${langText('Vaikines be tevines', 'Children without parent')}</h3>
            <span class="tag">${relationGroups.unassignedChildren.length}</span>
          </div>
          <p class="prompt">${langText('Sios vaikines gaires dar neturi teisingai priskirtos tevines gaires.', 'These child guidelines are missing a properly assigned parent guideline.')}</p>
          <div class="card-list">
            ${relationGroups.unassignedChildren.map((guideline) => renderGuidelineCard(guideline, {
              member,
              writable,
              authenticated,
              commentsVisible: state.commentsVisible
            })).join('')}
          </div>
        </section>
      ` : ''}

      <section class="guideline-group">
        <div class="guideline-group-header">
          <h3>${langText('Naslaitines gaires', 'Orphan guidelines')}</h3>
          <span class="tag">${relationGroups.orphanGuidelines.length}</span>
        </div>
        <p class="prompt">${langText('Savarankiskos gaires, kurios nera priskirtos tevinei gairei.', 'Standalone guidelines that are not assigned to a parent guideline.')}</p>
        ${relationGroups.orphanGuidelines.length
          ? `<div class="card-list">
              ${relationGroups.orphanGuidelines.map((guideline) => renderGuidelineCard(guideline, {
                member,
                writable,
                authenticated,
                commentsVisible: state.commentsVisible
              })).join('')}
            </div>`
          : `<div class="card guideline-empty">
              <strong>${langText('Naslaitiniu gairiu nera','No orphan guidelines')}</strong>
              <p class="prompt" style="margin: 6px 0 0;">${langText('Visos gaires jau susietos su tevinemis arba pazymetos kitaip.','All guidelines are already linked to parent guidelines or marked differently.')}</p>
            </div>`
        }
      </section>
    </div>
    <section id="guidelineAddSection" class="step-add-anchor">
    ${member ? (writable ? `
      <div class="card guideline-add-card" style="margin-top: 16px;">
        <div class="header-row">
          <div class="guideline-add-title">
            <span class="guideline-add-plus" aria-hidden="true">+</span>
            <strong>${langText('Nauja gaire', 'New guideline')}</strong>
          </div>
          <span class="tag tag-success">${langText('Siulymas', 'Suggestion')}</span>
        </div>
        <p class="prompt" style="margin-bottom: 10px;">${langText('Siulykite papildomas gaires, kurios turetu buti itrauktos.', 'Suggest additional guidelines that should be included.')}</p>
        <form id="guidelineAddForm" class="guideline-add-form">
          <div class="form-row">
            <input type="text" name="title" placeholder="${escapeHtml(langText('Gaires pavadinimas', 'Guideline title'))}" required ${state.busy ? 'disabled' : ''}/>
          </div>
          <div class="form-row">
            <select name="relationType" id="guidelineRelationType" ${state.busy ? 'disabled' : ''}>
              <option value="orphan">${escapeHtml(langText('Naslaite gaire', 'Orphan guideline'))}</option>
              <option value="parent">${escapeHtml(langText('Tevine gaire', 'Parent guideline'))}</option>
              <option value="child">${escapeHtml(langText('Vaikine gaire', 'Child guideline'))}</option>
            </select>
          </div>
          <div class="form-row" id="guidelineParentRow" hidden>
            <select name="parentGuidelineId" id="guidelineParentGuidelineId" ${state.busy ? 'disabled' : ''}>
              <option value="">${escapeHtml(langText('Pasirinkite tevine gaire', 'Select parent guideline'))}</option>
              ${parentGuidelineOptions}
            </select>
          </div>
          ${activeParentGuidelines.length
    ? ''
    : `<p id="guidelineParentHint" class="prompt" hidden>${langText('Nera aktyviu teviniu gairiu. Pirmiausia sukurkite tevine gaire.', 'No active parent guidelines found. Create a parent guideline first.')}</p>`}
          <textarea name="desc" placeholder="${escapeHtml(langText('Trumpas paaiskinimas', 'Short description'))}" ${state.busy ? 'disabled' : ''}></textarea>
          <button class="btn guideline-add-submit-btn" type="submit" style="margin-top: 12px;" ${state.busy ? 'disabled' : ''}>+ ${langText('Prideti gaire', 'Add guideline')}</button>
        </form>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>${langText('Ciklas uzrakintas redagavimui', 'Cycle is locked for editing')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${langText('Balsuoti ir komentuoti galima tik kai ciklo busena yra Open.', 'Voting and commenting are available only when the cycle state is Open.')}</p>
      </div>
    `) : (authenticated ? `
      <div class="card" style="margin-top: 16px;">
        <strong>${langText('Prisijungta prie kitos institucijos','Signed in to another institution')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">
          ${langText('Sios institucijos strategija galite perziureti, bet teikti pasiulymu, komentuoti ir balsuoti negalite.','You can view this selected institution strategy, but you cannot submit suggestions, comment, or vote here.')}
        </p>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>${langText('Prisijunkite, kad galetumete aktyviai dalyvauti', 'Sign in to participate actively')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${langText('Viesai matomi visi komentarai prie strategijos gairiu. Prisijungus galima siulyti gaires, komentuoti ir balsuoti.', 'Public users can view the strategy cards. Sign in to suggest guidelines, comment, and vote.')}</p>
        <button id="openAuthFromStep" class="btn btn-primary" style="margin-top: 12px;">${langText('Prisijungti', 'Sign in')}</button>
      </div>
    `)}
    </section>
  `;

  bindStepEvents();
}

function bindStepEvents() {
  const openAuthFromStep = elements.stepView.querySelector('#openAuthFromStep');
  const exportBtnInline = elements.stepView.querySelector('#exportBtnInline');
  const guidelineForm = elements.stepView.querySelector('#guidelineAddForm');
  const guidelineRelationType = elements.stepView.querySelector('#guidelineRelationType');
  const guidelineParentRow = elements.stepView.querySelector('#guidelineParentRow');
  const guidelineParentSelect = elements.stepView.querySelector('#guidelineParentGuidelineId');
  const guidelineParentHint = elements.stepView.querySelector('#guidelineParentHint');
  const guidelineTitleInput = elements.stepView.querySelector('#guidelineAddForm input[name="title"]');
  const list = elements.stepView.querySelector('#guidelineGroups');

  if (openAuthFromStep) {
    openAuthFromStep.addEventListener('click', () => showAuthModal('login'));
  }

  if (exportBtnInline) {
    exportBtnInline.addEventListener('click', exportSummary);
  }

  const syncGuidelineParentField = () => {
    if (!(guidelineRelationType instanceof HTMLSelectElement)) return;
    const isChild = String(guidelineRelationType.value || '').trim().toLowerCase() === 'child';
    const hasParentOptions = guidelineParentSelect instanceof HTMLSelectElement
      ? guidelineParentSelect.options.length > 1
      : false;

    if (guidelineParentRow instanceof HTMLElement) {
      guidelineParentRow.hidden = !isChild;
    }
    if (guidelineParentHint instanceof HTMLElement) {
      guidelineParentHint.hidden = !isChild || hasParentOptions;
    }
    if (guidelineParentSelect instanceof HTMLSelectElement) {
      guidelineParentSelect.disabled = !isChild || !hasParentOptions;
      if (!isChild) guidelineParentSelect.value = '';
    }
  };

  if (guidelineRelationType instanceof HTMLSelectElement) {
    guidelineRelationType.addEventListener('change', syncGuidelineParentField);
    syncGuidelineParentField();
  }

  const openChildGuidelineCreate = (parentGuidelineId) => {
    const parentId = String(parentGuidelineId || '').trim();
    if (!parentId) return;
    if (guidelineRelationType instanceof HTMLSelectElement) {
      guidelineRelationType.value = 'child';
      syncGuidelineParentField();
    }
    if (guidelineParentSelect instanceof HTMLSelectElement) {
      guidelineParentSelect.value = parentId;
    }
    const addSection = document.getElementById('guidelineAddSection');
    addSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      if (guidelineTitleInput instanceof HTMLElement && typeof guidelineTitleInput.focus === 'function') {
        guidelineTitleInput.focus();
      }
    }, 180);
  };

  if (guidelineForm) {
    guidelineForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(guidelineForm);
      const title = String(fd.get('title') || '').trim();
      const description = String(fd.get('desc') || '').trim();
      const relationType = normalizeGuidelineRelation(fd.get('relationType'));
      const parentGuidelineId = String(fd.get('parentGuidelineId') || '').trim();
      if (!title) return;
      if (relationType === 'child' && !parentGuidelineId) {
        notifyError(langText('Pasirinkite tevine gaire vaikinei gairei.', 'Select a parent guideline for a child guideline.'));
        return;
      }

      await runBusy(async () => {
        await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/guidelines`, {
          method: 'POST',
          body: {
            title,
            description,
            relationType,
            parentGuidelineId: relationType === 'child' ? parentGuidelineId : null
          }
        });
        await Promise.all([refreshGuidelines(), refreshSummary(), loadStrategyMap(), refreshHistory()]);
      });
    });
  }

  if (list) {
    list.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const detailView = list.dataset.detailView === '1';
      const clickedInteractive = target.closest('button, input, textarea, select, a, label, form');
      if (!clickedInteractive && !detailView) {
        const card = target.closest('.guideline-card[data-guideline-id]');
        const guidelineIdFromCard = String(card?.dataset?.guidelineId || '').trim();
        if (guidelineIdFromCard) {
          openGuidelineDetail(guidelineIdFromCard);
          return;
        }
      }
      const actionElement = target.closest('[data-action]');
      if (!(actionElement instanceof HTMLElement)) return;
      const action = actionElement.dataset.action;
      if (!action) return;

      if (action === 'open-strategy-link') {
        await navigateToStrategyLink({
          targetInstitutionSlug: actionElement.dataset.targetInstitution,
          targetStrategySlug: actionElement.dataset.targetStrategy,
          targetGuidelineId: actionElement.dataset.targetGuideline
        });
        return;
      }

      if (action === 'create-child-guideline') {
        openChildGuidelineCreate(actionElement.dataset.parentId);
        return;
      }

      const guidelineId = String(actionElement.dataset.id || '').trim();
      if (!guidelineId) return;

      if (action === 'copy-guideline-link') {
        const url = String(actionElement.dataset.url || guidelineShareUrl(guidelineId)).trim();
        const copied = await copyTextToClipboard(url);
        state.notice = copied
          ? langText('Gaires nuoroda nukopijuota.', 'Guideline URL copied.')
          : langText('Nepavyko nukopijuoti nuorodos.', 'Failed to copy URL.');
        if (copied) notifySuccess(state.notice);
        else notifyError(state.notice);
        render();
        return;
      }

      if (action === 'vote-plus' || action === 'vote-minus') {
        const delta = action === 'vote-plus' ? 1 : -1;
        const origin = getElementCenter(actionElement);
        await runBusy(async () => {
          const changed = await changeVote(guidelineId, delta);
          if (changed) triggerVoteBurstAt(origin, delta);
        });
      }
    });

    list.addEventListener('submit', async (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.dataset.action !== 'comment') return;
      event.preventDefault();

      const guidelineId = form.dataset.id;
      const value = String(new FormData(form).get('comment') || '').trim();
      if (!guidelineId || !value) return;

      await runBusy(async () => {
        await api(`/api/v1/guidelines/${encodeURIComponent(guidelineId)}/comments`, {
          method: 'POST',
          body: { body: value }
        });
        await Promise.all([refreshGuidelines(), refreshSummary(), loadStrategyMap(), refreshHistory()]);
      });
    });
  }
}

async function changeVote(guidelineId, delta) {
  if (!isLoggedIn()) throw new Error('unauthorized');
  if (!cycleIsWritable()) throw new Error('cycle not writable');

  const current = Number(state.userVotes[guidelineId] || 0);
  const usedWithoutCurrent = usedVotesTotal() - current;
  const maxAllowed = clamp(
    Math.min(maxPerGuideline(), voteBudget() - usedWithoutCurrent),
    minPerGuideline(),
    maxPerGuideline()
  );
  const next = clamp(current + delta, minPerGuideline(), maxAllowed);
  if (next === current) return false;

  const response = await api(`/api/v1/guidelines/${encodeURIComponent(guidelineId)}/vote`, {
    method: 'PUT',
    body: { score: next }
  });
  state.userVotes[guidelineId] = Number(response.score || next);
  await Promise.all([refreshGuidelines(), refreshSummary(), loadStrategyMap()]);
  return true;
}

async function changeInitiativeVote(initiativeId, delta) {
  if (!isLoggedIn()) throw new Error('unauthorized');
  if (!cycleIsWritable()) throw new Error('cycle not writable');

  const current = Number(state.userVotes[initiativeId] || 0);
  const usedWithoutCurrent = usedVotesTotal() - current;
  const maxAllowed = clamp(
    Math.min(maxPerInitiative(), voteBudget() - usedWithoutCurrent),
    minPerInitiative(),
    maxPerInitiative()
  );
  const next = clamp(current + delta, minPerInitiative(), maxAllowed);
  if (next === current) return false;

  const response = await api(`/api/v1/initiatives/${encodeURIComponent(initiativeId)}/vote`, {
    method: 'PUT',
    body: { score: next }
  });
  state.userVotes[initiativeId] = Number(response.score || next);
  await Promise.all([refreshInitiatives(), refreshSummary(), loadStrategyMap()]);
  return true;
}

function renderUserBar() {
  const container = document.getElementById('userBar');
  if (!container) return;
  if (state.embedMapMode) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }
  container.hidden = false;

  if (!isAuthenticated()) {
    container.innerHTML = `
      <div class="user-toolbar user-toolbar-main">
        ${strategySwitcherCardMarkup({ topbar: true })}
        <button id="openRegisterBtn" class="btn btn-ghost">${langText('Registruotis', 'Register')}</button>
        <button id="openAuthBtn" class="btn btn-primary">${langText('Prisijungti', 'Sign in')}</button>
      </div>
    `;
    bindStrategySwitcherDialog(container);
    bindInstitutionSwitch(container);
    bindStrategySwitch(container);
    const registerBtn = container.querySelector('#openRegisterBtn');
    if (registerBtn) registerBtn.addEventListener('click', () => showAccessRequestModal());
    const openBtn = container.querySelector('#openAuthBtn');
    if (openBtn) openBtn.addEventListener('click', () => showAuthModal('login'));
    return;
  }

  const displayName = state.user?.displayName || state.user?.email || langText('Prisijunges vartotojas', 'Signed-in user');
  const roleLabel = state.role === 'institution_admin'
    ? langText('Administratorius', 'Administrator')
    : langText('Narys', 'Member');

  container.innerHTML = `
    <div class="user-toolbar user-toolbar-main">
      ${strategySwitcherCardMarkup({ topbar: true })}
      <div class="user-chip">
        <span>${escapeHtml(displayName)}</span>
        <span class="tag">${escapeHtml(roleLabel)}</span>
      </div>
      <button id="logoutBtn" class="btn btn-ghost">${langText('Atsijungti', 'Sign out')}</button>
    </div>
  `;
  bindStrategySwitcherDialog(container);
  bindInstitutionSwitch(container);
  bindStrategySwitch(container);

  const logoutBtn = container.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      bootstrap();
    });
  }
}

function renderVoteFloating() {
  if (state.embedMapMode) {
    const existing = document.getElementById('voteFloating');
    if (existing) existing.remove();
    return;
  }
  let floating = document.getElementById('voteFloating');
  if (!floating) {
    floating = document.createElement('div');
    floating.id = 'voteFloating';
    floating.className = 'vote-floating';
    document.body.appendChild(floating);
  }

  if (!isLoggedIn() || (state.activeView !== 'guidelines' && state.activeView !== 'initiatives')) {
    floating.hidden = true;
    return;
  }

  const budget = voteBudget();
  const used = usedVotesTotal();
  const remaining = Math.max(0, budget - used);
  const locked = !cycleIsWritable();

  floating.hidden = false;
  floating.classList.toggle('collapsed', state.voteFloatingCollapsed);
  floating.innerHTML = `
    <div class="vote-floating-inner">
      <button id="toggleVoteFloatingBtn" class="vote-floating-toggle" type="button" aria-label="${state.voteFloatingCollapsed ? 'Rodyti balsÅ³ biudÅ¾etÄ…' : 'SlÄ—pti balsÅ³ biudÅ¾etÄ…'}">
        ${state.voteFloatingCollapsed ? '>' : '<'}
      </button>
      <div class="vote-floating-content">
        <div class="vote-floating-title">BalsÅ³ biudÅ¾etas</div>
        <div class="vote-floating-count">${remaining} / ${budget}</div>
        <div class="vote-total">${locked ? 'Ciklas uÅ¾rakintas' : 'Balsavimas aktyvus'}</div>
      </div>
    </div>
  `;

  const toggleBtn = floating.querySelector('#toggleVoteFloatingBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      state.voteFloatingCollapsed = !state.voteFloatingCollapsed;
      persistVoteFloatingCollapsed();
      renderVoteFloating();
    });
  }
}

function buildSummary() {
  const lines = [];
  lines.push(`Institucija: ${state.institution?.name || state.institutionSlug}`);
  lines.push(`Strategija: ${state.strategy?.title || '-'}`);
  lines.push(`Ciklas: ${state.cycle?.title || '-'}`);
  lines.push(`BÅ«sena: ${state.cycle?.state || '-'}`);
  lines.push('');
  lines.push('GairÄ—s:');

  if (!state.guidelines.length) {
    lines.push('- NÄ—ra duomenÅ³');
    return lines.join('\n');
  }

  state.guidelines.forEach((guideline) => {
    lines.push(`- ${guideline.title} (bendras balas: ${Number(guideline.totalScore || 0)})`);
    lines.push(`  apraÅ¡ymas: ${guideline.description || 'be paaiÅ¡kinimo'}`);
    lines.push(`  komentarÅ³: ${Array.isArray(guideline.comments) ? guideline.comments.length : 0}`);
  });

  lines.push('');
  lines.push('Iniciatyvos:');
  if (!state.initiatives.length) {
    lines.push('- NÄ—ra duomenÅ³');
  } else {
    state.initiatives.forEach((initiative) => {
      const linkedNames = resolveInitiativeGuidelineNames(initiative);
      lines.push(`- ${initiative.title} (bendras balas: ${Number(initiative.totalScore || 0)})`);
      lines.push(`  apraÅ¡ymas: ${initiative.description || 'be paaiÅ¡kinimo'}`);
      lines.push(`  susietos gairÄ—s: ${linkedNames.length ? linkedNames.join(', ') : 'nÄ—ra'}`);
      lines.push(`  komentarÅ³: ${Array.isArray(initiative.comments) ? initiative.comments.length : 0}`);
    });
  }

  return lines.join('\n');
}

function exportSummary() {
  if (!state.institutionSlug) return;
  elements.summaryText.value = buildSummary();
  elements.exportPanel.hidden = false;
}

function downloadJson() {
  const payload = {
    institution: state.institution,
    cycle: state.cycle,
    summary: state.summary,
    guidelines: state.guidelines,
    initiatives: state.initiatives
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const strategyPart = normalizeSlug(state.strategySlug) || 'unselected';
  link.download = `strategy-${state.institutionSlug}-${strategyPart}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindGlobal() {
  const openAccessRequestBtn = document.getElementById('openAccessRequestBtn');
  if (openAccessRequestBtn) {
    openAccessRequestBtn.addEventListener('click', () => showAccessRequestModal());
  }
  document.getElementById('closeExport').addEventListener('click', () => {
    elements.exportPanel.hidden = true;
  });
  document.getElementById('copySummary').addEventListener('click', async () => {
    await navigator.clipboard.writeText(elements.summaryText.value);
    notifySuccess('Santrauka nukopijuota.');
  });
  document.getElementById('downloadJson').addEventListener('click', downloadJson);
  window.addEventListener('uzt-auth-changed', handleAuthChanged);
  window.addEventListener('uzt-language-changed', () => {
    render();
  });
  window.addEventListener('resize', () => {
    if (state.activeView !== 'implementation-plan' || state.implementationPlanSubview !== 'calendar') return;
    scheduleImplementationPlanCalendarConnectorRender();
  });
  document.addEventListener('fullscreenchange', () => {
    updateMapFullscreenButtonLabel();
    if (state.activeView !== 'map') return;
    const viewport = document.getElementById('strategyMapViewport');
    const world = document.getElementById('strategyMapWorld');
    if (!viewport || !world) return;
    fitMapToCurrentNodes(viewport, world);
  });
  document.addEventListener('keydown', (event) => {
    if (state.activeView !== 'map') return;
    if (event.defaultPrevented || event.repeat) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tagName = String(target.tagName || '').toLowerCase();
      if (target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;
    }
    if (String(event.key || '').toLowerCase() !== 'j') return;
    state.mapSecretAnthracite = !state.mapSecretAnthracite;
    const viewport = document.getElementById('strategyMapViewport');
    if (viewport instanceof HTMLElement) {
      viewport.classList.toggle('map-secret-anthracite', state.mapSecretAnthracite);
    }
  });
  window.addEventListener('scroll', maybeAutoCollapseIntroOnFirstScroll, { passive: true });
}

function ensureInstitutionSelectionForAuth() {
  if (normalizeSlug(state.institutionSlug)) return true;
  const institutions = Array.isArray(state.institutions) ? state.institutions : [];
  const firstInstitution = institutions.find((item) => normalizeSlug(item?.slug)) || null;
  if (!firstInstitution) return false;

  const fallbackInstitutionSlug = normalizeSlug(firstInstitution.slug);
  if (!fallbackInstitutionSlug) return false;

  state.institutionSlug = fallbackInstitutionSlug;
  state.strategySlug = '';
  state.strategy = null;
  clearRouteEntity();
  syncRouteState();
  return true;
}

function showAuthModal(initialMode = 'login') {
  if (!ensureInstitutionSelectionForAuth()) {
    notifyError('Pirma pasirinkite institucijÄ….');
    return;
  }
  void initialMode;
  const institutions = Array.isArray(state.institutions) ? state.institutions : [];
  const currentInstitutionSlug = normalizeSlug(state.institutionSlug);
  const authInstitutionOptions = institutions
    .map((institution) => {
      const slug = normalizeSlug(institution?.slug);
      if (!slug) return '';
      const name = String(institution?.name || slug).trim() || slug;
      const isSelected = slug === currentInstitutionSlug ? ' selected' : '';
      return `<option value="${escapeHtml(slug)}"${isSelected}>${escapeHtml(name)}</option>`;
    })
    .filter(Boolean)
    .join('');
  const fallbackInstitutionSlug = String(state.institutionSlug || '').trim();
  const authInstitutionSelect = authInstitutionOptions
    ? `<select id="authInstitution" name="institutionSlug" required>${authInstitutionOptions}</select>`
    : `<select id="authInstitution" name="institutionSlug" required><option value="${escapeHtml(fallbackInstitutionSlug)}" selected>${escapeHtml(fallbackInstitutionSlug || '-')}</option></select>`;

  let overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'loginOverlay';
  overlay.className = 'login-overlay';
  overlay.innerHTML = `
    <div class="login-card">
      <div class="header-row" style="margin-bottom: 8px;">
        <h2>Prisijungimas</h2>
        <button id="closeAuthModal" class="btn btn-ghost" type="button">Uždaryti</button>
      </div>
      <div id="authError" class="error" style="display:none;"></div>
      <p id="authHint" class="prompt auth-hint" style="display:none;"></p>

      <form id="loginForm" class="login-form login-form-auth">
        <label class="auth-label" for="authInstitution">Institucija</label>
        ${authInstitutionSelect}
        <label class="auth-label" for="authEmail">El. paštas</label>
        <input id="authEmail" type="email" name="email" placeholder="El. paštas" autocomplete="email" required />
        <label class="auth-label" for="authPassword">Slaptažodis</label>
        <div class="auth-password-field">
          <input id="authPassword" type="password" name="password" placeholder="Slaptažodis" autocomplete="current-password" required />
          <button id="toggleAuthPassword" class="auth-password-toggle" type="button" aria-label="Rodyti slaptažodį">Rodyti</button>
        </div>
        <button class="btn btn-primary" type="submit">Prisijungti</button>
      </form>

      <div class="auth-separator"></div>
      <button id="forgotPasswordBtn" class="btn btn-ghost auth-forgot-btn" type="button">Pamiršau slaptažodį</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('#closeAuthModal');
  const authError = overlay.querySelector('#authError');
  const authHint = overlay.querySelector('#authHint');
  const loginForm = overlay.querySelector('#loginForm');
  const forgotPasswordBtn = overlay.querySelector('#forgotPasswordBtn');
  const authPasswordInput = overlay.querySelector('#authPassword');
  const toggleAuthPassword = overlay.querySelector('#toggleAuthPassword');
  const authEmailInput = overlay.querySelector('#authEmail');

  function closeModal() {
    const current = document.getElementById('loginOverlay');
    if (current) current.remove();
  }

  function clearMessages() {
    authError.textContent = '';
    authError.style.display = 'none';
    authHint.textContent = '';
    authHint.style.display = 'none';
  }

  function showError(message) {
    authHint.textContent = '';
    authHint.style.display = 'none';
    authError.textContent = message;
    authError.style.display = 'block';
    notifyError(message);
  }

  function showHint(message) {
    authError.textContent = '';
    authError.style.display = 'none';
    authHint.textContent = message;
    authHint.style.display = 'block';
    notifyInfo(message);
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  toggleAuthPassword.addEventListener('click', () => {
    const nextType = authPasswordInput.type === 'password' ? 'text' : 'password';
    authPasswordInput.type = nextType;
    toggleAuthPassword.textContent = nextType === 'password' ? 'Rodyti' : 'Slėpti';
    toggleAuthPassword.setAttribute('aria-label', nextType === 'password' ? 'Rodyti slaptažodį' : 'Slėpti slaptažodį');
  });
  forgotPasswordBtn.addEventListener('click', () => {
    showHint('Susisiekite su savo organizacijos administratoriumi dėl vienkartinės slaptažodžio keitimo nuorodos.');
  });
  authEmailInput?.focus();

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessages();
    const fd = new FormData(loginForm);
    const institutionSlug = normalizeSlug(fd.get('institutionSlug'));
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    if (!institutionSlug || !email || !password) return;
    const selectedInstitution = institutions.find(
      (institution) => normalizeSlug(institution?.slug) === institutionSlug
    ) || null;
    const institutionStrategies = Array.isArray(selectedInstitution?.strategies)
      ? selectedInstitution.strategies
      : [];
    const selectedStrategySlug = normalizeSlug(state.strategySlug)
      || rememberedStrategySlugForInstitution(institutionSlug);
    const selectedStrategy = institutionStrategies.find(
      (item) => normalizeSlug(item?.slug) === selectedStrategySlug
    ) || null;

    try {
      const payload = await api('/api/v1/auth/login', {
        method: 'POST',
        auth: false,
        body: {
          email,
          password,
          institutionSlug
        }
      });
      state.institutionSlug = institutionSlug;
      state.institution = selectedInstitution || state.institution;
      state.strategySlug = selectedStrategySlug;
      state.strategy = selectedStrategy;
      clearRouteEntity();
      syncRouteState();
      setSession(payload);
      closeModal();
      await bootstrap();
    } catch (error) {
      showError(toUserMessage(error));
    }
  });
}

function strategyCreateUiText() {
  if (currentLanguage() === 'en') {
    return {
      title: 'Create strategy',
      subtitle: 'Create a new strategy for the selected institution.',
      close: 'Close',
      manualTab: 'Manual',
      aiTab: 'AI from PDF',
      strategySetup: 'Strategy setup',
      aiSetup: 'AI generation settings',
      strategyTitle: 'Strategy title',
      strategySlug: 'Strategy slug (optional)',
      strategyDescription: 'Short description (optional)',
      createManual: 'Create strategy',
      localeHint: 'Result language',
      clarification: 'AI clarification',
      clarificationPlaceholder: 'Scope, tone, priorities, constraints.',
      documents: 'PDF documents',
      createAi: 'Generate strategy with AI',
      progressTitle: 'AI generation in progress',
      progressUploading: 'Uploading documents',
      progressAnalyses: 'Analyzing with AI',
      progressPreparing: 'Building digistrategy.eu format',
      progressDone: 'Finalizing',
      progressRecovering: 'Waiting for server confirmation',
      successManual: 'Strategy created:',
      successAi: 'AI generated strategy:'
    };
  }
  return {
    title: 'Sukurti strategijÄ…',
    subtitle: 'Sukurkite naujÄ… strategijÄ… pasirinktai institucijai.',
    close: 'UÅ¾daryti',
    manualTab: 'Rankinis',
    aiTab: 'AI iÅ¡ PDF',
    strategySetup: 'Strategijos nustatymai',
    aiSetup: 'AI generavimo nustatymai',
    strategyTitle: 'Strategijos pavadinimas',
    strategySlug: 'Strategijos slug (nebÅ«tina)',
    strategyDescription: 'Trumpas apraÅ¡ymas (nebÅ«tina)',
    createManual: 'Sukurti strategijÄ…',
    localeHint: 'Rezultato kalba',
    clarification: 'AI patikslinimas',
    clarificationPlaceholder: 'Koks lygis, tonas, prioritetai, ko vengti.',
    documents: 'PDF dokumentai',
    createAi: 'Generuoti strategijÄ… su AI',
    progressTitle: 'AI generavimas vyksta',
    progressUploading: 'Ä®keliami dokumentai',
    progressAnalyses: 'Analizuojama su AI',
    progressPreparing: 'RuoÅ¡iamas digistrategy.eu formatas',
    progressDone: 'UÅ¾baigiama',
    progressRecovering: 'Laukiamas serverio patvirtinimas',
    successManual: 'Strategija sukurta:',
    successAi: 'AI sugeneravo strategijÄ…:'
  };
}

function isGatewayTimeoutError(error) {
  const message = String(error?.message || error || '').trim().toUpperCase();
  return message === 'HTTP 504'
    || message.includes('HTTP 504')
    || message.includes('GATEWAY TIMEOUT');
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function showStrategyCreationConfetti({ pieces = 90, durationMs = 2600 } = {}) {
  const total = Math.max(30, Math.min(180, Number(pieces) || 90));
  const duration = Math.max(1200, Number(durationMs) || 2600);
  const existing = document.getElementById('strategyCreateConfettiLayer');
  if (existing) existing.remove();

  const layer = document.createElement('div');
  layer.id = 'strategyCreateConfettiLayer';
  layer.className = 'strategy-create-confetti-layer';

  const colors = ['#2f79cf', '#3f8ee6', '#63b3ff', '#7fd9a5', '#ffcf66', '#f87f7f'];
  for (let index = 0; index < total; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'strategy-create-confetti-piece';
    const left = Math.random() * 100;
    const delay = Math.random() * 0.45;
    const fallDuration = 1.4 + Math.random() * 1.8;
    const drift = -80 + Math.random() * 160;
    const rotate = -320 + Math.random() * 640;
    const size = 6 + Math.random() * 8;
    piece.style.left = `${left}%`;
    piece.style.top = `${-10 - Math.random() * 20}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${Math.max(4, size * 0.55)}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${delay}s`;
    piece.style.animationDuration = `${fallDuration}s`;
    piece.style.setProperty('--confetti-drift', `${drift}px`);
    piece.style.setProperty('--confetti-rotate', `${rotate}deg`);
    layer.appendChild(piece);
  }

  document.body.appendChild(layer);
  window.setTimeout(() => {
    layer.remove();
  }, duration);
}

async function recoverAiGenerationAfterGatewayTimeout({
  sinceIso,
  expectedTitle,
  expectedSlug,
  timeoutMs = 90000,
  pollMs = 1800
} = {}) {
  const deadline = Date.now() + Math.max(5000, Number(timeoutMs) || 0);
  const normalizedExpectedSlug = normalizeSlug(expectedSlug);
  const normalizedExpectedTitle = String(expectedTitle || '').trim().toLowerCase();
  const queryValue = String(sinceIso || '').trim();
  const querySuffix = queryValue ? `?since=${encodeURIComponent(queryValue)}` : '';

  while (Date.now() < deadline) {
    let payload = null;
    try {
      payload = await api(`/api/v1/admin/strategies/ai-latest${querySuffix}`, { auth: true });
    } catch {
      payload = null;
    }

    const generation = payload?.generation;
    if (generation) {
      const strategy = generation?.strategy || null;
      const strategySlug = normalizeSlug(strategy?.slug);
      const strategyTitle = String(strategy?.title || '').trim().toLowerCase();
      const slugMatches = normalizedExpectedSlug && strategySlug && normalizedExpectedSlug === strategySlug;
      const titleMatches = normalizedExpectedTitle && strategyTitle && normalizedExpectedTitle === strategyTitle;
      const hasExpectations = Boolean(normalizedExpectedSlug || normalizedExpectedTitle);
      const matchesExpected = hasExpectations ? (slugMatches || titleMatches) : true;

      if (generation.status === 'completed' && strategy && matchesExpected) {
        return {
          strategy,
          cycle: generation?.cycle || null
        };
      }
      if (generation.status === 'failed' && matchesExpected) {
        throw new Error(String(generation.errorMessage || 'ai generation failed'));
      }
    }

    await waitMs(pollMs);
  }

  return null;
}

async function waitForAdminAiGenerationById({
  generationId,
  timeoutMs = 10 * 60 * 1000,
  pollMs = 1500,
  progress = null,
  ui = null
} = {}) {
  const id = String(generationId || '').trim();
  if (!id) throw new Error('generationId required');

  const deadline = Date.now() + Math.max(10000, Number(timeoutMs) || 0);
  let analysisShown = false;
  let preparingShown = false;

  while (Date.now() < deadline) {
    const payload = await api(`/api/v1/admin/strategies/ai-generations/${encodeURIComponent(id)}`, { auth: true });
    const generation = payload?.generation || null;
    if (!generation) {
      await waitMs(pollMs);
      continue;
    }

    const status = String(generation.status || '').trim().toLowerCase();
    if (progress) {
      if (status === 'pending') {
        progress.setStatus(ui?.progressUploading || '');
        progress.bumpTarget(24);
      } else if (status === 'processing') {
        if (!analysisShown) {
          analysisShown = true;
          await progress.markAnalysing();
        }
      } else if (status === 'applying') {
        if (!analysisShown) {
          analysisShown = true;
          await progress.markAnalysing();
        }
        if (!preparingShown) {
          preparingShown = true;
          await progress.markPreparing();
        }
      }
    }

    if (status === 'completed') {
      if (generation?.strategy?.slug) {
        return {
          strategy: generation.strategy,
          cycle: generation.cycle || null
        };
      }
      throw new Error('ai response invalid');
    }

    if (status === 'failed') {
      throw new Error(String(generation.errorMessage || 'ai generation failed'));
    }

    await waitMs(pollMs);
  }

  throw new Error('ai generation timeout');
}

function strategyCreateProgressMarkup(ui) {
  return `
    <div class="strategy-ai-progress">
      <div class="header-row" style="margin-bottom:6px;">
        <span class="tag" data-progress-current>${escapeHtml(ui.progressUploading)}</span>
      </div>
      <div class="strategy-ai-progress-bar-shell">
        <div class="strategy-ai-progress-bar" data-progress-bar style="width: 0%;"></div>
      </div>
      <div class="strategy-ai-progress-steps">
        <span class="strategy-ai-step" data-progress-step="0">${escapeHtml(ui.progressUploading)}</span>
        <span class="strategy-ai-step" data-progress-step="1">${escapeHtml(ui.progressAnalyses)}</span>
        <span class="strategy-ai-step" data-progress-step="2">${escapeHtml(ui.progressPreparing)}</span>
        <span class="strategy-ai-step" data-progress-step="3">${escapeHtml(ui.progressDone)}</span>
      </div>
    </div>
  `;
}

function startStrategyAiProgress(ui) {
  const labels = [
    ui.progressUploading,
    ui.progressAnalyses,
    ui.progressPreparing,
    ui.progressDone
  ];
  const stageMinDurationMs = [900, 2400, 1300, 450];
  const stageTargetProgress = [18, 76, 93, 100];

  const existing = document.getElementById('strategyAiProgressOverlay');
  if (existing) existing.remove();

  const progressOverlay = document.createElement('div');
  progressOverlay.id = 'strategyAiProgressOverlay';
  progressOverlay.className = 'login-overlay strategy-ai-progress-overlay';
  progressOverlay.innerHTML = `
    <div class="login-card strategy-ai-progress-card" role="status" aria-live="polite">
      <h3 class="strategy-ai-progress-title">${escapeHtml(ui.progressTitle)}</h3>
      <p class="prompt strategy-ai-progress-subtitle" id="strategyAiBlockingStatus">${escapeHtml(ui.progressUploading)}</p>
      ${strategyCreateProgressMarkup(ui)}
    </div>
  `;
  document.body.appendChild(progressOverlay);

  const root = progressOverlay.querySelector('.strategy-ai-progress');
  const bar = progressOverlay.querySelector('[data-progress-bar]');
  const current = progressOverlay.querySelector('[data-progress-current]');
  const status = progressOverlay.querySelector('#strategyAiBlockingStatus');
  const steps = Array.from(progressOverlay.querySelectorAll('[data-progress-step]'));
  if (!(root instanceof HTMLElement)) return null;

  let currentStage = 0;
  let stageStartedAt = Date.now();
  let targetProgress = stageTargetProgress[0];
  let renderedProgress = 0;
  let disposed = false;

  const applyStepState = (activeIndex) => {
    steps.forEach((node) => {
      const index = Number(node.getAttribute('data-progress-step') || 0);
      if (!(node instanceof HTMLElement)) return;
      node.classList.toggle('is-active', index === activeIndex);
      node.classList.toggle('is-done', index < activeIndex);
    });
    if (current instanceof HTMLElement) {
      current.textContent = labels[activeIndex] || labels[0];
    }
    if (status instanceof HTMLElement) {
      status.textContent = labels[activeIndex] || labels[0];
    }
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, Math.max(0, ms)));

  const advanceStage = async (nextStage) => {
    const targetStage = Math.max(0, Math.min(3, Number(nextStage) || 0));
    if (disposed || targetStage <= currentStage) return;
    const elapsed = Date.now() - stageStartedAt;
    const minDuration = stageMinDurationMs[currentStage] || 0;
    if (elapsed < minDuration) {
      await sleep(minDuration - elapsed);
    }
    if (disposed) return;
    currentStage = targetStage;
    stageStartedAt = Date.now();
    targetProgress = stageTargetProgress[currentStage] || 100;
    applyStepState(currentStage);
  };

  applyStepState(currentStage);

  const tick = () => {
    if (disposed) return;
    const elapsedInStage = Date.now() - stageStartedAt;

    // Keep long-running stages feeling alive without jumping to "done".
    if (currentStage === 1 && elapsedInStage > 2200) {
      targetProgress = Math.min(86, targetProgress + 0.08);
    } else if (currentStage === 2 && elapsedInStage > 1200) {
      targetProgress = Math.min(96, targetProgress + 0.05);
    }

    const delta = Math.max(0.2, (targetProgress - renderedProgress) * 0.08);
    renderedProgress = Math.min(targetProgress, renderedProgress + delta);
    if (bar instanceof HTMLElement) {
      bar.style.width = `${renderedProgress.toFixed(1)}%`;
    }
  };

  tick();
  const timerId = window.setInterval(tick, 120);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.clearInterval(timerId);
    progressOverlay.remove();
  };

  return {
    markAnalysing: () => advanceStage(1),
    markPreparing: () => advanceStage(2),
    setStatus: (text) => {
      const value = String(text || '').trim();
      if (!value) return;
      if (current instanceof HTMLElement) current.textContent = value;
      if (status instanceof HTMLElement) status.textContent = value;
    },
    bumpTarget: (value) => {
      const nextTarget = Number(value);
      if (!Number.isFinite(nextTarget)) return;
      targetProgress = Math.max(targetProgress, Math.min(99, nextTarget));
    },
    complete: async () => {
      await advanceStage(3);
      targetProgress = 100;
      if (bar instanceof HTMLElement) bar.style.width = '100%';
      if (current instanceof HTMLElement) current.textContent = labels[3];
      if (status instanceof HTMLElement) status.textContent = labels[3];
      const finalStep = steps[3];
      if (finalStep instanceof HTMLElement) {
        finalStep.classList.add('is-done');
      }
      await sleep(stageMinDurationMs[3]);
      dispose();
    },
    fail: () => {
      dispose();
    }
  };
}

async function loadExternalImportTargetGuidelines(target) {
  if (!target?.institutionSlug) return [];
  const params = new URLSearchParams();
  if (target.strategySlug) params.set('strategy', target.strategySlug);
  const payload = await api(
    `/api/v1/public/institutions/${encodeURIComponent(target.institutionSlug)}/cycles/current/guidelines${params.toString() ? `?${params.toString()}` : ''}`,
    { auth: 'optional' }
  );
  return Array.isArray(payload?.guidelines) ? payload.guidelines : [];
}

function buildImportSourceLabel() {
  const institutionName = String(state.institution?.name || state.institutionSlug || '-').trim() || '-';
  const strategyTitle = String(state.strategy?.title || state.strategySlug || '-').trim() || '-';
  return `${institutionName} / ${strategyTitle}`;
}

function buildImportTargetLabel(target) {
  const institutionName = String(target?.institutionName || target?.institutionSlug || '-').trim() || '-';
  const strategyTitle = String(target?.strategyTitle || target?.strategySlug || '-').trim() || '-';
  return `${institutionName} / ${strategyTitle}`;
}

function buildImportTargetStrategyOptions(targets, selectedStrategySlug = '') {
  const selectedSlug = normalizeSlug(selectedStrategySlug);
  const items = Array.isArray(targets) ? targets : [];
  return items.map((target) => {
    const strategySlug = normalizeSlug(target?.strategySlug);
    if (!strategySlug) return '';
    const label = String(target?.strategyTitle || strategySlug).trim() || strategySlug;
    return `<option value="${escapeHtml(strategySlug)}" ${selectedSlug === strategySlug ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');
}

function buildParentGuidelineOptions(guidelines, selectedId = '') {
  const selected = String(selectedId || '').trim();
  const items = Array.isArray(guidelines) ? guidelines : [];
  return [
    `<option value="">${escapeHtml(langText('Pasirinkite tevine gaire', 'Select a parent guideline'))}</option>`,
    ...items.map((guideline) => {
      const id = String(guideline?.id || '').trim();
      if (!id) return '';
      return `<option value="${escapeHtml(id)}" ${selected === id ? 'selected' : ''}>${escapeHtml(guideline.title || id)}</option>`;
    })
  ].join('');
}

function matchImportGuidelineIdsByTitle(sourceTitles, targetGuidelines) {
  const targetByTitle = new Map();
  (Array.isArray(targetGuidelines) ? targetGuidelines : []).forEach((guideline) => {
    const key = normalizeImportComparableText(guideline?.title);
    if (!key || targetByTitle.has(key)) return;
    targetByTitle.set(key, String(guideline?.id || '').trim());
  });

  return Array.from(new Set(
    (Array.isArray(sourceTitles) ? sourceTitles : [])
      .map((title) => targetByTitle.get(normalizeImportComparableText(title)))
      .filter(Boolean)
  ));
}

function closeExternalImportModal() {
  const overlay = document.getElementById('externalImportOverlay');
  if (overlay) overlay.remove();
}

function openExternalItemImportModal(kind, entityId) {
  const normalizedKind = String(kind || '').trim().toLowerCase();
  if (normalizedKind === 'initiative') {
    const initiative = findInitiativeById(entityId);
    if (!initiative) return;
    void showInitiativeImportModal(initiative);
    return;
  }
  const guideline = findGuidelineById(entityId);
  if (!guideline) return;
  void showGuidelineImportModal(guideline);
}

async function showGuidelineImportModal(sourceGuideline) {
  let targets = [];
  try {
    targets = await loadExternalImportTargets();
  } catch (error) {
    notifyError(toUserMessage(error));
    return;
  }
  const initialTarget = pickPreferredExternalImportTarget(targets);
  if (!initialTarget) {
    notifyError(langText('Importuoti galima tik i atvira jusu institucijos strategijos cikla.', 'Import is available only into an open cycle of your institution strategy.'));
    return;
  }
  if (!canImportExternalItem(sourceGuideline)) return;

  closeExternalImportModal();
  const overlay = document.createElement('div');
  overlay.id = 'externalImportOverlay';
  overlay.className = 'login-overlay strategy-create-overlay';
  const defaultRelation = normalizeGuidelineRelation(sourceGuideline?.relationType) === 'child'
    ? 'orphan'
    : normalizeGuidelineRelation(sourceGuideline?.relationType);
  overlay.innerHTML = `
    <div class="login-card strategy-create-card">
      <div class="header-row" style="margin-bottom: 8px;">
        <h2>${escapeHtml(langText('Naudoti mano strategijoje', 'Use in my strategy'))}</h2>
        <button id="closeExternalImportModal" class="btn btn-ghost" type="button">${escapeHtml(langText('Uzdaryti', 'Close'))}</button>
      </div>
      <p class="prompt auth-hint">${escapeHtml(langText('Sukursite moderuojama gaires pasiulyma savo institucijos strategijoje.', 'This creates a moderated guideline proposal in your institution strategy.'))}</p>
      <div class="header-stack" style="margin-bottom: 12px;">
        <span class="tag">${escapeHtml(langText('Saltinis', 'Source'))}: ${escapeHtml(buildImportSourceLabel())}</span>
        <span class="tag">${escapeHtml(langText('Tikslas', 'Target'))}: <span id="externalImportTargetLabel">${escapeHtml(buildImportTargetLabel(initialTarget))}</span></span>
      </div>
      <div id="externalImportError" class="error" style="display:none;"></div>
      <form id="externalGuidelineImportForm" class="login-form login-form-auth strategy-create-form">
        ${targets.length > 1 ? `
          <label class="auth-label" for="externalImportTargetStrategy">${escapeHtml(langText('Tiksline strategija', 'Target strategy'))}</label>
          <select id="externalImportTargetStrategy" name="targetStrategySlug">${buildImportTargetStrategyOptions(targets, initialTarget.strategySlug)}</select>
        ` : ''}
        <label class="auth-label" for="externalImportGuidelineTitle">${escapeHtml(langText('Pavadinimas', 'Title'))}</label>
        <input id="externalImportGuidelineTitle" type="text" name="title" value="${escapeHtml(sourceGuideline.title || '')}" required />
        <label class="auth-label" for="externalImportGuidelineDescription">${escapeHtml(langText('Aprasymas', 'Description'))}</label>
        <textarea id="externalImportGuidelineDescription" name="description" rows="5">${escapeHtml(sourceGuideline.description || '')}</textarea>
        <label class="auth-label" for="externalImportGuidelineRelation">${escapeHtml(langText('Rysio tipas', 'Relation type'))}</label>
        <select id="externalImportGuidelineRelation" name="relationType">
          <option value="orphan" ${defaultRelation === 'orphan' ? 'selected' : ''}>${escapeHtml(langText('Savarankiska', 'Standalone'))}</option>
          <option value="parent" ${defaultRelation === 'parent' ? 'selected' : ''}>${escapeHtml(langText('Tevine', 'Parent'))}</option>
          <option value="child" ${defaultRelation === 'child' ? 'selected' : ''}>${escapeHtml(langText('Vaikine', 'Child'))}</option>
        </select>
        <label class="auth-label" for="externalImportGuidelineParent">${escapeHtml(langText('Tiksline tevine gaire', 'Target parent guideline'))}</label>
        <select id="externalImportGuidelineParent" name="parentGuidelineId"></select>
        <p id="externalImportGuidelineHint" class="prompt auth-hint">${escapeHtml(
          normalizeGuidelineRelation(sourceGuideline?.relationType) === 'child'
            ? langText('Saltinio vaikine gaire pagal nutylejima importuojama kaip savarankiska, kol nepasirinksite tevines gaires savo strategijoje.', 'A child guideline from the source defaults to standalone until you map it to a parent guideline in your strategy.')
            : langText('Perziurekite ir, jei reikia, pakoreguokite aprasyma pries pateikdami pasiulyma.', 'Review and adjust the description if needed before submitting the proposal.')
        )}</p>
        <button id="submitExternalGuidelineImport" class="btn btn-primary" type="submit">${escapeHtml(langText('Sukurti pasiulyma', 'Create proposal'))}</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector('#closeExternalImportModal');
  const form = overlay.querySelector('#externalGuidelineImportForm');
  const errorNode = overlay.querySelector('#externalImportError');
  const relationSelect = overlay.querySelector('#externalImportGuidelineRelation');
  const parentSelect = overlay.querySelector('#externalImportGuidelineParent');
  const targetSelect = overlay.querySelector('#externalImportTargetStrategy');
  const targetLabelNode = overlay.querySelector('#externalImportTargetLabel');
  const submitButton = overlay.querySelector('#submitExternalGuidelineImport');
  let activeTarget = initialTarget;
  let activeTargetGuidelines = [];

  const setError = (message) => {
    if (!(errorNode instanceof HTMLElement)) return;
    const text = String(message || '').trim();
    errorNode.textContent = text;
    errorNode.style.display = text ? 'block' : 'none';
  };

  const syncParentState = () => {
    const isChild = String(relationSelect?.value || 'orphan').trim().toLowerCase() === 'child';
    if (parentSelect instanceof HTMLSelectElement) {
      parentSelect.disabled = !isChild;
      if (!isChild) parentSelect.value = '';
    }
  };

  const applyTarget = async (target, { preserveParentId = '' } = {}) => {
    activeTarget = target;
    if (targetLabelNode instanceof HTMLElement) {
      targetLabelNode.textContent = buildImportTargetLabel(target);
    }
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
    const allTargetGuidelines = await loadExternalImportTargetGuidelines(target);
    activeTargetGuidelines = allTargetGuidelines.filter((guideline) =>
      String(guideline?.status || '').trim().toLowerCase() === 'active'
    );
    const parentGuidelines = activeTargetGuidelines.filter((guideline) =>
      normalizeGuidelineRelation(guideline?.relationType) === 'parent'
    );
    if (parentSelect instanceof HTMLSelectElement) {
      parentSelect.innerHTML = buildParentGuidelineOptions(parentGuidelines, preserveParentId);
    }
    syncParentState();
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
  };

  closeButton?.addEventListener('click', closeExternalImportModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeExternalImportModal();
  });
  relationSelect?.addEventListener('change', syncParentState);
  targetSelect?.addEventListener('change', async () => {
    const selectedTarget = targets.find((item) => normalizeSlug(item?.strategySlug) === normalizeSlug(targetSelect.value)) || activeTarget;
    try {
      setError('');
      await applyTarget(selectedTarget);
    } catch (error) {
      setError(toUserMessage(error));
    }
  });
  try {
    await applyTarget(initialTarget);
  } catch (error) {
    closeExternalImportModal();
    notifyError(toUserMessage(error));
    return;
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!(submitButton instanceof HTMLButtonElement)) return;
    submitButton.disabled = true;
    setError('');
    try {
      const fd = new FormData(form);
      const relationType = normalizeGuidelineRelation(fd.get('relationType'));
      const parentGuidelineId = String(fd.get('parentGuidelineId') || '').trim();
      if (relationType === 'child' && !parentGuidelineId) {
        throw new Error(langText('Pasirinkite tevine gaire savo strategijoje.', 'Select a parent guideline in your strategy.'));
      }
      const payload = await api(`/api/v1/cycles/${encodeURIComponent(activeTarget.cycleId)}/import-guideline-proposals`, {
        method: 'POST',
        body: {
          sourceGuidelineId: sourceGuideline.id,
          title: String(fd.get('title') || '').trim(),
          description: String(fd.get('description') || '').trim(),
          relationType,
          parentGuidelineId: relationType === 'child' ? parentGuidelineId : null
        }
      });
      closeExternalImportModal();
      notifySuccess(
        langText(
          `Gaires pasiulymas sukurtas strategijai "${activeTarget.strategyTitle || activeTarget.cycleTitle || '-'}".`,
          `Guideline proposal created for "${activeTarget.strategyTitle || activeTarget.cycleTitle || '-'}".`
        )
      );
      return payload;
    } catch (error) {
      setError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
    }
  });
}

async function showInitiativeImportModal(sourceInitiative) {
  let targets = [];
  try {
    targets = await loadExternalImportTargets();
  } catch (error) {
    notifyError(toUserMessage(error));
    return;
  }
  const initialTarget = pickPreferredExternalImportTarget(targets);
  if (!initialTarget) {
    notifyError(langText('Importuoti galima tik i atvira jusu institucijos strategijos cikla.', 'Import is available only into an open cycle of your institution strategy.'));
    return;
  }
  if (!canImportExternalItem(sourceInitiative)) return;
  const sourceGuidelineTitles = resolveInitiativeLinkedGuidelines(sourceInitiative).map((item) => item.title || item.id);

  closeExternalImportModal();
  const overlay = document.createElement('div');
  overlay.id = 'externalImportOverlay';
  overlay.className = 'login-overlay strategy-create-overlay';
  overlay.innerHTML = `
    <div class="login-card strategy-create-card">
      <div class="header-row" style="margin-bottom: 8px;">
        <h2>${escapeHtml(langText('Naudoti mano strategijoje', 'Use in my strategy'))}</h2>
        <button id="closeExternalImportModal" class="btn btn-ghost" type="button">${escapeHtml(langText('Uzdaryti', 'Close'))}</button>
      </div>
      <p class="prompt auth-hint">${escapeHtml(langText('Sukursite moderuojama iniciatyvos pasiulyma savo institucijos strategijoje.', 'This creates a moderated initiative proposal in your institution strategy.'))}</p>
      <div class="header-stack" style="margin-bottom: 12px;">
        <span class="tag">${escapeHtml(langText('Saltinis', 'Source'))}: ${escapeHtml(buildImportSourceLabel())}</span>
        <span class="tag">${escapeHtml(langText('Tikslas', 'Target'))}: <span id="externalImportTargetLabel">${escapeHtml(buildImportTargetLabel(initialTarget))}</span></span>
      </div>
      <div class="header-stack" style="margin-bottom: 12px;">
        ${(sourceGuidelineTitles.length
          ? sourceGuidelineTitles.map((title) => `<span class="tag">${escapeHtml(title)}</span>`).join('')
          : `<span class="tag">${escapeHtml(langText('Saltinyje nesusieta su gairėmis', 'No linked guidelines in source'))}</span>`)}
      </div>
      <div id="externalImportError" class="error" style="display:none;"></div>
      <form id="externalInitiativeImportForm" class="login-form login-form-auth strategy-create-form">
        ${targets.length > 1 ? `
          <label class="auth-label" for="externalImportTargetStrategy">${escapeHtml(langText('Tiksline strategija', 'Target strategy'))}</label>
          <select id="externalImportTargetStrategy" name="targetStrategySlug">${buildImportTargetStrategyOptions(targets, initialTarget.strategySlug)}</select>
        ` : ''}
        <label class="auth-label" for="externalImportInitiativeTitle">${escapeHtml(langText('Pavadinimas', 'Title'))}</label>
        <input id="externalImportInitiativeTitle" type="text" name="title" value="${escapeHtml(sourceInitiative.title || '')}" required />
        <label class="auth-label" for="externalImportInitiativeDescription">${escapeHtml(langText('Aprasymas', 'Description'))}</label>
        <textarea id="externalImportInitiativeDescription" name="description" rows="5">${escapeHtml(sourceInitiative.description || '')}</textarea>
        <label class="auth-label">${escapeHtml(langText('Priskirti prie siu jusu strategijos gairiu', 'Link to these guidelines in your strategy'))}</label>
        <div id="externalImportInitiativeGuidelineList"></div>
        <p class="prompt auth-hint">${escapeHtml(langText('Automatiskai pazymetos gairės, kuriu pavadinimai sutapo su saltinio iniciatyvos gairėmis.', 'Guidelines with titles matching the source initiative links were preselected automatically.'))}</p>
        <button id="submitExternalInitiativeImport" class="btn btn-primary" type="submit">${escapeHtml(langText('Sukurti pasiulyma', 'Create proposal'))}</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector('#closeExternalImportModal');
  const form = overlay.querySelector('#externalInitiativeImportForm');
  const errorNode = overlay.querySelector('#externalImportError');
  const targetSelect = overlay.querySelector('#externalImportTargetStrategy');
  const targetLabelNode = overlay.querySelector('#externalImportTargetLabel');
  const guidelineListNode = overlay.querySelector('#externalImportInitiativeGuidelineList');
  const submitButton = overlay.querySelector('#submitExternalInitiativeImport');
  let activeTarget = initialTarget;
  let activeTargetGuidelines = [];

  const setError = (message) => {
    if (!(errorNode instanceof HTMLElement)) return;
    const text = String(message || '').trim();
    errorNode.textContent = text;
    errorNode.style.display = text ? 'block' : 'none';
  };

  const applyTarget = async (target) => {
    activeTarget = target;
    if (targetLabelNode instanceof HTMLElement) {
      targetLabelNode.textContent = buildImportTargetLabel(target);
    }
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
    const allTargetGuidelines = await loadExternalImportTargetGuidelines(target);
    activeTargetGuidelines = allTargetGuidelines.filter((guideline) =>
      String(guideline?.status || '').trim().toLowerCase() === 'active'
    );
    const defaultGuidelineIds = matchImportGuidelineIdsByTitle(sourceGuidelineTitles, activeTargetGuidelines);
    if (guidelineListNode instanceof HTMLElement) {
      guidelineListNode.innerHTML = renderGuidelineCheckboxList(activeTargetGuidelines, {
        selectedIds: defaultGuidelineIds,
        disabled: false
      });
    }
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = !activeTargetGuidelines.length;
    }
  };

  closeButton?.addEventListener('click', closeExternalImportModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeExternalImportModal();
  });
  targetSelect?.addEventListener('change', async () => {
    const selectedTarget = targets.find((item) => normalizeSlug(item?.strategySlug) === normalizeSlug(targetSelect.value)) || activeTarget;
    try {
      setError('');
      await applyTarget(selectedTarget);
    } catch (error) {
      setError(toUserMessage(error));
    }
  });
  try {
    await applyTarget(initialTarget);
  } catch (error) {
    closeExternalImportModal();
    notifyError(toUserMessage(error));
    return;
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!(submitButton instanceof HTMLButtonElement)) return;
    submitButton.disabled = true;
    setError('');
    try {
      const fd = new FormData(form);
      const guidelineIds = fd.getAll('guidelineIds').map((item) => String(item || '').trim()).filter(Boolean);
      if (!guidelineIds.length) {
        throw new Error(langText('Pasirinkite bent viena tiksline gaire savo strategijoje.', 'Select at least one target guideline in your strategy.'));
      }
      const payload = await api(`/api/v1/cycles/${encodeURIComponent(activeTarget.cycleId)}/import-initiative-proposals`, {
        method: 'POST',
        body: {
          sourceInitiativeId: sourceInitiative.id,
          title: String(fd.get('title') || '').trim(),
          description: String(fd.get('description') || '').trim(),
          guidelineIds
        }
      });
      closeExternalImportModal();
      notifySuccess(
        langText(
          `Iniciatyvos pasiulymas sukurtas strategijai "${activeTarget.strategyTitle || activeTarget.cycleTitle || '-'}".`,
          `Initiative proposal created for "${activeTarget.strategyTitle || activeTarget.cycleTitle || '-'}".`
        )
      );
      return payload;
    } catch (error) {
      setError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
    }
  });
}

function closePlatformPopups() {
  [
    'strategyAiProgressOverlay',
    'strategyCreateOverlay',
    'loginOverlay',
    'accessRequestOverlay',
    'externalImportOverlay'
  ].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.remove();
  });
  state.strategySwitcherDialogOpen = false;
}

function showStrategyCreateModal() {
  if (!canManageSelectedInstitution()) {
    notifyError(currentLanguage() === 'en'
      ? 'Only institution admin can create strategies in selected institution.'
      : 'Strategijas Å¡ioje institucijoje gali kurti tik institucijos administratorius.');
    return;
  }

  const ui = strategyCreateUiText();
  let overlay = document.getElementById('strategyCreateOverlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'strategyCreateOverlay';
  overlay.className = 'login-overlay strategy-create-overlay';
  overlay.innerHTML = `
    <div class="login-card strategy-create-card">
      <div class="header-row" style="margin-bottom: 8px;">
        <h2>${escapeHtml(ui.title)}</h2>
        <button id="closeStrategyCreateModal" class="btn btn-ghost" type="button">${escapeHtml(ui.close)}</button>
      </div>
      <p class="prompt auth-hint">${escapeHtml(ui.subtitle)}</p>
      <div id="strategyCreateError" class="error" style="display:none;"></div>

      <div class="strategy-create-mode-tabs">
        <button type="button" class="btn btn-ghost strategy-create-tab is-active" data-mode="manual">${escapeHtml(ui.manualTab)}</button>
        <button type="button" class="btn btn-ghost strategy-create-tab" data-mode="ai">${escapeHtml(ui.aiTab)}</button>
      </div>

      <section class="strategy-create-shared-fields">
        <h3 class="strategy-create-section-title">${escapeHtml(ui.strategySetup)}</h3>
        <label class="auth-label" for="strategyCreateTitle">${escapeHtml(ui.strategyTitle)}</label>
        <input id="strategyCreateTitle" type="text" name="strategyTitle" required />
        <label class="auth-label" for="strategyCreateSlug">${escapeHtml(ui.strategySlug)}</label>
        <input id="strategyCreateSlug" type="text" name="strategySlug" />
        <label class="auth-label" for="strategyCreateDescription">${escapeHtml(ui.strategyDescription)}</label>
        <textarea id="strategyCreateDescription" name="strategyDescription" rows="4"></textarea>
      </section>

      <form id="strategyCreateManualForm" class="login-form login-form-auth strategy-create-form">
        <button class="btn btn-primary" type="submit">${escapeHtml(ui.createManual)}</button>
      </form>

      <form id="strategyCreateAiForm" class="login-form login-form-auth strategy-create-form" enctype="multipart/form-data" hidden>
        <h3 class="strategy-create-section-title">${escapeHtml(ui.aiSetup)}</h3>
        <label class="auth-label" for="strategyAiLocale">${escapeHtml(ui.localeHint)}</label>
        <select id="strategyAiLocale" name="localeHint">
          <option value="lt">LT</option>
          <option value="en">EN</option>
        </select>
        <label class="auth-label" for="strategyAiClarification">${escapeHtml(ui.clarification)}</label>
        <textarea id="strategyAiClarification" name="clarification" rows="4" placeholder="${escapeHtml(ui.clarificationPlaceholder)}" required></textarea>
        <label class="auth-label" for="strategyAiDocs">${escapeHtml(ui.documents)}</label>
        <input id="strategyAiDocs" type="file" name="documents" accept="application/pdf,.pdf" multiple required />
        <button class="btn btn-primary" type="submit">${escapeHtml(ui.createAi)}</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector('#closeStrategyCreateModal');
  const errorNode = overlay.querySelector('#strategyCreateError');
  const tabButtons = Array.from(overlay.querySelectorAll('.strategy-create-tab'));
  const manualForm = overlay.querySelector('#strategyCreateManualForm');
  const aiForm = overlay.querySelector('#strategyCreateAiForm');
  const commonTitleInput = overlay.querySelector('#strategyCreateTitle');
  const commonSlugInput = overlay.querySelector('#strategyCreateSlug');
  const commonDescriptionInput = overlay.querySelector('#strategyCreateDescription');
  let generationInProgress = false;
  const safeRefreshAfterCreate = async () => {
    try {
      await bootstrap();
      return true;
    } catch (error) {
      notifyError(toUserMessage(error));
      return false;
    }
  };

  const closeModal = () => {
    if (generationInProgress) return;
    const current = document.getElementById('strategyCreateOverlay');
    if (current) current.remove();
  };

  const setError = (message) => {
    if (!(errorNode instanceof HTMLElement)) return;
    const text = String(message || '').trim();
    errorNode.textContent = text;
    errorNode.style.display = text ? 'block' : 'none';
  };

  const setMode = (mode) => {
    const next = mode === 'ai' ? 'ai' : 'manual';
    tabButtons.forEach((button) => {
      const active = String(button.dataset.mode || '') === next;
      button.classList.toggle('is-active', active);
      button.classList.toggle('btn-primary', active);
      button.classList.toggle('btn-ghost', !active);
    });
    if (manualForm instanceof HTMLElement) manualForm.hidden = next !== 'manual';
    if (aiForm instanceof HTMLElement) aiForm.hidden = next !== 'ai';
    if (commonTitleInput instanceof HTMLInputElement) {
      commonTitleInput.required = next === 'manual';
    }
    setError('');
  };

  const syncCreatedStrategy = async (strategySlug) => {
    const nextSlug = normalizeSlug(strategySlug);
    if (!nextSlug) return;
    if (nextSlug !== normalizeSlug(state.strategySlug)) {
      clearRouteEntity();
    }
    state.strategySlug = nextSlug;
    rememberStrategySlugForInstitution(state.institutionSlug, nextSlug);
    state.strategy = null;
    state.strategySwitcherDialogOpen = false;
    syncRouteState();
    if (isAuthenticated() && !state.embedMapMode) {
      try {
        await switchInstitutionSession(state.institutionSlug, nextSlug);
      } catch (error) {
        const raw = String(error?.message || '').toLowerCase();
        if (raw === 'invalid token' || raw === 'unauthorized') {
          clearSession();
        }
      }
    }
  };

  closeButton?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setMode(String(button.dataset.mode || 'manual'));
    });
  });

  manualForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const submitButton = manualForm.querySelector('button[type="submit"]');
    if (!(submitButton instanceof HTMLButtonElement)) return;
    submitButton.disabled = true;
    try {
      const title = String(commonTitleInput?.value || '').trim();
      const slug = String(commonSlugInput?.value || '').trim();
      const description = String(commonDescriptionInput?.value || '').trim();
      if (!title) return;

      const payload = await api('/api/v1/admin/strategies', {
        method: 'POST',
        body: { title, slug, description }
      });
      await syncCreatedStrategy(payload?.strategy?.slug);
      clearRouteEntityForView('map');
      state.activeView = 'map';
      syncRouteState();
      closePlatformPopups();
      await safeRefreshAfterCreate();
      showStrategyCreationConfetti();
      notifySuccess(`${ui.successManual} ${String(payload?.strategy?.title || title).trim()}`);
    } catch (error) {
      const message = toUserMessage(error);
      setError(message);
      notifyError(message);
    } finally {
      submitButton.disabled = false;
    }
  });

  aiForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const submitButton = aiForm.querySelector('button[type="submit"]');
    if (!(submitButton instanceof HTMLButtonElement)) return;
    submitButton.disabled = true;
    generationInProgress = true;
    if (closeButton instanceof HTMLButtonElement) closeButton.disabled = true;
    tabButtons.forEach((button) => {
      if (button instanceof HTMLButtonElement) button.disabled = true;
    });
    const progress = startStrategyAiProgress(ui);
    try {
      const requestStartedAtIso = new Date().toISOString();
      const fd = new FormData();
      const localeInput = overlay.querySelector('#strategyAiLocale');
      const clarificationInput = overlay.querySelector('#strategyAiClarification');
      const docsInput = overlay.querySelector('#strategyAiDocs');
      const requestedTitle = String(commonTitleInput?.value || '').trim();
      const requestedSlug = String(commonSlugInput?.value || '').trim();
      fd.set('strategyTitle', requestedTitle);
      fd.set('strategySlug', requestedSlug);
      fd.set('strategyDescription', String(commonDescriptionInput?.value || '').trim());
      fd.set('localeHint', String(localeInput?.value || 'lt').trim());
      fd.set('clarification', String(clarificationInput?.value || '').trim());
      const selectedFiles = Array.from(docsInput?.files || []);
      selectedFiles.forEach((file) => fd.append('documents', file));
      const files = fd.getAll('documents').filter((file) => file instanceof File && file.size > 0);
      if (!files.length) throw new Error('at least one pdf file required');
      if (progress) {
        await progress.markAnalysing();
      }

      let payload = null;
      try {
        const response = await api('/api/v1/admin/strategies/ai-generate', {
          method: 'POST',
          body: fd
        });
        if (response?.generation?.id) {
          if (progress) {
            progress.setStatus(ui.progressRecovering || ui.progressPreparing);
            progress.bumpTarget(97);
          }
          payload = await waitForAdminAiGenerationById({
            generationId: response.generation.id,
            progress,
            ui
          });
        } else {
          payload = response;
        }
      } catch (error) {
        if (!isGatewayTimeoutError(error)) throw error;
        if (progress) {
          progress.setStatus(ui.progressRecovering || ui.progressPreparing);
          progress.bumpTarget(97);
        }
        const recovered = await recoverAiGenerationAfterGatewayTimeout({
          sinceIso: requestStartedAtIso,
          expectedTitle: requestedTitle,
          expectedSlug: requestedSlug
        });
        if (!recovered?.strategy?.slug) throw error;
        payload = {
          strategy: recovered.strategy,
          cycle: recovered.cycle || null
        };
      }
      if (progress) await progress.markPreparing();
      await syncCreatedStrategy(payload?.strategy?.slug);
      if (progress) await progress.complete();
      clearRouteEntityForView('map');
      state.activeView = 'map';
      syncRouteState();
      closePlatformPopups();
      await safeRefreshAfterCreate();
      showStrategyCreationConfetti();
      notifySuccess(`${ui.successAi} ${String(payload?.strategy?.title || '-').trim() || '-'}`);
    } catch (error) {
      if (progress) progress.fail();
      const message = toUserMessage(error);
      setError(message);
      notifyError(message);
    } finally {
      generationInProgress = false;
      if (closeButton instanceof HTMLButtonElement) closeButton.disabled = false;
      tabButtons.forEach((button) => {
        if (button instanceof HTMLButtonElement) button.disabled = false;
      });
      submitButton.disabled = false;
    }
  });

  setMode('manual');
}

function accessRequestUiText() {
  if (currentLanguage() === 'en') {
    return {
      title: 'Access request',
      description: 'Share short details and we will review your request.',
      institution: 'Institution',
      fullName: 'Full name',
      workEmail: 'Work email',
      phone: 'Contact phone number',
      notes: 'Additional information (optional)',
      submit: 'Submit request',
      close: 'Close',
      success: 'Request received. Registered as: ',
      linkedinLead: 'You can also contact directly on LinkedIn:'
    };
  }
  return {
    title: 'Prieigos užklausa',
    description: 'Pateikite trumpą informaciją ir peržiūrėsime jūsų užklausą.',
    institution: 'Institucija',
    fullName: 'Vardas ir pavardė',
    workEmail: 'Darbinis el. paštas',
    phone: 'Kontaktinis telefono numeris',
    notes: 'Papildoma informacija (nebūtina)',
    submit: 'Pateikti užklausą',
    close: 'Uždaryti',
    success: 'Užklausa gauta. Užregistruota: ',
    linkedinLead: 'Taip pat galite susisiekti tiesiogiai per LinkedIn:'
  };
}

function showAccessRequestModal() {
  const ui = accessRequestUiText();

  let overlay = document.getElementById('accessRequestOverlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'accessRequestOverlay';
  overlay.className = 'login-overlay';
  overlay.innerHTML = `
    <div class="login-card access-request-card">
      <div class="header-row" style="margin-bottom: 8px;">
        <h2>${escapeHtml(ui.title)}</h2>
        <button id="closeAccessRequestModal" class="btn btn-ghost" type="button">${escapeHtml(ui.close)}</button>
      </div>
      <p class="prompt auth-hint">${escapeHtml(ui.description)}</p>
      <div id="accessRequestError" class="error" style="display:none;"></div>
      <div id="accessRequestSuccess" class="prompt auth-hint" style="display:none;"></div>

      <form id="accessRequestForm" class="login-form login-form-auth access-request-form">
        <label class="auth-label" for="accessRequestInstitution">${escapeHtml(ui.institution)}</label>
        <input id="accessRequestInstitution" type="text" name="institutionName" required />
        <label class="auth-label" for="accessRequestFullName">${escapeHtml(ui.fullName)}</label>
        <input id="accessRequestFullName" type="text" name="fullName" required />
        <label class="auth-label" for="accessRequestWorkEmail">${escapeHtml(ui.workEmail)}</label>
        <input id="accessRequestWorkEmail" type="email" name="workEmail" required />
        <label class="auth-label" for="accessRequestPhone">${escapeHtml(ui.phone)}</label>
        <input id="accessRequestPhone" type="text" name="phone" required />
        <label class="auth-label" for="accessRequestNotes">${escapeHtml(ui.notes)}</label>
        <textarea id="accessRequestNotes" name="notes" rows="4"></textarea>
        <div style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;" aria-hidden="true">
          <label for="accessRequestOrgWebsite">Organization website</label>
          <input id="accessRequestOrgWebsite" type="text" name="organizationWebsite" tabindex="-1" autocomplete="off" />
        </div>
        <button class="btn btn-primary" type="submit">${escapeHtml(ui.submit)}</button>
      </form>
      <p class="prompt auth-hint" style="margin-top:8px;">
        ${escapeHtml(ui.linkedinLead)}
        <a href="https://www.linkedin.com/in/lukaslukosevicius/" target="_blank" rel="noopener noreferrer">Lukas Lukosevičius</a>.
      </p>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector('#closeAccessRequestModal');
  const form = overlay.querySelector('#accessRequestForm');
  const errorNode = overlay.querySelector('#accessRequestError');
  const successNode = overlay.querySelector('#accessRequestSuccess');

  const closeModal = () => {
    const current = document.getElementById('accessRequestOverlay');
    if (current) current.remove();
  };

  const clearMessages = () => {
    if (errorNode) {
      errorNode.textContent = '';
      errorNode.style.display = 'none';
    }
    if (successNode) {
      successNode.textContent = '';
      successNode.style.display = 'none';
    }
  };

  closeButton?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    if (!(submitButton instanceof HTMLButtonElement)) return;
    submitButton.disabled = true;
    clearMessages();
    try {
      const fd = new FormData(form);
      const payload = await api('/api/v1/public/access-requests', {
        method: 'POST',
        auth: false,
        body: {
          institutionName: String(fd.get('institutionName') || '').trim(),
          fullName: String(fd.get('fullName') || '').trim(),
          workEmail: String(fd.get('workEmail') || '').trim(),
          phone: String(fd.get('phone') || '').trim(),
          notes: String(fd.get('notes') || '').trim(),
          organizationWebsite: String(fd.get('organizationWebsite') || '').trim()
        }
      });
      const requestCode = String(payload?.requestCode || '').trim();
      const message = `${ui.success}${requestCode || '-'}`;
      if (successNode) {
        successNode.textContent = message;
        successNode.style.display = 'block';
      }
      notifySuccess(message);
      form.reset();
    } catch (error) {
      const message = toUserMessage(error);
      if (errorNode) {
        errorNode.textContent = message;
        errorNode.style.display = 'block';
      }
      notifyError(message);
    } finally {
      submitButton.disabled = false;
    }
  });
}

function render() {
  refreshBrandMapLink();
  renderSteps();
  syncRouteState();
  renderIntroDeck();
  renderInstitutionPicker();
  renderStepView();
  renderUserBar();
  renderVoteFloating();
  flushPendingAddSectionScroll();
  flushPendingGuidelineFocus();
  flushPendingInitiativeFocus();
  window.dispatchEvent(new CustomEvent('uzt-rendered'));
}







