const steps = [
  {
    id: 'guidelines',
    title: 'Gairės',
    hint: 'Aptarimas, balsavimas, komentarai',
    prompt: 'Kur link judėsime ir kokią naudą kursime?'
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
    body: 'digistrategija.lt sistema skirta patogiam jūsų institucijos strategijos rengimo procesui.',
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
    body: 'Skiltyje „Iniciatyvos“ priskirkite konkrečias iniciatyvas gairių įgyvendinimui.',
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
    body: 'Nariai gali balsuoti už vieni kitų teiktus pasiūlymus gairėse ir iniciatyvose.',
    points: [
      'Balsai skiriami „+“ ir „−“ mygtukais.',
      'Kol ciklas atviras, balsus galima koreguoti.'
    ]
  },
  {
    title: '6. Naudokite strategijų žemėlapį',
    body: 'Strategijų žemėlapis yra patogus vizualinis įrankis peržiūrėti strategijos struktūrą ir elementų ryšius.',
    points: [
      'Galite perjungti sluoksnius „Gairės“ ir „Iniciatyvos“.',
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
      'Admin skiltyje „Embed: Strategijų žemėlapis“ nukopijuokite paruoštą iframe kodą.',
      'Sistema skirta valstybinėms institucijoms, siekiančioms strategijos kūrimo procesą vykdyti efektyviai.'
    ]
  }
];

const DEFAULT_MISSION_TEXT = 'Organizacijos paskirtis ir vertės kūrimo logika.';
const DEFAULT_VISION_TEXT = 'Ilgalaikė kryptis ir siekiama pokyčio būsena.';

const AUTH_STORAGE_KEY = 'uzt-strategy-v1-auth';
const INTRO_COLLAPSED_KEY = 'uzt-strategy-v1-intro-collapsed';
const INTRO_VISITED_KEY = 'uzt-strategy-v1-intro-visited';
const VOTE_FLOATING_COLLAPSED_KEY = 'uzt-strategy-v1-vote-floating-collapsed';
const DEFAULT_INSTITUTION_SLUG = '';
const WRITABLE_CYCLE_STATES = new Set(['open']);
const ALLOWED_VIEWS = new Set(['guidelines', 'initiatives', 'admin', 'map', 'guide', 'about']);
const ADMIN_CACHE_BUST_PARAM = 't';
const EMBED_QUERY_KEY = 'embed';
const EMBED_MAP_VALUE = 'map';
const EMBED_MAP_PATH_PREFIX = '/embed/strategy-map';
const EMBED_BRAND_LINK = 'https://www.digistrategija.lt';

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
  mapLayer: 'guidelines',
  voteFloatingCollapsed: hydrateVoteFloatingCollapsed(),
  mapInitiativeFocusId: '',
  mapInitiativeHoverId: '',
  mapTransform: { x: 120, y: 80, scale: 1 }
};
let adminAppLoadPromise = null;

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
      const onError = () => reject(new Error('Nepavyko įkelti admin.js'));
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
    script.onerror = () => reject(new Error('Nepavyko įkelti admin.js'));
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

function resolveInstitutionSlug() {
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
  if (last === 'admin.html') {
    return normalizeSlug(parts[parts.length - 2]) || DEFAULT_INSTITUTION_SLUG || null;
  }
  return normalizeSlug(last) || DEFAULT_INSTITUTION_SLUG || null;
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
  const params = new URLSearchParams(window.location.search);
  const view = String(params.get('view') || '').trim().toLowerCase();
  return ALLOWED_VIEWS.has(view) ? view : 'guidelines';
}

