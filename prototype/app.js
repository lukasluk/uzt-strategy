const steps = [
  {
    id: 'guidelines',
    title: 'Gaires',
    hint: 'Aptarimas, balsavimas, komentarai',
    prompt: 'Kur link judesime ir kokia nauda kursime?'
  }
];

const introSlides = [
  {
    title: '1. Kas tai per sistema',
    body: 'Tai UZT skaitmenizacijos gairiu vertinimo ir komentavimo irankis. Kiekviena gaire vertinama atskirai, o komentarai kaupiami vienoje vietoje.'
  },
  {
    title: '2. Kaip vyksta balsavimas',
    body: 'Kiekvienas vartotojas turi 10 balsu ir gali paskirstyti juos tarp gairiu (0-5 vienai gairei). Kaireje esantis floating blokas rodo, kiek balsu liko.'
  },
  {
    title: '3. Kaip uzdaromas etapas',
    body: 'Paspaudus Patvirtinti balsus, vartotojo balsai uzfiksuojami. Administravimas vyksta atskirame Admin puslapyje.'
  }
];

const storageKey = 'uzt-strategy-prototype';

if (!crypto.randomUUID) {
  crypto.randomUUID = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  };
}

const guidelineSeed = [
  { title: 'High quality products and services', desc: 'Klientu pasitenkinimo lygio matavimas NPS.', featured: true },
  { title: 'AI with purpose', desc: 'DI sprendimai itraukiami i procesus tik ivertinus ju nauda.', featured: true },
  { title: 'Data governance', desc: 'Duomenu valdymas uztikrina kokybe ir prieinamuma.', featured: true },
  { title: 'Coherence (SADM, VSSA, VDA, NKSC)', desc: 'Suderinamumas su platesniu kontekstu.' },
  { title: 'Robust IT infrastructure', desc: 'Patikima ir saugi IT infrastruktura.' },
  { title: 'Simplicity', desc: 'Priimami kuo paprastesni ir elegantiski technologiniai sprendimai.' },
  { title: 'EU centric', desc: 'Prioritetizuojami EU sukurti sprendimai.' },
  { title: 'SME Leadership', desc: 'Veiklos specialistu itraukimas i sprendimu priemima.' },
  { title: 'PES network', desc: 'PES tinklo isnaudojimas ir dalinimasis IT ziniomis.' },
  { title: 'Inhouse development', desc: 'Balansas tarp perkamu ir savadarbiu sprendimu.' },
  { title: 'Security', desc: 'Saugumui skiriama ypac didele svarba.' },
  { title: 'Modern workstation', desc: 'Moderni darbo vieta ir iranga.' }
];

