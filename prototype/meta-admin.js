const root = document.getElementById('metaAdminRoot');

const state = {
  authenticated: false,
  loading: false,
  busy: false,
  error: '',
  notice: '',
  overview: null,
  metaTab: 'monitoring',
  selectedMetaUserId: '',
  membershipAddTargetUserId: '',
  lastInvite: null,
  lastPasswordReset: null,
  lastAiGeneration: null,
  lastAiGenerationAt: null,
  aiGenerationProgress: null,
  guidelineLinksInstitutionFilter: '',
  guidelineLinksStrategyFilter: '',
  guidelineLinksSearch: '',
  accessRequestStatusFilter: 'pending'
};

const AI_GENERATION_STEPS = [
  'uploading information',
  'AI analyses',
  'preparing digistrategy.eu format',
  'done'
];
const AI_GENERATION_MIN_DURATION_MS = 5000;
const AI_GENERATION_STEP_TIMINGS_MS = [0, 1400, 3200];

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
    'strategyId and title required': 'Pasirinkite strategija ir iveskite nauja pavadinima.',
    'strategy not found': 'Strategija nerasta.',
    'invalid slug': 'Netinkamas slug.',
    'slug already exists': 'Toks institucijos slug jau egzistuoja.',
    'institutionId and email required': 'Pasirinkite institucija ir iveskite el. pasta.',
    'invalid role': 'Netinkamas vaidmuo.',
    'userId required': 'Truksta vartotojo ID.',
    'userId and valid status required': 'Netinkami vartotojo statuso duomenys.',
    'userId and valid archive action required': 'Netinkami vartotojo archyvavimo duomenys.',
    'membershipId and valid status required': 'Netinkami narystes statuso duomenys.',
    'userId, institutionId and role required': 'Truksta vartotojo, institucijos arba role duomenu.',
    'user archived': 'Vartotojas archyvuotas. Pirmiausia aktyvuokite vartotoja.',
    'at least one content setting field required': 'Pakeiskite bent viena teksta.',
    'content text too long': 'Tekstas per ilgas.',
    'reset token required': 'Truksta slaptazodzio keitimo nuorodos.',
    'reset token invalid': 'Nuoroda nebegalioja arba jau panaudota.',
    'sourceGuidelineId and targetGuidelineId required': 'Pasirinkite abi tevines gaires.',
    'source and target must differ': 'Pasirinktos gaires turi skirtis.',
    'guideline not found': 'Gaire nerasta.',
    'parent guideline required': 'Rysis leidziamas tik tarp teviniu gairiu.',
    'failed to create guideline link': 'Nepavyko sukurti rysio tarp gairiu.',
    'linkId required': 'Truksta rysio ID.',
    'guideline link not found': 'Rysis nerastas.'
    ,
    'institutionId required': 'Pasirinkite institucija.',
    'institutionName required': 'Iveskite institucijos pavadinima.',
    'institutionName too long': 'Institucijos pavadinimas per ilgas.',
    'fullName required': 'Iveskite varda ir pavarde.',
    'workEmail required': 'Iveskite darbini el. pasta.',
    'phone required': 'Iveskite kontaktini telefono numeri.',
    'fullName too long': 'Vardas ir pavarde per ilgi.',
    'workEmail too long': 'El. pastas per ilgas.',
    'phone too long': 'Telefono numeris per ilgas.',
    'notes too long': 'Papildoma informacija per ilga.',
    'requestId and valid status required': 'Netinkami uzklausos statuso duomenys.',
    'access request not found': 'Prieigos uzklausa nerasta.',
    'ai api key not configured': 'Serveris dar nesukonfiguruotas AI integracijai (truksta API rakto).',
    'institutionId or institutionName required': 'Pasirinkite esama institucija arba iveskite naujos institucijos pavadinima.',
    'clarification required': 'Iveskite patikslinima, ko norite is AI.',
    'at least one pdf file required': 'Ikelkite bent viena PDF faila.',
    'only pdf files allowed': 'Leidziami tik PDF failai.',
    'pdf file too large': 'PDF failas per didelis.',
    'too many pdf files': 'Per daug PDF failu vienu metu.',
    'documents upload failed': 'Nepavyko ikelti dokumentu.',
    'pdf parsing failed': 'Nepavyko perskaityti PDF failo turinio.',
    'pdf content too large': 'Bendras PDF turinys per didelis vienai generacijai.',
    'ai response invalid': 'AI atsakymas negalioja. Pabandykite patikslinti uzklausa.',
    'ai response language mismatch': 'AI atsakymas ne ta kalba. Pabandykite dar karta arba patikslinkite kalbos reikalavima.',
    'generated guidelines missing': 'AI negrazino gairiu. Pabandykite su kitokiu patikslinimu.',
    'generated initiatives missing': 'AI negrazino iniciatyvu. Pabandykite su kitokiu patikslinimu.',
    'invalid institution slug': 'Nepavyko sugeneruoti institucijos kodo is pavadinimo.',
    'invalid strategy slug': 'Nepavyko sugeneruoti strategijos kodo is pavadinimo.',
    'ai provider error: HTTP 401': 'AI tiekejas atmete API rakta (401).',
    'ai provider error: HTTP 403': 'AI tiekejas atmete prieiga (403).',
    'ai provider error: HTTP 429': 'AI tiekejas laikinai riboja uzklausas (429).',
    'ai provider error: HTTP 500': 'AI tiekejas laikinai nepasiekiamas (500).',
    'strategy limit reached': 'Siai institucijai jau pasiektas maksimalus strategiju limitas (5).'
  };
  return map[raw] || raw || 'Nepavyko ivykdyti uzklausos.';
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

function setNotice(message, type = 'success') {
  const text = String(message || '').trim();
  state.notice = text;
  if (!text) return;
  if (type === 'error') {
    notifyError(text);
  } else {
    notifySuccess(text);
  }
}

async function api(path, { method = 'GET', body = null } = {}) {
  const headers = {};
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== null && !isFormData) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    credentials: 'same-origin',
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
  setNotice('');
  render();
  try {
    await task();
  } catch (error) {
    setNotice(toUserMessage(error), 'error');
  } finally {
    state.busy = false;
    render();
  }
}

async function runBusyWithOutcome(task) {
  if (state.busy) return { ok: false, skipped: true, error: '' };
  state.busy = true;
  setNotice('');
  render();
  try {
    await task();
    return { ok: true, skipped: false, error: '' };
  } catch (error) {
    const message = toUserMessage(error);
    setNotice(message, 'error');
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
      <p class="prompt">Iveskite vienkartini slaptazodi, kad gautumete globalia prieiga.</p>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ''}
      <form id="metaAdminLoginForm" class="login-form">
        <input type="password" name="password" placeholder="Slaptazodis" required />
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
      notifyError(state.error);
    } finally {
      state.loading = false;
      render();
    }
  });
}

function userDisplayName(user) {
  return String(user?.displayName || user?.email || 'Vartotojas').trim();
}

function resolveSelectedMetaUser(users) {
  if (!users.length) {
    state.selectedMetaUserId = '';
    return null;
  }
  const selected = users.find((user) => user.id === state.selectedMetaUserId);
  if (selected) return selected;
  state.selectedMetaUserId = users[0].id;
  return users[0];
}

