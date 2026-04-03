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
    prompt: 'Kokias konkrečias iniciatyvas įgyvendinsime?'
  }
];

const introSlides = [
  {
    title: '1. Pasirinkite instituciją',
    body: 'digistrategy.eu sistema skirta patogiam jūsų institucijos strategijos rengimo procesui.',
    points: [
      'Viršuje dešinėje pasirinkite instituciją, kurios strategiją norite peržiūrėti ar administruoti.',
      'Instituciją galima keisti bet kada, duomenys persikrauna automatiškai.'
    ]
  },
  {
    title: '2. Sukurkite gairių struktūrą',
    body: 'Patogiai susikurkite gairių struktūrą ir aiškiai apibrėžkite strategijos kryptis.',
    points: [
      'Gairės grupuojamos pagal ryšius: tėvinės, vaikinės ir našlaitinės.',
      'Tai pagrindinis kortelių valdymo modulio etapas.'
    ]
  },
  {
    title: '3. Priskirkite iniciatyvas',
    body: 'Skiltyje "Iniciatyvos" priskirkite konkrečias iniciatyvas gairių įgyvendinimui.',
    points: [
      'Kiekviena iniciatyva turi būti susieta bent su viena gaire.',
      'Taip kuriamas aiškus ryšys tarp krypties ir veiksmų.'
    ]
  },
  {
    title: '4. Komentuokite ir siūlykite kryptis',
    body: 'Kortelių valdymo modulyje jūsų kolegos gali komentuoti ir siūlyti įvairias strategijos kryptis.',
    points: [
      'Diskusijos vyksta prie konkrečių gairių ir iniciatyvų.',
      'Neprisijungęs lankytojas mato tik viešą informaciją.'
    ]
  },
  {
    title: '5. Balsuokite už pasiūlymus',
    body: 'Nariai gali balsuoti už vieni kitų teiktus pasiūlymus gairiuose ir iniciatyvose.',
    points: [
      'Balsai skiriami "+" ir "-" mygtukais.',
      'Kol ciklas atviras, balsus galima koreguoti.'
    ]
  },
  {
    title: '6. Naudokite strategijų žemėlapį',
    body: 'Strategijų žemėlapis yra patogus vizualinis įrankis peržiūrėti strategijos struktūrą ir elementų ryšius.',
    points: [
      'Galite perjungti sluoksnius "Gairės" ir "Iniciatyvos".',
      'Galima centruoti vaizdą, priartinti ir naudoti pilno ekrano režimą.'
    ]
  },
  {
    title: '7. Užbaikite strategijos ciklą',
    body: 'Kai diskusijos baigtos, administratorius uždaro ciklą ir strategija lieka peržiūros režime.',
    points: [
      'Uždarytame cikle balsavimas ir komentavimas išjungiami.',
      'Santrauką galima eksportuoti į tekstą arba JSON.'
    ]
  },
  {
    title: '8. Įkelkite žemėlapį su embed funkcija',
    body: 'Galutinį interaktyvų strategijos žemėlapį įkelkite į intranetą ar vidinį puslapį naudodami embedding funkcionalumą.',
    points: [
      'Admin skiltyje "Embed: Strategijų žemėlapis" nukopijuokite paruoštą iframe kodą.',
      'Sistema skirta valstybinėms institucijoms, siekiančioms strategijos kūrimo procesą vykdyti efektyviai.'
    ]
  }
];

const DEFAULT_MISSION_TEXT = 'Organizacijos paskirtis ir vertės kūrimo logika.';
const DEFAULT_VISION_TEXT = 'Ilgalaikė kryptis ir siekiama pokyčio būsena.';
const DEFAULT_GUIDE_INTRO_TEXT = [
  'digistrategy.eu sistema skirta patogiam jūsų institucijos strategijos rengimo procesui. Patogiai susikurkite gairių struktūrą ir priskirkite konkrečias iniciatyvas tų gairių įgyvendinimui.',
  'Sistema susideda iš 2 pagrindinių dalių:',
  '1. Kortelių valdymo modulio (Gairės ir Iniciatyvos) - čia jūsų kolegos gali komentuoti, siūlyti įvairias strategijos kryptis, balsuoti už vieni kitų teiktus pasiūlymus.',
  '2. Strategijų žemėlapis - patogus vizualinis įrankis peržiūrėti strategijos struktūrą ir ryšius tarp skirtingų jos elementų.',
  'Galutinį savo interaktyvų strategijos žemėlapį įkelkite į intranetą ar vidinį puslapį su embedding funkcionalumu. Sistema skirta valstybinėms institucijoms, kurios nori savo strategijos kūrimo procesą vykdyti efektyviai.'
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
  'clarity-gremlin',
  'policy-alignment',
  'history',
  'admin',
  'map',
  'guide'
]);
const CLARITY_GREMLIN_SUPPORTED_VIEWS = new Set([
  'guidelines',
  'guideline-detail',
  'initiatives',
  'initiative-detail',
  'implementation-plan',
  'map'
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
const CLARITY_GREMLIN_QUERY_KEY = 'gremlin';
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
  mapGuidelinesShowInitiatives: false,
  guidelinesShowInitiatives: false,
  implementationPlanLayer: resolveInitialImplementationPlanLayer(),
  implementationPlanSubview: resolveInitialImplementationPlanSubview(),
  clarityGremlinWorkspaceTab: resolveInitialClarityGremlinWorkspaceTab(),
  clarityGremlinLaunchContextView: '',
  clarityGremlinLaunchContextEntityId: '',
  mapStrategicLinksData: null,
  mapStrategicLinksLoading: false,
  mapStrategicLinksError: '',
  mapStrategicLinksPromise: null,
  mapStrategicLinkSuggestions: null,
  mapStrategicLinkSuggestionsLoading: false,
  mapStrategicLinkSuggestionsError: '',
  mapStrategicLinkUsage: null,
  mapStrategicLinkUsageLoading: false,
  mapStrategicLinkUsageCycleId: '',
  mapStrategicLinkUsagePromise: null,
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
  mapInstitutionPulseTimerId: 0,
  userMenuOpen: false
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

function normalizeClarityGremlinWorkspaceTab(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'review' || normalized === 'strategic-links' || normalized === 'pdf' || normalized === 'policy-alignment') return normalized;
  return 'home';
}

function resolveInitialClarityGremlinWorkspaceTab() {
  const params = new URLSearchParams(window.location.search);
  return normalizeClarityGremlinWorkspaceTab(params.get(CLARITY_GREMLIN_QUERY_KEY));
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

  if (nextView === 'clarity-gremlin') {
    params.set(CLARITY_GREMLIN_QUERY_KEY, normalizeClarityGremlinWorkspaceTab(state.clarityGremlinWorkspaceTab));
  } else {
    params.delete(CLARITY_GREMLIN_QUERY_KEY);
  }

  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

function syncRouteState(historyMode = 'replace') {
  const nextHref = buildCurrentPageHref();
  const currentHref = `${window.location.pathname}${window.location.search}`;
  if (nextHref !== currentHref) {
    const method = historyMode === 'push' ? 'pushState' : 'replaceState';
    window.history[method](null, '', nextHref);
  }
}

function pushRouteState() {
  syncRouteState('push');
}

function applyLocationState() {
  const previousView = state.activeView;
  state.institutionSlug = resolveInstitutionSlug();
  state.strategySlug = resolveStrategySlug();
  state.activeView = resolveInitialView();
  state.routeEntityKind = resolveRouteEntityKind();
  state.routeEntityId = resolveRouteEntityId();
  state.implementationPlanLayer = resolveInitialImplementationPlanLayer();
  state.implementationPlanSubview = resolveInitialImplementationPlanSubview();
  state.clarityGremlinWorkspaceTab = resolveInitialClarityGremlinWorkspaceTab();

  if (state.activeView !== 'map' && previousView === 'map') {
    resetMapInitiativeFocusState();
  }
}

async function handleBrowserPopState() {
  const previousInstitutionSlug = normalizeSlug(state.institutionSlug);
  const previousStrategySlug = normalizeSlug(state.strategySlug);
  applyLocationState();

  const needsBootstrap = (
    previousInstitutionSlug !== normalizeSlug(state.institutionSlug)
    || previousStrategySlug !== normalizeSlug(state.strategySlug)
  );

  if (needsBootstrap) {
    await bootstrap();
    return;
  }

  render();
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
  const copyStrategyUrlLabel = langText('Kopijuoti nuorodą', 'Copy URL');
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
      'Kokias konkrečias iniciatyvas įgyvendinsime?',
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

function sanitizeRichTextHtml(value) {
  const source = String(value || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!source) return '';

  const template = document.createElement('template');
  template.innerHTML = source.replace(/\n/g, '<br>');
  const container = document.createElement('div');
  const allowedTags = new Set(['STRONG', 'B', 'EM', 'I', 'U', 'BR', 'DIV', 'P']);

  const sanitizeNode = (node) => {
    if (!node) return null;
    if (node.nodeType === 3) {
      return document.createTextNode(node.textContent || '');
    }
    if (node.nodeType !== 1) return null;

    const tagName = String(node.nodeName || '').toUpperCase();
    if (!allowedTags.has(tagName)) {
      const fragment = document.createDocumentFragment();
      node.childNodes.forEach((child) => {
        const sanitizedChild = sanitizeNode(child);
        if (sanitizedChild) fragment.appendChild(sanitizedChild);
      });
      return fragment;
    }

    if (tagName === 'BR') {
      return document.createElement('br');
    }

    if (tagName === 'DIV' || tagName === 'P') {
      const fragment = document.createDocumentFragment();
      let hasVisibleChild = false;
      node.childNodes.forEach((child) => {
        const sanitizedChild = sanitizeNode(child);
        if (!sanitizedChild) return;
        if (sanitizedChild.nodeType === 3 && String(sanitizedChild.textContent || '').trim()) {
          hasVisibleChild = true;
        }
        if (sanitizedChild.nodeType === 1 || sanitizedChild.nodeType === 11) {
          hasVisibleChild = true;
        }
        fragment.appendChild(sanitizedChild);
      });
      if (hasVisibleChild) {
        fragment.appendChild(document.createElement('br'));
      }
      return fragment;
    }

    const normalizedTag = tagName === 'B'
      ? 'strong'
      : tagName === 'I'
        ? 'em'
        : tagName.toLowerCase();
    const element = document.createElement(normalizedTag);
    node.childNodes.forEach((child) => {
      const sanitizedChild = sanitizeNode(child);
      if (sanitizedChild) element.appendChild(sanitizedChild);
    });
    return element;
  };

  template.content.childNodes.forEach((child) => {
    const sanitizedChild = sanitizeNode(child);
    if (sanitizedChild) container.appendChild(sanitizedChild);
  });

  return container.innerHTML
    .replace(/(?:<br>\s*){3,}/gi, '<br><br>')
    .trim();
}

function normalizeRichTextValue(value) {
  return sanitizeRichTextHtml(value);
}

function renderRichTextContent(value, fallbackText) {
  const sanitized = sanitizeRichTextHtml(value);
  if (!sanitized) {
    return `<div class="rich-text-content is-empty">${escapeHtml(fallbackText || '')}</div>`;
  }
  return `<div class="rich-text-content">${sanitized}</div>`;
}

function richTextToPlainText(value, fallbackText = '') {
  const sanitized = sanitizeRichTextHtml(value);
  if (!sanitized) return String(fallbackText || '').trim();
  const helper = document.createElement('div');
  helper.innerHTML = sanitized.replace(/<br\s*\/?>/gi, '\n');
  return String(helper.textContent || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderRichTextEditor({
  name,
  value = '',
  placeholder = '',
  disabled = false,
  textareaClass = ''
} = {}) {
  const classes = ['rich-text-input', textareaClass].filter(Boolean).join(' ');
  const disabledAttr = disabled ? 'disabled' : '';
  const sanitizedValue = sanitizeRichTextHtml(value);
  return `
    <div class="rich-text-editor">
      <div class="rich-text-toolbar" role="toolbar" aria-label="${escapeHtml(langText('Teksto formatavimas', 'Text formatting'))}">
        <button type="button" class="btn btn-ghost rich-text-toolbar-btn" data-action="format-rich-text" data-command="bold" title="${escapeHtml(langText('Paryskinti', 'Bold'))}" ${disabledAttr}><strong>B</strong></button>
        <button type="button" class="btn btn-ghost rich-text-toolbar-btn" data-action="format-rich-text" data-command="italic" title="${escapeHtml(langText('Pasvyras', 'Italic'))}" ${disabledAttr}><em>I</em></button>
        <button type="button" class="btn btn-ghost rich-text-toolbar-btn" data-action="format-rich-text" data-command="underline" title="${escapeHtml(langText('Pabraukti', 'Underline'))}" ${disabledAttr}><u>U</u></button>
      </div>
      <div
        class="rich-text-surface ${escapeHtml(textareaClass)}"
        contenteditable="${disabled ? 'false' : 'true'}"
        data-placeholder="${escapeHtml(placeholder)}"
        data-rich-text-surface="1"
        ${disabled ? 'aria-disabled="true"' : ''}
      >${sanitizedValue}</div>
      <textarea class="${escapeHtml(classes)} rich-text-hidden-input" name="${escapeHtml(name)}" ${disabledAttr} tabindex="-1" aria-hidden="true">${escapeHtml(sanitizedValue)}</textarea>
    </div>
  `;
}

function syncRichTextEditor(editor, options = {}) {
  const surface = editor?.querySelector('.rich-text-surface');
  const hiddenInput = editor?.querySelector('.rich-text-hidden-input');
  if (!(surface instanceof HTMLElement) || !(hiddenInput instanceof HTMLTextAreaElement)) return;
  const shouldRewriteSurface = options.rewriteSurface !== false;
  const normalized = sanitizeRichTextHtml(surface.innerHTML);
  if (shouldRewriteSurface && surface.innerHTML !== normalized) {
    surface.innerHTML = normalized;
  }
  hiddenInput.value = normalized;
  surface.classList.toggle('is-empty', !normalized);
}

function applyRichTextFormat(surface, command) {
  if (!(surface instanceof HTMLElement) || surface.getAttribute('contenteditable') !== 'true') return;
  const normalizedCommand = String(command || '').trim().toLowerCase();
  if (!['bold', 'italic', 'underline'].includes(normalizedCommand)) return;
  surface.focus();
  document.execCommand(normalizedCommand, false);
  const editor = surface.closest('.rich-text-editor');
  if (editor instanceof HTMLElement) {
    syncRichTextEditor(editor);
  }
}

function bindRichTextEditors(scope = document) {
  const rootScope = scope instanceof Element || scope instanceof Document ? scope : document;
  rootScope.querySelectorAll('.rich-text-editor').forEach((editor) => {
    if (!(editor instanceof HTMLElement) || editor.dataset.richTextEditorBound === '1') return;
    editor.dataset.richTextEditorBound = '1';
    const surface = editor.querySelector('.rich-text-surface');
    if (surface instanceof HTMLElement) {
      syncRichTextEditor(editor);
      surface.addEventListener('input', () => {
        syncRichTextEditor(editor, { rewriteSurface: false });
      });
      surface.addEventListener('blur', () => {
        syncRichTextEditor(editor);
      });
      surface.addEventListener('paste', (event) => {
        event.preventDefault();
        const text = event.clipboardData?.getData('text/plain') || '';
        document.execCommand('insertText', false, text);
        syncRichTextEditor(editor);
      });
    }
  });
  rootScope.querySelectorAll('[data-action="format-rich-text"]').forEach((button) => {
    if (!(button instanceof HTMLButtonElement) || button.dataset.richTextBound === '1') return;
    button.dataset.richTextBound = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const editor = button.closest('.rich-text-editor');
      const surface = editor?.querySelector('.rich-text-surface');
      applyRichTextFormat(surface, button.dataset.command);
    });
  });
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
    'ai request timed out': 'AI tiekėjas neatsakė laiku. Pabandykite dar kartą.',
    'ai provider error: HTTP 400': 'AI tiekėjas atmetė užklausą (400). Patikrinkite modelio suderinamumą.',
    'ai provider error: HTTP 401': 'AI tiekėjas atmetė API raktą (401).',
    'ai provider error: HTTP 403': 'AI tiekėjas atmetė prieigą (403).',
    'ai provider error: HTTP 404': 'Nurodytas AI modelis arba endpoint nerastas (404).',
    'ai provider error: HTTP 429': 'AI tiekėjas laikinai riboja užklausas (429).',
    'ai provider error: HTTP 500': 'AI tiekėjas laikinai nepasiekiamas (500).',
    'clarification required': 'Nurodykite AI patikslinimÄ….',
    'at least one pdf file required': 'Ä®kelkite bent vienÄ… PDF failÄ….',
    'only pdf files allowed': 'LeidÅ¾iami tik PDF failai.',
    'pdf file too large': 'PDF failas per didelis.',
    'too many pdf files': 'Ä®kelta per daug PDF failÅ³.',
    'pdf parsing failed': 'Nepavyko nuskaityti PDF turinio.',
    'pdf content too large': 'PDF turinys per didelÄ—s apimties.',
    'ai response invalid': 'AI atsakymas netinkamo formato.',
    'ai response language mismatch': 'AI atsakymas ne ta kalba. Pabandykite dar kartÄ….',
    'ai response missing delete draft': currentLanguage() === 'en'
      ? 'The AI response was incomplete. Please run the analysis again.'
      : 'AI atsakymas buvo nepilnas. Paleiskite analizÄ™ dar kartÄ….',
    'generated guidelines missing': 'AI nesugeneravo pakankamai gairiÅ³.',
    'generated initiatives missing': 'AI nesugeneravo pakankamai iniciatyvÅ³.',
    'generationId required': 'TrÅ«ksta generavimo uÅ¾klausos ID.',
    'generation not found': currentLanguage() === 'en'
      ? 'AI generation was not found. Please retry.'
      : 'AI generavimo uÅ¾klausa nerasta. Pabandykite dar kartÄ….',
    'ai generation timeout': currentLanguage() === 'en'
      ? 'AI generation is still running. Please wait and try again shortly.'
      : 'AI generavimas vis dar vyksta. Pabandykite dar po keliÅ³ sekundÅ¾iÅ³.',
    'ai request timed out': currentLanguage() === 'en'
      ? 'AI provider did not respond in time. Please try again.'
      : 'AI tiekÄ—jas neatsakÄ— laiku. Pabandykite dar kartÄ….',
    'ai generation failed': currentLanguage() === 'en'
      ? 'AI generation failed.'
      : 'AI generavimas nepavyko.',
    'view required': 'Trūksta rodinio konteksto.',
    'clarity gremlin unsupported view': currentLanguage() === 'en'
      ? 'Clarity Gremlin does not support this page yet.'
      : 'Aiškumo nykštukas kol kas nepalaiko šio puslapio.',
    'clarity gremlin limit reached': currentLanguage() === 'en'
      ? 'This strategy already used all 10 Clarity Gremlin analyses.'
      : 'Ši strategija jau išnaudojo visus 10 Aiškumo nykštuko kvietimų.',
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
    const error = new Error(payload?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
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

async function loadStrategyMap({ preserveStrategicSuggestions = false } = {}) {
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
  if (!preserveStrategicSuggestions) {
    state.mapStrategicLinkSuggestions = null;
    state.mapStrategicLinkSuggestionsLoading = false;
    state.mapStrategicLinkSuggestionsError = '';
  }
  state.mapStrategicLinkUsage = null;
  state.mapStrategicLinkUsageLoading = false;
  state.mapStrategicLinkUsageCycleId = '';
  state.mapStrategicLinkUsagePromise = null;
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

function strategicLinkGremlinUiText() {
  return currentLanguage() === 'en'
    ? {
        title: 'Clarity Gremlin',
        subtitle: 'Search for strategic link suggestions across other strategies.',
        search: 'Search strategic links',
        searching: 'Searching strategic links...',
        sameInstitution: 'Within same institution',
        otherInstitutions: 'Other institution strategies',
        noCycle: 'Select an active strategy first.',
        loginRequired: 'Sign in to search strategic links.',
        ready: 'Run Clarity Gremlin to compare this strategy against other strategies.',
        empty: 'No strong strategic link suggestions found yet.',
        rationale: 'Rationale',
        confidence: 'Confidence',
        currentStrategy: 'Current strategy',
        suggestedTarget: 'Suggested target',
        create: 'Create link',
        creating: 'Creating link...',
        dismiss: 'Dismiss',
        openTarget: 'Review target',
        viewOnly: 'View only',
        created: 'Strategic link created.',
        createdState: 'Link created',
        createdHint: 'This strategic link has been created and is now visible in the map.',
        dismissed: 'Strategic link suggestion dismissed.',
        sameEmpty: 'No same-institution suggestions.',
        otherEmpty: 'No cross-institution suggestions.',
        createRestricted: 'Cross-institution suggestions are read-only in this MVP.',
        suggestedAction: 'Suggested action',
        sameInstitutionAction: 'Review the suggested target and create a strategic link if it fits.',
        otherInstitutionAction: 'Review the suggested target as an external reference or benchmarking example.',
        overlayLoading: 'Clarity Gremlin is searching strategic links...',
        overlayHint: 'Comparing the current strategy against other strategy directions.',
        usage: 'Usage',
        usageLoading: 'Loading quota...',
        limitReached: 'Strategic link search quota reached for this strategy.',
        limitReachedHint: 'Ask a meta-admin to allocate more strategic-link analyses for this institution.',
        lastScanned: 'Last scanned'
      }
    : {
        title: 'Clarity Gremlin',
        subtitle: 'Ieško galimų strateginių ryšių su kitomis strategijomis.',
        search: 'Ieškoti strateginių ryšių',
        searching: 'Ieškomi strateginiai ryšiai...',
        sameInstitution: 'Toje pačioje institucijoje',
        otherInstitutions: 'Kitų institucijų strategijos',
        noCycle: 'Pirmiausia pasirinkite aktyvią strategiją.',
        loginRequired: 'Prisijunkite, kad galėtumėte ieškoti strateginių ryšių.',
        ready: 'Paleiskite Clarity Gremlin, kad palygintumėte šią strategiją su kitomis strategijomis.',
        empty: 'Stiprių strateginių ryšių pasiūlymų kol kas nerasta.',
        rationale: 'Pagrindimas',
        confidence: 'Patikimumas',
        currentStrategy: 'Dabartinė strategija',
        suggestedTarget: 'Siūlomas taikinys',
        create: 'Sukurti ryšį',
        creating: 'Kuriamas ryšys...',
        dismiss: 'Paslėpti',
        openTarget: 'Peržiūrėti taikinį',
        viewOnly: 'Tik peržiūra',
        created: 'Strateginis ryšys sukurtas.',
        createdState: 'Ryšys sukurtas',
        createdHint: 'Šis strateginis ryšys jau sukurtas ir dabar matomas žemėlapyje.',
        dismissed: 'Strateginio ryšio pasiūlymas paslėptas.',
        sameEmpty: 'Toje pačioje institucijoje pasiūlymų nerasta.',
        otherEmpty: 'Su kitomis institucijomis pasiūlymų nerasta.',
        createRestricted: 'Kitų institucijų pasiūlymai šiame MVP rodomi tik peržiūrai.',
        suggestedAction: 'Siūlomas veiksmas',
        sameInstitutionAction: 'Peržiūrėkite siūlomą taikinį ir, jei jis tinka, sukurkite strateginį ryšį.',
        otherInstitutionAction: 'Peržiūrėkite siūlomą taikinį kaip išorinę nuorodą ar įkvėpimo pavyzdį.',
        overlayLoading: 'Clarity Gremlin ieško strateginių ryšių...',
        overlayHint: 'Lyginamos dabartinės strategijos gairės su kitų strategijų kryptimis.',
        usage: 'Panaudojimas',
        usageLoading: 'Kraunama kvota...',
        limitReached: 'Šiai strategijai strateginių ryšių paieškos kvota išnaudota.',
        limitReachedHint: 'Meta-admin gali šiai institucijai skirti daugiau strateginių ryšių analizių.',
        lastScanned: 'Paskutinį kartą tikrinta'
      };
}

function strategicLinkConfidenceLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (currentLanguage() === 'en') {
    if (normalized === 'high') return 'High';
    if (normalized === 'low') return 'Low';
    return 'Medium';
  }
  if (normalized === 'high') return 'Aukštas';
  if (normalized === 'low') return 'Žemas';
  return 'Vidutinis';
}

function strategicLinkConfidenceTooltip(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (currentLanguage() === 'en') {
    if (normalized === 'high') return 'High confidence: the thematic match is strong and strategically relevant.';
    if (normalized === 'low') return 'Low confidence: there may be a loose or partial thematic connection.';
    return 'Medium confidence: there is a plausible strategic connection, but it should be reviewed manually.';
  }
  if (normalized === 'high') return 'Aukštas patikimumas: teminis atitikimas stiprus ir strategiškai reikšmingas.';
  if (normalized === 'low') return 'Žemas patikimumas: ryšys gali būti tik dalinis arba silpnesnis.';
  return 'Vidutinis patikimumas: strateginis ryšys tikėtinas, bet jį verta peržiūrėti rankiniu būdu.';
}

function buildStrategicLinkTargetHref(item) {
  return buildGuidelineHref(item?.targetGuidelineId, {
    institutionSlug: item?.targetInstitutionSlug || '',
    strategySlug: item?.targetStrategySlug || ''
  });
}

function updateStrategicLinkSuggestionLocalState(sourceGuidelineId, targetGuidelineId, updater) {
  if (!state.mapStrategicLinkSuggestions || typeof state.mapStrategicLinkSuggestions !== 'object') return;
  const sourceId = String(sourceGuidelineId || '').trim();
  const targetId = String(targetGuidelineId || '').trim();
  if (!sourceId || !targetId || typeof updater !== 'function') return;
  const patchList = (items) => (Array.isArray(items) ? items : []).map((item) => {
    const samePair = String(item?.sourceGuidelineId || '').trim() === sourceId
      && String(item?.targetGuidelineId || '').trim() === targetId;
    if (!samePair) return item;
    const nextItem = updater({ ...(item || {}) });
    return nextItem && typeof nextItem === 'object' ? nextItem : item;
  });
  state.mapStrategicLinkSuggestions = {
    ...state.mapStrategicLinkSuggestions,
    sameInstitution: patchList(state.mapStrategicLinkSuggestions.sameInstitution),
    otherInstitutions: patchList(state.mapStrategicLinkSuggestions.otherInstitutions)
  };
}

function closeStrategicLinkSearchOverlay() {
  document.body.classList.remove('strategic-link-gremlin-locked');
  const existing = document.getElementById('strategicLinkGremlinOverlay');
  if (existing) existing.remove();
}

function openStrategicLinkSearchOverlay() {
  const ui = strategicLinkGremlinUiText();
  closeStrategicLinkSearchOverlay();
  const overlay = document.createElement('div');
  overlay.id = 'strategicLinkGremlinOverlay';
  overlay.className = 'modal-overlay gremlin-analysis-locked strategic-link-gremlin-overlay';
  overlay.innerHTML = `
    <div class="strategic-link-gremlin-loading-shell" aria-live="polite">
      <div class="gremlin-loading-card strategic-link-gremlin-loading-card">
        <div class="gremlin-loading-spinner" aria-hidden="true"></div>
        <strong>${escapeHtml(ui.overlayLoading)}</strong>
        <p class="prompt">${escapeHtml(ui.overlayHint)}</p>
      </div>
    </div>
    <div class="gremlin-backdrop-stage" aria-hidden="true">
      <div class="gremlin-backdrop-aura gremlin-backdrop-aura-one"></div>
      <div class="gremlin-backdrop-aura gremlin-backdrop-aura-two"></div>
      <div class="gremlin-backdrop-aura gremlin-backdrop-aura-three"></div>
      <div class="gremlin-backdrop-rune-grid"></div>
      <div class="gremlin-backdrop-sigil"></div>
      <div class="gremlin-backdrop-flare gremlin-backdrop-flare-one"></div>
      <div class="gremlin-backdrop-flare gremlin-backdrop-flare-two"></div>
      <div class="gremlin-backdrop-flare gremlin-backdrop-flare-three"></div>
      <div class="gremlin-backdrop-stars">
        <span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  `;
  document.body.classList.add('strategic-link-gremlin-locked');
  document.body.appendChild(overlay);
}

async function ensureStrategicLinkGremlinUsage({ force = false } = {}) {
  if (!state.cycle?.id || !isLoggedIn()) {
    state.mapStrategicLinkUsage = null;
    state.mapStrategicLinkUsageLoading = false;
    state.mapStrategicLinkUsageCycleId = '';
    state.mapStrategicLinkUsagePromise = null;
    return null;
  }
  const cycleId = String(state.cycle.id || '').trim();
  if (!force
    && state.mapStrategicLinkUsage
    && state.mapStrategicLinkUsageCycleId === cycleId) {
    return state.mapStrategicLinkUsage;
  }
  if (!force && state.mapStrategicLinkUsagePromise) {
    return state.mapStrategicLinkUsagePromise;
  }

  state.mapStrategicLinkUsageLoading = true;
  const loader = api(`/api/v1/cycles/${encodeURIComponent(cycleId)}/clarity-gremlin/strategic-links`)
    .then((payload) => {
      state.mapStrategicLinkUsage = payload?.usage && typeof payload.usage === 'object'
        ? payload.usage
        : null;
      state.mapStrategicLinkUsageCycleId = cycleId;
      const rememberedSuggestions = Array.isArray(payload?.sameInstitution) ? payload.sameInstitution : [];
      const rememberedOther = Array.isArray(payload?.otherInstitutions) ? payload.otherInstitutions : [];
      if (payload && typeof payload === 'object' && (
        rememberedSuggestions.length
        || rememberedOther.length
        || payload?.lastScannedAt
      )) {
        state.mapStrategicLinkSuggestions = {
          responseLanguage: String(payload?.responseLanguage || currentLanguage()).trim().toLowerCase(),
          sameInstitution: rememberedSuggestions,
          otherInstitutions: rememberedOther,
          model: payload?.model || null,
          lastScannedAt: payload?.lastScannedAt || null
        };
      }
      return state.mapStrategicLinkUsage;
    })
    .catch((error) => {
      state.mapStrategicLinkUsage = null;
      state.mapStrategicLinkUsageCycleId = cycleId;
      throw error;
    })
    .finally(() => {
      state.mapStrategicLinkUsageLoading = false;
      state.mapStrategicLinkUsagePromise = null;
      renderStepView();
    });

  state.mapStrategicLinkUsagePromise = loader;
  return loader;
}

function buildStrategicLinkSuggestionGroupMarkup(title, items, emptyText, groupKey) {
  const ui = strategicLinkGremlinUiText();
  const suggestions = Array.isArray(items) ? items : [];
  const canCurate = canOpenAdminView();
  return `
    <section class="strategic-gremlin-group">
      <div class="strategic-gremlin-group-head">
        <h3>${escapeHtml(title)}</h3>
        <span class="tag">${suggestions.length}</span>
      </div>
      ${suggestions.length
        ? `<div class="strategic-gremlin-suggestion-list">
            ${suggestions.map((item) => {
              const canCreate = canOpenAdminView() && item?.canCreate === true;
              const href = buildStrategicLinkTargetHref(item);
              const confidenceText = strategicLinkConfidenceLabel(item?.confidence);
              const confidenceTooltip = strategicLinkConfidenceTooltip(item?.confidence);
              const actionHint = canCreate ? ui.sameInstitutionAction : ui.otherInstitutionAction;
              const status = String(item?.status || 'suggested').trim().toLowerCase();
              const isCreating = status === 'creating';
              const isAccepted = status === 'accepted';
              return `
                <article class="strategic-gremlin-suggestion-card ${isCreating ? 'is-creating' : ''} ${isAccepted ? 'is-accepted' : ''}">
                  <div class="strategic-gremlin-suggestion-top">
                    <span
                      class="tag strategic-gremlin-confidence strategic-gremlin-confidence-${escapeHtml(String(item?.confidence || 'medium').trim().toLowerCase())}"
                      title="${escapeHtml(confidenceTooltip)}"
                      aria-label="${escapeHtml(`${ui.confidence}: ${confidenceTooltip}`)}"
                    >${escapeHtml(confidenceText)}</span>
                    ${isCreating
                      ? `<span class="tag strategic-gremlin-state-tag">${escapeHtml(ui.creating)}</span>`
                      : (isAccepted
                        ? `<span class="tag strategic-gremlin-state-tag is-success">${escapeHtml(ui.createdState)}</span>`
                        : '')}
                  </div>
                  <div class="strategic-gremlin-link-rail">
                    <div class="strategic-gremlin-link-end strategic-gremlin-link-end-source">
                      <span class="strategic-gremlin-link-end-label">${escapeHtml(ui.currentStrategy)}</span>
                      <strong>${escapeHtml(item?.sourceGuidelineTitle || '-')}</strong>
                    </div>
                    <div class="strategic-gremlin-link-bridge" aria-hidden="true">
                      <span class="strategic-gremlin-link-bridge-line"></span>
                      <span class="strategic-gremlin-link-bridge-arrow">→</span>
                    </div>
                    <div class="strategic-gremlin-link-end strategic-gremlin-link-end-target">
                      <span class="strategic-gremlin-link-end-label">${escapeHtml(ui.suggestedTarget)}</span>
                      <strong>${escapeHtml(item?.targetGuidelineTitle || '-')}</strong>
                    </div>
                  </div>
                  <p class="prompt strategic-gremlin-suggestion-context">${escapeHtml(`${item?.targetInstitutionName || '-'} / ${item?.targetStrategyTitle || '-'}`)}</p>
                  <p class="strategic-gremlin-suggestion-rationale"><strong>${escapeHtml(`${ui.rationale}:`)}</strong> ${escapeHtml(item?.rationale || '')}</p>
                  <p class="strategic-gremlin-suggestion-action-hint"><strong>${escapeHtml(`${ui.suggestedAction}:`)}</strong> ${escapeHtml(isAccepted ? ui.createdHint : actionHint)}</p>
                  <div class="strategic-gremlin-suggestion-actions">
                    ${isAccepted
                      ? `<span class="strategic-gremlin-readonly-note is-success">${escapeHtml(ui.createdState)}</span>`
                      : (canCreate
                      ? `<button
                          type="button"
                          class="btn btn-primary"
                          data-action="create-strategic-link-suggestion"
                          data-group="${escapeHtml(groupKey)}"
                          data-source-guideline-id="${escapeHtml(item?.sourceGuidelineId || '')}"
                          data-target-guideline-id="${escapeHtml(item?.targetGuidelineId || '')}"
                          ${isCreating ? 'disabled' : ''}
                        >${escapeHtml(isCreating ? ui.creating : ui.create)}</button>`
                      : `<span class="strategic-gremlin-readonly-note">${escapeHtml(ui.viewOnly)}</span>`)}
                    ${canCurate && !isAccepted
                      ? `<button
                          type="button"
                          class="btn btn-ghost"
                          data-action="dismiss-strategic-link-suggestion"
                          data-group="${escapeHtml(groupKey)}"
                          data-source-guideline-id="${escapeHtml(item?.sourceGuidelineId || '')}"
                          data-target-guideline-id="${escapeHtml(item?.targetGuidelineId || '')}"
                          ${isCreating ? 'disabled' : ''}
                        >${escapeHtml(ui.dismiss)}</button>`
                      : ''}
                    <a class="btn btn-ghost" href="${escapeHtml(href)}">${escapeHtml(ui.openTarget)}</a>
                  </div>
                </article>
              `;
            }).join('')}
          </div>`
        : `<div class="card guideline-empty strategic-gremlin-empty-card"><strong>${escapeHtml(emptyText)}</strong></div>`}
    </section>
  `;
}

function buildStrategicLinkSearchPanelMarkup({ activeLayer }) {
  if (String(activeLayer || '').trim().toLowerCase() !== 'strategic-links') return '';
  const ui = strategicLinkGremlinUiText();
  const payload = state.mapStrategicLinkSuggestions || null;
  const sameInstitution = Array.isArray(payload?.sameInstitution) ? payload.sameInstitution : [];
  const otherInstitutions = Array.isArray(payload?.otherInstitutions) ? payload.otherInstitutions : [];
  const lastScannedAt = payload?.lastScannedAt || null;
  const lastScannedLabel = lastScannedAt
    ? `${ui.lastScanned}: ${formatCommentDateTime(lastScannedAt) || String(lastScannedAt)}`
    : '';
  const usage = state.mapStrategicLinkUsage && typeof state.mapStrategicLinkUsage === 'object'
    ? state.mapStrategicLinkUsage
    : null;
  const usageLabel = state.mapStrategicLinkUsageLoading
    ? ui.usageLoading
    : usage
      ? `${ui.usage}: ${Math.max(0, Number(usage.remaining || 0))} / ${Math.max(0, Number(usage.limit || 0))}`
      : `${ui.usage}: - / -`;
  const usageDepleted = usage ? Math.max(0, Number(usage.remaining || 0)) < 1 : false;
  const canSearch = Boolean(state.cycle?.id && isLoggedIn());
  const disabledReason = !state.cycle?.id
    ? ui.noCycle
    : !isLoggedIn()
      ? ui.loginRequired
      : usageDepleted
        ? ui.limitReached
        : '';
  return `
    <section class="strategic-gremlin-panel${state.mapStrategicLinkSuggestionsLoading ? ' strategic-gremlin-panel-searching' : ''}">
      <div class="strategic-gremlin-head">
        <div class="strategic-gremlin-copy">
          <div class="strategic-gremlin-title-row">
            <img class="strategic-gremlin-icon" src="assets/clarity_gremlin2_ui.png" alt="" aria-hidden="true" />
            <div>
              <h2>${escapeHtml(ui.title)}</h2>
              <p class="prompt">${escapeHtml(ui.subtitle)}</p>
              <div class="strategic-gremlin-usage-row">
                <span class="tag strategic-gremlin-usage-tag${usageDepleted ? ' strategic-gremlin-usage-tag-depleted' : ''}">${escapeHtml(usageLabel)}</span>
                ${lastScannedLabel ? `<span class="tag strategic-gremlin-last-scanned-tag">${escapeHtml(lastScannedLabel)}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="strategic-gremlin-actions">
          <button
            type="button"
            class="btn btn-primary"
            data-action="search-strategic-links"
            ${canSearch && !state.mapStrategicLinkSuggestionsLoading && !usageDepleted ? '' : 'disabled'}
            title="${escapeHtml(disabledReason || ui.search)}"
          >${escapeHtml(state.mapStrategicLinkSuggestionsLoading ? ui.searching : ui.search)}</button>
        </div>
      </div>
      ${state.mapStrategicLinkSuggestionsError
        ? `<div class="card strategic-gremlin-error"><strong>${escapeHtml(state.mapStrategicLinkSuggestionsError)}</strong></div>`
        : ''}
      ${usageDepleted
        ? `<div class="card strategic-gremlin-empty-card"><strong>${escapeHtml(ui.limitReached)}</strong><p class="prompt">${escapeHtml(ui.limitReachedHint)}</p></div>`
        : ''}
      ${!canSearch && disabledReason
        ? `<div class="card strategic-gremlin-empty-card"><strong>${escapeHtml(disabledReason)}</strong></div>`
        : ''}
      ${payload
        ? `
          <div class="strategic-gremlin-groups">
            ${buildStrategicLinkSuggestionGroupMarkup(ui.sameInstitution, sameInstitution, ui.sameEmpty, 'sameInstitution')}
            ${buildStrategicLinkSuggestionGroupMarkup(ui.otherInstitutions, otherInstitutions, ui.otherEmpty, 'otherInstitutions')}
          </div>
          ${otherInstitutions.length ? `<p class="prompt strategic-gremlin-footnote">${escapeHtml(ui.createRestricted)}</p>` : ''}
        `
        : (!state.mapStrategicLinkSuggestionsLoading && canSearch && !usageDepleted
          ? `<div class="card strategic-gremlin-empty-card"><strong>${escapeHtml(ui.ready)}</strong></div>`
          : '')}
    </section>
  `;
}

async function runStrategicLinkSearch() {
  if (!state.cycle?.id) {
    notifyError(strategicLinkGremlinUiText().noCycle);
    return;
  }
  if (!isLoggedIn()) {
    notifyError(strategicLinkGremlinUiText().loginRequired);
    return;
  }
  try {
    await ensureStrategicLinkGremlinUsage();
  } catch (error) {
    notifyError(toUserMessage(error));
    return;
  }
  if (Math.max(0, Number(state.mapStrategicLinkUsage?.remaining || 0)) < 1) {
    notifyError(strategicLinkGremlinUiText().limitReached);
    renderStepView();
    return;
  }
  state.mapStrategicLinkSuggestionsLoading = true;
  state.mapStrategicLinkSuggestionsError = '';
  openStrategicLinkSearchOverlay();
  renderStepView();
  try {
    const payload = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/clarity-gremlin/strategic-links`, {
      method: 'POST',
      body: {
        locale: currentLanguage()
      }
    });
    state.mapStrategicLinkSuggestions = {
      responseLanguage: String(payload?.responseLanguage || currentLanguage()).trim().toLowerCase(),
      sameInstitution: Array.isArray(payload?.sameInstitution) ? payload.sameInstitution : [],
      otherInstitutions: Array.isArray(payload?.otherInstitutions) ? payload.otherInstitutions : [],
      model: payload?.model || null,
      lastScannedAt: payload?.lastScannedAt || null
    };
    state.mapStrategicLinkUsage = payload?.usage && typeof payload.usage === 'object'
      ? payload.usage
      : state.mapStrategicLinkUsage;
    state.mapStrategicLinkUsageCycleId = String(state.cycle?.id || '').trim();
  } catch (error) {
    state.mapStrategicLinkSuggestions = null;
    if (error?.payload?.usage && typeof error.payload.usage === 'object') {
      state.mapStrategicLinkUsage = error.payload.usage;
      state.mapStrategicLinkUsageCycleId = String(state.cycle?.id || '').trim();
    }
    state.mapStrategicLinkSuggestionsError = toUserMessage(error);
    notifyError(state.mapStrategicLinkSuggestionsError);
  } finally {
    state.mapStrategicLinkSuggestionsLoading = false;
    closeStrategicLinkSearchOverlay();
    renderStepView();
  }
}

async function createStrategicLinkFromSuggestion(sourceGuidelineId, targetGuidelineId) {
  updateStrategicLinkSuggestionLocalState(sourceGuidelineId, targetGuidelineId, (item) => ({
    ...item,
    status: 'creating'
  }));
  renderStepView();
  try {
    const linkPayload = await api('/api/v1/admin/guideline-links', {
      method: 'POST',
      body: {
        sourceGuidelineId,
        targetGuidelineId
      }
    });
    await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/clarity-gremlin/strategic-links/accepted`, {
      method: 'POST',
      body: {
        sourceGuidelineId,
        targetGuidelineId,
        linkId: String(linkPayload?.linkId || '').trim()
      }
    }).catch(() => {});
    updateStrategicLinkSuggestionLocalState(sourceGuidelineId, targetGuidelineId, (item) => ({
      ...item,
      status: 'accepted'
    }));
    notifySuccess(strategicLinkGremlinUiText().created);
    await loadStrategyMap({ preserveStrategicSuggestions: true });
    await ensureStrategicLinksData({ force: true });
  } catch (error) {
    updateStrategicLinkSuggestionLocalState(sourceGuidelineId, targetGuidelineId, (item) => ({
      ...item,
      status: 'suggested'
    }));
    throw error;
  }
}

async function dismissStrategicLinkSuggestion(sourceGuidelineId, targetGuidelineId) {
  const payload = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/clarity-gremlin/strategic-links/dismiss`, {
    method: 'POST',
    body: {
      sourceGuidelineId,
      targetGuidelineId
    }
  });
  state.mapStrategicLinkSuggestions = {
    responseLanguage: String(payload?.responseLanguage || state.mapStrategicLinkSuggestions?.responseLanguage || currentLanguage()).trim().toLowerCase(),
    sameInstitution: Array.isArray(payload?.sameInstitution) ? payload.sameInstitution : [],
    otherInstitutions: Array.isArray(payload?.otherInstitutions) ? payload.otherInstitutions : [],
    model: payload?.model || state.mapStrategicLinkSuggestions?.model || null,
    lastScannedAt: payload?.lastScannedAt || state.mapStrategicLinkSuggestions?.lastScannedAt || null
  };
  notifySuccess(strategicLinkGremlinUiText().dismissed);
}

function bindStrategicLinkSearchPanel(container) {
  if (!(container instanceof HTMLElement)) return;
  if (state.cycle?.id && isLoggedIn() && !state.mapStrategicLinkUsageLoading) {
    const cycleId = String(state.cycle.id || '').trim();
    if (state.mapStrategicLinkUsageCycleId !== cycleId) {
      void ensureStrategicLinkGremlinUsage().catch((error) => {
        notifyError(toUserMessage(error));
      });
    }
  }
  const searchButton = container.querySelector('[data-action="search-strategic-links"]');
  if (searchButton instanceof HTMLButtonElement) {
    searchButton.addEventListener('click', () => {
      void runStrategicLinkSearch();
    });
  }

  container.querySelectorAll('[data-action="create-strategic-link-suggestion"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const sourceGuidelineId = String(button.getAttribute('data-source-guideline-id') || '').trim();
      const targetGuidelineId = String(button.getAttribute('data-target-guideline-id') || '').trim();
      if (!sourceGuidelineId || !targetGuidelineId) return;
      if (!(button instanceof HTMLButtonElement)) return;
      button.disabled = true;
      try {
        await createStrategicLinkFromSuggestion(sourceGuidelineId, targetGuidelineId);
      } catch (error) {
        notifyError(toUserMessage(error));
      } finally {
        renderStepView();
      }
    });
  });

  container.querySelectorAll('[data-action="dismiss-strategic-link-suggestion"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const sourceGuidelineId = String(button.getAttribute('data-source-guideline-id') || '').trim();
      const targetGuidelineId = String(button.getAttribute('data-target-guideline-id') || '').trim();
      if (!sourceGuidelineId || !targetGuidelineId) return;
      if (!(button instanceof HTMLButtonElement)) return;
      button.disabled = true;
      try {
        await dismissStrategicLinkSuggestion(sourceGuidelineId, targetGuidelineId);
      } catch (error) {
        notifyError(toUserMessage(error));
      } finally {
        renderStepView();
      }
    });
  });
}

