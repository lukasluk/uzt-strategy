(() => {
  const AUTH_STORAGE_KEY = 'uzt-strategy-v1-auth';

  const form = document.getElementById('acceptInviteForm');
  const intro = document.getElementById('inviteIntro');
  const errorBox = document.getElementById('inviteError');
  const noticeBox = document.getElementById('inviteNotice');
  const emailInput = document.getElementById('acceptEmail');
  const displayNameInput = document.getElementById('acceptDisplayName');
  const displayNameLabel = document.getElementById('acceptDisplayNameLabel');
  const passwordInput = document.getElementById('acceptPassword');
  const passwordRepeatInput = document.getElementById('acceptPasswordRepeat');
  const passwordFields = Array.from(document.querySelectorAll('[data-accept-password]'));
  const submitButton = document.getElementById('acceptInviteSubmit');

  const token = String(new URLSearchParams(window.location.search).get('token') || '').trim();
  let institutionSlug = '';
  let inviteHasExistingUser = false;

  function showError(message) {
    noticeBox.style.display = 'none';
    noticeBox.textContent = '';
    errorBox.style.display = message ? 'block' : 'none';
    errorBox.textContent = message || '';
  }

  function showNotice(message) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
    noticeBox.style.display = message ? 'block' : 'none';
    noticeBox.textContent = message || '';
  }

  function setPasswordToggle(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    if (!button || !input) return;
    button.addEventListener('click', () => {
      const nextType = input.type === 'password' ? 'text' : 'password';
      input.type = nextType;
      button.textContent = nextType === 'password' ? 'Rodyti' : 'Slėpti';
      button.setAttribute('aria-label', nextType === 'password' ? 'Rodyti slaptažodį' : 'Slėpti slaptažodį');
    });
  }

  async function api(path, { method = 'GET', body = null } = {}) {
    const headers = {};
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
    if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
    return payload || {};
  }

  function toUserMessage(error) {
    const raw = String(error?.message || error || '').trim();
    const map = {
      'token required': 'Kvietimo nuoroda neteisinga.',
      'invite not found': 'Kvietimo nuoroda nerasta.',
      'invite revoked': 'Kvietimo nuoroda panaikinta.',
      'invite already used': 'Kvietimo nuoroda jau panaudota.',
      'invite expired': 'Kvietimo nuoroda nebegalioja.',
      'token and email required': 'Trūksta token arba el. pašto.',
      'displayName required for new user': 'Naujam vartotojui reikia įvesti slapyvardį.',
      'invite email mismatch': 'Įvestas el. paštas nesutampa su kvietimo el. paštu.',
      'password must be at least 8 chars': 'Slaptažodis turi būti bent 8 simbolių.'
    };
    return map[raw] || raw || 'Nepavyko aktyvuoti kvietimo.';
  }

  function setFormMode(existingUser, existingDisplayName) {
    inviteHasExistingUser = Boolean(existingUser);

    if (inviteHasExistingUser) {
      if (displayNameLabel) {
        displayNameLabel.textContent = 'Prisijungimo vardas / slapyvardis (neprivaloma)';
      }
      displayNameInput.required = false;
      if (!displayNameInput.value && existingDisplayName) {
        displayNameInput.value = existingDisplayName;
      }

      passwordInput.required = false;
      passwordRepeatInput.required = false;
      passwordInput.value = '';
      passwordRepeatInput.value = '';
      passwordFields.forEach((el) => { el.style.display = 'none'; });

      submitButton.textContent = 'Priimti kvietimą';
      showNotice('Rastas esamas vartotojas. Patvirtinkite duomenis ir prisijunkite prie papildomos institucijos.');
      return;
    }

    if (displayNameLabel) {
      displayNameLabel.textContent = 'Prisijungimo vardas / slapyvardis';
    }
    displayNameInput.required = true;
    passwordInput.required = true;
    passwordRepeatInput.required = true;
    passwordFields.forEach((el) => { el.style.display = ''; });
    submitButton.textContent = 'Aktyvuoti paskyrą';
    showNotice('Įveskite el. paštą, slapyvardį ir susikurkite slaptažodį.');
  }

  async function loadInviteInfo() {
    if (!token) {
      showError('Trūksta kvietimo token URL adrese.');
      form.querySelectorAll('input,button').forEach((el) => { el.disabled = true; });
      return;
    }

    try {
      const payload = await api(`/api/v1/invites/token-info?token=${encodeURIComponent(token)}`);
      institutionSlug = String(payload?.institution?.slug || '').trim();
      emailInput.value = String(payload?.email || '').trim();
      const institutionName = String(payload?.institution?.name || institutionSlug || 'institucija').trim();
      intro.textContent = `Institucija: ${institutionName}. Kvietimas galioja iki ${new Intl.DateTimeFormat('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(payload.expiresAt))}.`;

      const existing = payload?.existingUser || null;
      setFormMode(Boolean(existing?.id), String(existing?.displayName || '').trim());
    } catch (error) {
      showError(toUserMessage(error));
      form.querySelectorAll('input,button').forEach((el) => { el.disabled = true; });
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');

    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const displayName = String(fd.get('displayName') || '').trim();
    const password = String(fd.get('password') || '');
    const passwordRepeat = String(fd.get('passwordRepeat') || '');

    if (!email) {
      showError('Įveskite el. paštą.');
      return;
    }

    if (!inviteHasExistingUser) {
      if (!displayName || !password || !passwordRepeat) {
        showError('Užpildykite visus laukus.');
        return;
      }
      if (password.length < 8) {
        showError('Slaptažodis turi būti bent 8 simbolių.');
        return;
      }
      if (password !== passwordRepeat) {
        showError('Slaptažodžiai nesutampa.');
        return;
      }
    }

    submitButton.disabled = true;
    try {
      const body = { token, email };
      if (displayName) body.displayName = displayName;
      if (!inviteHasExistingUser) body.password = password;

      const payload = await api('/api/v1/invites/accept', {
        method: 'POST',
        body
      });

      const slug = String(payload?.institution?.slug || institutionSlug || '').trim();
      if (payload?.token) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          slug: slug || undefined,
          homeSlug: slug || undefined,
          token: payload.token,
          user: payload.user || null,
          role: payload.role || null
        }));
      }

      showNotice('Paskyra aktyvuota. Nukreipiame į sistemą...');
      setTimeout(() => {
        const target = slug ? `/index.html?institution=${encodeURIComponent(slug)}` : '/index.html';
        window.location.href = target;
      }, 700);
    } catch (error) {
      showError(toUserMessage(error));
      submitButton.disabled = false;
    }
  });

  setPasswordToggle('toggleAcceptPassword', 'acceptPassword');
  setPasswordToggle('toggleAcceptPasswordRepeat', 'acceptPasswordRepeat');
  loadInviteInfo();
})();