function buildUsersByInstitution(users) {
  const groupsByInstitution = new Map();
  const unassigned = [];

  users.forEach((user) => {
    const memberships = Array.isArray(user.memberships) ? user.memberships : [];
    if (!memberships.length) {
      unassigned.push({ user, membership: null });
      return;
    }

    memberships.forEach((membership) => {
      const key = String(membership.institutionId || membership.institutionSlug || membership.institutionName || '').trim() || 'unknown';
      if (!groupsByInstitution.has(key)) {
        groupsByInstitution.set(key, {
          key,
          institutionName: String(membership.institutionName || 'Nepriskirta institucija'),
          institutionSlug: String(membership.institutionSlug || ''),
          entries: []
        });
      }
      groupsByInstitution.get(key).entries.push({ user, membership });
    });
  });

  const groups = Array.from(groupsByInstitution.values())
    .map((group) => ({
      ...group,
      entries: group.entries.sort((left, right) => userDisplayName(left.user).localeCompare(userDisplayName(right.user), 'lt'))
    }))
    .sort((left, right) => left.institutionName.localeCompare(right.institutionName, 'lt'));

  if (unassigned.length) {
    groups.push({
      key: 'unassigned',
      institutionName: 'Be institucijos',
      institutionSlug: '',
      entries: unassigned.sort((left, right) => userDisplayName(left.user).localeCompare(userDisplayName(right.user), 'lt'))
    });
  }

  return groups;
}

function renderUsersDirectory(groups, selectedUserId) {
  if (!groups.length) {
    return '<div class="card meta-admin-subcard"><p class="prompt">Dar nera vartotoju.</p></div>';
  }

  return groups.map((group) => `
    <section class="meta-user-group">
      <div class="meta-user-group-head">
        <strong>${escapeHtml(group.institutionName)}${group.institutionSlug ? ` (${escapeHtml(group.institutionSlug)})` : ''}</strong>
        ${renderTag(String(group.entries.length), 'count')}
      </div>
      <ul class="mini-list meta-user-group-list">
        ${group.entries.map((entry) => {
          const user = entry.user;
          const membership = entry.membership;
          const isActive = selectedUserId === user.id;
          return `
            <li>
              <button class="meta-user-row${isActive ? ' active' : ''}" type="button" data-action="select-user" data-user-id="${escapeHtml(user.id)}">
                <span class="meta-user-row-main">
                  <strong class="meta-user-row-name">${escapeHtml(userDisplayName(user))}</strong>
                  <span class="meta-user-row-email">${escapeHtml(user.email || '')}</span>
                </span>
                <span class="meta-user-row-tags">
                  ${membership ? renderTag(membership.role, 'role') : ''}
                  ${renderTag(user.status, 'status')}
                </span>
              </button>
            </li>
          `;
        }).join('')}
      </ul>
    </section>
  `).join('');
}