function buildCurrentPageHref({ slug = state.institutionSlug, view = state.activeView } = {}) {
  const params = new URLSearchParams(window.location.search);
  const nextSlug = normalizeSlug(slug);
  const nextView = state.embedMapMode ? 'map' : (ALLOWED_VIEWS.has(view) ? view : 'guidelines');

  if (nextSlug) params.set('institution', nextSlug);
  else params.delete('institution');

  if (state.embedMapMode) params.set(EMBED_QUERY_KEY, EMBED_MAP_VALUE);
  else params.delete(EMBED_QUERY_KEY);

  if (nextView !== 'guidelines') params.set('view', nextView);
  else params.delete('view');

  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ''}`;
}

function syncRouteState() {
  const nextHref = buildCurrentPageHref();
  const currentHref = `${window.location.pathname}${window.location.search}`;
  if (nextHref !== currentHref) {
    window.history.replaceState(null, '', nextHref);
  }
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
  state.userVotes = {};
  state.initiatives = [];
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function setSession(payload) {
  state.token = payload.token || null;
  state.user = payload.user || null;
  state.role = payload.role || null;
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
    state.userVotes = {};
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
      state.userVotes = {};
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
    <path d="M7 14H5v5h5v-2H7v-3Zm0-4h2V7h3V5H5v5Zm10 7h-3v2h5v-5h-2v3Zm-3-12v2h3v3h2V5h-5Z" fill="currentColor"/>
  </svg>
`;
const MAP_FULLSCREEN_ICON_EXIT = `
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M5 16h3v3h2v-5H5v2Zm3-8H5v2h5V5H8v3Zm6 11h2v-3h3v-2h-5v5Zm2-11V5h-2v5h5V8h-3Z" fill="currentColor"/>
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
    'invalid token': 'Sesija nebegalioja. Prisijunkite iš naujo.',
    'institution not found': `Institucija "${state.institutionSlug}" nerasta.`,
    'cycle not found': 'Aktyvus strategijos ciklas nerastas.',
    'cycle not writable': 'Ciklas nebeleidžia redaguoti (tik skaitymas).',
    'guideline voting disabled': 'Ši gairė išjungta: balsuoti negalima.',
    'initiative voting disabled': 'Ši iniciatyva išjungta: balsuoti negalima.',
    'vote budget exceeded': 'Viršytas balsų biudžetas.',
    forbidden: 'Veiksmas neleidžiamas.',
    'membership inactive': 'Narystė neaktyvi.',
    'invalid credentials': 'Neteisingi prisijungimo duomenys.',
    'invite not found': 'Kvietimas nerastas.',
    'invite expired': 'Kvietimas nebegalioja.',
    'invite revoked': 'Kvietimas atšauktas.',
    'invite already used': 'Kvietimas jau panaudotas.',
    'too many requests': 'Per daug užklausų. Pabandykite po kelių sekundžių.',
    'guidelineId and score(0..5) required': 'Balsas turi būti tarp 0 ir 5.',
    'initiativeId and score(0..5) required': 'Balsas turi būti tarp 0 ir 5.',
    'initiativeId and body required': 'Komentaras negali būti tuščias.',
    'layout payload required': 'Nepateikti žemėlapio išdėstymo duomenys.',
    'guideline not in cycle': 'Gairė nepriklauso šiam ciklui.',
    'initiative not in cycle': 'Iniciatyva nepriklauso šiam ciklui.',
    'initiative not found': 'Iniciatyva nerasta.',
    'at least one guideline required': 'Iniciatyva turi būti priskirta bent vienai gairei.',
    'name required': 'Nurodykite pavadinimą.',
    'token and displayName required': 'Nurodykite kvietimo žetoną ir vardą.'
  };
  return map[raw] || raw || 'Nepavyko įvykdyti užklausos.';
}

async function api(path, { method = 'GET', body = null, auth = true } = {}) {
  const headers = {};
  if (body !== null) headers['Content-Type'] = 'application/json';
  if (auth) {
    if (!state.token) throw new Error('unauthorized');
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined
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

async function loadPublicData() {
  const base = `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current`;
  const [summaryPayload, guidelinesPayload, initiativesPayload] = await Promise.all([
    api(`${base}/summary`, { auth: false }),
    api(`${base}/guidelines`, { auth: false }),
    api(`${base}/initiatives`, { auth: false })
  ]);

  state.institution = initiativesPayload.institution || guidelinesPayload.institution || summaryPayload.institution || null;
  state.cycle = initiativesPayload.cycle || guidelinesPayload.cycle || summaryPayload.cycle || null;
  state.summary = summaryPayload.summary || null;
  state.guidelines = Array.isArray(guidelinesPayload.guidelines) ? guidelinesPayload.guidelines : [];
  state.initiatives = Array.isArray(initiativesPayload.initiatives) ? initiativesPayload.initiatives : [];
}

async function refreshGuidelines() {
  const payload = await api(
    `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current/guidelines`,
    { auth: false }
  );
  state.institution = payload.institution || state.institution;
  state.cycle = payload.cycle || state.cycle;
  state.guidelines = Array.isArray(payload.guidelines) ? payload.guidelines : [];
}

async function refreshInitiatives() {
  const payload = await api(
    `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current/initiatives`,
    { auth: false }
  );
  state.institution = payload.institution || state.institution;
  state.cycle = payload.cycle || state.cycle;
  state.initiatives = Array.isArray(payload.initiatives) ? payload.initiatives : [];
}

async function refreshSummary() {
  const payload = await api(
    `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current/summary`,
    { auth: false }
  );
  state.summary = payload.summary || state.summary;
}

async function loadInstitutions() {
  const payload = await api('/api/v1/public/institutions', { auth: false });
  state.institutions = Array.isArray(payload?.institutions) ? payload.institutions : [];
  state.institutionsLoaded = true;
}

async function loadStrategyMap() {
  const params = new URLSearchParams();
  if (state.institutionSlug) params.set('institution', state.institutionSlug);
  params.set('source', state.embedMapMode ? 'embed' : 'app');
  const payload = await api(`/api/v1/public/strategy-map?${params.toString()}`, { auth: false });
  state.mapData = payload || { institutions: [] };
}

async function loadMemberContext() {
  const context = await api('/api/v1/me/context');
  if (!context?.institution?.slug) throw new Error('Nepavyko gauti naudotojo konteksto.');
  state.accountContext = context;
  state.role = context.membership?.role || state.role || 'member';
  state.user = state.user || context.user || null;
  persistAuthToStorage();

  if (context.institution.slug === state.institutionSlug) {
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
    return;
  }

  state.context = null;
  state.userVotes = {};
}

async function bootstrap() {
  state.loading = true;
  state.error = '';
  render();

  try {
    await loadInstitutions();
    try {
      await loadStrategyMap();
      state.mapError = '';
    } catch (error) {
      state.mapData = { institutions: [] };
      state.mapError = toUserMessage(error);
    }

    if (!state.institutionSlug) {
      state.institution = null;
      state.cycle = null;
      state.summary = null;
      state.guidelines = [];
      state.initiatives = [];
      state.userVotes = {};
      return;
    }

    await loadPublicData();
    if (state.token && !state.embedMapMode) {
      try {
        await loadMemberContext();
      } catch (error) {
        const raw = String(error?.message || '').toLowerCase();
        if (raw === 'invalid token' || raw === 'unauthorized') {
          clearSession();
          throw error;
        }
        state.context = null;
        state.userVotes = {};
      }
    } else if (state.embedMapMode) {
      state.context = null;
      state.userVotes = {};
    }
  } catch (error) {
    state.error = toUserMessage(error);
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

  return `
    <label class="institution-switcher" title="Pasirinkite instituciją peržiūrai">
      <span>Institucija</span>
      <select id="institutionSwitchSelect" ${loading || !hasInstitutions ? 'disabled' : ''}>
        ${options}
      </select>
    </label>
  `;
}

function bindInstitutionSwitch(container) {
  const select = container.querySelector('#institutionSwitchSelect');
  if (!select) return;

  select.addEventListener('change', () => {
    const slug = normalizeSlug(select.value);
    if (slug === normalizeSlug(state.institutionSlug)) return;
    const href = buildCurrentPageHref({ slug, view: state.activeView });
    window.location.href = href;
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
  state.activeView = nextView;
  syncRouteState();
  render();
}

function renderSteps() {
  if (!elements.steps) return;
  elements.steps.innerHTML = '';

  const canOpenAdmin = canOpenAdminView();
  const items = [
    { id: 'guidelines', icon: '◍', title: 'Gairės', locked: false },
    { id: 'initiatives', icon: '✦', title: 'Iniciatyvos', locked: false },
    { id: 'admin', icon: '⚙', title: 'Admin', locked: !canOpenAdmin },
    { id: 'map', icon: '⌗', title: 'Strategijų žemėlapis', locked: false },
    { id: 'guide', icon: '☰', title: 'Naudojimosi gidas', locked: false },
    { id: 'about', icon: 'ℹ', title: 'Apie', locked: false }
  ];

  const visibleItems = state.embedMapMode
    ? items.filter((item) => item.id === 'map')
    : (isEmbeddedContext()
      ? items.filter((item) => item.id !== 'admin')
      : items);

  if (state.activeView === 'admin' && !visibleItems.some((item) => item.id === 'admin')) {
    state.activeView = 'guidelines';
  }

  visibleItems.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `step-pill${state.activeView === item.id ? ' active' : ''}${item.locked ? ' locked' : ''}`;
    button.innerHTML = `
      <div class="step-pill-head">
        <span class="step-icon" aria-hidden="true">${item.icon}</span>
        <h4>${escapeHtml(item.title)}</h4>
      </div>
    `;
    if (item.locked) {
      button.title = 'Administravimas galimas tik savo institucijos administratoriui';
    }
    const isActive = state.activeView === item.id;
    if (isActive) {
      button.disabled = true;
      button.setAttribute('aria-current', 'page');
    } else {
      button.addEventListener('click', () => setActiveView(item.id));
    }
    elements.steps.appendChild(button);
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
    toggleIntroBtn.innerHTML = `<span aria-hidden="true">${state.introCollapsed ? '▾' : '▴'}</span>`;
    toggleIntroBtn.setAttribute('aria-expanded', state.introCollapsed ? 'false' : 'true');
    toggleIntroBtn.setAttribute('aria-label', state.introCollapsed ? 'Išskleisti naudojimosi gidą' : 'Suskleisti naudojimosi gidą');
    toggleIntroBtn.title = state.introCollapsed ? 'Išskleisti naudojimosi gidą' : 'Suskleisti naudojimosi gidą';
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
  const missionNode = elements.introDeck.querySelector('[data-guide-mission]');
  const visionNode = elements.introDeck.querySelector('[data-guide-vision]');
  if (missionNode) missionNode.textContent = cycleMissionText();
  if (visionNode) visionNode.textContent = cycleVisionText();
}

function renderIntroDeck() {
  if (!elements.introDeck) return;
  if (state.embedMapMode) {
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
            <h3>Skaitmenizacijos strategijos dirbtuvės</h3>
          </div>
          <button id="toggleIntroBtn" class="btn btn-ghost intro-toggle-btn" type="button" aria-expanded="true"></button>
        </div>
        <div class="intro-guide-body">
          <section class="guide-structure" aria-label="Strategijos struktūra">
            <div class="guide-structure-head">
              <h4>Strategijos struktūra</h4>
              <p>Nuo krypties iki konkrečių veiklų.</p>
            </div>
            <div class="guide-structure-track" role="list">
              <article class="structure-step structure-step-strategic" role="listitem">
                <span class="structure-label">Misija</span>
                <p data-guide-mission>${escapeHtml(cycleMissionText())}</p>
              </article>
              <span class="structure-arrow" aria-hidden="true">→</span>
              <article class="structure-step structure-step-strategic" role="listitem">
                <span class="structure-label">Vizija</span>
                <p data-guide-vision>${escapeHtml(cycleVisionText())}</p>
              </article>
              <span class="structure-arrow" aria-hidden="true">→</span>
              <section class="structure-layer-group" role="group" aria-label="Platformos dalis">
                <div class="structure-layer-group-head">
                  <span class="structure-group-badge">Platformos apimtis: www.digistrategija.lt</span>
                </div>
                <div class="structure-layer-grid">
                  <article class="structure-step structure-step-layer" role="listitem">
                    <span class="structure-label">Gairės</span>
                    <p>Kryptys arba tikslai, atvaizduojami dviem kortelių lygiais.</p>
                    <div class="structure-mini-cards" aria-hidden="true">
                      <span>Tėvinės</span>
                      <span>Vaikinės</span>
                    </div>
                    <span class="structure-badge">Etapas 1</span>
                  </article>
                  <span class="structure-arrow structure-arrow-inner" aria-hidden="true">→</span>
                  <article class="structure-step structure-step-layer" role="listitem">
                    <span class="structure-label">Iniciatyvos</span>
                    <p>Uždaviniai, kurie išpildo gaires ir kuria apčiuopiamą rezultatą.</p>
                    <div class="structure-mini-cards" aria-hidden="true">
                      <span>Veiksmų idėjos</span>
                      <span>Prioritetai</span>
                    </div>
                    <span class="structure-badge">Etapas 2</span>
                  </article>
                </div>
              </section>
              <span class="structure-arrow" aria-hidden="true">→</span>
              <article class="structure-step" role="listitem">
                <span class="structure-label">Įgyvendinimo planas</span>
                <p>Perkėlimas į konkrečias veiklas, terminus ir atsakomybes.</p>
              </article>
            </div>
            <p class="structure-note">Platformos apimtis: „Gairės“ ir „Iniciatyvos“ etapai.</p>
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
      introGuide.addEventListener('click', () => {
        toggleGuide();
      });
      introGuide.addEventListener('keydown', (event) => {
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
  applyIntroGuideState();
}

function relationLabel(relationType) {
  const relation = String(relationType || 'orphan').toLowerCase();
  if (relation === 'parent') return 'tėvinė';
  if (relation === 'child') return 'vaikinė';
  return 'našlaitė';
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
      <p class="prompt">
        digistrategija.lt sistema skirta patogiam institucijos strategijos rengimo procesui:
        nuo gairių ir iniciatyvų valdymo iki galutinio strategijų žemėlapio publikavimo su embed funkcija.
      </p>
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
        <p>
          Lietuvos viešajame sektoriuje skaitmenizacija vis dažniau suvokiama ne kaip pavienių IT projektų rinkinys,
          o kaip sisteminis pokytis, apimantis paslaugų kokybę, duomenų valdymą ir naujų technologijų taikymą.
          Todėl vis didesnę reikšmę įgyja ne tik technologiniai sprendimai, bet ir aiškios, įgyvendinamos
          skaitmenizacijos strategijos (arba IT plėtros planai).
        </p>
        <p>
          Praktika rodo, kad tradiciniai, didelės apimties strateginiai dokumentai dažnai tampa sunkiai pritaikomi
          greitai besikeičiančioje aplinkoje. Dėl to vis daugiau dėmesio skiriama lanksčioms, įtraukioms ir
          duomenimis grįstoms strategijų formavimo praktikoms, kurios leidžia greičiau susitarti dėl prioritetų ir krypties.
        </p>
        <p>Vienas iš būdų tai pasiekti – aiškiai išsigryninti pagrindines ašis, aplink kurias sukasi dauguma sprendimų:</p>
        <ul class="about-list">
          <li>Kokybiškų paslaugų teikimas (vidiniams ir išoriniams naudotojams).</li>
          <li>Duomenų kokybė ir duomenų valdymas (data governance).</li>
          <li>Tikslingas dirbtinio intelekto taikymas (AI with purpose).</li>
        </ul>
        <p>
          Svarbi ne tik strategijos kryptis, bet ir pats jos rengimo procesas – jis turi būti suprantamas, įtraukiantis
          ir skatinantis bendrą atsakomybę. Tam vis dažniau pasitelkiami paprasti skaitmeniniai įrankiai, leidžiantys
          dalyviams siūlyti gaires, jas komentuoti, balsuoti ir viešai matyti bendrus rezultatus. Tokie sprendimai skatina
          skaidrumą, tarpinstitucinį mokymąsi ir gerosios praktikos dalijimąsi.
        </p>
        <p>
          Šiame kontekste atsirado <strong>www.digistrategija.lt</strong> – eksperimentinis, atviras įrankis,
          skirtas skaitmenizacijos strategijų ar IT plėtros planų gairėms formuoti ir prioritetizuoti.
          Jis leidžia dalyviams struktūruotai įsitraukti į strateginį procesą ir padeda greičiau pereiti nuo
          abstrakčių idėjų prie aiškių sprendimų krypčių.
        </p>
        <p>
          Svarbu pabrėžti, kad tai nėra enterprise lygio ar sertifikuotas sprendimas – veikiau praktinis eksperimentas,
          skirtas parodyti, kaip pasitelkiant šiuolaikines technologijas ir dirbtinį intelektą galima greitai sukurti
          veikiančius, naudotojams suprantamus įrankius.
        </p>
        <p>
          Dirbtinis intelektas ir skaitmeniniai sprendimai jau keičia viešojo sektoriaus veiklos modelius. Organizacijos,
          kurios drąsiai eksperimentuoja, augina kompetencijas ir taiko technologijas tikslingai, turi realią galimybę
          judėti greičiau ir išlikti konkurencingos sparčiai besikeičiančioje aplinkoje.
        </p>
      </div>
    </section>
  `;
}

