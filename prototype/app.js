const steps = [
  {
    id: 'guidelines',
    title: 'Gairės',
    hint: 'Aptarimas, balsavimas, papildymai',
    prompt: 'Kur link judėsime ir kokią naudą kursime?'
  }
];

const storageKey = 'uzt-strategy-prototype';
const adminCodeDefault = 'admin';

const guidelineSeed = [
  {
    title: 'High quality products and services',
    desc: 'Klientų pasitenkinimo lygio matavimas NPS.',
    featured: true
  },
  {
    title: 'AI with purpose',
    desc: 'DI sprendimai įtraukiami į procesus tik įvertinus jų naudą.',
    featured: true
  },
  {
    title: 'Data governance',
    desc: 'Duomenų valdysena užtikrina kokybišką duomenų gyvavimo ciklo priežiūrą ir duomenų prieinamumą.',
    featured: true
  },
  {
    title: 'Coherence (SADM, VSSA, VDA, NKSC)',
    desc: 'Suderinamumas su platesniu kontekstu.'
  },
  {
    title: 'Robust IT infrastructure',
    desc: 'Patikima ir saugi IT infrastruktūra.'
  },
  {
    title: 'Simplicity',
    desc: 'Priimami kaip įmanoma paprastesni / elegantiškesni technologiniai sprendimai.'
  },
  {
    title: 'EU centric',
    desc: 'Prioritetizuojami EU sukurti sprendimai.'
  },
  {
    title: 'SME Leadership',
    desc: 'Veiklos specialistų pritraukimas į sprendimų priėmimą.'
  },
  {
    title: 'PES network',
    desc: 'PES tinklo išnaudojimas ir dalinimasis IT žiniomis.'
  },
  {
    title: 'Inhouse development',
    desc: 'Balansas tarp perkamų ir savadarbių sprendimų.'
  },
  {
    title: 'Security',
    desc: 'Saugumui skiriama ypač didelė svarba.'
  },
  {
    title: 'Modern workstation',
    desc: 'Moderni darbo vieta ir įranga.'
  },
  {
    title: 'Communication',
    desc: ''
  },
  {
    title: 'UDTS',
    desc: ''
  },
  {
    title: 'Ethics',
    desc: ''
  },
  {
    title: 'Data maturity',
    desc: ''
  },
  {
    title: 'Data democratisation',
    desc: ''
  },
  {
    title: 'Lowcode / nocode',
    desc: ''
  },
  {
    title: 'Both way learning',
    desc: ''
  }
];

const defaultData = {
  sessionName: 'UŽT Strategijos Misija',
  currentStep: 'guidelines',
  guidelineBudget: 10,
  adminCode: adminCodeDefault,
  currentUser: null,
  resultsPublished: false,
  cards: {
    guidelines: guidelineSeed.map((item) => ({
      id: crypto.randomUUID(),
      title: item.title,
      desc: item.desc,
      tags: '',
      featured: Boolean(item.featured),
      comments: [],
      proposals: [],
      initiatives: [],
      votesByUser: {}
    }))
  }
};

const elements = {
  steps: document.getElementById('steps'),
  stepView: document.getElementById('stepView'),
  sessionName: document.getElementById('sessionName'),
  exportPanel: document.getElementById('exportPanel'),
  summaryText: document.getElementById('summaryText')
};

let data = load();
let loginError = '';

function load() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return structuredClone(defaultData);
  try {
    const parsed = JSON.parse(raw);
    const merged = {
      ...structuredClone(defaultData),
      ...parsed,
      cards: {
        ...structuredClone(defaultData.cards),
        ...parsed.cards
      }
    };
    if (!merged.cards.guidelines || merged.cards.guidelines.length === 0) {
      merged.cards.guidelines = structuredClone(defaultData.cards.guidelines);
    }
    if (typeof merged.guidelineBudget !== 'number') {
      merged.guidelineBudget = 10;
    }
    if (!merged.adminCode) {
      merged.adminCode = adminCodeDefault;
    }
    return merged;
  } catch {
    return structuredClone(defaultData);
  }
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function setStep(stepId) {
  data.currentStep = stepId;
  save();
  render();
}

