const steps = [
  {
    id: 'guidelines',
    title: 'Gairės',
    hint: 'Aptarimas, balsavimas, komentarai',
    prompt: 'Kur link judėsime ir kokią naudą kursime?'
  }
];

const introSlides = [
  {
    title: '1. Pasirinkite instituciją',
    body: 'Viršuje dešinėje pasirinkite instituciją. Matysite tik tos institucijos viešas gaires ir strategijos eigą.',
    points: ['Instituciją galima keisti bet kada.', 'Perjungus instituciją duomenys atsinaujina automatiškai.']
  },
  {
    title: '2. Peržiūrėkite gaires',
    body: 'Skiltyje „Gairės“ matysite pasiūlymus, komentarus ir bendrus balsų rezultatus. Neprisijungę vartotojai mato tik viešą informaciją.',
    points: ['Kiekviena gairė turi atskirą diskusijos bloką.', 'Matomi bendri balsai ir balsuotojų skaičius.']
  },
  {
    title: '3. Prisijungimas ir teisės',
    body: 'Prisijungę dalyviai gali komentuoti, balsuoti ir siūlyti naujas gaires. Administratoriaus teisės suteikia papildomą valdymą.',
    points: ['Administratoriai gali valdyti ciklą ir narius.', 'Ne savo institucijos strategijose veikia tik peržiūros režimas.']
  },
  {
    title: '4. Balsavimo logika',
    body: 'Kiekvienas narys turi ribotą balsų biudžetą. Balsai skiriami su „+“ ir „-“ mygtukais, o panelėje matomas likutis.',
    points: ['Vienai gairei taikomos minimalios ir maksimalios ribos.', 'Balsus galima koreguoti, kol ciklas leidžia redagavimą.']
  },
  {
    title: '5. Ciklo būsenos',
    body: 'Strategija keliauja per būsenas: Draft, Open, Review, Final ir Archived. Nuo būsenos priklauso, ar galima aktyviai dalyvauti.',
    points: ['Open/Review: galima balsuoti ir komentuoti.', 'Final/Archived: peržiūra ir rezultatų analizė.']
  },
  {
    title: '6. Strategijų žemėlapis',
    body: 'Žemėlapyje matysite institucijos gaires ir jų ryšius: tėvinė, vaikinė arba našlaitė.',
    points: ['Administratoriai gali tempti korteles ir išsaugoti išdėstymą.', 'Kortelėse rodoma balsų dinamika vizualiais indikatoriais.']
  },
  {
    title: '7. Kaip užbaigti etapą',
    body: 'Etapo pabaigoje administratorius užfiksuoja ciklo būseną ir, jei reikia, paskelbia rezultatus viešam peržiūrėjimui.',
    points: ['Prieš uždarymą verta peržiūrėti komentarus ir balsus.', 'Santrauką galima eksportuoti į tekstą ir JSON.']
  }
];

const AUTH_STORAGE_KEY = 'uzt-strategy-v1-auth';
const INTRO_COLLAPSED_KEY = 'uzt-strategy-v1-intro-collapsed';
const VOTE_FLOATING_COLLAPSED_KEY = 'uzt-strategy-v1-vote-floating-collapsed';
const DEFAULT_INSTITUTION_SLUG = '';
const WRITABLE_CYCLE_STATES = new Set(['open', 'review']);
const ALLOWED_VIEWS = new Set(['guidelines', 'admin', 'map', 'about']);
const ADMIN_FRAME_HEIGHT_EVENT = 'uzt-admin-height';

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

const state = {
  institutionSlug: resolveInstitutionSlug(),
  activeView: resolveInitialView(),
  introCollapsed: hydrateIntroCollapsed(),
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
  mapData: null,
  mapError: '',
  token: null,
  user: null,
  role: null,
  accountContext: null,
  context: null,
  userVotes: {},
  voteFloatingCollapsed: hydrateVoteFloatingCollapsed(),
  mapTransform: { x: 120, y: 80, scale: 1 }
};

hydrateAuthFromStorage();
bindGlobal();
bootstrap();

function applyAdminInlineFrameHeight(frame, rawHeight) {
  if (!frame) return;
  const nextHeight = Number(rawHeight || 0);
  if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
  frame.style.height = `${Math.max(720, Math.ceil(nextHeight))}px`;
}