function renderAdminView() {
  elements.stepView.innerHTML = `
    <section class="admin-inline-shell">
      <div class="step-header">
        <h2>Admin</h2>
      </div>
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
          <strong>Nepavyko įkelti administravimo lango</strong>
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
  const rawAuthor = String(comment?.authorName || comment?.authorEmail || '').trim();
  const author = canShowAuthorIdentity && rawAuthor ? rawAuthor : 'Dalyvis';
  const timestamp = formatCommentDateTime(comment?.createdAt);
  return `
    <li class="comment-item">
      <div class="comment-body">${escapeHtml(comment?.body || '')}</div>
      <div class="comment-meta">${escapeHtml(author)} · ${escapeHtml(timestamp)}</div>
    </li>
  `;
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

function renderGuidelineCard(guideline, options) {
  const userScore = Number(state.userVotes[guideline.id] || 0);
  const comments = Array.isArray(guideline.comments) ? guideline.comments : [];
  const safeComments = comments.length
    ? comments.map((comment) => renderCommentItem(comment)).join('')
    : '<li class="comment-item comment-item-empty">Dar nėra komentarų.</li>';
  const relation = relationLabel(guideline.relationType);
  const relationKey = normalizeGuidelineRelation(guideline.relationType);
  const relationTag = relation.charAt(0).toUpperCase() + relation.slice(1);
  const guidelineStatus = String(guideline.status || 'active').toLowerCase();
  const votingDisabled = guidelineStatus === 'disabled';

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
    <article class="card guideline-card guideline-relation-${escapeHtml(relationKey)} ${votingDisabled ? 'guideline-disabled' : ''}">
      <div class="card-top">
        <div class="title-row">
          <h4>${escapeHtml(guideline.title)}</h4>
          <span class="tag">${escapeHtml(relationTag)}</span>
          ${votingDisabled ? '<span class="tag tag-disabled">Išjungta</span>' : ''}
        </div>
        <p>${escapeHtml(guideline.description || 'Be paaiškinimo')}</p>
      </div>
      ${options.member ? `
        <div class="vote-panel">
          <div class="vote-panel-head">
            <span class="vote-label">Tavo balas</span>
            <span class="tag">Balsuotojų: ${Number(guideline.voterCount || 0)}</span>
          </div>
          <div class="vote-panel-body">
            <div class="vote-controls">
              <button class="vote-btn" data-action="vote-minus" data-id="${escapeHtml(guideline.id)}" aria-label="Atimti balsą" ${canMinus ? '' : 'disabled'}>−</button>
              <span class="vote-score">${userScore}</span>
              <button class="vote-btn" data-action="vote-plus" data-id="${escapeHtml(guideline.id)}" aria-label="Pridėti balsą" ${canPlus ? '' : 'disabled'}>+</button>
            </div>
            <div class="vote-total">Bendras balas: <strong>${Number(guideline.totalScore || 0)}</strong></div>
            ${votingDisabled ? '<div class="vote-total">Balsavimas išjungtas administratoriaus</div>' : ''}
          </div>
        </div>
      ` : `
        <div class="vote-panel">
          <div class="vote-panel-head">
            <span class="vote-label">Viešas režimas</span>
            <span class="tag">Balsuotojų: ${Number(guideline.voterCount || 0)}</span>
          </div>
          <div class="vote-panel-body">
            <div class="vote-total"><strong>Bendras balas: ${Number(guideline.totalScore || 0)}</strong></div>
            <div class="vote-total">Rodomi tik agreguoti duomenys</div>
          </div>
        </div>
      `}
      <div class="card-section">
        <strong>Komentarai</strong>
        <ul class="mini-list">${safeComments}</ul>
        ${options.member && options.writable ? `
          <form data-action="comment" data-id="${escapeHtml(guideline.id)}" class="inline-form">
            <input type="text" name="comment" placeholder="Įrašykite komentarą" required ${state.busy ? 'disabled' : ''}/>
            <button class="btn btn-ghost" type="submit" ${state.busy ? 'disabled' : ''}>Pridėti</button>
          </form>
        ` : '<p class="prompt" style="margin: 8px 0 0;">Viešai rodomi komentarai. Prisijunkite, jei norite komentuoti.</p>'}
      </div>
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

function renderInitiativeCard(initiative, options) {
  const userScore = Number(state.userVotes[initiative.id] || 0);
  const comments = Array.isArray(initiative.comments) ? initiative.comments : [];
  const safeComments = comments.length
    ? comments.map((comment) => renderCommentItem(comment)).join('')
    : '<li class="comment-item comment-item-empty">Dar nėra komentarų.</li>';
  const initiativeStatus = String(initiative.status || 'active').toLowerCase();
  const votingDisabled = initiativeStatus === 'disabled';
  const linkedNames = resolveInitiativeGuidelineNames(initiative);

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
    <article class="card initiative-card ${votingDisabled ? 'guideline-disabled' : ''}">
      <div class="card-top">
        <div class="title-row">
          <h4>${escapeHtml(initiative.title)}</h4>
          <span class="tag">Iniciatyva</span>
          ${votingDisabled ? '<span class="tag tag-disabled">Išjungta</span>' : ''}
        </div>
        <p>${escapeHtml(initiative.description || 'Be paaiškinimo')}</p>
        <div class="header-stack">
          ${(linkedNames.length
            ? linkedNames.map((name) => `<span class="tag">${escapeHtml(name)}</span>`).join('')
            : '<span class="tag">Nepriskirta gairių</span>')}
        </div>
      </div>
      ${options.member ? `
        <div class="vote-panel">
          <div class="vote-panel-head">
            <span class="vote-label">Tavo balas</span>
            <span class="tag">Balsuotojų: ${Number(initiative.voterCount || 0)}</span>
          </div>
          <div class="vote-panel-body">
            <div class="vote-controls">
              <button class="vote-btn" data-action="initiative-vote-minus" data-id="${escapeHtml(initiative.id)}" aria-label="Atimti balsą" ${canMinus ? '' : 'disabled'}>−</button>
              <span class="vote-score">${userScore}</span>
              <button class="vote-btn" data-action="initiative-vote-plus" data-id="${escapeHtml(initiative.id)}" aria-label="Pridėti balsą" ${canPlus ? '' : 'disabled'}>+</button>
            </div>
            <div class="vote-total">Bendras balas: <strong>${Number(initiative.totalScore || 0)}</strong></div>
            ${votingDisabled ? '<div class="vote-total">Balsavimas išjungtas administratoriaus</div>' : ''}
          </div>
        </div>
      ` : `
        <div class="vote-panel">
          <div class="vote-panel-head">
            <span class="vote-label">Viešas režimas</span>
            <span class="tag">Balsuotojų: ${Number(initiative.voterCount || 0)}</span>
          </div>
          <div class="vote-panel-body">
            <div class="vote-total"><strong>Bendras balas: ${Number(initiative.totalScore || 0)}</strong></div>
            <div class="vote-total">Rodomi tik agreguoti duomenys</div>
          </div>
        </div>
      `}
      <div class="card-section">
        <strong>Komentarai</strong>
        <ul class="mini-list">${safeComments}</ul>
        ${options.member && options.writable ? `
          <form data-action="initiative-comment" data-id="${escapeHtml(initiative.id)}" class="inline-form">
            <input type="text" name="comment" placeholder="Įrašykite komentarą" required ${state.busy ? 'disabled' : ''}/>
            <button class="btn btn-ghost" type="submit" ${state.busy ? 'disabled' : ''}>Pridėti</button>
          </form>
        ` : '<p class="prompt" style="margin: 8px 0 0;">Viešai rodomi komentarai. Prisijunkite, jei norite komentuoti.</p>'}
      </div>
    </article>
  `;
}