function renderUserDetail(user, institutions = []) {
  if (!user) {
    return `
      <article class="card meta-admin-subcard meta-user-card meta-user-detail-card">
        <strong>Pasirinkite vartotoja</strong>
        <p class="prompt">Kaireje pasirinkite vartotoja, kad matytumete jo informacija ir valdymo veiksmus.</p>
      </article>
    `;
  }

  const hasLatestReset = state.lastPasswordReset && state.lastPasswordReset.userId === user.id;
  const memberships = Array.isArray(user.memberships) ? user.memberships : [];
  const assignedInstitutionIds = new Set(
    memberships
      .map((membership) => String(membership?.institutionId || '').trim())
      .filter(Boolean)
  );
  const availableInstitutions = (Array.isArray(institutions) ? institutions : [])
    .filter((institution) => !assignedInstitutionIds.has(String(institution?.id || '').trim()));
  const showAddMembershipPanel = state.membershipAddTargetUserId === user.id;
  const addMembershipPanelMarkup = user.status !== 'archived' && showAddMembershipPanel
    ? `
      <div class="card-section meta-membership-add-panel">
        ${availableInstitutions.length
          ? `
            <form class="meta-membership-add-form inline-form" data-user-id="${escapeHtml(user.id)}">
              <select name="institutionId" required ${state.busy ? 'disabled' : ''}>
                ${availableInstitutions.map((institution) => `
                  <option value="${escapeHtml(institution.id)}">${escapeHtml(institution.name)} (${escapeHtml(institution.slug)})</option>
                `).join('')}
              </select>
              <select name="role" required ${state.busy ? 'disabled' : ''}>
                <option value="member">member</option>
                <option value="institution_admin">institution_admin</option>
              </select>
              <button class="btn btn-primary" type="submit" ${state.busy ? 'disabled' : ''}>Prideti naryste</button>
            </form>
          `
          : '<p class="prompt">Vartotojas jau turi narystes visose institucijose.</p>'}
      </div>
    `
    : '';

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
    <article class="card meta-admin-subcard meta-user-card meta-user-detail-card">
      <div class="header-row meta-user-head">
        <strong>${escapeHtml(userDisplayName(user))}</strong>
        ${renderTag(user.status, 'status')}
      </div>
      <p class="prompt meta-user-email">${escapeHtml(user.email || '')}</p>
      <div class="meta-user-actions-grid">
        <button class="btn btn-ghost" type="button" data-action="toggle-user-status" data-user-id="${escapeHtml(user.id)}" data-next-status="${user.status === 'active' ? 'blocked' : 'active'}" ${state.busy ? 'disabled' : ''}>
          ${user.status === 'active' ? 'Blokuoti vartotoja' : 'Aktyvuoti vartotoja'}
        </button>
        <button class="btn btn-ghost" type="button" data-action="create-password-reset-link" data-user-id="${escapeHtml(user.id)}" ${state.busy ? 'disabled' : ''}>
          Slaptazodzio keitimo nuoroda
        </button>
        ${user.status !== 'archived' ? `
          <button class="btn btn-ghost" type="button" data-action="toggle-membership-add-panel" data-user-id="${escapeHtml(user.id)}" ${state.busy ? 'disabled' : ''}>
            ${showAddMembershipPanel ? 'Uzverti narystes pridejima' : 'Prideti naryste kitoje institucijoje'}
          </button>
        ` : ''}
      </div>
      ${addMembershipPanelMarkup}
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
    <section class="card meta-admin-card meta-monitoring-card" data-meta-section="monitoring">
      <div class="header-row">
        <strong>API apkrovos monitoringas</strong>
        <span class="tag">Nuo ${escapeHtml(formatDateTime(monitoring.startedAt))}</span>
      </div>
      <div class="header-stack">
        <span class="tag">Uzklausu is viso: ${Number(monitoring.requestTotal || 0)}</span>
        <span class="tag">Rate limit blokavimu: ${Number(monitoring?.rateLimit?.blockedTotal || 0)}</span>
      </div>
      ${configBadges}
      <div class="card-list meta-admin-subgrid" style="margin-top: 12px;">
        <article class="card meta-admin-subcard">
          <strong>Uzklausos pagal sriti</strong>
          <ul class="mini-list">
            ${requestsByCategory.length
              ? requestsByCategory.map((item) => `<li><span>${escapeHtml(item.category)}</span> <span class="tag">${Number(item.count || 0)}</span></li>`).join('')
              : '<li>Nera duomenu.</li>'}
          </ul>
        </article>
        <article class="card meta-admin-subcard">
          <strong>HTTP status grupes</strong>
          <ul class="mini-list">
            ${requestsByStatusBucket.length
              ? requestsByStatusBucket.map((item) => `<li><span>${escapeHtml(item.status)}</span> <span class="tag">${Number(item.count || 0)}</span></li>`).join('')
              : '<li>Nera duomenu.</li>'}
          </ul>
        </article>
        <article class="card meta-admin-subcard">
          <strong>Rate limiteriai</strong>
          <ul class="mini-list">
            ${limiterHits.length
              ? limiterHits.map((item) => `<li><span>${escapeHtml(item.limiter)}</span> <span class="tag">${Number(item.count || 0)}</span></li>`).join('')
              : '<li>Blokavimu kol kas nera.</li>'}
          </ul>
        </article>
      </div>
      <div class="card-list meta-admin-subgrid" style="margin-top: 12px;">
        <article class="card meta-admin-subcard">
          <strong>Top endpointai</strong>
          <ul class="mini-list">
            ${topPaths.length
              ? topPaths.slice(0, 10).map((item) => `<li><span>${escapeHtml(item.path)}</span> <span class="tag">${Number(item.count || 0)}</span></li>`).join('')
              : '<li>Nera duomenu.</li>'}
          </ul>
        </article>
        <article class="card meta-admin-subcard">
          <strong>Naujausi 429 ivykiai</strong>
          <ul class="mini-list">
            ${recentRateLimitEvents.length
              ? recentRateLimitEvents.slice(0, 10).map((event) => `<li><span>${escapeHtml(event.limiter)} - ${escapeHtml(event.path)}</span> <span class="tag">${escapeHtml(formatDateTime(event.at))}</span></li>`).join('')
              : '<li>Nera 429 ivykiu.</li>'}
          </ul>
        </article>
      </div>
    </section>

    <section class="card meta-admin-card meta-embed-monitoring-card" data-meta-section="monitoring">
      <div class="header-row">
        <strong>Embed zemelapiu perziuros</strong>
        <span class="tag">Viso: ${Number(monitoring?.embedViews?.totalViews || 0)}</span>
      </div>
      <ul class="mini-list">
        ${embedViewsByInstitution.length
          ? embedViewsByInstitution.map((item) => `<li><strong>${escapeHtml(item.institutionName)} (${escapeHtml(item.institutionSlug)})</strong> <span class="tag">${Number(item.views || 0)}</span> <span class="muted">${escapeHtml(formatDateTime(item.lastViewedAt))}</span></li>`).join('')
          : '<li>Perziuru dar nera.</li>'}
      </ul>
    </section>
  `;
}

function guidelineCatalogLabel(item) {
  const institution = String(item?.institutionName || item?.institutionSlug || 'Institucija');
  const strategy = String(item?.strategyTitle || item?.strategySlug || 'default');
  const guideline = String(item?.title || '-');
  return `${institution} / ${strategy} / ${guideline}`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
  });
}

function clearAiGenerationProgress(progress) {
  const target = progress || state.aiGenerationProgress;
  if (!target) return;
  const timers = Array.isArray(target.timers) ? target.timers : [];
  timers.forEach((timerId) => window.clearTimeout(timerId));
}

function startAiGenerationProgress() {
  clearAiGenerationProgress();
  const progress = {
    active: true,
    startedAt: Date.now(),
    stepIndex: 0,
    timers: []
  };
  state.aiGenerationProgress = progress;

  AI_GENERATION_STEP_TIMINGS_MS.forEach((offsetMs, index) => {
    if (index === 0) return;
    const timerId = window.setTimeout(() => {
      if (state.aiGenerationProgress !== progress || !progress.active) return;
      progress.stepIndex = index;
      render();
    }, offsetMs);
    progress.timers.push(timerId);
  });

  render();
  return progress;
}

async function completeAiGenerationProgress(progress) {
  if (!progress || state.aiGenerationProgress !== progress) return;
  const elapsed = Date.now() - Number(progress.startedAt || Date.now());
  if (elapsed < AI_GENERATION_MIN_DURATION_MS) {
    await sleep(AI_GENERATION_MIN_DURATION_MS - elapsed);
  }
  if (state.aiGenerationProgress !== progress) return;
  progress.stepIndex = AI_GENERATION_STEPS.length - 1;
  render();
  await sleep(420);
}

function renderAiGenerationProgress() {
  const progress = state.aiGenerationProgress;
  if (!progress?.active) return '';

  const stepIndex = Math.max(0, Math.min(AI_GENERATION_STEPS.length - 1, Number(progress.stepIndex) || 0));
  const progressPercentByStep = [22, 52, 82, 100];
  const progressPercent = progressPercentByStep[stepIndex] || 0;

  return `
    <div class="meta-ai-progress" role="status" aria-live="polite">
      <div class="meta-ai-progress-head">
        <strong>AI generation in progress</strong>
        <span>${escapeHtml(AI_GENERATION_STEPS[stepIndex])}</span>
      </div>
      <div class="meta-ai-progress-bar" aria-hidden="true">
        <span class="meta-ai-progress-fill" style="width:${progressPercent}%;"></span>
      </div>
      <ol class="meta-ai-progress-steps">
        ${AI_GENERATION_STEPS.map((step, index) => {
          const statusClass = index < stepIndex
            ? 'is-done'
            : (index === stepIndex ? 'is-active' : 'is-pending');
          return `<li class="${statusClass}">${escapeHtml(step)}</li>`;
        }).join('')}
      </ol>
    </div>
  `;
}

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase();
}

function buildGuidelineLinkFilterOptions(parentGuidelines) {
  const institutionsMap = new Map();
  const strategiesMap = new Map();
  (Array.isArray(parentGuidelines) ? parentGuidelines : []).forEach((guideline) => {
    const institutionId = String(guideline?.institutionId || '').trim();
    if (institutionId && !institutionsMap.has(institutionId)) {
      institutionsMap.set(institutionId, {
        id: institutionId,
        label: `${String(guideline?.institutionName || guideline?.institutionSlug || 'Institucija')} (${String(guideline?.institutionSlug || '-')})`
      });
    }

    const strategyId = String(guideline?.strategyId || '').trim();
    if (strategyId && !strategiesMap.has(strategyId)) {
      const strategyTitle = String(guideline?.strategyTitle || guideline?.strategySlug || 'default');
      const institutionSlug = String(guideline?.institutionSlug || '-');
      strategiesMap.set(strategyId, {
        id: strategyId,
        label: `${strategyTitle} (${institutionSlug})`
      });
    }
  });

  const sortByLabel = (left, right) => left.label.localeCompare(right.label, 'lt');
  return {
    institutions: Array.from(institutionsMap.values()).sort(sortByLabel),
    strategies: Array.from(strategiesMap.values()).sort(sortByLabel)
  };
}

function renderGuidelineLinksCard(guidelineLinks) {
  const parentGuidelines = Array.isArray(guidelineLinks?.parentGuidelines) ? guidelineLinks.parentGuidelines : [];
  const links = Array.isArray(guidelineLinks?.links) ? guidelineLinks.links : [];
  const { institutions, strategies } = buildGuidelineLinkFilterOptions(parentGuidelines);
  const institutionFilter = String(state.guidelineLinksInstitutionFilter || '').trim();
  const strategyFilter = String(state.guidelineLinksStrategyFilter || '').trim();
  const searchFilter = String(state.guidelineLinksSearch || '').trim();
  const normalizedSearch = normalizeSearchText(searchFilter);
  const filteredLinks = links.filter((link) => {
    const sourceInstitutionId = String(link?.source?.institutionId || '').trim();
    const targetInstitutionId = String(link?.target?.institutionId || '').trim();
    if (institutionFilter && sourceInstitutionId !== institutionFilter && targetInstitutionId !== institutionFilter) {
      return false;
    }

    const sourceStrategyId = String(link?.source?.strategyId || '').trim();
    const targetStrategyId = String(link?.target?.strategyId || '').trim();
    if (strategyFilter && sourceStrategyId !== strategyFilter && targetStrategyId !== strategyFilter) {
      return false;
    }

    if (!normalizedSearch) return true;
    const searchable = [
      link?.source?.guidelineTitle,
      link?.target?.guidelineTitle,
      link?.source?.institutionName,
      link?.target?.institutionName,
      link?.source?.institutionSlug,
      link?.target?.institutionSlug,
      link?.source?.strategyTitle,
      link?.target?.strategyTitle,
      link?.source?.strategySlug,
      link?.target?.strategySlug
    ]
      .map((value) => normalizeSearchText(value))
      .join(' ');
    return searchable.includes(normalizedSearch);
  });
  const hasEnoughGuidelines = parentGuidelines.length >= 2;
  const guidelineOptions = parentGuidelines.map((guideline) => `
    <option value="${escapeHtml(guideline.id)}">${escapeHtml(guidelineCatalogLabel(guideline))}</option>
  `).join('');

  return `
    <section class="card meta-admin-card" data-meta-section="links">
      <div class="header-row">
        <strong>Strategiju rysiai tarp teviniu gairiu</strong>
        ${renderTag(`${filteredLinks.length}/${links.length}`, 'count')}
      </div>
      <p class="prompt">Sioje vietoje meta-admin gali kurti tarp-strateginius ir tarp-institucinius rysius tarp teviniu gairiu.</p>
      <form id="guidelineLinksFilterForm" class="meta-guideline-links-filters">
        <select name="institutionFilter" ${state.busy ? 'disabled' : ''}>
          <option value="">Visos institucijos</option>
          ${institutions.map((item) => `
            <option value="${escapeHtml(item.id)}" ${item.id === institutionFilter ? 'selected' : ''}>${escapeHtml(item.label)}</option>
          `).join('')}
        </select>
        <select name="strategyFilter" ${state.busy ? 'disabled' : ''}>
          <option value="">Visos strategijos</option>
          ${strategies.map((item) => `
            <option value="${escapeHtml(item.id)}" ${item.id === strategyFilter ? 'selected' : ''}>${escapeHtml(item.label)}</option>
          `).join('')}
        </select>
        <input
          type="search"
          name="search"
          value="${escapeHtml(searchFilter)}"
          placeholder="Greita paieska pagal gairiu pavadinimus"
          ${state.busy ? 'disabled' : ''}
        />
        <button class="btn btn-ghost" type="submit" ${state.busy ? 'disabled' : ''}>Taikyti</button>
        <button class="btn btn-ghost" type="button" data-action="clear-guideline-link-filters" ${state.busy ? 'disabled' : ''}>Valyti filtrus</button>
      </form>
      <form id="createGuidelineLinkForm" class="meta-admin-form">
        <div class="form-row">
          <select name="sourceGuidelineId" required ${state.busy || !hasEnoughGuidelines ? 'disabled' : ''}>
            <option value="">Pasirinkite saltinio tevine gaire</option>
            ${guidelineOptions}
          </select>
          <select name="targetGuidelineId" required ${state.busy || !hasEnoughGuidelines ? 'disabled' : ''}>
            <option value="">Pasirinkite tikslo tevine gaire</option>
            ${guidelineOptions}
          </select>
        </div>
        <button class="btn btn-primary" type="submit" ${state.busy || !hasEnoughGuidelines ? 'disabled' : ''}>Sukurti rysi</button>
      </form>
      ${hasEnoughGuidelines ? '' : '<p class="prompt">Reikia bent dvieju teviniu gairiu, kad butu galima kurti rysius.</p>'}
      <ul class="mini-list meta-admin-list" style="margin-top:12px;">
        ${filteredLinks.length
          ? filteredLinks.map((link) => `
            <li class="meta-admin-list-item">
              <div>
                <strong>${escapeHtml(link?.source?.guidelineTitle || '-')}</strong>
                <span class="muted">(${escapeHtml(link?.source?.institutionSlug || '-')} / ${escapeHtml(link?.source?.strategySlug || '-')})</span>
                <span class="muted"> -> </span>
                <strong>${escapeHtml(link?.target?.guidelineTitle || '-')}</strong>
                <span class="muted">(${escapeHtml(link?.target?.institutionSlug || '-')} / ${escapeHtml(link?.target?.strategySlug || '-')})</span>
                <div class="header-stack" style="margin-top:6px;">
                  ${link?.isCrossInstitution ? renderTag('Tarp instituciju', 'scope') : renderTag('Ta pati institucija', 'scope')}
                  ${link?.isCrossStrategy ? renderTag('Tarp strategiju', 'scope') : renderTag('Ta pati strategija', 'scope')}
                  <span class="tag">${escapeHtml(formatDateTime(link?.createdAt))}</span>
                </div>
              </div>
              <button class="btn btn-ghost" type="button" data-action="delete-guideline-link" data-link-id="${escapeHtml(link.id)}" ${state.busy ? 'disabled' : ''}>Pasalinti rysi</button>
            </li>
          `).join('')
          : '<li>Nera rysiu pagal pasirinktus filtrus.</li>'}
      </ul>
    </section>
  `;
}

function renderAccessRequestsCard(accessRequests) {
  const requests = Array.isArray(accessRequests) ? accessRequests : [];
  const counts = requests.reduce((acc, item) => {
    const status = String(item?.status || 'pending').trim();
    if (!acc[status]) acc[status] = 0;
    acc[status] += 1;
    return acc;
  }, { pending: 0, approved: 0, rejected: 0 });

  const activeFilter = String(state.accessRequestStatusFilter || 'pending').trim();
  const filtered = requests.filter((item) => {
    if (activeFilter === 'all') return true;
    return String(item?.status || '').trim() === activeFilter;
  });

  return `
    <section class="card meta-admin-card" data-meta-section="accessRequests">
      <div class="header-row">
        <strong>Prieigos uzklausos</strong>
        ${renderTag(String(filtered.length), 'count')}
      </div>
      <p class="prompt">Formos is landing ir platformos puslapiu. LinkedIn kontaktas paliekamas kaip alternatyvus tiesioginis kanalas.</p>
      <div class="inline-form">
        <button class="btn btn-ghost${activeFilter === 'pending' ? ' active' : ''}" type="button" data-action="set-access-request-filter" data-filter="pending" ${state.busy ? 'disabled' : ''}>Laukiama (${Number(counts.pending || 0)})</button>
        <button class="btn btn-ghost${activeFilter === 'approved' ? ' active' : ''}" type="button" data-action="set-access-request-filter" data-filter="approved" ${state.busy ? 'disabled' : ''}>Patvirtinta (${Number(counts.approved || 0)})</button>
        <button class="btn btn-ghost${activeFilter === 'rejected' ? ' active' : ''}" type="button" data-action="set-access-request-filter" data-filter="rejected" ${state.busy ? 'disabled' : ''}>Atmesta (${Number(counts.rejected || 0)})</button>
        <button class="btn btn-ghost${activeFilter === 'all' ? ' active' : ''}" type="button" data-action="set-access-request-filter" data-filter="all" ${state.busy ? 'disabled' : ''}>Visos (${requests.length})</button>
      </div>
      <ul class="mini-list meta-admin-list">
        ${filtered.length
          ? filtered.map((item) => `
            <li class="meta-admin-list-item">
              <div>
                <div class="header-row" style="margin-bottom:6px;">
                  <strong>${escapeHtml(item.requestCode || '-')}</strong>
                  ${renderTag(String(item.status || 'pending'), 'status')}
                </div>
                <p class="prompt" style="margin:0;">
                  <strong>${escapeHtml(item.fullName || '-')}</strong> · ${escapeHtml(item.workEmail || '-')} · ${escapeHtml(item.phone || '-')}
                </p>
                <p class="prompt" style="margin:4px 0 0;">
                  Institucija: ${escapeHtml(item.institutionName || '-')} ${item.institutionSlug ? `(${escapeHtml(item.institutionSlug)})` : ''}
                </p>
                ${item.notes ? `<p class="prompt" style="margin:4px 0 0;">Pastaba: ${escapeHtml(item.notes)}</p>` : ''}
                <div class="header-stack" style="margin-top:6px;">
                  <span class="tag">${escapeHtml(formatDateTime(item.createdAt))}</span>
                  ${item.reviewedAt ? `<span class="tag">Perziureta: ${escapeHtml(formatDateTime(item.reviewedAt))}</span>` : ''}
                </div>
              </div>
              <div class="inline-form" style="align-items:flex-start;">
                ${String(item.status || '') !== 'approved'
                  ? `<button class="btn btn-ghost" type="button" data-action="update-access-request-status" data-request-id="${escapeHtml(item.id)}" data-next-status="approved" ${state.busy ? 'disabled' : ''}>Patvirtinti</button>`
                  : ''}
                ${String(item.status || '') !== 'rejected'
                  ? `<button class="btn btn-ghost" type="button" data-action="update-access-request-status" data-request-id="${escapeHtml(item.id)}" data-next-status="rejected" ${state.busy ? 'disabled' : ''}>Atmesti</button>`
                  : ''}
                ${String(item.status || '') !== 'pending'
                  ? `<button class="btn btn-ghost" type="button" data-action="update-access-request-status" data-request-id="${escapeHtml(item.id)}" data-next-status="pending" ${state.busy ? 'disabled' : ''}>Grazinti i laukiama</button>`
                  : ''}
              </div>
            </li>
          `).join('')
          : '<li>Nera uzklausu pagal pasirinkta filtra.</li>'}
      </ul>
    </section>
  `;
}

function renderTopTabs() {
  const tabs = [
    { id: 'monitoring', label: 'Monitoringas' },
    { id: 'accessRequests', label: 'Prieigos uzklausos' },
    { id: 'links', label: 'Strategiju rysiai' },
    { id: 'content', label: 'Viesas turinys' },
    { id: 'institutions', label: 'Institucijos' },
    { id: 'invites', label: 'Kvietimai' },
    { id: 'users', label: 'Vartotojai' }
  ];

  return `
    <section class="card meta-admin-card meta-admin-tabs-card">
      <div class="meta-admin-top-tabs" role="tablist" aria-label="Meta admin skyriai">
        ${tabs.map((tab) => `
          <button
            type="button"
            class="btn btn-ghost meta-admin-top-tab${state.metaTab === tab.id ? ' active' : ''}"
            data-meta-tab="${tab.id}"
            role="tab"
            aria-selected="${state.metaTab === tab.id ? 'true' : 'false'}"
            ${state.busy ? 'disabled' : ''}
          >${escapeHtml(tab.label)}</button>
        `).join('')}
      </div>
    </section>
  `;
}

function applyMetaTabVisibility() {
  const allowedTabs = ['monitoring', 'accessRequests', 'links', 'content', 'institutions', 'invites', 'users'];
  const activeTab = allowedTabs.includes(state.metaTab) ? state.metaTab : 'monitoring';
  state.metaTab = activeTab;

  root.querySelectorAll('[data-meta-tab]').forEach((button) => {
    const isActive = button.dataset.metaTab === activeTab;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  root.querySelectorAll('[data-meta-section]').forEach((section) => {
    const shouldShow = section.dataset.metaSection === activeTab;
    section.hidden = !shouldShow;
    section.style.display = shouldShow ? '' : 'none';
  });
}

function renderContentSettingsCard(contentSettings) {
  const guideIntroTextLt = String(contentSettings?.guideIntroTextLt || contentSettings?.guideIntroText || '');
  const guideIntroTextEn = String(contentSettings?.guideIntroTextEn || '');
  const aboutTextLt = String(contentSettings?.aboutTextLt || contentSettings?.aboutText || '');
  const aboutTextEn = String(contentSettings?.aboutTextEn || '');
  const landingTranslationsLt = contentSettings?.landingTranslationsLt && typeof contentSettings.landingTranslationsLt === 'object'
    ? contentSettings.landingTranslationsLt
    : {};
  const landingTranslationsEn = contentSettings?.landingTranslationsEn && typeof contentSettings.landingTranslationsEn === 'object'
    ? contentSettings.landingTranslationsEn
    : {};
  const landingTranslationsLtJson = JSON.stringify(landingTranslationsLt, null, 2);
  const landingTranslationsEnJson = JSON.stringify(landingTranslationsEn, null, 2);
  return `
    <section class="card meta-admin-card meta-content-settings-card" data-meta-section="content">
      <div class="header-row">
        <strong>Vieso turinio tekstai</strong>
        <span class="tag">LT/EN side-by-side</span>
      </div>
      <p class="prompt">Keiskite platformos ir landing puslapio viesa turini atskirai lietuviu ir anglu kalbomis.</p>
      <form id="contentSettingsForm" class="meta-content-settings-form">
        <div class="meta-content-grid">
          <section class="card meta-admin-subcard meta-content-locale-card">
            <div class="header-row">
              <strong>Platforma LT</strong>
              <span class="tag">index.html</span>
            </div>
            <label class="prompt" for="guideIntroTextLtField">Naudojimosi gidas LT</label>
            <textarea id="guideIntroTextLtField" name="guideIntroTextLt" rows="10" ${state.busy ? 'disabled' : ''}>${escapeHtml(guideIntroTextLt)}</textarea>
            <label class="prompt" for="aboutTextLtField" style="margin-top:10px;">Apie LT</label>
            <textarea id="aboutTextLtField" name="aboutTextLt" rows="14" ${state.busy ? 'disabled' : ''}>${escapeHtml(aboutTextLt)}</textarea>
          </section>
          <section class="card meta-admin-subcard meta-content-locale-card">
            <div class="header-row">
              <strong>Platforma EN</strong>
              <span class="tag">index.html</span>
            </div>
            <label class="prompt" for="guideIntroTextEnField">User guide EN</label>
            <textarea id="guideIntroTextEnField" name="guideIntroTextEn" rows="10" ${state.busy ? 'disabled' : ''}>${escapeHtml(guideIntroTextEn)}</textarea>
            <label class="prompt" for="aboutTextEnField" style="margin-top:10px;">About EN</label>
            <textarea id="aboutTextEnField" name="aboutTextEn" rows="14" ${state.busy ? 'disabled' : ''}>${escapeHtml(aboutTextEn)}</textarea>
          </section>
        </div>
        <div class="meta-content-grid">
          <section class="card meta-admin-subcard meta-content-locale-card">
            <div class="header-row">
              <strong>Landing LT</strong>
              <span class="tag">landing.html JSON</span>
            </div>
            <label class="prompt" for="landingTranslationsLtField">Landing vertimai LT (JSON)</label>
            <textarea id="landingTranslationsLtField" name="landingTranslationsLtJson" rows="12" ${state.busy ? 'disabled' : ''}>${escapeHtml(landingTranslationsLtJson)}</textarea>
          </section>
          <section class="card meta-admin-subcard meta-content-locale-card">
            <div class="header-row">
              <strong>Landing EN</strong>
              <span class="tag">landing.html JSON</span>
            </div>
            <label class="prompt" for="landingTranslationsEnField">Landing vertimai EN (JSON)</label>
            <textarea id="landingTranslationsEnField" name="landingTranslationsEnJson" rows="12" ${state.busy ? 'disabled' : ''}>${escapeHtml(landingTranslationsEnJson)}</textarea>
          </section>
        </div>
        <button class="btn btn-primary" type="submit" style="margin-top:10px;" ${state.busy ? 'disabled' : ''}>Issaugoti tekstus</button>
      </form>
    </section>
  `;
}
function renderDashboard() {
  const institutions = state.overview?.institutions || [];
  const users = state.overview?.users || [];
  const selectedUser = resolveSelectedMetaUser(users);
  const groupedUsers = buildUsersByInstitution(users);
  const pendingInvites = state.overview?.pendingInvites || [];
  const accessRequests = state.overview?.accessRequests || [];
  const pendingAccessRequests = accessRequests.filter((item) => String(item?.status || '').trim() === 'pending');
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
          ${renderTag(`${pendingAccessRequests.length} laukia perziuros`, 'count')}
          ${renderTag(`${pendingInvites.length} laukia kvietimo`, 'count')}
        </div>
        <div class="inline-form meta-admin-hero-actions">
          <button id="refreshOverviewBtn" class="btn btn-ghost" ${state.busy ? 'disabled' : ''}>Atnaujinti duomenis</button>
          <button id="logoutMetaBtn" class="btn btn-ghost">Atsijungti</button>
        </div>
        ${state.notice ? `<p class="prompt meta-admin-notice">${escapeHtml(state.notice)}</p>` : ''}
      </section>

      ${renderTopTabs()}
      ${renderMonitoringCards(monitoring)}
      ${renderAccessRequestsCard(accessRequests)}
      ${renderGuidelineLinksCard(state.overview?.guidelineLinks || {})}
      ${renderContentSettingsCard(contentSettings)}

      <section class="card meta-admin-card" data-meta-section="institutions">
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

      <section class="card meta-admin-card" data-meta-section="institutions">
        <div class="header-row">
          <strong>AI strategija is PDF</strong>
          ${renderTag('Atsargiai: kuria nauja strategija', 'scope')}
        </div>
        <p class="prompt">Meta-admin gali ikelti PDF dokumentus ir sugeneruoti nauja strategija su gairiu/iniciatyvu struktura. Esami duomenys neperrasomi.</p>
        <form id="createAiStrategyForm" class="meta-admin-form meta-ai-create-form" enctype="multipart/form-data">
          <div class="form-row">
            <select name="institutionId" ${state.busy ? 'disabled' : ''}>
              <option value="">Sukurti naujai institucijai (zemiau)</option>
              ${institutions.map((institution) => `<option value="${escapeHtml(institution.id)}">${escapeHtml(institution.name)} (${escapeHtml(institution.slug)})</option>`).join('')}
            </select>
            <input type="text" name="institutionName" placeholder="Naujos institucijos pavadinimas (jei nepasirinkta auksciau)" ${state.busy ? 'disabled' : ''}/>
          </div>
          <div class="form-row">
            <input type="text" name="strategyTitle" placeholder="Strategijos pavadinimas (nebutina, AI gali sugeneruoti)" ${state.busy ? 'disabled' : ''}/>
            <input type="text" name="strategySlug" placeholder="Strategijos slug (nebūtina)" ${state.busy ? 'disabled' : ''}/>
          </div>
          <div class="form-row">
            <input type="text" name="cycleTitle" placeholder="Ciklo pavadinimas (nebūtina)" ${state.busy ? 'disabled' : ''}/>
            <select name="localeHint" ${state.busy ? 'disabled' : ''}>
              <option value="lt">LT rezultatas</option>
              <option value="en">EN result</option>
            </select>
          </div>
          <textarea
            name="clarification"
            rows="4"
            placeholder="Patikslinimas AI: kokio lygio, kokio tono, kokie prioritetai, ko vengti."
            required
            ${state.busy ? 'disabled' : ''}
          ></textarea>
          <div class="form-row">
            <input type="file" name="documents" accept="application/pdf,.pdf" multiple required ${state.busy ? 'disabled' : ''}/>
          </div>
          <button class="btn btn-primary" type="submit" ${state.busy ? 'disabled' : ''}>Generuoti strategija su AI</button>
        </form>
        ${renderAiGenerationProgress()}
        ${state.lastAiGeneration?.strategy?.id ? `
          <div class="card meta-admin-subcard meta-ai-result-card" style="margin-top: 12px;">
            <strong>AI generacija sekminga</strong>
            ${state.lastAiGenerationAt ? `<p class="prompt" style="margin:4px 0 0;">Laikas: ${escapeHtml(formatDateTime(state.lastAiGenerationAt))}</p>` : ''}
            <p class="prompt" style="margin:6px 0 0;">Institucija: ${escapeHtml(state.lastAiGeneration?.institution?.name || '-')} (${escapeHtml(state.lastAiGeneration?.institution?.slug || '-')})</p>
            <p class="prompt" style="margin:2px 0 0;">Strategija: ${escapeHtml(state.lastAiGeneration?.strategy?.title || '-')} (${escapeHtml(state.lastAiGeneration?.strategy?.slug || '-')})</p>
            <p class="prompt" style="margin:2px 0 0;">Sukurta: gairiu ${escapeHtml(state.lastAiGeneration?.summary?.guidelines || 0)}, iniciatyvu ${escapeHtml(state.lastAiGeneration?.summary?.initiatives || 0)}, failu ${escapeHtml(state.lastAiGeneration?.summary?.sourceFiles || 0)}</p>
          </div>
        ` : ''}
      </section>

      <section class="card meta-admin-card" data-meta-section="institutions">
        <div class="header-row">
          <strong>Esamos institucijos</strong>
          ${renderTag(String(institutions.length), 'count')}
        </div>
        <div class="card-list meta-admin-subgrid">
          ${institutions.length
            ? institutions.map((institution) => {
              const strategies = Array.isArray(institution?.strategies) ? institution.strategies : [];
              return `
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
                  <div class="card-section" style="margin-top:10px;">
                    <strong>Strategijos</strong>
                    <ul class="mini-list" style="margin-top:8px;">
                      ${strategies.length
                        ? strategies.map((strategy) => `
                          <li>
                            <form class="strategy-rename-form inline-form" data-strategy-id="${escapeHtml(strategy.id)}">
                              <input
                                type="text"
                                name="title"
                                value="${escapeHtml(strategy.title)}"
                                placeholder="Naujas strategijos pavadinimas"
                                required
                                ${state.busy ? 'disabled' : ''}
                              />
                              <span class="tag">${escapeHtml(strategy.slug || '-')}</span>
                              ${strategy.isDefault ? renderTag('Numatytoji', 'scope') : ''}
                              <button type="submit" class="btn btn-ghost" ${state.busy ? 'disabled' : ''}>Issaugoti</button>
                            </form>
                          </li>
                        `).join('')
                        : '<li><span class="prompt">Strategiju nera.</span></li>'}
                    </ul>
                  </div>
                </article>
              `;
            }).join('')
            : '<article class="card meta-admin-subcard"><p class="prompt">Instituciju dar nera.</p></article>'}
        </div>
      </section>

      <section class="card meta-admin-card" data-meta-section="invites">
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

      <section class="card meta-admin-card" data-meta-section="invites">
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

      <section class="card meta-admin-card meta-users-shell" data-meta-section="users">
        <div class="header-row">
          <strong>Visi vartotojai</strong>
          ${renderTag(String(users.length), 'count')}
        </div>
        <div class="meta-users-layout">
          <aside class="meta-users-directory">
            ${renderUsersDirectory(groupedUsers, selectedUser?.id || '')}
          </aside>
          <div class="meta-user-detail-shell">
            ${renderUserDetail(selectedUser, institutions)}
          </div>
        </div>
      </section>
    </div>
  `;

  bindDashboardEvents();
  applyMetaTabVisibility();
}

