const AUTH_STORAGE_KEY = 'uzt-strategy-v1-auth';
const DEFAULT_INSTITUTION_SLUG = 'uzt';
const root = document.getElementById('adminRoot');
const IS_EMBEDDED_ADMIN = detectEmbeddedAdmin();

const state = {
  institutionSlug: resolveInstitutionSlug(),
  loading: false,
  busy: false,
  error: '',
  notice: '',
  adminTab: 'cycle',
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
applyEmbeddedAdminMode();
bootstrap();

function detectEmbeddedAdmin() {
  const params = new URLSearchParams(window.location.search);
  return params.get('frame') === 'admin' || window.self !== window.top;
}

function applyEmbeddedAdminMode() {
  if (!IS_EMBEDDED_ADMIN) return;
  document.body.classList.add('embedded-admin');
  const topbar = document.querySelector('.topbar');
  if (topbar) topbar.remove();
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
    if (!parsed || !parsed.token) return;
    const storedSlug = normalizeSlug(parsed.slug || parsed.homeSlug);
    if (storedSlug && storedSlug !== state.institutionSlug) return;
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
      homeSlug: state.institutionSlug,
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
    'invalid token': 'Sesija nebegalioja. Prisijunkite iš naujo.',
    'institution not found': `Institucija "${state.institutionSlug}" nerasta.`,
    'cycle not found': 'Aktyvus ciklas nerastas.',
    forbidden: 'Veiksmas neleidžiamas.',
    'admin role required': 'Reikalingos administratoriaus teisės.',
    'cross-institution forbidden': 'Prieiga prie kitos institucijos duomenų neleidžiama.',
    'invalid credentials': 'Neteisingi prisijungimo duomenys.',
    'email required': 'Nurodykite el. paštą.',
    'userId and password(min 8) required': 'Slaptažodis turi būti bent 8 simbolių.',
    'userId required': 'Nenurodytas vartotojo ID.',
    'cannot delete self': 'Negalite ištrinti savo paskyros.',
    'membership not found': 'Narystė nerasta.',
    'invalid relation type': 'Netinkamas gairės ryšio tipas.',
    'parent guideline required for child': 'Vaikinei gairei būtina parinkti tėvinę gairę.',
    'parent guideline not found': 'Tėvinė gairė nerasta.',
    'parent must be in same cycle': 'Tėvinė gairė turi būti tame pačiame cikle.',
    'child cannot be parent of itself': 'Gairė negali būti pati sau tėvinė.',
    'parent guideline must be parent': 'Pasirinkta gairė nėra tėvinė.',
    'cannot demote parent with children': 'Negalima keisti tėvinės gairės tipo, kol ji turi vaikinių gairių.',
    'invalid line side': 'Netinkama linijos išėjimo pusė.'
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
  const backToPublic = IS_EMBEDDED_ADMIN
    ? ''
    : `<p class="prompt" style="margin-top: 12px;">Narys? Grįžkite į viešą puslapį: <a href="index.html?institution=${encodeURIComponent(state.institutionSlug)}">index</a></p>`;

  root.innerHTML = `
    <section class="card" style="max-width: 560px; margin: 30px auto;">
      <h2 style="font-family: 'Fraunces', serif;">Admin prisijungimas</h2>
      <p class="prompt">Prisijunkite kaip institucijos administratorius.</p>
      <p class="prompt">Institucija: <strong>${escapeHtml(state.institutionSlug)}</strong></p>
      <div id="loginError" class="error" style="display:none;"></div>
      <form id="adminLoginForm" class="login-form">
        <input type="text" name="email" placeholder="El. paštas" required />
        <input type="password" name="password" placeholder="Slaptažodis" required />
        <button type="submit" class="btn btn-primary">Prisijungti</button>
      </form>
      ${backToPublic}
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
  const cycle = state.cycle;
  const resultsPublished = Boolean(cycle?.results_published);
  const cycleState = String(cycle?.state || 'draft');

  root.innerHTML = `
    ${state.error ? `
      <section class="card" style="margin-bottom: 16px;">
        <strong>Klaida</strong>
        <p class="prompt">${escapeHtml(state.error)}</p>
        <button id="retryBtn" class="btn btn-primary">Bandyti dar kartą</button>
      </section>
    ` : ''}

    ${state.notice ? `
      <section class="card" style="margin-bottom: 16px;">
        <strong>${escapeHtml(state.notice)}</strong>
      </section>
    ` : ''}

    <section class="card admin-tabs-card" style="margin-bottom: 16px;">
      <div class="admin-tabs" role="tablist" aria-label="Admin sekcijos">
        <button type="button" class="admin-tab-btn ${state.adminTab === 'cycle' ? 'active' : ''}" data-admin-tab="cycle" role="tab" aria-selected="${state.adminTab === 'cycle' ? 'true' : 'false'}">Ciklas</button>
        <button type="button" class="admin-tab-btn ${state.adminTab === 'users' ? 'active' : ''}" data-admin-tab="users" role="tab" aria-selected="${state.adminTab === 'users' ? 'true' : 'false'}">Vartotojai</button>
        <button type="button" class="admin-tab-btn ${state.adminTab === 'guidelines' ? 'active' : ''}" data-admin-tab="guidelines" role="tab" aria-selected="${state.adminTab === 'guidelines' ? 'true' : 'false'}">Gairės</button>
      </div>
    </section>

    <section class="card" data-admin-section="cycle" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Ciklo valdymas</strong>
        <span class="tag">ID: ${escapeHtml(cycle?.id || '-')}</span>
      </div>
      <p class="prompt">Būsena valdo, ar nariai gali balsuoti ir komentuoti (Open/Review).</p>
      <div class="inline-form">
        <select id="cycleStateSelect" ${state.busy || !cycle?.id ? 'disabled' : ''}>
          ${['draft', 'open', 'review', 'final', 'archived'].map((item) => `<option value="${item}" ${item === cycleState ? 'selected' : ''}>${item.toUpperCase()}</option>`).join('')}
        </select>
        <button id="saveCycleStateBtn" class="btn btn-primary" ${state.busy || !cycle?.id ? 'disabled' : ''}>Atnaujinti būseną</button>
      </div>
      <div class="header-row" style="margin-top: 12px;">
        <span class="tag ${resultsPublished ? 'tag-main' : ''}">${resultsPublished ? 'Rezultatai vieši' : 'Rezultatai nevieši'}</span>
        <button id="toggleResultsBtn" class="btn btn-primary" ${state.busy || !cycle?.id ? 'disabled' : ''}>${resultsPublished ? 'Paslėpti rezultatus' : 'Paskelbti rezultatus'}</button>
      </div>
    </section>

    <section class="card" data-admin-section="users" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Kvietimai nariams</strong>
        <span class="tag">Invite-only</span>
      </div>
      <form id="inviteForm" class="inline-form">
        <input type="text" name="email" placeholder="Nario el. paštas" required ${state.busy ? 'disabled' : ''} />
        <button type="submit" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>Sukurti kvietimą</button>
      </form>
      ${state.inviteToken ? `
        <div class="card" style="margin-top: 12px;">
          <strong>Naujas kvietimo žetonas</strong>
          <p class="prompt" style="word-break: break-all;">${escapeHtml(state.inviteToken)}</p>
          <button id="copyInviteTokenBtn" class="btn btn-ghost">Kopijuoti žetoną</button>
        </div>
      ` : ''}
    </section>

    <section class="card" data-admin-section="users" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Dalyviai</strong>
        <span class="tag">${state.participants.length}</span>
      </div>
      <ul class="mini-list">
        ${state.participants.length
          ? state.participants.map((participant) => `
              <li>
                <div class="header-row" style="align-items: flex-start; gap: 8px;">
                  <div>
                    <strong>${escapeHtml(participant.display_name || participant.email)}</strong>
                    <div class="prompt" style="margin-top: 4px;">El. paštas: ${escapeHtml(participant.email || '-')}</div>
                  </div>
                  <div class="header-stack" style="margin-left: auto;">
                    <span class="muted">${participant.has_voted ? 'Balsavo' : 'Nebalsavo'}</span>
                    <span class="tag">Taškai: ${Number(participant.total_score || 0)}</span>
                  </div>
                </div>
                <div class="inline-form" style="margin-top: 8px;">
                  <form class="participant-password-form inline-form" data-user-id="${escapeHtml(participant.id)}">
                    <input type="password" name="password" placeholder="Naujas slaptažodis (min. 8)" minlength="8" required ${state.busy ? 'disabled' : ''} />
                    <button type="submit" class="btn btn-ghost" ${state.busy ? 'disabled' : ''}>Atnaujinti slaptažodį</button>
                  </form>
                  <button
                    type="button"
                    class="btn btn-ghost participant-delete-btn"
                    data-user-id="${escapeHtml(participant.id)}"
                    data-name="${escapeHtml(participant.display_name || participant.email || 'vartotojas')}"
                    ${state.busy ? 'disabled' : ''}
                  >
                    Ištrinti vartotoją
                  </button>
                </div>
              </li>
            `).join('')
          : '<li>Nėra dalyvių.</li>'}
      </ul>
    </section>

    <section class="card" data-admin-section="guidelines" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Pridėti gaires</strong>
        <span class="tag">${state.guidelines.length} viso</span>
      </div>
      <form id="addGuidelineForm">
        <div class="form-row">
          <input type="text" name="title" placeholder="Gairės pavadinimas" required ${state.busy || !cycle?.id ? 'disabled' : ''}/>
        </div>
        <textarea name="description" placeholder="Trumpas paaiškinimas" ${state.busy || !cycle?.id ? 'disabled' : ''}></textarea>
        <button class="btn btn-primary" type="submit" style="margin-top: 12px;" ${state.busy || !cycle?.id ? 'disabled' : ''}>Pridėti gairę</button>
      </form>
    </section>

    <section class="card" data-admin-section="guidelines">
      <div class="header-row">
        <strong>Gairių redagavimas</strong>
        <span class="tag">${state.guidelines.length}</span>
      </div>
      <div class="card-list">
        ${state.guidelines.map((guideline) => {
          const relationType = guideline.relationType || 'orphan';
          const parentOptions = state.guidelines
            .filter((candidate) => candidate.id !== guideline.id && candidate.relationType === 'parent')
            .map((candidate) => `<option value="${escapeHtml(candidate.id)}" ${candidate.id === guideline.parentGuidelineId ? 'selected' : ''}>${escapeHtml(candidate.title)}</option>`)
            .join('');

          return `
          <article class="card ${guideline.status === 'active' ? '' : 'admin-panel'}">
            <form class="admin-guideline-form" data-id="${escapeHtml(guideline.id)}">
              <input type="text" name="title" value="${escapeHtml(guideline.title)}" required ${state.busy ? 'disabled' : ''}/>
              <textarea name="description" placeholder="Aprašymas" ${state.busy ? 'disabled' : ''}>${escapeHtml(guideline.description || '')}</textarea>
              <div class="inline-form">
                <select name="status" ${state.busy ? 'disabled' : ''}>
                  ${['active', 'merged', 'hidden'].map((item) => `<option value="${item}" ${item === guideline.status ? 'selected' : ''}>${item}</option>`).join('')}
                </select>
                <select name="relationType" ${state.busy ? 'disabled' : ''}>
                  <option value="orphan" ${relationType === 'orphan' ? 'selected' : ''}>Našlaitė</option>
                  <option value="parent" ${relationType === 'parent' ? 'selected' : ''}>Tėvinė</option>
                  <option value="child" ${relationType === 'child' ? 'selected' : ''}>Vaikinė</option>
                </select>
                <select name="parentGuidelineId" ${state.busy ? 'disabled' : ''} ${relationType === 'child' ? '' : 'disabled'}>
                  <option value="">Pasirinkite tėvinę gairę</option>
                  ${parentOptions}
                </select>
                <select name="lineSide" ${state.busy ? 'disabled' : ''}>
                  <option value="auto" ${(guideline.lineSide || 'auto') === 'auto' ? 'selected' : ''}>Linija: auto</option>
                  <option value="left" ${guideline.lineSide === 'left' ? 'selected' : ''}>Linija: kairė</option>
                  <option value="right" ${guideline.lineSide === 'right' ? 'selected' : ''}>Linija: dešinė</option>
                  <option value="top" ${guideline.lineSide === 'top' ? 'selected' : ''}>Linija: viršus</option>
                  <option value="bottom" ${guideline.lineSide === 'bottom' ? 'selected' : ''}>Linija: apačia</option>
                </select>
                <button class="btn btn-primary" type="submit" ${state.busy ? 'disabled' : ''}>Išsaugoti</button>
              </div>
              <div class="header-stack">
                <span class="tag">Balas: ${Number(guideline.totalScore || 0)}</span>
                <span class="tag">Balsuotojai: ${Number(guideline.voterCount || 0)}</span>
                <span class="tag">Komentarai: ${Number(guideline.commentCount || 0)}</span>
                <span class="tag">Ryšys: ${escapeHtml(relationType)}</span>
              </div>
            </form>
          </article>
        `;
        }).join('')}
      </div>
    </section>
  `;

  applyAdminTabVisibility();
  bindDashboardEvents();
}

function applyAdminTabVisibility() {
  const activeTab = ['cycle', 'users', 'guidelines'].includes(state.adminTab) ? state.adminTab : 'cycle';
  state.adminTab = activeTab;
  root.querySelectorAll('[data-admin-section]').forEach((section) => {
    section.hidden = section.dataset.adminSection !== activeTab;
  });
}

function bindDashboardEvents() {
  root.querySelectorAll('[data-admin-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTab = String(button.dataset.adminTab || '').trim();
      if (!['cycle', 'users', 'guidelines'].includes(nextTab)) return;
      if (nextTab === state.adminTab) return;
      state.adminTab = nextTab;
      render();
    });
  });

  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', bootstrap);
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
      state.notice = 'Kvietimo žetonas nukopijuotas.';
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
    const relationSelect = form.querySelector('[name="relationType"]');
    const parentSelect = form.querySelector('[name="parentGuidelineId"]');
    if (relationSelect && parentSelect) {
      const syncParentSelect = () => {
        const relationType = String(relationSelect.value || 'orphan');
        const needsParent = relationType === 'child';
        parentSelect.disabled = state.busy || !needsParent;
        if (!needsParent) parentSelect.value = '';
      };
      relationSelect.addEventListener('change', syncParentSelect);
      syncParentSelect();
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const guidelineId = form.dataset.id;
      if (!guidelineId) return;

      const fd = new FormData(form);
      const title = String(fd.get('title') || '').trim();
      const description = String(fd.get('description') || '').trim();
      const status = String(fd.get('status') || 'active').trim();
      const relationType = String(fd.get('relationType') || 'orphan').trim();
      const parentGuidelineId = String(fd.get('parentGuidelineId') || '').trim();
      const lineSide = String(fd.get('lineSide') || 'auto').trim().toLowerCase();
      if (!title) return;

      await runBusy(async () => {
        await api(`/api/v1/admin/guidelines/${encodeURIComponent(guidelineId)}`, {
          method: 'PUT',
          body: {
            title,
            description,
            status,
            relationType,
            lineSide,
            parentGuidelineId: relationType === 'child' ? parentGuidelineId : null
          }
        });
        await bootstrap();
      });
    });
  });

  root.querySelectorAll('.participant-password-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const userId = String(form.dataset.userId || '').trim();
      const password = String(new FormData(form).get('password') || '');
      if (!userId || password.length < 8) return;

      await runBusy(async () => {
        await api(`/api/v1/admin/users/${encodeURIComponent(userId)}/password`, {
          method: 'PUT',
          body: { password }
        });
        state.notice = 'Slaptažodis atnaujintas.';
      });
    });
  });

  root.querySelectorAll('.participant-delete-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const userId = String(button.dataset.userId || '').trim();
      const name = String(button.dataset.name || 'vartotojas');
      if (!userId) return;
      if (!window.confirm(`Ar tikrai norite ištrinti vartotoją: ${name}?`)) return;

      await runBusy(async () => {
        await api(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
          method: 'DELETE'
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