function renderInitiativesView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Pasirinkite instituciją</strong>
      </div>
    `;
    return;
  }

  if (state.loading) {
    elements.stepView.innerHTML = '<div class="card"><strong>Kraunami duomenys...</strong></div>';
    return;
  }

  if (state.error) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Nepavyko įkelti duomenų</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.error)}</p>
        <button id="retryLoadBtn" class="btn btn-primary" style="margin-top: 12px;">Bandyti dar kartą</button>
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
    return status === 'active' || status === 'disabled' || status === 'merged';
  });

  const stats = [
    `Būsena: ${String(state.cycle?.state || '-').toUpperCase()}`,
    `Iniciatyvos: ${Number(state.summary?.initiatives_count || initiatives.length || 0)}`,
    `Komentarai: ${Number(state.summary?.initiative_comments_count || 0)}`,
    `Dalyviai: ${Number(state.summary?.participant_count || 0)}`
  ];

  elements.stepView.innerHTML = `
    <div class="step-header">
      <h2>Iniciatyvos</h2>
      <div class="header-stack step-header-actions">
        <button id="exportBtnInline" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>Eksportuoti santrauką</button>
        <span class="tag">Institucija: ${escapeHtml(state.institution?.name || state.institutionSlug)}</span>
        <span class="tag">Ciklas: ${escapeHtml(state.cycle?.title || '-')}</span>
        ${member ? `<span class="tag">Tavo balsai: ${remaining} / ${budget}</span>` : '<span class="tag">Viešas režimas</span>'}
      </div>
    </div>

    <p class="prompt">${escapeHtml(steps[1].prompt)}</p>
    ${state.notice ? `<div class="card" style="margin-bottom: 16px;"><strong>${escapeHtml(state.notice)}</strong></div>` : ''}

    <div class="header-stack" style="margin-bottom: 14px;">
      ${stats.map((line) => `<span class="tag">${escapeHtml(line)}</span>`).join('')}
    </div>

    <section id="initiativeSection" class="guideline-group">
      ${initiatives.length
        ? `<div class="card-list initiative-list">
            ${initiatives.map((initiative) => renderInitiativeCard(initiative, { member, writable })).join('')}
          </div>`
        : `<div class="card guideline-empty">
            <strong>Iniciatyvų dar nėra</strong>
            <p class="prompt" style="margin: 6px 0 0;">Šioje institucijoje kol kas nėra sukurtų iniciatyvų.</p>
          </div>`
      }
    </section>

    ${member ? (writable ? `
      <div class="card" style="margin-top: 16px;">
        <div class="header-row">
          <strong>Nauja iniciatyva</strong>
          <span class="tag">Pasiūlymas</span>
        </div>
        <p class="prompt" style="margin-bottom: 10px;">Iniciatyva turi būti priskirta bent vienai gairei.</p>
        <form id="initiativeAddForm">
          <div class="form-row">
            <input type="text" name="title" placeholder="Iniciatyvos pavadinimas" required ${state.busy ? 'disabled' : ''}/>
          </div>
          <textarea name="desc" placeholder="Trumpas paaiškinimas" ${state.busy ? 'disabled' : ''}></textarea>
          <label class="prompt" style="display:block;margin:10px 0 6px;">Priskirtos gairės</label>
          <select name="guidelineIds" multiple size="${Math.min(Math.max(eligibleGuidelines.length, 4), 10)}" ${state.busy ? 'disabled' : ''}>
            ${eligibleGuidelines.map((guideline) => `<option value="${escapeHtml(guideline.id)}">${escapeHtml(guideline.title)}</option>`).join('')}
          </select>
          <p class="prompt" style="margin: 8px 0 0;">Laikykite Ctrl (arba Cmd), jei norite pažymėti kelias gaires.</p>
          <button class="btn btn-primary" type="submit" style="margin-top: 12px;" ${state.busy ? 'disabled' : ''}>Pridėti iniciatyvą</button>
        </form>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>Ciklas užrakintas redagavimui</strong>
      </div>
    `) : (authenticated ? `
      <div class="card" style="margin-top: 16px;">
        <strong>Prisijungta prie kitos institucijos</strong>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>Prisijunkite, kad galėtumėte aktyviai dalyvauti</strong>
        <button id="openAuthFromStep" class="btn btn-primary" style="margin-top: 12px;">Prisijungti</button>
      </div>
    `)}
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
      const guidelineIds = Array.from(initiativeForm.querySelectorAll('select[name=\"guidelineIds\"] option:checked'))
        .map((option) => option.value)
        .filter(Boolean);
      if (!title) return;

      await runBusy(async () => {
        await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/initiatives`, {
          method: 'POST',
          body: { title, description, guidelineIds, lineSide: 'auto' }
        });
        await Promise.all([refreshInitiatives(), refreshSummary(), loadStrategyMap()]);
      });
    });
  }
  if (list) {
    list.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      const initiativeId = target.dataset.id;
      if (!action || !initiativeId) return;
      if (action === 'initiative-vote-plus' || action === 'initiative-vote-minus') {
        const delta = action === 'initiative-vote-plus' ? 1 : -1;
        const origin = getElementCenter(target);
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
        await Promise.all([refreshInitiatives(), refreshSummary(), loadStrategyMap()]);
      });
    });
  }
}

function renderStepView() {
  if (state.embedMapMode && state.activeView !== 'map') {
    state.activeView = 'map';
  }
  if (state.activeView !== 'map' && document.fullscreenElement === elements.stepView) {
    document.exitFullscreen().catch(() => {});
  }

  if (state.activeView === 'about') {
    renderAboutView();
    return;
  }

  if (state.activeView === 'guide') {
    renderGuideView();
    return;
  }

  if (state.activeView === 'initiatives') {
    renderInitiativesView();
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
        <strong>Pasirinkite instituciją</strong>
        <p class="prompt" style="margin: 8px 0 0;">
          Viršuje dešinėje pasirinkite instituciją iš išskleidžiamo sąrašo, kad atvertumėte jos viešą gairių puslapį.
        </p>
      </div>
    `;
    return;
  }

  if (state.loading) {
    elements.stepView.innerHTML = '<div class="card"><strong>Kraunami duomenys...</strong></div>';
    return;
  }

  if (state.error) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Nepavyko įkelti duomenų</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.error)}</p>
        <button id="retryLoadBtn" class="btn btn-primary" style="margin-top: 12px;">Bandyti dar kartą</button>
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
    `Būsena: ${String(state.cycle?.state || '-').toUpperCase()}`,
    `Gairės: ${Number(state.summary?.guidelines_count || state.guidelines.length || 0)}`,
    `Komentarai: ${Number(state.summary?.comments_count || 0)}`,
    `Dalyviai: ${Number(state.summary?.participant_count || 0)}`
  ];
  const relationGroups = buildGuidelineRelationshipGroups(state.guidelines);

  elements.stepView.innerHTML = `
    <div class="step-header">
      <h2>Gairės</h2>
      <div class="header-stack step-header-actions">
        <button id="exportBtnInline" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>Eksportuoti santrauką</button>
        <span class="tag">Institucija: ${escapeHtml(state.institution?.name || state.institutionSlug)}</span>
        <span class="tag">Ciklas: ${escapeHtml(state.cycle?.title || '-')}</span>
        ${member ? `<span class="tag">Tavo balsai: ${remaining} / ${budget}</span>` : '<span class="tag">Viešas režimas</span>'}
      </div>
    </div>

    <p class="prompt">${escapeHtml((steps.find((item) => item.id === 'guidelines') || steps[0]).prompt)}</p>
    ${state.notice ? `<div class="card" style="margin-bottom: 16px;"><strong>${escapeHtml(state.notice)}</strong></div>` : ''}

    <div class="header-stack" style="margin-bottom: 14px;">
      ${stats.map((line) => `<span class="tag">${escapeHtml(line)}</span>`).join('')}
    </div>

    <div id="guidelineGroups" class="guideline-groups">
      <section class="guideline-group">
        <div class="guideline-group-header">
          <h3>Susietos gairės</h3>
          <span class="tag">${relationGroups.parentGroups.length}</span>
        </div>
        <p class="prompt">Tėvinės gairės rodomos kartu su joms priskirtomis vaikinėmis gairėmis.</p>
        ${relationGroups.parentGroups.length
          ? relationGroups.parentGroups.map((group) => `
              <div class="relationship-cluster">
                <div class="relationship-cluster-head">
                  <span class="tag tag-main">Tėvinė</span>
                  <strong>${escapeHtml(group.parent.title)}</strong>
                  <span class="tag">Vaikinių: ${group.children.length}</span>
                </div>
                <div class="card-list relationship-cluster-cards">
                  ${renderGuidelineCard(group.parent, { member, writable })}
                  ${group.children.map((child) => renderGuidelineCard(child, { member, writable })).join('')}
                </div>
              </div>
            `).join('')
          : `<div class="card guideline-empty">
              <strong>Kol kas nėra tėvinių gairių su ryšiais</strong>
              <p class="prompt" style="margin: 6px 0 0;">Sukūrus ryšius, tėvinės ir vaikinės gairės bus rodomos viename bloke.</p>
            </div>`
        }
      </section>

      ${relationGroups.unassignedChildren.length ? `
        <section class="guideline-group">
          <div class="guideline-group-header">
            <h3>Vaikinės be tėvinės</h3>
            <span class="tag">${relationGroups.unassignedChildren.length}</span>
          </div>
          <p class="prompt">Šios vaikinės gairės dar neturi teisingai priskirtos tėvinės gairės.</p>
          <div class="card-list">
            ${relationGroups.unassignedChildren.map((guideline) => renderGuidelineCard(guideline, { member, writable })).join('')}
          </div>
        </section>
      ` : ''}

      <section class="guideline-group">
        <div class="guideline-group-header">
          <h3>Našlaitinės gairės</h3>
          <span class="tag">${relationGroups.orphanGuidelines.length}</span>
        </div>
        <p class="prompt">Savarankiškos gairės, kurios nėra priskirtos tėvinei gairei.</p>
        ${relationGroups.orphanGuidelines.length
          ? `<div class="card-list">
              ${relationGroups.orphanGuidelines.map((guideline) => renderGuidelineCard(guideline, { member, writable })).join('')}
            </div>`
          : `<div class="card guideline-empty">
              <strong>Našlaitinių gairių nėra</strong>
              <p class="prompt" style="margin: 6px 0 0;">Visos gairės jau susietos su tėvinėmis arba pažymėtos kitaip.</p>
            </div>`
        }
      </section>
    </div>
    ${member ? (writable ? `
      <div class="card" style="margin-top: 16px;">
        <div class="header-row">
          <strong>Nauja gairė</strong>
          <span class="tag">Siūlymas</span>
        </div>
        <p class="prompt" style="margin-bottom: 10px;">Siūlykite papildomas gaires, kurios turėtų būti įtrauktos.</p>
        <form id="guidelineAddForm">
          <div class="form-row">
            <input type="text" name="title" placeholder="Gairės pavadinimas" required ${state.busy ? 'disabled' : ''}/>
          </div>
          <textarea name="desc" placeholder="Trumpas paaiškinimas" ${state.busy ? 'disabled' : ''}></textarea>
          <button class="btn btn-primary" type="submit" style="margin-top: 12px;" ${state.busy ? 'disabled' : ''}>Pridėti gairę</button>
        </form>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>Ciklas užrakintas redagavimui</strong>
        <p class="prompt" style="margin: 8px 0 0;">Balsuoti ir komentuoti galima tik kai ciklo būsena yra Open.</p>
      </div>
    `) : (authenticated ? `
      <div class="card" style="margin-top: 16px;">
        <strong>Prisijungta prie kitos institucijos</strong>
        <p class="prompt" style="margin: 8px 0 0;">
          Šios institucijos strategiją galite peržiūrėti, bet teikti pasiūlymų, komentuoti ir balsuoti negalite.
        </p>
      </div>
    ` : `
      <div class="card" style="margin-top: 16px;">
        <strong>Prisijunkite, kad galėtumėte aktyviai dalyvauti</strong>
        <p class="prompt" style="margin: 8px 0 0;">Viešai matomi visi komentarai prie strategijos gairių. Prisijungus galima siūlyti gaires, komentuoti ir balsuoti.</p>
        <button id="openAuthFromStep" class="btn btn-primary" style="margin-top: 12px;">Prisijungti</button>
      </div>
    `)}
  `;

  bindStepEvents();
}