function currentUserKey() {
  return data.currentUser?.name?.trim() || '';
}

function isAdmin() {
  return data.currentUser?.role === 'admin';
}

function renderSteps() {
  elements.steps.innerHTML = '';
  steps.forEach((step) => {
    const pill = document.createElement('button');
    pill.className = 'step-pill' + (data.currentStep === step.id ? ' active' : '');
    pill.innerHTML = `<h4>${step.title}</h4><p>${step.hint}</p>`;
    pill.addEventListener('click', () => setStep(step.id));
    elements.steps.appendChild(pill);
  });
}

function renderStepView() {
  const step = steps.find((item) => item.id === data.currentStep);
  const cards = data.cards[step.id];

  renderGuidelinesView(step, cards);
}

function renderGuidelinesView(step, cards) {
  const userKey = currentUserKey();
  const budget = data.guidelineBudget || 10;
  const used = userKey
    ? cards.reduce((sum, card) => sum + (card.votesByUser?.[userKey] || 0), 0)
    : 0;
  const remaining = Math.max(0, budget - used);

  elements.stepView.innerHTML = `
    <div class="step-header">
      <h2>${step.title}</h2>
      <div class="header-stack">
        <span class="tag">Tavo balsai: ${remaining} / ${budget}</span>
        ${data.resultsPublished ? '<span class="tag tag-main">Rezultatai paskelbti</span>' : ''}
      </div>
    </div>
    <p class="prompt">${step.prompt}</p>
    <div class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Nauja gairė</strong>
        <span class="tag">Siūlymas</span>
      </div>
      <p class="prompt" style="margin-bottom: 10px;">Siūlykite papildomas gaires, kurios turėtų būti įtrauktos.</p>
      <form id="guidelineAddForm">
        <div class="form-row">
          <input type="text" name="title" placeholder="Gairės pavadinimas" required />
          <input type="text" name="tags" placeholder="Žymos (pvz. klientas, vidus, duomenys)" />
        </div>
        <textarea name="desc" placeholder="Trumpas paaiškinimas"></textarea>
        <label class="checkbox-row">
          <input type="checkbox" name="featured" />
          Pagrindinė gairė
        </label>
        <button class="btn btn-primary" type="submit" style="margin-top: 12px;">Pridėti gairę</button>
      </form>
    </div>
    <div class="card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>Papildymas esamai</strong>
        <span class="tag">Pasiūlymas</span>
      </div>
      <p class="prompt" style="margin-bottom: 10px;">Pasiūlykite papildymą konkrečiai gairės formuluotei.</p>
      <form id="guidelineProposalForm">
        <div class="form-row">
          <select name="target" required>
            <option value="">Pasirinkti gairę</option>
            ${cards.map((card) => `<option value="${card.id}">${card.title}</option>`).join('')}
          </select>
          <input type="text" name="proposal" placeholder="Papildymo pasiūlymas" required />
        </div>
        <button class="btn btn-ghost" type="submit">Pridėti papildymą</button>
      </form>
    </div>
    ${isAdmin() ? `
      <div class="card admin-panel" style="margin-bottom: 16px;">
        <div class="header-row">
          <strong>Administratoriaus veiksmai</strong>
          <span class="tag tag-main">Admin</span>
        </div>
        <div class="inline-form">
          <button id="publishResults" class="btn btn-primary" ${data.resultsPublished ? 'disabled' : ''}>Pranešti rezultatus</button>
          <button id="editAdminCode" class="btn btn-ghost">Keisti admin kodą</button>
        </div>
      </div>
    ` : ''}
    <div class="card-list">
      ${cards.map((card) => renderGuidelineCard(card, remaining)).join('')}
    </div>
  `;

  bindGuidelinesEvents(cards);
}