function resolveInstitutionSlug() {
  const params = new URLSearchParams(window.location.search);
  const querySlug = normalizeSlug(params.get('institution'));
  if (querySlug) return querySlug;

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

function resolveInitialView() {
  const params = new URLSearchParams(window.location.search);
  const view = String(params.get('view') || '').trim().toLowerCase();
  return ALLOWED_VIEWS.has(view) ? view : 'guidelines';
}

function buildCurrentPageHref({ slug = state.institutionSlug, view = state.activeView } = {}) {
  const params = new URLSearchParams(window.location.search);
  const nextSlug = normalizeSlug(slug);
  const nextView = ALLOWED_VIEWS.has(view) ? view : 'guidelines';

  if (nextSlug) params.set('institution', nextSlug);
  else params.delete('institution');

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
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function setSession(payload) {
  state.token = payload.token || null;
  state.user = payload.user || null;
  state.role = payload.role || null;
  state.accountContext = null;
  persistAuthToStorage();
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
  return Number(state.context?.rules?.voteBudget || 10);
}

function minPerGuideline() {
  return Number(state.context?.rules?.minPerGuideline ?? 0);
}

function maxPerGuideline() {
  return Number(state.context?.rules?.maxPerGuideline ?? 5);
}

function usedVotesTotal() {
  return Object.values(state.userVotes).reduce((sum, value) => sum + Number(value || 0), 0);
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

function normalizeLineSide(value) {
  const side = String(value || 'auto').trim().toLowerCase();
  return MAP_LINE_SIDES.has(side) ? side : 'auto';
}

function estimateGuidelineNodeHeight(totalScore) {
  const score = Math.max(0, Number(totalScore || 0));
  const voteRows = Math.max(1, Math.ceil(score / MAP_VOTE_SQUARES_PER_ROW));
  return 104 + voteRows * 14;
}

function resolveAutoSide(fromNode, toNode) {
  const fromCenterX = fromNode.x + fromNode.w / 2;
  const fromCenterY = fromNode.y + fromNode.h / 2;
  const toCenterX = toNode.x + toNode.w / 2;
  const toCenterY = toNode.y + toNode.h / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
}

function oppositeSide(side) {
  if (side === 'left') return 'right';
  if (side === 'right') return 'left';
  if (side === 'top') return 'bottom';
  return 'top';
}

function anchorForSide(node, side) {
  if (side === 'left') return { x: node.x, y: node.y + node.h / 2 };
  if (side === 'right') return { x: node.x + node.w, y: node.y + node.h / 2 };
  if (side === 'top') return { x: node.x + node.w / 2, y: node.y };
  return { x: node.x + node.w / 2, y: node.y + node.h };
}

function controlPointForSide(point, side, offset = 86) {
  if (side === 'left') return { x: point.x - offset, y: point.y };
  if (side === 'right') return { x: point.x + offset, y: point.y };
  if (side === 'top') return { x: point.x, y: point.y - offset };
  return { x: point.x, y: point.y + offset };
}

function edgePath(fromNode, toNode, preferredSide) {
  const sourceSide = normalizeLineSide(preferredSide) === 'auto'
    ? resolveAutoSide(fromNode, toNode)
    : normalizeLineSide(preferredSide);
  const targetSide = oppositeSide(sourceSide);
  const from = anchorForSide(fromNode, sourceSide);
  const to = anchorForSide(toNode, targetSide);
  const c1 = controlPointForSide(from, sourceSide);
  const c2 = controlPointForSide(to, targetSide);
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
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
    'vote budget exceeded': 'Viršytas balsų biudžetas.',
    forbidden: 'Veiksmas neleidžiamas.',
    'membership inactive': 'Narystė neaktyvi.',
    'invalid credentials': 'Neteisingi prisijungimo duomenys.',
    'invite not found': 'Kvietimas nerastas.',
    'invite expired': 'Kvietimas nebegalioja.',
    'invite revoked': 'Kvietimas atšauktas.',
    'invite already used': 'Kvietimas jau panaudotas.',
    'guidelineId and score(0..5) required': 'Balsas turi būti tarp 0 ir 5.',
    'layout payload required': 'Nepateikti žemėlapio išdėstymo duomenys.',
    'guideline not in cycle': 'Gairė nepriklauso šiam ciklui.',
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
  const [summaryPayload, guidelinesPayload] = await Promise.all([
    api(`${base}/summary`, { auth: false }),
    api(`${base}/guidelines`, { auth: false })
  ]);

  state.institution = guidelinesPayload.institution || summaryPayload.institution || null;
  state.cycle = guidelinesPayload.cycle || summaryPayload.cycle || null;
  state.summary = summaryPayload.summary || null;
  state.guidelines = Array.isArray(guidelinesPayload.guidelines) ? guidelinesPayload.guidelines : [];
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
  const payload = await api('/api/v1/public/strategy-map', { auth: false });
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
      (votesPayload.votes || []).forEach((vote) => {
        nextVotes[vote.guidelineId] = Number(vote.score || 0);
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
      state.userVotes = {};
      return;
    }

    await loadPublicData();
    if (state.token) {
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
    ? ['#2b8a7e', '#1f6e64', '#d86b4b', '#f0b873']
    : ['#d86b4b', '#bf4f2f', '#2b8a7e', '#f0b873'];

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
  state.activeView = nextView;
  syncRouteState();
  render();
}

function renderSteps() {
  elements.steps.innerHTML = '';

  const canOpenAdmin = canOpenAdminView();
  const items = [
    { id: 'guidelines', icon: '◍', title: 'Gairės', hint: 'Aptarimas, balsavimas, komentarai', locked: false },
    { id: 'admin', icon: '⚙', title: 'Admin', hint: 'Kvietimai, ciklas, rezultatai', locked: !canOpenAdmin },
    { id: 'map', icon: '⌗', title: 'Strategijų žemėlapis', hint: 'Ryšiai ir gairių visuma', locked: false },
    { id: 'about', icon: 'ℹ', title: 'Apie mus', hint: 'Iniciatyvos aprašymas', locked: false }
  ];

  const visibleItems = isEmbeddedContext()
    ? items.filter((item) => item.id !== 'admin')
    : items;

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
      <p>${escapeHtml(item.hint)}</p>
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
  if (guide) guide.classList.toggle('collapsed', state.introCollapsed);
  if (toggleIntroBtn) {
    toggleIntroBtn.textContent = state.introCollapsed ? 'Rodyti naudojimosi gidą' : 'Slėpti naudojimosi gidą';
    toggleIntroBtn.setAttribute('aria-expanded', state.introCollapsed ? 'false' : 'true');
  }
}

function renderIntroDeck() {
  if (!elements.introDeck) return;

  const existingGuide = elements.introDeck.querySelector('.intro-guide');
  if (!existingGuide) {
    const helpCards = introSlides.map((slide, idx) => `
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

    elements.introDeck.innerHTML = `
      <div class="intro-guide">
        <div class="intro-guide-header">
          <div>
            <p class="kicker">Kaip naudotis</p>
            <h3>Naudojimosi gidas</h3>
          </div>
          <button id="toggleIntroBtn" class="btn btn-ghost intro-toggle-btn" type="button" aria-expanded="true"></button>
        </div>
        <div class="intro-guide-body">
          <div class="guide-grid">
            ${helpCards}
          </div>
        </div>
      </div>
    `;

    const toggleIntroBtn = elements.introDeck.querySelector('#toggleIntroBtn');
    if (toggleIntroBtn) {
      toggleIntroBtn.addEventListener('click', () => {
        state.introCollapsed = !state.introCollapsed;
        persistIntroCollapsed();
        applyIntroGuideState();
      });
    }
  }

  applyIntroGuideState();
}

function applyMapTransform(viewport, world) {
  const { x, y, scale } = state.mapTransform;
  world.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  const gridSize = 48 * scale;
  viewport.style.setProperty('--grid-size', `${Math.max(18, gridSize)}px`);
  viewport.style.setProperty('--grid-x', `${x % gridSize}px`);
  viewport.style.setProperty('--grid-y', `${y % gridSize}px`);
}

function fitMapToCurrentNodes(viewport, world) {
  const nodes = Array.from(world.querySelectorAll('.strategy-map-node[data-node-id]')).map((node) => ({
    x: Number(node.dataset.x || 0),
    y: Number(node.dataset.y || 0),
    w: Number(node.dataset.w || node.offsetWidth || 0),
    h: Number(node.dataset.h || node.offsetHeight || 0)
  }));
  if (!nodes.length) {
    state.mapTransform = { x: 120, y: 80, scale: 1 };
    applyMapTransform(viewport, world);
    return;
  }

  const minX = nodes.reduce((acc, node) => Math.min(acc, node.x), Infinity);
  const minY = nodes.reduce((acc, node) => Math.min(acc, node.y), Infinity);
  const maxX = nodes.reduce((acc, node) => Math.max(acc, node.x + node.w), -Infinity);
  const maxY = nodes.reduce((acc, node) => Math.max(acc, node.y + node.h), -Infinity);

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const pad = 72;
  const viewportW = Math.max(1, viewport.clientWidth);
  const viewportH = Math.max(1, viewport.clientHeight);
  const scale = clamp(
    Math.min((viewportW - pad) / width, (viewportH - pad) / height),
    0.45,
    1.8
  );

  state.mapTransform = {
    scale,
    x: (viewportW - width * scale) / 2 - minX * scale,
    y: (viewportH - height * scale) / 2 - minY * scale
  };
  applyMapTransform(viewport, world);
}

function layoutStrategyMap() {
  const institutions = Array.isArray(state.mapData?.institutions) ? state.mapData.institutions : [];
  const selectedSlug = normalizeSlug(state.institutionSlug);
  if (!selectedSlug) return { nodes: [], edges: [], width: 1200, height: 820, institution: null };

  const institution = institutions.find((item) => normalizeSlug(item.slug) === selectedSlug);
  if (!institution) return { nodes: [], edges: [], width: 1200, height: 820, institution: null };

  const toNumberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const nodes = [];
  const edges = [];
  const baseX = 140;
  const institutionNodeId = `inst-${institution.id}`;
  const institutionX = toNumberOrNull(institution.cycle?.mapX) ?? baseX;
  const institutionY = toNumberOrNull(institution.cycle?.mapY) ?? 48;
  nodes.push({
    id: institutionNodeId,
    kind: 'institution',
    entityId: institution.id,
    cycleId: institution.cycle?.id || null,
    x: institutionX,
    y: institutionY,
    w: 390,
    h: 220,
    institution
  });

  const guidelines = Array.isArray(institution.guidelines) ? institution.guidelines : [];
  if (!guidelines.length) {
    return { nodes, edges, width: 1600, height: 900, institution };
  }

  const guidelineById = Object.fromEntries(guidelines.map((g) => [g.id, g]));
  const childrenByParent = {};
  guidelines.forEach((guideline) => {
    const parentId = guideline.parentGuidelineId;
    if (!parentId || !guidelineById[parentId]) return;
    if (!childrenByParent[parentId]) childrenByParent[parentId] = [];
    childrenByParent[parentId].push(guideline);
  });

  const roots = guidelines.filter((guideline) => {
    const parentId = guideline.parentGuidelineId;
    return guideline.relationType !== 'child' || !parentId || !guidelineById[parentId];
  });

  const visited = new Set();
  let nextY = institutionY + 170;
  const placeNodeTree = (guideline, depth, parentNodeId) => {
    if (visited.has(guideline.id)) return;
    visited.add(guideline.id);

    const nodeId = `guide-${guideline.id}`;
    const defaultX = institutionX + 46 + depth * 250;
    const defaultY = nextY;
    nextY += 100;

    const nodeX = toNumberOrNull(guideline.mapX) ?? defaultX;
    const nodeY = toNumberOrNull(guideline.mapY) ?? defaultY;
    nodes.push({
      id: nodeId,
      kind: 'guideline',
      entityId: guideline.id,
      cycleId: institution.cycle?.id || null,
      x: nodeX,
      y: nodeY,
      w: 220,
      h: estimateGuidelineNodeHeight(guideline.totalScore),
      institution,
      guideline
    });

    if (parentNodeId) {
      edges.push({ from: parentNodeId, to: nodeId, type: 'child' });
    } else {
      edges.push({
        from: institutionNodeId,
        to: nodeId,
        type: guideline.relationType === 'orphan' ? 'orphan' : 'root'
      });
    }

    const children = childrenByParent[guideline.id] || [];
    children.forEach((child) => placeNodeTree(child, depth + 1, nodeId));
  };

  roots.forEach((root) => placeNodeTree(root, 0, null));
  guidelines.forEach((guideline) => {
    if (!visited.has(guideline.id)) placeNodeTree(guideline, 0, null);
  });

  const minLeft = nodes.reduce((acc, node) => Math.min(acc, node.x), Infinity);
  const minTop = nodes.reduce((acc, node) => Math.min(acc, node.y), Infinity);
  const maxRight = nodes.reduce((acc, node) => Math.max(acc, node.x + node.w), -Infinity);
  const maxBottom = nodes.reduce((acc, node) => Math.max(acc, node.y + node.h), -Infinity);

  const pad = 320;
  const shiftX = Number.isFinite(minLeft) ? pad - minLeft : 0;
  const shiftY = Number.isFinite(minTop) ? pad - minTop : 0;
  nodes.forEach((node) => {
    node.x += shiftX;
    node.y += shiftY;
  });

  const rawWidth = Number.isFinite(maxRight) && Number.isFinite(minLeft)
    ? (maxRight - minLeft) + pad * 2
    : 1800;
  const rawHeight = Number.isFinite(maxBottom) && Number.isFinite(minTop)
    ? (maxBottom - minTop) + pad * 2
    : 920;
  const width = Math.max(1800, rawWidth);
  const height = Math.max(920, rawHeight);
  return { nodes, edges, width, height, institution };
}

function relationLabel(relationType) {
  const relation = String(relationType || 'orphan').toLowerCase();
  if (relation === 'parent') return 'tėvinė';
  if (relation === 'child') return 'vaikinė';
  return 'našlaitė';
}

function syncMapNodeBounds(world) {
  world.querySelectorAll('.strategy-map-node[data-node-id]').forEach((node) => {
    const width = Math.round(node.offsetWidth);
    const height = Math.round(node.offsetHeight);
    if (Number.isFinite(width) && width > 0) node.dataset.w = String(width);
    if (Number.isFinite(height) && height > 0) node.dataset.h = String(height);
  });
}

function refreshMapEdges(world) {
  const nodeElements = Array.from(world.querySelectorAll('.strategy-map-node[data-node-id]'));
  const nodeById = new Map();
  nodeElements.forEach((node) => {
    nodeById.set(node.dataset.nodeId, {
      x: Number(node.dataset.x),
      y: Number(node.dataset.y),
      w: Number(node.dataset.w),
      h: Number(node.dataset.h)
    });
  });

  world.querySelectorAll('.strategy-map-edge').forEach((path) => {
    const fromNode = nodeById.get(path.dataset.from);
    const toNode = nodeById.get(path.dataset.to);
    if (!fromNode || !toNode) return;

    const lineSide = path.dataset.lineSide || 'auto';
    path.setAttribute('d', edgePath(fromNode, toNode, lineSide));
  });
}

async function persistMapNodePosition(nodeElement) {
  if (!nodeElement) return;
  const cycleId = String(nodeElement.dataset.cycleId || '').trim();
  if (!cycleId) return;

  const kind = String(nodeElement.dataset.kind || '').trim();
  const entityId = String(nodeElement.dataset.entityId || '').trim();
  const x = Number(nodeElement.dataset.x);
  const y = Number(nodeElement.dataset.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  const selectedSlug = normalizeSlug(state.institutionSlug);
  const institutions = Array.isArray(state.mapData?.institutions) ? state.mapData.institutions : [];
  const institution = institutions.find((item) => normalizeSlug(item.slug) === selectedSlug);
  if (!institution) return;

  if (kind === 'institution') {
    if (institution.cycle) {
      institution.cycle.mapX = Math.round(x);
      institution.cycle.mapY = Math.round(y);
    }
    await api(`/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/map-layout`, {
      method: 'PUT',
      body: {
        institutionPosition: { x: Math.round(x), y: Math.round(y) }
      }
    });
    return;
  }

  if (kind === 'guideline' && entityId) {
    const guideline = Array.isArray(institution.guidelines)
      ? institution.guidelines.find((item) => item.id === entityId)
      : null;
    if (guideline) {
      guideline.mapX = Math.round(x);
      guideline.mapY = Math.round(y);
    }
    await api(`/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/map-layout`, {
      method: 'PUT',
      body: {
        guidelinePositions: [{ guidelineId: entityId, x: Math.round(x), y: Math.round(y) }]
      }
    });
  }
}

function bindMapInteractions(viewport, world, { editable }) {
  let dragActive = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let originX = 0;
  let originY = 0;
  let draggedNode = null;
  let nodeOriginX = 0;
  let nodeOriginY = 0;

  const onPointerMove = (event) => {
    if (!dragActive) return;
    if (draggedNode) {
      const dx = (event.clientX - dragStartX) / state.mapTransform.scale;
      const dy = (event.clientY - dragStartY) / state.mapTransform.scale;
      const nextX = Math.round(nodeOriginX + dx);
      const nextY = Math.round(nodeOriginY + dy);
      draggedNode.dataset.x = String(nextX);
      draggedNode.dataset.y = String(nextY);
      draggedNode.style.left = `${nextX}px`;
      draggedNode.style.top = `${nextY}px`;
      refreshMapEdges(world);
      return;
    }

    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    state.mapTransform.x = originX + dx;
    state.mapTransform.y = originY + dy;
    applyMapTransform(viewport, world);
  };

  const endDrag = () => {
    const droppedNode = draggedNode;
    dragActive = false;
    draggedNode = null;
    viewport.classList.remove('dragging');
    viewport.classList.remove('node-dragging');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);

    if (!droppedNode || !editable) return;
    persistMapNodePosition(droppedNode).catch((error) => {
      state.notice = toUserMessage(error);
      render();
    });
  };

  viewport.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (event.button !== 0) return;

    if (editable && target instanceof HTMLElement) {
      const node = target.closest('.strategy-map-node');
      if (node instanceof HTMLElement && node.dataset.draggable === 'true') {
        event.preventDefault();
        dragActive = true;
        draggedNode = node;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        nodeOriginX = Number(node.dataset.x || 0);
        nodeOriginY = Number(node.dataset.y || 0);
        viewport.classList.add('node-dragging');
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', endDrag);
        return;
      }
    }

    if (target instanceof HTMLElement && target.closest('.strategy-map-node')) return;

    dragActive = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    originX = state.mapTransform.x;
    originY = state.mapTransform.y;
    viewport.classList.add('dragging');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
  });

  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    const nextScale = clamp(
      state.mapTransform.scale + (event.deltaY < 0 ? 0.08 : -0.08),
      0.45,
      1.8
    );
    if (nextScale === state.mapTransform.scale) return;

    const rect = viewport.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const ratio = nextScale / state.mapTransform.scale;
    state.mapTransform.x = anchorX - (anchorX - state.mapTransform.x) * ratio;
    state.mapTransform.y = anchorY - (anchorY - state.mapTransform.y) * ratio;
    state.mapTransform.scale = nextScale;
    applyMapTransform(viewport, world);
  }, { passive: false });
}

function renderMapView() {
  if (state.loading && !state.mapData) {
    elements.stepView.innerHTML = '<div class="card"><strong>Kraunamas strategijų žemėlapis...</strong></div>';
    return;
  }

  if (state.mapError) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Nepavyko įkelti strategijų žemėlapio</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.mapError)}</p>
        <button id="retryMapLoadBtn" class="btn btn-primary" style="margin-top: 12px;">Bandyti dar kartą</button>
      </div>
    `;
    const retryBtn = elements.stepView.querySelector('#retryMapLoadBtn');
    if (retryBtn) retryBtn.addEventListener('click', bootstrap);
    return;
  }

  if (!Array.isArray(state.mapData?.institutions) || !state.mapData.institutions.length) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Strategijų žemėlapis dar tuščias</strong>
        <p class="prompt" style="margin: 8px 0 0;">Kai institucijos patvirtins ciklus (Final/Archived), jų gairės atsiras šiame žemėlapyje.</p>
      </div>
    `;
    return;
  }

  const graph = layoutStrategyMap();
  if (!graph.institution) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Pasirinkite instituciją</strong>
        <p class="prompt" style="margin: 8px 0 0;">Žemėlapyje rodoma tik viršuje pasirinktos institucijos strategija.</p>
      </div>
    `;
    return;
  }

  const editable = canEditMapLayout()
    && normalizeSlug(graph.institution.slug) === normalizeSlug(state.institutionSlug)
    && Boolean(graph.institution.cycle?.id);
  const nodeById = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  const edgeMarkup = graph.edges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const lineSide = fromNode.kind === 'guideline'
      ? normalizeLineSide(fromNode.guideline?.lineSide)
      : 'auto';
    return `<path class="strategy-map-edge edge-${escapeHtml(edge.type)}" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="${escapeHtml(lineSide)}" d="${edgePath(fromNode, toNode, lineSide)}"></path>`;
  }).join('');

  const nodeMarkup = graph.nodes.map((node) => {
    if (node.kind === 'institution') {
      const cycleState = node.institution.cycle?.state || '-';
      return `
        <article class="strategy-map-node institution-node ${node.institution.slug === state.institutionSlug ? 'active' : ''}"
                 data-node-id="${escapeHtml(node.id)}"
                 data-kind="institution"
                 data-entity-id="${escapeHtml(node.entityId)}"
                 data-cycle-id="${escapeHtml(node.cycleId || '')}"
                 data-x="${node.x}"
                 data-y="${node.y}"
                 data-w="${node.w}"
                 data-h="${node.h}"
                 data-draggable="${editable ? 'true' : 'false'}"
                 style="left:${node.x}px;top:${node.y}px;width:${node.w}px;height:${node.h}px;">
          <strong>${escapeHtml(node.institution.name)}</strong>
          <small class="institution-subtitle">Skaitmenizacijos strategija</small>
          <span class="tag">${escapeHtml(cycleState.toUpperCase())}</span>
          <small class="institution-cycle-label">Strategijos ciklo būsena</small>
        </article>
      `;
    }

    const relation = String(node.guideline.relationType || 'orphan');
    const relationText = relationLabel(relation);
    const score = Number(node.guideline.totalScore || 0);
    const voters = Math.max(0, Number(node.guideline.voterCount || 0));
    const scoreForSquares = Math.max(0, Math.round(score));
    const voteSquares = scoreForSquares
      ? Array.from({ length: scoreForSquares }, () => '<span class="map-vote-square" aria-hidden="true"></span>').join('')
      : '<span class="map-vote-empty">Dar nebalsuota</span>';

    return `
      <article class="strategy-map-node guideline-node relation-${escapeHtml(relation)} status-${escapeHtml(String(node.guideline.status || 'active').toLowerCase())}"
               data-node-id="${escapeHtml(node.id)}"
               data-kind="guideline"
               data-entity-id="${escapeHtml(node.entityId)}"
               data-cycle-id="${escapeHtml(node.cycleId || '')}"
               data-x="${node.x}"
               data-y="${node.y}"
               data-w="${node.w}"
               data-h="${node.h}"
               data-draggable="${editable ? 'true' : 'false'}"
               style="left:${node.x}px;top:${node.y}px;width:${node.w}px;min-height:${node.h}px;">
        <h4>${escapeHtml(node.guideline.title)}</h4>
        <small>${escapeHtml(node.institution.slug)} - ${escapeHtml(relationText)}</small>
        <div class="map-vote-row">
          <span class="map-vote-chip" title="Bendras balas">
            <span class="map-vote-icon" aria-hidden="true">◉</span>
            <strong>${score}</strong>
          </span>
          <span class="map-vote-chip" title="Balsuotojai">
            <span class="map-vote-icon" aria-hidden="true">◌</span>
            <strong>${voters}</strong>
          </span>
        </div>
        <div class="map-vote-squares">${voteSquares}</div>
      </article>
    `;
  }).join('');

  elements.stepView.innerHTML = `
    <div class="step-header">
      <h2>Strategijų žemėlapis</h2>
      <div class="header-stack step-header-actions">
        <button id="mapResetBtn" class="btn btn-ghost">Atstatyti vaizdą</button>
        <span class="tag">Institucija: ${escapeHtml(graph.institution.name || graph.institution.slug)}</span>
        ${editable ? '<span class="tag tag-main">Admin: galite tempti korteles</span>' : ''}
      </div>
    </div>
    <p class="prompt">Peržiūrėkite pasirinktos institucijos patvirtintą strategiją: tėvinės/vaikinės gairės ir jų ryšiai. Temkite foną pele ir artinkite pelės ratuku.</p>
    <section id="strategyMapViewport" class="strategy-map-viewport">
      <div id="strategyMapWorld" class="strategy-map-world" style="width:${graph.width}px;height:${graph.height}px;">
        <svg class="strategy-map-lines" viewBox="0 0 ${graph.width} ${graph.height}" preserveAspectRatio="none">
          ${edgeMarkup}
        </svg>
        ${nodeMarkup}
      </div>
    </section>
  `;

  const viewport = elements.stepView.querySelector('#strategyMapViewport');
  const world = elements.stepView.querySelector('#strategyMapWorld');
  const resetBtn = elements.stepView.querySelector('#mapResetBtn');
  if (viewport && world) {
    syncMapNodeBounds(world);
    refreshMapEdges(world);
    applyMapTransform(viewport, world);
    bindMapInteractions(viewport, world, { editable });
  }
  if (resetBtn && viewport && world) {
    resetBtn.addEventListener('click', () => {
      fitMapToCurrentNodes(viewport, world);
    });
  }
}

function renderAboutView() {
  elements.stepView.innerHTML = `
    <section class="about-window">
      <div class="step-header">
        <h2>Apie mus</h2>
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
  const allowed = canOpenAdminView();

  if (isEmbeddedContext()) {
    const src = `admin.html?institution=${encodeURIComponent(state.institutionSlug)}&frame=admin`;
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Admin langas negali būti įkeltas į kitą Admin langą</strong>
        <p class="prompt" style="margin: 8px 0 0;">
          Atidarykite administravimo puslapį atskirai, kad išvengtume admin > admin > admin ciklo.
        </p>
        <div class="header-stack" style="margin-top: 12px;">
          <a class="btn btn-primary" href="${src}" target="_top" rel="noopener">Atidaryti administravimą</a>
          <button id="backToGuidelinesFromNestedAdmin" class="btn btn-ghost" type="button">Grįžti į gaires</button>
        </div>
      </div>
    `;
    const backBtn = elements.stepView.querySelector('#backToGuidelinesFromNestedAdmin');
    if (backBtn) backBtn.addEventListener('click', () => setActiveView('guidelines'));
    return;
  }

  if (!isAuthenticated()) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Administravimui reikia prisijungti</strong>
        <p class="prompt" style="margin: 8px 0 0;">Prisijunkite su institucijos administratoriaus paskyra.</p>
        <button id="openAuthFromAdmin" class="btn btn-primary" style="margin-top: 12px;">Prisijungti</button>
      </div>
    `;
    const openAuthBtn = elements.stepView.querySelector('#openAuthFromAdmin');
    if (openAuthBtn) openAuthBtn.addEventListener('click', () => showAuthModal('login'));
    return;
  }

  if (!allowed) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Administravimas nepasiekiamas</strong>
        <p class="prompt" style="margin: 8px 0 0;">
          Administravimo vaizdas prieinamas tik prisijungus kaip pasirinktos institucijos administratorius.
        </p>
      </div>
    `;
    return;
  }

  const src = `admin.html?institution=${encodeURIComponent(state.institutionSlug)}&frame=admin`;
  elements.stepView.innerHTML = `
    <section class="admin-inline-shell">
      <div class="step-header">
        <h2>Admin</h2>
      </div>
      <iframe
        id="adminInlineFrame"
        class="admin-inline-frame"
        src="${src}"
        title="Administravimo langas"
        scrolling="no"
      ></iframe>
    </section>
  `;
  const frame = document.getElementById('adminInlineFrame');
  if (frame) {
    frame.addEventListener('load', () => {
      applyAdminInlineFrameHeight(frame, frame.offsetHeight || 720);
    });
  }
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
  return new Intl.DateTimeFormat('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function renderCommentItem(comment) {
  const author = String(comment?.authorName || comment?.authorEmail || 'Nežinomas autorius').trim();
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
    <article class="card ${votingDisabled ? 'guideline-disabled' : ''}">
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
function renderStepView() {
  if (state.activeView === 'about') {
    renderAboutView();
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

    <p class="prompt">${escapeHtml(steps[0].prompt)}</p>
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
        <p class="prompt" style="margin: 8px 0 0;">Balsuoti ir komentuoti galima tik kai ciklo būsena yra Open arba Review.</p>
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
        await Promise.all([refreshGuidelines(), refreshSummary()]);
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
        await Promise.all([refreshGuidelines(), refreshSummary()]);
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
  await Promise.all([refreshGuidelines(), refreshSummary()]);
  return true;
}

function renderUserBar() {
  const container = document.getElementById('userBar');
  if (!container) return;
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
  let floating = document.getElementById('voteFloating');
  if (!floating) {
    floating = document.createElement('div');
    floating.id = 'voteFloating';
    floating.className = 'vote-floating';
    document.body.appendChild(floating);
  }

  if (!isLoggedIn() || state.activeView !== 'guidelines') {
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
    guidelines: state.guidelines
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
  window.addEventListener('message', (event) => {
    const data = event?.data;
    if (!data || data.type !== ADMIN_FRAME_HEIGHT_EVENT) return;
    const frame = document.getElementById('adminInlineFrame');
    if (!frame || !frame.contentWindow) return;
    if (event.source !== frame.contentWindow) return;
    applyAdminInlineFrameHeight(frame, data.height);
  });
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
}