function bindDashboardEvents() {
  const topTabButtons = root.querySelectorAll('[data-meta-tab]');
  const refreshBtn = document.getElementById('refreshOverviewBtn');
  const logoutBtn = document.getElementById('logoutMetaBtn');
  const createInstitutionForm = document.getElementById('createInstitutionForm');
  const createAiStrategyForm = document.getElementById('createAiStrategyForm');
  const createInviteForm = document.getElementById('createInviteForm');
  const createGuidelineLinkForm = document.getElementById('createGuidelineLinkForm');
  const guidelineLinksFilterForm = document.getElementById('guidelineLinksFilterForm');
  const copyInviteUrlBtn = document.getElementById('copyInviteUrlBtn');
  const contentSettingsForm = document.getElementById('contentSettingsForm');

  topTabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextTab = String(button.dataset.metaTab || '').trim();
      if (!nextTab || nextTab === state.metaTab) return;
      state.metaTab = nextTab;
      applyMetaTabVisibility();
    });
  });

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
      state.selectedMetaUserId = '';
      state.membershipAddTargetUserId = '';
      state.error = '';
      setNotice('');
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
        setNotice('Institucija sukurta.');
        await loadOverview();
        createInstitutionForm.reset();
      });
    });
  }

  if (createAiStrategyForm) {
    createAiStrategyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(createAiStrategyForm);
      const institutionId = String(fd.get('institutionId') || '').trim();
      const institutionName = String(fd.get('institutionName') || '').trim();
      const clarification = String(fd.get('clarification') || '').trim();
      const files = fd.getAll('documents').filter((file) => file instanceof File && file.size > 0);
      if (!institutionId && !institutionName) return;
      if (!clarification || !files.length) return;

      if (state.busy) return;
      state.busy = true;
      setNotice('');
      const progress = startAiGenerationProgress();
      render();
      try {
        const payload = await api('/api/v1/meta-admin/strategies/ai-generate', {
          method: 'POST',
          body: fd
        });
        await loadOverview();
        await completeAiGenerationProgress(progress);
        state.lastAiGeneration = payload;
        state.lastAiGenerationAt = new Date().toISOString();
        setNotice(`AI sugeneravo nauja strategija: ${String(payload?.strategy?.title || '-').trim() || '-'}.`);
      } catch (error) {
        setNotice(toUserMessage(error), 'error');
      } finally {
        clearAiGenerationProgress(progress);
        state.aiGenerationProgress = null;
        state.busy = false;
        render();
      }
    });
  }

  if (createGuidelineLinkForm) {
    createGuidelineLinkForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(createGuidelineLinkForm);
      const sourceGuidelineId = String(fd.get('sourceGuidelineId') || '').trim();
      const targetGuidelineId = String(fd.get('targetGuidelineId') || '').trim();
      if (!sourceGuidelineId || !targetGuidelineId) return;
      if (sourceGuidelineId === targetGuidelineId) {
        setNotice('Pasirinktos gaires turi skirtis.', 'error');
        render();
        return;
      }

      await runBusy(async () => {
        const payload = await api('/api/v1/meta-admin/guideline-links', {
          method: 'POST',
          body: { sourceGuidelineId, targetGuidelineId }
        });
        setNotice(payload?.existedBefore
          ? 'Rysis jau egzistavo.'
          : 'Strateginis rysis sukurtas.');
        await loadOverview();
      });
    });
  }

  if (guidelineLinksFilterForm) {
    const syncGuidelineLinkFilters = () => {
      const fd = new FormData(guidelineLinksFilterForm);
      state.guidelineLinksInstitutionFilter = String(fd.get('institutionFilter') || '').trim();
      state.guidelineLinksStrategyFilter = String(fd.get('strategyFilter') || '').trim();
      state.guidelineLinksSearch = String(fd.get('search') || '').trim();
      render();
    };
    guidelineLinksFilterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      syncGuidelineLinkFilters();
    });
    guidelineLinksFilterForm.addEventListener('change', syncGuidelineLinkFilters);
  }

  if (contentSettingsForm) {
    contentSettingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(contentSettingsForm);
      const guideIntroTextLt = String(fd.get('guideIntroTextLt') || '').trim();
      const guideIntroTextEn = String(fd.get('guideIntroTextEn') || '').trim();
      const aboutTextLt = String(fd.get('aboutTextLt') || '').trim();
      const aboutTextEn = String(fd.get('aboutTextEn') || '').trim();
      const landingTranslationsLtJson = String(fd.get('landingTranslationsLtJson') || '').trim();
      const landingTranslationsEnJson = String(fd.get('landingTranslationsEnJson') || '').trim();
      let landingTranslationsLt = {};
      let landingTranslationsEn = {};
      try {
        landingTranslationsLt = landingTranslationsLtJson ? JSON.parse(landingTranslationsLtJson) : {};
      } catch {
        setNotice('Landing LT vertimai turi buti teisingas JSON objektas.', 'error');
        render();
        return;
      }
      try {
        landingTranslationsEn = landingTranslationsEnJson ? JSON.parse(landingTranslationsEnJson) : {};
      } catch {
        setNotice('Landing EN vertimai turi buti teisingas JSON objektas.', 'error');
        render();
        return;
      }
      await runBusy(async () => {
        await api('/api/v1/meta-admin/content-settings', {
          method: 'PUT',
          body: { guideIntroTextLt, guideIntroTextEn, aboutTextLt, aboutTextEn, landingTranslationsLt, landingTranslationsEn }
        });
        setNotice('Tekstai atnaujinti.');
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
        setNotice('Kvietimas sukurtas.');
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
      setNotice('Pakvietimo nuoroda nukopijuota.');
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
      setNotice('Sugeneruota vienkartine slaptazodzio keitimo nuoroda.');
      render();
      if (url) {
        window.prompt('Vienkartine nuoroda (kopijavimui):', url);
      }
    });
    if (!outcome.ok && !outcome.skipped && outcome.error) {
      notifyError(`Nepavyko sukurti slaptazodzio keitimo nuorodos: ${outcome.error}`);
    }
  }

  async function copyPasswordResetLink() {
    const link = String(state.lastPasswordReset?.url || '').trim();
    if (!link) return;
    const outcome = await runBusyWithOutcome(async () => {
      await navigator.clipboard.writeText(link);
      setNotice('Slaptazodzio keitimo nuoroda nukopijuota.');
    });
    if (!outcome.ok && !outcome.skipped && outcome.error) {
      notifyError(`Nepavyko nukopijuoti nuorodos: ${outcome.error}`);
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
        setNotice(`Vartotojas archyvuotas ir turinys istrintas (gaires: ${Number(deleted.guidelines || 0)}, iniciatyvos: ${Number(deleted.initiatives || 0)}, koment.: ${Number(deleted.guidelineComments || 0) + Number(deleted.initiativeComments || 0)}).`);
      } else {
        setNotice('Vartotojas archyvuotas. Turinys paliktas.');
      }
      await loadOverview();
    });
  }

  async function addMembershipForUser(userId, institutionId, role) {
    const normalizedUserId = String(userId || '').trim();
    const normalizedInstitutionId = String(institutionId || '').trim();
    const normalizedRole = String(role || '').trim();
    if (!normalizedUserId || !normalizedInstitutionId || !normalizedRole) return;

    await runBusy(async () => {
      const payload = await api(`/api/v1/meta-admin/users/${encodeURIComponent(normalizedUserId)}/memberships`, {
        method: 'POST',
        body: {
          institutionId: normalizedInstitutionId,
          role: normalizedRole
        }
      });
      setNotice(payload?.existedBefore
        ? 'Naryste atnaujinta.'
        : 'Naryste prideta.');
      state.membershipAddTargetUserId = normalizedUserId;
      await loadOverview();
    });
  }

  if (!root.dataset.resetDelegatedBound) {
    root.dataset.resetDelegatedBound = '1';
    root.addEventListener('click', async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const selectUserButton = target.closest('[data-action="select-user"]');
      if (selectUserButton instanceof HTMLElement) {
        const nextUserId = String(selectUserButton.dataset.userId || '').trim();
        if (nextUserId && nextUserId !== state.selectedMetaUserId) {
          state.selectedMetaUserId = nextUserId;
          if (state.membershipAddTargetUserId && state.membershipAddTargetUserId !== nextUserId) {
            state.membershipAddTargetUserId = '';
          }
          render();
        }
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const setAccessRequestFilterButton = target.closest('[data-action="set-access-request-filter"]');
      if (setAccessRequestFilterButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        const nextFilter = String(setAccessRequestFilterButton.dataset.filter || 'pending').trim();
        if (!['pending', 'approved', 'rejected', 'all'].includes(nextFilter)) return;
        if (nextFilter === state.accessRequestStatusFilter) return;
        state.accessRequestStatusFilter = nextFilter;
        render();
        return;
      }
      const updateAccessRequestStatusButton = target.closest('[data-action="update-access-request-status"]');
      if (updateAccessRequestStatusButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        const requestId = String(updateAccessRequestStatusButton.dataset.requestId || '').trim();
        const nextStatus = String(updateAccessRequestStatusButton.dataset.nextStatus || '').trim();
        if (!requestId || !['pending', 'approved', 'rejected'].includes(nextStatus)) return;
        await runBusy(async () => {
          await api(`/api/v1/meta-admin/access-requests/${encodeURIComponent(requestId)}/status`, {
            method: 'PUT',
            body: { status: nextStatus }
          });
          setNotice(`Uzklausos statusas pakeistas i ${nextStatus}.`);
          await loadOverview();
        });
        return;
      }
      const clearGuidelineLinkFiltersButton = target.closest('[data-action="clear-guideline-link-filters"]');
      if (clearGuidelineLinkFiltersButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        state.guidelineLinksInstitutionFilter = '';
        state.guidelineLinksStrategyFilter = '';
        state.guidelineLinksSearch = '';
        render();
        return;
      }
      const deleteGuidelineLinkButton = target.closest('[data-action="delete-guideline-link"]');
      if (deleteGuidelineLinkButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        const linkId = String(deleteGuidelineLinkButton.dataset.linkId || '').trim();
        if (!linkId) return;
        if (!window.confirm('Ar tikrai norite pasalinti si strategini rysi?')) return;
        await runBusy(async () => {
          await api(`/api/v1/meta-admin/guideline-links/${encodeURIComponent(linkId)}`, {
            method: 'DELETE'
          });
          setNotice('Strateginis rysis pasalintas.');
          await loadOverview();
        });
        return;
      }
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
        return;
      }
      const toggleMembershipAddButton = target.closest('[data-action="toggle-membership-add-panel"]');
      if (toggleMembershipAddButton instanceof HTMLElement) {
        event.preventDefault();
        event.stopPropagation();
        const userId = String(toggleMembershipAddButton.dataset.userId || '').trim();
        if (!userId) return;
        state.membershipAddTargetUserId = state.membershipAddTargetUserId === userId ? '' : userId;
        render();
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
        setNotice(`Vartotojo statusas pakeistas i ${nextStatus}.`);
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
        setNotice(`Narystes statusas pakeistas i ${nextStatus}.`);
        await loadOverview();
      });
    });
  });

  root.querySelectorAll('.meta-membership-add-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const userId = String(form.dataset.userId || '').trim();
      const formData = new FormData(form);
      const institutionId = String(formData.get('institutionId') || '').trim();
      const role = String(formData.get('role') || '').trim();
      if (!userId || !institutionId || !role) return;
      await addMembershipForUser(userId, institutionId, role);
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
        setNotice('Institucijos pavadinimas atnaujintas.');
        await loadOverview();
      });
    });
  });

  root.querySelectorAll('.strategy-rename-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const strategyId = String(form.dataset.strategyId || '').trim();
      const title = String(new FormData(form).get('title') || '').trim();
      if (!strategyId || !title) return;

      await runBusy(async () => {
        await api(`/api/v1/meta-admin/strategies/${encodeURIComponent(strategyId)}`, {
          method: 'PUT',
          body: { title }
        });
        setNotice('Strategijos pavadinimas atnaujintas.');
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



