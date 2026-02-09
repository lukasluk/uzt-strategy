const storageKey = 'uzt-strategy-prototype';
const adminPhrase = 'Bedarbystės ratas sukasi';
const root = document.getElementById('adminRoot');

let state = load();
let unlocked = false;

function load() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return {
      users: [],
      blockedUsers: {},
      submittedUsers: {},
      resultsPublished: false,
      cards: { guidelines: [] }
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.blockedUsers) parsed.blockedUsers = {};
    if (!parsed.submittedUsers) parsed.submittedUsers = {};
    if (!parsed.users) parsed.users = [];
    return parsed;
  } catch {
    return {
      users: [],
      blockedUsers: {},
      submittedUsers: {},
      resultsPublished: false,
      cards: { guidelines: [] }
    };
  }
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function renderLock() {
  root.innerHTML = `
    <section class="card" style="max-width: 560px; margin: 30px auto;">
      <h2 style="font-family: 'Fraunces', serif;">Admin prisijungimas</h2>
      <p class="prompt">Įveskite admin kodą, kad galėtumėte valdyti vartotojus ir gaires.</p>
      <form id="unlockForm" class="inline-form">
        <input type="password" name="phrase" placeholder="Admin kodas" required />
        <button type="submit" class="btn btn-primary">Atrakinti</button>
      </form>
    </section>
  `;

  document.getElementById('unlockForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const phrase = new FormData(event.target).get('phrase').trim();
    if (phrase !== adminPhrase) {
      alert('Neteisingas kodas.');
      return;
    }
    unlocked = true;
    render();
  });
}

function totalScore(g) {
  return Object.values(g.votesByUser || {}).reduce((sum, value) => sum + value, 0);
}

function renderAdmin() {
  const guidelines = state.cards?.guidelines || [];

  root.innerHTML = `
    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Vartotojų valdymas</strong>
        <span class="tag">${state.users.length} vartotojai</span>
      </div>
      <ul class="mini-list">
        ${state.users.length
          ? state.users.map((name) => `<li>
              <strong>${name}</strong>
              <span class="muted">${state.submittedUsers[name] ? 'Prabalsavo' : 'Neprabalsavo'}</span>
              <button class="btn btn-ghost" data-action="toggle-block" data-name="${name}">${state.blockedUsers[name] ? 'Atblokuoti' : 'Blokuoti'}</button>
              <button class="btn btn-ghost" data-action="remove-user" data-name="${name}">Pašalinti</button>
            </li>`).join('')
          : '<li>Nėra prisijungusių vartotojų.</li>'}
      </ul>
    </section>

    <section class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Rezultatų valdymas</strong>
        <span class="tag ${state.resultsPublished ? 'tag-main' : ''}">${state.resultsPublished ? 'Paskelbta' : 'Nepaskelbta'}</span>
      </div>
      <div class="inline-form">
        <button class="btn btn-primary" id="publishToggle">${state.resultsPublished ? 'Paslėpti rezultatus' : 'Pranešti rezultatus'}</button>
      </div>
    </section>

    <section class="card">
      <div class="header-row">
        <strong>Gairių administravimas</strong>
        <span class="tag">${guidelines.length} gairės</span>
      </div>
      <div class="card-list">
        ${guidelines.map((g) => `
          <article class="card ${g.featured ? 'featured' : ''}">
            <form class="admin-guideline-form" data-action="save-guideline" data-id="${g.id}">
              <input type="text" name="title" value="${g.title}" required />
              <textarea name="desc" placeholder="Aprašymas">${g.desc || ''}</textarea>
              <div class="inline-form">
                <button class="btn btn-primary" type="submit">Išsaugoti</button>
                <button class="btn btn-ghost" type="button" data-action="delete-guideline" data-id="${g.id}">Trinti</button>
                <span class="tag">Bendras balas: ${totalScore(g)}</span>
              </div>
            </form>
          </article>
        `).join('')}
      </div>
    </section>
  `;

  bindAdminEvents();
}

function bindAdminEvents() {
  document.getElementById('publishToggle').addEventListener('click', () => {
    state.resultsPublished = !state.resultsPublished;
    save();
    render();
  });

  root.querySelectorAll('[data-action="toggle-block"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      state.blockedUsers[name] = !state.blockedUsers[name];
      save();
      render();
    });
  });

  root.querySelectorAll('[data-action="remove-user"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      state.users = state.users.filter((u) => u !== name);
      delete state.submittedUsers[name];
      delete state.blockedUsers[name];
      (state.cards.guidelines || []).forEach((g) => {
        if (g.votesByUser) delete g.votesByUser[name];
      });
      save();
      render();
    });
  });

  root.querySelectorAll('[data-action="save-guideline"]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const id = form.dataset.id;
      const g = (state.cards.guidelines || []).find((item) => item.id === id);
      if (!g) return;

      const fd = new FormData(form);
      const title = String(fd.get('title') || '').trim();
      if (!title) return;
      g.title = title;
      g.desc = String(fd.get('desc') || '').trim();
      save();
      render();
    });
  });

  root.querySelectorAll('[data-action="delete-guideline"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      state.cards.guidelines = (state.cards.guidelines || []).filter((g) => g.id !== id);
      save();
      render();
    });
  });
}

function render() {
  if (!unlocked) {
    renderLock();
    return;
  }
  renderAdmin();
}

render();