function clarityGremlinWorkspaceUiText() {
  return currentLanguage() === 'en'
    ? {
        title: 'Clarity Gremlin',
        subtitle: 'One place for the AI functions that help structure, clarify, connect, and interpret strategy work.',
        overviewTitle: 'Choose what Clarity Gremlin should help with',
        overviewIntro: 'Start from the overview, then open the exact Clarity Gremlin mode you need for the current task.',
        loginRequiredNotice: 'You must log in to use Clarity Gremlin features.',
        cycleRequiredNotice: 'Select an active strategy first to use strategy-specific Gremlin features.',
        backToOverview: 'Back to overview',
        reviewTitle: 'Review strategy',
        reviewBody: 'Run the full Clarity Gremlin review workspace for the current strategy or a selected card. This keeps recent analyses, draft suggestions, language, and model settings in one place.',
        reviewHow: 'Analyze the current strategy or one selected card, score clarity, and prepare structured improvement suggestions.',
        reviewAction: 'Open review workspace',
        strategicLinksTitle: 'Find strategic links',
        strategicLinksBody: 'Search for connections between this strategy and other strategies, then review, accept, or dismiss suggestions.',
        strategicLinksHow: 'Compare the current strategy with other strategies and surface candidate guideline links that can be created or dismissed.',
        pdfTitle: 'Create strategy from PDF',
        pdfBody: 'Turn uploaded strategy PDFs into the digistrategy.eu guideline and initiative structure with manual review before publishing.',
        pdfHow: 'Read uploaded PDF documents, extract strategy structure, and prepare a draft strategy that can be reviewed before publishing.',
        pdfAction: 'Open PDF structuring',
        pdfAdminOnly: 'PDF structuring is available to institution admins who can create strategies.',
        pdfAdminOnlyShort: 'Only institution admins can create strategies from PDF.',
        pdfChecklistTitle: 'What to prepare',
        pdfChecklistDocs: 'One or more strategy PDFs with the source content you want Gremlin to read.',
        pdfChecklistTitleField: 'A clean strategy title and short description that should appear in the platform.',
        pdfChecklistClarification: 'A clarification note describing tone, priorities, exclusions, and interpretation rules.',
        pdfOutcomeTitle: 'What Clarity Gremlin will produce',
        pdfOutcomeStructure: 'A structured strategy draft mapped into digistrategy.eu guidelines and initiatives.',
        pdfOutcomeReview: 'A review-first flow so the generated result can be checked before publishing.',
        pdfOutcomeLimits: 'A best-effort conversion. Narrative source documents can still require manual cleanup.',
        pdfEntryHint: 'Best for long narrative strategy documents that need to be translated into platform structure.',
        policyTitle: 'Check policy alignment',
        policyBody: 'Open the policy alignment workspace to compare strategy content against policy frameworks and external requirements.',
        policyHow: 'Compare strategy content against policy frameworks and external requirements to spot missing themes, gaps, and obligations.',
        policyAction: 'Open policy alignment',
        policyModesTitle: 'Available policy checks',
        policyModeFrameworks: 'Policy framework',
        policyModeStrategy: 'Strategy analysis',
        policyModeExternal: 'External analysis',
        policyOutcomeTitle: 'What this mode helps clarify',
        policyOutcomeFrameworks: 'How the current strategy maps to selected policy frameworks.',
        policyOutcomeGaps: 'Where the strategy may be missing expected themes, safeguards, or obligations.',
        policyOutcomeReview: 'A clearer basis for deciding what to revise before publishing or approval.',
        policyEntryHint: 'Use this when you need to compare strategy content against external rules and policy expectations.',
        modesLabel: 'Clarity Gremlin modes',
        launchContext: 'Launch context',
        noContext: 'No active strategy context selected yet.',
        providerLabel: 'Current AI provider',
        gremlinHome: 'Clarity Gremlin home'
      }
    : {
        title: 'Clarity Gremlin',
        subtitle: 'Viena vieta visoms AI funkcijoms, kurios padeda aiškiau suprasti, struktūruoti, susieti ir interpretuoti strategiją.',
        overviewTitle: 'Pasirinkite, kuo Clarity Gremlin turėtų padėti',
        overviewIntro: 'Pirmiausia peržiūrėkite režimų apžvalgą, tada atverkite tą Clarity Gremlin funkciją, kurios reikia dabartinei užduočiai.',
        loginRequiredNotice: 'Prisijunkite, kad galėtumėte naudoti Clarity Gremlin funkcijas.',
        cycleRequiredNotice: 'Pirmiausia pasirinkite aktyvią strategiją, kad galėtumėte naudoti strategijai skirtas Gremlin funkcijas.',
        backToOverview: 'Grįžti į apžvalgą',
        reviewTitle: 'Peržiūrėti strategiją',
        reviewBody: 'Atverkite pilną Clarity Gremlin analizės darbo erdvę visai strategijai arba vienai pasirinktai kortelei. Čia vienoje vietoje laikomos analizės, pasiūlymų juodraščiai, kalba ir modelio nustatymai.',
        reviewHow: 'Išanalizuokite dabartinę strategiją arba vieną pasirinktą kortelę, gaukite aiškumo įvertinimą ir struktūruotus tobulinimo pasiūlymus.',
        reviewAction: 'Atverti analizės erdvę',
        strategicLinksTitle: 'Rasti strateginius ryšius',
        strategicLinksBody: 'Ieškokite ryšių tarp šios strategijos ir kitų strategijų, tada peržiūrėkite, patvirtinkite arba paslėpkite pasiūlymus.',
        strategicLinksHow: 'Palyginkite dabartinę strategiją su kitomis strategijomis ir gaukite galimų gairių ryšių pasiūlymus, kuriuos galima sukurti arba atmesti.',
        pdfTitle: 'Sukurti strategiją iš PDF',
        pdfBody: 'Paverskite įkeltus strategijos PDF dokumentus į digistrategy.eu gairių ir iniciatyvų struktūrą, o prieš paskelbiant viską peržiūrėkite rankiniu būdu.',
        pdfHow: 'Perskaitykite įkeltus PDF dokumentus, ištraukite strategijos struktūrą ir paruoškite strategijos juodraštį rankinei peržiūrai prieš paskelbiant.',
        pdfAction: 'Atverti PDF struktūravimą',
        pdfAdminOnly: 'PDF struktūravimas galimas institucijos administratoriams, kurie gali kurti strategijas.',
        pdfAdminOnlyShort: 'Tik institucijos administratoriai gali kurti strategijas iš PDF.',
        pdfChecklistTitle: 'Ką pasiruošti',
        pdfChecklistDocs: 'Vieną ar kelis strategijos PDF dokumentus su turiniu, kurį Gremlin turi perskaityti.',
        pdfChecklistTitleField: 'Aiškų strategijos pavadinimą ir trumpą aprašą, kurie bus rodomi platformoje.',
        pdfChecklistClarification: 'Patikslinimą apie toną, prioritetus, išimtis ir tai, kaip interpretuoti įkeltus dokumentus.',
        pdfOutcomeTitle: 'Ką Clarity Gremlin sugeneruos',
        pdfOutcomeStructure: 'Struktūruotą strategijos juodraštį, susietą su digistrategy.eu gairėmis ir iniciatyvomis.',
        pdfOutcomeReview: 'Peržiūros pirmumo srautą, kad rezultatą būtų galima patikrinti prieš paskelbiant.',
        pdfOutcomeLimits: 'Geriausios pastangos konversiją. Naratyviniams dokumentams vis tiek gali reikėti rankinio pataisymo.',
        pdfEntryHint: 'Geriausia ilgiems naratyviniams strategijų dokumentams, kuriuos reikia paversti platformos struktūra.',
        policyTitle: 'Tikrinti politikos atitiktį',
        policyBody: 'Atverkite politikos atitikties darbo erdvę ir palyginkite strategijos turinį su politikos karkasais bei išoriniais reikalavimais.',
        policyHow: 'Palyginkite strategijos turinį su politikos karkasais ir išoriniais reikalavimais, kad pamatytumėte spragas, trūkstamas temas ir įsipareigojimus.',
        policyAction: 'Atverti politikos atitiktį',
        policyModesTitle: 'Galimi politikos tikrinimo režimai',
        policyModeFrameworks: 'Politikos karkasas',
        policyModeStrategy: 'Strategijos analizė',
        policyModeExternal: 'Išorinė analizė',
        policyOutcomeTitle: 'Ką šis režimas padeda išsiaiškinti',
        policyOutcomeFrameworks: 'Kaip dabartinė strategija siejasi su pasirinktais politikos karkasais.',
        policyOutcomeGaps: 'Kur strategijoje gali trūkti laukiamų temų, saugiklių ar įsipareigojimų.',
        policyOutcomeReview: 'Aiškesnį pagrindą spręsti, ką verta koreguoti prieš tvirtinimą ar publikavimą.',
        policyEntryHint: 'Naudokite, kai reikia palyginti strategijos turinį su išorinėmis taisyklėmis ir politikos lūkesčiais.',
        modesLabel: 'Clarity Gremlin režimai',
        launchContext: 'Paleidimo kontekstas',
        noContext: 'Aktyvus strategijos kontekstas dar nepasirinktas.',
        providerLabel: 'Dabartinis AI tiekėjas',
        gremlinHome: 'Clarity Gremlin pradžia'
      };
}

function resolveClarityGremlinLaunchLabel() {
  const view = String(state.clarityGremlinLaunchContextView || '').trim().toLowerCase();
  if (!view) return '';
  if (view === 'guideline-detail') {
    const guideline = findGuidelineById(state.clarityGremlinLaunchContextEntityId);
    return guideline ? `${clarityGremlinPageLabel(view)}: ${guideline.title || guideline.id}` : clarityGremlinPageLabel(view);
  }
  if (view === 'initiative-detail') {
    const initiative = findInitiativeById(state.clarityGremlinLaunchContextEntityId);
    return initiative ? `${clarityGremlinPageLabel(view)}: ${initiative.title || initiative.id}` : clarityGremlinPageLabel(view);
  }
  return clarityGremlinPageLabel(view);
}

