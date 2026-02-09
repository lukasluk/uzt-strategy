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
    title: '1. Kas tai per sistema',
    body: 'Tai strategijos gairių vertinimo ir komentavimo įrankis. Kiekviena gairė vertinama atskirai, o komentarai kaupiami vienoje vietoje.'
  },
  {
    title: '2. Kaip vyksta balsavimas',
    body: 'Kiekvienas narys turi 10 balsų ir gali paskirstyti juos tarp gairių (0-5 vienai gairei). Balsavimas atidaromas pagal ciklo būseną.'
  },
  {
    title: '3. Kaip uždaromas etapas',
    body: 'Balsuoti galima iki ciklo būsenos Final. Viešai rodomi tik agreguoti balsų rezultatai ir vieši komentarai.'
  },
  {
    title: '4. Kaip veikia ciklai',
    body: 'Strategija valdoma ciklais: Draft, Open, Review, Final ir Archived. Redagavimas ir balsavimas galimi Open/Review būsenose.'
  }
];

const AUTH_STORAGE_KEY = 'uzt-strategy-v1-auth';
const DEFAULT_INSTITUTION_SLUG = '';
const WRITABLE_CYCLE_STATES = new Set(['open', 'review']);

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
  introCollapsed: false,
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
  token: null,
  user: null,
  role: null,
  context: null,
  userVotes: {}
};

hydrateAuthFromStorage();
bindGlobal();
bootstrap();

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

function normalizeSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (!slug) return '';
  return /^[a-z0-9-]+$/.test(slug) ? slug : '';
}

function hydrateAuthFromStorage() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.slug !== state.institutionSlug || !parsed.token) return;
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
      slug: state.institutionSlug,
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
  state.context = null;
  state.userVotes = {};
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function setSession(payload) {
  state.token = payload.token || null;
  state.user = payload.user || null;
  state.role = payload.role || null;
  persistAuthToStorage();
}

