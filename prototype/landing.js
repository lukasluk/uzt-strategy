(function () {
  const activeStrategyLinks = Array.from(document.querySelectorAll('[data-active-strategy-link]'));
  const workspaceLinks = Array.from(document.querySelectorAll('[data-workspace-link]'));
  const metricInstitutions = document.getElementById('metricInstitutions');
  const navLinks = Array.from(document.querySelectorAll('[data-scroll-link]'));
  const languageSelect = document.getElementById('landingLangSelect');
  const metaDescription = document.getElementById('landingMetaDescription');

  const SUPPORTED_LANGS = ['lt', 'en'];
  const DEFAULT_LANG = 'lt';
  const STORAGE_LANG_KEY = 'landing_lang';
  let currentLang = DEFAULT_LANG;
  let preferredStrategySlug = 'uzt';

  const adminLandingTranslations = {
    lt: {},
    en: {}
  };

  const BASE_TRANSLATIONS = {
    lt: {
      metaTitle: 'digistrategija.lt | Viesojo sektoriaus strategiju platforma',
      metaDescription: 'digistrategija.lt padeda institucijoms kartu kurti strategijas, susieti iniciatyvas ir viesinti pazanga.',
      navHow: 'Kaip tai veikia',
      navWhy: 'Kuo issiskiria',
      navTrust: 'Pasitikejimas',
      navLaunch: 'Pradeti',
      langLabel: 'Kalba',
      madeInEu: 'Made in EU',
      headerCta: 'Perziureti aktyvias strategijas',
      heroKicker: 'Public Strategy OS',
      heroTitle: 'Nuo ideju iki audituojamo igyvendinimo modernioms viesosioms institucijoms.',
      heroCopy: 'Kurkite gairiu strukturas, susiekite iniciatyvas, itraukite komandas i skaidru balsavima ir publikuokite strategiju zemelapius, kuriuos supranta visa bendruomene.',
      heroPrimaryCta: 'Perziureti aktyvias strategijas',
      heroSecondaryCta: 'Atidaryti darbo aplinka',
      metricInstitutionsLabel: 'Aktyvios institucijos',
      metricInviteLabel: 'Saugaus kvietimo galiojimas',
      metricMapLabel: 'Map-first vizualus planavimas',
      glassInstitutionLabel: 'Institucija',
      glassMainTitle: 'Skaitmenizacijos strategijos ciklas',
      glassMainCopy: 'Gaires, iniciatyvos, atsakomybes ir busena viename interaktyviame zemelapyje.',
      glassOutcomeLabel: 'Rezultato kontraktas',
      glassOutcomeTitle: 'Tikslas + terminas + irodymas',
      glassAuditLabel: 'Audituojamumas',
      glassAuditTitle: 'Sprendimu istorija matoma nuo pradzios iki pabaigos',
      backboneKicker: 'Europos skaitmeninis valdymas',
      backboneTitle: 'Patikimas pagrindas instituciju strategiju igyvendinimui.',
      backboneJokeQuestion: 'Sukurta Europoje Europai?',
      backboneMetric1Title: 'Multi-tenant',
      backboneMetric1Copy: 'Viena platforma, daug instituciju su rolemis atskirtu valdymu.',
      backboneMetric2Title: 'Audit trail',
      backboneMetric2Copy: 'Sprendimu kontekstas islieka matomas per visa strategijos cikla.',
      backboneMetric3Title: 'Public-ready',
      backboneMetric3Copy: 'View-only embed leidzia viesinti skaidriai ir islaikyti valdymo kontrole.',
      uspKicker: 'Isskirtine verte',
      uspTitle: 'Kuo tai daugiau nei planavimo lenta',
      feature1Title: 'Atskaitomybes laiko juosta',
      feature1Copy: 'Kiekvienas strateginis pakeitimas atsekamas: kas, kada ir kodel pakeite.',
      feature1Item1: 'Nekintama veiklos istorija',
      feature1Item2: 'Aiskus atsakomybiu perdavimas',
      feature1Item3: 'Greitesnes valdymo perziuros',
      feature2Title: 'Rezultatu kontraktai',
      feature2Copy: 'Paverskite kiekviena iniciatyva pamatuojamu isipareigojimu su baze, tikslu ir terminu.',
      feature2Item1: 'Maziau abstrakciu igyvendinimo planu',
      feature2Item2: 'Irodymais gristi busenos atnaujinimai',
      feature2Item3: 'Prioritetai susieti su poveikiu',
      feature3Title: 'Vieso pasitikejimo dashboard',
      feature3Copy: 'Integruokite strategijos zemelapi view-only rezimu i institucijos svetaine ar intraneta.',
      feature3Item1: 'Atskiri embed linkai pagal institucija',
      feature3Item2: 'Naudojimo stebesena admin aplinkoje',
      feature3Item3: 'Nuoseklus branding ir skaidrumas',
      flowKicker: 'Eiga',
      flowTitle: 'Kaip institucijos vykdo strategijos ciklus',
      flow1Title: 'Pakvieskite komandas pagal role',
      flow1Copy: 'Meta admin sukuria vienkartines pakvietimo nuorodas ir priskiria narystes pagal institucijas.',
      flow2Title: 'Suformuokite gairiu struktura',
      flow2Copy: 'Dalyviai siulo, diskutuoja, balsuoja ir tobulina strategines kryptis kartu.',
      flow3Title: 'Susiekite iniciatyvas su gairėmis',
      flow3Copy: 'Strategiju zemelapis parodo priklausomybes ir iskart isryskina nepriskirtus prioritetus.',
      flow4Title: 'Publikuokite ir stebekite',
      flow4Copy: 'Skelbkite view-only zemelapius viesai, o administratoriai stebi apkrova ir panaudojimo rodiklius.',
      trustKicker: 'Pasitikejimas pagal dizaina',
      trustTitle: 'Sukurta instituciniam valdymui, ne triuksmui',
      trustCopy: 'Platforma kurta atsakingam bendradarbiavimui: aiskios roles, istorijos issaugojimas, kontroliuojamas viesumas ir konfiguruojami saugumo saugikliai.',
      trust1Title: 'Bendradarbystes dirbtuviu modelis',
      trust1Copy: 'Dalyviai komentuoja, prioritetizuoja ir kuria gaires per strukturuotus, skaidrius procesus.',
      trust2Title: 'Institucine atmintis pagal dizaina',
      trust2Copy: 'Archyvuoti vartotojai ir istoriniu sprendimu pedsakai padeda islaikyti testinuma tarp ciklu.',
      trust3Title: 'Operacinis matomumas',
      trust3Copy: 'Rate limitai ir uzklausu stebesena padeda apsaugoti infrastruktura esant didelei apkrovai.',
      finalKicker: 'Pasiruose pamatyti gyvai?',
      finalTitle: 'Atverkite aktyvu strategijos zemelapi dabar.',
      finalCopy: 'Aplankykite viesa strategijos erdve ir pamatykite, kaip susijungia gaires bei iniciatyvos.',
      finalCta: 'Perziureti aktyvias strategijas',
      footerCopy: 'digistrategija.lt - strateginio bendradarbiavimo platforma viesosioms institucijoms.',
      footerLink: 'Atidaryti platformos darbo aplinka'
    },
    en: {
      metaTitle: 'digistrategija.lt | Public Strategy OS',
      metaDescription: 'digistrategija.lt helps institutions co-create strategy, map initiatives, and publish transparent progress.',
      navHow: 'How it works',
      navWhy: 'Why it stands out',
      navTrust: 'Trust',
      navLaunch: 'Launch',
      langLabel: 'Language',
      madeInEu: 'Made in EU',
      headerCta: 'View Active Strategies',
      heroKicker: 'Public Strategy OS',
      heroTitle: 'From ideas to auditable execution for modern public institutions.',
      heroCopy: 'Build guideline structures, connect initiatives, involve teams in transparent voting, and publish strategy maps your community can actually understand.',
      heroPrimaryCta: 'View Active Strategies',
      heroSecondaryCta: 'Open Workspace',
      metricInstitutionsLabel: 'Active Institutions',
      metricInviteLabel: 'Secure Invite Validity',
      metricMapLabel: 'Map-First Visual Planning',
      glassInstitutionLabel: 'Institution',
      glassMainTitle: 'Digital Strategy Cycle',
      glassMainCopy: 'Guidelines, initiatives, ownership and status in one interactive map.',
      glassOutcomeLabel: 'Outcome contract',
      glassOutcomeTitle: 'Target + Deadline + Evidence',
      glassAuditLabel: 'Auditability',
      glassAuditTitle: 'Decision history visible end-to-end',
      backboneKicker: 'European digital governance',
      backboneTitle: 'The backbone for institutional strategy delivery.',
      backboneJokeQuestion: 'Made in Europe for Europe?',
      backboneMetric1Title: 'Multi-tenant',
      backboneMetric1Copy: 'One platform, many institutions with role-separated governance.',
      backboneMetric2Title: 'Audit trail',
      backboneMetric2Copy: 'Decision context remains visible across the full strategy lifecycle.',
      backboneMetric3Title: 'Public-ready',
      backboneMetric3Copy: 'View-only embeds enable transparent publication with governance control.',
      uspKicker: 'Distinct Value',
      uspTitle: 'What makes this more than a planning board',
      feature1Title: 'Accountability Timeline',
      feature1Copy: 'Every strategic change is traceable: who changed what, when, and why.',
      feature1Item1: 'Immutable operational history',
      feature1Item2: 'Clear ownership handover',
      feature1Item3: 'Fast governance reviews',
      feature2Title: 'Outcome Contracts',
      feature2Copy: 'Turn each initiative into measurable commitment with baseline, target, and deadline.',
      feature2Item1: 'No vague implementation plans',
      feature2Item2: 'Evidence-backed status updates',
      feature2Item3: 'Priority decisions tied to impact',
      feature3Title: 'Public Trust Dashboard',
      feature3Copy: 'Embed strategy map view-only access into institutional websites and intranets.',
      feature3Item1: 'Per-institution embed links',
      feature3Item2: 'Usage monitoring in admin views',
      feature3Item3: 'Consistent branding and transparency',
      flowKicker: 'Flow',
      flowTitle: 'How institutions run strategy cycles',
      flow1Title: 'Invite teams by role',
      flow1Copy: 'Meta admin creates one-time invite links and assigns membership by institution.',
      flow2Title: 'Shape guideline structure',
      flow2Copy: 'Participants propose, discuss, vote and refine strategic directions collaboratively.',
      flow3Title: 'Map initiatives to guidelines',
      flow3Copy: 'Strategy map visualizes dependencies and reveals unassigned priorities instantly.',
      flow4Title: 'Publish and monitor',
      flow4Copy: 'Embed view-only maps publicly while admins monitor load and interaction metrics.',
      trustKicker: 'Trust by design',
      trustTitle: 'Built for institutional governance, not hype',
      trustCopy: 'The platform is designed for accountable collaboration: role separation, archived history, controlled public visibility, and configurable operational safeguards.',
      trust1Title: 'Collaborative workshop model',
      trust1Copy: 'Participants comment, prioritize and shape guidelines through structured, visible workflows.',
      trust2Title: 'Institutional memory by design',
      trust2Copy: 'Archived users and historical decisions preserve continuity between strategy cycles.',
      trust3Title: 'Operational visibility',
      trust3Copy: 'Rate limiting and request monitoring help protect infrastructure under heavy load.',
      finalKicker: 'Ready to see it live?',
      finalTitle: 'Explore an active strategy map now.',
      finalCopy: 'Open current public strategy workspace and review how guidelines and initiatives connect.',
      finalCta: 'View Active Strategies',
      footerCopy: 'digistrategija.lt - Strategy collaboration platform for public institutions.',
      footerLink: 'Open platform workspace'
    }
  };

  function normalizeLang(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return SUPPORTED_LANGS.includes(normalized) ? normalized : '';
  }

  function readInitialLang() {
    const params = new URLSearchParams(window.location.search);
    const queryLang = normalizeLang(params.get('lang'));
    if (queryLang) return queryLang;
    const storageLang = normalizeLang(window.localStorage.getItem(STORAGE_LANG_KEY));
    if (storageLang) return storageLang;
    const browserLang = normalizeLang((window.navigator.language || '').slice(0, 2));
    return browserLang || DEFAULT_LANG;
  }

  function syncLangToUrl(lang) {
    const normalized = normalizeLang(lang) || DEFAULT_LANG;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', normalized);
    window.history.replaceState({}, '', url.toString());
  }

  function setLanguage(lang, { updateUrl = true } = {}) {
    const normalized = normalizeLang(lang) || DEFAULT_LANG;
    currentLang = normalized;
    window.localStorage.setItem(STORAGE_LANG_KEY, normalized);
    if (updateUrl) syncLangToUrl(normalized);
    if (languageSelect) languageSelect.value = normalized;
    applyTranslations();
    updateNavigationLinks();
  }

  function getTranslationBundle(lang) {
    const normalized = normalizeLang(lang) || DEFAULT_LANG;
    const base = BASE_TRANSLATIONS[normalized] || BASE_TRANSLATIONS[DEFAULT_LANG];
    const adminOverrides = adminLandingTranslations[normalized] || {};
    return { ...base, ...adminOverrides };
  }

  function applyTranslations() {
    const translations = getTranslationBundle(currentLang);
    document.documentElement.lang = currentLang;
    if (translations.metaTitle) document.title = translations.metaTitle;
    if (metaDescription && translations.metaDescription) {
      metaDescription.setAttribute('content', translations.metaDescription);
    }

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = String(element.getAttribute('data-i18n') || '').trim();
      if (!key) return;
      const translated = translations[key];
      if (typeof translated !== 'string' || !translated.trim()) return;
      element.textContent = translated;
    });
  }

  function setActiveStrategyHref(slug) {
    if (!slug) return;
    const href = `index.html?institution=${encodeURIComponent(slug)}&view=map&lang=${encodeURIComponent(currentLang)}`;
    activeStrategyLinks.forEach((link) => {
      link.setAttribute('href', href);
    });
  }

  function setWorkspaceHref() {
    const href = `index.html?lang=${encodeURIComponent(currentLang)}`;
    workspaceLinks.forEach((link) => {
      link.setAttribute('href', href);
    });
  }

  function updateNavigationLinks() {
    setActiveStrategyHref(preferredStrategySlug);
    setWorkspaceHref();
  }

  async function loadPublicInstitutions() {
    try {
      const response = await fetch('/api/v1/public/institutions', {
        method: 'GET',
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const institutions = Array.isArray(payload?.institutions) ? payload.institutions : [];
      const active = institutions.filter((item) => String(item?.status || '').toLowerCase() === 'active');
      if (metricInstitutions) metricInstitutions.textContent = String(active.length || institutions.length || 0);

      const preferred = active.find((item) => String(item?.slug || '').trim())
        || institutions.find((item) => String(item?.slug || '').trim())
        || null;
      if (preferred?.slug) preferredStrategySlug = String(preferred.slug);
      updateNavigationLinks();
    } catch {
      if (metricInstitutions) metricInstitutions.textContent = '1+';
      preferredStrategySlug = 'uzt';
      updateNavigationLinks();
    }
  }

  async function loadAdminLandingTranslations() {
    try {
      const response = await fetch('/api/v1/public/content-settings', {
        method: 'GET',
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const settings = payload?.contentSettings && typeof payload.contentSettings === 'object'
        ? payload.contentSettings
        : {};
      const ltRaw = settings?.landingTranslationsLt;
      const enRaw = settings?.landingTranslationsEn;
      adminLandingTranslations.lt = ltRaw && typeof ltRaw === 'object' && !Array.isArray(ltRaw) ? ltRaw : {};
      adminLandingTranslations.en = enRaw && typeof enRaw === 'object' && !Array.isArray(enRaw) ? enRaw : {};
      applyTranslations();
    } catch {
      adminLandingTranslations.lt = {};
      adminLandingTranslations.en = {};
    }
  }

  function initReveal() {
    const items = Array.from(document.querySelectorAll('.section-reveal'));
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    items.forEach((item) => observer.observe(item));
  }

  function initNavScroll() {
    if (!navLinks.length) return;

    const sections = navLinks
      .map((link) => {
        const href = String(link.getAttribute('href') || '').trim();
        if (!href.startsWith('#')) return null;
        const element = document.querySelector(href);
        if (!(element instanceof HTMLElement)) return null;
        return { link, element };
      })
      .filter(Boolean)
      .sort((left, right) => left.element.offsetTop - right.element.offsetTop);

    if (!sections.length) return;

    const clearActive = () => {
      navLinks.forEach((link) => link.classList.remove('active'));
    };

    const setActive = (link) => {
      clearActive();
      if (link) link.classList.add('active');
    };

    const updateActiveByScroll = () => {
      const headerOffset = 144;
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const firstSectionTop = sections[0].element.offsetTop;

      if (scrollTop < Math.max(120, firstSectionTop - headerOffset - 80)) {
        clearActive();
        return;
      }

      const probe = scrollTop + headerOffset;
      let current = null;
      sections.forEach((section) => {
        if (section.element.offsetTop <= probe) current = section;
      });

      setActive(current?.link || null);
    };

    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = String(link.getAttribute('href') || '').trim();
        if (!href.startsWith('#')) return;
        const target = document.querySelector(href);
        if (!(target instanceof HTMLElement)) return;
        event.preventDefault();
        setActive(link);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    window.addEventListener('scroll', updateActiveByScroll, { passive: true });
    window.addEventListener('resize', updateActiveByScroll);
    updateActiveByScroll();
  }

  function initHeaderMotion() {
    const header = document.querySelector('.landing-header');
    if (!(header instanceof HTMLElement)) return;

    let lastY = window.scrollY || window.pageYOffset || 0;
    let ticking = false;
    const threshold = 180;

    const update = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const delta = y - lastY;
      const goingUp = delta < -2;
      const goingDown = delta > 2;
      const pastThreshold = y > threshold;

      header.classList.toggle('is-floating', pastThreshold);

      if (!pastThreshold || goingUp) {
        header.classList.add('is-visible');
      } else if (goingDown) {
        header.classList.remove('is-visible');
      }

      lastY = y;
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  function initLanguageSwitch() {
    if (!(languageSelect instanceof HTMLSelectElement)) return;
    languageSelect.addEventListener('change', () => {
      setLanguage(languageSelect.value, { updateUrl: true });
    });
  }

  currentLang = readInitialLang();
  initLanguageSwitch();
  setLanguage(currentLang, { updateUrl: true });
  initHeaderMotion();
  loadAdminLandingTranslations();
  loadPublicInstitutions();
  initReveal();
  initNavScroll();
})();