function renderGuidelineCard(card) {
  const userKey = currentUserKey();
  const userScore = userKey ? card.votesByUser?.[userKey] || 0 : 0;
  const totalScore = Object.values(card.votesByUser || {}).reduce((sum, value) => sum + value, 0);
  const tags = card.tags
    ? card.tags.split(',').map((tag) => `<span class="tag">${tag.trim()}</span>`).join('')
    : '';
  const comments = (card.comments || []).map((item) => `<li>${item}</li>`).join('');
  const proposals = (card.proposals || []).map((item) => `<li>${item}</li>`).join('');
  const initiatives = (card.initiatives || []).map((item) => `
    <li>
      <strong>${item.action}</strong>
      <span class="muted">Rodiklis: ${item.kpi || '-'}</span>
      <span class="muted">Siūlė: ${item.by}</span>
    </li>
  `).join('');

  const voteBreakdown = data.resultsPublished
    ? `<ul class="mini-list">${Object.entries(card.votesByUser || {}).map(([name, score]) => `<li>${name}: ${score}</li>`).join('') || '<li>Nėra balsų.</li>'}</ul>`
    : '';

  return `
    <article class="card ${card.featured ? 'featured' : ''}">
      <div class="card-title">
        <div>
          <div class="title-row">
            <h4>${card.title}</h4>
            ${card.featured ? '<span class="tag tag-main">Pagrindinė</span>' : ''}
          </div>
          <p>${card.desc || 'Be paaiškinimo'}</p>
        </div>
        <div class="vote-panel">
          <span class="vote-label">Tavo balas</span>
          <div class="vote-controls">
            <button class="vote-btn" data-action="vote-minus" data-id="${card.id}" ${userScore <= 0 ? 'disabled' : ''}>-</button>
            <span class="vote-score">${userScore}</span>
            <button class="vote-btn" data-action="vote-plus" data-id="${card.id}" ${userScore >= 5 ? 'disabled' : ''}>+</button>
          </div>
          ${data.resultsPublished ? `<div class="vote-total">Bendras balas: <strong>${totalScore}</strong></div>` : ''}
        </div>
      </div>
      <div>${tags}</div>
      ${data.resultsPublished ? `
        <div class="card-section">
          <strong>Visų balsai</strong>
          ${voteBreakdown}
        </div>
      ` : ''}
      <div class="card-section">
        <strong>Komentarai</strong>
        <ul class="mini-list">${comments || '<li>Dar nėra komentarų.</li>'}</ul>
        <form data-action="comment" data-id="${card.id}" class="inline-form">
          <input type="text" name="comment" placeholder="Įrašykite komentarą" required />
          <button class="btn btn-ghost" type="submit">Pridėti</button>
        </form>
      </div>
      <div class="card-section">
        <strong>Papildymai</strong>
        <ul class="mini-list">${proposals || '<li>Dar nėra papildymų.</li>'}</ul>
        <form data-action="proposal" data-id="${card.id}" class="inline-form">
          <input type="text" name="proposal" placeholder="Papildymo pasiūlymas" required />
          <button class="btn btn-ghost" type="submit">Pridėti</button>
        </form>
      </div>
      <div class="card-section">
        <strong>Iniciatyvos padėsiančios pasiekti gairėje iškeltus tikslus</strong>
        <p class="prompt">Kokius veiksmus atliksime ir kokius rodiklius nusibrėšime kad pasiektume tikslą?</p>
        <ul class="mini-list">${initiatives || '<li>Dar nėra iniciatyvų.</li>'}</ul>
        <form data-action="initiative" data-id="${card.id}" class="inline-form">
          <input type="text" name="action" placeholder="Veiksmas" required />
          <input type="text" name="kpi" placeholder="Rodiklis / KPI" />
          <button class="btn btn-ghost" type="submit">Pridėti</button>
        </form>
      </div>
      ${isAdmin() ? renderAdminEdit(card) : ''}
    </article>
  `;
}

function renderAdminEdit(card) {
  return `
    <div class="card-section admin-edit">
      <strong>Redaguoti gairę</strong>
      <form data-action="admin-edit" data-id="${card.id}" class="inline-form">
        <input type="text" name="title" value="${card.title}" required />
        <input type="text" name="desc" value="${card.desc || ''}" placeholder="Paaiškinimas" />
        <input type="text" name="tags" value="${card.tags || ''}" placeholder="Žymos" />
        <label class="checkbox-row">
          <input type="checkbox" name="featured" ${card.featured ? 'checked' : ''} />
          Pagrindinė
        </label>
        <button class="btn btn-primary" type="submit">Išsaugoti</button>
      </form>
    </div>
  `;
}

