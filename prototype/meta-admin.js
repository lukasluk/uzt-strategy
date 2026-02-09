const META_ADMIN_STORAGE_KEY = 'uzt-strategy-meta-admin-password';
const root = document.getElementById('metaAdminRoot');

const state = {
  password: sessionStorage.getItem(META_ADMIN_STORAGE_KEY) || '',
  authenticated: false,
  loading: false,
  busy: false,
  error: '',
  notice: '',
  overview: null,
  lastInviteToken: ''
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

function toUserMessage(error) {
  const raw = String(error?.message || error || '').trim();
  const map = {
    forbidden: 'Neteisingas slaptažodis arba neleidžiama operacija.',
    'name required': 'Įveskite institucijos pavadinimą.',
    'invalid slug': 'Netinkamas slug.',
    'slug already exists': 'Toks institucijos slug jau egzistuoja.',
    'institutionId and email required': 'Pasirinkite instituciją ir įveskite el. paštą.',
    'invalid role': 'Netinkamas vaidmuo.',
    'userId and valid status required': 'Netinkami vartotojo statuso duomenys.',
    'membershipId and valid status required': 'Netinkami narystės statuso duomenys.'
  };
  return map[raw] || raw || 'Nepavyko įvykdyti užklausos.';
}

async function api(path, { method = 'GET', body = null } = {}) {
  if (!state.password) throw new Error('forbidden');
  const headers = {
    'x-meta-admin-password': encodeURIComponent(state.password)
  };
  if (body !== null) headers['Content-Type'] = 'application/json';

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

async function authenticate(password) {
  const response = await fetch('/api/v1/meta-admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  if (!state.password) {
    render();
    return;
  }

  state.loading = true;
  state.error = '';
  render();
  try {
    await authenticate(state.password);
    state.authenticated = true;
    await loadOverview();
  } catch (error) {
    state.authenticated = false;
    state.overview = null;
    state.error = toUserMessage(error);
    sessionStorage.removeItem(META_ADMIN_STORAGE_KEY);
    state.password = '';
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
    <section class="card" style="max-width: 620px; margin: 30px auto;">
      <h2 style="font-family: 'Fraunces', serif;">Meta Admin prisijungimas</h2>
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
      state.password = password;
      sessionStorage.setItem(META_ADMIN_STORAGE_KEY, password);
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
    return '<div class="card"><p class="prompt">Dar nėra vartotojų.</p></div>';
  }

  return users.map((user) => {
    const membershipRows = (user.memberships || []).map((membership) => `
      <li>
        <strong>${escapeHtml(membership.institutionName)} (${escapeHtml(membership.institutionSlug)})</strong>
        <span class="tag">${escapeHtml(membership.role)}</span>
        <span class="tag">${escapeHtml(membership.status)}</span>
        <button class="btn btn-ghost" data-action="toggle-membership-status" data-membership-id="${escapeHtml(membership.id)}" data-next-status="${membership.status === 'active' ? 'blocked' : 'active'}" ${state.busy ? 'disabled' : ''}>
          ${membership.status === 'active' ? 'Blokuoti narystę' : 'Aktyvuoti narystę'}
        </button>
      </li>
    `).join('');

    return `
      <article class="card">
        <div class="header-row">
          <strong>${escapeHtml(user.displayName || user.email)}</strong>
          <span class="tag">${escapeHtml(user.status)}</span>
        </div>
        <p class="prompt">${escapeHtml(user.email)}</p>
        <div class="inline-form">
          <button class="btn btn-ghost" data-action="toggle-user-status" data-user-id="${escapeHtml(user.id)}" data-next-status="${user.status === 'active' ? 'blocked' : 'active'}" ${state.busy ? 'disabled' : ''}>
            ${user.status === 'active' ? 'Blokuoti vartotoją' : 'Aktyvuoti vartotoją'}
          </button>
        </div>
        <div class="card-section">
          <strong>Narystės</strong>
          <ul class="mini-list">${membershipRows || '<li>Nėra narysčių.</li>'}</ul>
        </div>
      </article>
    `;
  }).join('');
}

function renderDashboard() {
  const institutions = state.overview?.institutions || [];
  const users = state.overview?.users || [];
  const pendingInvites = state.overview?.pendingInvites || [];

  root.innerHTML = `
    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Meta Admin skydas</strong>
        <span class="tag">Globalus valdymas</span>
      </div>
      <p class="prompt">Prieiga saugoma meta admin slaptažodžiu.</p>
      <div class="inline-form">
        <button id="refreshOverviewBtn" class="btn btn-ghost" ${state.busy ? 'disabled' : ''}>Atnaujinti duomenis</button>
        <button id="logoutMetaBtn" class="btn btn-ghost">Atsijungti</button>
      </div>
      ${state.notice ? `<p class="prompt" style="color:#1c1a16;">${escapeHtml(state.notice)}</p>` : ''}
    </section>

    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Nauja institucija</strong>
        <span class="tag">${institutions.length} institucijos</span>
      </div>
      <form id="createInstitutionForm">
        <div class="form-row">
          <input type="text" name="name" placeholder="Institucijos pavadinimas" required ${state.busy ? 'disabled' : ''}/>
          <input type="text" name="slug" placeholder="slug (pasirinktinai)" ${state.busy ? 'disabled' : ''}/>
        </div>
        <button class="btn btn-primary" type="submit" ${state.busy ? 'disabled' : ''}>Sukurti instituciją</button>
      </form>
    </section>

    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Nauji žmonės (invite)</strong>
        <span class="tag">Invite-only</span>
      </div>
      <form id="createInviteForm">
        <div class="form-row">
          <select name="institutionId" required ${state.busy ? 'disabled' : ''}>
            <option value="">Pasirinkite instituciją</option>
            ${institutions.map((institution) => `<option value="${escapeHtml(institution.id)}">${escapeHtml(institution.name)} (${escapeHtml(institution.slug)})</option>`).join('')}
          </select>
          <select name="role" required ${state.busy ? 'disabled' : ''}>
            <option value="member">member</option>
            <option value="institution_admin">institution_admin</option>
          </select>
        </div>
        <div class="form-row">
          <input type="text" name="email" placeholder="El. paštas" required ${state.busy ? 'disabled' : ''}/>
        </div>
        <button class="btn btn-primary" type="submit" ${state.busy ? 'disabled' : ''}>Sukurti kvietimą</button>
      </form>
      ${state.lastInviteToken ? `
        <div class="card" style="margin-top: 12px;">
          <strong>Naujausias kvietimo žetonas</strong>
          <p class="prompt" style="word-break: break-all;">${escapeHtml(state.lastInviteToken)}</p>
          <button id="copyInviteTokenBtn" class="btn btn-ghost">Kopijuoti žetoną</button>
        </div>
      ` : ''}
    </section>

    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Laukiantys kvietimai</strong>
        <span class="tag">${pendingInvites.length}</span>
      </div>
      <ul class="mini-list">
        ${pendingInvites.length
          ? pendingInvites.map((invite) => `
              <li>
                <strong>${escapeHtml(invite.email)}</strong>
                <span class="tag">${escapeHtml(invite.role)}</span>
                <span class="muted">${escapeHtml(invite.institutionName)} (${escapeHtml(invite.institutionSlug)})</span>
              </li>
            `).join('')
          : '<li>Nėra laukiančių kvietimų.</li>'}
      </ul>
    </section>

    <section class="card">
      <div class="header-row">
        <strong>Visi vartotojai</strong>
        <span class="tag">${users.length}</span>
      </div>
      <div class="card-list">
        ${renderUsers(users)}
      </div>
    </section>
  `;

  bindDashboardEvents();
}

function bindDashboardEvents() {
  const refreshBtn = document.getElementById('refreshOverviewBtn');
  const logoutBtn = document.getElementById('logoutMetaBtn');
  const createInstitutionForm = document.getElementById('createInstitutionForm');
  const createInviteForm = document.getElementById('createInviteForm');
  const copyInviteTokenBtn = document.getElementById('copyInviteTokenBtn');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await runBusy(async () => {
        await loadOverview();
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      state.password = '';
      state.authenticated = false;
      state.overview = null;
      state.error = '';
      state.notice = '';
      sessionStorage.removeItem(META_ADMIN_STORAGE_KEY);
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
        state.lastInviteToken = String(payload.inviteToken || '');
        state.notice = 'Kvietimas sukurtas.';
        await loadOverview();
        createInviteForm.reset();
      });
    });
  }

  if (copyInviteTokenBtn) {
    copyInviteTokenBtn.addEventListener('click', async () => {
      if (!state.lastInviteToken) return;
      await navigator.clipboard.writeText(state.lastInviteToken);
      state.notice = 'Kvietimo žetonas nukopijuotas.';
      render();
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