function bindStepEvents() {
  const openAuthFromStep = elements.stepView.querySelector('#openAuthFromStep');
  const exportBtnInline = elements.stepView.querySelector('#exportBtnInline');
  const guidelineForm = elements.stepView.querySelector('#guidelineAddForm');
  const list = elements.stepView.querySelector('#guidelineGroups');

  if (openAuthFromStep) {
    openAuthFromStep.addEventListener('click', () => showAuthModal('login'));
  }

  if (exportBtnInline) {
    exportBtnInline.addEventListener('click', exportSummary);
  }

  if (guidelineForm) {
    guidelineForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(guidelineForm);
      const title = String(fd.get('title') || '').trim();
      const description = String(fd.get('desc') || '').trim();
      if (!title) return;

      await runBusy(async () => {
        await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/guidelines`, {
          method: 'POST',
          body: { title, description }
        });
        await Promise.all([refreshGuidelines(), refreshSummary(), loadStrategyMap()]);
      });
    });
  }

  if (list) {
    list.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const action = target.dataset.action;
      const guidelineId = target.dataset.id;
      if (!action || !guidelineId) return;

      if (action === 'vote-plus' || action === 'vote-minus') {
        const delta = action === 'vote-plus' ? 1 : -1;
        const origin = getElementCenter(target);
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
        await Promise.all([refreshGuidelines(), refreshSummary(), loadStrategyMap()]);
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
  const switcher = institutionSelectMarkup();

  if (!state.institutionSlug) {
    container.innerHTML = `
      <div class="user-toolbar">
        ${switcher}
      </div>
    `;
    bindInstitutionSwitch(container);
    return;
  }

  if (!isAuthenticated()) {
    container.innerHTML = `
      <div class="user-toolbar">
        ${switcher}
        <button id="openAuthBtn" class="btn btn-primary">Prisijungti</button>
      </div>
    `;
    bindInstitutionSwitch(container);
    const openBtn = container.querySelector('#openAuthBtn');
    if (openBtn) openBtn.addEventListener('click', () => showAuthModal('login'));
    return;
  }

  const displayName = state.user?.displayName || state.user?.email || 'Prisijungęs vartotojas';
  const roleLabel = state.role === 'institution_admin' ? 'Administratorius' : 'Narys';

  container.innerHTML = `
    <div class="user-toolbar">
      ${switcher}
      <div class="user-chip">
        <span>${escapeHtml(displayName)}</span>
        <span class="tag">${escapeHtml(roleLabel)}</span>
      </div>
      <button id="logoutBtn" class="btn btn-ghost">Atsijungti</button>
    </div>
  `;

  bindInstitutionSwitch(container);
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
      <button id="toggleVoteFloatingBtn" class="vote-floating-toggle" type="button" aria-label="${state.voteFloatingCollapsed ? 'Rodyti balsų biudžetą' : 'Slėpti balsų biudžetą'}">
        ${state.voteFloatingCollapsed ? '>' : '<'}
      </button>
      <div class="vote-floating-content">
        <div class="vote-floating-title">Balsų biudžetas</div>
        <div class="vote-floating-count">${remaining} / ${budget}</div>
        <div class="vote-total">${locked ? 'Ciklas užrakintas' : 'Balsavimas aktyvus'}</div>
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
  lines.push(`Ciklas: ${state.cycle?.title || '-'}`);
  lines.push(`Būsena: ${state.cycle?.state || '-'}`);
  lines.push('');
  lines.push('Gairės:');

  if (!state.guidelines.length) {
    lines.push('- Nėra duomenų');
    return lines.join('\n');
  }

  state.guidelines.forEach((guideline) => {
    lines.push(`- ${guideline.title} (bendras balas: ${Number(guideline.totalScore || 0)})`);
    lines.push(`  aprašymas: ${guideline.description || 'be paaiškinimo'}`);
    lines.push(`  komentarų: ${Array.isArray(guideline.comments) ? guideline.comments.length : 0}`);
  });

  lines.push('');
  lines.push('Iniciatyvos:');
  if (!state.initiatives.length) {
    lines.push('- Nėra duomenų');
  } else {
    state.initiatives.forEach((initiative) => {
      const linkedNames = resolveInitiativeGuidelineNames(initiative);
      lines.push(`- ${initiative.title} (bendras balas: ${Number(initiative.totalScore || 0)})`);
      lines.push(`  aprašymas: ${initiative.description || 'be paaiškinimo'}`);
      lines.push(`  susietos gairės: ${linkedNames.length ? linkedNames.join(', ') : 'nėra'}`);
      lines.push(`  komentarų: ${Array.isArray(initiative.comments) ? initiative.comments.length : 0}`);
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
  link.download = `strategy-${state.institutionSlug}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindGlobal() {
  document.getElementById('closeExport').addEventListener('click', () => {
    elements.exportPanel.hidden = true;
  });
  document.getElementById('copySummary').addEventListener('click', async () => {
    await navigator.clipboard.writeText(elements.summaryText.value);
  });
  document.getElementById('downloadJson').addEventListener('click', downloadJson);
  window.addEventListener('uzt-auth-changed', handleAuthChanged);
  document.addEventListener('fullscreenchange', () => {
    updateMapFullscreenButtonLabel();
    if (state.activeView !== 'map') return;
    const viewport = document.getElementById('strategyMapViewport');
    const world = document.getElementById('strategyMapWorld');
    if (!viewport || !world) return;
    fitMapToCurrentNodes(viewport, world);
  });
  window.addEventListener('scroll', maybeAutoCollapseIntroOnFirstScroll, { passive: true });
}

function showAuthModal(initialMode) {
  if (!state.institutionSlug) return;

  let overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'loginOverlay';
  overlay.className = 'login-overlay';
  overlay.innerHTML = `
    <div class="login-card">
      <div class="header-row" style="margin-bottom: 8px;">
        <h2>${initialMode === 'invite' ? 'Kvietimo priėmimas' : 'Prisijungimas'}</h2>
        <button id="closeAuthModal" class="btn btn-ghost" type="button">Uždaryti</button>
      </div>
      <p class="prompt">Institucija: <strong>${escapeHtml(state.institutionSlug)}</strong></p>
      <div id="authError" class="error" style="display:none;"></div>

      <form id="loginForm" class="login-form">
        <input type="text" name="email" placeholder="El. paštas" required />
        <input type="password" name="password" placeholder="Slaptažodis" required />
        <button class="btn btn-primary" type="submit">Prisijungti</button>
      </form>

      <hr style="border: none; border-top: 1px solid #eadbc7; margin: 14px 0;">

      <form id="inviteForm" class="login-form">
        <input type="text" name="token" placeholder="Kvietimo žetonas" required />
        <input type="text" name="displayName" placeholder="Vardas ir pavardė" required />
        <input type="password" name="password" placeholder="Sukurkite slaptažodį (min. 8)" required />
        <button class="btn btn-ghost" type="submit">Priimti kvietimą</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('#closeAuthModal');
  const authError = overlay.querySelector('#authError');
  const loginForm = overlay.querySelector('#loginForm');
  const inviteForm = overlay.querySelector('#inviteForm');

  function closeModal() {
    const current = document.getElementById('loginOverlay');
    if (current) current.remove();
  }

  function showError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
  }

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(loginForm);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    if (!email || !password) return;

    try {
      const payload = await api('/api/v1/auth/login', {
        method: 'POST',
        auth: false,
        body: {
          email,
          password,
          institutionSlug: state.institutionSlug
        }
      });
      setSession(payload);
      closeModal();
      await bootstrap();
    } catch (error) {
      showError(toUserMessage(error));
    }
  });

  inviteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(inviteForm);
    const token = String(fd.get('token') || '').trim();
    const displayName = String(fd.get('displayName') || '').trim();
    const password = String(fd.get('password') || '');
    if (!token || !displayName || !password) return;

    try {
      const payload = await api('/api/v1/invites/accept', {
        method: 'POST',
        auth: false,
        body: { token, displayName, password }
      });
      setSession(payload);
      closeModal();
      await bootstrap();
    } catch (error) {
      showError(toUserMessage(error));
    }
  });
}

function render() {
  renderSteps();
  syncRouteState();
  renderIntroDeck();
  renderInstitutionPicker();
  renderStepView();
  renderUserBar();
  renderVoteFloating();
  window.dispatchEvent(new CustomEvent('uzt-rendered'));
}
