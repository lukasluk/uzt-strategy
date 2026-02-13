const root = document.getElementById('metaAdminRoot');

const state = {
  authenticated: false,
  loading: false,
  busy: false,
  error: '',
  notice: '',
  overview: null,
  lastInvite: null,
  lastPasswordReset: null
};

bootstrap();

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeTagToken(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'unknown';
}

function renderTag(value, type = 'default') {
  const token = normalizeTagToken(value);
  const typeToken = normalizeTagToken(type);
  return `<span class="tag tag-${typeToken} tag-${typeToken}-${token}">${escapeHtml(value)}</span>`;
}

function toUserMessage(error) {
  const raw = String(error?.message || error || '').trim();
  const map = {
    unauthorized: 'Sesija negalioja. Prisijunkite is naujo.',
    'invalid token': 'Sesija negalioja. Prisijunkite is naujo.',
    'too many requests': 'Per daug bandymu. Pabandykite po keliu minuciu.',
    forbidden: 'Neteisingas slaptazodis arba neleidziama operacija.',
    'name required': 'Iveskite institucijos pavadinima.',
    'institutionId and name required': 'Pasirinkite institucija ir iveskite nauja pavadinima.',
    'invalid slug': 'Netinkamas slug.',
    'slug already exists': 'Toks institucijos slug jau egzistuoja.',
    'institutionId and email required': 'Pasirinkite institucija ir iveskite el. pasta.',
    'invalid role': 'Netinkamas vaidmuo.',
    'userId required': 'Truksta vartotojo ID.',
    'userId and valid status required': 'Netinkami vartotojo statuso duomenys.',
    'userId and valid archive action required': 'Netinkami vartotojo archyvavimo duomenys.',
    'membershipId and valid status required': 'Netinkami narystes statuso duomenys.',
    'guideIntroText or aboutText required': 'Pakeiskite bent viena teksta.',
    'content text too long': 'Tekstas per ilgas.',
    'reset token required': 'Truksta slaptazodzio keitimo nuorodos.',
    'reset token invalid': 'Nuoroda nebegalioja arba jau panaudota.'
  };
  return map[raw] || raw || 'Nepavyko ivykdyti uzklausos.';
}