function isLoggedIn() {
  return Boolean(state.token && state.context);
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

function toUserMessage(error) {
  const raw = String(error?.message || error || '').trim();
  const map = {
    unauthorized: 'Reikia prisijungti.',
    'invalid token': 'Sesija nebegalioja. Prisijunkite iš naujo.',
    'institution not found': `Institucija "${state.institutionSlug}" nerasta.`,
    'cycle not found': 'Aktyvus strategijos ciklas nerastas.',
    'cycle not writable': 'Ciklas nebeleidžia redaguoti (tik skaitymas).',
    'vote budget exceeded': 'Viršytas balsų biudžetas.',
    forbidden: 'Veiksmas neleidžiamas.',
    'membership inactive': 'Narystė neaktyvi.',
    'invalid credentials': 'Neteisingi prisijungimo duomenys.',
    'invite not found': 'Kvietimas nerastas.',
    'invite expired': 'Kvietimas nebegalioja.',
    'invite revoked': 'Kvietimas atšauktas.',
    'invite already used': 'Kvietimas jau panaudotas.',
    'guidelineId and score(0..5) required': 'Balsas turi būti tarp 0 ir 5.',
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

async function loadMemberContext() {
  const context = await api('/api/v1/me/context');
  if (!context?.institution?.slug) throw new Error('Nepavyko gauti naudotojo konteksto.');

  if (context.institution.slug !== state.institutionSlug) {
    clearSession();
    throw new Error(`Prisijungimas priklauso institucijai "${context.institution.slug}".`);
  }

  state.context = context;
  state.role = context.membership?.role || state.role || 'member';
  state.user = state.user || context.user || null;

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
}

async function bootstrap() {
  state.loading = true;
  state.error = '';
  render();

  try {
    await loadInstitutions();

    if (!state.institutionSlug) {
      clearSession();
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
        clearSession();
        throw error;
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

function renderInstitutionPicker() {
  if (!elements.institutionPicker) return;

  if (state.loading && !state.institutionsLoaded) {
    elements.institutionPicker.innerHTML = `
      <div class="institution-picker-card">
        <h3>Institucijų strategijos</h3>
        <p class="prompt">Kraunamas institucijų sąrašas...</p>
      </div>
    `;
    return;
  }

  if (!state.institutions.length) {
    elements.institutionPicker.innerHTML = `
      <div class="institution-picker-card">
        <h3>Institucijų strategijos</h3>
        <p class="prompt">Šiuo metu viešai paskelbtų institucijų dar nėra.</p>
      </div>
    `;
    return;
  }

  const cards = state.institutions.map((institution) => {
    const slug = normalizeSlug(institution.slug);
    const active = slug && slug === state.institutionSlug;
    const created = formatInstitutionDate(institution.created_at);
    const href = `index.html?institution=${encodeURIComponent(slug)}`;

    return `
      <a class="institution-card ${active ? 'active' : ''}" href="${href}">
        <div class="institution-card-header">
          <strong>${escapeHtml(institution.name || slug)}</strong>
          ${active ? '<span class="tag tag-main">Atidaryta</span>' : ''}
        </div>
        <div class="institution-card-meta">
          <span>Slug: ${escapeHtml(slug)}</span>
          ${created ? `<span>Sukurta: ${escapeHtml(created)}</span>` : ''}
        </div>
        <span class="institution-card-link">Peržiūrėti viešas gaires</span>
      </a>
    `;
  }).join('');

  elements.institutionPicker.innerHTML = `
    <div class="institution-picker-card">
      <div class="header-row">
        <h3>Institucijų strategijos</h3>
        <span class="tag">${state.institutions.length} institucijos</span>
      </div>
      <p class="prompt">Pasirinkite instituciją ir peržiūrėkite jos viešą gairių puslapį.</p>
      <div class="institution-grid">${cards}</div>
    </div>
  `;
}

function renderSteps() {
  elements.steps.innerHTML = '';
  steps.forEach((step) => {
    const pill = document.createElement('button');
    pill.className = 'step-pill' + (step.id === 'guidelines' ? ' active' : '');
    pill.innerHTML = `<h4>${escapeHtml(step.title)}</h4><p>${escapeHtml(step.hint)}</p>`;
    elements.steps.appendChild(pill);
  });

  if (state.institutionSlug) {
    const adminLink = document.createElement('a');
    adminLink.className = 'step-pill admin-pill';
    adminLink.href = `admin.html?institution=${encodeURIComponent(state.institutionSlug)}`;
    adminLink.innerHTML = '<h4>Admin</h4><p>Kvietimai, ciklas, rezultatai</p>';
    elements.steps.appendChild(adminLink);
  }

  const aboutCard = document.createElement('section');
  aboutCard.className = 'about-card';
  aboutCard.innerHTML = `
    <h4>Apie mus</h4>
    <p>Čia bus aprašymas, kas čia per iniciatyva.</p>
  `;
  elements.steps.appendChild(aboutCard);
}

function renderSlideIllustration(index) {
  if (index === 0) {
    return `
      <svg viewBox="0 0 360 160" class="slide-illus" aria-hidden="true">
        <rect x="18" y="16" width="324" height="126" rx="18" fill="#fff" stroke="#2a2722" stroke-width="3" stroke-dasharray="6 5"/>
        <circle cx="65" cy="56" r="16" fill="none" stroke="#2a2722" stroke-width="3"/>
        <circle cx="130" cy="56" r="16" fill="none" stroke="#2a2722" stroke-width="3"/>
        <circle cx="195" cy="56" r="16" fill="none" stroke="#2a2722" stroke-width="3"/>
        <path d="M81 56h33M146 56h33" stroke="#2a2722" stroke-width="3" stroke-linecap="round"/>
        <path d="M44 98h110M44 116h172M228 98h86" stroke="#2a2722" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `;
  }
  if (index === 1) {
    return `
      <svg viewBox="0 0 360 160" class="slide-illus" aria-hidden="true">
        <rect x="26" y="22" width="112" height="112" rx="16" fill="#fff" stroke="#2a2722" stroke-width="3"/>
        <rect x="152" y="22" width="182" height="46" rx="12" fill="none" stroke="#2a2722" stroke-width="3" stroke-dasharray="5 5"/>
        <rect x="152" y="88" width="182" height="46" rx="12" fill="none" stroke="#2a2722" stroke-width="3" stroke-dasharray="5 5"/>
        <text x="82" y="92" text-anchor="middle" font-size="34" font-family="monospace" fill="#2a2722">10</text>
        <path d="M124 78h24M138 64l10 14-10 14" stroke="#2a2722" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 360 160" class="slide-illus" aria-hidden="true">
      <rect x="20" y="18" width="130" height="124" rx="18" fill="none" stroke="#2a2722" stroke-width="3"/>
      <rect x="170" y="18" width="170" height="58" rx="14" fill="#fff" stroke="#2a2722" stroke-width="3"/>
      <rect x="170" y="84" width="170" height="58" rx="14" fill="#fff" stroke="#2a2722" stroke-width="3"/>
      <path d="M40 52h88M40 74h56M40 96h78" stroke="#2a2722" stroke-width="3" stroke-linecap="round"/>
      <circle cx="190" cy="47" r="7" fill="#2a2722"/>
      <circle cx="190" cy="113" r="7" fill="#2a2722"/>
      <path d="M207 47h104M207 113h104" stroke="#2a2722" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `;
}

function renderIntroDeck() {
  if (!elements.introDeck) return;
  const toggleLabel = state.introCollapsed ? 'Rodyti naudojimosi gidą' : 'Slėpti naudojimosi gidą';
  const helpCards = introSlides.map((slide, idx) => `
    <article class="guide-card">
      <span class="guide-index">${idx + 1}</span>
      <h4>${escapeHtml(slide.title)}</h4>
      <p>${escapeHtml(slide.body)}</p>
    </article>
  `).join('');

  elements.introDeck.innerHTML = `
    <div class="intro-guide ${state.introCollapsed ? 'collapsed' : ''}">
      <div class="intro-guide-header">
        <div>
          <p class="kicker">Kaip naudotis</p>
          <h3>Naudojimosi gidas</h3>
        </div>
        <button id="toggleIntroBtn" class="btn btn-ghost intro-toggle-btn" type="button">${toggleLabel}</button>
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
      renderIntroDeck();
    });
  }
}

function renderGuidelineCard(guideline, options) {
  const userScore = Number(state.userVotes[guideline.id] || 0);
  const comments = Array.isArray(guideline.comments) ? guideline.comments : [];
  const safeComments = comments.length
    ? comments.map((comment) => `<li>${escapeHtml(comment.body || '')}</li>`).join('')
    : '<li>Dar nėra komentarų.</li>';

  const budget = voteBudget();
  const usedWithoutCurrent = usedVotesTotal() - userScore;
  const maxAllowed = clamp(
    Math.min(maxPerGuideline(), budget - usedWithoutCurrent),
    minPerGuideline(),
    maxPerGuideline()
  );
  const canMinus = options.member && options.writable && !state.busy && userScore > minPerGuideline();
  const canPlus = options.member && options.writable && !state.busy && userScore < maxAllowed;

  return `
    <article class="card">
      <div class="card-title">
        <div>
          <div class="title-row">
            <h4>${escapeHtml(guideline.title)}</h4>
            <span class="tag">Balsuotojų: ${Number(guideline.voterCount || 0)}</span>
          </div>
          <p>${escapeHtml(guideline.description || 'Be paaiškinimo')}</p>
        </div>
        ${options.member ? `
          <div class="vote-panel">
            <span class="vote-label">Tavo balas</span>
            <div class="vote-controls">
              <button class="vote-btn" data-action="vote-minus" data-id="${escapeHtml(guideline.id)}" ${canMinus ? '' : 'disabled'}>-</button>
              <span class="vote-score">${userScore}</span>
              <button class="vote-btn" data-action="vote-plus" data-id="${escapeHtml(guideline.id)}" ${canPlus ? '' : 'disabled'}>+</button>
            </div>
            <div class="vote-total">Bendras balas: <strong>${Number(guideline.totalScore || 0)}</strong></div>
          </div>
        ` : `
          <div class="vote-panel">
            <span class="vote-label">Viešas režimas</span>
            <div class="vote-total"><strong>Bendras balas: ${Number(guideline.totalScore || 0)}</strong></div>
            <div class="vote-total">Rodomi tik agreguoti duomenys</div>
          </div>
        `}
      </div>
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
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Pasirinkite instituciją</strong>
        <p class="prompt" style="margin: 8px 0 0;">
          Viršuje matote institucijų sąrašą. Paspauskite instituciją, kad atvertumėte jos viešą gairių puslapį.
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

    <div class="card-list">
      ${state.guidelines.map((guideline) => renderGuidelineCard(guideline, { member, writable })).join('')}
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
    `) : `
      <div class="card" style="margin-top: 16px;">
        <strong>Prisijunkite, kad galėtumėte aktyviai dalyvauti</strong>
        <p class="prompt" style="margin: 8px 0 0;">Viešai matomi visi komentarai prie strategijos gairių. Prisijungus galima siūlyti gaires, komentuoti ir balsuoti.</p>
        <button id="openAuthFromStep" class="btn btn-primary" style="margin-top: 12px;">Prisijungti</button>
      </div>
    `}
  `;

  bindStepEvents();
}

function bindStepEvents() {
  const openAuthFromStep = elements.stepView.querySelector('#openAuthFromStep');
  const exportBtnInline = elements.stepView.querySelector('#exportBtnInline');
  const guidelineForm = elements.stepView.querySelector('#guidelineAddForm');
  const list = elements.stepView.querySelector('.card-list');

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
        await runBusy(async () => {
          await changeVote(guidelineId, delta);
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
  if (next === current) return;

  const response = await api(`/api/v1/guidelines/${encodeURIComponent(guidelineId)}/vote`, {
    method: 'PUT',
    body: { score: next }
  });
  state.userVotes[guidelineId] = Number(response.score || next);
  await Promise.all([refreshGuidelines(), refreshSummary()]);
}

function renderUserBar() {
  const container = document.getElementById('userBar');
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = `
      <div class="user-chip">
        <span>Viešas režimas</span>
        <span class="tag">Skaitymas</span>
      </div>
      <button id="openAuthBtn" class="btn btn-primary">Prisijungti</button>
    `;
    const openBtn = container.querySelector('#openAuthBtn');
    if (openBtn) openBtn.addEventListener('click', () => showAuthModal('login'));
    return;
  }

  const displayName = state.user?.displayName || state.user?.email || 'Prisijungęs vartotojas';
  const roleLabel = state.role === 'institution_admin' ? 'Administravimas' : 'Narys';
  container.innerHTML = `
    <div class="user-chip">
      <span>${escapeHtml(displayName)}</span>
      <span class="tag">${escapeHtml(roleLabel)}</span>
    </div>
    ${state.role === 'institution_admin'
      ? `<a href="admin.html?institution=${encodeURIComponent(state.institutionSlug)}" class="btn btn-ghost">Admin</a>`
      : ''}
    <button id="logoutBtn" class="btn btn-ghost">Atsijungti</button>
  `;

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

  if (!isLoggedIn()) {
    floating.hidden = true;
    return;
  }

  const budget = voteBudget();
  const used = usedVotesTotal();
  const remaining = Math.max(0, budget - used);
  const locked = !cycleIsWritable();

  floating.hidden = false;
  floating.innerHTML = `
    <div class="vote-floating-inner">
      <div class="vote-floating-title">Balsų biudžetas</div>
      <div class="vote-floating-count">${remaining} / ${budget}</div>
      <div class="vote-total">${locked ? 'Ciklas užrakintas' : 'Balsavimas aktyvus'}</div>
    </div>
  `;
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
  const hasInstitution = Boolean(state.institutionSlug);

  renderSteps();
  renderIntroDeck();
  renderInstitutionPicker();
  renderStepView();
  renderUserBar();
  renderVoteFloating();

  if (elements.mainLayout) {
    elements.mainLayout.hidden = !hasInstitution;
  }
  if (elements.userBar) {
    elements.userBar.hidden = !hasInstitution;
  }
}

