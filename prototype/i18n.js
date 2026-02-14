(function () {
  const STORAGE_KEY = 'uzt-strategy-v1-lang';
  const QUERY_KEY = 'lang';
  const SUPPORTED = new Set(['lt', 'en']);

  const UI_STRINGS = {
    lt: {
      language: 'Kalba'
    },
    en: {
      language: 'Language'
    }
  };

  const EXACT_TEXT_EN = new Map([
    ['Gairės', 'Guidelines'],
    ['Iniciatyvos', 'Initiatives'],
    ['Admin', 'Admin'],
    ['Strategijų žemėlapis', 'Strategy map'],
    ['Naudojimosi gidas', 'User guide'],
    ['Apie', 'About'],
    ['Prisijungti', 'Sign in'],
    ['Atsijungti', 'Sign out'],
    ['Uždaryti', 'Close'],
    ['Eksportuoti santrauką', 'Export summary'],
    ['Kopijuoti tekstą', 'Copy text'],
    ['Atsisiųsti JSON', 'Download JSON'],
    ['Santrauka', 'Summary'],
    ['Kraunami duomenys...', 'Loading data...'],
    ['Bandyti dar kartą', 'Try again'],
    ['Pasirinkite instituciją', 'Select an institution'],
    ['Viešas režimas', 'Public mode'],
    ['Narys', 'Member'],
    ['Administratorius', 'Administrator'],
    ['Balsų biudžetas', 'Vote budget'],
    ['Rodyti', 'Show'],
    ['Slėpti', 'Hide'],
    ['Išsaugoti', 'Save'],
    ['Ištrinti', 'Delete'],
    ['Sukurti kvietimą', 'Create invite'],
    ['Atnaujinti būseną', 'Update status'],
    ['Paskelbti rezultatus', 'Publish results'],
    ['Klaida', 'Error'],
    ['Prieiga negauta', 'Access denied'],
    ['Admin prisijungimas', 'Admin sign in'],
    ['Globalus valdymas', 'Global management'],
    ['Meta Admin', 'Meta Admin'],
    ['Nėra duomenų', 'No data'],
    ['Nėra dalyvių.', 'No participants.'],
    ['Data nenurodyta', 'Date not provided'],
    ['Komentarai', 'Comments'],
    ['Skaitmenizacijos strategijos dirbtuvės', 'Digital strategy workshop'],
    ['Strategijos struktūra', 'Strategy structure'],
    ['Misija', 'Mission'],
    ['Vizija', 'Vision'],
    ['Įgyvendinimo planas', 'Implementation plan'],
    ['Tėvinės', 'Parent'],
    ['Vaikinės', 'Child'],
    ['Veiksmų idėjos', 'Action ideas'],
    ['Prioritetai', 'Priorities'],
    ['Etapas 1', 'Stage 1'],
    ['Etapas 2', 'Stage 2'],
    ['Bendri', 'General'],
    ['Vartotojai', 'Users'],
    ['Bendri nustatymai', 'General settings'],
    ['Kvietimai nariams', 'Member invites'],
    ['Dalyviai', 'Participants'],
    ['Pridėti gaires', 'Add guideline'],
    ['Pridėti iniciatyvą', 'Add initiative'],
    ['Gairių redagavimas ir komentarų moderavimas', 'Guideline editing and comment moderation'],
    ['Iniciatyvų redagavimas ir komentarų moderavimas', 'Initiative editing and comment moderation'],
    ['Komentarų moderavimas (gairė)', 'Comment moderation (guideline)'],
    ['Komentarų moderavimas (iniciatyva)', 'Comment moderation (initiative)'],
    ['Komentarų dar nėra.', 'No comments yet.'],
    ['Rezultatai vieši', 'Results are public'],
    ['Rezultatai nevieši', 'Results are private'],
    ['Paslėpti rezultatus', 'Hide results'],
    ['Atnaujinti slaptažodį', 'Update password'],
    ['Ištrinti vartotoją', 'Delete user'],
    ['Naujas slaptažodis (min. 8)', 'New password (min. 8)'],
    ['Į viešą puslapį', 'Public page'],
    ['Sukurti', 'Create'],
    ['Atnaujinti', 'Update'],
    ['Būsena', 'Status'],
    ['Atkurti vaizdą', 'Center view'],
    ['Centruoti vaizdą', 'Center view'],
    ['Pilnas ekranas', 'Fullscreen'],
    ['Išjungti pilno ekrano režimą', 'Exit fullscreen'],
    ['Įjungti pilno ekrano režimą', 'Enter fullscreen'],
    ['Kraunamas strategijų žemėlapis...', 'Loading strategy map...'],
    ['Strategijų žemėlapis dar tuščias', 'Strategy map is still empty'],
    ['Kai institucijos turės strategijas, jos atsiras šiame žemėlapyje.', 'When institutions have strategies, they will appear on this map.'],
    ['Žemėlapyje rodoma tik viršuje pasirinktos institucijos strategija.', 'Only the strategy of the currently selected institution is shown in the map.'],
    ['Strategijos ciklo būsena', 'Strategy cycle status'],
    ['Rodyti aprašymą ir komentarus', 'Show description and comments'],
    ['Dar nebalsuota', 'No votes yet'],
    ['Aprašymas nepateiktas.', 'Description not provided.'],
    ['Skaitmenizacijos strategija', 'Digital strategy'],
    ['Elementas', 'Item'],
    ['Strategijų žemėlapis by digistrategy.eu', 'Strategy map by digistrategy.eu']
  ]);

  const RULES_EN = [
    [/^Institucija:\s*/u, 'Institution: '],
    [/^Ciklas:\s*/u, 'Cycle: '],
    [/^Būsena:\s*/u, 'Status: '],
    [/^Gairės:\s*/u, 'Guidelines: '],
    [/^Iniciatyvos:\s*/u, 'Initiatives: '],
    [/^Komentarai:\s*/u, 'Comments: '],
    [/^Dalyviai:\s*/u, 'Participants: '],
    [/^Bendri nustatymai$/u, 'General settings'],
    [/^Kvietimai nariams$/u, 'Member invites'],
    [/^Dalyviai$/u, 'Participants'],
    [/^Pridėti gaires$/u, 'Add guideline'],
    [/^Pridėti iniciatyvą$/u, 'Add initiative'],
    [/^Gairių redagavimas ir komentarų moderavimas$/u, 'Guideline editing and comment moderation'],
    [/^Iniciatyvų redagavimas ir komentarų moderavimas$/u, 'Initiative editing and comment moderation'],
    [/^Balsuotojų:\s*/u, 'Voters: '],
    [/^Bendras balas:\s*/u, 'Total score: '],
    [/^Tavo balsas/u, 'Your vote'],
    [/^Tavo balsai:\s*/u, 'Your votes: '],
    [/^El\. paštas:\s*/u, 'Email: '],
    [/^Ryšys:\s*/u, 'Relation: '],
    [/^Balas:\s*/u, 'Score: '],
    [/^Balsavo$/u, 'Voted'],
    [/^Nebalsavo$/u, 'Not voted'],
    [/^Kvietimo žetonas/u, 'Invite token'],
    [/^Naujas kvietimo žetonas/u, 'New invite token'],
    [/^Kopijuoti žetoną$/u, 'Copy token'],
    [/^Nario el\. paštas$/u, 'Member email'],
    [/^Sukurti kvietimą$/u, 'Create invite'],
    [/^Atsisiųsti JSON$/u, 'Download JSON'],
    [/^Kopijuoti tekstą$/u, 'Copy text'],
    [/^Eksportuoti santrauką$/u, 'Export summary'],
    [/^Gairės pavadinimas$/u, 'Guideline title'],
    [/^Iniciatyvos pavadinimas$/u, 'Initiative title'],
    [/^Trumpas paaiškinimas$/u, 'Short description'],
    [/^Aprašymas$/u, 'Description'],
    [/^Prisijungimas$/u, 'Sign in'],
    [/^Kvietimo priėmimas$/u, 'Invite acceptance'],
    [/^Kvietimo žetonas$/u, 'Invite token'],
    [/^Vardas ir pavardė$/u, 'Full name'],
    [/^Sukurkite slaptažodį \(min\. 8\)$/u, 'Create password (min 8)'],
    [/^Prisijungęs vartotojas$/u, 'Signed in user'],
    [/^Kraunami administravimo duomenys\.\.\.$/u, 'Loading admin data...'],
    [/^Prieiga negauta$/u, 'Access denied'],
    [/^Nepavyko įkelti duomenų$/u, 'Failed to load data'],
    [/^Bandyti dar kartą$/u, 'Try again'],
    [/^Admin prisijungimas$/u, 'Admin sign in'],
    [/^Prisijunkite kaip institucijos administratorius\.$/u, 'Sign in as an institution administrator.'],
    [/^Narys\? Grįžkite į viešą puslapį:/u, 'Member? Return to public page:'],
    [/^El\. paštas$/u, 'Email'],
    [/^Slaptažodis$/u, 'Password'],
    [/^Nuo krypties iki konkrečių veiklų\.$/u, 'From direction to concrete actions.'],
    [/^Platformos apimtis: „Gairės“ ir „Iniciatyvos“ etapai\.$/u, 'Platform scope: "Guidelines" and "Initiatives" stages.'],
    [/^Platformos apimtis:\s*/u, 'Platform scope: '],
    [/^Peržiūrėkite pasirinktos institucijos strategijos sluoksnius\.\s*Iniciatyvų sluoksnyje gairių kortelės lieka matomos, bet užrakintos\.$/u, 'Review selected institution strategy layers. In the initiatives layer, guideline cards remain visible, but locked.'],
    [/^Iniciatyva · Susieta su gairėmis:\s*/u, 'Initiative · Linked guidelines: '],
    [/^Admin: galite tempti gairių korteles$/u, 'Admin: you can drag guideline cards'],
    [/^Admin: galite tempti iniciatyvų korteles$/u, 'Admin: you can drag initiative cards'],
    [/^Nepavyko įkelti strategijų žemėlapio$/u, 'Failed to load strategy map'],
    [/^Nepavyko ikelti strategiju zemelapio$/u, 'Failed to load strategy map'],
    [/^Bandyti dar kartą$/u, 'Try again'],
    [/^Bandyti dar karta$/u, 'Try again']
  ];

  function normalizeLang(value) {
    const lang = String(value || '').trim().toLowerCase();
    return SUPPORTED.has(lang) ? lang : '';
  }

  function inferInitialLanguage() {
    const params = new URLSearchParams(window.location.search);
    const queryLang = normalizeLang(params.get(QUERY_KEY));
    if (queryLang) return queryLang;

    const storedLang = normalizeLang(localStorage.getItem(STORAGE_KEY));
    if (storedLang) return storedLang;

    const browserLang = normalizeLang((navigator.language || 'lt').slice(0, 2));
    return browserLang || 'lt';
  }

  const state = {
    lang: inferInitialLanguage(),
    observer: null
  };

  function t(key) {
    const langSet = UI_STRINGS[state.lang] || UI_STRINGS.lt;
    const fallbackSet = UI_STRINGS.lt;
    return langSet[key] || fallbackSet[key] || key;
  }

  function translateText(text) {
    const input = String(text || '');
    if (!input || state.lang === 'lt') return input;

    const exact = EXACT_TEXT_EN.get(input.trim());
    if (exact) {
      const leading = input.match(/^\s*/u)?.[0] || '';
      const trailing = input.match(/\s*$/u)?.[0] || '';
      return `${leading}${exact}${trailing}`;
    }

    let output = input;
    RULES_EN.forEach(([pattern, replacement]) => {
      output = output.replace(pattern, replacement);
    });
    return output;
  }

  function localizeTextNode(node) {
    if (!(node instanceof Text)) return;
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    const parent = node.parentElement;
    if (!parent) return;
    const tag = parent.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
    if (parent.closest('[data-i18n-skip="1"]')) return;

    const translated = translateText(node.nodeValue);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }

  function localizeElementAttributes(element) {
    if (!(element instanceof Element)) return;
    if (element.closest('[data-i18n-skip="1"]')) return;
    ['placeholder', 'title', 'aria-label'].forEach((attr) => {
      const raw = element.getAttribute(attr);
      if (!raw) return;
      const translated = translateText(raw);
      if (translated !== raw) element.setAttribute(attr, translated);
    });
    if (element instanceof HTMLInputElement) {
      const type = String(element.type || '').toLowerCase();
      if (type === 'button' || type === 'submit') {
        const translated = translateText(element.value);
        if (translated !== element.value) element.value = translated;
      }
    }
  }

  function localizeDocument(root) {
    if (state.lang === 'lt') return;
    const scope = root instanceof Element || root instanceof Document ? root : document;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(localizeTextNode);

    const attrTargets = scope.querySelectorAll
      ? scope.querySelectorAll('[placeholder],[title],[aria-label],input[type="button"],input[type="submit"]')
      : [];
    attrTargets.forEach(localizeElementAttributes);
  }

  function refreshQueryLanguage(lang) {
    const params = new URLSearchParams(window.location.search);
    if (lang === 'lt') params.delete(QUERY_KEY);
    else params.set(QUERY_KEY, lang);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash || ''}`;
    window.history.replaceState(null, '', nextUrl);
  }

  function applyLanguage(lang, options) {
    const normalized = normalizeLang(lang) || 'lt';
    const opts = options || {};
    const force = Boolean(opts.force);
    if (!force && normalized === state.lang) return;

    state.lang = normalized;
    localStorage.setItem(STORAGE_KEY, state.lang);
    refreshQueryLanguage(state.lang);
    document.documentElement.setAttribute('lang', state.lang);

    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    if (state.lang !== 'lt') {
      state.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((added) => {
            if (added instanceof Text) localizeTextNode(added);
            else if (added instanceof Element) localizeDocument(added);
          });
          if (mutation.target instanceof Text) localizeTextNode(mutation.target);
          if (mutation.target instanceof Element) localizeElementAttributes(mutation.target);
        });
      });
      state.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      localizeDocument(document);
    }

    window.dispatchEvent(new CustomEvent('uzt-language-changed', { detail: { lang: state.lang } }));
  }

  function renderLanguageSwitch(host) {
    if (!(host instanceof Element)) return;
    host.innerHTML = `
      <label class="language-switch" data-i18n-skip="1">
        <span>${t('language')}</span>
        <select id="languageSwitchSelect" aria-label="${t('language')}">
          <option value="lt"${state.lang === 'lt' ? ' selected' : ''}>LT</option>
          <option value="en"${state.lang === 'en' ? ' selected' : ''}>EN</option>
        </select>
      </label>
    `;
    const select = host.querySelector('#languageSwitchSelect');
    if (!select) return;
    select.addEventListener('change', () => {
      const next = normalizeLang(select.value) || 'lt';
      applyLanguage(next);
      window.location.reload();
    });
  }

  function ensureFloatingLanguageSwitch() {
    if (document.querySelector('[data-language-switch]')) return;
    let floating = document.getElementById('floatingLanguageSwitch');
    if (!floating) {
      floating = document.createElement('div');
      floating.id = 'floatingLanguageSwitch';
      floating.className = 'language-switch-floating';
      floating.setAttribute('data-language-switch', '1');
      document.body.appendChild(floating);
    }
  }

  function mountLanguageSwitches() {
    const targets = Array.from(document.querySelectorAll('[data-language-switch]'));
    targets.forEach(renderLanguageSwitch);
  }

  function init() {
    document.documentElement.setAttribute('lang', state.lang);
    ensureFloatingLanguageSwitch();
    mountLanguageSwitches();
    applyLanguage(state.lang, { force: true });
    window.addEventListener('uzt-rendered', () => {
      mountLanguageSwitches();
      localizeDocument(document.body);
    });
  }

  window.DigiI18n = {
    getLanguage: () => state.lang,
    setLanguage: (lang) => applyLanguage(lang),
    t,
    localizeDocument
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