const defaultData = {
  sessionName: 'UZT Skaitmenizacijos Strategija',
  currentStep: 'guidelines',
  guideSlideIndex: 0,
  guidelineBudget: 10,
  currentUser: null,
  users: [],
  blockedUsers: {},
  submittedUsers: {},
  resultsPublished: false,
  cards: {
    guidelines: guidelineSeed.map((item) => ({
      id: crypto.randomUUID(),
      title: item.title,
      desc: item.desc,
      featured: Boolean(item.featured),
      comments: [],
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
    merged.cards.guidelines = merged.cards.guidelines.map((g) => {
      const copy = { ...g };
      if ('tags' in copy) delete copy.tags;
      return copy;
    });
    if (!Array.isArray(merged.users)) merged.users = [];
    if (!merged.blockedUsers || typeof merged.blockedUsers !== 'object') merged.blockedUsers = {};
    if (!merged.submittedUsers || typeof merged.submittedUsers !== 'object') merged.submittedUsers = {};
    return merged;
  } catch {
    return structuredClone(defaultData);
  }
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function currentUserKey() {
  return data.currentUser?.name?.trim() || '';
}

function setStep(stepId) {
  data.currentStep = stepId;
  save();
  render();
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

  const adminLink = document.createElement('a');
  adminLink.className = 'step-pill admin-pill';
  adminLink.href = 'admin.html';
  adminLink.innerHTML = '<h4>Admin</h4><p>Atskiras administravimo puslapis</p>';
  elements.steps.appendChild(adminLink);
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

function renderStepView() {
  const cards = data.cards.guidelines;
  const userKey = currentUserKey();
  const budget = data.guidelineBudget || 10;
  const used = userKey ? cards.reduce((sum, card) => sum + (card.votesByUser?.[userKey] || 0), 0) : 0;
  const remaining = Math.max(0, budget - used);
  const slideIndex = Math.min(introSlides.length - 1, data.guideSlideIndex || 0);
  const slide = introSlides[slideIndex];

  elements.stepView.innerHTML = `
    <div class="step-header">
      <h2>Gaires</h2>
      <div class="header-stack">
        <span class="tag">Tavo balsai: ${remaining} / ${budget}</span>
        ${data.resultsPublished ? '<span class="tag tag-main">Rezultatai paskelbti</span>' : ''}
      </div>
    </div>
    <p class="prompt">Kur link judesime ir kokia nauda kursime?</p>

    <div class="card intro-card" style="margin-bottom: 16px;">
      <div class="header-row">
        <strong>${slide.title}</strong>
        <span class="tag">Skaidre ${slideIndex + 1} / ${introSlides.length}</span>
      </div>
      ${renderSlideIllustration(slideIndex)}
      <p class="prompt" style="margin-bottom: 10px;">${slide.body}</p>
      <div class="slide-controls">
        <button id="slidePrev" class="slide-nav" aria-label="Ankstesne skaidre" ${slideIndex === 0 ? 'disabled' : ''}>‹</button>
        <div class="slide-dots">
          ${introSlides.map((_, idx) => `<button class="slide-dot ${idx === slideIndex ? 'active' : ''}" data-action="goto-slide" data-index="${idx}" aria-label="Skaidre ${idx + 1}"></button>`).join('')}
        </div>
        <button id="slideNext" class="slide-nav" aria-label="Kita skaidre" ${slideIndex === introSlides.length - 1 ? 'disabled' : ''}>›</button>
      </div>
    </div>

    <div class="card-list">
      ${cards.map((card) => renderGuidelineCard(card)).join('')}
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="header-row">
        <strong>Nauja gaire</strong>
        <span class="tag">Siulymas</span>
      </div>
      <p class="prompt" style="margin-bottom: 10px;">Siulykite papildomas gaires, kurios turetu buti itrauktos.</p>
      <form id="guidelineAddForm">
        <div class="form-row">
          <input type="text" name="title" placeholder="Gaires pavadinimas" required />
        </div>
        <textarea name="desc" placeholder="Trumpas paaiskinimas"></textarea>
        <button class="btn btn-primary" type="submit" style="margin-top: 12px;">Prideti gaire</button>
      </form>
    </div>
  `;

  bindGuidelinesEvents();
}

function renderGuidelineCard(card) {
  const userKey = currentUserKey();
  const userScore = userKey ? card.votesByUser?.[userKey] || 0 : 0;
  const isLocked = userKey ? Boolean(data.submittedUsers[userKey]) : false;
  const totalScore = Object.values(card.votesByUser || {}).reduce((sum, value) => sum + value, 0);
  const comments = (card.comments || []).map((item) => `<li>${item}</li>`).join('');
  const voteBreakdown = data.resultsPublished
    ? `<ul class="mini-list">${Object.entries(card.votesByUser || {}).map(([name, score]) => `<li>${name}: ${score}</li>`).join('') || '<li>Nera balsu.</li>'}</ul>`
    : '';

  return `
    <article class="card ${card.featured ? 'featured' : ''}">
      <div class="card-title">
        <div>
          <div class="title-row">
            <h4>${card.title}</h4>
            ${card.featured ? '<span class="tag tag-main">Pagrindine</span>' : ''}
          </div>
          <p>${card.desc || 'Be paaiskinimo'}</p>
        </div>
        <div class="vote-panel">
          <span class="vote-label">Tavo balas</span>
          <div class="vote-controls">
            <button class="vote-btn" data-action="vote-minus" data-id="${card.id}" ${(userScore <= 0 || isLocked) ? 'disabled' : ''}>-</button>
            <span class="vote-score">${userScore}</span>
            <button class="vote-btn" data-action="vote-plus" data-id="${card.id}" ${(userScore >= 5 || isLocked) ? 'disabled' : ''}>+</button>
          </div>
          ${isLocked ? '<div class="vote-total"><strong>Balsai patvirtinti</strong></div>' : ''}
          ${data.resultsPublished ? `<div class="vote-total">Bendras balas: <strong>${totalScore}</strong></div>` : ''}
        </div>
      </div>
      ${data.resultsPublished ? `<div class="card-section"><strong>Visu balsai</strong>${voteBreakdown}</div>` : ''}
      <div class="card-section">
        <strong>Komentarai</strong>
        <ul class="mini-list">${comments || '<li>Dar nera komentaru.</li>'}</ul>
        <form data-action="comment" data-id="${card.id}" class="inline-form">
          <input type="text" name="comment" placeholder="Irasykite komentara" required />
          <button class="btn btn-ghost" type="submit">Prideti</button>
        </form>
      </div>
    </article>
  `;
}

function bindGuidelinesEvents() {
  const addForm = elements.stepView.querySelector('#guidelineAddForm');
  const list = elements.stepView.querySelector('.card-list');
  const slidePrev = elements.stepView.querySelector('#slidePrev');
  const slideNext = elements.stepView.querySelector('#slideNext');

  if (slidePrev) {
    slidePrev.addEventListener('click', () => {
      data.guideSlideIndex = Math.max(0, (data.guideSlideIndex || 0) - 1);
      save();
      render();
    });
  }

  if (slideNext) {
    slideNext.addEventListener('click', () => {
      data.guideSlideIndex = Math.min(introSlides.length - 1, (data.guideSlideIndex || 0) + 1);
      save();
      render();
    });
  }

  elements.stepView.querySelectorAll('[data-action="goto-slide"]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number(el.dataset.index);
      if (!Number.isInteger(idx)) return;
      data.guideSlideIndex = Math.max(0, Math.min(introSlides.length - 1, idx));
      save();
      render();
    });
  });

  addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(addForm);
    const title = String(formData.get('title') || '').trim();
    if (!title) return;
    data.cards.guidelines.push({
      id: crypto.randomUUID(),
      title,
      desc: String(formData.get('desc') || '').trim(),
      featured: false,
      comments: [],
      votesByUser: {}
    });
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

  list.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const action = form.dataset.action;
    const id = form.dataset.id;
    if (action !== 'comment' || !id) return;
    event.preventDefault();

    const formData = new FormData(form);
    const value = String(formData.get('comment') || '').trim();
    if (!value) return;

    const card = data.cards.guidelines.find((item) => item.id === id);
    if (!card) return;
    card.comments = card.comments || [];
    card.comments.push(`${currentUserKey()}: ${value}`);
    save();
    render();
  });
}

