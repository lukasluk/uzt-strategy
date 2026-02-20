(function () {
  const activeStrategyLinks = Array.from(document.querySelectorAll('[data-active-strategy-link]'));
  const glassMetricInstitutions = document.getElementById('glassMetricInstitutions');
  const glassMetricGuidelines = document.getElementById('glassMetricGuidelines');
  const glassMetricInitiatives = document.getElementById('glassMetricInitiatives');
  const landingAboutContent = document.getElementById('landingAboutContent');
  const navLinks = Array.from(document.querySelectorAll('[data-scroll-link]'));
  const accessRequestButtons = Array.from(document.querySelectorAll('[data-open-access-request]'));
  const languageSelect = document.getElementById('landingLangSelect');
  const metaDescription = document.getElementById('landingMetaDescription');

  const SUPPORTED_LANGS = ['lt', 'en'];
  const DEFAULT_LANG = 'lt';
  const STORAGE_LANG_KEY = 'landing_lang';
  const DEFAULT_ABOUT_TEXT_LT = [
    'Lietuvos viešajame sektoriuje skaitmenizacija vis dažniau suvokiama ne kaip pavienių IT projektų rinkinys, o kaip sisteminis pokytis, apimantis paslaugų kokybę, duomenų valdymą ir naujų technologijų taikymą. Todėl vis didesnę reikšmę įgyja ne tik technologiniai sprendimai, bet ir aiškios, įgyvendinamos skaitmenizacijos strategijos (arba IT plėtros planai).',
    'Praktika rodo, kad tradiciniai, didelės apimties strateginiai dokumentai dažnai tampa sunkiai pritaikomi greitai besikeičiančioje aplinkoje. Dėl to vis daugiau dėmesio skiriama lanksčioms, įtraukioms ir duomenimis grįstoms strategijų formavimo praktikoms, kurios leidžia greičiau susitarti dėl prioritetų ir krypties.',
    'Vienas iš būdų tai pasiekti - aiškiai išsigryninti pagrindines ašis, aplink kurias sukasi dauguma sprendimų:',
    '- Kokybiškų paslaugų teikimas (vidiniams ir išoriniams naudotojams).\n- Duomenų kokybė ir duomenų valdymas (data governance).\n- Tikslingas dirbtinio intelekto taikymas (AI with purpose).',
    'Svarbi ne tik strategijos kryptis, bet ir pats jos rengimo procesas - jis turi būti suprantamas, įtraukiantis ir skatinantis bendrą atsakomybę. Tam vis dažniau pasitelkiami paprasti skaitmeniniai įrankiai, leidžiantys dalyviams siūlyti gaires, jas komentuoti, balsuoti ir viešai matyti bendrus rezultatus. Tokie sprendimai skatina skaidrumą, tarpinstitucinį mokymąsi ir gerosios praktikos dalijimąsi.',
    'Šiame kontekste atsirado digistrategy.eu - eksperimentinis, atviras įrankis, skirtas skaitmenizacijos strategijų ar IT plėtros planų gairėms formuoti ir prioritetizuoti. Jis leidžia dalyviams struktūruotai įsitraukti į strateginį procesą ir padeda greičiau pereiti nuo abstrakčių idėjų prie aiškių sprendimų krypčių.',
    'Svarbu pabrėžti, kad tai nėra enterprise lygio ar sertifikuotas sprendimas - veikiau praktinis eksperimentas, skirtas parodyti, kaip pasitelkiant šiuolaikines technologijas ir dirbtinį intelektą galima greitai sukurti veikiančius, naudotojams suprantamus įrankius.',
    'Dirbtinis intelektas ir skaitmeniniai sprendimai jau keičia viešojo sektoriaus veiklos modelius. Organizacijos, kurios drąsiai eksperimentuoja, augina kompetencijas ir taiko technologijas tikslingai, turi realią galimybę judėti greičiau ir išlikti konkurencingos sparčiai besikeičiančioje aplinkoje.'
  ].join('\n\n');
  const DEFAULT_ABOUT_TEXT_EN = [
    'Across public institutions, digital transformation is no longer seen as a set of isolated IT projects but as a systemic shift that affects service quality, data governance, and responsible adoption of emerging technologies.',
    'That is exactly why digistrategy.eu was created: to provide a practical, transparent workspace where strategy priorities can be discussed, structured, and translated into initiatives with clear ownership.',
    'The platform helps teams agree faster on what matters most, while preserving context and traceability for long-term institutional continuity.'
  ].join('\n\n');
  let currentLang = DEFAULT_LANG;
  let preferredStrategySlug = 'uzt';
  let publicInstitutions = [];
  const adminAboutTextByLang = {
    lt: '',
    en: ''
  };

  const adminLandingTranslations = {
    lt: {},
    en: {}
  };

  const BASE_TRANSLATIONS = {
    lt: {
      metaTitle: 'digistrategy.eu | Viešojo sektoriaus strategijų platforma',
      metaDescription: 'digistrategy.eu padeda institucijoms kartu kurti strategijas, susieti iniciatyvas ir skaidriai viešinti pažangą.',
      navHow: 'Kaip veikia',
      navWhy: 'Kodėl išsiskiria',
      navTrust: 'Patikimumas',
      navLaunch: 'Pradėti',
      langLabel: 'Kalba',
      headerCta: 'Peržiūrėti aktyvias strategijas',
      heroKicker: 'Strategijų platforma viešajam sektoriui',
      heroTitle: 'Nuo idėjų iki audituojamo įgyvendinimo šiuolaikinėms viešojo sektoriaus institucijoms.',
      heroCopy: 'Kurkite gairių struktūras, susiekite iniciatyvas, įtraukite komandas į skaidrų balsavimą ir publikuokite strategijų žemėlapius, kuriuos supranta visa bendruomenė.',
      heroPrimaryCta: 'Peržiūrėti aktyvias strategijas',
      metricInstitutionsLabel: 'Aktyvios institucijos',
      metricGuidelinesLabel: 'Aktyvios gairės',
      metricInitiativesLabel: 'Aktyvios iniciatyvos',
      glassInstitutionLabel: 'Institucija',
      glassMainTitle: 'Skaitmenizacijos strategijos ciklas',
      glassMainCopy: 'Gairės, iniciatyvos, atsakomybės ir būsenos viename interaktyviame žemėlapyje.',
      glassStatsInstitutionsLabel: 'Aktyvios institucijos',
      glassStatsGuidelinesLabel: 'Aktyvios gairės',
      glassStatsInitiativesLabel: 'Aktyvios iniciatyvos',
      glassOutcomeLabel: 'Rezultatų kontraktas',
      glassOutcomeTitle: 'Tikslas + terminas + įrodymai',
      glassAuditLabel: 'Audituojamumas',
      glassAuditTitle: 'Sprendimų istorija matoma nuo pradžios iki pabaigos',
      demoMapKicker: 'Interaktyvus pavyzdys',
      demoMapTitle: 'Strategijų žemėlapio mini demonstracija',
      demoMapCopy: 'Šis supaprastintas pavyzdys parodo, kaip institucijos strategija susiejama su pagrindinėmis gairėmis ir jas įgyvendinančiomis iniciatyvomis.',
      demoLegendGuideline: 'Gairė',
      demoLegendInitiative: 'Iniciatyva',
      demoInstitutionKind: 'Institucija',
      demoInstitutionTitle: 'Skaitmenizacijos strategijos ciklas',
      demoInstitutionCopy: 'Bendra kryptis ir prioritetai visai organizacijai.',
      demoGuidelineKind: 'Gairė',
      demoGuideline1Title: 'Klientų patirčių gerinimas',
      demoGuideline1Copy: 'Trumpesnis paslaugų kelias ir aiškesnė komunikacija.',
      demoGuideline2Title: 'Duomenų valdysenos stiprinimas',
      demoGuideline2Copy: 'Vieningi standartai ir kokybiški duomenys sprendimams.',
      demoGuideline3Title: 'Skaitmeninių paslaugų plėtra',
      demoGuideline3Copy: 'Daugiau savitarnos galimybių ir greitesni procesai.',
      demoGuideline4Title: 'Kompetencijų ugdymas',
      demoGuideline4Copy: 'Komandų pasirengimas dirbti su naujais įrankiais.',
      demoInitiativeKind: 'Iniciatyva',
      demoInitiative1Title: 'Vieningas registracijos kelias',
      demoInitiative1Copy: 'Vienas langas gyventojų užklausoms ir aptarnavimui.',
      demoInitiative2Title: 'Savitarnos modernizavimas',
      demoInitiative2Copy: 'Atnaujinta naudotojų patirtis pagrindinėse paslaugose.',
      demoInitiative3Title: 'Analitikos platforma',
      demoInitiative3Copy: 'Duomenimis grįsti sprendimai, nuolat stebint poveikio rodiklius.',
      backboneKicker: 'Europos skaitmeninis valdymas',
      backboneTitle: 'Patikimas pagrindas institucijų strategijų įgyvendinimui.',
      backboneJokeQuestion: 'Sukurta Europoje Europai?',
      backboneMetric1Title: 'Daugiainstitucė architektūra',
      backboneMetric1Copy: 'Viena platforma daugeliui institucijų su aiškiai atskirtu valdymu pagal roles.',
      backboneMetric2Title: 'Audito pėdsakas',
      backboneMetric2Copy: 'Sprendimų kontekstas išlieka matomas per visą strategijos ciklą.',
      backboneMetric3Title: 'Parengta viešinimui',
      backboneMetric3Copy: 'View-only įterpimas leidžia skaidriai viešinti strategiją ir išlaikyti valdymo kontrolę.',
      uspKicker: 'Išskirtinė vertė',
      uspTitle: 'Kodėl tai daugiau nei planavimo lenta',
      feature1Title: 'Atskaitomybės laiko juosta',
      feature1Copy: 'Kiekvienas strateginis pakeitimas yra atsekamas: kas, kada ir kodėl jį atliko.',
      feature1Item1: 'Nekintama veiklos istorija',
      feature1Item2: 'Aiškus atsakomybių perdavimas',
      feature1Item3: 'Greitesnės valdymo peržiūros',
      feature2Title: 'Rezultatų kontraktai',
      feature2Copy: 'Kiekvieną iniciatyvą paverskite pamatuojamu įsipareigojimu su baze, tikslu ir terminu.',
      feature2Item1: 'Mažiau abstrakčių įgyvendinimo planų',
      feature2Item2: 'Įrodymais grįsti būsenos atnaujinimai',
      feature2Item3: 'Prioritetai susieti su poveikiu',
      feature3Title: 'Viešo pasitikėjimo skydelis',
      feature3Copy: 'Integruokite strategijos žemėlapį view-only režimu į institucijos svetainę ar intranetą.',
      feature3Item1: 'Atskiri embed URL pagal instituciją',
      feature3Item2: 'Naudojimo stebėsena administravimo aplinkoje',
      feature3Item3: 'Nuoseklus prekės ženklas ir skaidrumas',
      flowKicker: 'Eiga',
      flowTitle: 'Kaip institucijos vykdo strategijos ciklus',
      flow1Title: 'Pakvieskite komandas pagal roles',
      flow1Copy: 'Meta admin sukuria vienkartines pakvietimo nuorodas ir priskiria narystes pagal institucijas.',
      flow2Title: 'Suformuokite gairių struktūrą',
      flow2Copy: 'Dalyviai siūlo, diskutuoja, balsuoja ir kartu tobulina strategines kryptis.',
      flow3Title: 'Susiekite iniciatyvas su gairėmis',
      flow3Copy: 'Strategijų žemėlapis parodo priklausomybes ir iškart išryškina nepriskirtus prioritetus.',
      flow4Title: 'Publikuokite ir stebėkite',
      flow4Copy: 'Skelbkite view-only žemėlapius viešai, o administratoriai stebi apkrovą ir panaudojimo rodiklius.',
      trustKicker: 'Patikimumas pagal dizainą',
      trustTitle: 'Sukurta instituciniam valdymui, ne triukšmui',
      trustCopy: 'Platforma kurta atsakingam bendradarbiavimui: aiškios rolės, istorijos išsaugojimas, kontroliuojamas viešumas ir konfigūruojami saugumo saugikliai.',
      trust1Title: 'Bendradarbystės dirbtuvių modelis',
      trust1Copy: 'Dalyviai komentuoja, prioritetizuoja ir kuria gaires per struktūruotus, skaidrius procesus.',
      trust2Title: 'Institucinė atmintis pagal dizainą',
      trust2Copy: 'Archyvuoti vartotojai ir istorinių sprendimų pėdsakai padeda išlaikyti tęstinumą tarp ciklų.',
      trust3Title: 'Operacinis matomumas',
      trust3Copy: 'Užklausų limitai ir stebėsena padeda apsaugoti infrastruktūrą esant didelei apkrovai.',
      aboutKicker: 'Apie platformą',
      aboutTitle: 'Kodėl ši platforma sukurta',
      finalKicker: 'Pasiruošę pamatyti gyvai?',
      finalTitle: 'Atverkite aktyvų strategijos žemėlapį dabar.',
      finalCopy: 'Aplankykite viešą strategijos erdvę ir pamatykite, kaip susijungia gairės bei iniciatyvos.',
      finalCta: 'Peržiūrėti aktyvias strategijas',
      footerCopy: 'digistrategy.eu - strateginio bendradarbiavimo platforma viešojo sektoriaus institucijoms.',
      footerAccessButton: 'Gauti prieigą',
      footerAccessLead: 'arba susisiekite per LinkedIn:',
      accessRequestTitle: 'Prieigos užklausa',
      accessRequestDescription: 'Pateikite trumpą informaciją ir peržiūrėsime jūsų užklausą.',
      accessRequestInstitution: 'Institucija',
      accessRequestFullName: 'Vardas ir pavardė',
      accessRequestEmail: 'Darbinis el. paštas',
      accessRequestPhone: 'Kontaktinis telefono numeris',
      accessRequestNotes: 'Papildoma informacija (nebūtina)',
      accessRequestSubmit: 'Pateikti užklausą',
      accessRequestClose: 'Užverti',
      accessRequestSuccess: 'Užklausa gauta. Užregistruota: {REQUEST_CODE}',
      accessRequestError: 'Nepavyko pateikti užklausos. Pabandykite dar kartą.',
      accessRequestLinkedInLead: 'Taip pat galite susisiekti tiesiogiai per LinkedIn:'
    },
    en: {
      metaTitle: 'digistrategy.eu | Public Strategy OS',
      metaDescription: 'digistrategy.eu helps institutions co-create strategy, map initiatives, and publish transparent progress.',
      navHow: 'How it works',
      navWhy: 'Why it stands out',
      navTrust: 'Trust',
      navLaunch: 'Launch',
      langLabel: 'Language',
      headerCta: 'View Active Strategies',
      heroKicker: 'Public Strategy OS',
      heroTitle: 'From ideas to auditable execution for modern public institutions.',
      heroCopy: 'Build guideline structures, connect initiatives, involve teams in transparent voting, and publish strategy maps your community can actually understand.',
      heroPrimaryCta: 'View Active Strategies',
      metricInstitutionsLabel: 'Active Institutions',
      metricGuidelinesLabel: 'Active Guidelines',
      metricInitiativesLabel: 'Active Initiatives',
      glassInstitutionLabel: 'Institution',
      glassMainTitle: 'Digital Strategy Cycle',
      glassMainCopy: 'Guidelines, initiatives, ownership and status in one interactive map.',
      glassStatsInstitutionsLabel: 'Active Institutions',
      glassStatsGuidelinesLabel: 'Active Guidelines',
      glassStatsInitiativesLabel: 'Active Initiatives',
      glassOutcomeLabel: 'Outcome contract',
      glassOutcomeTitle: 'Target + Deadline + Evidence',
      glassAuditLabel: 'Auditability',
      glassAuditTitle: 'Decision history visible end-to-end',
      demoMapKicker: 'Interactive example',
      demoMapTitle: 'Mini strategy map demo',
      demoMapCopy: 'This simplified example shows how an institutional strategy links core guidelines with concrete delivery initiatives.',
      demoLegendGuideline: 'Guideline',
      demoLegendInitiative: 'Initiative',
      demoInstitutionKind: 'Institution',
      demoInstitutionTitle: 'Digital Strategy Cycle',
      demoInstitutionCopy: 'Shared direction and priorities for the entire organization.',
      demoGuidelineKind: 'Guideline',
      demoGuideline1Title: 'Client experience improvement',
      demoGuideline1Copy: 'Shorter service journey and clearer communication.',
      demoGuideline2Title: 'Data governance strengthening',
      demoGuideline2Copy: 'Common standards and higher-quality data for decisions.',
      demoGuideline3Title: 'Digital service expansion',
      demoGuideline3Copy: 'More self-service options and faster workflows.',
      demoGuideline4Title: 'Capability development',
      demoGuideline4Copy: 'Teams prepared to work with modern tools.',
      demoInitiativeKind: 'Initiative',
      demoInitiative1Title: 'Unified registration flow',
      demoInitiative1Copy: 'Single entry point for citizen requests and support.',
      demoInitiative2Title: 'Self-service modernization',
      demoInitiative2Copy: 'Refreshed user experience across core services.',
      demoInitiative3Title: 'Analytics platform',
      demoInitiative3Copy: 'Data-driven decisions with measurable impact tracking.',
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
      aboutKicker: 'About the Platform',
      aboutTitle: 'Why this platform exists',
      finalKicker: 'Ready to see it live?',
      finalTitle: 'Explore an active strategy map now.',
      finalCopy: 'Open current public strategy workspace and review how guidelines and initiatives connect.',
      finalCta: 'View Active Strategies',
      footerCopy: 'digistrategy.eu - Strategy collaboration platform for public institutions.',
      footerAccessButton: 'Request access',
      footerAccessLead: 'or contact directly on LinkedIn:',
      accessRequestTitle: 'Access request',
      accessRequestDescription: 'Share short details and we will review your request.',
      accessRequestInstitution: 'Institution',
      accessRequestFullName: 'Full name',
      accessRequestEmail: 'Work email',
      accessRequestPhone: 'Contact phone number',
      accessRequestNotes: 'Additional information (optional)',
      accessRequestSubmit: 'Submit request',
      accessRequestClose: 'Close',
      accessRequestSuccess: 'Request received. Registered as: {REQUEST_CODE}',
      accessRequestError: 'Failed to submit request. Please try again.',
      accessRequestLinkedInLead: 'You can also contact directly on LinkedIn:'
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
    renderAboutSection();
  }

  function setActiveStrategyHref(slug) {
    if (!slug) return;
    const href = `/index.html?institution=${encodeURIComponent(slug)}&view=map&lang=${encodeURIComponent(currentLang)}`;
    activeStrategyLinks.forEach((link) => {
      link.setAttribute('href', href);
    });
  }

  function updateNavigationLinks() {
    setActiveStrategyHref(preferredStrategySlug);
  }

  function setMetricValue(element, value) {
    if (!(element instanceof HTMLElement)) return;
    element.textContent = Number.isFinite(value) ? String(value) : '--';
  }

  function applyInstitutionCount(value) {
    setMetricValue(glassMetricInstitutions, value);
  }

  function applyActiveContentCounts({ totalGuidelines, totalInitiatives }) {
    setMetricValue(glassMetricGuidelines, totalGuidelines);
    setMetricValue(glassMetricInitiatives, totalInitiatives);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function getAboutStepIcon(index) {
    const icons = [
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="8" width="20" height="26" rx="3"></rect><line x1="14" y1="14" x2="24" y2="14"></line><line x1="14" y1="20" x2="24" y2="20"></line><line x1="14" y1="26" x2="22" y2="26"></line><circle cx="34" cy="30" r="8"></circle><line x1="34" y1="20" x2="34" y2="24"></line><line x1="34" y1="36" x2="34" y2="40"></line><line x1="24" y1="30" x2="28" y2="30"></line><line x1="40" y1="30" x2="44" y2="30"></line></svg>',
      '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="12" width="34" height="22" rx="4"></rect><polyline points="12,30 20,22 26,26 33,18"></polyline><circle cx="33" cy="18" r="2.5"></circle><rect x="30" y="8" width="12" height="10" rx="3"></rect><line x1="33" y1="13" x2="39" y2="13"></line></svg>',
      '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="16" cy="22" r="6"></circle><circle cx="31" cy="20" r="6"></circle><path d="M8 36c1.6-4 5.6-6.5 9.9-6.5S26.2 32 27.8 36"></path><path d="M22 36c1.4-3.5 4.9-5.7 8.6-5.7S37.9 32.5 39.3 36"></path><circle cx="23.5" cy="9.5" r="3.5"></circle><line x1="23.5" y1="3" x2="23.5" y2="1"></line><line x1="17" y1="9.5" x2="15" y2="9.5"></line><line x1="32" y1="9.5" x2="30" y2="9.5"></line></svg>'
    ];
    return icons[index % icons.length];
  }

  function normalizeAboutLines(rawBlock) {
    return String(rawBlock || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function renderAboutBlocks(text) {
    const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!normalized) return '';
    const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
    return blocks.map((block, index) => {
      const lines = normalizeAboutLines(block);
      if (!lines.length) return '';
      const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));
      if (bulletLines.length === lines.length) {
        return `
          <article class="landing-about-block">
            <div class="landing-about-step">
              <span class="landing-about-step-icon" aria-hidden="true">${getAboutStepIcon(index)}</span>
              <span class="landing-about-step-line" aria-hidden="true"></span>
            </div>
            <div class="landing-about-copy">
              <ul class="landing-about-list">${bulletLines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>
            </div>
          </article>
        `;
      }
      const richText = lines
        .map((line) => `<span>${escapeHtml(line)}</span>`)
        .join('');
      return `
        <article class="landing-about-block">
          <div class="landing-about-step">
            <span class="landing-about-step-icon" aria-hidden="true">${getAboutStepIcon(index)}</span>
            <span class="landing-about-step-line" aria-hidden="true"></span>
          </div>
          <div class="landing-about-copy">
            <p>${richText}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  function resolveAboutText() {
    const adminText = String(adminAboutTextByLang[currentLang] || '').trim();
    if (adminText) return adminText;
    return currentLang === 'en' ? DEFAULT_ABOUT_TEXT_EN : DEFAULT_ABOUT_TEXT_LT;
  }

  function renderAboutSection() {
    if (!(landingAboutContent instanceof HTMLElement)) return;
    landingAboutContent.innerHTML = renderAboutBlocks(resolveAboutText());
  }

  function closeAccessRequestModal() {
    const current = document.getElementById('landingAccessRequestOverlay');
    if (current) current.remove();
  }

  function openAccessRequestModal() {
    const labels = getTranslationBundle(currentLang);
    closeAccessRequestModal();

    const overlay = document.createElement('div');
    overlay.id = 'landingAccessRequestOverlay';
    overlay.className = 'landing-access-overlay';
    overlay.innerHTML = `
      <div class="landing-access-card">
        <div class="header-row">
          <h3>${escapeHtml(labels.accessRequestTitle || 'Access request')}</h3>
          <button type="button" class="btn btn-ghost" id="closeLandingAccessRequest">${escapeHtml(labels.accessRequestClose || 'Close')}</button>
        </div>
        <p class="prompt">${escapeHtml(labels.accessRequestDescription || '')}</p>
        <div id="landingAccessRequestStatus" class="landing-access-status" hidden></div>
        <form id="landingAccessRequestForm" class="landing-access-form">
          <label for="landingAccessInstitution">${escapeHtml(labels.accessRequestInstitution || 'Institution')}</label>
          <input id="landingAccessInstitution" type="text" name="institutionName" required />

          <label for="landingAccessFullName">${escapeHtml(labels.accessRequestFullName || 'Full name')}</label>
          <input id="landingAccessFullName" type="text" name="fullName" required />

          <label for="landingAccessEmail">${escapeHtml(labels.accessRequestEmail || 'Work email')}</label>
          <input id="landingAccessEmail" type="email" name="workEmail" required />

          <label for="landingAccessPhone">${escapeHtml(labels.accessRequestPhone || 'Contact phone number')}</label>
          <input id="landingAccessPhone" type="text" name="phone" required />

          <label for="landingAccessNotes">${escapeHtml(labels.accessRequestNotes || 'Additional information (optional)')}</label>
          <textarea id="landingAccessNotes" name="notes" rows="4"></textarea>

          <button type="submit" class="btn btn-primary">${escapeHtml(labels.accessRequestSubmit || 'Submit request')}</button>
        </form>
        <p class="landing-access-linkedin">
          ${escapeHtml(labels.accessRequestLinkedInLead || '')}
          <a href="https://www.linkedin.com/in/lukaslukosevicius/" target="_blank" rel="noopener noreferrer">Lukas Lukosevičius</a>.
        </p>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeButton = overlay.querySelector('#closeLandingAccessRequest');
    const form = overlay.querySelector('#landingAccessRequestForm');
    const statusNode = overlay.querySelector('#landingAccessRequestStatus');

    function showStatus(message, isError = false) {
      if (!(statusNode instanceof HTMLElement)) return;
      statusNode.textContent = String(message || '').trim();
      statusNode.hidden = false;
      statusNode.classList.toggle('is-error', Boolean(isError));
      statusNode.classList.toggle('is-success', !isError);
    }

    closeButton?.addEventListener('click', closeAccessRequestModal);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeAccessRequestModal();
    });

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      if (!(submitButton instanceof HTMLButtonElement)) return;
      submitButton.disabled = true;
      if (statusNode instanceof HTMLElement) {
        statusNode.hidden = true;
        statusNode.textContent = '';
      }

      try {
        const fd = new FormData(form);
        const payload = {
          institutionName: String(fd.get('institutionName') || '').trim(),
          fullName: String(fd.get('fullName') || '').trim(),
          workEmail: String(fd.get('workEmail') || '').trim(),
          phone: String(fd.get('phone') || '').trim(),
          notes: String(fd.get('notes') || '').trim()
        };

        const response = await fetch('/api/v1/public/access-requests', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(data?.error || 'request failed'));

        const requestCode = String(data?.requestCode || '').trim() || '-';
        const successTemplate = String(labels.accessRequestSuccess || 'Request received: {REQUEST_CODE}');
        showStatus(successTemplate.replace('{REQUEST_CODE}', requestCode), false);
        form.reset();
      } catch (_error) {
        showStatus(String(labels.accessRequestError || 'Failed to submit request.'), true);
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  function toStrategySummary(payload) {
    const institutions = Array.isArray(payload?.institutions) ? payload.institutions : [];
    const items = institutions
      .map((item) => {
        const slug = String(item?.slug || '').trim();
        if (!slug) return null;
        const guidelineCount = Array.isArray(item?.guidelines)
          ? item.guidelines.filter((entry) => String(entry?.status || '').toLowerCase() === 'active').length
          : 0;
        const initiativeCount = Array.isArray(item?.initiatives)
          ? item.initiatives.filter((entry) => String(entry?.status || '').toLowerCase() === 'active').length
          : 0;
        return {
          slug,
          hasCycle: Boolean(item?.cycle?.id),
          guidelineCount,
          initiativeCount,
          score: guidelineCount + initiativeCount
        };
      })
      .filter(Boolean);
    return {
      items,
      totalGuidelines: items.reduce((sum, item) => sum + item.guidelineCount, 0),
      totalInitiatives: items.reduce((sum, item) => sum + item.initiativeCount, 0)
    };
  }

  async function loadPreferredSlugWithContent() {
    try {
      const response = await fetch('/api/v1/public/strategy-map?source=app', {
        method: 'GET',
        credentials: 'same-origin'
      });
      if (!response.ok) return { preferredSlug: '', totalGuidelines: null, totalInitiatives: null };
      const payload = await response.json();
      const summary = toStrategySummary(payload);
      const mapped = summary.items;
      if (!mapped.length) {
        return { preferredSlug: '', totalGuidelines: 0, totalInitiatives: 0 };
      }

      const candidates = mapped
        .filter((item) => item.hasCycle && item.score > 0)
        .sort((left, right) => right.score - left.score);
      if (candidates.length) {
        return {
          preferredSlug: candidates[0].slug,
          totalGuidelines: summary.totalGuidelines,
          totalInitiatives: summary.totalInitiatives
        };
      }

      const withCycle = mapped.find((item) => item.hasCycle);
      return {
        preferredSlug: withCycle?.slug || '',
        totalGuidelines: summary.totalGuidelines,
        totalInitiatives: summary.totalInitiatives
      };
    } catch {
      return { preferredSlug: '', totalGuidelines: null, totalInitiatives: null };
    }
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
      publicInstitutions = (active.length ? active : institutions).map((item) => ({
        id: String(item?.id || '').trim(),
        name: String(item?.name || '').trim(),
        slug: String(item?.slug || '').trim(),
        status: String(item?.status || '').trim().toLowerCase()
      })).filter((item) => item.id && item.name);
      applyInstitutionCount(active.length || institutions.length || 0);

      const preferred = active.find((item) => String(item?.slug || '').trim())
        || institutions.find((item) => String(item?.slug || '').trim())
        || null;

      const contentSummary = await loadPreferredSlugWithContent();
      applyActiveContentCounts(contentSummary);
      if (contentSummary.preferredSlug) preferredStrategySlug = contentSummary.preferredSlug;
      else if (preferred?.slug) preferredStrategySlug = String(preferred.slug);
      updateNavigationLinks();
    } catch {
      applyInstitutionCount(null);
      applyActiveContentCounts({ totalGuidelines: null, totalInitiatives: null });
      preferredStrategySlug = 'uzt';
      publicInstitutions = [];
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
      adminAboutTextByLang.lt = String(settings?.aboutTextLt || settings?.aboutText || '').trim();
      adminAboutTextByLang.en = String(settings?.aboutTextEn || '').trim();
      adminLandingTranslations.lt = ltRaw && typeof ltRaw === 'object' && !Array.isArray(ltRaw) ? ltRaw : {};
      adminLandingTranslations.en = enRaw && typeof enRaw === 'object' && !Array.isArray(enRaw) ? enRaw : {};
      applyTranslations();
    } catch {
      adminAboutTextByLang.lt = '';
      adminAboutTextByLang.en = '';
      adminLandingTranslations.lt = {};
      adminLandingTranslations.en = {};
      renderAboutSection();
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

  function initAccessRequestButtons() {
    if (!accessRequestButtons.length) return;
    accessRequestButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        openAccessRequestModal();
      });
    });
  }

  currentLang = readInitialLang();
  initLanguageSwitch();
  setLanguage(currentLang, { updateUrl: true });
  initHeaderMotion();
  loadAdminLandingTranslations();
  loadPublicInstitutions();
  initAccessRequestButtons();
  initReveal();
  initNavScroll();
})();