async function api(path, { method = 'GET', body = null } = {}) {
  const headers = {};
  if (body !== null) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    credentials: 'same-origin',
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

async function authenticate(password) {
  const response = await fetch('/api/v1/meta-admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ password })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload?.error || 'forbidden');
  }
}

async function loadOverview() {
  const payload = await api('/api/v1/meta-admin/overview');
  state.overview = payload;
}

async function bootstrap() {
  state.loading = true;
  state.error = '';
  render();
  try {
    await loadOverview();
    state.authenticated = true;
  } catch (error) {
    state.authenticated = false;
    state.overview = null;
    const raw = String(error?.message || '').trim();
    if (raw && raw !== 'forbidden' && raw !== 'unauthorized' && raw !== 'invalid token') {
      state.error = toUserMessage(error);
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

async function runBusyWithOutcome(task) {
  if (state.busy) return { ok: false, skipped: true, error: '' };
  state.busy = true;
  state.notice = '';
  render();
  try {
    await task();
    return { ok: true, skipped: false, error: '' };
  } catch (error) {
    const message = toUserMessage(error);
    state.notice = message;
    return { ok: false, skipped: false, error: message };
  } finally {
    state.busy = false;
    render();
  }
}

function renderLogin() {
  root.innerHTML = `
    <section class="card meta-admin-card meta-login-shell" style="max-width: 620px; margin: 30px auto;">
      <h2 class="meta-login-title" style="font-family: 'Fraunces', serif;">Meta Admin prisijungimas</h2>
      <p class="prompt">Įveskite vienkartinį slaptažodį, kad gautumėte globalią prieigą.</p>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ''}
      <form id="metaAdminLoginForm" class="login-form">
        <input type="password" name="password" placeholder="Slaptažodis" required />
        <button type="submit" class="btn btn-primary">Prisijungti</button>
      </form>
    </section>
  `;

  const form = document.getElementById('metaAdminLoginForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = String(new FormData(form).get('password') || '');
    if (!password) return;

    state.loading = true;
    state.error = '';
    render();
    try {
      await authenticate(password);
      state.authenticated = true;
      await loadOverview();
    } catch (error) {
      state.authenticated = false;
      state.overview = null;
      state.error = toUserMessage(error);
    } finally {
      state.loading = false;
      render();
    }
  });
}

function renderUsers(users) {
  if (!users.length) {
    return '<div class="card meta-admin-subcard"><p class="prompt">Dar nera vartotoju.</p></div>';
  }

  return users.map((user) => {
    const hasLatestReset = state.lastPasswordReset && state.lastPasswordReset.userId === user.id;
    const membershipRows = (user.memberships || []).map((membership) => `
      <li class="meta-membership-item">
        <div class="meta-membership-main">
          <strong>${escapeHtml(membership.institutionName)} (${escapeHtml(membership.institutionSlug)})</strong>
        </div>
        <div class="meta-membership-controls">
          ${renderTag(membership.role, 'role')}
          ${renderTag(membership.status, 'status')}
          <button class="btn btn-ghost" data-action="toggle-membership-status" data-membership-id="${escapeHtml(membership.id)}" data-next-status="${membership.status === 'active' ? 'blocked' : 'active'}" ${state.busy ? 'disabled' : ''}>
            ${membership.status === 'active' ? 'Blokuoti naryste' : 'Aktyvuoti naryste'}
          </button>
        </div>
      </li>
    `).join('');

    return `
      <article class="card meta-admin-subcard meta-user-card">
        <div class="header-row meta-user-head">
          <strong>${escapeHtml(user.displayName || user.email)}</strong>
          ${renderTag(user.status, 'status')}
        </div>
        <p class="prompt meta-user-email">${escapeHtml(user.email)}</p>
        <div class="meta-user-actions-grid">
          <button class="btn btn-ghost" type="button" data-action="toggle-user-status" data-user-id="${escapeHtml(user.id)}" data-next-status="${user.status === 'active' ? 'blocked' : 'active'}" ${state.busy ? 'disabled' : ''}>
            ${user.status === 'active' ? 'Blokuoti vartotoja' : 'Aktyvuoti vartotoja'}
          </button>
          <button class="btn btn-ghost" type="button" data-action="create-password-reset-link" data-user-id="${escapeHtml(user.id)}" ${state.busy ? 'disabled' : ''}>
            Slaptazodzio keitimo nuoroda
          </button>
        </div>
        ${user.status !== 'archived' ? `
          <div class="meta-user-actions-grid meta-user-actions-grid-danger">
            <button class="btn btn-ghost" type="button" data-action="archive-user-keep" data-user-id="${escapeHtml(user.id)}" ${state.busy ? 'disabled' : ''}>
              Archyvuoti (palikti turini)
            </button>
            <button class="btn btn-danger" type="button" data-action="archive-user-delete" data-user-id="${escapeHtml(user.id)}" ${state.busy ? 'disabled' : ''}>
              Archyvuoti + istrinti turini
            </button>
          </div>
        ` : ''}
        ${hasLatestReset ? `
          <div class="card-section meta-reset-panel">
            <strong>Vienkartine slaptazodzio keitimo nuoroda</strong>
            <p class="prompt meta-reset-link">${escapeHtml(state.lastPasswordReset.url || '')}</p>
            <p class="prompt meta-reset-expiry">Galioja iki: ${escapeHtml(formatDateTime(state.lastPasswordReset.expiresAt))}</p>
            <div class="inline-form">
              <button class="btn btn-ghost" data-action="copy-password-reset-link" type="button">Kopijuoti nuoroda</button>
              <a class="btn btn-ghost" href="${escapeHtml(state.lastPasswordReset.url || '#')}" target="_blank" rel="noopener noreferrer">Atidaryti</a>
            </div>
          </div>
        ` : ''}
        <div class="card-section meta-memberships-panel">
          <strong>Narystes</strong>
          <ul class="mini-list meta-membership-list">${membershipRows || '<li>Nera narystciu.</li>'}</ul>
        </div>
      </article>
    `;
  }).join('');
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed);
}

function renderMonitoringCards(monitoring) {
  if (!monitoring) return '';
  const requestsByCategory = Array.isArray(monitoring.requestsByCategory) ? monitoring.requestsByCategory : [];
  const requestsByStatusBucket = Array.isArray(monitoring.requestsByStatusBucket) ? monitoring.requestsByStatusBucket : [];
  const topPaths = Array.isArray(monitoring.topPaths) ? monitoring.topPaths : [];
  const limiterHits = Array.isArray(monitoring?.rateLimit?.byLimiter) ? monitoring.rateLimit.byLimiter : [];
  const recentRateLimitEvents = Array.isArray(monitoring?.rateLimit?.recent) ? monitoring.rateLimit.recent : [];
  const embedViewsByInstitution = Array.isArray(monitoring.embedViewsByInstitution) ? monitoring.embedViewsByInstitution : [];
  const rateConfig = monitoring.rateLimitConfig || null;

  const configBadges = rateConfig
    ? `
      <div class="header-stack" style="margin-top:8px;">
        <span class="tag">public: ${Number(rateConfig.publicRead?.max || 0)}/${Math.round(Number(rateConfig.publicRead?.windowMs || 0) / 1000)}s</span>
        <span class="tag">member-write: ${Number(rateConfig.memberWrite?.max || 0)}/${Math.round(Number(rateConfig.memberWrite?.windowMs || 0) / 1000)}s</span>
        <span class="tag">admin-write: ${Number(rateConfig.adminWrite?.max || 0)}/${Math.round(Number(rateConfig.adminWrite?.windowMs || 0) / 1000)}s</span>
      </div>
    `
    : '';

  return `
    <section class="card meta-admin-card meta-monitoring-card">
      <div class="header-row">
        <strong>API apkrovos monitoringas</strong>
        <span class="tag">Nuo ${escapeHtml(formatDateTime(monitoring.startedAt))}</span>
      </div>
      <div class="header-stack">
        <span class="tag">Užklausų iš viso: ${Number(monitoring.requestTotal || 0)}</span>
        <span class="tag">Rate limit blokavimų: ${Number(monitoring?.rateLimit?.blockedTotal || 0)}</span>
      </div>
      ${configBadges}
      <div class="card-list meta-admin-subgrid" style="margin-top: 12px;">
        <article class="card meta-admin-subcard">
          <strong>Užklausos pagal sritį</strong>
          <ul class="mini-list">
            ${requestsByCategory.length
              ? requestsByCategory.map((item) => `<li><span>${escapeHtml(item.category)}</span> <span class="tag">${Number(item.count || 0)}</span></li>`).join('')
              : '<li>Nėra duomenų.</li>'}
          </ul>
        </article>
        <article class="card meta-admin-subcard">
          <strong>HTTP status grupės</strong>
          <ul class="mini-list">
            ${requestsByStatusBucket.length
              ? requestsByStatusBucket.map((item) => `<li><span>${escapeHtml(item.status)}</span> <span class="tag">${Number(item.count || 0)}</span></li>`).join('')
              : '<li>Nėra duomenų.</li>'}
          </ul>
        </article>
        <article class="card meta-admin-subcard">
          <strong>Rate limiteriai</strong>
          <ul class="mini-list">
            ${limiterHits.length
              ? limiterHits.map((item) => `<li><span>${escapeHtml(item.limiter)}</span> <span class="tag">${Number(item.count || 0)}</span></li>`).join('')
              : '<li>Blokavimų kol kas nėra.</li>'}
          </ul>
        </article>
      </div>
      <div class="card-list meta-admin-subgrid" style="margin-top: 12px;">
        <article class="card meta-admin-subcard">
          <strong>Top endpointai</strong>
          <ul class="mini-list">
            ${topPaths.length
              ? topPaths.slice(0, 10).map((item) => `<li><span>${escapeHtml(item.path)}</span> <span class="tag">${Number(item.count || 0)}</span></li>`).join('')
              : '<li>Nėra duomenų.</li>'}
          </ul>
        </article>
        <article class="card meta-admin-subcard">
          <strong>Naujausi 429 įvykiai</strong>
          <ul class="mini-list">
            ${recentRateLimitEvents.length
              ? recentRateLimitEvents.slice(0, 10).map((event) => `<li><span>${escapeHtml(event.limiter)} · ${escapeHtml(event.path)}</span> <span class="tag">${escapeHtml(formatDateTime(event.at))}</span></li>`).join('')
              : '<li>Nėra 429 įvykių.</li>'}
          </ul>
        </article>
      </div>
    </section>

    <section class="card meta-admin-card meta-embed-monitoring-card">
      <div class="header-row">
        <strong>Embed žemėlapių peržiūros</strong>
        <span class="tag">Viso: ${Number(monitoring?.embedViews?.totalViews || 0)}</span>
      </div>
      <ul class="mini-list">
        ${embedViewsByInstitution.length
          ? embedViewsByInstitution.map((item) => `<li><strong>${escapeHtml(item.institutionName)} (${escapeHtml(item.institutionSlug)})</strong> <span class="tag">${Number(item.views || 0)}</span> <span class="muted">${escapeHtml(formatDateTime(item.lastViewedAt))}</span></li>`).join('')
          : '<li>Peržiūrų dar nėra.</li>'}
      </ul>
    </section>
  `;
}

function renderContentSettingsCard(contentSettings) {
  const guideIntroText = String(contentSettings?.guideIntroText || '');
  const aboutText = String(contentSettings?.aboutText || '');
  return `
    <section class="card meta-admin-card meta-content-settings-card">
      <div class="header-row">
        <strong>Viešo turinio tekstai</strong>
        <span class="tag">Naudojimosi gidas ir Apie</span>
      </div>
      <p class="prompt">Šie tekstai rodomi viešame puslapyje skiltyse „Naudojimosi gidas“ ir „Apie“.</p>
      <form id="contentSettingsForm" class="meta-content-settings-form">
        <label class="prompt" for="guideIntroTextField">Naudojimosi gidas (teksto blokas)</label>
        <textarea id="guideIntroTextField" name="guideIntroText" rows="8" ${state.busy ? 'disabled' : ''}>${escapeHtml(guideIntroText)}</textarea>
        <label class="prompt" for="aboutTextField" style="margin-top:10px;">Apie (teksto blokas)</label>
        <textarea id="aboutTextField" name="aboutText" rows="14" ${state.busy ? 'disabled' : ''}>${escapeHtml(aboutText)}</textarea>
        <button class="btn btn-primary" type="submit" style="margin-top:10px;" ${state.busy ? 'disabled' : ''}>Išsaugoti tekstus</button>
      </form>
    </section>
  `;
}

function renderDashboard() {
  const institutions = state.overview?.institutions || [];
  const users = state.overview?.users || [];
  const pendingInvites = state.overview?.pendingInvites || [];
  const monitoring = state.overview?.monitoring || null;
  const contentSettings = state.overview?.contentSettings || {};

  root.innerHTML = `
    <div class="meta-admin-dashboard">
      <section class="card meta-admin-card meta-admin-hero">
        <div class="header-row">
          <strong>Meta Admin skydas</strong>
          ${renderTag('Globalus valdymas', 'scope')}
        </div>
        <p class="prompt">Prieiga saugoma meta admin slaptazodziu.</p>
        <div class="header-stack meta-admin-kpis">
          ${renderTag(`${institutions.length} institucijos`, 'count')}
          ${renderTag(`${users.length} vartotojai`, 'count')}
          ${renderTag(`${pendingInvites.length} laukia kvietimo`, 'count')}
        </div>
        <div class="inline-form meta-admin-hero-actions">
          <button id="refreshOverviewBtn" class="btn btn-ghost" ${state.busy ? 'disabled' : ''}>Atnaujinti duomenis</button>
          <button id="logoutMetaBtn" class="btn btn-ghost">Atsijungti</button>
        </div>
        ${state.notice ? `<p class="prompt meta-admin-notice">${escapeHtml(state.notice)}</p>` : ''}
      </section>

      ${renderMonitoringCards(monitoring)}
      ${renderContentSettingsCard(contentSettings)}

      <section class="card meta-admin-card">
        <div class="header-row">
          <strong>Nauja institucija</strong>
          ${renderTag(`${institutions.length} institucijos`, 'count')}
        </div>
        <form id="createInstitutionForm" class="meta-admin-form">
          <div class="form-row">
            <input type="text" name="name" placeholder="Institucijos pavadinimas" required ${state.busy ? 'disabled' : ''}/>
            <input type="text" name="slug" placeholder="slug (pasirinktinai)" ${state.busy ? 'disabled' : ''}/>
          </div>
          <button class="btn btn-primary" type="submit" ${state.busy ? 'disabled' : ''}>Sukurti institucija</button>
        </form>
      </section>

      <section class="card meta-admin-card">
        <div class="header-row">
          <strong>Esamos institucijos</strong>
          ${renderTag(String(institutions.length), 'count')}
        </div>
        <div class="card-list meta-admin-subgrid">
          ${institutions.length
            ? institutions.map((institution) => `
                <article class="card meta-admin-subcard">
                  <div class="header-row">
                    <strong>${escapeHtml(institution.name)}</strong>
                    ${renderTag(institution.slug, 'slug')}
                  </div>
                  <form class="institution-rename-form inline-form" data-institution-id="${escapeHtml(institution.id)}">
                    <input
                      type="text"
                      name="name"
                      value="${escapeHtml(institution.name)}"
                      placeholder="Naujas institucijos pavadinimas"
                      required
                      ${state.busy ? 'disabled' : ''}
                    />
                    <button type="submit" class="btn btn-ghost" ${state.busy ? 'disabled' : ''}>Issaugoti</button>
                  </form>
                </article>
              `).join('')
            : '<article class="card meta-admin-subcard"><p class="prompt">Instituciju dar nera.</p></article>'}
        </div>
      </section>

      <section class="card meta-admin-card">
        <div class="header-row">
          <strong>Nauji zmones (invite)</strong>
          ${renderTag('Invite-only', 'scope')}
        </div>
        <form id="createInviteForm" class="meta-admin-form">
          <div class="form-row">
            <select name="institutionId" required ${state.busy ? 'disabled' : ''}>
              <option value="">Pasirinkite institucija</option>
              ${institutions.map((institution) => `<option value="${escapeHtml(institution.id)}">${escapeHtml(institution.name)} (${escapeHtml(institution.slug)})</option>`).join('')}
            </select>
            <select name="role" required ${state.busy ? 'disabled' : ''}>
              <option value="member">member</option>
              <option value="institution_admin">institution_admin</option>
            </select>
          </div>
          <div class="form-row">
            <input type="text" name="email" placeholder="El. pastas" required ${state.busy ? 'disabled' : ''}/>
          </div>
          <button class="btn btn-primary" type="submit" ${state.busy ? 'disabled' : ''}>Sukurti kvietima</button>
        </form>
        ${state.lastInvite?.url ? `
          <div class="card meta-admin-subcard meta-invite-token-card" style="margin-top: 12px;">
            <strong>Naujausia vienkartine pakvietimo nuoroda</strong>
            <p class="prompt meta-reset-link">${escapeHtml(state.lastInvite.url)}</p>
            <p class="prompt meta-reset-expiry">Galioja iki: ${escapeHtml(formatDateTime(state.lastInvite.expiresAt))}</p>
            <div class="inline-form">
              <button id="copyInviteUrlBtn" class="btn btn-ghost" type="button">Kopijuoti nuoroda</button>
              <a class="btn btn-ghost" href="${escapeHtml(state.lastInvite.url)}" target="_blank" rel="noopener noreferrer">Atidaryti</a>
            </div>
          </div>
        ` : ''}
      </section>

      <section class="card meta-admin-card">
        <div class="header-row">
          <strong>Laukiantys kvietimai</strong>
          ${renderTag(String(pendingInvites.length), 'count')}
        </div>
        <ul class="mini-list meta-admin-list">
          ${pendingInvites.length
            ? pendingInvites.map((invite) => `
                <li class="meta-admin-list-item">
                  <strong>${escapeHtml(invite.email)}</strong>
                  ${renderTag(invite.role, 'role')}
                  <span class="muted">${escapeHtml(invite.institutionName)} (${escapeHtml(invite.institutionSlug)})</span>
                </li>
              `).join('')
            : '<li>Nera laukianciu kvietimu.</li>'}
        </ul>
      </section>

      <section class="card meta-admin-card meta-users-shell">
        <div class="header-row">
          <strong>Visi vartotojai</strong>
          ${renderTag(String(users.length), 'count')}
        </div>
        <div class="card-list meta-users-grid">
          ${renderUsers(users)}
        </div>
      </section>
    </div>
  `;

  bindDashboardEvents();
}

function bindDashboardEvents() {
  const refreshBtn = document.getElementById('refreshOverviewBtn');
  const logoutBtn = document.getElementById('logoutMetaBtn');
  const createInstitutionForm = document.getElementById('createInstitutionForm');
  const createInviteForm = document.getElementById('createInviteForm');
  const copyInviteUrlBtn = document.getElementById('copyInviteUrlBtn');
  const contentSettingsForm = document.getElementById('contentSettingsForm');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await runBusy(async () => {
        await loadOverview();
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await api('/api/v1/meta-admin/logout', { method: 'POST' });
      } catch {
        // ignore logout errors client-side
      }
      state.authenticated = false;
      state.overview = null;
      state.error = '';
      state.notice = '';
      render();
    });
  }

  if (createInstitutionForm) {
    createInstitutionForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(createInstitutionForm);
      const name = String(fd.get('name') || '').trim();
      const slug = String(fd.get('slug') || '').trim();
      if (!name) return;

      await runBusy(async () => {
        await api('/api/v1/meta-admin/institutions', {
          method: 'POST',
          body: { name, slug }
        });
        state.notice = 'Institucija sukurta.';
        await loadOverview();
        createInstitutionForm.reset();
      });
    });
  }

  if (contentSettingsForm) {
    contentSettingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(contentSettingsForm);
      const guideIntroText = String(fd.get('guideIntroText') || '').trim();
      const aboutText = String(fd.get('aboutText') || '').trim();
      await runBusy(async () => {
        await api('/api/v1/meta-admin/content-settings', {
          method: 'PUT',
          body: { guideIntroText, aboutText }
        });
        state.notice = 'Tekstai atnaujinti.';
        await loadOverview();
      });
    });
  }

  if (createInviteForm) {
    createInviteForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(createInviteForm);
      const institutionId = String(fd.get('institutionId') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const role = String(fd.get('role') || 'member').trim();
      if (!institutionId || !email) return;

      await runBusy(async () => {
        const payload = await api(`/api/v1/meta-admin/institutions/${encodeURIComponent(institutionId)}/invites`, {
          method: 'POST',
          body: { email, role }
        });
        const inviteUrl = String(payload.inviteUrl || '').trim()
          || `${window.location.origin}/accept-invite.html?token=${encodeURIComponent(String(payload.inviteToken || '').trim())}`;
        state.lastInvite = {
          inviteId: String(payload.inviteId || '').trim(),
          url: inviteUrl,
          expiresAt: payload?.expiresAt || null,
          email: String(payload.email || email),
          role: String(payload.role || role)
        };
        state.notice = 'Kvietimas sukurtas.';
        await loadOverview();
        createInviteForm.reset();
      });
    });
  }

  if (copyInviteUrlBtn) {
    copyInviteUrlBtn.addEventListener('click', async () => {
      const inviteUrl = String(state.lastInvite?.url || '').trim();
      if (!inviteUrl) return;
      await navigator.clipboard.writeText(inviteUrl);
      state.notice = 'Pakvietimo nuoroda nukopijuota.';
      render();
    });
  }


  async function createPasswordResetLinkForUser(userId) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return;
    const outcome = await runBusyWithOutcome(async () => {
      const payload = await api(`/api/v1/meta-admin/users/${encodeURIComponent(normalizedUserId)}/password-reset-link`, {
        method: 'POST'
      });
      const url = String(payload?.resetUrl || '');
      state.lastPasswordReset = {
        userId: normalizedUserId,
        url,
        expiresAt: payload?.expiresAt || null
      };
      state.notice = 'Sugeneruota vienkartine slaptazodzio keitimo nuoroda.';
      render();
      if (url) {
        window.prompt('Vienkartine nuoroda (kopijavimui):', url);
      }
    });
    if (!outcome.ok && !outcome.skipped && outcome.error) {
      window.alert(`Nepavyko sukurti slaptazodzio keitimo nuorodos: ${outcome.error}`);
    }
  }

  async function copyPasswordResetLink() {
    const link = String(state.lastPasswordReset?.url || '').trim();
    if (!link) return;
    const outcome = await runBusyWithOutcome(async () => {
      await navigator.clipboard.writeText(link);
      state.notice = 'Slaptazodzio keitimo nuoroda nukopijuota.';
    });
    if (!outcome.ok && !outcome.skipped && outcome.error) {
      window.alert(`Nepavyko nukopijuoti nuorodos: ${outcome.error}`);
    }
  }

  async function archiveUser(userId, action) {
    const normalizedUserId = String(userId || '').trim();
    const normalizedAction = String(action || '').trim();
    if (!normalizedUserId || !['keep', 'delete'].includes(normalizedAction)) return;

    const confirmMessage = normalizedAction === 'delete'
      ? 'Ar tikrai norite archyvuoti vartotoja ir istrinti jo komentarus, gaires bei iniciatyvas?'
      : 'Ar tikrai norite archyvuoti vartotoja paliekant jo turini?';
    if (!window.confirm(confirmMessage)) return;

    await runBusy(async () => {
      const payload = await api(`/api/v1/meta-admin/users/${encodeURIComponent(normalizedUserId)}/archive`, {
        method: 'POST',
        body: { action: normalizedAction }
      });
      const deleted = payload?.deleted || {};
      if (normalizedAction === 'delete') {
        state.notice = `Vartotojas archyvuotas ir turinys istrintas (gaires: ${Number(deleted.guidelines || 0)}, iniciatyvos: ${Number(deleted.initiatives || 0)}, koment.: ${Number(deleted.guidelineComments || 0) + Number(deleted.initiativeComments || 0)}).`;
      } else {
        state.notice = 'Vartotojas archyvuotas. Turinys paliktas.';
      }
      await loadOverview();
    });
  }

  if (!root.dataset.resetDelegatedBound) {
    root.dataset.resetDelegatedBound = '1';
    root.addEventListener('click', async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const createButton = target.closest('[data-action="create-password-reset-link"]');
      if (createButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        await createPasswordResetLinkForUser(createButton.dataset.userId);
        return;
      }
      const copyButton = target.closest('[data-action="copy-password-reset-link"]');
      if (copyButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        await copyPasswordResetLink();
        return;
      }
      const archiveKeepButton = target.closest('[data-action="archive-user-keep"]');
      if (archiveKeepButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        await archiveUser(archiveKeepButton.dataset.userId, 'keep');
        return;
      }
      const archiveDeleteButton = target.closest('[data-action="archive-user-delete"]');
      if (archiveDeleteButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        await archiveUser(archiveDeleteButton.dataset.userId, 'delete');
      }
    });
  }

  root.querySelectorAll('[data-action="toggle-user-status"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const userId = button.dataset.userId;
      const nextStatus = button.dataset.nextStatus;
      if (!userId || !nextStatus) return;

      await runBusy(async () => {
        await api(`/api/v1/meta-admin/users/${encodeURIComponent(userId)}/status`, {
          method: 'PUT',
          body: { status: nextStatus }
        });
        state.notice = `Vartotojo statusas pakeistas į ${nextStatus}.`;
        await loadOverview();
      });
    });
  });

  root.querySelectorAll('[data-action="toggle-membership-status"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const membershipId = button.dataset.membershipId;
      const nextStatus = button.dataset.nextStatus;
      if (!membershipId || !nextStatus) return;

      await runBusy(async () => {
        await api(`/api/v1/meta-admin/memberships/${encodeURIComponent(membershipId)}/status`, {
          method: 'PUT',
          body: { status: nextStatus }
        });
        state.notice = `Narystės statusas pakeistas į ${nextStatus}.`;
        await loadOverview();
      });
    });
  });

  root.querySelectorAll('.institution-rename-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const institutionId = String(form.dataset.institutionId || '').trim();
      const name = String(new FormData(form).get('name') || '').trim();
      if (!institutionId || !name) return;

      await runBusy(async () => {
        await api(`/api/v1/meta-admin/institutions/${encodeURIComponent(institutionId)}`, {
          method: 'PUT',
          body: { name }
        });
        state.notice = 'Institucijos pavadinimas atnaujintas.';
        await loadOverview();
      });
    });
  });
}

function render() {
  if (state.loading) {
    root.innerHTML = '<section class="card"><strong>Kraunami meta admin duomenys...</strong></section>';
    return;
  }

  if (!state.authenticated) {
    renderLogin();
    return;
  }

  renderDashboard();
}

