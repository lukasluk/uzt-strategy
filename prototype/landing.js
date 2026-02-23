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
    'Lietuvos vieÅ¡ajame sektoriuje skaitmenizacija vis daÅ¾niau suvokiama ne kaip pavieniÅ³ IT projektÅ³ rinkinys, o kaip sisteminis pokytis, apimantis paslaugÅ³ kokybÄ™, duomenÅ³ valdymÄ… ir naujÅ³ technologijÅ³ taikymÄ…. TodÄ—l vis didesnÄ™ reikÅ¡mÄ™ Ä¯gyja ne tik technologiniai sprendimai, bet ir aiÅ¡kios, Ä¯gyvendinamos skaitmenizacijos strategijos (arba IT plÄ—tros planai).',
    'Praktika rodo, kad tradiciniai, didelÄ—s apimties strateginiai dokumentai daÅ¾nai tampa sunkiai pritaikomi greitai besikeiÄianÄioje aplinkoje. DÄ—l to vis daugiau dÄ—mesio skiriama lanksÄioms, Ä¯traukioms ir duomenimis grÄ¯stoms strategijÅ³ formavimo praktikoms, kurios leidÅ¾ia greiÄiau susitarti dÄ—l prioritetÅ³ ir krypties.',
    'Vienas iÅ¡ bÅ«dÅ³ tai pasiekti - aiÅ¡kiai iÅ¡sigryninti pagrindines aÅ¡is, aplink kurias sukasi dauguma sprendimÅ³:',
    '- KokybiÅ¡kÅ³ paslaugÅ³ teikimas (vidiniams ir iÅ¡oriniams naudotojams).\n- DuomenÅ³ kokybÄ— ir duomenÅ³ valdymas (data governance).\n- Tikslingas dirbtinio intelekto taikymas (AI with purpose).',
    'Svarbi ne tik strategijos kryptis, bet ir pats jos rengimo procesas - jis turi bÅ«ti suprantamas, Ä¯traukiantis ir skatinantis bendrÄ… atsakomybÄ™. Tam vis daÅ¾niau pasitelkiami paprasti skaitmeniniai Ä¯rankiai, leidÅ¾iantys dalyviams siÅ«lyti gaires, jas komentuoti, balsuoti ir vieÅ¡ai matyti bendrus rezultatus. Tokie sprendimai skatina skaidrumÄ…, tarpinstitucinÄ¯ mokymÄ…si ir gerosios praktikos dalijimÄ…si.',
    'Å iame kontekste atsirado digistrategy.eu - eksperimentinis, atviras Ä¯rankis, skirtas skaitmenizacijos strategijÅ³ ar IT plÄ—tros planÅ³ gairÄ—ms formuoti ir prioritetizuoti. Jis leidÅ¾ia dalyviams struktÅ«ruotai Ä¯sitraukti Ä¯ strateginÄ¯ procesÄ… ir padeda greiÄiau pereiti nuo abstrakÄiÅ³ idÄ—jÅ³ prie aiÅ¡kiÅ³ sprendimÅ³ krypÄiÅ³.',
    'Svarbu pabrÄ—Å¾ti, kad tai nÄ—ra enterprise lygio ar sertifikuotas sprendimas - veikiau praktinis eksperimentas, skirtas parodyti, kaip pasitelkiant Å¡iuolaikines technologijas ir dirbtinÄ¯ intelektÄ… galima greitai sukurti veikianÄius, naudotojams suprantamus Ä¯rankius.',
    'Dirbtinis intelektas ir skaitmeniniai sprendimai jau keiÄia vieÅ¡ojo sektoriaus veiklos modelius. Organizacijos, kurios drÄ…siai eksperimentuoja, augina kompetencijas ir taiko technologijas tikslingai, turi realiÄ… galimybÄ™ judÄ—ti greiÄiau ir iÅ¡likti konkurencingos sparÄiai besikeiÄianÄioje aplinkoje.'
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
      metaTitle: 'digistrategy.eu | VieÅ¡ojo sektoriaus strategijÅ³ platforma',
      metaDescription: 'digistrategy.eu padeda institucijoms kartu kurti strategijas, susieti iniciatyvas ir skaidriai vieÅ¡inti paÅ¾angÄ….',
      navHow: 'Kaip veikia',
      navWhy: 'KodÄ—l iÅ¡siskiria',
      navTrust: 'Patikimumas',
      navLaunch: 'PradÄ—ti',
      langLabel: 'Kalba',
      headerCta: 'PerÅ¾iÅ«rÄ—ti aktyvias strategijas',
      heroKicker: 'StrategijÅ³ platforma vieÅ¡ajam sektoriui',
      heroTitle: 'Nuo idÄ—jÅ³ iki audituojamo Ä¯gyvendinimo Å¡iuolaikinÄ—ms vieÅ¡ojo sektoriaus institucijoms.',
      heroCopy: 'Kurkite gairiÅ³ struktÅ«ras, susiekite iniciatyvas, Ä¯traukite komandas Ä¯ skaidrÅ³ balsavimÄ… ir publikuokite strategijÅ³ Å¾emÄ—lapius, kuriuos supranta visa bendruomenÄ—.',
      heroPrimaryCta: 'PerÅ¾iÅ«rÄ—ti aktyvias strategijas',
      metricInstitutionsLabel: 'Aktyvios institucijos',
      metricGuidelinesLabel: 'Aktyvios gairÄ—s',
      metricInitiativesLabel: 'Aktyvios iniciatyvos',
      glassInstitutionLabel: 'Institucija',
      glassMainTitle: 'Skaitmenizacijos strategijos ciklas',
      glassMainCopy: 'GairÄ—s, iniciatyvos, atsakomybÄ—s ir bÅ«senos viename interaktyviame Å¾emÄ—lapyje.',
      glassStatsInstitutionsLabel: 'Aktyvios institucijos',
      glassStatsGuidelinesLabel: 'Aktyvios gairÄ—s',
      glassStatsInitiativesLabel: 'Aktyvios iniciatyvos',
      glassOutcomeLabel: 'RezultatÅ³ kontraktas',
      glassOutcomeTitle: 'Tikslas + terminas + Ä¯rodymai',
      glassAuditLabel: 'Audituojamumas',
      glassAuditTitle: 'SprendimÅ³ istorija matoma nuo pradÅ¾ios iki pabaigos',
      demoMapKicker: 'Interaktyvus pavyzdys',
      demoMapTitle: 'StrategijÅ³ Å¾emÄ—lapio mini demonstracija',
      demoMapCopy: 'Å is supaprastintas pavyzdys parodo, kaip institucijos strategija susiejama su pagrindinÄ—mis gairÄ—mis ir jas Ä¯gyvendinanÄiomis iniciatyvomis.',
      demoLegendGuideline: 'GairÄ—',
      demoLegendInitiative: 'Iniciatyva',
      demoInstitutionKind: 'Institucija',
      demoInstitutionTitle: 'Skaitmenizacijos strategijos ciklas',
      demoInstitutionCopy: 'Bendra kryptis ir prioritetai visai organizacijai.',
      demoGuidelineKind: 'GairÄ—',
      demoGuideline1Title: 'KlientÅ³ patirÄiÅ³ gerinimas',
      demoGuideline1Copy: 'Trumpesnis paslaugÅ³ kelias ir aiÅ¡kesnÄ— komunikacija.',
      demoGuideline2Title: 'DuomenÅ³ valdysenos stiprinimas',
      demoGuideline2Copy: 'Vieningi standartai ir kokybiÅ¡ki duomenys sprendimams.',
      demoGuideline3Title: 'SkaitmeniniÅ³ paslaugÅ³ plÄ—tra',
      demoGuideline3Copy: 'Daugiau savitarnos galimybiÅ³ ir greitesni procesai.',
      demoGuideline4Title: 'KompetencijÅ³ ugdymas',
      demoGuideline4Copy: 'KomandÅ³ pasirengimas dirbti su naujais Ä¯rankiais.',
      demoInitiativeKind: 'Iniciatyva',
      demoInitiative1Title: 'Vieningas registracijos kelias',
      demoInitiative1Copy: 'Vienas langas gyventojÅ³ uÅ¾klausoms ir aptarnavimui.',
      demoInitiative2Title: 'Savitarnos modernizavimas',
      demoInitiative2Copy: 'Atnaujinta naudotojÅ³ patirtis pagrindinÄ—se paslaugose.',
      demoInitiative3Title: 'Analitikos platforma',
      demoInitiative3Copy: 'Duomenimis grÄ¯sti sprendimai, nuolat stebint poveikio rodiklius.',
      backboneKicker: 'Europos skaitmeninis valdymas',
      backboneTitle: 'Patikimas pagrindas institucijÅ³ strategijÅ³ Ä¯gyvendinimui.',
      backboneJokeQuestion: 'Sukurta Europoje Europai?',
      backboneMetric1Title: 'DaugiainstitucÄ— architektÅ«ra',
      backboneMetric1Copy: 'Viena platforma daugeliui institucijÅ³ su aiÅ¡kiai atskirtu valdymu pagal roles.',
      backboneMetric2Title: 'Audito pÄ—dsakas',
      backboneMetric2Copy: 'SprendimÅ³ kontekstas iÅ¡lieka matomas per visÄ… strategijos ciklÄ….',
      backboneMetric3Title: 'Parengta vieÅ¡inimui',
      backboneMetric3Copy: 'View-only Ä¯terpimas leidÅ¾ia skaidriai vieÅ¡inti strategijÄ… ir iÅ¡laikyti valdymo kontrolÄ™.',
      uspKicker: 'IÅ¡skirtinÄ— vertÄ—',
      uspTitle: 'KodÄ—l tai daugiau nei planavimo lenta',
      feature1Title: 'AtskaitomybÄ—s laiko juosta',
      feature1Copy: 'Kiekvienas strateginis pakeitimas yra atsekamas: kas, kada ir kodÄ—l jÄ¯ atliko.',
      feature1Item1: 'Nekintama veiklos istorija',
      feature1Item2: 'AiÅ¡kus atsakomybiÅ³ perdavimas',
      feature1Item3: 'GreitesnÄ—s valdymo perÅ¾iÅ«ros',
      feature2Title: 'RezultatÅ³ kontraktai',
      feature2Copy: 'KiekvienÄ… iniciatyvÄ… paverskite pamatuojamu Ä¯sipareigojimu su baze, tikslu ir terminu.',
      feature2Item1: 'MaÅ¾iau abstrakÄiÅ³ Ä¯gyvendinimo planÅ³',
      feature2Item2: 'Ä®rodymais grÄ¯sti bÅ«senos atnaujinimai',
      feature2Item3: 'Prioritetai susieti su poveikiu',
      feature3Title: 'AI strategijos juodrastis is PDF',
      feature3Copy: 'Ikelkite bet kokius susijusius PDF dokumentus, o sistema automatiskai sugeneruos pradine strategijos juodrasti su gairiu ir iniciatyvu struktura.',
      feature3Item1: 'Keli PDF failai vienoje generacijoje',
      feature3Item2: 'Automatinis gairiu ir iniciatyvu pasiulymas',
      feature3Item3: 'Greitas startas tolesniam komandos tobulinimui',
      flowKicker: 'Eiga',
      flowTitle: 'Kaip institucijos vykdo strategijos ciklus',
      flow1Title: 'Pakvieskite komandas pagal roles',
      flow1Copy: 'Meta admin sukuria vienkartines pakvietimo nuorodas ir priskiria narystes pagal institucijas.',
      flow2Title: 'Suformuokite gairiÅ³ struktÅ«rÄ…',
      flow2Copy: 'Dalyviai siÅ«lo, diskutuoja, balsuoja ir kartu tobulina strategines kryptis.',
      flow3Title: 'Susiekite iniciatyvas su gairÄ—mis',
      flow3Copy: 'StrategijÅ³ Å¾emÄ—lapis parodo priklausomybes ir iÅ¡kart iÅ¡ryÅ¡kina nepriskirtus prioritetus.',
      flow4Title: 'Publikuokite ir stebÄ—kite',
      flow4Copy: 'Skelbkite view-only Å¾emÄ—lapius vieÅ¡ai, o administratoriai stebi apkrovÄ… ir panaudojimo rodiklius.',
      trustKicker: 'Patikimumas pagal dizainÄ…',
      trustTitle: 'Sukurta instituciniam valdymui, ne triukÅ¡mui',
      trustCopy: 'Platforma kurta atsakingam bendradarbiavimui: aiÅ¡kios rolÄ—s, istorijos iÅ¡saugojimas, kontroliuojamas vieÅ¡umas ir konfigÅ«ruojami saugumo saugikliai.',
      trust1Title: 'BendradarbystÄ—s dirbtuviÅ³ modelis',
      trust1Copy: 'Dalyviai komentuoja, prioritetizuoja ir kuria gaires per struktÅ«ruotus, skaidrius procesus.',
      trust2Title: 'InstitucinÄ— atmintis pagal dizainÄ…',
      trust2Copy: 'Archyvuoti vartotojai ir istoriniÅ³ sprendimÅ³ pÄ—dsakai padeda iÅ¡laikyti tÄ™stinumÄ… tarp ciklÅ³.',
      trust3Title: 'Operacinis matomumas',
      trust3Copy: 'UÅ¾klausÅ³ limitai ir stebÄ—sena padeda apsaugoti infrastruktÅ«rÄ… esant didelei apkrovai.',
      aboutKicker: 'Apie platformÄ…',
      aboutTitle: 'KodÄ—l Å¡i platforma sukurta',
      finalKicker: 'PasiruoÅ¡Ä™ pamatyti gyvai?',
      finalTitle: 'Atverkite aktyvÅ³ strategijos Å¾emÄ—lapÄ¯ dabar.',
      finalCopy: 'Aplankykite vieÅ¡Ä… strategijos erdvÄ™ ir pamatykite, kaip susijungia gairÄ—s bei iniciatyvos.',
      finalCta: 'PerÅ¾iÅ«rÄ—ti aktyvias strategijas',
      footerCopy: 'digistrategy.eu - strateginio bendradarbiavimo platforma vieÅ¡ojo sektoriaus institucijoms.',
      footerAccessButton: 'Gauti prieigÄ…',
      footerAccessLead: 'arba susisiekite per LinkedIn:',
      accessRequestTitle: 'Prieigos uÅ¾klausa',
      accessRequestDescription: 'Pateikite trumpÄ… informacijÄ… ir perÅ¾iÅ«rÄ—sime jÅ«sÅ³ uÅ¾klausÄ….',
      accessRequestInstitution: 'Institucija',
      accessRequestFullName: 'Vardas ir pavardÄ—',
      accessRequestEmail: 'Darbinis el. paÅ¡tas',
      accessRequestPhone: 'Kontaktinis telefono numeris',
      accessRequestNotes: 'Papildoma informacija (nebÅ«tina)',
      accessRequestSubmit: 'Pateikti uÅ¾klausÄ…',
      accessRequestClose: 'UÅ¾verti',
      accessRequestSuccess: 'UÅ¾klausa gauta. UÅ¾registruota: {REQUEST_CODE}',
      accessRequestError: 'Nepavyko pateikti uÅ¾klausos. Pabandykite dar kartÄ….',
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
      feature3Title: 'AI strategy draft from PDF',
      feature3Copy: 'Upload any relevant PDFs and the system will automatically generate an initial strategy draft with guideline and initiative structure.',
      feature3Item1: 'Multiple PDFs in one generation run',
      feature3Item2: 'Automatic guideline and initiative proposal',
      feature3Item3: 'Fast starting point for team refinement',
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

  function renderAboutBlocks(text) {
    const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!normalized) return '';
    const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
    return blocks.map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return '';
      const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));
      if (bulletLines.length === lines.length) {
        return `<article class="landing-about-block"><ul class="landing-about-list">${bulletLines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul></article>`;
      }
      return `<article class="landing-about-block"><p>${lines.map((line) => escapeHtml(line)).join('<br />')}</p></article>`;
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
          <a href="https://www.linkedin.com/in/lukaslukosevicius/" target="_blank" rel="noopener noreferrer">Lukas LukoseviÄius</a>.
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