function bindGuidelinesEvents() {
  const addForm = elements.stepView.querySelector('#guidelineAddForm');
  const proposalForm = elements.stepView.querySelector('#guidelineProposalForm');
  const list = elements.stepView.querySelector('.card-list');

  addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(addForm);
    const title = formData.get('title').trim();
    if (!title) return;
    data.cards.guidelines.push({
      id: crypto.randomUUID(),
      title,
      desc: formData.get('desc').trim(),
      tags: formData.get('tags').trim(),
      featured: Boolean(formData.get('featured')),
      comments: [],
      proposals: [],
      initiatives: [],
      votesByUser: {}
    });
    save();
    render();
  });

  proposalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(proposalForm);
    const targetId = formData.get('target');
    const text = formData.get('proposal').trim();
    if (!targetId || !text) return;
    const card = data.cards.guidelines.find((item) => item.id === targetId);
    if (!card) return;
    card.proposals = card.proposals || [];
    card.proposals.push(text);
    save();
    render();
  });

  list.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const action = form.dataset.action;
    const id = form.dataset.id;
    if (!action || !id) return;
    event.preventDefault();
    const formData = new FormData(form);

    const card = data.cards.guidelines.find((item) => item.id === id);
    if (!card) return;

    if (action === 'comment') {
      const value = formData.get('comment').trim();
      if (!value) return;
      card.comments = card.comments || [];
      card.comments.push(`${currentUserKey()}: ${value}`);
    }

    if (action === 'proposal') {
      const value = formData.get('proposal').trim();
      if (!value) return;
      card.proposals = card.proposals || [];
      card.proposals.push(`${currentUserKey()}: ${value}`);
    }

    if (action === 'initiative') {
      const actionText = formData.get('action').trim();
      if (!actionText) return;
      const kpi = formData.get('kpi').trim();
      card.initiatives = card.initiatives || [];
      card.initiatives.push({
        action: actionText,
        kpi,
        by: currentUserKey()
      });
    }

    if (action === 'admin-edit' && isAdmin()) {
      const title = formData.get('title').trim();
      if (!title) return;
      card.title = title;
      card.desc = formData.get('desc').trim();
      card.tags = formData.get('tags').trim();
      card.featured = Boolean(formData.get('featured'));
    }

    save();
    render();
  });

  list.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === 'vote-plus' || action === 'vote-minus') {
      updateVote(id, action === 'vote-plus' ? 1 : -1);
    }
  });

  if (isAdmin()) {
    const publishBtn = elements.stepView.querySelector('#publishResults');
    if (publishBtn) {
      publishBtn.addEventListener('click', () => {
        if (data.resultsPublished) return;
        data.resultsPublished = true;
        save();
        render();
      });
    }

    const editCodeBtn = elements.stepView.querySelector('#editAdminCode');
    if (editCodeBtn) {
      editCodeBtn.addEventListener('click', () => {
        const next = window.prompt('Naujas admin kodas:', data.adminCode || adminCodeDefault);
        if (!next) return;
        data.adminCode = next.trim();
        save();
      });
    }
  }
}

function updateVote(cardId, delta) {
  const userKey = currentUserKey();
  if (!userKey) return;
  const card = data.cards.guidelines.find((item) => item.id === cardId);
  if (!card) return;

  const current = card.votesByUser?.[userKey] || 0;
  const budget = data.guidelineBudget || 10;
  const totalExcluding = data.cards.guidelines.reduce((sum, item) => {
    if (item.id === cardId) return sum + (item.votesByUser?.[userKey] || 0) * 0;
    return sum + (item.votesByUser?.[userKey] || 0);
  }, 0);

  const maxAllowed = Math.min(5, budget - totalExcluding);
  const next = Math.min(maxAllowed, Math.max(0, current + delta));
  card.votesByUser = card.votesByUser || {};
  card.votesByUser[userKey] = next;
  save();
  render();
}