function renderClarityGremlinWorkspaceView() {
  const ui = clarityGremlinWorkspaceUiText();
  const currentProvider = formatFeatureAiLabel('clarityGremlin');
  const launchContextLabel = resolveClarityGremlinLaunchLabel();
  const canStructurePdf = canManageSelectedInstitution();
  const isLoggedInMember = isLoggedIn();
  const hasCycle = Boolean(state.cycle?.id);
  const reviewContext = resolveClarityGremlinContext();
  const canOpenReview = reviewContext.supported === true;
  const canOpenStrategicLinks = isLoggedInMember && hasCycle;
  const canOpenPolicy = isLoggedInMember;
  const reviewBlockedLabel = !isLoggedIn()
    ? langText('Prisijunkite, kad galėtumėte naudoti Clarity Gremlin analizę.', 'Sign in to use Clarity Gremlin review.')
    : !state.cycle?.id
      ? langText('Pirmiausia pasirinkite aktyvią strategiją su ciklu.', 'Select an active strategy with a cycle first.')
      : '';
  const requestedMode = normalizeClarityGremlinWorkspaceTab(state.clarityGremlinWorkspaceTab);
  const activeMode = !isLoggedInMember
    ? 'home'
    : requestedMode === 'review' && !canOpenReview
      ? 'home'
      : requestedMode === 'strategic-links' && !canOpenStrategicLinks
        ? 'home'
        : requestedMode === 'pdf' && !canStructurePdf
          ? 'home'
          : requestedMode;

  const renderModeBody = () => {
    if (activeMode === 'home') {
      return `
        <section class="clarity-workspace-section">
          <section class="clarity-workspace-home-grid">
            <article class="clarity-workspace-mode-card clarity-workspace-home-card">
              <div class="clarity-workspace-mode-copy">
                <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.reviewTitle)}</span>
                <h3>${escapeHtml(ui.reviewTitle)}</h3>
                <p>${escapeHtml(ui.reviewBody)}</p>
              </div>
              <p class="prompt clarity-workspace-mini-note">${escapeHtml(ui.reviewHow)}</p>
              <div class="clarity-workspace-mode-actions">
                <button type="button" class="btn btn-primary" data-action="switch-gremlin-mode" data-gremlin-mode="review"${canOpenReview ? '' : ' disabled'}>${escapeHtml(ui.reviewTitle)}</button>
              </div>
              ${canOpenReview ? '' : `<p class="prompt clarity-workspace-inline-note">${escapeHtml(reviewBlockedLabel || ui.loginRequiredNotice)}</p>`}
            </article>
            <article class="clarity-workspace-mode-card clarity-workspace-home-card">
              <div class="clarity-workspace-mode-copy">
                <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.strategicLinksTitle)}</span>
                <h3>${escapeHtml(ui.strategicLinksTitle)}</h3>
                <p>${escapeHtml(ui.strategicLinksBody)}</p>
              </div>
              <p class="prompt clarity-workspace-mini-note">${escapeHtml(ui.strategicLinksHow)}</p>
              <div class="clarity-workspace-mode-actions">
                <button type="button" class="btn btn-primary" data-action="switch-gremlin-mode" data-gremlin-mode="strategic-links"${canOpenStrategicLinks ? '' : ' disabled'}>${escapeHtml(ui.strategicLinksTitle)}</button>
              </div>
              ${canOpenStrategicLinks ? '' : `<p class="prompt clarity-workspace-inline-note">${escapeHtml(!isLoggedInMember ? ui.loginRequiredNotice : ui.cycleRequiredNotice)}</p>`}
            </article>
            <article class="clarity-workspace-mode-card clarity-workspace-home-card">
              <div class="clarity-workspace-mode-copy">
                <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.pdfTitle)}</span>
                <h3>${escapeHtml(ui.pdfTitle)}</h3>
                <p>${escapeHtml(ui.pdfBody)}</p>
              </div>
              <p class="prompt clarity-workspace-mini-note">${escapeHtml(ui.pdfHow)}</p>
              <div class="clarity-workspace-mode-actions">
                <button type="button" class="btn btn-primary" data-action="switch-gremlin-mode" data-gremlin-mode="pdf"${canStructurePdf ? '' : ' disabled'}>${escapeHtml(ui.pdfTitle)}</button>
              </div>
              ${canStructurePdf ? '' : `<p class="prompt clarity-workspace-inline-note">${escapeHtml(!isLoggedInMember ? ui.loginRequiredNotice : ui.pdfAdminOnlyShort)}</p>`}
            </article>
            <article class="clarity-workspace-mode-card clarity-workspace-home-card">
              <div class="clarity-workspace-mode-copy">
                <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.policyTitle)}</span>
                <h3>${escapeHtml(ui.policyTitle)}</h3>
                <p>${escapeHtml(ui.policyBody)}</p>
              </div>
              <p class="prompt clarity-workspace-mini-note">${escapeHtml(ui.policyHow)}</p>
              <div class="clarity-workspace-mode-actions">
                <button type="button" class="btn btn-primary" data-action="switch-gremlin-mode" data-gremlin-mode="policy-alignment"${canOpenPolicy ? '' : ' disabled'}>${escapeHtml(ui.policyTitle)}</button>
              </div>
              ${canOpenPolicy ? '' : `<p class="prompt clarity-workspace-inline-note">${escapeHtml(ui.loginRequiredNotice)}</p>`}
            </article>
          </section>
        </section>
      `;
    }

    if (activeMode === 'strategic-links') {
      return `
        <section class="clarity-workspace-section">
          ${buildStrategicLinkSearchPanelMarkup({ activeLayer: 'strategic-links' })}
        </section>
      `;
    }

    if (activeMode === 'pdf') {
      return `
        <section class="clarity-workspace-section">
          <div class="clarity-workspace-module-grid">
            <article class="clarity-workspace-mode-card clarity-workspace-module-card">
              <div class="clarity-workspace-mode-copy">
                <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.pdfTitle)}</span>
                <h3>${escapeHtml(ui.pdfChecklistTitle)}</h3>
                <p>${escapeHtml(ui.pdfBody)}</p>
              </div>
              <ul class="clarity-workspace-checklist">
                <li>${escapeHtml(ui.pdfChecklistDocs)}</li>
                <li>${escapeHtml(ui.pdfChecklistTitleField)}</li>
                <li>${escapeHtml(ui.pdfChecklistClarification)}</li>
              </ul>
              <p class="prompt clarity-workspace-mini-note">${escapeHtml(ui.pdfEntryHint)}</p>
            </article>
            <article class="clarity-workspace-mode-card clarity-workspace-module-card clarity-workspace-action-card">
              <div class="clarity-workspace-mode-copy">
                <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.providerLabel)}: ${escapeHtml(currentProvider)}</span>
                <h3>${escapeHtml(ui.pdfOutcomeTitle)}</h3>
              </div>
              <ul class="clarity-workspace-checklist">
                <li>${escapeHtml(ui.pdfOutcomeStructure)}</li>
                <li>${escapeHtml(ui.pdfOutcomeReview)}</li>
                <li>${escapeHtml(ui.pdfOutcomeLimits)}</li>
              </ul>
              <div class="clarity-workspace-mode-actions">
                <button type="button" class="btn btn-primary" data-action="open-gremlin-pdf"${canStructurePdf ? '' : ' disabled'}>${escapeHtml(ui.pdfAction)}</button>
              </div>
              ${canStructurePdf ? '' : `<p class="prompt clarity-workspace-inline-note">${escapeHtml(ui.pdfAdminOnly)}</p>`}
            </div>
          </div>
        </section>
      `;
    }

    if (activeMode === 'policy-alignment') {
      return `
        <section class="clarity-workspace-section">
          <div class="clarity-workspace-module-grid">
            <article class="clarity-workspace-mode-card clarity-workspace-module-card">
              <div class="clarity-workspace-mode-copy">
                <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.policyTitle)}</span>
                <h3>${escapeHtml(ui.policyModesTitle)}</h3>
                <p>${escapeHtml(ui.policyBody)}</p>
              </div>
              <div class="clarity-workspace-pill-list">
                <span class="tag">${escapeHtml(ui.policyModeFrameworks)}</span>
                <span class="tag">${escapeHtml(ui.policyModeStrategy)}</span>
                <span class="tag">${escapeHtml(ui.policyModeExternal)}</span>
              </div>
              <p class="prompt clarity-workspace-mini-note">${escapeHtml(ui.policyEntryHint)}</p>
            </article>
            <article class="clarity-workspace-mode-card clarity-workspace-module-card clarity-workspace-action-card">
              <div class="clarity-workspace-mode-copy">
                <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.providerLabel)}: ${escapeHtml(currentProvider)}</span>
                <h3>${escapeHtml(ui.policyOutcomeTitle)}</h3>
              </div>
              <ul class="clarity-workspace-checklist">
                <li>${escapeHtml(ui.policyOutcomeFrameworks)}</li>
                <li>${escapeHtml(ui.policyOutcomeGaps)}</li>
                <li>${escapeHtml(ui.policyOutcomeReview)}</li>
              </ul>
              <div class="clarity-workspace-mode-actions">
                <button type="button" class="btn btn-ghost" data-action="open-gremlin-policy-frameworks"${canOpenPolicy ? '' : ' disabled'}>${escapeHtml(ui.policyModeFrameworks)}</button>
                <button type="button" class="btn btn-primary" data-action="open-gremlin-policy"${canOpenPolicy ? '' : ' disabled'}>${escapeHtml(ui.policyAction)}</button>
              </div>
            </article>
          </div>
        </section>
      `;
    }

    if (activeMode === 'review') {
      return `
        <section class="clarity-workspace-section">
          <article class="clarity-workspace-mode-card clarity-workspace-mode-card-primary clarity-workspace-single-mode-card">
            <div class="clarity-workspace-mode-copy">
              <span class="clarity-workspace-mode-kicker">${escapeHtml(ui.reviewTitle)}</span>
              <h3>${escapeHtml(ui.reviewTitle)}</h3>
              <p>${escapeHtml(ui.reviewBody)}</p>
              <div class="header-stack">
                <span class="tag">${escapeHtml(ui.providerLabel)}: ${escapeHtml(currentProvider)}</span>
                <span class="tag">${escapeHtml(ui.launchContext)}: ${escapeHtml(launchContextLabel || ui.noContext)}</span>
              </div>
            </div>
            <p class="prompt clarity-workspace-mini-note">${escapeHtml(ui.reviewHow)}</p>
            <div class="clarity-workspace-mode-actions">
              <button type="button" class="btn btn-primary" data-action="open-gremlin-review"${canOpenReview ? '' : ' disabled'}>${escapeHtml(ui.reviewAction)}</button>
            </div>
            ${canOpenReview ? '' : `<p class="prompt clarity-workspace-inline-note">${escapeHtml(reviewBlockedLabel)}</p>`}
          </article>
        </section>
      `;
    }

    return `
      <section class="clarity-workspace-section">
        <article class="clarity-workspace-mode-card clarity-workspace-home-card">
          <div class="clarity-workspace-mode-copy">
            <h3>${escapeHtml(ui.reviewTitle)}</h3>
            <p>${escapeHtml(ui.reviewBody)}</p>
          </div>
          <p class="prompt clarity-workspace-mini-note">${escapeHtml(ui.reviewHow)}</p>
          <div class="clarity-workspace-mode-actions">
            <button type="button" class="btn btn-primary" data-action="switch-gremlin-mode" data-gremlin-mode="review"${canOpenReview ? '' : ' disabled'}>${escapeHtml(ui.reviewTitle)}</button>
          </div>
          ${canOpenReview ? '' : `<p class="prompt clarity-workspace-inline-note">${escapeHtml(reviewBlockedLabel || ui.loginRequiredNotice)}</p>`}
        </article>
      </section>
    `;
  };

  elements.stepView.innerHTML = `
    <section class="clarity-workspace-shell">
      <div class="clarity-workspace-hero">
        <div class="clarity-workspace-hero-copy">
          <div class="clarity-workspace-title-row">
            <img class="clarity-workspace-icon" src="assets/clarity_gremlin2_ui.png" alt="" aria-hidden="true" />
            <div>
              <h2>${escapeHtml(ui.title)}</h2>
              <p class="prompt">${escapeHtml(ui.subtitle)}</p>
            </div>
          </div>
          <div class="header-stack">
            <span class="tag">${escapeHtml(ui.launchContext)}: ${escapeHtml(launchContextLabel || ui.noContext)}</span>
            <span class="tag">${escapeHtml(ui.providerLabel)}: ${escapeHtml(currentProvider)}</span>
          </div>
        </div>
      </div>
      <div class="clarity-workspace-topnav" role="tablist" aria-label="${escapeHtml(ui.modesLabel)}">
        <button type="button" class="btn ${activeMode === 'home' ? 'btn-ghost' : activeMode === 'review' ? 'btn-primary' : 'btn-ghost'}" data-action="switch-gremlin-mode" data-gremlin-mode="review"${canOpenReview ? '' : ' disabled'}>${escapeHtml(ui.reviewTitle)}</button>
        <button type="button" class="btn ${activeMode === 'strategic-links' ? 'btn-primary' : 'btn-ghost'}" data-action="switch-gremlin-mode" data-gremlin-mode="strategic-links"${canOpenStrategicLinks ? '' : ' disabled'}>${escapeHtml(ui.strategicLinksTitle)}</button>
        <button type="button" class="btn ${activeMode === 'pdf' ? 'btn-primary' : 'btn-ghost'}" data-action="switch-gremlin-mode" data-gremlin-mode="pdf"${canStructurePdf ? '' : ' disabled'}>${escapeHtml(ui.pdfTitle)}</button>
        <button type="button" class="btn ${activeMode === 'policy-alignment' ? 'btn-primary' : 'btn-ghost'}" data-action="switch-gremlin-mode" data-gremlin-mode="policy-alignment"${canOpenPolicy ? '' : ' disabled'}>${escapeHtml(ui.policyTitle)}</button>
      </div>
      ${renderModeBody()}
    </section>
  `;

  bindClarityGremlinWorkspace();
}

function bindClarityGremlinWorkspace() {
  elements.stepView.querySelectorAll('[data-action="switch-gremlin-mode"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.clarityGremlinWorkspaceTab = normalizeClarityGremlinWorkspaceTab(button.getAttribute('data-gremlin-mode'));
      syncRouteState();
      render();
    });
  });

  const reviewButton = elements.stepView.querySelector('[data-action="open-gremlin-review"]');
  if (reviewButton) {
    reviewButton.addEventListener('click', () => {
      showClarityGremlinModal();
    });
  }

  const pdfButton = elements.stepView.querySelector('[data-action="open-gremlin-pdf"]');
  if (pdfButton) {
    pdfButton.addEventListener('click', () => {
      showStrategyCreateModal('ai');
    });
  }

  const policyButton = elements.stepView.querySelector('[data-action="open-gremlin-policy"]');
  if (policyButton) {
    policyButton.addEventListener('click', () => {
      navigateToPolicyAlignmentTab('strategy-analysis');
    });
  }

  const policyFrameworksButton = elements.stepView.querySelector('[data-action="open-gremlin-policy-frameworks"]');
  if (policyFrameworksButton) {
    policyFrameworksButton.addEventListener('click', () => {
      navigateToPolicyAlignmentTab('frameworks');
    });
  }

  const strategicPanel = elements.stepView.querySelector('.strategic-gremlin-panel');
  if (strategicPanel instanceof HTMLElement) {
    bindStrategicLinkSearchPanel(strategicPanel);
  }
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
  const institutionTitle = langText('Pasirinkite instituciją peržiūrai', 'Select institution for viewing');
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
    ? `<option value="" ${selectedSlug ? '' : 'selected'} disabled>${escapeHtml(langText('Pasirinkite strategiją', 'Select strategy'))}</option>`
    : '';

  const strategyLabel = langText('Strategija', 'Strategy');
  const strategyTitle = langText('Pasirinkite strategiją peržiūrai', 'Select strategy for viewing');
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
    pushRouteState();

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
    pushRouteState();

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

function captureClarityGremlinLaunchContext() {
  const currentView = String(state.activeView || '').trim().toLowerCase();
  if (!CLARITY_GREMLIN_SUPPORTED_VIEWS.has(currentView)) return;
  state.clarityGremlinLaunchContextView = currentView;
  if (currentView === 'guideline-detail' || currentView === 'initiative-detail') {
    state.clarityGremlinLaunchContextEntityId = String(state.routeEntityId || '').trim();
    return;
  }
  state.clarityGremlinLaunchContextEntityId = '';
}

function openClarityGremlinWorkspace(mode = 'home') {
  state.clarityGremlinWorkspaceTab = normalizeClarityGremlinWorkspaceTab(mode);
  if (state.activeView === 'clarity-gremlin') {
    syncRouteState();
    render();
    return;
  }
  setActiveView('clarity-gremlin');
}

function setActiveView(nextView) {
  if (!ALLOWED_VIEWS.has(nextView)) return;
  if (state.activeView === nextView) return;
  if (nextView !== 'map') {
    resetMapInitiativeFocusState();
  }
  if (nextView === 'clarity-gremlin') {
    captureClarityGremlinLaunchContext();
  }
  clearRouteEntityForView(nextView);
  state.activeView = nextView;
  pushRouteState();
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
  pushRouteState();
  render();
}

