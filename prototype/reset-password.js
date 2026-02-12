const root = document.getElementById('passwordResetRoot');
const token = String(new URLSearchParams(window.location.search).get('token') || '').trim();

const state = {
  loading: true,
  busy: false,
  validToken: false,
  success: false,
  notice: '',
  error: '',
  email: '',
  displayName: '',
  expiresAt: null
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
    'reset token required': 'Nerasta slaptažodžio keitimo nuoroda.',
    'reset token invalid': 'Nuoroda nebegalioja arba jau panaudota.',
    'password must be at least 8 chars': 'Slaptažodis turi būti bent 8 simbolių.',
    'too many requests': 'Per daug bandymų. Pabandykite šiek tiek vėliau.'
  };
  return map[raw] || raw || 'Nepavyko įvykdyti užklausos.';
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
  if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
  return payload || {};
}

async function bootstrap() {
  state.loading = true;
  state.error = '';
  state.notice = '';
  render();

  try {
    if (!token) throw new Error('reset token required');
    const payload = await api(`/api/v1/auth/password-reset/token-info?token=${encodeURIComponent(token)}`);
    state.validToken = true;
    state.email = String(payload?.email || '');
    state.displayName = String(payload?.displayName || '');
    state.expiresAt = payload?.expiresAt || null;
  } catch (error) {
    state.validToken = false;
    state.error = toUserMessage(error);
  } finally {
    state.loading = false;
    render();
  }
}

function render() {
  if (state.loading) {
    root.innerHTML = '<section class="card"><strong>Tikrinama nuoroda...</strong></section>';
    return;
  }

  if (!state.validToken || state.success) {
    root.innerHTML = `
      <section class="card">
        <h2 style="font-family: 'Fraunces', serif;">${state.success ? 'Slaptažodis pakeistas' : 'Nuoroda negalioja'}</h2>
        <p class="prompt">${escapeHtml(state.success ? 'Naujas slaptažodis išsaugotas. Galite prisijungti su naujais duomenimis.' : state.error || 'Nuoroda nebegalioja.')}</p>
        <a class="btn btn-primary" href="/index.html">Grįžti į sistemą</a>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="card">
      <h2 style="font-family: 'Fraunces', serif;">Slaptažodžio keitimas</h2>
      <p class="prompt">Vartotojas: <strong>${escapeHtml(state.displayName || state.email || 'N/A')}</strong></p>
      <p class="prompt">Galioja iki: <strong>${escapeHtml(formatDateTime(state.expiresAt))}</strong></p>
      ${state.notice ? `<p class="prompt">${escapeHtml(state.notice)}</p>` : ''}
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ''}
      <form id="passwordResetForm" class="login-form">
        <input type="password" name="password" placeholder="Naujas slaptažodis (min. 8)" minlength="8" required ${state.busy ? 'disabled' : ''} />
        <input type="password" name="passwordRepeat" placeholder="Pakartokite slaptažodį" minlength="8" required ${state.busy ? 'disabled' : ''} />
        <button type="submit" class="btn btn-primary" ${state.busy ? 'disabled' : ''}>Išsaugoti slaptažodį</button>
      </form>
    </section>
  `;

  const form = document.getElementById('passwordResetForm');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const password = String(fd.get('password') || '');
      const passwordRepeat = String(fd.get('passwordRepeat') || '');
      if (password !== passwordRepeat) {
        state.error = 'Slaptažodžiai nesutampa.';
        render();
        return;
      }

      state.busy = true;
      state.error = '';
      state.notice = '';
      render();
      try {
        await api('/api/v1/auth/password-reset/complete', {
          method: 'POST',
          body: { token, password }
        });
        state.success = true;
      } catch (error) {
        state.error = toUserMessage(error);
      } finally {
        state.busy = false;
        render();
      }
    });
  }
}