function buildSummary() {
  let text = `Strategija: ${data.sessionName}\n\n`;

  text += 'Gairės\n';
  const cards = data.cards.guidelines;
  if (!cards.length) {
    text += '- (nėra įrašų)\n\n';
    return text;
  }

  cards.forEach((card) => {
    const tags = card.tags ? ` [${card.tags}]` : '';
    const total = Object.values(card.votesByUser || {}).reduce((sum, value) => sum + value, 0);
    const votes = data.resultsPublished ? `, bendras balas: ${total}` : '';
    const extras = `\n  komentarai: ${(card.comments || []).join(' | ') || '-'}\n  papildymai: ${(card.proposals || []).join(' | ') || '-'}`;
    const initiatives = (card.initiatives || []).map((item) => `${item.action} (KPI: ${item.kpi || '-'}, siūlė: ${item.by})`).join(' | ');

    text += `- ${card.title}${tags}: ${card.desc || 'be aprašymo'}${votes}${extras}\n  iniciatyvos: ${initiatives || '-'}\n`;
  });

  return text;
}

function exportSummary() {
  const summary = buildSummary();
  elements.summaryText.value = summary;
  elements.exportPanel.hidden = false;
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'uzt-strategy.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

function renderUserBar() {
  const container = document.getElementById('userBar');
  if (!container) return;
  if (!data.currentUser) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="user-chip">
      <span>${data.currentUser.name}</span>
      <span class="tag ${isAdmin() ? 'tag-main' : ''}">${isAdmin() ? 'Admin' : 'Vartotojas'}</span>
    </div>
    <button id="switchUser" class="btn btn-ghost">Keisti vartotoją</button>
  `;

  container.querySelector('#switchUser').addEventListener('click', () => {
    data.currentUser = null;
    save();
    render();
  });
}

function renderLoginOverlay() {
  let overlay = document.getElementById('loginOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loginOverlay';
    overlay.className = 'login-overlay';
    document.body.appendChild(overlay);
  }

  if (data.currentUser) {
    overlay.hidden = true;
    return;
  }

  overlay.hidden = false;
  overlay.innerHTML = `
    <div class="login-card">
      <h2>Prisijungimas</h2>
      <p class="prompt">Įveskite vardą ir pasirinkite rolę.</p>
      <form id="loginForm" class="login-form">
        <input type="text" name="name" placeholder="Vardas ir pavardė" required />
        <select name="role">
          <option value="user">Darbuotojas</option>
          <option value="admin">Administratorius</option>
        </select>
        <input type="password" name="code" placeholder="Admin kodas" />
        ${loginError ? `<div class="error">${loginError}</div>` : ''}
        <button class="btn btn-primary" type="submit">Prisijungti</button>
      </form>
    </div>
  `;

  overlay.querySelector('#loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = formData.get('name').trim();
    const role = formData.get('role');
    const code = formData.get('code').trim();

    if (!name) return;

    if (role === 'admin' && code !== (data.adminCode || adminCodeDefault)) {
      loginError = 'Neteisingas admin kodas.';
      render();
      return;
    }

    data.currentUser = { name, role };
    loginError = '';
    save();
    render();
  });
}

function bindGlobal() {
  elements.exportPanel.hidden = true;

  elements.sessionName.addEventListener('input', (event) => {
    data.sessionName = event.target.value;
    save();
  });

  document.getElementById('exportBtn').addEventListener('click', exportSummary);
  document.getElementById('resetBtn').addEventListener('click', () => {
    data = structuredClone(defaultData);
    save();
    render();
  });

  document.getElementById('closeExport').addEventListener('click', () => {
    elements.exportPanel.hidden = true;
  });

  document.getElementById('copySummary').addEventListener('click', async () => {
    await navigator.clipboard.writeText(elements.summaryText.value);
  });

  document.getElementById('downloadJson').addEventListener('click', downloadJson);
}

function render() {
  renderSteps();
  renderStepView();
  renderUserBar();
  renderLoginOverlay();
}

bindGlobal();
render();