function openInitiativeDetail(initiativeId) {
  const nextId = String(initiativeId || '').trim();
  if (!nextId) return;
  setRouteEntity('initiative', nextId);
  state.activeView = 'initiative-detail';
  pushRouteState();
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
    info?.strategyTitle || state.strategy?.title || state.strategySlug || langText('Pasirinkite strategiją', 'Select strategy')
  ).trim() || langText('Pasirinkite strategiją', 'Select strategy');
  const loading = state.loading && !state.institutionsLoaded;
  const dialogOpen = Boolean(state.strategySwitcherDialogOpen);
  const showCreateStrategyAction = canManageSelectedInstitution();
  const createButtonLabel = langText('Sukurti strategiją', 'Create strategy');
  const guideButtonLabel = langText('Naudojimosi gidas', 'User guide');
  const showVoteBudget = topbar && isLoggedIn() && Boolean(normalizeSlug(state.strategySlug) || state.strategy?.id);
  const budget = voteBudget();
  const used = usedVotesTotal();
  const remaining = Math.max(0, budget - used);
  const voteBudgetTooltip = langText(
    'Balsų biudžetas priskiriamas konkrečiai pasirinktai strategijai. Rodoma, kiek balsų liko iš viso šios strategijos ciklo biudžeto.',
    'Vote budget is assigned to the currently selected strategy. Shows how many votes remain out of this strategy cycle total.'
  );
  const voteBudgetMarkup = showVoteBudget
    ? `
          <span class="strategy-vote-budget-chip" title="${escapeHtml(voteBudgetTooltip)}" aria-label="${escapeHtml(voteBudgetTooltip)}">
            <span class="strategy-vote-budget-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" class="strategy-vote-budget-icon-svg">
                <circle cx="12" cy="12" r="9" fill="#e2a42c" stroke="#b97b16" stroke-width="1.4"></circle>
                <path d="M5.4 10.3a6.8 6.8 0 0 1 13.2 0" fill="#ffe8a6" opacity="0.9"></path>
                <circle cx="12" cy="12" r="5.4" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.2"></circle>
              </svg>
            </span>
            <span class="strategy-vote-budget-text">${remaining} / ${budget}</span>
          </span>
        `
    : '';

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
          <span class="strategy-switcher-item strategy-switcher-item-institution">
            <span class="strategy-switcher-label">Institution</span>
            <strong title="${escapeHtml(institutionName)}">${escapeHtml(institutionName)}</strong>
          </span>
          <span class="strategy-switcher-separator" aria-hidden="true">&middot;</span>
          <span class="strategy-switcher-item strategy-switcher-item-strategy">
            <span class="strategy-switcher-label">Strategy</span>
            <strong title="${escapeHtml(strategyTitle)}">${escapeHtml(strategyTitle)}</strong>
          </span>
          ${voteBudgetMarkup}
          <span class="strategy-switcher-caret" aria-hidden="true">
            <svg viewBox="0 0 20 20" class="strategy-switcher-caret-svg">
              <path d="M5 7.5l5 5 5-5"></path>
            </svg>
          </span>
        </div>
      </button>
      <div class="strategy-switcher-dialog" ${dialogOpen ? '' : 'hidden'}>
        ${institutionSelectMarkup()}
        ${strategySelectMarkup()}
        ${strategySwitcherMissionVisionMarkup()}
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
  toggleButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (state.userMenuOpen) {
      state.userMenuOpen = false;
    }
    state.strategySwitcherDialogOpen = !state.strategySwitcherDialogOpen;
    render();
  });
  const guideButton = container.querySelector('#openGuideFromSwitcherBtn');
  if (guideButton) {
    guideButton.addEventListener('click', (event) => {
      event.stopPropagation();
      state.strategySwitcherDialogOpen = false;
      setActiveView('guide');
    });
  }
  const createStrategyButton = container.querySelector('#openStrategyCreateModalBtn');
  if (createStrategyButton) {
    createStrategyButton.addEventListener('click', (event) => {
      event.stopPropagation();
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
    pushRouteState();

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
    pushRouteState();
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
    state.mapStrategicLinkSuggestions = null;
    state.mapStrategicLinkSuggestionsLoading = false;
    state.mapStrategicLinkSuggestionsError = '';
    state.mapStrategicLinkUsage = null;
    state.mapStrategicLinkUsageLoading = false;
    state.mapStrategicLinkUsageCycleId = '';
    state.mapStrategicLinkUsagePromise = null;
    pushRouteState();

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

  if (id === 'clarity-gremlin') {
    return '<img class="step-icon-asset step-icon-asset-gremlin" src="assets/clarity_gremlin2_ui.png" alt="" />';
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
  const items = [
    { id: 'guidelines', title: langText('GairÄ—s', 'Guidelines'), locked: false },
    { id: 'initiatives', title: langText('Iniciatyvos', 'Initiatives'), locked: false },
    { id: 'implementation-plan', title: langText('Įgyvendinimo planas', 'Implementation plan'), locked: false },
    { id: 'map', title: langText('StrategijÅ³ Å¾emÄ—lapis', 'Strategy map'), locked: false },
    { id: 'clarity-gremlin', title: clarityGremlinUiText().actionLabel, locked: false }
  ];

  const visibleItems = state.embedMapMode
    ? items.filter((item) => item.id === 'map')
    : items;

  if (state.activeView === 'admin' && !canOpenAdmin) {
    clearRouteEntityForView('guidelines');
    state.activeView = 'guidelines';
  }
  if (state.activeView === 'history' && !canOpenHistory) {
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
        ? langText('Šis rodinys prieinamas tik prisijungusiems nariams', 'This view is available to signed-in members only')
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
          if (item.id === 'clarity-gremlin') {
            state.clarityGremlinWorkspaceTab = 'home';
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

function navigateToPolicyAlignmentTab(nextTab = 'frameworks') {
  if (!isLoggedIn()) return;
  const normalizedTab = String(nextTab || 'frameworks').trim().toLowerCase();
  state.policyAlignmentWorkspaceTab = ['frameworks', 'strategy-analysis', 'external-analysis'].includes(normalizedTab)
    ? normalizedTab
    : 'frameworks';
  state.policyAlignmentAnalysisSubview = 'overview';
  state.policyAlignmentSelectedId = '';
  state.policyAlignmentCurrent = null;
  state.expandedStepId = '';
  state.userMenuOpen = false;
  if (state.activeView === 'policy-alignment') {
    syncRouteState();
    render();
    return;
  }
  setActiveView('policy-alignment');
}

function openClarityGremlinPolicyWorkspace(nextTab = 'frameworks') {
  if (!isLoggedIn()) return;
  const normalizedTab = String(nextTab || 'frameworks').trim().toLowerCase();
  state.policyAlignmentWorkspaceTab = ['frameworks', 'strategy-analysis', 'external-analysis'].includes(normalizedTab)
    ? normalizedTab
    : 'frameworks';
  state.policyAlignmentAnalysisSubview = 'overview';
  state.policyAlignmentSelectedId = '';
  state.policyAlignmentCurrent = null;
  state.expandedStepId = '';
  state.userMenuOpen = false;
  openClarityGremlinWorkspace('policy-alignment');
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

function strategySwitcherMissionVisionMarkup() {
  const mission = cycleMissionText();
  const vision = cycleVisionText();
  if (!mission && !vision) return '';

  return `
    <section class="strategy-switcher-context" aria-label="${escapeHtml(langText('Strategijos kontekstas', 'Strategy context'))}">
      ${mission ? `
        <article class="strategy-switcher-context-card">
          <span class="strategy-switcher-context-label">${escapeHtml(langText('Misija', 'Mission'))}</span>
          <p>${escapeHtml(mission)}</p>
        </article>
      ` : ''}
      ${vision ? `
        <article class="strategy-switcher-context-card">
          <span class="strategy-switcher-context-label">${escapeHtml(langText('Vizija', 'Vision'))}</span>
          <p>${escapeHtml(vision)}</p>
        </article>
      ` : ''}
    </section>
  `;
}

function renderIntroDeck() {
  if (!elements.introDeck) return;
  elements.introDeck.hidden = true;
  elements.introDeck.innerHTML = '';
}

function relationLabel(relationType) {
  const relation = String(relationType || 'orphan').toLowerCase();
  if (relation === 'parent') return langText('tėvinė', 'parent');
  if (relation === 'child') return langText('vaikinė', 'child');
  return langText('našlaitė', 'orphan');
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

function normalizeImplementationCompletedAt(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function isImplementationItemCompleted(item) {
  return Boolean(normalizeImplementationCompletedAt(item?.implementationCompletedAt));
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
    const childCount = group.children.length;
    group.children.forEach((child, index) => {
      const childPosition = childCount === 1
        ? 'single'
        : (index === 0 ? 'first' : (index === childCount - 1 ? 'last' : 'middle'));
      rows.push({
        kind: 'guideline',
        item: child,
        level: 1,
        relationKey: 'child',
        childPosition
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
    const implementationCompletedAt = normalizeImplementationCompletedAt(item.implementationCompletedAt);
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
      implementationCompletedAt,
      isCompleted: Boolean(implementationCompletedAt),
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
                    <div class="implementation-plan-calendar-row${entry.isCompleted ? ' is-completed' : ''}">
                      <div class="implementation-plan-calendar-entry-cell">
                        <div class="implementation-plan-calendar-entry-top">
                          <span class="tag implementation-plan-calendar-kind implementation-plan-calendar-kind-${escapeHtml(entry.kind)}">${escapeHtml(entry.kindLabel)}</span>
                          ${entry.isCompleted ? `<span class="tag implementation-plan-completed-tag is-completed">${escapeHtml(langText('Atlikta', 'Completed'))}</span>` : ''}
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
                              ? `<span class="implementation-plan-calendar-marker implementation-plan-calendar-marker-${escapeHtml(entry.kind)}${entry.isCompleted ? ' is-completed' : ''}"></span>`
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
  const implementationCompletedAt = normalizeImplementationCompletedAt(item.implementationCompletedAt);
  const implementationCompleted = Boolean(implementationCompletedAt);
  const childPosition = String(row.childPosition || '').trim().toLowerCase();
  const childPositionClass = level > 0 && rowKind === 'guideline' && childPosition
    ? ` implementation-plan-child-${escapeHtml(childPosition)}`
    : '';
  const implementationDateDisplay = formatInstitutionDate(implementationDateValue) || langText('Nenurodyta', 'Not set');
  const implementationOwnerDisplay = implementationOwnerValue || langText('Nenurodyta', 'Not set');
  const completedLabel = implementationCompleted
    ? langText('Atlikta', 'Completed')
    : langText('Vykdoma', 'In progress');
  const completedMeta = implementationCompleted
    ? formatCommentDateTime(implementationCompletedAt) || langText('Pažymėta kaip atlikta', 'Marked as completed')
    : '';

  return `
    <div class="implementation-plan-row implementation-plan-row-${escapeHtml(rowKind)} implementation-plan-level-${level}${childPositionClass}${implementationCompleted ? ' is-completed' : ''}" data-plan-kind="${escapeHtml(rowKind)}" data-plan-id="${escapeHtml(item.id)}">
      <div class="implementation-plan-cell implementation-plan-cell-main">
        <div class="implementation-plan-title-wrap">
          ${level > 0 ? '<span class="implementation-plan-branch" aria-hidden="true"></span>' : ''}
          <div class="implementation-plan-title-stack">
            <button type="button" class="implementation-plan-link" data-action="open-implementation-item" data-kind="${escapeHtml(rowKind)}" data-id="${escapeHtml(item.id)}">${escapeHtml(title)}</button>
            <div class="header-stack">
              ${rowKind === 'initiative' && linkedGuidelineNames.length
      ? `<span class="tag">${escapeHtml(langText('Gairės', 'Guidelines'))}: ${escapeHtml(linkedGuidelineNames.join(', '))}</span>`
      : ''}
              <span class="tag implementation-plan-completed-tag${implementationCompleted ? ' is-completed' : ''}">${escapeHtml(completedLabel)}</span>
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
        <span class="implementation-plan-cell-label">${escapeHtml(langText('Užbaigimo būsena', 'Completed status'))}</span>
        ${editable
      ? `<label class="implementation-plan-complete-toggle">
            <input type="checkbox" name="implementationCompleted" ${implementationCompleted ? 'checked' : ''} ${state.busy ? 'disabled' : ''} />
            <span class="implementation-plan-sr-only">${escapeHtml(langText('Pažymėti kaip atlikta', 'Mark as completed'))}</span>
          </label>`
      : `<label class="implementation-plan-complete-toggle implementation-plan-complete-toggle-readonly">
            <input type="checkbox" ${implementationCompleted ? 'checked' : ''} disabled aria-label="${escapeHtml(langText('Atlikta', 'Completed'))}" />
          </label>`}
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
      : `<li class="comment-item comment-item-empty">${langText('Dar nėra komentarų.', 'No comments yet.')}</li>`)
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
        <span class="tag tag-link-main">${escapeHtml(langText('Strateginiai ryšiai', 'Strategic links'))}: ${strategyLinks.length}</span>
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
  const relatedInitiatives = options?.showAssociatedInitiatives
    ? resolveGuidelineRelatedInitiatives(guideline).items
    : [];
  const relatedInitiativesMarkup = options?.showAssociatedInitiatives
    ? `
      <div class="guideline-initiative-peek">
        <div class="guideline-initiative-peek-head">
          <span class="tag tag-initiative-peek">${escapeHtml(langText('Susietos iniciatyvos', 'Linked initiatives'))}: ${relatedInitiatives.length}</span>
        </div>
        ${relatedInitiatives.length
          ? `
            <div class="guideline-initiative-peek-list">
              ${relatedInitiatives.map((initiative) => `
                <button
                  type="button"
                  class="guideline-initiative-peek-chip"
                  data-action="open-guideline-linked-initiative"
                  data-initiative-id="${escapeHtml(String(initiative?.id || '').trim())}"
                >${escapeHtml(String(initiative?.title || initiative?.id || '').trim() || '-')}</button>
              `).join('')}
            </div>
          `
          : `<p class="prompt guideline-initiative-peek-empty">${escapeHtml(langText('Susietų iniciatyvų nerasta.', 'No linked initiatives found.'))}</p>`
        }
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
        ${renderRichTextContent(guideline.description, langText('Be paaiskinimo', 'No description provided.'))}
        ${shareMarkup}
        ${strategyLinksMarkup}
        ${relatedInitiativesMarkup}
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
              <input type="text" name="comment" placeholder="${escapeHtml(langText('Įrašykite komentarą', 'Write a comment'))}" required ${state.busy ? 'disabled' : ''}/>
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
      : `<li class="comment-item comment-item-empty">${langText('Dar nėra komentarų.', 'No comments yet.')}</li>`)
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
        ${renderRichTextContent(initiative.description, langText('Be paaiskinimo', 'No description provided.'))}
        ${shareMarkup}
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
              <input type="text" name="comment" placeholder="${escapeHtml(langText('Įrašykite komentarą', 'Write a comment'))}" required ${state.busy ? 'disabled' : ''}/>
              <button class="btn btn-ghost" type="submit" ${state.busy ? 'disabled' : ''}>${langText('Prideti', 'Add')}</button>
            </form>
          ` : `<p class="prompt" style="margin: 8px 0 0;">${escapeHtml(commentsHint)}</p>`}
        </div>
      ` : ''}
    </article>
  `;
}

function setGuidelineInitiativePeekHighlight(initiativeId) {
  const normalizedId = String(initiativeId || '').trim();
  document.querySelectorAll('.guideline-initiative-peek-chip.is-linked-hover').forEach((node) => {
    node.classList.remove('is-linked-hover');
  });
  if (!normalizedId) return;
  document.querySelectorAll(`.guideline-initiative-peek-chip[data-initiative-id="${CSS.escape(normalizedId)}"]`).forEach((node) => {
    node.classList.add('is-linked-hover');
  });
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
            ${renderRichTextEditor({
              name: 'description',
              value: item.description || '',
              placeholder: langText('Trumpas gairės aprašymas', 'Short guideline description'),
              rows: 5,
              textareaClass: 'admin-edit-description'
            })}
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
                <option value="orphan" ${relation === 'orphan' ? 'selected' : ''}>${escapeHtml(langText('Našlaitė', 'Orphan'))}</option>
                <option value="parent" ${relation === 'parent' ? 'selected' : ''}>${escapeHtml(langText('Tėvinė', 'Parent'))}</option>
                <option value="child" ${relation === 'child' ? 'selected' : ''}>${escapeHtml(langText('Vaikinė', 'Child'))}</option>
              </select>
            </label>
            <label class="admin-edit-field${relation === 'child' ? '' : ' is-hidden'}" data-admin-parent-field>
              <span class="admin-edit-field-label">${escapeHtml(langText('Tėvinė gairė', 'Parent guideline'))}</span>
              <select name="parentGuidelineId" ${relation === 'child' ? '' : 'disabled'}>
                <option value="">${escapeHtml(langText('Pasirinkite tėvinę gairę', 'Select parent guideline'))}</option>
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

  bindRichTextEditors(overlay);

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const description = normalizeRichTextValue(fd.get('description'));
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
            ${renderRichTextEditor({
              name: 'description',
              value: item.description || '',
              placeholder: langText('Trumpas iniciatyvos aprašymas', 'Short initiative description'),
              rows: 5,
              textareaClass: 'admin-edit-description'
            })}
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

  bindRichTextEditors(overlay);

  const form = overlay.querySelector('#initiativeEditForm');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const description = normalizeRichTextValue(fd.get('description'));
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

function clarityGremlinUiText() {
  if (currentLanguage() === 'en') {
    return {
      title: 'Clarity Gremlin',
      subtitle: 'AI review for either the full strategy or one selected guideline / initiative.',
      actionLabel: 'Clarity Gremlin',
      setupTitle: 'Analysis setup',
      setupLead: 'Choose what to analyze, select the output language and model, then run one analysis.',
      close: 'Close',
      analyze: 'Analyze',
      scopeLabel: 'What will be analyzed?',
      scopeStrategy: 'Entire strategy',
      scopeEntity: 'Individual card',
      targetTypeLabel: 'Card type',
      targetEntityLabel: 'Selected card',
      outputLanguageLabel: 'Output language',
      outputLanguageLt: 'Lithuanian',
      outputLanguageEn: 'English',
      selectorLead: 'Choose exactly which item you want to review.',
      selectorGuidelines: 'Guidelines',
      selectorInitiatives: 'Initiatives',
      selectorChooseGuideline: 'Choose guideline',
      selectorChooseInitiative: 'Choose initiative',
      selectorRunGuideline: 'Analyze selected guideline',
      selectorRunInitiative: 'Analyze selected initiative',
      selectorNoGuidelines: 'No guidelines available in this strategy yet.',
      selectorNoInitiatives: 'No initiatives available in this strategy yet.',
      analysisTypeStrategy: 'Whole strategy',
      analysisTypeGuideline: 'Guideline',
      analysisTypeInitiative: 'Initiative',
      selectedAnalysis: 'Currently viewing',
      strategyFocus: 'Launch focus',
      entityTarget: 'Analyzed item',
      modelLabel: 'Model',
      loading: 'Clarity Gremlin is reviewing the strategy...',
      loadingEntity: 'Clarity Gremlin is reviewing the selected item...',
      unsupported: 'This page is not supported yet. Open Guidelines, Initiatives, Strategy map, or Implementation plan.',
      disabledView: 'Analysis is disabled on Admin and Policy Alignment pages.',
      loginRequired: 'Sign in to use Clarity Gremlin.',
      noCycle: 'Open a strategy cycle first to run analysis.',
      currentContext: 'Current focus',
      usage: 'Usage',
      howItWorks: 'How it works',
      howItWorksLead: 'Run either a whole-strategy review or a focused review for one selected guideline or initiative.',
      howStepCurrent: 'Analyze strategy reviews the whole guideline and initiative system in one pass.',
      howStepHistory: 'Keeps recent analyses on the left so you can reopen or compare them later.',
      howStepConsume: 'Analyze individual guideline/initiative opens one more step where you choose the exact card to review.',
      score: 'Clarity score',
      scoreTooltip: 'Rates the strategy from 1 to 10 based on content clarity, specificity, topic coverage, coherence between guidelines and initiatives, and execution readiness.',
      history: 'Recent analyses',
      noHistory: 'No recent Clarity Gremlin analyses yet. Click Analyze strategy to create the first one.',
      emptySelection: 'Select a previous analysis or run a new strategy review.',
      emptySelectionBody: 'Pick an item from Recent analyses or start either a whole-strategy or individual review.',
      createdBy: 'Created by',
      createdAt: 'Created',
      provider: 'Provider',
      currentPage: 'Current page',
      focus: 'Focus',
      strengths: 'What looks strong',
      improvements: 'What should improve',
      nextActions: 'Concrete next actions',
      draftProposals: 'Prepared draft proposals',
      createPendingDraft: 'Apply proposal',
      creatingPendingDraft: 'Applying proposal...',
      implementedDraft: 'Implemented',
      openImplementedEntity: 'Open item',
      gremlinImplementedHistory: 'Gremlin suggestion implemented',
      pendingDraftCreated: 'Suggestion applied immediately.',
      applyUpdateDraft: 'Apply correction',
      applyDeleteDraft: 'Apply deletion',
      createDraftAdminOnly: 'Immediate creation is available only to institution admins.',
      updateDraftAdminOnly: 'Immediate correction is available only to institution admins.',
      deleteDraftAdminOnly: 'Immediate deletion is available only to institution admins.',
      confirmGuidelineCreateDraftTitle: 'Create this guideline now?',
      confirmGuidelineCreateDraftBody: 'This will create the suggested guideline immediately. Please confirm that you want to add it right away.',
      confirmInitiativeCreateDraftTitle: 'Create this initiative now?',
      confirmInitiativeCreateDraftBody: 'This will create the suggested initiative immediately. Please confirm that you want to add it right away.',
      confirmGuidelineUpdateDraftTitle: 'Apply this guideline correction now?',
      confirmGuidelineUpdateDraftBody: 'This will update the existing guideline immediately. You can review the text before confirming.',
      confirmInitiativeUpdateDraftTitle: 'Apply this initiative correction now?',
      confirmInitiativeUpdateDraftBody: 'This will update the existing initiative immediately. You can review the text before confirming.',
      confirmGuidelineDeleteDraftTitle: 'Delete this guideline now?',
      confirmGuidelineDeleteDraftBody: 'This will delete the existing guideline immediately. Please confirm only if you want to remove it right away.',
      confirmInitiativeDeleteDraftTitle: 'Delete this initiative now?',
      confirmInitiativeDeleteDraftBody: 'This will delete the existing initiative immediately. Please confirm only if you want to remove it right away.',
      createGuidelineDraftApplied: 'Guideline created immediately.',
      createInitiativeDraftApplied: 'Initiative created immediately.',
      updateGuidelineDraftApplied: 'Guideline correction applied immediately.',
      updateInitiativeDraftApplied: 'Initiative correction applied immediately.',
      deleteGuidelineDraftApplied: 'Guideline deleted immediately.',
      deleteInitiativeDraftApplied: 'Initiative deleted immediately.',
      draftUnavailable: 'Draft creation is available only in a writable strategy cycle.',
      dataGaps: 'Potential gaps',
      remainingCalls: 'Remaining analyses',
      page: 'Page'
    };
  }
  return {
    title: 'Aiškumo nykštukas',
    subtitle: 'AI vertinimas visai strategijai arba vienai pasirinktai gairei / iniciatyvai.',
    actionLabel: 'Aiškumo nykštukas',
    setupTitle: 'Analizės nustatymai',
    setupLead: 'Pasirinkite, kas bus analizuojama, kokia kalba pateikti atsakymą ir kokį modelį naudoti.',
    close: 'Uždaryti',
    analyze: 'Analizuoti',
    scopeLabel: 'Kas bus analizuojama?',
    scopeStrategy: 'Visa strategija',
    scopeEntity: 'Atskira kortelė',
    targetTypeLabel: 'Kortelės tipas',
    targetEntityLabel: 'Pasirinkta kortelė',
    outputLanguageLabel: 'Rezultato kalba',
    outputLanguageLt: 'Lietuvių',
    outputLanguageEn: 'Anglų',
    selectorLead: 'Pasirinkite, kurią konkrečią kortelę norite analizuoti.',
    selectorGuidelines: 'Gairės',
    selectorInitiatives: 'Iniciatyvos',
    selectorChooseGuideline: 'Pasirinkite gairę',
    selectorChooseInitiative: 'Pasirinkite iniciatyvą',
    selectorRunGuideline: 'Analizuoti pasirinktą gairę',
    selectorRunInitiative: 'Analizuoti pasirinktą iniciatyvą',
    selectorNoGuidelines: 'Šioje strategijoje dar nėra gairių.',
    selectorNoInitiatives: 'Šioje strategijoje dar nėra iniciatyvų.',
    analysisTypeStrategy: 'Visa strategija',
    analysisTypeGuideline: 'Gairė',
    analysisTypeInitiative: 'Iniciatyva',
    selectedAnalysis: 'Šiuo metu rodoma',
    strategyFocus: 'Paleidimo fokusas',
    entityTarget: 'Analizuota kortelė',
    modelLabel: 'Modelis',
    loading: 'Aiškumo nykštukas analizuoja strategiją...',
    loadingEntity: 'Aiškumo nykštukas analizuoja pasirinktą kortelę...',
    unsupported: 'Šis puslapis kol kas nepalaikomas. Atverkite Gaires, Iniciatyvas, Strategijų žemėlapį arba Įgyvendinimo planą.',
    disabledView: 'Analizė išjungta Admin ir Politikos atitikties puslapiuose.',
    loginRequired: 'Prisijunkite, kad galėtumėte naudoti Aiškumo nykštuką.',
    noCycle: 'Pirmiausia atverkite strategijos ciklą, kad būtų galima paleisti analizę.',
    currentContext: 'Dabartinis fokusas',
    usage: 'Naudojimas',
    howItWorks: 'Kaip tai veikia',
    howItWorksLead: 'Galite paleisti arba visos strategijos analizę, arba fokusuotą vienos pasirinktos gairės / iniciatyvos analizę.',
    howStepCurrent: '„Analizuoti strategiją“ peržiūri visą gairių ir iniciatyvų sistemą vienu metu.',
    howStepHistory: 'Kairėje saugo naujausias analizes, kad galėtumėte jas bet kada vėl atsidaryti ir palyginti.',
    howStepConsume: '„Analizuoti atskirą gairę / iniciatyvą“ atveria papildomą žingsnį, kuriame pasirenkate tikslią kortelę.',
    score: 'Clarity score',
    scoreTooltip: 'Vertina visą strategiją nuo 1 iki 10 pagal turinio aiškumą, konkretumą, temos padengimą, gairių ir iniciatyvų suderinamumą bei vykdomumą.',
    history: 'Naujausios analizės',
    noHistory: 'Dar nėra ankstesnių Aiškumo nykštuko analizių. Paspauskite „Analizuoti strategiją“ ir sukurkite pirmąją.',
    emptySelection: 'Pasirinkite ankstesnę analizę arba paleiskite naują strategijos analizę.',
    emptySelectionBody: 'Kairėje pasirinkite ankstesnę analizę arba paleiskite naują visos strategijos ar vienos kortelės analizę.',
    createdBy: 'Sukūrė',
    createdAt: 'Sukurta',
    provider: 'Tiekėjas',
    currentPage: 'Dabartinis puslapis',
    focus: 'Fokusas',
    strengths: 'Kas atrodo stipru',
    improvements: 'Ką verta pagerinti',
    nextActions: 'Konkretūs kiti žingsniai',
    draftProposals: 'Paruošti pasiūlymų juodraščiai',
    createPendingDraft: 'Pritaikyti pasiūlymą',
    creatingPendingDraft: 'Pritaikomas pasiūlymas...',
    implementedDraft: 'Įgyvendinta',
    openImplementedEntity: 'Atidaryti kortelę',
    gremlinImplementedHistory: 'Aiškumo nykštuko pasiūlymas įgyvendintas',
    pendingDraftCreated: 'Pasiūlymas pritaikytas iš karto.',
    applyUpdateDraft: 'Pritaikyti koregavimą',
    applyDeleteDraft: 'Pritaikyti ištrynimą',
    createDraftAdminOnly: 'Tiesioginis sukūrimas galimas tik institucijos administratoriui.',
    updateDraftAdminOnly: 'Tiesioginis koregavimas galimas tik institucijos administratoriui.',
    deleteDraftAdminOnly: 'Tiesioginis ištrynimas galimas tik institucijos administratoriui.',
    confirmGuidelineCreateDraftTitle: 'Sukurti šią gairę dabar?',
    confirmGuidelineCreateDraftBody: 'Šis veiksmas iš karto sukurs siūlomą gairę. Prieš tęsdami įsitikinkite, kad tikrai norite ją pridėti.',
    confirmInitiativeCreateDraftTitle: 'Sukurti šią iniciatyvą dabar?',
    confirmInitiativeCreateDraftBody: 'Šis veiksmas iš karto sukurs siūlomą iniciatyvą. Prieš tęsdami įsitikinkite, kad tikrai norite ją pridėti.',
    confirmGuidelineUpdateDraftTitle: 'Pritaikyti šį gairės koregavimą dabar?',
    confirmGuidelineUpdateDraftBody: 'Šis veiksmas iš karto atnaujins esamą gairę. Prieš tęsdami įsitikinkite, kad tikrai norite pritaikyti pakeitimus.',
    confirmInitiativeUpdateDraftTitle: 'Pritaikyti šį iniciatyvos koregavimą dabar?',
    confirmInitiativeUpdateDraftBody: 'Šis veiksmas iš karto atnaujins esamą iniciatyvą. Prieš tęsdami įsitikinkite, kad tikrai norite pritaikyti pakeitimus.',
    confirmGuidelineDeleteDraftTitle: 'Ištrinti šią gairę dabar?',
    confirmGuidelineDeleteDraftBody: 'Šis veiksmas iš karto ištrins esamą gairę. Prieš tęsdami įsitikinkite, kad tikrai norite ją pašalinti.',
    confirmInitiativeDeleteDraftTitle: 'Ištrinti šią iniciatyvą dabar?',
    confirmInitiativeDeleteDraftBody: 'Šis veiksmas iš karto ištrins esamą iniciatyvą. Prieš tęsdami įsitikinkite, kad tikrai norite ją pašalinti.',
    createGuidelineDraftApplied: 'Gairė sukurta iš karto.',
    createInitiativeDraftApplied: 'Iniciatyva sukurta iš karto.',
    updateGuidelineDraftApplied: 'Gairės koregavimas pritaikytas iš karto.',
    updateInitiativeDraftApplied: 'Iniciatyvos koregavimas pritaikytas iš karto.',
    deleteGuidelineDraftApplied: 'Gairė ištrinta iš karto.',
    deleteInitiativeDraftApplied: 'Iniciatyva ištrinta iš karto.',
    draftUnavailable: 'Juodraščio kūrimas galimas tik redaguojamame strategijos cikle.',
    dataGaps: 'Galimos spragos',
    remainingCalls: 'Likę kvietimai',
    page: 'Puslapis'
  };
}

function getGremlinStrategyLoadingLabel() {
  const strategyTitle = String(state.strategy?.title || state.accountContext?.strategy?.title || state.strategySlug || '').trim();
  if (!strategyTitle) {
    return currentLanguage() === 'en'
      ? 'Clarity Gremlin is reviewing the strategy...'
      : 'Aiškumo nykštukas analizuoja strategiją...';
  }
  return currentLanguage() === 'en'
    ? `Clarity Gremlin is reviewing the strategy "${strategyTitle}"...`
    : `Aiškumo nykštukas analizuoja strategiją „${strategyTitle}“...`;
}

function getFeatureAiInfo(featureKey) {
  const institution = state.context?.institution;
  const features = institution?.aiFeatures && typeof institution.aiFeatures === 'object'
    ? institution.aiFeatures
    : {};
  const feature = features?.[featureKey] && typeof features[featureKey] === 'object'
    ? features[featureKey]
    : {};
  const provider = String(feature.provider || institution?.aiProvider || 'openai').trim().toLowerCase() === 'mistral'
    ? 'mistral'
    : 'openai';
  const model = String(feature.model || '').trim();
  return { provider, model };
}

function formatFeatureAiLabel(featureKey) {
  const info = getFeatureAiInfo(featureKey);
  if (info.model) return info.model;
  return info.provider === 'mistral' ? 'Mistral' : 'OpenAI';
}

function formatAiProviderLabel(provider, model = '') {
  const modelText = String(model || '').trim();
  const providerToken = String(provider || '').trim().toLowerCase();
  const normalizedProvider = providerToken === 'mistral' || /mistral/i.test(modelText) ? 'mistral' : 'openai';
  const providerLabel = normalizedProvider === 'mistral' ? 'Mistral' : 'OpenAI';
  if (!modelText) return providerLabel;
  return `${providerLabel} · ${modelText}`;
}

function normalizeClarityGremlinLocale(value) {
  return String(value || '').trim().toLowerCase() === 'en' ? 'en' : 'lt';
}

function getClarityGremlinModelOptions() {
  const institution = state.context?.institution && typeof state.context.institution === 'object'
    ? state.context.institution
    : {};
  const featureInfo = getFeatureAiInfo('clarityGremlin');
  const options = [];

  const addOption = (provider, model) => {
    const normalizedProvider = String(provider || '').trim().toLowerCase() === 'mistral' ? 'mistral' : 'openai';
    const modelText = String(model || '').trim();
    const value = `${normalizedProvider}:${modelText}`;
    if (options.some((item) => item.value === value)) return;
    options.push({
      value,
      provider: normalizedProvider,
      model: modelText,
      label: formatAiProviderLabel(normalizedProvider, modelText)
    });
  };

  addOption(featureInfo.provider, featureInfo.model);
  addOption('openai', institution.aiOpenaiModel);
  addOption('mistral', institution.aiMistralModel);

  if (!options.length) {
    addOption(institution.aiProvider || featureInfo.provider || 'openai', featureInfo.model || '');
  }

  return options;
}

function clarityGremlinPageLabel(view = state.activeView) {
  const normalized = String(view || '').trim().toLowerCase();
  if (normalized === 'clarity-gremlin') return clarityGremlinWorkspaceUiText().gremlinHome;
  if (normalized === 'guideline-detail') return langText('Gairės kortelė', 'Guideline detail');
  if (normalized === 'initiative-detail') return langText('Iniciatyvos kortelė', 'Initiative detail');
  if (normalized === 'guidelines') return langText('Gairių sąrašas', 'Guidelines list');
  if (normalized === 'initiatives') return langText('Iniciatyvų sąrašas', 'Initiatives list');
  if (normalized === 'implementation-plan') return langText('Įgyvendinimo planas', 'Implementation plan');
  if (normalized === 'map') return langText('Strategijų žemėlapis', 'Strategy map');
  if (normalized === 'policy-alignment') return langText('Politikos atitiktis', 'Policy Alignment');
  if (normalized === 'history') return langText('Istorija', 'History');
  if (normalized === 'admin') return 'Admin';
  return langText('Puslapis', 'Page');
}

function resolveClarityGremlinContext() {
  let view = String(state.activeView || '').trim().toLowerCase();
  let entityId = '';
  if (view === 'clarity-gremlin') {
    view = String(state.clarityGremlinLaunchContextView || 'guidelines').trim().toLowerCase();
    entityId = String(state.clarityGremlinLaunchContextEntityId || '').trim();
  }
  if (!isLoggedIn()) {
    return { supported: false, reason: 'login-required', view };
  }
  if (!state.cycle?.id) {
    return { supported: false, reason: 'cycle-required', view };
  }
  if (view === 'admin' || view === 'policy-alignment') {
    return { supported: false, reason: 'disabled-view', view };
  }
  if (!CLARITY_GREMLIN_SUPPORTED_VIEWS.has(view)) {
    return { supported: false, reason: 'unsupported-view', view };
  }

  if (view === 'guideline-detail') {
    const guideline = entityId ? findGuidelineById(entityId) : findGuidelineByRouteEntity();
    if (!guideline) return { supported: false, reason: 'missing-entity', view };
    return {
      supported: true,
      cycleId: state.cycle.id,
      view,
      entityId: guideline.id,
      contextLabel: `${clarityGremlinPageLabel(view)}: ${guideline.title || guideline.id}`
    };
  }

  if (view === 'initiative-detail') {
    const initiative = entityId ? findInitiativeById(entityId) : findInitiativeByRouteEntity();
    if (!initiative) return { supported: false, reason: 'missing-entity', view };
    return {
      supported: true,
      cycleId: state.cycle.id,
      view,
      entityId: initiative.id,
      contextLabel: `${clarityGremlinPageLabel(view)}: ${initiative.title || initiative.id}`
    };
  }

  return {
    supported: true,
    cycleId: state.cycle.id,
    view,
    entityId: '',
    contextLabel: clarityGremlinPageLabel(view)
  };
}

function canCreateClarityGremlinDrafts() {
  return Boolean(isLoggedIn() && state.cycle?.id && cycleIsWritable());
}

function findActiveGuidelineByNormalizedTitle(title) {
  const target = normalizeImportComparableText(title);
  if (!target) return null;
  return (Array.isArray(state.guidelines) ? state.guidelines : []).find((guideline) => {
    const status = String(guideline?.status || 'active').trim().toLowerCase();
    if (status !== 'active') return false;
    return normalizeImportComparableText(guideline?.title) === target;
  }) || null;
}

function resolveGremlinDraftParentGuidelineId(draft, historyItem) {
  const relationType = normalizeGuidelineRelation(draft?.relationType);
  if (relationType !== 'child') return null;

  const parentByTitle = findActiveGuidelineByNormalizedTitle(draft?.parentGuidelineTitle);
  if (parentByTitle?.id) return String(parentByTitle.id).trim();

  const view = String(historyItem?.view || '').trim().toLowerCase();
  if (view === 'guideline-detail') {
    const current = findGuidelineById(historyItem?.entityId);
    if (normalizeGuidelineRelation(current?.relationType) === 'parent') {
      return String(current?.id || '').trim() || null;
    }
  }
  return null;
}

function resolveGremlinDraftGuidelineIds(draft, historyItem) {
  const linkedFromDraft = Array.from(new Set(
    (Array.isArray(draft?.guidelineTitles) ? draft.guidelineTitles : [])
      .map((title) => findActiveGuidelineByNormalizedTitle(title))
      .map((guideline) => String(guideline?.id || '').trim())
      .filter(Boolean)
  ));
  if (linkedFromDraft.length) return linkedFromDraft;

  const view = String(historyItem?.view || '').trim().toLowerCase();
  if (view === 'initiative-detail') {
    const initiative = findInitiativeById(historyItem?.entityId);
    return resolveInitiativeLinkedGuidelines(initiative)
      .map((guideline) => String(guideline?.id || '').trim())
      .filter(Boolean);
  }
  return [];
}

function resolveGremlinDraftTargetGuideline(draft, historyItem) {
  const targetByTitle = findActiveGuidelineByNormalizedTitle(draft?.targetTitle);
  if (targetByTitle) return targetByTitle;

  const view = String(historyItem?.view || '').trim().toLowerCase();
  if (view === 'guideline-detail') {
    return findGuidelineById(historyItem?.entityId);
  }
  return null;
}

function resolveGremlinDraftTargetInitiative(draft, historyItem) {
  const targetTitle = normalizeImportComparableText(draft?.targetTitle);
  if (targetTitle) {
    const matched = (Array.isArray(state.initiatives) ? state.initiatives : []).find((initiative) => {
      const status = String(initiative?.status || 'active').trim().toLowerCase();
      if (status !== 'active') return false;
      return normalizeImportComparableText(initiative?.title) === targetTitle;
    });
    if (matched) return matched;
  }

  const view = String(historyItem?.view || '').trim().toLowerCase();
  if (view === 'initiative-detail') {
    return findInitiativeById(historyItem?.entityId);
  }
  return null;
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
      heading: langText('Vaikinės gairės', 'Child guidelines'),
      emptyLabel: langText('Vaikinių gairių dar nėra.', 'No child guidelines yet.'),
      items: children
    };
  }

  if (relation === 'child') {
    const parent = resolveGuidelineParent(item);
    return {
      heading: langText('Tėvinė gairė', 'Parent guideline'),
      emptyLabel: langText('Tėvinė gairė nepriskirta.', 'No parent guideline is assigned.'),
      items: parent ? [parent] : []
    };
  }

  const otherOrphans = sortCardsByTitle(guidelines.filter((candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    if (normalizeGuidelineRelation(candidate.relationType) !== 'orphan') return false;
    return String(candidate.id || '').trim() !== guidelineId;
  }));
  return {
    heading: langText('Kitos našlaičių gairės', 'Other orphan guidelines'),
    emptyLabel: langText('Kitų našlaičių gairių nėra.', 'No other orphan guidelines.'),
    items: otherOrphans
  };
}

function resolveGuidelineRelatedInitiatives(guideline) {
  const item = guideline && typeof guideline === 'object' ? guideline : null;
  if (!item) {
    return {
      heading: langText('Susijusios iniciatyvos', 'Associated initiatives'),
      emptyLabel: langText('Susietų iniciatyvų nerasta.', 'No linked initiatives found.'),
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
              ${(() => {
                const relation = safeTone === 'guideline'
                  ? normalizeGuidelineRelation(card?.relationType)
                  : '';
                const relationClass = relation ? ` detail-related-link-relation-${escapeHtml(relation)}` : '';
                const title = escapeHtml(card?.title || card?.id);
                const content = safeTone === 'guideline'
                  ? `<span class="detail-related-link-wrap">
                      ${relation === 'child' ? '<span class="detail-related-link-branch" aria-hidden="true"></span>' : ''}
                      <span class="detail-related-link-title">${title}</span>
                    </span>`
                  : title;
                return `
              <button
                type="button"
                class="detail-related-link detail-related-link-${escapeHtml(safeTone)}${relationClass}"
                data-action="${escapeHtml(safeAction)}"
                ${safeIdAttribute}="${escapeHtml(card.id)}"
              >${content}</button>`;
              })()}
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
  const linkedGuidelines = Array.from(uniqueById.values());
  const linkedIdSet = new Set(linkedGuidelines.map((card) => String(card?.id || '').trim()).filter(Boolean));
  const relationOrder = { parent: 0, orphan: 1, child: 2 };
  const sortedGuidelines = [...linkedGuidelines].sort((left, right) => {
    const leftRelation = normalizeGuidelineRelation(left?.relationType);
    const rightRelation = normalizeGuidelineRelation(right?.relationType);
    const leftParent = leftRelation === 'child' ? resolveGuidelineParent(left) : null;
    const rightParent = rightRelation === 'child' ? resolveGuidelineParent(right) : null;
    const leftGroup = String(leftParent?.title || left?.title || left?.id || '').trim();
    const rightGroup = String(rightParent?.title || right?.title || right?.id || '').trim();
    const groupComparison = leftGroup.localeCompare(rightGroup, undefined, { sensitivity: 'base' });
    if (groupComparison !== 0) return groupComparison;
    const leftOrder = relationOrder[leftRelation] ?? 9;
    const rightOrder = relationOrder[rightRelation] ?? 9;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    const leftTitle = String(left?.title || left?.id || '').trim();
    const rightTitle = String(right?.title || right?.id || '').trim();
    return leftTitle.localeCompare(rightTitle, undefined, { sensitivity: 'base' });
  });
  const renderedGuidelinesMarkup = sortedGuidelines.length
    ? (() => {
      const renderedParentHints = new Set();
      return sortedGuidelines.map((card) => {
        const relation = normalizeGuidelineRelation(card?.relationType);
        const relationClass = relation ? ` detail-related-link-relation-${escapeHtml(relation)}` : '';
        const parent = relation === 'child' ? resolveGuidelineParent(card) : null;
        const parentKey = String(parent?.id || parent?.title || '').trim();
        const showParentHint = relation === 'child' && parent && !linkedIdSet.has(String(parent.id || '').trim());
        const shouldRenderParentHint = showParentHint && parentKey && !renderedParentHints.has(parentKey);
        if (shouldRenderParentHint) renderedParentHints.add(parentKey);
        const parentHintMarkup = shouldRenderParentHint
          ? `
                <div class="initiative-supported-parent-context" aria-hidden="true">
                  <span class="initiative-supported-parent-label">${escapeHtml(langText('Tėvinė gairė', 'Parent guideline'))}</span>
                  <span class="initiative-supported-parent-title">${escapeHtml(parent.title || parent.id)}</span>
                </div>
              `
          : '';
        return `
              <div class="initiative-supported-item${relation === 'child' ? ' initiative-supported-item-child' : ''}">
                ${parentHintMarkup}
                <button
                  type="button"
                  class="detail-related-link detail-related-link-guideline initiative-supported-link${relationClass}"
                  data-action="open-related-guideline-detail"
                  data-guideline-id="${escapeHtml(card.id)}"
                >
                  <span class="detail-related-link-wrap">
                    ${relation === 'child' ? '<span class="detail-related-link-branch" aria-hidden="true"></span>' : ''}
                    <span class="initiative-supported-link-stack">
                      <span class="detail-related-link-title">${escapeHtml(card.title || card.id)}</span>
                    </span>
                  </span>
                </button>
              </div>
            `;
      }).join('');
    })()
    : `<div class="card guideline-empty"><strong>${escapeHtml(langText('Susietų gairių nerasta.', 'No linked guidelines found.'))}</strong></div>`;
  return `
    <div class="detail-related-grid detail-related-grid-single">
      <section class="guideline-group detail-related-group detail-related-group-tone-guideline detail-related-group-guideline initiative-supported-guidelines-section">
        <div class="guideline-group-header">
          <h3 class="detail-related-heading-compact">${escapeHtml(langText('Palaikomos gaires', 'Supported guidelines'))}</h3>
          <span class="tag detail-related-count">${sortedGuidelines.length}</span>
        </div>
        <div class="detail-related-links initiative-supported-guidelines-list">
          ${renderedGuidelinesMarkup}
        </div>
      </section>
    </div>
  `;
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
  const parentLabel = langText('Tėvinė gairė', 'Parent guideline');
  const currentTitle = String(item.title || item.id || '-').trim() || '-';

  return `
    <nav class="detail-breadcrumbs" aria-label="${escapeHtml(label)}">
      <span class="detail-breadcrumb-label">${escapeHtml(label)}:</span>
      <span class="detail-breadcrumb-node">${escapeHtml(strategyTitle)}</span>
      <span class="detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
      <button type="button" class="detail-breadcrumb-link" data-action="open-guidelines-list">${escapeHtml(listLabel)}</button>
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
      <span class="detail-breadcrumb-node">${escapeHtml(strategyTitle)}</span>
      <span class="detail-breadcrumb-sep" aria-hidden="true">&rsaquo;</span>
      <button type="button" class="detail-breadcrumb-link" data-action="open-initiatives-list">${escapeHtml(listLabel)}</button>
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

function canModeratePendingProposal(item) {
  return Boolean(canOpenAdminView() && String(item?.pendingProposalId || '').trim());
}

function proposalModerationText() {
  if (currentLanguage() === 'en') {
    return {
      title: 'Proposal review',
      subtitleGuideline: 'Review this pending guideline proposal and record the decision.',
      subtitleInitiative: 'Review this pending initiative proposal and record the decision.',
      approve: 'Approve',
      approveWithChanges: 'Approve with changes',
      reject: 'Reject',
      noteLabel: 'Decision explanation',
      notePlaceholder: 'Explain why you approved, changed, or rejected this proposal.',
      changesLabel: 'Changes before approval',
      submit: 'Submit decision',
      titleLabel: 'Title',
      descriptionLabel: 'Description',
      relationLabel: 'Relation type',
      parentLabel: 'Parent guideline',
      linkedGuidelinesLabel: 'Linked guidelines',
      standalone: 'Standalone',
      parent: 'Parent',
      child: 'Child',
      parentRequired: 'Select a parent guideline for a child guideline before approving with changes.',
      approved: 'Proposal approved.',
      approvedWithChanges: 'Proposal approved with changes.',
      rejected: 'Proposal rejected.'
    };
  }
  return {
    title: 'Pasiūlymo peržiūra',
    subtitleGuideline: 'Peržiūrėkite laukiantį gairės pasiūlymą ir užfiksuokite sprendimą.',
    subtitleInitiative: 'Peržiūrėkite laukiantį iniciatyvos pasiūlymą ir užfiksuokite sprendimą.',
    approve: 'Patvirtinti',
    approveWithChanges: 'Patvirtinti su pakeitimais',
    reject: 'Atmesti',
    noteLabel: 'Sprendimo paaiskinimas',
    notePlaceholder: 'Trumpai paaiškinkite, kodėl pasiūlymą patvirtinate, koreguojate arba atmetate.',
    changesLabel: 'Pakeitimai pries tvirtinima',
    submit: 'Pateikti sprendima',
    titleLabel: 'Pavadinimas',
    descriptionLabel: 'Aprasymas',
    relationLabel: 'Rysio tipas',
    parentLabel: 'Tėvinė gairė',
    linkedGuidelinesLabel: 'Susietos gaires',
    standalone: 'Savarankiska',
    parent: 'Tėvinė',
    child: 'Vaikinė',
    parentRequired: 'Prieš tvirtindami su pakeitimais pasirinkite tėvinę gairę vaikinės gairės pasiūlymui.',
    approved: 'Pasiūlymas patvirtintas.',
    approvedWithChanges: 'Pasiūlymas patvirtintas su pakeitimais.',
    rejected: 'Pasiūlymas atmestas.'
  };
}

function renderProposalModerationPanel(item, entityKind) {
  if (!canModeratePendingProposal(item)) return '';
  const ui = proposalModerationText();
  const proposalId = String(item?.pendingProposalId || '').trim();
  if (!proposalId) return '';
  const normalizedKind = String(entityKind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
  const pendingToneClass = normalizedKind === 'initiative'
    ? 'proposal-review-card-initiative'
    : 'proposal-review-card-guideline';
  const title = String(item?.title || '').trim();
  const description = String(item?.description || '').trim();
  const activeParentGuidelines = (Array.isArray(state.guidelines) ? state.guidelines : []).filter((guideline) =>
    String(guideline?.status || '').trim().toLowerCase() === 'active'
    && normalizeGuidelineRelation(guideline?.relationType) === 'parent'
  );
  const eligibleGuidelines = (Array.isArray(state.guidelines) ? state.guidelines : []).filter((guideline) =>
    String(guideline?.status || '').trim().toLowerCase() === 'active'
  );
  const linkedGuidelineIds = normalizedKind === 'initiative'
    ? resolveInitiativeGuidelineIds(item)
    : [];
  const relationType = normalizeGuidelineRelation(item?.relationType || 'orphan');
  const parentGuidelineId = relationType === 'child'
    ? String(item?.parentGuidelineId || '').trim()
    : '';
  return `
    <section class="card proposal-review-card ${pendingToneClass}">
      <div class="proposal-review-header">
        <div>
          <h3>${escapeHtml(ui.title)}</h3>
          <p class="prompt">${escapeHtml(normalizedKind === 'initiative' ? ui.subtitleInitiative : ui.subtitleGuideline)}</p>
        </div>
        <span class="tag tag-main">${escapeHtml(langText('Laukia tvirtinimo', 'Pending review'))}</span>
      </div>
      <form class="proposal-review-form" data-action="proposal-review" data-proposal-id="${escapeHtml(proposalId)}" data-entity-kind="${escapeHtml(normalizedKind)}">
        <div class="proposal-review-pill" role="group" aria-label="${escapeHtml(ui.title)}">
          <button type="button" class="proposal-review-choice active" data-decision="approved">${escapeHtml(ui.approve)}</button>
          <button type="button" class="proposal-review-choice" data-decision="approved_with_changes">${escapeHtml(ui.approveWithChanges)}</button>
          <button type="button" class="proposal-review-choice" data-decision="rejected">${escapeHtml(ui.reject)}</button>
        </div>
        <input type="hidden" name="decision" value="approved" />
        <label class="proposal-review-field">
          <span class="proposal-review-label">${escapeHtml(ui.noteLabel)}</span>
          <textarea name="reviewNote" rows="3" placeholder="${escapeHtml(ui.notePlaceholder)}"></textarea>
        </label>
        <div class="proposal-review-changes" hidden>
          <div class="proposal-review-label">${escapeHtml(ui.changesLabel)}</div>
          <div class="proposal-review-grid">
            <label class="proposal-review-field proposal-review-field-full">
              <span class="proposal-review-label">${escapeHtml(ui.titleLabel)}</span>
              <input type="text" name="title" value="${escapeHtml(title)}" />
            </label>
            <label class="proposal-review-field proposal-review-field-full">
              <span class="proposal-review-label">${escapeHtml(ui.descriptionLabel)}</span>
              <textarea name="description" rows="4">${escapeHtml(description)}</textarea>
            </label>
            ${normalizedKind === 'guideline' ? `
              <label class="proposal-review-field">
                <span class="proposal-review-label">${escapeHtml(ui.relationLabel)}</span>
                <select name="relationType">
                  <option value="orphan" ${relationType === 'orphan' ? 'selected' : ''}>${escapeHtml(ui.standalone)}</option>
                  <option value="parent" ${relationType === 'parent' ? 'selected' : ''}>${escapeHtml(ui.parent)}</option>
                  <option value="child" ${relationType === 'child' ? 'selected' : ''}>${escapeHtml(ui.child)}</option>
                </select>
              </label>
              <label class="proposal-review-field proposal-review-parent-field" ${relationType === 'child' ? '' : 'hidden'}>
                <span class="proposal-review-label">${escapeHtml(ui.parentLabel)}</span>
                <select name="parentGuidelineId">
                  ${buildParentGuidelineOptions(activeParentGuidelines, parentGuidelineId)}
                </select>
              </label>
            ` : `
              <div class="proposal-review-field proposal-review-field-full">
                <span class="proposal-review-label">${escapeHtml(ui.linkedGuidelinesLabel)}</span>
                <div class="proposal-review-guidelines">
                  ${renderGuidelineCheckboxList(eligibleGuidelines, { selectedIds: linkedGuidelineIds, name: 'guidelineIds' })}
                </div>
              </div>
            `}
          </div>
        </div>
        <div class="proposal-review-actions">
          <button type="submit" class="btn btn-primary">${escapeHtml(ui.submit)}</button>
        </div>
      </form>
    </section>
  `;
}

function bindProposalModerationPanel(container, item, entityKind) {
  if (!(container instanceof HTMLElement) || !canModeratePendingProposal(item)) return;
  const form = container.querySelector('[data-action="proposal-review"]');
  if (!(form instanceof HTMLFormElement)) return;
  const ui = proposalModerationText();
  const normalizedKind = String(entityKind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
  const decisionInput = form.querySelector('input[name="decision"]');
  const changesBlock = form.querySelector('.proposal-review-changes');
  const relationSelect = form.querySelector('select[name="relationType"]');
  const parentField = form.querySelector('.proposal-review-parent-field');
  const parentSelect = form.querySelector('select[name="parentGuidelineId"]');

  const syncDecisionState = () => {
    const decision = String(decisionInput?.value || 'approved').trim().toLowerCase();
    form.querySelectorAll('.proposal-review-choice').forEach((button) => {
      const isActive = String(button.getAttribute('data-decision') || '').trim().toLowerCase() === decision;
      button.classList.toggle('active', isActive);
    });
    if (changesBlock instanceof HTMLElement) {
      changesBlock.hidden = decision !== 'approved_with_changes';
    }
  };

  const syncParentState = () => {
    if (!(relationSelect instanceof HTMLSelectElement) || !(parentField instanceof HTMLElement) || !(parentSelect instanceof HTMLSelectElement)) return;
    const isChild = normalizeGuidelineRelation(relationSelect.value) === 'child';
    parentField.hidden = !isChild;
    parentSelect.disabled = !isChild;
    if (!isChild) parentSelect.value = '';
  };

  form.querySelectorAll('.proposal-review-choice').forEach((button) => {
    button.addEventListener('click', () => {
      if (!(decisionInput instanceof HTMLInputElement)) return;
      decisionInput.value = String(button.getAttribute('data-decision') || 'approved').trim().toLowerCase();
      syncDecisionState();
    });
  });

  if (relationSelect instanceof HTMLSelectElement) {
    relationSelect.addEventListener('change', syncParentState);
    syncParentState();
  }
  syncDecisionState();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const decision = String(fd.get('decision') || 'approved').trim().toLowerCase();
    const proposalId = String(form.dataset.proposalId || '').trim();
    if (!proposalId) return;
    const body = {
      decision,
      reviewNote: String(fd.get('reviewNote') || '').trim()
    };

    if (decision === 'approved_with_changes') {
      body.title = String(fd.get('title') || '').trim();
      body.description = String(fd.get('description') || '').trim();
      if (normalizedKind === 'guideline') {
        const relationType = normalizeGuidelineRelation(fd.get('relationType'));
        const parentGuidelineId = String(fd.get('parentGuidelineId') || '').trim();
        if (relationType === 'child' && !parentGuidelineId) {
          notifyError(ui.parentRequired);
          return;
        }
        body.relationType = relationType;
        body.parentGuidelineId = relationType === 'child' ? parentGuidelineId : null;
      } else {
        body.guidelineIds = checkedFormValues(form, 'guidelineIds');
      }
    }

    await runBusy(async () => {
      const result = await api(`/api/v1/admin/proposals/${encodeURIComponent(proposalId)}/decision`, {
        method: 'POST',
        body
      });
      state.notice = decision === 'approved_with_changes'
        ? ui.approvedWithChanges
        : (decision === 'approved' ? ui.approved : ui.rejected);
      notifySuccess(state.notice);
      if (decision === 'rejected' || !String(result?.finalEntityId || '').trim()) {
        setActiveView(normalizedKind === 'initiative' ? 'initiatives' : 'guidelines');
        await bootstrap();
        return;
      }
      if (normalizedKind === 'initiative') {
        setRouteEntity('initiative', result.finalEntityId);
        state.activeView = 'initiative-detail';
      } else {
        setRouteEntity('guideline', result.finalEntityId);
        state.activeView = 'guideline-detail';
      }
      syncRouteState();
      await bootstrap();
    });
  });
}

function renderGuidelineDetailView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite instituciją', 'Select an institution')}</strong>
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
        <p class="prompt" style="margin: 8px 0 0;">${langText('Patikrinkite nuorodą arba grįžkite į gairių sąrašą.', 'Check the URL or return to guideline list.')}</p>
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
  const breadcrumbMarkup = buildGuidelineDetailBreadcrumbs(guideline);
  const relatedGuidelinesMarkup = renderGuidelineDetailRelatedGrid(guideline);
  const canManage = canManageSelectedInstitution();
  const isPendingProposal = Boolean(String(guideline.pendingProposalId || '').trim());
  const canEdit = canManage && !isPendingProposal;
  const canImport = canImportExternalItem(guideline);
  elements.stepView.innerHTML = `
    <div class="step-header">
      <div></div>
      <div class="header-stack step-header-actions">
        ${canEdit ? `<button id="editGuidelineBtn" class="btn btn-primary">${langText('Redaguoti', 'Edit')}</button>` : ''}
        ${canImport ? `<button id="importGuidelineBtn" class="btn btn-primary">${langText('Naudoti mano strategijoje', 'Use in my strategy')}</button>` : ''}
        <button id="backToGuidelinesBtn" class="btn btn-ghost">${langText('GrÄ¯Å¾ti Ä¯ gaires', 'Back to guidelines')}</button>
        <button id="openGuidelineMapBtn" class="btn btn-ghost">${langText('Rodyti Å¾emÄ—lapyje', 'Show on map')}</button>
      </div>
    </div>
    ${breadcrumbMarkup}
    ${renderImplementationMetaSummary(guideline)}
    ${renderProposalModerationPanel(guideline, 'guideline')}
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
  bindProposalModerationPanel(elements.stepView, guideline, 'guideline');
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
        <strong>${langText('Pasirinkite instituciją', 'Select an institution')}</strong>
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
        <p class="prompt" style="margin: 8px 0 0;">${langText('Patikrinkite nuorodą arba grįžkite į iniciatyvų sąrašą.', 'Check the URL or return to initiative list.')}</p>
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
  const isPendingProposal = Boolean(String(initiative.pendingProposalId || '').trim());
  const canEdit = canManage && !isPendingProposal;
  const canImport = canImportExternalItem(initiative);
  elements.stepView.innerHTML = `
    <div class="step-header">
      <h2>${langText('Iniciatyvos kortele', 'Initiative card')}</h2>
      <div class="header-stack step-header-actions">
        ${canEdit ? `<button id="editInitiativeBtn" class="btn btn-primary">${langText('Redaguoti', 'Edit')}</button>` : ''}
        ${canImport ? `<button id="importInitiativeBtn" class="btn btn-primary">${langText('Naudoti mano strategijoje', 'Use in my strategy')}</button>` : ''}
        <button id="backToInitiativesBtn" class="btn btn-ghost">${langText('GrÄ¯Å¾ti Ä¯ iniciatyvas', 'Back to initiatives')}</button>
        <button id="openInitiativeMapBtn" class="btn btn-ghost">${langText('Rodyti Å¾emÄ—lapyje', 'Show on map')}</button>
      </div>
    </div>
    ${renderImplementationMetaSummary(initiative)}
    ${renderProposalModerationPanel(initiative, 'initiative')}
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
  bindProposalModerationPanel(elements.stepView, initiative, 'initiative');
}

function renderInitiativesView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite instituciją', 'Select an institution')}</strong>
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
  const initiatives = Array.isArray(state.initiatives) ? state.initiatives : [];
  const eligibleGuidelines = state.guidelines.filter((guideline) => {
    const status = String(guideline.status || 'active').toLowerCase();
    return status === 'active';
  });
  const guidelineInitiativeMatrix = renderGuidelineInitiativeMatrix(eligibleGuidelines, initiatives);

  elements.stepView.innerHTML = `
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
            <p class="prompt" style="margin: 6px 0 0;">${langText('Šioje institucijoje kol kas nėra sukurtų iniciatyvų.', 'No initiatives have been created for this institution yet.')}</p>
          </div>`
      }
    </section>

    <section id="initiativeAddSection" class="step-add-anchor">
    ${member ? (writable ? `
      <div class="card initiative-add-card" style="margin-top: 16px;">
        <div class="header-row">
          <strong>${langText('Nauja iniciatyva', 'New initiative')}</strong>
          <span class="tag">${langText('Pasiūlymas', 'Suggestion')}</span>
        </div>
        <div class="initiative-add-layout">
          <div class="initiative-add-form-pane">
            <p class="prompt" style="margin-bottom: 10px;">${langText('Iniciatyva turi buti priskirta bent vienai gairei.', 'An initiative must be linked to at least one guideline.')}</p>
            <form id="initiativeAddForm">
              <div class="form-row">
                <input type="text" name="title" placeholder="${escapeHtml(langText('Iniciatyvos pavadinimas', 'Initiative title'))}" required ${state.busy ? 'disabled' : ''}/>
              </div>
              ${renderRichTextEditor({
                name: 'desc',
                placeholder: langText('Trumpas paaiskinimas', 'Short description'),
                rows: 5,
                disabled: state.busy
              })}
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
        <strong>${langText('Prisijunkite, kad galėtumėte aktyviai dalyvauti', 'Sign in to participate actively')}</strong>
        <button id="openAuthFromStep" class="btn btn-primary" style="margin-top: 12px;">${langText('Prisijungti', 'Sign in')}</button>
      </div>
    `)}
    </section>

    <div class="header-stack step-header-actions" style="margin-top: 16px;">
      <button id="exportBtnInline" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>${langText('Eksportuoti santrauka', 'Export summary')}</button>
    </div>
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
  bindRichTextEditors(elements.stepView);
  if (initiativeForm) {
    initiativeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(initiativeForm);
      const title = String(fd.get('title') || '').trim();
      const description = normalizeRichTextValue(fd.get('desc'));
      const guidelineIds = Array.from(initiativeForm.querySelectorAll('input[name="guidelineIds"]:checked'))
        .map((input) => String(input.value || '').trim())
        .filter(Boolean);
      if (!title) return;

      await runBusy(async () => {
        const endpoint = state.role === 'institution_admin'
          ? `/api/v1/admin/cycles/${encodeURIComponent(state.cycle.id)}/initiatives`
          : `/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/initiatives`;
        await api(endpoint, {
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
        <strong>${langText('Pasirinkite instituciją', 'Select an institution')}</strong>
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

      ${activeSubview === 'calendar'
        ? renderImplementationPlanCalendarMarkup(calendarData)
        : `
          <form id="implementationPlanForm" class="card implementation-plan-board">
            <div class="implementation-plan-table-head">
              <div>${escapeHtml(activeLayer === 'initiatives' ? langText('Iniciatyva', 'Initiative') : langText('Gairė', 'Guideline'))}</div>
              <div>${escapeHtml(langText('Įgyvendinimo data', 'Implementation date'))}</div>
              <div>${escapeHtml(langText('Atsakingas asmuo / padalinys', 'Responsible person / unit'))}</div>
              <div>${escapeHtml(langText('Užbaigimo būsena', 'Completed status'))}</div>
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
        const implementationCompleted = Boolean(row.querySelector('[name="implementationCompleted"]')?.checked);

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
              implementationOwner,
              implementationCompleted
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
            implementationOwner,
            implementationCompleted
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
  if (key === 'guideline_created') return langText('Gairė sukurta', 'Guideline created');
  if (key === 'initiative_created') return langText('Iniciatyva sukurta', 'Initiative created');
  if (key === 'proposal_submitted') return langText('Pasiūlymas pateiktas', 'Proposal submitted');
  if (key === 'proposal_approved') return langText('Pasiūlymas patvirtintas', 'Proposal approved');
  if (key === 'proposal_approved_with_changes') return langText('Pasiūlymas patvirtintas su pakeitimais', 'Proposal approved with changes');
  if (key === 'proposal_rejected') return langText('Pasiūlymas atmestas', 'Proposal rejected');
  if (key === 'proposal_cancelled') return langText('Irasas pasalintas administratoriaus', 'Entry deleted by admin');
  if (key === 'gremlin_draft_implemented') return clarityGremlinUiText().gremlinImplementedHistory;
  if (key === 'guideline_commented') return langText('Gaire pakomentuota', 'Guideline commented');
  if (key === 'initiative_commented') return langText('Iniciatyva pakomentuota', 'Initiative commented');
  if (key === 'proposal_commented') return langText('Pasiūlymas pakomentuotas', 'Proposal commented');
  return key || '-';
}

function historyActionPriority(action) {
  const key = String(action || '').trim().toLowerCase();
  if (key === 'strategy_created') return -100;
  if (key === 'guideline_created' || key === 'initiative_created') return -20;
  if (key === 'proposal_submitted') return -10;
  if (key === 'gremlin_draft_implemented') return 5;
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
  const directEntityAllowed = action === 'gremlin_draft_implemented';
  const targetId = entityId || (fallbackAllowed ? proposalId : '') || (directEntityAllowed ? entityId : '');
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
        <strong>${langText('Pasirinkite instituciją', 'Select an institution')}</strong>
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
  const heading = langText('Pasirinkite strategiją', 'Select a strategy');
  const helper = langText(
    'Pasirinkite, kurią strategiją norite peržiūrėti. Be strategijos pasirinkimo turinys nerodomas.',
    'Choose which strategy you want to view. Content stays hidden until a strategy is selected.'
  );
  const lastUsedLabel = langText('Paskutinis pasirinktas', 'Last used');
  const noStrategiesTitle = langText('Strategiju kol kas nera', 'No strategies yet');
  const noStrategiesHint = langText(
    'Šiai institucijai dar nėra sukurtų strategijų. Paprašykite administratoriaus sukurti bent vieną strategiją.',
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

  if (state.activeView === 'clarity-gremlin') {
    renderClarityGremlinWorkspaceView();
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
        <strong>${langText('Pasirinkite instituciją', 'Select an institution')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">
          ${langText('Kairiajame meniu pasirinkite instituciją iš išskleidžiamo sąrašo, kad atvertumėte jos viešą gairių puslapį.', 'Use the left menu institution selector to open its public guideline page.')}
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
  const relationGroups = buildGuidelineRelationshipGroups(state.guidelines);
  const activeParentGuidelines = (state.guidelines || []).filter((guideline) => {
    const status = String(guideline?.status || '').trim().toLowerCase();
    return status === 'active' && normalizeGuidelineRelation(guideline?.relationType) === 'parent';
  });
  const parentGuidelineOptions = activeParentGuidelines
    .map((guideline) => `<option value="${escapeHtml(guideline.id)}">${escapeHtml(guideline.title || guideline.id)}</option>`)
    .join('');

  elements.stepView.innerHTML = `
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
                      commentsVisible: state.commentsVisible,
                      showAssociatedInitiatives: state.guidelinesShowInitiatives
                    })}
                  </div>
                  <div class="relationship-child-stack">
                    <div class="relationship-child-label">${langText('Vaikinės gairės', 'Child guidelines')}: ${group.children.length}</div>
                    ${group.children.length
                      ? `<div class="card-list relationship-child-grid">
                          ${group.children.map((child) => renderGuidelineCard(child, {
                            member,
                            writable,
                            authenticated,
                            commentsVisible: state.commentsVisible,
                            showAssociatedInitiatives: state.guidelinesShowInitiatives
                          })).join('')}
                        </div>`
                      : `<div class="relationship-child-empty">
                          <p class="prompt">${langText('Vaikinių gairių dar nėra.', 'No child guidelines yet.')}</p>
                          ${member && writable ? `<button type="button" class="btn btn-primary relationship-child-create-btn" data-action="create-child-guideline" data-parent-id="${escapeHtml(group.parent.id)}">${langText('Sukurti', 'Create')}</button>` : ''}
                        </div>`
                    }
                  </div>
                </div>
              </div>
            `).join('')
          : `<div class="card guideline-empty">
              <strong>${langText('Kol kas nėra tėvinių gairių su ryšiais','No parent guidelines with links yet')}</strong>
              <p class="prompt" style="margin: 6px 0 0;">${langText('Sukūrus ryšius, tėvinės ir vaikinės gairės bus rodomos viename bloke.','Once links are created, parent and child guidelines will be displayed in one block.')}</p>
            </div>`
        }
      </section>

      ${relationGroups.unassignedChildren.length ? `
        <section class="guideline-group">
          <div class="guideline-group-header">
            <h3>${langText('Vaikinės be tėvinės', 'Children without parent')}</h3>
            <span class="tag">${relationGroups.unassignedChildren.length}</span>
          </div>
          <p class="prompt">${langText('Šios vaikinės gairės dar neturi teisingai priskirtos tėvinės gairės.', 'These child guidelines are missing a properly assigned parent guideline.')}</p>
          <div class="card-list">
            ${relationGroups.unassignedChildren.map((guideline) => renderGuidelineCard(guideline, {
              member,
              writable,
              authenticated,
              commentsVisible: state.commentsVisible,
              showAssociatedInitiatives: state.guidelinesShowInitiatives
            })).join('')}
          </div>
        </section>
      ` : ''}

      <section class="guideline-group">
        <div class="guideline-group-header">
          <h3>${langText('Naslaitines gaires', 'Orphan guidelines')}</h3>
          <span class="tag">${relationGroups.orphanGuidelines.length}</span>
        </div>
        <p class="prompt">${langText('Savarankiškos gairės, kurios nėra priskirtos tėvinei gairei.', 'Standalone guidelines that are not assigned to a parent guideline.')}</p>
        ${relationGroups.orphanGuidelines.length
          ? `<div class="card-list">
              ${relationGroups.orphanGuidelines.map((guideline) => renderGuidelineCard(guideline, {
                member,
                writable,
                authenticated,
                commentsVisible: state.commentsVisible,
                showAssociatedInitiatives: state.guidelinesShowInitiatives
              })).join('')}
            </div>`
          : `<div class="card guideline-empty">
              <strong>${langText('Našlaitinių gairių nėra','No orphan guidelines')}</strong>
              <p class="prompt" style="margin: 6px 0 0;">${langText('Visos gairės jau susietos su tėvinėmis arba pažymėtos kitaip.','All guidelines are already linked to parent guidelines or marked differently.')}</p>
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
              <option value="orphan">${escapeHtml(langText('Našlaitė gairė', 'Orphan guideline'))}</option>
              <option value="parent">${escapeHtml(langText('Tėvinė gairė', 'Parent guideline'))}</option>
              <option value="child">${escapeHtml(langText('Vaikinė gairė', 'Child guideline'))}</option>
            </select>
          </div>
          <div class="form-row" id="guidelineParentRow" hidden>
            <select name="parentGuidelineId" id="guidelineParentGuidelineId" ${state.busy ? 'disabled' : ''}>
              <option value="">${escapeHtml(langText('Pasirinkite tėvinę gairę', 'Select parent guideline'))}</option>
              ${parentGuidelineOptions}
            </select>
          </div>
          ${activeParentGuidelines.length
    ? ''
    : `<p id="guidelineParentHint" class="prompt" hidden>${langText('Nėra aktyvių tėvinių gairių. Pirmiausia sukurkite tėvinę gairę.', 'No active parent guidelines found. Create a parent guideline first.')}</p>`}
          ${renderRichTextEditor({
            name: 'desc',
            placeholder: langText('Trumpas paaiskinimas', 'Short description'),
            rows: 5,
            disabled: state.busy
          })}
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
          ${langText('Šios institucijos strategiją galite peržiūrėti, bet teikti pasiūlymų, komentuoti ir balsuoti negalite.','You can view this selected institution strategy, but you cannot submit suggestions, comment, or vote here.')}
        </p>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>${langText('Prisijunkite, kad galėtumėte aktyviai dalyvauti', 'Sign in to participate actively')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${langText('Viešai matomi visi komentarai prie strategijos gairių. Prisijungus galima siūlyti gaires, komentuoti ir balsuoti.', 'Public users can view the strategy cards. Sign in to suggest guidelines, comment, and vote.')}</p>
        <button id="openAuthFromStep" class="btn btn-primary" style="margin-top: 12px;">${langText('Prisijungti', 'Sign in')}</button>
      </div>
    `)}
    </section>

    <div class="header-stack step-header-actions" style="margin-top: 16px;">
      <button id="exportBtnInline" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>${langText('Eksportuoti santrauka', 'Export summary')}</button>
    </div>
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

  bindRichTextEditors(elements.stepView);

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
      const description = normalizeRichTextValue(fd.get('desc'));
      const relationType = normalizeGuidelineRelation(fd.get('relationType'));
      const parentGuidelineId = String(fd.get('parentGuidelineId') || '').trim();
      if (!title) return;
      if (relationType === 'child' && !parentGuidelineId) {
        notifyError(langText('Pasirinkite tėvinę gairę vaikinės gairės pasiūlymui.', 'Select a parent guideline for a child guideline.'));
        return;
      }

      await runBusy(async () => {
        const endpoint = state.role === 'institution_admin'
          ? `/api/v1/admin/cycles/${encodeURIComponent(state.cycle.id)}/guidelines`
          : `/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/guidelines`;
        await api(endpoint, {
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
    list.addEventListener('mouseover', (event) => {
      const target = event.target instanceof Element ? event.target.closest('.guideline-initiative-peek-chip') : null;
      if (!(target instanceof HTMLElement)) return;
      setGuidelineInitiativePeekHighlight(target.dataset.initiativeId);
    });
    list.addEventListener('mouseout', (event) => {
      const target = event.target instanceof Element ? event.target.closest('.guideline-initiative-peek-chip') : null;
      if (!(target instanceof HTMLElement)) return;
      const relatedTarget = event.relatedTarget instanceof Element ? event.relatedTarget.closest('.guideline-initiative-peek-chip') : null;
      if (relatedTarget instanceof HTMLElement) {
        const nextInitiativeId = String(relatedTarget.dataset.initiativeId || '').trim();
        if (nextInitiativeId) {
          setGuidelineInitiativePeekHighlight(nextInitiativeId);
          return;
        }
      }
      setGuidelineInitiativePeekHighlight('');
    });
    list.addEventListener('focusin', (event) => {
      const target = event.target instanceof Element ? event.target.closest('.guideline-initiative-peek-chip') : null;
      if (!(target instanceof HTMLElement)) return;
      setGuidelineInitiativePeekHighlight(target.dataset.initiativeId);
    });
    list.addEventListener('focusout', (event) => {
      const target = event.target instanceof Element ? event.target.closest('.guideline-initiative-peek-chip') : null;
      if (!(target instanceof HTMLElement)) return;
      const relatedTarget = event.relatedTarget instanceof Element ? event.relatedTarget.closest('.guideline-initiative-peek-chip') : null;
      if (relatedTarget instanceof HTMLElement) {
        const nextInitiativeId = String(relatedTarget.dataset.initiativeId || '').trim();
        if (nextInitiativeId) {
          setGuidelineInitiativePeekHighlight(nextInitiativeId);
          return;
        }
      }
      setGuidelineInitiativePeekHighlight('');
    });
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

      if (action === 'open-guideline-linked-initiative') {
        const initiativeId = String(actionElement.dataset.initiativeId || '').trim();
        if (!initiativeId) return;
        openInitiativeDetail(initiativeId);
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
          ? langText('Gairės nuoroda nukopijuota.', 'Guideline URL copied.')
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
    state.userMenuOpen = false;
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
  const canOpenAdmin = canOpenAdminView();
  const canOpenHistory = isLoggedIn();
  const canOpenPolicyAlignment = isLoggedIn();
  const currentPolicyAlignmentTabRaw = String(state.policyAlignmentWorkspaceTab || 'frameworks').trim().toLowerCase();
  const currentPolicyAlignmentTab = ['frameworks', 'strategy-analysis', 'external-analysis'].includes(currentPolicyAlignmentTabRaw)
    ? currentPolicyAlignmentTabRaw
    : 'frameworks';
  const userMenuLabel = langText('Naudotojo meniu', 'User menu');
  const currentUtilityView = state.activeView === 'clarity-gremlin' && state.clarityGremlinWorkspaceTab === 'policy-alignment'
    ? currentPolicyAlignmentTab
    : state.activeView === 'policy-alignment'
    ? currentPolicyAlignmentTab
    : state.activeView;

  container.innerHTML = `
    <div class="user-toolbar user-toolbar-main">
      ${strategySwitcherCardMarkup({ topbar: true })}
      <div class="user-menu-shell">
        <button id="userMenuToggle" class="user-chip user-menu-trigger${state.userMenuOpen ? ' active' : ''}" type="button" aria-haspopup="menu" aria-expanded="${state.userMenuOpen ? 'true' : 'false'}" aria-label="${escapeHtml(userMenuLabel)}">
          <span>${escapeHtml(displayName)}</span>
          <span class="tag">${escapeHtml(roleLabel)}</span>
          <span class="user-menu-caret" aria-hidden="true">
            <svg viewBox="0 0 20 20" class="user-menu-caret-svg">
              <path d="M5 7.5l5 5 5-5"></path>
            </svg>
          </span>
        </button>
        <div class="user-menu-panel${state.userMenuOpen ? ' open' : ''}" role="menu" aria-label="${escapeHtml(userMenuLabel)}"${state.userMenuOpen ? '' : ' hidden'}>
          <div class="user-menu-section">
            <button type="button" class="user-menu-item${currentUtilityView === 'history' ? ' active' : ''}" data-user-nav="history"${canOpenHistory ? '' : ' disabled'}>${escapeHtml(langText('Istorija', 'History'))}</button>
            <button type="button" class="user-menu-item${currentUtilityView === 'admin' ? ' active' : ''}" data-user-nav="admin"${canOpenAdmin ? '' : ' disabled'}>${escapeHtml(langText('Admin', 'Admin'))}</button>
          </div>
          <div class="user-menu-section">
            <div class="user-menu-section-label">${escapeHtml(langText('Politikos atitiktis', 'Policy Alignment'))}</div>
            <button type="button" class="user-menu-item${currentUtilityView === 'frameworks' ? ' active' : ''}" data-policy-alignment-nav="frameworks"${canOpenPolicyAlignment ? '' : ' disabled'}>${escapeHtml(langText('Politikos karkasas', 'Policy framework'))}</button>
            <button type="button" class="user-menu-item${currentUtilityView === 'strategy-analysis' ? ' active' : ''}" data-policy-alignment-nav="strategy-analysis"${canOpenPolicyAlignment ? '' : ' disabled'}>${escapeHtml(langText('Strategijos analizė', 'Strategy analysis'))}</button>
            <button type="button" class="user-menu-item${currentUtilityView === 'external-analysis' ? ' active' : ''}" data-policy-alignment-nav="external-analysis"${canOpenPolicyAlignment ? '' : ' disabled'}>${escapeHtml(langText('Išorinė analizė', 'External analysis'))}</button>
          </div>
          <div class="user-menu-section user-menu-section-signout">
            <button id="logoutBtn" type="button" class="user-menu-item user-menu-item-signout">${escapeHtml(langText('Atsijungti', 'Sign out'))}</button>
          </div>
        </div>
      </div>
    </div>
  `;
  bindStrategySwitcherDialog(container);
  bindInstitutionSwitch(container);
  bindStrategySwitch(container);

  const userMenuToggle = container.querySelector('#userMenuToggle');
  if (userMenuToggle) {
    userMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      state.userMenuOpen = !state.userMenuOpen;
      renderUserBar();
    });
  }

  container.querySelectorAll('[data-user-nav]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (button.hasAttribute('disabled')) return;
      const nextView = String(button.getAttribute('data-user-nav') || '').trim().toLowerCase();
      if (!nextView) return;
      state.userMenuOpen = false;
      state.expandedStepId = '';
      if (state.activeView === nextView) {
        syncRouteState();
        render();
        return;
      }
      setActiveView(nextView);
    });
  });

  container.querySelectorAll('[data-policy-alignment-nav]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (button.hasAttribute('disabled')) return;
      openClarityGremlinPolicyWorkspace(button.getAttribute('data-policy-alignment-nav'));
    });
  });

  const logoutBtn = container.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      state.userMenuOpen = false;
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
  floating.hidden = true;
  floating.innerHTML = '';
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
    lines.push(`  apraÅ¡ymas: ${richTextToPlainText(guideline.description, 'be paaiÅ¡kinimo')}`);
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
      lines.push(`  apraÅ¡ymas: ${richTextToPlainText(initiative.description, 'be paaiÅ¡kinimo')}`);
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
  document.addEventListener('click', (event) => {
    if (!state.userMenuOpen) return;
    const userBar = document.getElementById('userBar');
    if (userBar && event.target instanceof Node && userBar.contains(event.target)) return;
    state.userMenuOpen = false;
    renderUserBar();
  });
  document.addEventListener('click', (event) => {
    if (!state.strategySwitcherDialogOpen) return;
    const userBar = document.getElementById('userBar');
    const switcher = userBar?.querySelector('.strategy-switcher-card-topbar');
    if (switcher && event.target instanceof Node && switcher.contains(event.target)) return;
    state.strategySwitcherDialogOpen = false;
    renderUserBar();
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
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.strategySwitcherDialogOpen) {
      state.strategySwitcherDialogOpen = false;
      renderUserBar();
      return;
    }
    if (event.key === 'Escape' && state.userMenuOpen) {
      state.userMenuOpen = false;
      renderUserBar();
      return;
    }
    if (event.defaultPrevented || event.repeat) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tagName = String(target.tagName || '').toLowerCase();
      if (target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;
    }
    const key = String(event.key || '').toLowerCase();
    const code = String(event.code || '').trim();
    const pressedI = code === 'KeyI' || key === 'i';
    const pressedJ = code === 'KeyJ' || key === 'j';
    if (state.activeView === 'guidelines' && pressedI) {
      event.preventDefault();
      state.guidelinesShowInitiatives = !state.guidelinesShowInitiatives;
      render();
      return;
    }
    if (state.activeView !== 'map') return;
    if (pressedI) {
      if (state.mapLayer !== 'guidelines') return;
      event.preventDefault();
      state.mapGuidelinesShowInitiatives = !state.mapGuidelinesShowInitiatives;
      const viewport = document.getElementById('strategyMapViewport');
      if (viewport instanceof HTMLElement) {
        viewport.classList.toggle('map-guidelines-show-initiatives', state.mapGuidelinesShowInitiatives);
      }
      return;
    }
    if (!pressedJ) return;
    state.mapSecretAnthracite = !state.mapSecretAnthracite;
    const viewport = document.getElementById('strategyMapViewport');
    if (viewport instanceof HTMLElement) {
      viewport.classList.toggle('map-secret-anthracite', state.mapSecretAnthracite);
    }
  });
  window.addEventListener('scroll', maybeAutoCollapseIntroOnFirstScroll, { passive: true });
  window.addEventListener('popstate', () => {
    void handleBrowserPopState();
  });
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
      aiTab: 'Clarity Gremlin from PDF',
      strategySetup: 'Strategy setup',
      aiSetup: 'AI generation settings',
      strategyTitle: 'Strategy title',
      strategyTitleHint: 'Enter the final strategy name that users will see in the platform. Keep it short and institution-specific.',
      strategySlug: 'Strategy slug (optional)',
      strategySlugHint: 'Optional URL code. Use lowercase letters, numbers, and hyphens if you want a custom address.',
      strategyDescription: 'Short description (optional)',
      strategyDescriptionHint: 'Optional 1-3 sentence summary of the strategy scope, audience, or purpose.',
      createManual: 'Create strategy',
      localeHint: 'Result language',
      localeHintHelp: 'Choose the language for the generated digistrategy.eu structure and labels.',
      clarification: 'AI clarification',
      clarificationHint: 'Describe the expected tone, scope, priorities, exclusions, and how the uploaded PDFs should be interpreted.',
      clarificationPlaceholder: 'Scope, tone, priorities, constraints.',
      documents: 'PDF documents',
      documentsHint: 'Upload the source strategy PDFs the AI should read. You can select multiple files if the material is split.',
      aiNoticeTitle: 'Before using Clarity Gremlin from PDF',
      aiNoticeBody: 'digistrategy.eu converts uploaded strategy documents into a structured format based on guidelines, initiatives, and other platform fields. Because source documents are often narrative and differently structured, the generated result may contain inaccuracies, missing relationships, or simplifications and must be reviewed manually.',
      aiNoticeConfirm: 'I understand and want to continue',
      createAi: 'Generate strategy with Clarity Gremlin',
      progressTitle: 'AI generation in progress',
      progressUploading: 'Uploading documents',
      progressAnalyses: 'Analyzing with AI',
      progressPreparing: 'Building digistrategy.eu format',
      progressDone: 'Finalizing',
      progressRecovering: 'Waiting for server confirmation',
      successManual: 'Strategy created:',
      successAi: 'Clarity Gremlin generated strategy:'
    };
  }
  return {
    title: 'Sukurti strategiją',
    subtitle: 'Sukurkite naują strategiją pasirinktai institucijai.',
    close: 'Uždaryti',
    manualTab: 'Rankinis',
    aiTab: 'Clarity Gremlin iš PDF',
    strategySetup: 'Strategijos nustatymai',
    aiSetup: 'AI generavimo nustatymai',
    strategyTitle: 'Strategijos pavadinimas',
    strategyTitleHint: 'Įveskite galutinį strategijos pavadinimą, kurį naudotojai matys platformoje. Geriausia trumpą ir aiškiai susietą su institucija.',
    strategySlug: 'Strategijos slug (nebūtina)',
    strategySlugHint: 'Nebūtinas URL kodas. Jei norite savo adreso, naudokite mažąsias raides, skaičius ir brūkšnelius.',
    strategyDescription: 'Trumpas aprašymas (nebūtina)',
    strategyDescriptionHint: 'Nebūtina 1-3 sakinių santrauka apie strategijos apimtį, auditoriją ar paskirtį.',
    createManual: 'Sukurti strategiją',
    localeHint: 'Rezultato kalba',
    localeHintHelp: 'Pasirinkite kalbą, kuria AI sugeneruos digistrategy.eu struktūrą ir pavadinimus.',
    clarification: 'AI patikslinimas',
    clarificationHint: 'Aprašykite pageidaujamą toną, apimtį, prioritetus, ką atmesti ir kaip AI turėtų interpretuoti įkeltus PDF dokumentus.',
    clarificationPlaceholder: 'Koks lygis, tonas, prioritetai, ko vengti.',
    documents: 'PDF dokumentai',
    documentsHint: 'Įkelkite strategijos PDF dokumentus, kuriuos AI turi perskaityti. Galite pasirinkti kelis failus, jei medžiaga išskaidyta.',
    aiNoticeTitle: 'Prieš naudojant Clarity Gremlin iš PDF',
    aiNoticeBody: 'digistrategy.eu paverčia įkeltus strateginius dokumentus į struktūrizuotą formatą pagal gaires, iniciatyvas ir kitus platformos laukus. Kadangi šaltiniai dažnai būna naratyviniai ir skirtingos struktūros, sugeneruotame rezultate gali būti netikslumų, praleistų ryšių ar supaprastinimų, todėl rezultatą būtina peržiūrėti rankiniu būdu.',
    aiNoticeConfirm: 'Suprantu ir noriu tęsti',
    createAi: 'Generuoti strategiją su Clarity Gremlin',
    progressTitle: 'AI generavimas vyksta',
    progressUploading: 'Įkeliami dokumentai',
    progressAnalyses: 'Analizuojama su AI',
    progressPreparing: 'Ruošiamas digistrategy.eu formatas',
    progressDone: 'Užbaigiama',
    progressRecovering: 'Laukiamas serverio patvirtinimas',
    successManual: 'Strategija sukurta:',
    successAi: 'Clarity Gremlin sugeneravo strategiją:'
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

function clarityGremlinHistoryEntryMatchesContext(item, context, sinceIso = '') {
  if (!item || !context) return false;
  if (!clarityGremlinHistoryMatchesContext(item, context)) return false;
  const createdTs = Date.parse(String(item.createdAt || '')) || 0;
  const sinceTs = Date.parse(String(sinceIso || '')) || 0;
  return createdTs >= sinceTs;
}

async function recoverClarityGremlinAfterGatewayTimeout({
  cycleId,
  context,
  sinceIso,
  timeoutMs = 90000,
  pollMs = 1800
} = {}) {
  const normalizedCycleId = String(cycleId || '').trim();
  if (!normalizedCycleId || !context) return null;
  const deadline = Date.now() + Math.max(5000, Number(timeoutMs) || 0);

  while (Date.now() < deadline) {
    let payload = null;
    try {
      payload = await api(`/api/v1/cycles/${encodeURIComponent(normalizedCycleId)}/clarity-gremlin`);
    } catch {
      payload = null;
    }

    const history = Array.isArray(payload?.history) ? payload.history : [];
    const match = history.find((item) => clarityGremlinHistoryEntryMatchesContext(item, context, sinceIso)) || null;
    if (match) {
      return {
        historyEntryId: String(match.id || '').trim(),
        usage: payload?.usage || null
      };
    }

    await waitMs(pollMs);
  }

  return null;
}

async function pollClarityGremlinJob({
  cycleId,
  jobId,
  timeoutMs = 10 * 60 * 1000,
  intervalMs = 1500
} = {}) {
  const normalizedCycleId = String(cycleId || '').trim();
  const normalizedJobId = String(jobId || '').trim();
  if (!normalizedCycleId || !normalizedJobId) {
    throw new Error('job not found');
  }
  const deadline = Date.now() + Math.max(10000, Number(timeoutMs) || 0);
  while (Date.now() < deadline) {
    const payload = await api(`/api/v1/cycles/${encodeURIComponent(normalizedCycleId)}/clarity-gremlin/jobs/${encodeURIComponent(normalizedJobId)}`);
    if (payload?.status === 'completed' || payload?.pending === false && payload?.ok === true) {
      return payload;
    }
    if (payload?.status === 'failed' || payload?.ok === false) {
      const error = new Error(String(payload?.error || 'internal server error'));
      error.payload = payload;
      throw error;
    }
    await waitMs(intervalMs);
  }
  throw new Error('ai request timed out');
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
    `<option value="">${escapeHtml(langText('Pasirinkite tėvinę gairę', 'Select a parent guideline'))}</option>`,
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
    notifyError(langText('Importuoti galima tik į atvirą jūsų institucijos strategijos ciklą.', 'Import is available only into an open cycle of your institution strategy.'));
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
      <p class="prompt auth-hint">${escapeHtml(langText('Sukursite moderuojamą gairės pasiūlymą savo institucijos strategijoje.', 'This creates a moderated guideline proposal in your institution strategy.'))}</p>
      <div class="header-stack" style="margin-bottom: 12px;">
        <span class="tag">${escapeHtml(langText('Saltinis', 'Source'))}: ${escapeHtml(buildImportSourceLabel())}</span>
        <span class="tag">${escapeHtml(langText('Tikslas', 'Target'))}: <span id="externalImportTargetLabel">${escapeHtml(buildImportTargetLabel(initialTarget))}</span></span>
      </div>
      <div id="externalImportError" class="error" style="display:none;"></div>
      <form id="externalGuidelineImportForm" class="login-form login-form-auth strategy-create-form">
        ${targets.length > 1 ? `
          <label class="auth-label" for="externalImportTargetStrategy">${escapeHtml(langText('Tikslinė strategija', 'Target strategy'))}</label>
          <select id="externalImportTargetStrategy" name="targetStrategySlug">${buildImportTargetStrategyOptions(targets, initialTarget.strategySlug)}</select>
        ` : ''}
        <label class="auth-label" for="externalImportGuidelineTitle">${escapeHtml(langText('Pavadinimas', 'Title'))}</label>
        <input id="externalImportGuidelineTitle" type="text" name="title" value="${escapeHtml(sourceGuideline.title || '')}" required />
        <label class="auth-label" for="externalImportGuidelineDescription">${escapeHtml(langText('Aprasymas', 'Description'))}</label>
        <textarea id="externalImportGuidelineDescription" name="description" rows="5">${escapeHtml(sourceGuideline.description || '')}</textarea>
        <label class="auth-label" for="externalImportGuidelineRelation">${escapeHtml(langText('Rysio tipas', 'Relation type'))}</label>
        <select id="externalImportGuidelineRelation" name="relationType">
          <option value="orphan" ${defaultRelation === 'orphan' ? 'selected' : ''}>${escapeHtml(langText('Savarankiska', 'Standalone'))}</option>
          <option value="parent" ${defaultRelation === 'parent' ? 'selected' : ''}>${escapeHtml(langText('Tėvinė', 'Parent'))}</option>
          <option value="child" ${defaultRelation === 'child' ? 'selected' : ''}>${escapeHtml(langText('Vaikinė', 'Child'))}</option>
        </select>
        <label class="auth-label" for="externalImportGuidelineParent">${escapeHtml(langText('Tikslinė tėvinė gairė', 'Target parent guideline'))}</label>
        <select id="externalImportGuidelineParent" name="parentGuidelineId"></select>
        <p id="externalImportGuidelineHint" class="prompt auth-hint">${escapeHtml(
          normalizeGuidelineRelation(sourceGuideline?.relationType) === 'child'
            ? langText('Šaltinio vaikinė gairė pagal nutylėjimą importuojama kaip savarankiška, kol nepasirinksite tėvinės gairės savo strategijoje.', 'A child guideline from the source defaults to standalone until you map it to a parent guideline in your strategy.')
            : langText('Peržiūrėkite ir, jei reikia, pakoreguokite aprašymą prieš pateikdami pasiūlymą.', 'Review and adjust the description if needed before submitting the proposal.')
        )}</p>
        <button id="submitExternalGuidelineImport" class="btn btn-primary" type="submit">${escapeHtml(langText('Sukurti pasiūlymą', 'Create proposal'))}</button>
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
        throw new Error(langText('Pasirinkite tėvinę gairę savo strategijoje.', 'Select a parent guideline in your strategy.'));
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
          `Gairės pasiūlymas sukurtas strategijai "${activeTarget.strategyTitle || activeTarget.cycleTitle || '-'}".`,
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
    notifyError(langText('Importuoti galima tik į atvirą jūsų institucijos strategijos ciklą.', 'Import is available only into an open cycle of your institution strategy.'));
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
      <p class="prompt auth-hint">${escapeHtml(langText('Sukursite moderuojamą iniciatyvos pasiūlymą savo institucijos strategijoje.', 'This creates a moderated initiative proposal in your institution strategy.'))}</p>
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
          <label class="auth-label" for="externalImportTargetStrategy">${escapeHtml(langText('Tikslinė strategija', 'Target strategy'))}</label>
          <select id="externalImportTargetStrategy" name="targetStrategySlug">${buildImportTargetStrategyOptions(targets, initialTarget.strategySlug)}</select>
        ` : ''}
        <label class="auth-label" for="externalImportInitiativeTitle">${escapeHtml(langText('Pavadinimas', 'Title'))}</label>
        <input id="externalImportInitiativeTitle" type="text" name="title" value="${escapeHtml(sourceInitiative.title || '')}" required />
        <label class="auth-label" for="externalImportInitiativeDescription">${escapeHtml(langText('Aprasymas', 'Description'))}</label>
        <textarea id="externalImportInitiativeDescription" name="description" rows="5">${escapeHtml(sourceInitiative.description || '')}</textarea>
        <label class="auth-label">${escapeHtml(langText('Priskirti prie šių jūsų strategijos gairių', 'Link to these guidelines in your strategy'))}</label>
        <div id="externalImportInitiativeGuidelineList"></div>
        <p class="prompt auth-hint">${escapeHtml(langText('Automatiškai pažymėtos gairės, kurių pavadinimai sutapo su šaltinio iniciatyvos gairėmis.', 'Guidelines with titles matching the source initiative links were preselected automatically.'))}</p>
        <button id="submitExternalInitiativeImport" class="btn btn-primary" type="submit">${escapeHtml(langText('Sukurti pasiūlymą', 'Create proposal'))}</button>
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
        throw new Error(langText('Pasirinkite bent vieną tikslinę gairę savo strategijoje.', 'Select at least one target guideline in your strategy.'));
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
          `Iniciatyvos pasiūlymas sukurtas strategijai "${activeTarget.strategyTitle || activeTarget.cycleTitle || '-'}".`,
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
    'externalImportOverlay',
    'clarityGremlinOverlay'
  ].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.remove();
  });
  state.strategySwitcherDialogOpen = false;
}

function showStrategyCreateModal(initialMode = 'manual') {
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
        <div class="strategy-create-field-block">
          <label class="auth-label" for="strategyCreateTitle">${escapeHtml(ui.strategyTitle)}</label>
          <input id="strategyCreateTitle" type="text" name="strategyTitle" required />
          <p class="prompt strategy-create-field-hint">${escapeHtml(ui.strategyTitleHint)}</p>
        </div>
        <div class="strategy-create-field-block">
          <label class="auth-label" for="strategyCreateSlug">${escapeHtml(ui.strategySlug)}</label>
          <input id="strategyCreateSlug" type="text" name="strategySlug" />
          <p class="prompt strategy-create-field-hint">${escapeHtml(ui.strategySlugHint)}</p>
        </div>
        <div class="strategy-create-field-block strategy-create-field-block-wide">
          <label class="auth-label" for="strategyCreateDescription">${escapeHtml(ui.strategyDescription)}</label>
          <textarea id="strategyCreateDescription" name="strategyDescription" rows="4"></textarea>
          <p class="prompt strategy-create-field-hint">${escapeHtml(ui.strategyDescriptionHint)}</p>
        </div>
      </section>

      <form id="strategyCreateManualForm" class="login-form login-form-auth strategy-create-form">
        <button class="btn btn-primary" type="submit">${escapeHtml(ui.createManual)}</button>
      </form>

      <form id="strategyCreateAiForm" class="login-form login-form-auth strategy-create-form" enctype="multipart/form-data" hidden>
        <h3 class="strategy-create-section-title">${escapeHtml(ui.aiSetup)}</h3>
        <section class="strategy-create-ai-notice" id="strategyAiNotice">
          <strong>${escapeHtml(ui.aiNoticeTitle)}</strong>
          <p class="prompt">${escapeHtml(ui.aiNoticeBody)}</p>
          <button class="btn btn-primary" type="button" id="strategyAiAcknowledgeBtn">${escapeHtml(ui.aiNoticeConfirm)}</button>
        </section>
        <div id="strategyAiFields" class="strategy-create-ai-fields" hidden>
          <div class="strategy-create-field-block strategy-create-field-block-compact">
            <label class="auth-label" for="strategyAiLocale">${escapeHtml(ui.localeHint)}</label>
            <select id="strategyAiLocale" name="localeHint">
              <option value="lt">LT</option>
              <option value="en">EN</option>
            </select>
            <p class="prompt strategy-create-field-hint">${escapeHtml(ui.localeHintHelp)}</p>
          </div>
          <div class="strategy-create-field-block strategy-create-field-block-emphasis">
            <label class="auth-label" for="strategyAiClarification">${escapeHtml(ui.clarification)}</label>
            <textarea id="strategyAiClarification" name="clarification" rows="4" placeholder="${escapeHtml(ui.clarificationPlaceholder)}" required></textarea>
            <p class="prompt strategy-create-field-hint">${escapeHtml(ui.clarificationHint)}</p>
          </div>
          <div class="strategy-create-field-block strategy-create-field-block-docs">
            <label class="auth-label" for="strategyAiDocs">${escapeHtml(ui.documents)}</label>
            <input id="strategyAiDocs" type="file" name="documents" accept="application/pdf,.pdf" multiple required />
            <p class="prompt strategy-create-field-hint">${escapeHtml(ui.documentsHint)}</p>
          </div>
          <div class="strategy-create-form-actions">
            <button class="btn btn-primary" type="submit">${escapeHtml(ui.createAi)}</button>
          </div>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector('#closeStrategyCreateModal');
  const errorNode = overlay.querySelector('#strategyCreateError');
  const tabButtons = Array.from(overlay.querySelectorAll('.strategy-create-tab'));
  const manualForm = overlay.querySelector('#strategyCreateManualForm');
  const aiForm = overlay.querySelector('#strategyCreateAiForm');
  const aiNotice = overlay.querySelector('#strategyAiNotice');
  const aiFields = overlay.querySelector('#strategyAiFields');
  const aiAcknowledgeButton = overlay.querySelector('#strategyAiAcknowledgeBtn');
  const commonTitleInput = overlay.querySelector('#strategyCreateTitle');
  const commonSlugInput = overlay.querySelector('#strategyCreateSlug');
  const commonDescriptionInput = overlay.querySelector('#strategyCreateDescription');
  let aiAcknowledged = false;
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
    if (aiNotice instanceof HTMLElement) aiNotice.hidden = next !== 'ai';
    if (aiFields instanceof HTMLElement) aiFields.hidden = next !== 'ai' || !aiAcknowledged;
    if (aiForm instanceof HTMLElement) {
      aiForm.classList.toggle('is-acknowledged', next === 'ai' && aiAcknowledged);
    }
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

  aiAcknowledgeButton?.addEventListener('click', () => {
    aiAcknowledged = true;
    setMode('ai');
    const localeInput = overlay.querySelector('#strategyAiLocale');
    if (localeInput instanceof HTMLElement) localeInput.focus();
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

  setMode(String(initialMode || '').trim().toLowerCase() === 'ai' ? 'ai' : 'manual');
}

function closeClarityGremlinModal() {
  const existing = document.getElementById('clarityGremlinOverlay');
  if (existing) existing.remove();
}

function renderClarityGremlinResultMarkup(result, ui, options = {}) {
  const analysis = result?.analysis && typeof result.analysis === 'object' ? result.analysis : {};
  const usage = result?.usage && typeof result.usage === 'object' ? result.usage : null;
  const historyItem = result?.historyItem && typeof result.historyItem === 'object' ? result.historyItem : null;
  const score = Math.max(1, Math.min(10, Number(analysis.score || 0) || 0));
  const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  const improvements = Array.isArray(analysis.improvements) ? analysis.improvements : [];
  const nextActions = Array.isArray(analysis.nextActions) ? analysis.nextActions : [];
  const dataGaps = Array.isArray(analysis.dataGaps) ? analysis.dataGaps : [];
  const draftProposals = Array.isArray(analysis.proposalDrafts) ? analysis.proposalDrafts : [];
  const analysisScopeLabel = String(analysis.pageLabel || result?.page?.label || '-').trim() || '-';
  const focusLabel = String(result?.page?.contextLabel || historyItem?.contextLabel || '').trim();
  const analysisEntityKind = String(result?.page?.entityKind || historyItem?.entityKind || '').trim().toLowerCase();
  const focusTitle = (() => {
    const colonIndex = focusLabel.indexOf(':');
    if (colonIndex >= 0 && colonIndex < focusLabel.length - 1) {
      return focusLabel.slice(colonIndex + 1).trim() || focusLabel;
    }
    return focusLabel;
  })();
  const scopeLabel = analysisEntityKind === 'guideline' || analysisEntityKind === 'initiative'
    ? ui.entityTarget
    : ui.page;
  const summaryPrimaryValue = analysisEntityKind === 'guideline' || analysisEntityKind === 'initiative'
    ? (focusTitle || analysisScopeLabel)
    : analysisScopeLabel;
  const contextSummaryLabel = analysisEntityKind === 'guideline' || analysisEntityKind === 'initiative'
    ? ui.page
    : ui.strategyFocus;
  const contextSummaryValue = analysisEntityKind === 'guideline' || analysisEntityKind === 'initiative'
    ? analysisScopeLabel
    : focusLabel;
  const usageText = usage
    ? `${Math.max(0, Number(usage.remaining || 0))} / ${Math.max(0, Number(usage.limit || 0))}`
    : '';
  const canCreateDrafts = canCreateClarityGremlinDrafts();
  const allowDraftActions = Boolean(options.allowDraftActions);
  const draftButtonsDisabled = !canCreateDrafts || !allowDraftActions;

  return `
    <div class="gremlin-result">
      <div class="gremlin-summary-card">
        <div class="gremlin-summary-row">
          <span class="gremlin-summary-label">${escapeHtml(scopeLabel)}</span>
          <strong>${escapeHtml(summaryPrimaryValue)}</strong>
        </div>
        ${contextSummaryValue && contextSummaryValue !== summaryPrimaryValue && contextSummaryLabel
      ? `<div class="gremlin-summary-row">
            <span class="gremlin-summary-label">${escapeHtml(contextSummaryLabel)}</span>
            <strong>${escapeHtml(contextSummaryValue)}</strong>
          </div>`
      : ''}
        ${score
      ? `<div class="gremlin-summary-row">
            <span class="gremlin-summary-label gremlin-summary-label-with-help">
              ${escapeHtml(ui.score)}
              <span class="gremlin-help-dot" title="${escapeHtml(ui.scoreTooltip)}" aria-label="${escapeHtml(ui.scoreTooltip)}">?</span>
            </span>
            <strong class="gremlin-score-badge">${escapeHtml(`${score}/10`)}</strong>
          </div>`
      : ''}
        ${usage
      ? `<div class="gremlin-summary-row">
            <span class="gremlin-summary-label">${escapeHtml(ui.remainingCalls)}</span>
            <strong>${escapeHtml(usageText)}</strong>
          </div>`
      : ''}
        <p class="prompt gremlin-summary-text">${escapeHtml(analysis.summary || '')}</p>
      </div>

      ${strengths.length
      ? `<section class="gremlin-section">
            <h3>${escapeHtml(ui.strengths)}</h3>
            <ul class="gremlin-list">
              ${strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </section>`
      : ''}

      ${dataGaps.length
      ? `<section class="gremlin-section">
            <h3>${escapeHtml(ui.dataGaps)}</h3>
            <ul class="gremlin-list gremlin-list-muted">
              ${dataGaps.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </section>`
      : ''}

      ${improvements.length
      ? `<section class="gremlin-section">
            <h3>${escapeHtml(ui.improvements)}</h3>
            <div class="gremlin-improvement-list">
              ${improvements.map((item) => `
                <article class="gremlin-improvement-card">
                  <strong>${escapeHtml(item.issue || '')}</strong>
                  <p>${escapeHtml(item.recommendation || '')}</p>
                </article>
              `).join('')}
            </div>
          </section>`
      : ''}

      ${draftProposals.length
      ? `<section class="gremlin-section">
            <h3>${escapeHtml(ui.draftProposals)}</h3>
            <div class="gremlin-draft-list">
              ${draftProposals.map((draft, index) => {
                const entityKind = String(draft?.entityKind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
                const draftMode = (() => {
                  const mode = String(draft?.draftMode || '').trim().toLowerCase();
                  return mode === 'update' || mode === 'delete' ? mode : 'create';
                })();
                const kindLabel = entityKind === 'initiative'
                  ? langText('Iniciatyvos pasiūlymas', 'Initiative proposal')
                  : langText('Gairės pasiūlymas', 'Guideline proposal');
                const modeLabel = draftMode === 'update'
                  ? entityKind === 'initiative'
                    ? langText('Esamos iniciatyvos koregavimas', 'Existing initiative correction')
                    : langText('Esamos gairės koregavimas', 'Existing guideline correction')
                  : draftMode === 'delete'
                    ? entityKind === 'initiative'
                      ? langText('Esamos iniciatyvos ištrynimas', 'Existing initiative deletion')
                      : langText('Esamos gairės ištrynimas', 'Existing guideline deletion')
                    : kindLabel;
                const relationLabel = entityKind === 'guideline' && draft?.relationType
                  ? ` · ${escapeHtml(
                    draft.relationType === 'child'
                      ? langText('Vaikinė', 'Child')
                      : draft.relationType === 'parent'
                        ? langText('Tėvinė', 'Parent')
                        : langText('Savarankiška', 'Standalone')
                  )}`
                  : '';
                const guidelineTags = entityKind === 'initiative'
                  ? (Array.isArray(draft?.guidelineTitles) ? draft.guidelineTitles : []).map((title) => `<span class="tag">${escapeHtml(title)}</span>`).join('')
                  : '';
                const implemented = draft?.implemented && typeof draft.implemented === 'object' ? draft.implemented : null;
                const implementedEntityKind = String(implemented?.entityKind || entityKind).trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
                const implementedEntityId = String(implemented?.entityId || '').trim();
                const targetHint = (draftMode === 'update' || draftMode === 'delete') && draft?.targetTitle
                  ? `<p class="gremlin-draft-meta">${escapeHtml(
                    draftMode === 'delete'
                      ? (entityKind === 'initiative'
                        ? langText('Siūloma ištrinti iniciatyvą', 'Initiative to delete')
                        : langText('Siūloma ištrinti gairę', 'Guideline to delete'))
                      : (entityKind === 'initiative'
                        ? langText('Koreguojama iniciatyva', 'Initiative to update')
                        : langText('Koreguojama gairė', 'Guideline to update'))
                  )}: <strong>${escapeHtml(draft.targetTitle)}</strong></p>`
                  : '';
                const parentHint = entityKind === 'guideline' && draft?.relationType === 'child' && draft?.parentGuidelineTitle
                  ? `<p class="gremlin-draft-meta">${escapeHtml(langText('Siūloma priskirti prie', 'Suggested parent'))}: <strong>${escapeHtml(draft.parentGuidelineTitle)}</strong></p>`
                  : '';
                const requiresImmediateApply = draftMode === 'update' || draftMode === 'delete';
                const buttonText = draftMode === 'delete'
                  ? ui.applyDeleteDraft
                  : requiresImmediateApply
                    ? ui.applyUpdateDraft
                    : ui.createPendingDraft;
                const buttonTitle = draftButtonsDisabled
                  ? ui.draftUnavailable
                  : ((!canOpenAdminView())
                    ? (draftMode === 'delete'
                      ? ui.deleteDraftAdminOnly
                      : requiresImmediateApply
                        ? ui.updateDraftAdminOnly
                        : ui.createDraftAdminOnly)
                    : '');
                const disabled = draftButtonsDisabled || !canOpenAdminView();
                const actionButtonClass = implemented && implementedEntityId
                  ? ''
                  : draftMode === 'delete'
                    ? 'btn btn-danger gremlin-draft-delete-btn'
                    : entityKind === 'initiative'
                      ? 'btn btn-ghost gremlin-draft-initiative-btn'
                      : 'btn btn-primary';
                return `
                  <article class="gremlin-draft-card gremlin-draft-card-tone-${escapeHtml(entityKind)}${draftMode !== 'create' ? ' gremlin-draft-card-mode-update' : ''}${draftMode === 'delete' ? ' gremlin-draft-card-mode-delete' : ''}">
                    <div class="gremlin-draft-head">
                      <span class="tag ${entityKind === 'initiative' ? '' : 'tag-main'}">${escapeHtml(modeLabel)}${draftMode === 'create' ? relationLabel : ''}</span>
                    </div>
                    <strong class="gremlin-draft-title">${escapeHtml((draftMode === 'delete' ? draft?.targetTitle : draft?.title) || draft?.title || '')}</strong>
                    <p class="gremlin-draft-description">${escapeHtml(draft?.description || '')}</p>
                    ${draft?.rationale ? `<p class="gremlin-draft-rationale">${escapeHtml(draft.rationale)}</p>` : ''}
                    ${targetHint}
                    ${parentHint}
                    ${guidelineTags ? `<div class="gremlin-draft-tags">${guidelineTags}</div>` : ''}
                    <div class="gremlin-draft-actions">
                      ${implemented
                        ? `
                          <span class="gremlin-draft-status gremlin-draft-status-implemented">
                            <span class="gremlin-draft-status-icon" aria-hidden="true">✓</span>
                            <span>${escapeHtml(ui.implementedDraft)}</span>
                          </span>
                          ${implemented?.deleted === true ? '' : `
                          <button
                            type="button"
                            class="btn btn-ghost"
                            data-action="open-gremlin-implemented-entity"
                            data-kind="${escapeHtml(implementedEntityKind)}"
                            data-entity-id="${escapeHtml(implementedEntityId)}"
                          >${escapeHtml(ui.openImplementedEntity)}</button>
                          `}
                        `
                        : `
                          <button
                            type="button"
                            class="${actionButtonClass}"
                            data-gremlin-draft-index="${escapeHtml(index)}"
                            ${historyItem ? `data-gremlin-history-entry="${escapeHtml(historyItem.id)}"` : ''}
                            ${disabled ? 'disabled' : ''}
                            title="${escapeHtml(buttonTitle)}"
                          >${escapeHtml(buttonText)}</button>
                        `}
                    </div>
                  </article>
                `;
              }).join('')}
            </div>
          </section>`
      : ''}

      ${nextActions.length
      ? `<section class="gremlin-section">
            <h3>${escapeHtml(ui.nextActions)}</h3>
            <ul class="gremlin-list gremlin-list-actions">
              ${nextActions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </section>`
      : ''}
    </div>
  `;
}

function clarityGremlinHistoryMatchesContext(item, context) {
  if (!item || !context) return false;
  const itemView = String(item.view || '').trim().toLowerCase();
  const contextView = String(context.view || '').trim().toLowerCase();
  if (!itemView || itemView !== contextView) return false;
  const itemEntityId = String(item.entityId || '').trim();
  const contextEntityId = String(context.entityId || '').trim();
  if (!itemEntityId && !contextEntityId) return true;
  return itemEntityId === contextEntityId;
}

function getClarityGremlinHistoryKind(view) {
  const normalized = String(view || '').trim().toLowerCase();
  if (normalized === 'guidelines' || normalized === 'guideline-detail') {
    return { key: 'guidelines', stepId: 'guidelines', label: langText('Gairės', 'Guidelines') };
  }
  if (normalized === 'initiatives' || normalized === 'initiative-detail') {
    return { key: 'initiatives', stepId: 'initiatives', label: langText('Iniciatyvos', 'Initiatives') };
  }
  if (normalized === 'implementation-plan') {
    return { key: 'implementation-plan', stepId: 'implementation-plan', label: langText('Planas', 'Plan') };
  }
  if (normalized === 'map') {
    return { key: 'map', stepId: 'map', label: langText('Žemėlapis', 'Map') };
  }
  return { key: 'default', stepId: 'guidelines', label: langText('Puslapis', 'Page') };
}

function getClarityGremlinAnalysisType(item, ui) {
  const kind = String(item?.entityKind || '').trim().toLowerCase();
  if (kind === 'guideline') {
    return {
      key: 'guideline',
      label: ui.analysisTypeGuideline,
      stepId: 'guidelines'
    };
  }
  if (kind === 'initiative') {
    return {
      key: 'initiative',
      label: ui.analysisTypeInitiative,
      stepId: 'initiatives'
    };
  }
  return {
    key: 'strategy',
    label: ui.analysisTypeStrategy,
    stepId: 'strategy-map'
  };
}

function getClarityGremlinHistoryTitle(item, ui) {
  const kind = getClarityGremlinAnalysisType(item, ui);
  const contextLabel = String(item?.contextLabel || '').trim();
  if (kind.key === 'strategy') return kind.label;
  const colonIndex = contextLabel.indexOf(':');
  if (colonIndex >= 0 && colonIndex < contextLabel.length - 1) {
    return contextLabel.slice(colonIndex + 1).trim() || contextLabel;
  }
  return contextLabel || item?.pageLabel || item?.view || '-';
}

function getClarityGremlinHistoryContext(item, ui) {
  const kind = getClarityGremlinAnalysisType(item, ui);
  const contextLabel = String(item?.contextLabel || '').trim();
  if (kind.key === 'strategy') {
    return contextLabel ? `${ui.focus}: ${contextLabel}` : '';
  }
  return kind.label;
}

function renderClarityGremlinHistoryListMarkup(items, selectedId, context, ui, options = {}) {
  const list = Array.isArray(items) ? items : [];
  const locked = Boolean(options.locked);
  if (!list.length) {
    return `<div class="card guideline-empty gremlin-history-empty"><strong>${escapeHtml(ui.noHistory)}</strong></div>`;
  }

  return `
    <div class="gremlin-history-list">
      ${list.map((item) => {
        const analysis = item?.analysis && typeof item.analysis === 'object' ? item.analysis : {};
        const score = Math.max(1, Math.min(10, Number(analysis.score || 0) || 0));
        const isSelected = String(item?.id || '').trim() === String(selectedId || '').trim();
        const kind = getClarityGremlinAnalysisType(item, ui);
        const title = getClarityGremlinHistoryTitle(item, ui);
        const contextText = getClarityGremlinHistoryContext(item, ui);
        const providerLabel = formatAiProviderLabel(item?.provider, item?.model);
        return `
          <button
            type="button"
            class="gremlin-history-item${isSelected ? ' is-selected' : ''}${locked ? ' is-locked' : ''}"
            data-gremlin-history-id="${escapeHtml(item.id)}"
            aria-current="${isSelected ? 'true' : 'false'}"
            ${locked ? 'disabled' : ''}
          >
            <div class="gremlin-history-item-top">
              <div class="gremlin-history-item-title">
                <span
                  class="step-icon gremlin-history-kind"
                  title="${escapeHtml(kind.label)}"
                  aria-label="${escapeHtml(kind.label)}"
                >${stepIconMarkup(kind.stepId)}</span>
                <div class="gremlin-history-item-copy">
                  <strong>${escapeHtml(title)}</strong>
                  <div class="gremlin-history-badges">
                    <span class="gremlin-history-type gremlin-history-type-${escapeHtml(kind.key)}">${escapeHtml(kind.label)}</span>
                    ${isSelected ? `<span class="gremlin-history-current">${escapeHtml(ui.selectedAnalysis)}</span>` : ''}
                  </div>
                  ${contextText ? `<span class="gremlin-history-context">${escapeHtml(contextText)}</span>` : ''}
                </div>
              </div>
              ${score ? `<span class="gremlin-history-score">${escapeHtml(`${score}/10`)}</span>` : ''}
            </div>
            <div class="gremlin-history-meta">
              <span>${escapeHtml(formatCommentDateTime(item.createdAt) || String(item.createdAt || ''))}</span>
              <span>${escapeHtml(ui.provider)}: ${escapeHtml(providerLabel)}</span>
              ${item.createdByName ? `<span>${escapeHtml(item.createdByName)}</span>` : ''}
            </div>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function showClarityGremlinModal() {
  const ui = clarityGremlinUiText();
  const initialContext = resolveClarityGremlinContext();

  closeClarityGremlinModal();

  const overlay = document.createElement('div');
  overlay.id = 'clarityGremlinOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card clarity-gremlin-modal" role="dialog" aria-modal="true" aria-labelledby="clarityGremlinTitle">
      <div class="header-row">
        <div class="gremlin-title-block">
          <img class="gremlin-title-icon" src="assets/clarity_gremlin2_ui.png" alt="" aria-hidden="true" />
          <div class="gremlin-title-copy">
            <div class="gremlin-title-row">
              <h2 id="clarityGremlinTitle">${escapeHtml(ui.title)}</h2>
              <div class="gremlin-info-wrap">
                <button
                  id="clarityGremlinInfoToggle"
                  class="gremlin-info-toggle"
                  type="button"
                  aria-expanded="false"
                  aria-controls="clarityGremlinInfoPanel"
                  aria-label="${escapeHtml(ui.howItWorks)}"
                >i</button>
                <div id="clarityGremlinInfoPanel" class="gremlin-info-panel" hidden>
                  <span class="gremlin-intro-eyebrow">${escapeHtml(ui.howItWorks)}</span>
                  <p class="gremlin-intro-lead">${escapeHtml(ui.howItWorksLead)}</p>
                  <div class="gremlin-intro-steps">
                    <div class="gremlin-intro-step">
                      <span class="gremlin-intro-step-index">1</span>
                      <span>${escapeHtml(ui.howStepCurrent)}</span>
                    </div>
                    <div class="gremlin-intro-step">
                      <span class="gremlin-intro-step-index">2</span>
                      <span>${escapeHtml(ui.howStepHistory)}</span>
                    </div>
                    <div class="gremlin-intro-step">
                      <span class="gremlin-intro-step-index">3</span>
                      <span>${escapeHtml(ui.howStepConsume)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p class="prompt gremlin-subtitle">${escapeHtml(ui.subtitle)}</p>
          </div>
        </div>
        <button id="closeClarityGremlinModal" class="btn btn-ghost" type="button">${escapeHtml(ui.close)}</button>
      </div>
      <div class="gremlin-toolbar">
        <div class="gremlin-toolbar-meta">
          <span id="clarityGremlinUsage" class="tag"></span>
        </div>
      </div>
      <section id="clarityGremlinControlPanel" class="gremlin-control-panel"></section>
      <div class="gremlin-layout">
        <aside class="gremlin-history-panel">
          <div class="gremlin-panel-head">
            <h3>${escapeHtml(ui.history)}</h3>
          </div>
          <div id="clarityGremlinHistory" class="gremlin-history-body"></div>
        </aside>
        <section class="gremlin-detail-panel">
          <div id="clarityGremlinBody" class="gremlin-body"></div>
        </section>
      </div>
    </div>
    <div class="gremlin-backdrop-stage" aria-hidden="true">
      <div class="gremlin-backdrop-aura gremlin-backdrop-aura-one"></div>
      <div class="gremlin-backdrop-aura gremlin-backdrop-aura-two"></div>
      <div class="gremlin-backdrop-aura gremlin-backdrop-aura-three"></div>
      <div class="gremlin-backdrop-rune-grid"></div>
      <div class="gremlin-backdrop-sigil"></div>
      <div class="gremlin-backdrop-flare gremlin-backdrop-flare-one"></div>
      <div class="gremlin-backdrop-flare gremlin-backdrop-flare-two"></div>
      <div class="gremlin-backdrop-flare gremlin-backdrop-flare-three"></div>
      <div class="gremlin-backdrop-stars">
        <span></span><span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span><span></span><span></span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const body = overlay.querySelector('#clarityGremlinBody');
  const historyNode = overlay.querySelector('#clarityGremlinHistory');
  const closeButton = overlay.querySelector('#closeClarityGremlinModal');
  const controlPanel = overlay.querySelector('#clarityGremlinControlPanel');
  const usageNode = overlay.querySelector('#clarityGremlinUsage');
  const infoToggle = overlay.querySelector('#clarityGremlinInfoToggle');
  const infoPanel = overlay.querySelector('#clarityGremlinInfoPanel');
  let historyItems = [];
  let selectedHistoryId = '';
  let isAnalyzing = false;
  let draftSubmitInProgress = false;
  let infoOpen = false;
  let analysisMode = initialContext.view === 'guideline-detail' || initialContext.view === 'initiative-detail'
    ? 'entity'
    : 'strategy';
  let entityPickerKind = initialContext.view === 'initiative-detail' ? 'initiative' : 'guideline';
  let entityPickerId = initialContext.entityId || '';
  let selectedLocale = normalizeClarityGremlinLocale(currentLanguage());
  let selectedModelValue = getClarityGremlinModelOptions()[0]?.value || `${getFeatureAiInfo('clarityGremlin').provider}:`;

  const syncInfoPanel = () => {
    if (!(infoToggle instanceof HTMLButtonElement) || !(infoPanel instanceof HTMLElement)) return;
    infoToggle.setAttribute('aria-expanded', infoOpen ? 'true' : 'false');
    infoPanel.hidden = !infoOpen;
    infoToggle.classList.toggle('is-open', infoOpen);
  };

  const syncBusyUi = () => {
    overlay.classList.toggle('gremlin-analysis-locked', isAnalyzing);
    const currentContext = resolveClarityGremlinContext();
    if (closeButton instanceof HTMLButtonElement) {
      closeButton.disabled = isAnalyzing;
    }
    if (historyNode) {
      historyNode.innerHTML = renderClarityGremlinHistoryListMarkup(
        historyItems,
        selectedHistoryId,
        currentContext,
        ui,
        { locked: isAnalyzing }
      );
      bindHistorySelection();
    }
    renderControlPanel();
  };

  const applyUsage = (usage) => {
    if (!usageNode) return;
    if (!usage) {
      usageNode.hidden = true;
      usageNode.textContent = '';
      return;
    }
    usageNode.hidden = false;
    usageNode.textContent = `${ui.usage}: ${Math.max(0, Number(usage.remaining || 0))} / ${Math.max(0, Number(usage.limit || 0))}`;
  };

  const renderSelection = () => {
    const selected = historyItems.find((item) => String(item?.id || '').trim() === String(selectedHistoryId || '').trim()) || null;
    if (!body) return;
    if (!selected) {
      body.innerHTML = `
        <div class="card guideline-empty gremlin-empty gremlin-empty-state">
          <div class="gremlin-empty-copy">
            <strong>${escapeHtml(ui.emptySelection)}</strong>
            <p>${escapeHtml(ui.emptySelectionBody || ui.emptySelection)}</p>
          </div>
        </div>`;
      return;
    }
    body.innerHTML = renderClarityGremlinResultMarkup({
      analysis: selected.analysis,
      historyItem: selected,
      page: {
        label: selected.pageLabel,
        contextLabel: selected.contextLabel
      },
      usage: null
    }, ui, {
      allowDraftActions: !draftSubmitInProgress
    });
    bindDraftActions(selected);
  };

  const bindHistorySelection = () => {
    historyNode?.querySelectorAll('[data-gremlin-history-id]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedHistoryId = String(button.getAttribute('data-gremlin-history-id') || '').trim();
        if (historyNode) {
          historyNode.innerHTML = renderClarityGremlinHistoryListMarkup(historyItems, selectedHistoryId, resolveClarityGremlinContext(), ui);
          bindHistorySelection();
        }
        renderSelection();
      });
    });
  };

  const getEntityOptions = (kind) => {
    if (kind === 'initiative') {
      return (Array.isArray(state.initiatives) ? state.initiatives : [])
        .map((item) => ({ id: String(item?.id || '').trim(), title: String(item?.title || '').trim() }))
        .filter((item) => item.id && item.title);
    }
    return (Array.isArray(state.guidelines) ? state.guidelines : [])
      .map((item) => ({ id: String(item?.id || '').trim(), title: String(item?.title || '').trim() }))
      .filter((item) => item.id && item.title);
  };

  const getSelectedModelOption = () => {
    const options = getClarityGremlinModelOptions();
    const matched = options.find((item) => item.value === selectedModelValue) || options[0] || null;
    if (matched) {
      selectedModelValue = matched.value;
      return matched;
    }
    const fallbackProvider = getFeatureAiInfo('clarityGremlin').provider || 'openai';
    return {
      value: `${fallbackProvider}:`,
      provider: fallbackProvider,
      model: '',
      label: formatAiProviderLabel(fallbackProvider, '')
    };
  };

  const renderControlPanel = () => {
    if (!(controlPanel instanceof HTMLElement)) return;
    const currentContext = resolveClarityGremlinContext();
    const entityOptions = getEntityOptions(entityPickerKind);
    const modelOptions = getClarityGremlinModelOptions();
    if (!entityOptions.some((item) => item.id === entityPickerId)) {
      entityPickerId = entityOptions[0]?.id || '';
    }
    const selectedModel = getSelectedModelOption();
    const runDisabled = isAnalyzing
      || draftSubmitInProgress
      || !currentContext.supported
      || (analysisMode === 'entity' && !entityPickerId);
    const runDisabledMessage = currentContext.reason === 'disabled-view'
      ? ui.disabledView
      : currentContext.reason === 'login-required'
        ? ui.loginRequired
        : currentContext.reason === 'cycle-required'
          ? ui.noCycle
          : analysisMode === 'entity' && !entityPickerId
            ? (entityPickerKind === 'initiative' ? ui.selectorNoInitiatives : ui.selectorNoGuidelines)
            : currentContext.supported
              ? ''
              : ui.unsupported;

    controlPanel.innerHTML = `
      <div class="gremlin-control-surface">
        <div class="gremlin-control-head">
          <div class="gremlin-control-copy">
            <span class="gremlin-intro-eyebrow">${escapeHtml(ui.actionLabel)}</span>
            <h3>${escapeHtml(ui.setupTitle)}</h3>
            <p class="prompt">${escapeHtml(ui.setupLead)}</p>
          </div>
          <div class="gremlin-control-meta">
            <span class="tag">${escapeHtml(ui.currentContext)}: ${escapeHtml(currentContext.contextLabel || currentContext.view || ui.scopeStrategy)}</span>
          </div>
        </div>
        <div class="gremlin-control-grid">
          <div class="gremlin-control-field gremlin-control-field-wide">
            <span class="gremlin-summary-label">${escapeHtml(ui.scopeLabel)}</span>
            <div class="gremlin-mode-switch">
              <button type="button" class="gremlin-mode-option${analysisMode === 'strategy' ? ' is-active' : ''}" data-gremlin-analysis-mode="strategy">${escapeHtml(ui.scopeStrategy)}</button>
              <button type="button" class="gremlin-mode-option${analysisMode === 'entity' ? ' is-active' : ''}" data-gremlin-analysis-mode="entity">${escapeHtml(ui.scopeEntity)}</button>
            </div>
          </div>
          ${analysisMode === 'entity' ? `
            <div class="gremlin-control-field">
              <span class="gremlin-summary-label">${escapeHtml(ui.targetTypeLabel)}</span>
              <div class="gremlin-mode-switch gremlin-mode-switch-compact">
                <button type="button" class="gremlin-mode-option${entityPickerKind === 'guideline' ? ' is-active' : ''}" data-gremlin-entity-kind="guideline">${escapeHtml(ui.selectorGuidelines)}</button>
                <button type="button" class="gremlin-mode-option${entityPickerKind === 'initiative' ? ' is-active' : ''}" data-gremlin-entity-kind="initiative">${escapeHtml(ui.selectorInitiatives)}</button>
              </div>
            </div>
            <label class="gremlin-control-field gremlin-control-field-wide">
              <span class="gremlin-summary-label">${escapeHtml(ui.targetEntityLabel)}</span>
              ${entityOptions.length ? `
                <select id="clarityGremlinEntitySelect" class="input">
                  ${entityOptions.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === entityPickerId ? 'selected' : ''}>${escapeHtml(item.title)}</option>`).join('')}
                </select>
              ` : `<div class="gremlin-entity-picker-empty">${escapeHtml(entityPickerKind === 'initiative' ? ui.selectorNoInitiatives : ui.selectorNoGuidelines)}</div>`}
            </label>
          ` : ''}
          <label class="gremlin-control-field">
            <span class="gremlin-summary-label">${escapeHtml(ui.outputLanguageLabel)}</span>
            <select id="clarityGremlinLocaleSelect" class="input">
              <option value="lt" ${selectedLocale === 'lt' ? 'selected' : ''}>${escapeHtml(ui.outputLanguageLt)}</option>
              <option value="en" ${selectedLocale === 'en' ? 'selected' : ''}>${escapeHtml(ui.outputLanguageEn)}</option>
            </select>
          </label>
          <label class="gremlin-control-field">
            <span class="gremlin-summary-label">${escapeHtml(ui.modelLabel)}</span>
            <select id="clarityGremlinModelSelect" class="input" ${modelOptions.length <= 1 ? 'disabled' : ''}>
              ${modelOptions.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === selectedModel.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
            </select>
          </label>
          <div class="gremlin-control-actions">
            <button id="runClarityGremlinBtn" class="btn btn-primary" type="button" ${runDisabled ? 'disabled' : ''} title="${escapeHtml(runDisabledMessage)}">
              ${escapeHtml(ui.analyze)}
            </button>
          </div>
        </div>
      </div>
    `;

    controlPanel.querySelectorAll('[data-gremlin-analysis-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        analysisMode = String(button.getAttribute('data-gremlin-analysis-mode') || 'strategy').trim() === 'entity'
          ? 'entity'
          : 'strategy';
        renderControlPanel();
      });
    });
    controlPanel.querySelectorAll('[data-gremlin-entity-kind]').forEach((button) => {
      button.addEventListener('click', () => {
        entityPickerKind = String(button.getAttribute('data-gremlin-entity-kind') || 'guideline').trim() === 'initiative'
          ? 'initiative'
          : 'guideline';
        renderControlPanel();
      });
    });
    const entitySelect = controlPanel.querySelector('#clarityGremlinEntitySelect');
    if (entitySelect instanceof HTMLSelectElement) {
      entitySelect.addEventListener('change', () => {
        entityPickerId = String(entitySelect.value || '').trim();
      });
    }
    const localeSelect = controlPanel.querySelector('#clarityGremlinLocaleSelect');
    if (localeSelect instanceof HTMLSelectElement) {
      localeSelect.addEventListener('change', () => {
        selectedLocale = normalizeClarityGremlinLocale(localeSelect.value);
      });
    }
    const modelSelect = controlPanel.querySelector('#clarityGremlinModelSelect');
    if (modelSelect instanceof HTMLSelectElement) {
      modelSelect.addEventListener('change', () => {
        selectedModelValue = String(modelSelect.value || '').trim();
      });
    }
    const runButton = controlPanel.querySelector('#runClarityGremlinBtn');
    if (runButton instanceof HTMLButtonElement) {
      runButton.addEventListener('click', () => {
        const context = resolveClarityGremlinContext();
        if (analysisMode === 'entity') {
          void runAnalysis({
            mode: 'entity',
            view: entityPickerKind === 'initiative' ? 'initiative-detail' : 'guideline-detail',
            entityId: entityPickerId
          });
          return;
        }
        void runAnalysis({
          mode: 'strategy',
          view: context.view,
          entityId: ''
        });
      });
    }
  };

  const submitDraftProposal = async (selected, draftIndex, button) => {
    const drafts = Array.isArray(selected?.analysis?.proposalDrafts) ? selected.analysis.proposalDrafts : [];
    const draft = drafts[Number(draftIndex)];
    if (!draft || !canCreateClarityGremlinDrafts()) return;

    const cycleId = String(state.cycle?.id || '').trim();
    if (!cycleId) return;
    const entityKind = String(draft.entityKind || '').trim().toLowerCase() === 'initiative' ? 'initiative' : 'guideline';
    const draftMode = (() => {
      const mode = String(draft.draftMode || '').trim().toLowerCase();
      return mode === 'update' || mode === 'delete' ? mode : 'create';
    })();

    draftSubmitInProgress = true;
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.textContent = draftMode === 'delete'
        ? ui.applyDeleteDraft
        : draftMode === 'update'
          ? ui.applyUpdateDraft
          : ui.creatingPendingDraft;
    }
    syncBusyUi();

    try {
      let implementedEntityId = '';
      let implementedEntityTitle = '';
      let implementedDeleted = false;
      if (entityKind === 'guideline' && draftMode === 'update') {
        const targetGuideline = resolveGremlinDraftTargetGuideline(draft, selected);
        if (!targetGuideline?.id) {
          throw new Error(langText('Nepavyko rasti koreguojamos gairės.', 'Could not find the guideline to update.'));
        }
        const confirmed = window.confirm(`${ui.confirmGuidelineUpdateDraftTitle}\n\n${ui.confirmGuidelineUpdateDraftBody}`);
        if (!confirmed) {
          return;
        }
        await api(`/api/v1/admin/guidelines/${encodeURIComponent(targetGuideline.id)}`, {
          method: 'PUT',
          body: {
            title: String(draft.title || '').trim(),
            description: String(draft.description || '').trim(),
            status: String(targetGuideline.status || 'active').trim() || 'active',
            relationType: normalizeGuidelineRelation(draft.relationType || targetGuideline.relationType || 'orphan'),
            lineSide: normalizeLineSide(targetGuideline.lineSide || 'auto') || 'auto',
            parentGuidelineId: resolveGremlinDraftParentGuidelineId(draft, selected) || targetGuideline.parentGuidelineId || null,
            implementationDate: normalizeImplementationDateInputValue(targetGuideline.implementationDate) || null,
            implementationOwner: String(targetGuideline.implementationOwner || '').trim() || null
          }
        });
        scheduleGuidelineFocus(targetGuideline.id);
        implementedEntityId = String(targetGuideline.id || '').trim();
        implementedEntityTitle = String(draft.title || targetGuideline.title || '').trim();
      } else if (entityKind === 'guideline' && draftMode === 'delete') {
        const targetGuideline = resolveGremlinDraftTargetGuideline(draft, selected);
        if (!targetGuideline?.id) {
          throw new Error(langText('Nepavyko rasti ištrinamos gairės.', 'Could not find the guideline to delete.'));
        }
        const confirmed = window.confirm(`${ui.confirmGuidelineDeleteDraftTitle}\n\n${ui.confirmGuidelineDeleteDraftBody}`);
        if (!confirmed) {
          return;
        }
        await api(`/api/v1/admin/guidelines/${encodeURIComponent(targetGuideline.id)}`, { method: 'DELETE' });
        implementedEntityId = String(targetGuideline.id || '').trim();
        implementedEntityTitle = String(targetGuideline.title || draft.targetTitle || '').trim();
        implementedDeleted = true;
      } else if (entityKind === 'initiative' && draftMode === 'update') {
        const targetInitiative = resolveGremlinDraftTargetInitiative(draft, selected);
        if (!targetInitiative?.id) {
          throw new Error(langText('Nepavyko rasti koreguojamos iniciatyvos.', 'Could not find the initiative to update.'));
        }
        const confirmed = window.confirm(`${ui.confirmInitiativeUpdateDraftTitle}\n\n${ui.confirmInitiativeUpdateDraftBody}`);
        if (!confirmed) {
          return;
        }
        await api(`/api/v1/admin/initiatives/${encodeURIComponent(targetInitiative.id)}`, {
          method: 'PUT',
          body: {
            title: String(draft.title || '').trim(),
            description: String(draft.description || '').trim(),
            status: String(targetInitiative.status || 'active').trim() || 'active',
            lineSide: normalizeLineSide(targetInitiative.lineSide || 'auto') || 'auto',
            guidelineIds: resolveGremlinDraftGuidelineIds(draft, selected),
            implementationDate: normalizeImplementationDateInputValue(targetInitiative.implementationDate) || null,
            implementationOwner: String(targetInitiative.implementationOwner || '').trim() || null
          }
        });
        scheduleInitiativeFocus(targetInitiative.id);
        implementedEntityId = String(targetInitiative.id || '').trim();
        implementedEntityTitle = String(draft.title || targetInitiative.title || '').trim();
      } else if (entityKind === 'initiative' && draftMode === 'delete') {
        const targetInitiative = resolveGremlinDraftTargetInitiative(draft, selected);
        if (!targetInitiative?.id) {
          throw new Error(langText('Nepavyko rasti ištrinamos iniciatyvos.', 'Could not find the initiative to delete.'));
        }
        const confirmed = window.confirm(`${ui.confirmInitiativeDeleteDraftTitle}\n\n${ui.confirmInitiativeDeleteDraftBody}`);
        if (!confirmed) {
          return;
        }
        await api(`/api/v1/admin/initiatives/${encodeURIComponent(targetInitiative.id)}`, { method: 'DELETE' });
        implementedEntityId = String(targetInitiative.id || '').trim();
        implementedEntityTitle = String(targetInitiative.title || draft.targetTitle || '').trim();
        implementedDeleted = true;
      } else if (entityKind === 'initiative') {
        const confirmed = window.confirm(`${ui.confirmInitiativeCreateDraftTitle}\n\n${ui.confirmInitiativeCreateDraftBody}`);
        if (!confirmed) {
          return;
        }
        const guidelineIds = resolveGremlinDraftGuidelineIds(draft, selected);
        const createInitiativeEndpoint = state.role === 'institution_admin'
          ? `/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/initiatives`
          : `/api/v1/cycles/${encodeURIComponent(cycleId)}/initiatives`;
        const payload = await api(createInitiativeEndpoint, {
          method: 'POST',
          body: {
            title: String(draft.title || '').trim(),
            description: String(draft.description || '').trim(),
            guidelineIds,
            lineSide: 'auto'
          }
        });
        scheduleInitiativeFocus(payload?.initiativeId || '');
        implementedEntityId = String(payload?.initiativeId || '').trim();
        implementedEntityTitle = String(draft.title || '').trim();
      } else {
        const confirmed = window.confirm(`${ui.confirmGuidelineCreateDraftTitle}\n\n${ui.confirmGuidelineCreateDraftBody}`);
        if (!confirmed) {
          return;
        }
        const relationType = normalizeGuidelineRelation(draft.relationType || 'orphan');
        const parentGuidelineId = resolveGremlinDraftParentGuidelineId(draft, selected);
        const effectiveRelation = relationType === 'child' && !parentGuidelineId ? 'orphan' : relationType;
        const createGuidelineEndpoint = state.role === 'institution_admin'
          ? `/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/guidelines`
          : `/api/v1/cycles/${encodeURIComponent(cycleId)}/guidelines`;
        const payload = await api(createGuidelineEndpoint, {
          method: 'POST',
          body: {
            title: String(draft.title || '').trim(),
            description: String(draft.description || '').trim(),
            relationType: effectiveRelation,
            parentGuidelineId: effectiveRelation === 'child' ? parentGuidelineId : null
          }
        });
        scheduleGuidelineFocus(payload?.guidelineId || '');
        implementedEntityId = String(payload?.guidelineId || '').trim();
        implementedEntityTitle = String(draft.title || '').trim();
      }

      const historyEntryId = String(selected?.id || '').trim();
      if (historyEntryId && implementedEntityId) {
        await api(`/api/v1/cycles/${encodeURIComponent(cycleId)}/clarity-gremlin/${encodeURIComponent(historyEntryId)}/drafts/${encodeURIComponent(draftIndex)}/implemented`, {
          method: 'POST',
          body: {
            entityKind,
            entityId: implementedEntityId,
            entityTitle: implementedEntityTitle,
            deleted: implementedDeleted
          }
        });
        const implementedPayload = {
          entityKind,
          entityId: implementedEntityId,
          entityTitle: implementedEntityTitle,
          deleted: implementedDeleted,
          appliedAt: new Date().toISOString(),
          appliedBy: state.user?.name || state.user?.email || ''
        };
        historyItems = historyItems.map((item) => {
          if (String(item?.id || '').trim() !== historyEntryId) return item;
          const itemAnalysis = item?.analysis && typeof item.analysis === 'object' ? item.analysis : {};
          const itemDrafts = Array.isArray(itemAnalysis.proposalDrafts) ? [...itemAnalysis.proposalDrafts] : [];
          if (!itemDrafts[Number(draftIndex)]) return item;
          itemDrafts[Number(draftIndex)] = {
            ...itemDrafts[Number(draftIndex)],
            implemented: implementedPayload
          };
          return {
            ...item,
            analysis: {
              ...itemAnalysis,
              proposalDrafts: itemDrafts
            }
          };
        });
        selected.analysis = selected?.analysis && typeof selected.analysis === 'object'
          ? {
            ...selected.analysis,
            proposalDrafts: Array.isArray(selected.analysis.proposalDrafts)
              ? selected.analysis.proposalDrafts.map((itemDraft, itemIndex) => (
                itemIndex === Number(draftIndex)
                  ? { ...itemDraft, implemented: implementedPayload }
                  : itemDraft
              ))
              : selected.analysis.proposalDrafts
          }
          : selected.analysis;
        renderSelection();
      }

      await Promise.all([refreshGuidelines(), refreshInitiatives(), refreshSummary(), loadStrategyMap(), refreshHistory()]);
      notifySuccess(
        entityKind === 'guideline' && draftMode === 'delete'
          ? ui.deleteGuidelineDraftApplied
          : entityKind === 'initiative' && draftMode === 'delete'
            ? ui.deleteInitiativeDraftApplied
            : entityKind === 'guideline' && draftMode === 'update'
              ? ui.updateGuidelineDraftApplied
              : entityKind === 'initiative' && draftMode === 'update'
                ? ui.updateInitiativeDraftApplied
                : entityKind === 'guideline'
                  ? ui.createGuidelineDraftApplied
                  : ui.createInitiativeDraftApplied
      );
    } catch (error) {
      notifyError(toUserMessage(error));
    } finally {
      draftSubmitInProgress = false;
      renderSelection();
      syncBusyUi();
    }
  };

  const bindDraftActions = (selected) => {
    body?.querySelectorAll('[data-gremlin-draft-index]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!(button instanceof HTMLButtonElement)) return;
        void submitDraftProposal(
          selected,
          Number(button.getAttribute('data-gremlin-draft-index') || 0),
          button
        );
      });
    });
    body?.querySelectorAll('[data-action="open-gremlin-implemented-entity"]').forEach((button) => {
      button.addEventListener('click', () => {
        const entityKind = String(button.getAttribute('data-kind') || '').trim().toLowerCase();
        const entityId = String(button.getAttribute('data-entity-id') || '').trim();
        if (!entityId) return;
        if (entityKind === 'initiative') {
          openInitiativeDetail(entityId);
          return;
        }
        openGuidelineDetail(entityId);
      });
    });
  };

  const renderUnsupported = (context) => {
    let message = ui.unsupported;
    if (context.reason === 'login-required') message = ui.loginRequired;
    if (context.reason === 'cycle-required') message = ui.noCycle;
    if (context.reason === 'disabled-view') message = ui.disabledView;
    if (body) body.innerHTML = `<div class="card guideline-empty gremlin-empty"><strong>${escapeHtml(message)}</strong></div>`;
  };

  const loadHistory = async (preferredHistoryId = '') => {
    const context = resolveClarityGremlinContext();
    if (!state.cycle?.id) {
      renderUnsupported(context);
      applyUsage(null);
      if (historyNode) {
        historyNode.innerHTML = `<div class="card guideline-empty gremlin-history-empty"><strong>${escapeHtml(ui.noCycle)}</strong></div>`;
      }
      return;
    }

    try {
      if (historyNode) {
        historyNode.innerHTML = `
          <div class="gremlin-loading-card gremlin-history-loading">
            <div class="gremlin-loading-spinner" aria-hidden="true"></div>
          </div>
        `;
      }
      const payload = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/clarity-gremlin`);
      historyItems = Array.isArray(payload?.history) ? payload.history : [];
      applyUsage(payload?.usage || null);
      const preferred = String(preferredHistoryId || '').trim();
      const matchingCurrent = historyItems.find((item) => clarityGremlinHistoryMatchesContext(item, context)) || null;
        selectedHistoryId = preferred
        || String(matchingCurrent?.id || '').trim()
        || String(historyItems[0]?.id || '').trim();
      if (historyNode) {
        historyNode.innerHTML = renderClarityGremlinHistoryListMarkup(historyItems, selectedHistoryId, context, ui, { locked: isAnalyzing });
        bindHistorySelection();
      }
      if (context.supported !== true && !selectedHistoryId) {
        renderUnsupported(context);
      } else {
        renderSelection();
      }
    } catch (error) {
      if (historyNode) {
        historyNode.innerHTML = `<div class="card guideline-empty gremlin-history-empty"><strong>${escapeHtml(toUserMessage(error))}</strong></div>`;
      }
      if (body) {
        body.innerHTML = `<div class="card guideline-empty gremlin-empty"><strong>${escapeHtml(ui.emptySelection)}</strong></div>`;
      }
      applyUsage(error?.payload?.usage || null);
    }
  };

  const runAnalysis = async (options = {}) => {
    const context = resolveClarityGremlinContext();
    const mode = String(options.mode || 'strategy').trim().toLowerCase() === 'entity' ? 'entity' : 'strategy';
    const requestView = String(options.view || context.view || '').trim().toLowerCase();
    const requestEntityId = String(options.entityId || '').trim();
    if (context.supported !== true) {
      renderUnsupported(context);
      syncBusyUi();
      return;
    }
    if (mode === 'entity' && (!requestEntityId || (requestView !== 'guideline-detail' && requestView !== 'initiative-detail'))) {
      return;
    }

    isAnalyzing = true;
    syncBusyUi();
    if (body) {
      body.innerHTML = `
        <div class="gremlin-loading-card">
          <div class="gremlin-loading-spinner" aria-hidden="true"></div>
          <strong>${escapeHtml(mode === 'entity' ? ui.loadingEntity : getGremlinStrategyLoadingLabel())}</strong>
        </div>
      `;
    }
    const startedAtIso = new Date().toISOString();
    try {
      const selectedModel = getSelectedModelOption();
      const payload = await api(`/api/v1/cycles/${encodeURIComponent(context.cycleId)}/clarity-gremlin`, {
        method: 'POST',
        body: {
          mode,
          view: requestView || context.view,
          entityId: mode === 'entity' ? requestEntityId : '',
          locale: selectedLocale,
          provider: selectedModel.provider,
          model: selectedModel.model
        }
      });
      if (payload?.pending && payload?.jobId) {
        const completed = await pollClarityGremlinJob({
          cycleId: context.cycleId,
          jobId: payload.jobId
        });
        await loadHistory(String(completed?.historyEntryId || '').trim());
        applyUsage(completed?.usage || null);
        return;
      }
      await loadHistory(String(payload?.historyEntryId || '').trim());
    } catch (error) {
      if (isGatewayTimeoutError(error)) {
        if (body) {
          body.innerHTML = `
            <div class="gremlin-loading-card">
              <div class="gremlin-loading-spinner" aria-hidden="true"></div>
              <strong>${escapeHtml(toUserMessage(error))}</strong>
            </div>
          `;
        }
        const recovered = await recoverClarityGremlinAfterGatewayTimeout({
          cycleId: context.cycleId,
          context: mode === 'entity'
            ? { ...context, view: requestView, entityId: requestEntityId }
            : { ...context, entityId: '' },
          sinceIso: startedAtIso
        });
        if (recovered?.historyEntryId) {
          await loadHistory(recovered.historyEntryId);
          applyUsage(recovered.usage || null);
          return;
        }
      }
      const usage = error?.payload?.usage || null;
      if (body) {
        body.innerHTML = `<div class="card guideline-empty gremlin-empty"><strong>${escapeHtml(toUserMessage(error))}</strong></div>`;
      }
      applyUsage(usage);
    } finally {
      isAnalyzing = false;
      syncBusyUi();
    }
  };

  closeButton?.addEventListener('click', closeClarityGremlinModal);
  infoToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isAnalyzing) return;
    infoOpen = !infoOpen;
    syncInfoPanel();
  });
  infoPanel?.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  overlay.addEventListener('click', (event) => {
    if (isAnalyzing) return;
    if (infoOpen) {
      const insideInfo = event.target instanceof Node
        && ((infoToggle instanceof HTMLElement && infoToggle.contains(event.target))
          || (infoPanel instanceof HTMLElement && infoPanel.contains(event.target)));
      if (!insideInfo) {
        infoOpen = false;
        syncInfoPanel();
      }
    }
    if (event.target === overlay) closeClarityGremlinModal();
  });
  document.addEventListener('keydown', function handleGremlinInfoEscape(event) {
    if (!document.body.contains(overlay)) {
      document.removeEventListener('keydown', handleGremlinInfoEscape);
      return;
    }
    if (event.key === 'Escape' && infoOpen && !isAnalyzing) {
      infoOpen = false;
      syncInfoPanel();
    }
  });
  syncInfoPanel();
  syncBusyUi();
  if (initialContext.supported !== true && !state.cycle?.id) {
    renderUnsupported(initialContext);
  }
  void loadHistory();
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







