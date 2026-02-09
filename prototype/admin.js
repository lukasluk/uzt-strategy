const AUTH_STORAGE_KEY = 'uzt-strategy-v1-auth';
const DEFAULT_INSTITUTION_SLUG = 'uzt';
const root = document.getElementById('adminRoot');

const state = {
  institutionSlug: resolveInstitutionSlug(),
  loading: false,
  busy: false,
  error: '',
  notice: '',
  token: null,
  user: null,
  role: null,
  context: null,
  cycle: null,
  participants: [],
  guidelines: [],
  inviteToken: ''
};

hydrateAuthFromStorage();
syncTopbarBackLink();
bootstrap();

function syncTopbarBackLink() {
  const backLink = document.querySelector('.top-actions a[href="index.html"]');
  if (!backLink) return;
  backLink.setAttribute('href', `index.html?institution=${encodeURIComponent(state.institutionSlug)}`);
}

function resolveInstitutionSlug() {
  const params = new URLSearchParams(window.location.search);
  const querySlug = normalizeSlug(params.get('institution'));
  if (querySlug) return querySlug;

  const parts = window.location.pathname.split('/').filter(Boolean);
  if (!parts.length) return DEFAULT_INSTITUTION_SLUG;

  const last = parts[parts.length - 1];
  if (last === 'admin.html') {
    return normalizeSlug(parts[parts.length - 2]) || DEFAULT_INSTITUTION_SLUG;
  }
  if (last === 'index.html') {
    return normalizeSlug(parts[parts.length - 2]) || DEFAULT_INSTITUTION_SLUG;
  }
  return normalizeSlug(last) || DEFAULT_INSTITUTION_SLUG;
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
  state.cycle = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function setSession(payload) {
  state.token = payload.token || null;
  state.user = payload.user || null;
  state.role = payload.role || null;
  persistAuthToStorage();
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toUserMessage(error) {
  const raw = String(error?.message || error || '').trim();
  const map = {
    unauthorized: 'Reikia prisijungti kaip institucijos administratorius.',
    'invalid token': 'Sesija nebegalioja. Prisijunkite is naujo.',
    'institution not found': `Institucija "${state.institutionSlug}" nerasta.`,
    'cycle not found': 'Aktyvus ciklas nerastas.',
    forbidden: 'Veiksmas neleidziamas.',
    'admin role required': 'Reikalingos administratoriaus teises.',
    'cross-institution forbidden': 'Prieiga prie kitos institucijos duomenu neleidziama.',
    'invalid credentials': 'Neteisingi prisijungimo duomenys.',
    'email required': 'Nurodykite el. pasta.'
  };
  return map[raw] || raw || 'Nepavyko ivykdyti uzklausos.';
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

async function loadContext() {
  const context = await api('/api/v1/me/context');
  if (!context?.institution?.slug) throw new Error('Nepavyko gauti konteksto.');
  if (context.institution.slug !== state.institutionSlug) {
    clearSession();
    throw new Error(`Prisijungimas priklauso institucijai "${context.institution.slug}".`);
  }
  if (context.membership?.role !== 'institution_admin') {
    throw new Error('admin role required');
  }

  state.context = context;
  state.cycle = context.cycle || null;
  state.user = state.user || context.user || null;
  state.role = context.membership?.role || 'member';
}

async function loadAdminData() {
  if (!state.cycle?.id) {
    state.participants = [];
    state.guidelines = [];
    return;
  }

  const [participantsPayload, guidelinesPayload] = await Promise.all([
    api(`/api/v1/admin/cycles/${encodeURIComponent(state.cycle.id)}/participants`),
    api(`/api/v1/admin/cycles/${encodeURIComponent(state.cycle.id)}/guidelines`)
  ]);
  state.participants = Array.isArray(participantsPayload.participants) ? participantsPayload.participants : [];
  state.guidelines = Array.isArray(guidelinesPayload.guidelines) ? guidelinesPayload.guidelines : [];
}

async function bootstrap() {
  if (!state.token) {
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();

  try {
    await loadContext();
    await loadAdminData();
  } catch (error) {
    state.error = toUserMessage(error);
    if (String(error?.message || '') === 'invalid token' || String(error?.message || '') === 'unauthorized') {
      clearSession();
    }
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

function renderLogin() {
  root.innerHTML = `
    <section class="card" style="max-width: 560px; margin: 30px auto;">
      <h2 style="font-family: 'Fraunces', serif;">Admin prisijungimas</h2>
      <p class="prompt">Prisijunkite kaip institucijos administratorius.</p>
      <p class="prompt">Institucija: <strong>${escapeHtml(state.institutionSlug)}</strong></p>
      <div id="loginError" class="error" style="display:none;"></div>
      <form id="adminLoginForm" class="login-form">
        <input type="text" name="email" placeholder="El. pastas" required />
        <input type="password" name="password" placeholder="Slaptazodis" required />
        <button type="submit" class="btn btn-primary">Prisijungti</button>
      </form>
      <p class="prompt" style="margin-top: 12px;">Narys? Grizkite i viesa puslapi: <a href="index.html?institution=${encodeURIComponent(state.institutionSlug)}">index</a></p>
    </section>
  `;

  const form = document.getElementById('adminLoginForm');
  const loginError = document.getElementById('loginError');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    if (!email || !password) return;

    try {
      const payload = await api('/api/v1/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password, institutionSlug: state.institutionSlug }
      });
      setSession(payload);
      await bootstrap();
    } catch (error) {
      loginError.style.display = 'block';
      loginError.textContent = toUserMessage(error);
    }
  });
}

function renderDashboard() {
  const institution = state.context?.institution;
  const cycle = state.cycle;
  const resultsPublished = Boolean(cycle?.results_published);
  const cycleState = String(cycle?.state || 'draft');
  const userName = state.user?.displayName || state.user?.email || 'Administratorius';

  root.innerHTML = `
    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Administratoriaus skydas</strong>
        <span class="tag">Institucija: ${escapeHtml(institution?.name || state.institutionSlug)}</span>
      </div>
      <p class="prompt">Prisijunges: ${escapeHtml(userName)}</p>
      <div class="inline-form">
        <a href="index.html?institution=${encodeURIComponent(state.institutionSlug)}" class="btn btn-ghost">Atgal i viesa puslapi</a>
        <button id="logoutBtn" class="btn btn-ghost">Atsijungti</button>
      </div>
    </section>

    ${state.error ? `
      <section class="card" style="margin-bottom: 16px;">
        <strong>Klaida</strong>
        <p class="prompt">${escapeHtml(state.error)}</p>
        <button id="retryBtn" class="btn btn-primary">Bandyti dar karta</button>
      </section>
    ` : ''}

    ${state.notice ? `
      <section class="card" style="margin-bottom: 16px;">
        <strong>${escapeHtml(state.notice)}</strong>
      </section>
    ` : ''}

    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Ciklo valdymas</strong>
        <span class="tag">ID: ${escapeHtml(cycle?.id || '-')}</span>
      </div>
      <p class="prompt">Busena valdo, ar nariai gali balsuoti ir komentuoti (Open/Review).</p>
      <div class="inline-form">
        <select id="cycleStateSelect" ${state.busy || !cycle?.id ? 'disabled' : ''}>
          ${['draft', 'open', 'review', 'final', 'archived'].map((item) => `<option value="${item}" ${item === cycleState ? 'selected' : ''}>${item.toUpperCase()}</option>`).join('')}
        </select>
        <button id="saveCycleStateBtn" class="btn btn-primary" ${state.busy || !cycle?.id ? 'disabled' : ''}>Atnaujinti busena</button>
      </div>
      <div class="header-row" style="margin-top: 12px;">
        <span class="tag ${resultsPublished ? 'tag-main' : ''}">${resultsPublished ? 'Rezultatai viesi' : 'Rezultatai neviesi'}</span>
        <button id="toggleResultsBtn" class="btn btn-primary" ${state.busy || !cycle?.id ? 'disabled' : ''}>${resultsPublished ? 'Paslepti rezultatus' : 'Paskelbti rezultatus'}</button>
      </div>
    </section>

    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Kvietimai nariams</strong>
        <span class="tag">Invite-only</span>
      </div>
      <form id="inviteForm" class="inline-form">
        <input type="text" name="email" placeholder="Nario el. pastas" required ${state.busy ? 'disabled' : ''} />
        <button type="submit" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>Sukurti kvietima</button>
      </form>
      ${state.inviteToken ? `
        <div class="card" style="margin-top: 12px;">
          <strong>Naujas kvietimo tokenas</strong>
          <p class="prompt" style="word-break: break-all;">${escapeHtml(state.inviteToken)}</p>
          <button id="copyInviteTokenBtn" class="btn btn-ghost">Kopijuoti tokena</button>
        </div>
      ` : ''}
    </section>

    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Dalyviai</strong>
        <span class="tag">${state.participants.length}</span>
      </div>
      <ul class="mini-list">
        ${state.participants.length
          ? state.participants.map((participant) => `
              <li>
                <strong>${escapeHtml(participant.display_name || participant.email)}</strong>
                <span class="muted">${participant.has_voted ? 'Balsavo' : 'Nebalsavo'}</span>
                <span class="tag">Taskai: ${Number(participant.total_score || 0)}</span>
              </li>
            `).join('')
          : '<li>Nera dalyviu.</li>'}
      </ul>
    </section>

    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Prideti gaires</strong>
        <span class="tag">${state.guidelines.length} viso</span>
      </div>
      <form id="addGuidelineForm">
        <div class="form-row">
          <input type="text" name="title" placeholder="Gaires pavadinimas" required ${state.busy || !cycle?.id ? 'disabled' : ''}/>
        </div>
        <textarea name="description" placeholder="Trumpas paaiskinimas" ${state.busy || !cycle?.id ? 'disabled' : ''}></textarea>
        <button class="btn btn-primary" type="submit" style="margin-top: 12px;" ${state.busy || !cycle?.id ? 'disabled' : ''}>Prideti gaire</button>
      </form>
    </section>

    <section class="card">
      <div class="header-row">
        <strong>Gairiu redagavimas</strong>
        <span class="tag">${state.guidelines.length}</span>
      </div>
      <div class="card-list">
        ${state.guidelines.map((guideline) => `
          <article class="card ${guideline.status === 'active' ? '' : 'admin-panel'}">
            <form class="admin-guideline-form" data-id="${escapeHtml(guideline.id)}">
              <input type="text" name="title" value="${escapeHtml(guideline.title)}" required ${state.busy ? 'disabled' : ''}/>
              <textarea name="description" placeholder="Aprasymas" ${state.busy ? 'disabled' : ''}>${escapeHtml(guideline.description || '')}</textarea>
              <div class="inline-form">
                <select name="status" ${state.busy ? 'disabled' : ''}>
                  ${['active', 'merged', 'hidden'].map((item) => `<option value="${item}" ${item === guideline.status ? 'selected' : ''}>${item}</option>`).join('')}
                </select>
                <button class="btn btn-primary" type="submit" ${state.busy ? 'disabled' : ''}>Issaugoti</button>
              </div>
              <div class="header-stack">
                <span class="tag">Balas: ${Number(guideline.totalScore || 0)}</span>
                <span class="tag">Balsuotojai: ${Number(guideline.voterCount || 0)}</span>
                <span class="tag">Komentarai: ${Number(guideline.commentCount || 0)}</span>
              </div>
            </form>
          </article>
        `).join('')}
      </div>
    </section>
  `;

  bindDashboardEvents();
}

function bindDashboardEvents() {
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', bootstrap);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      state.notice = '';
      state.error = '';
      state.inviteToken = '';
      render();
    });
  }

  const saveCycleStateBtn = document.getElementById('saveCycleStateBtn');
  if (saveCycleStateBtn) {
    saveCycleStateBtn.addEventListener('click', async () => {
      const select = document.getElementById('cycleStateSelect');
      const nextState = String(select?.value || '').trim();
      if (!nextState || !state.cycle?.id) return;

      await runBusy(async () => {
        await api(`/api/v1/admin/cycles/${encodeURIComponent(state.cycle.id)}/state`, {
          method: 'PUT',
          body: { state: nextState }
        });
        await bootstrap();
      });
    });
  }

  const toggleResultsBtn = document.getElementById('toggleResultsBtn');
  if (toggleResultsBtn) {
    toggleResultsBtn.addEventListener('click', async () => {
      if (!state.cycle?.id) return;
      await runBusy(async () => {
        await api(`/api/v1/admin/cycles/${encodeURIComponent(state.cycle.id)}/results`, {
          method: 'POST',
          body: { published: !Boolean(state.cycle?.results_published) }
        });
        await bootstrap();
      });
    });
  }

  const inviteForm = document.getElementById('inviteForm');
  if (inviteForm) {
    inviteForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = String(new FormData(inviteForm).get('email') || '').trim();
      if (!email) return;

      await runBusy(async () => {
        const payload = await api('/api/v1/admin/invites', {
          method: 'POST',
          body: { email, role: 'member' }
        });
        state.inviteToken = String(payload.inviteToken || '');
      });
    });
  }

  const copyInviteTokenBtn = document.getElementById('copyInviteTokenBtn');
  if (copyInviteTokenBtn) {
    copyInviteTokenBtn.addEventListener('click', async () => {
      if (!state.inviteToken) return;
      await navigator.clipboard.writeText(state.inviteToken);
      state.notice = 'Kvietimo tokenas nukopijuotas.';
      render();
    });
  }

  const addGuidelineForm = document.getElementById('addGuidelineForm');
  if (addGuidelineForm) {
    addGuidelineForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!state.cycle?.id) return;
      const fd = new FormData(addGuidelineForm);
      const title = String(fd.get('title') || '').trim();
      const description = String(fd.get('description') || '').trim();
      if (!title) return;

      await runBusy(async () => {
        await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/guidelines`, {
          method: 'POST',
          body: { title, description }
        });
        await bootstrap();
      });
    });
  }

  root.querySelectorAll('.admin-guideline-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const guidelineId = form.dataset.id;
      if (!guidelineId) return;

      const fd = new FormData(form);
      const title = String(fd.get('title') || '').trim();
      const description = String(fd.get('description') || '').trim();
      const status = String(fd.get('status') || 'active').trim();
      if (!title) return;

      await runBusy(async () => {
        await api(`/api/v1/admin/guidelines/${encodeURIComponent(guidelineId)}`, {
          method: 'PUT',
          body: { title, description, status }
        });
        await bootstrap();
      });
    });
  });
}

function render() {
  if (!state.token) {
    renderLogin();
    return;
  }

  if (state.loading) {
    root.innerHTML = '<section class="card"><strong>Kraunami administravimo duomenys...</strong></section>';
    return;
  }

  if (state.error && !state.context) {
    root.innerHTML = `
      <section class="card">
        <strong>Prieiga negauta</strong>
        <p class="prompt">${escapeHtml(state.error)}</p>
        <button id="clearSessionBtn" class="btn btn-ghost">Atsijungti</button>
      </section>
    `;
    const clearBtn = document.getElementById('clearSessionBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearSession();
        render();
      });
    }
    return;
  }

  renderDashboard();
}