function updateVote(cardId, delta) {
  const userKey = currentUserKey();
  if (!userKey) return;
  if (data.submittedUsers[userKey]) return;

  const card = data.cards.guidelines.find((item) => item.id === cardId);
  if (!card) return;

  const current = card.votesByUser?.[userKey] || 0;
  const budget = data.guidelineBudget || 10;
  const totalExcluding = data.cards.guidelines.reduce((sum, item) => {
    if (item.id === cardId) return sum;
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
  let text = `Strategija: ${data.sessionName}\n\nGaires\n`;
  const cards = data.cards.guidelines;
  if (!cards.length) return `${text}- (nera irasu)\n`;

  cards.forEach((card) => {
    const total = Object.values(card.votesByUser || {}).reduce((sum, value) => sum + value, 0);
    const votes = data.resultsPublished ? `, bendras balas: ${total}` : '';
    const comments = (card.comments || []).join(' | ') || '-';
    text += `- ${card.title}: ${card.desc || 'be paaiskinimo'}${votes}\n  komentarai: ${comments}\n`;
  });

  return text;
}

function exportSummary() {
  elements.summaryText.value = buildSummary();
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
      <span class="tag">Vartotojas</span>
    </div>
    <button id="switchUser" class="btn btn-ghost">Keisti vartotoja</button>
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
      <p class="prompt">Iveskite varda, kad galetumete balsuoti.</p>
      <form id="loginForm" class="login-form">
        <input type="text" name="name" placeholder="Vardas ir pavarde" required />
        ${loginError ? `<div class="error">${loginError}</div>` : ''}
        <button class="btn btn-primary" type="submit">Prisijungti</button>
      </form>
    </div>
  `;

  overlay.querySelector('#loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const name = String(formData.get('name') || '').trim();
    if (!name) return;
    if (data.blockedUsers[name]) {
      loginError = 'Sis vartotojas uzblokuotas administratoriaus.';
      render();
      return;
    }

    data.currentUser = { name, role: 'user' };
    if (!data.users.includes(name)) data.users.push(name);
    loginError = '';
    save();
    render();
  });
}

function renderVoteFloating() {
  let floating = document.getElementById('voteFloating');
  if (!floating) {
    floating = document.createElement('div');
    floating.id = 'voteFloating';
    floating.className = 'vote-floating';
    document.body.appendChild(floating);
  }

  const userKey = currentUserKey();
  if (!userKey) {
    floating.hidden = true;
    return;
  }

  const budget = data.guidelineBudget || 10;
  const used = data.cards.guidelines.reduce((sum, card) => sum + (card.votesByUser?.[userKey] || 0), 0);
  const remaining = Math.max(0, budget - used);
  const isLocked = Boolean(data.submittedUsers[userKey]);

  floating.hidden = false;
  floating.innerHTML = `
    <div class="vote-floating-inner">
      <div class="vote-floating-title">Liko balsu</div>
      <div class="vote-floating-count">${remaining} / ${budget}</div>
      <button id="confirmVotesBtn" class="btn btn-primary" ${isLocked ? 'disabled' : ''}>
        ${isLocked ? 'Balsai patvirtinti' : 'Patvirtinti balsus'}
      </button>
    </div>
  `;

  const confirmBtn = floating.querySelector('#confirmVotesBtn');
  if (confirmBtn && !isLocked) {
    confirmBtn.addEventListener('click', () => {
      data.submittedUsers[userKey] = new Date().toISOString();
      save();
      render();
    });
  }
}

function bindGlobal() {
  elements.exportPanel.hidden = true;

  elements.sessionName.addEventListener('input', (event) => {
    data.sessionName = event.target.value;
    save();
  });

  document.getElementById('exportBtn').addEventListener('click', exportSummary);
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
  renderVoteFloating();
}

bindGlobal();
render();
