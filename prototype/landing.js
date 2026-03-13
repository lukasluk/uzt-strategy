(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const activeStrategyLinks = $$('[data-active-strategy-link]');
  const navLinks = $$('.landing-header [data-scroll-link]');
  const scrollLinks = $$('[data-scroll-link]');
  const accessRequestButtons = $$('[data-open-access-request]');
  const heroScene = $('[data-hero-scene]');
  const heroNodes = $$('[data-hero-node]');
  const heroLines = $$('[data-hero-line]');
  const aboutRoot = $('#landingAboutContent');
  const languageSelect = $('#landingLangSelect');
  const metaDescription = $('#landingMetaDescription');

  const metrics = {
    institutions: $('#glassMetricInstitutions'),
    guidelines: $('#glassMetricGuidelines'),
    initiatives: $('#glassMetricInitiatives')
  };

  const SUPPORTED_LANGS = ['lt', 'en'];
  const DEFAULT_LANG = 'lt';
  const STORAGE_LANG_KEY = 'landing_lang';
  const HERO_SEQUENCE = ['core', 'library', 'guidelines', 'initiatives', 'plan', 'metrics', 'publish'];
  const HERO_DELAY = 2800;
  const DEFAULT_ABOUT = {
    lt: [
      'Lietuvos viešajame sektoriuje strateginis darbas vis dar dažnai išskaidomas tarp dokumentų, skaičiuoklių ir atskirų sistemų.',
      'Dėl to gairės, iniciatyvos ir įgyvendinimo eiga praranda bendrą kontekstą, o viešinimas tampa papildomu rankiniu darbu.',
      'digistrategy.eu sukurta tam, kad strategija taptų gyvu darbo žemėlapiu: nuo bibliotekos ir gairių iki iniciatyvų, terminų bei pažangos viešinimo.'
    ].join('\n\n'),
    en: [
      'Across public institutions, strategy work is often split between documents, spreadsheets, and disconnected systems.',
      'That makes it hard to keep guidelines, initiatives, and implementation in one visible context.',
      'digistrategy.eu was created to turn strategy into a living operational map: from library content and guidelines to delivery planning and public progress views.'
    ].join('\n\n')
  };

  const TRANSLATIONS = {
    lt: {
      metaTitle: 'digistrategy.eu | Strategijos ir įgyvendinimas viename žemėlapyje',
      metaDescription: 'digistrategy.eu padeda institucijoms kurti gairių struktūrą, susieti iniciatyvas ir valdyti įgyvendinimą vienoje darbo erdvėje.',
      navHome: 'Pradžia',
      navLayers: 'Sluoksniai',
      navDemo: 'Demonstracija',
      navHow: 'Kaip tai veikia',
      navAbout: 'Apie platformą',
      langLabel: 'Kalba',
      headerCta: 'Atidaryti platformą',
      heroEyebrow: 'Strategijos darbo erdvė viešajam sektoriui',
      heroTitle: 'Strategija ir įgyvendinimas viename gyvame žemėlapyje.',
      heroCopy: 'Visa biblioteka, gairės, iniciatyvos ir įgyvendinimo planai vienoje darbo erdvėje.',
      heroAiLead: 'Analizuokite ir vystykite savo strategiją su: Mistral arba OpenAI modeliais',
      heroPrimaryCta: 'Naršyti strategijų biblioteką',
      heroSecondaryCta: 'Atidaryti platformą',
      heroMetricInstitutionsLabel: 'Aktyvios institucijos',
      heroMetricGuidelinesLabel: 'Aktyvios gairės',
      heroMetricInitiativesLabel: 'Aktyvios iniciatyvos',
      heroNodeCore: 'Strategija',
      heroNodeLibrary: 'Biblioteka',
      heroNodeGuidelines: 'Gairės',
      heroNodeInitiatives: 'Iniciatyvos',
      heroNodePlan: 'Įgyvendinimo planas',
      heroNodeMetrics: 'Rodikliai',
      heroNodePublish: 'Viešinimas',
      heroProjectLabel: 'INICIATYVA',
      heroProjectTitle: 'Vieningas paslaugos kelias',
      heroProjectStatus: 'Vykdoma',
      heroSignalLabel: 'RODIKLIS',
      heroSignalTitle: 'Gyventojų pasitenkinimas',
      heroSignalTrend: '+4.2%',
      heroMiniBadgeA: '3 gairės vykdomos',
      heroMiniBadgeB: '12 iniciatyvų',
      layersTitle: 'Visi strategijos sluoksniai vienoje sistemoje',
      layersCopy: 'Nuo viešos bibliotekos iki gairių, iniciatyvų ir matuojamo įgyvendinimo.',
      layer1Title: 'Strategijų biblioteka',
      layer1Copy: 'Naršykite viešas strategijas ir importuokite gaires ar iniciatyvas į savo moderuojamą ciklą.',
      layer2Title: 'Gairių struktūra',
      layer2Copy: 'Formuokite tėvines ir vaikines gaires, išlaikydami aiškią strategijos logiką.',
      layer3Title: 'Iniciatyvų susiejimas',
      layer3Copy: 'Kiekviena iniciatyva susiejama bent su viena gaire, todėl ryšiai lieka matomi žemėlapyje.',
      layer4Title: 'Įgyvendinimo planas',
      layer4Copy: 'Priskirkite terminus, atsakomybes ir eigą toms pačioms gairėms bei iniciatyvoms.',
      layer5Title: 'Rodikliai ir stebėsena',
      layer5Copy: 'Matykite pažangą per rodiklius, būsenas ir laiko pjūvius toje pačioje sistemoje.',
      layer6Title: 'Viešas strategijos žemėlapis',
      layer6Copy: 'Publikuokite view-only žemėlapį ir skaidriai parodykite, kaip strategija juda į vykdymą.',
      trustTitle: 'Patikimas pagrindas strategijos valdymui.',
      trustCopy: 'Platforma kurta instituciniam naudojimui: atskirai valdoma pagal institucijas, su istorija ir viešinimo kontrole.',
      trust1Title: 'Daugiainstitucinė architektūra',
      trust1Copy: 'Viena platforma daugeliui institucijų su atskirais nariais, ciklais ir valdymu pagal roles.',
      trust2Title: 'Audito pėdsakas',
      trust2Copy: 'Sprendimų kontekstas, pasiūlymai ir ryšiai neišnyksta, kai strategija pereina į vykdymą.',
      trust3Title: 'Parengta viešinimui',
      trust3Copy: 'Vieši žemėlapiai ir embed režimas leidžia dalintis rezultatais neatsiveriant vidinio valdymo.',
      demoTitle: 'Strategijos žemėlapio demonstracija',
      demoCopy: 'Tas pats modelis leidžia matyti gaires, iniciatyvas ir jų įgyvendinimo logiką viename vaizde.',
      demoViewMap: 'Žemėlapis',
      demoViewList: 'Sąrašas',
      demoViewTable: 'Lentelė',
      demoNodeCoreLabel: 'Strategija',
      demoNodeCoreTitle: 'Skaitmenizacijos strategijos ciklas',
      demoNodeGuidelineLabel: 'Gairė',
      demoNodeInitiativeLabel: 'Iniciatyva',
      demoNodePlanLabel: 'Planas',
      demoGuideline1Title: 'Patogesnės viešosios paslaugos',
      demoGuideline1Copy: 'Trumpesnis kelias naudotojui ir mažiau nereikalingų žingsnių.',
      demoGuideline2Title: 'Duomenų valdysena',
      demoGuideline2Copy: 'Vieningi standartai, atsakomybės ir rodiklių stebėsena.',
      demoInitiative1Title: 'Savitarnos modernizavimas',
      demoInitiative1Copy: 'Nauja naudotojo kelionė ir aiškesnės skaitmeninės paslaugos.',
      demoInitiative2Title: 'Analitikos platforma',
      demoInitiative2Copy: 'Vienas vaizdas sprendimams, rodikliams ir būsenos signalams.',
      demoPlanTitle: 'Įgyvendinimo planas',
      demoPlanCopy: 'Terminai, atsakomybės ir būsena paliekami tame pačiame kontekste.',
      flowTitle: 'Nuo gairių prie vykdymo',
      flowCopy: 'Platforma skirta ne tik strategijai sudėti, bet ir ją nuosekliai vykdyti.',
      flow1Title: 'Sukurkite gairių struktūrą',
      flow1Copy: 'Institucijos komanda siūlo, komentuoja ir derina gaires viename procese.',
      flow2Title: 'Susiekite iniciatyvas',
      flow2Copy: 'Iniciatyvos pririšamos prie gairių, todėl ryšiai nepasimeta tarp dokumentų.',
      flow3Title: 'Pridėkite įgyvendinimo planą',
      flow3Copy: 'Terminus, atsakomybes ir eigą matysite tame pačiame strategijos objekte.',
      flow4Title: 'Publikuokite žemėlapį',
      flow4Copy: 'Viešinkite skaidriai ir parodykite pažangą be papildomo rankinio suvedimo.',
      governanceTitle: 'Sukurta instituciniam valdymui',
      governance1Title: 'Bendradarbiavimo modelis',
      governance2Title: 'Institucinė atmintis',
      governance3Title: 'Operacinis matomumas',
      aboutTitle: 'Kodėl ši platforma sukurta',
      aboutVisualEyebrow: 'Strategija',
      aboutVisualTitle: 'Nuo gairių iki viešo vykdymo vaizdo',
      aboutVisualCopy: 'Vienas modelis planavimui, susiejimui ir pažangos parodymui.',
      finalTitle: 'Atidarykite platformą dabar.',
      finalCopy: 'Peržiūrėkite viešą strategijos erdvę ir pamatykite, kaip gairės bei iniciatyvos susijungia į vykdymą.',
      finalPrimaryCta: 'Naršyti strategijų biblioteką',
      finalSecondaryCta: 'Atidaryti platformą',
      footerColumn1Title: 'Produktas',
      footerColumn2Title: 'Platforma',
      footerColumn3Title: 'Kontaktas',
      footerLibraryLink: 'Strategijų biblioteka',
      footerMapLink: 'Strategijos žemėlapis',
      footerHowLink: 'Kaip tai veikia',
      footerAboutLink: 'Apie platformą',
      footerAccessButton: 'Gauti prieigą',
      footerCopy: 'digistrategy.eu padeda institucijoms kurti strategiją, susieti gaires su iniciatyvomis ir viešinti pažangą.',
      accessRequestTitle: 'Prieigos užklausa',
      accessRequestDescription: 'Palikite kontaktus ir trumpą kontekstą. Peržiūrėsime užklausą ir susisieksime.',
      accessRequestInstitution: 'Institucija',
      accessRequestFullName: 'Vardas ir pavardė',
      accessRequestEmail: 'Darbinis el. paštas',
      accessRequestPhone: 'Telefono numeris',
      accessRequestNotes: 'Papildoma informacija',
      accessRequestSubmit: 'Pateikti užklausą',
      accessRequestClose: 'Uždaryti',
      accessRequestSuccess: 'Užklausa gauta. Registracijos kodas: {REQUEST_CODE}',
      accessRequestError: 'Nepavyko pateikti užklausos. Pabandykite dar kartą.',
      accessRequestLinkedInLead: 'Taip pat galite susisiekti tiesiogiai per LinkedIn:'
    },
    en: {
      metaTitle: 'digistrategy.eu | Strategy and execution in one living map',
      metaDescription: 'digistrategy.eu helps institutions structure guidelines, connect initiatives, and manage delivery in one workspace.',
      navHome: 'Home', navLayers: 'Layers', navDemo: 'Demo', navHow: 'How it works', navAbout: 'About', langLabel: 'Language',
      headerCta: 'Open platform', heroEyebrow: 'Strategy workspace for the public sector', heroTitle: 'Strategy and execution in one living map.',
      heroCopy: 'Library, guidelines, initiatives, and implementation plans in one shared workspace.', heroAiLead: 'Analyze and develop your strategy with Mistral or OpenAI models',
      heroPrimaryCta: 'Browse strategy library',
      heroSecondaryCta: 'Open platform', heroMetricInstitutionsLabel: 'Active institutions', heroMetricGuidelinesLabel: 'Active guidelines',
      heroMetricInitiativesLabel: 'Active initiatives', heroNodeCore: 'Strategy', heroNodeLibrary: 'Library', heroNodeGuidelines: 'Guidelines',
      heroNodeInitiatives: 'Initiatives', heroNodePlan: 'Implementation plan', heroNodeMetrics: 'Metrics', heroNodePublish: 'Publishing',
      heroProjectLabel: 'INITIATIVE', heroProjectTitle: 'Unified service journey', heroProjectStatus: 'In progress',
      heroSignalLabel: 'METRIC', heroSignalTitle: 'Resident satisfaction', heroSignalTrend: '+4.2%', heroMiniBadgeA: '3 guidelines active', heroMiniBadgeB: '12 initiatives',
      layersTitle: 'All strategy layers in one system', layersCopy: 'From public library content to guidelines, initiatives, and measurable execution.',
      layer1Title: 'Strategy library', layer1Copy: 'Browse public strategies and import guidelines or initiatives into your moderated cycle.',
      layer2Title: 'Guideline structure', layer2Copy: 'Build parent and child guideline structures without losing strategic clarity.',
      layer3Title: 'Initiative mapping', layer3Copy: 'Every initiative links to at least one guideline, so relationships stay visible on the map.',
      layer4Title: 'Implementation plan', layer4Copy: 'Assign dates, owners, and status to the same guidelines and initiatives.',
      layer5Title: 'Metrics and monitoring', layer5Copy: 'Track progress through metrics, statuses, and timeline views in the same system.',
      layer6Title: 'Public strategy map', layer6Copy: 'Publish a view-only map and show how strategy moves into delivery.',
      trustTitle: 'A reliable foundation for strategy management.', trustCopy: 'Built for institutional use: separated by institution, with visible history and controlled publication.',
      trust1Title: 'Multi-institution architecture', trust1Copy: 'One platform for many institutions with separate members, cycles, and role-based governance.',
      trust2Title: 'Audit trail', trust2Copy: 'Decision context, proposals, and relationships remain visible when strategy moves into delivery.',
      trust3Title: 'Ready for publication', trust3Copy: 'Public maps and embed mode let you share results without exposing internal governance.',
      demoTitle: 'Strategy map demo', demoCopy: 'The same model keeps guidelines, initiatives, and implementation logic in one view.',
      demoViewMap: 'Map', demoViewList: 'List', demoViewTable: 'Table', demoNodeCoreLabel: 'Strategy', demoNodeCoreTitle: 'Digital strategy cycle', demoNodeGuidelineLabel: 'Guideline',
      demoNodeInitiativeLabel: 'Initiative', demoNodePlanLabel: 'Plan', demoGuideline1Title: 'Better public services',
      demoGuideline1Copy: 'A shorter service journey and fewer unnecessary steps for end users.', demoGuideline2Title: 'Data governance',
      demoGuideline2Copy: 'Shared standards, accountability, and metric visibility.', demoInitiative1Title: 'Self-service modernization',
      demoInitiative1Copy: 'A cleaner user journey and more understandable digital services.', demoInitiative2Title: 'Analytics platform',
      demoInitiative2Copy: 'One view for decisions, indicators, and delivery signals.', demoPlanTitle: 'Implementation plan',
      demoPlanCopy: 'Dates, owners, and status remain in the same strategic context.', flowTitle: 'From guidelines to delivery',
      flowCopy: 'The platform is meant not only to structure strategy, but to run it over time.', flow1Title: 'Build the guideline structure',
      flow1Copy: 'Institution teams propose, discuss, and refine guidelines in one shared process.', flow2Title: 'Link initiatives',
      flow2Copy: 'Initiatives are mapped to guidelines so relationships do not disappear across documents.', flow3Title: 'Add the implementation plan',
      flow3Copy: 'Dates, owners, and execution status stay attached to the same strategy objects.', flow4Title: 'Publish the map',
      flow4Copy: 'Share progress transparently without extra manual reporting work.', governanceTitle: 'Built for institutional governance',
      governance1Title: 'Collaboration model', governance2Title: 'Institutional memory', governance3Title: 'Operational visibility', aboutTitle: 'Why this platform exists',
      aboutVisualEyebrow: 'Strategy', aboutVisualTitle: 'From guidelines to a public execution view', aboutVisualCopy: 'One model for planning, linking work, and showing progress.',
      finalTitle: 'Open the platform now.', finalCopy: 'Explore the public strategy workspace and see how guidelines and initiatives connect to delivery.',
      finalPrimaryCta: 'Browse strategy library', finalSecondaryCta: 'Open platform', footerColumn1Title: 'Product', footerColumn2Title: 'Platform',
      footerColumn3Title: 'Contact', footerLibraryLink: 'Strategy library', footerMapLink: 'Strategy map', footerHowLink: 'How it works',
      footerAboutLink: 'About the platform', footerAccessButton: 'Request access',
      footerCopy: 'digistrategy.eu helps institutions shape strategy, link guidelines to initiatives, and publish progress.',
      accessRequestTitle: 'Access request', accessRequestDescription: 'Share your contact details and context. We will review the request and follow up.',
      accessRequestInstitution: 'Institution', accessRequestFullName: 'Full name', accessRequestEmail: 'Work email', accessRequestPhone: 'Phone number',
      accessRequestNotes: 'Additional information', accessRequestSubmit: 'Submit request', accessRequestClose: 'Close',
      accessRequestSuccess: 'Request received. Registration code: {REQUEST_CODE}', accessRequestError: 'Failed to submit request. Please try again.',
      accessRequestLinkedInLead: 'You can also reach out directly on LinkedIn:'
    }
  };

  let currentLang = DEFAULT_LANG;
  let preferredStrategySlug = 'uzt';
  let adminAboutTextByLang = { lt: '', en: '' };
  let adminTranslations = { lt: {}, en: {} };
  let heroState = { active: 'core', timer: 0, resume: 0, frame: 0, currentX: 0, currentY: 0, targetX: 0, targetY: 0, currentGX: 50, currentGY: 44, targetGX: 50, targetGY: 44 };

  const bundle = () => ({ ...TRANSLATIONS[currentLang], ...(adminTranslations[currentLang] || {}) });
  const text = (key) => bundle()[key] || '';
  const setMetric = (node, value) => { if (node) node.textContent = Number.isFinite(value) ? String(value) : '--'; };
  const setActiveHref = () => activeStrategyLinks.forEach((link) => link.setAttribute('href', `/index.html?institution=${encodeURIComponent(preferredStrategySlug)}&view=map&lang=${encodeURIComponent(currentLang)}`));
  const escaped = (value) => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

  function renderAbout() {
    if (!aboutRoot) return;
    const value = String(adminAboutTextByLang[currentLang] || DEFAULT_ABOUT[currentLang]).trim();
    aboutRoot.innerHTML = value.split(/\n{2,}/).map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return '';
      if (lines.every((line) => /^[-*]\s+/.test(line))) return `<article class="landing-about-block"><ul class="landing-about-list">${lines.map((line) => `<li>${escaped(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul></article>`;
      return `<article class="landing-about-block"><p>${lines.map(escaped).join('<br />')}</p></article>`;
    }).join('');
  }

  function applyTranslations() {
    document.title = text('metaTitle') || document.title;
    if (metaDescription) metaDescription.content = text('metaDescription');
    $$('[data-i18n]').forEach((node) => { const key = node.getAttribute('data-i18n'); if (key && text(key)) node.textContent = text(key); });
    if (languageSelect) languageSelect.value = currentLang;
    renderAbout();
    setActiveHref();
  }

  function setLanguage(lang, updateUrl) {
    currentLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    try { localStorage.setItem(STORAGE_LANG_KEY, currentLang); } catch {}
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', currentLang);
      window.history.replaceState({}, '', url.toString());
    }
    applyTranslations();
  }

  function initLanguage() {
    const urlLang = new URL(window.location.href).searchParams.get('lang');
    let lang = SUPPORTED_LANGS.includes(String(urlLang || '').toLowerCase()) ? String(urlLang).toLowerCase() : '';
    if (!lang) try { const stored = String(localStorage.getItem(STORAGE_LANG_KEY) || '').toLowerCase(); if (SUPPORTED_LANGS.includes(stored)) lang = stored; } catch {}
    setLanguage(lang || DEFAULT_LANG, true);
    if (languageSelect) languageSelect.addEventListener('change', () => setLanguage(languageSelect.value, true));
  }

  async function loadContentSettings() {
    try {
      const response = await fetch('/api/v1/public/content-settings', { credentials: 'same-origin' });
      if (!response.ok) return;
      const settings = (await response.json())?.contentSettings || {};
      adminAboutTextByLang = { lt: String(settings.aboutTextLt || settings.aboutText || '').trim(), en: String(settings.aboutTextEn || '').trim() };
      adminTranslations = {
        lt: settings.landingTranslationsLt && typeof settings.landingTranslationsLt === 'object' ? settings.landingTranslationsLt : {},
        en: settings.landingTranslationsEn && typeof settings.landingTranslationsEn === 'object' ? settings.landingTranslationsEn : {}
      };
      applyTranslations();
    } catch {}
  }

  function toSummary(payload) {
    const items = (Array.isArray(payload?.institutions) ? payload.institutions : []).map((item) => ({
      slug: String(item?.slug || '').trim(),
      hasCycle: Boolean(item?.cycle?.id),
      guidelines: Array.isArray(item?.guidelines) ? item.guidelines.filter((entry) => String(entry?.status || '').toLowerCase() === 'active').length : 0,
      initiatives: Array.isArray(item?.initiatives) ? item.initiatives.filter((entry) => String(entry?.status || '').toLowerCase() === 'active').length : 0
    })).filter((item) => item.slug);
    return {
      items,
      totalGuidelines: items.reduce((sum, item) => sum + item.guidelines, 0),
      totalInitiatives: items.reduce((sum, item) => sum + item.initiatives, 0)
    };
  }

  async function loadMetrics() {
    try {
      const institutionResponse = await fetch('/api/v1/public/institutions', { credentials: 'same-origin' });
      if (institutionResponse.ok) {
        const institutions = (await institutionResponse.json())?.institutions || [];
        const active = institutions.filter((item) => String(item?.status || '').toLowerCase() === 'active');
        setMetric(metrics.institutions, active.length || institutions.length || 0);
        preferredStrategySlug = String((active.find((item) => item?.slug) || institutions.find((item) => item?.slug) || {}).slug || preferredStrategySlug);
      }
    } catch {
      setMetric(metrics.institutions, null);
    }

    try {
      const response = await fetch('/api/v1/public/strategy-map?source=app', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('strategy-map');
      const summary = toSummary(await response.json());
      const ranked = summary.items.filter((item) => item.hasCycle && (item.guidelines + item.initiatives) > 0).sort((a, b) => (b.guidelines + b.initiatives) - (a.guidelines + a.initiatives));
      if (ranked[0]?.slug) preferredStrategySlug = ranked[0].slug;
      setMetric(metrics.guidelines, summary.totalGuidelines);
      setMetric(metrics.initiatives, summary.totalInitiatives);
    } catch {
      setMetric(metrics.guidelines, null);
      setMetric(metrics.initiatives, null);
    }

    setActiveHref();
  }

  function showAccessModal() {
    const overlay = document.createElement('div');
    overlay.id = 'landingAccessRequestOverlay';
    overlay.className = 'landing-access-overlay';
    overlay.innerHTML = `
      <div class="landing-access-card">
        <div class="header-row">
          <h3>${escaped(text('accessRequestTitle'))}</h3>
          <button type="button" class="btn btn-secondary" id="closeLandingAccessRequest">${escaped(text('accessRequestClose'))}</button>
        </div>
        <p class="prompt">${escaped(text('accessRequestDescription'))}</p>
        <div id="landingAccessRequestStatus" class="landing-access-status" hidden></div>
        <form id="landingAccessRequestForm" class="landing-access-form">
          <label for="landingAccessInstitution">${escaped(text('accessRequestInstitution'))}</label>
          <input id="landingAccessInstitution" type="text" name="institutionName" required />
          <label for="landingAccessFullName">${escaped(text('accessRequestFullName'))}</label>
          <input id="landingAccessFullName" type="text" name="fullName" required />
          <label for="landingAccessEmail">${escaped(text('accessRequestEmail'))}</label>
          <input id="landingAccessEmail" type="email" name="workEmail" required />
          <label for="landingAccessPhone">${escaped(text('accessRequestPhone'))}</label>
          <input id="landingAccessPhone" type="text" name="phone" required />
          <label for="landingAccessNotes">${escaped(text('accessRequestNotes'))}</label>
          <textarea id="landingAccessNotes" name="notes" rows="4"></textarea>
          <div style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;" aria-hidden="true">
            <label for="landingAccessOrgWebsite">Organization website</label>
            <input id="landingAccessOrgWebsite" type="text" name="organizationWebsite" tabindex="-1" autocomplete="off" />
          </div>
          <button type="submit" class="btn btn-primary">${escaped(text('accessRequestSubmit'))}</button>
        </form>
        <p class="landing-access-linkedin">${escaped(text('accessRequestLinkedInLead'))} <a href="https://www.linkedin.com/in/lukaslukosevicius/" target="_blank" rel="noopener noreferrer">Lukas Lukosevičius</a>.</p>
      </div>`;
    document.body.appendChild(overlay);

    const statusNode = $('#landingAccessRequestStatus', overlay);
    $('#closeLandingAccessRequest', overlay)?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.remove(); });

    $('#landingAccessRequestForm', overlay)?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = $('button[type="submit"]', form);
      if (submit) submit.disabled = true;
      if (statusNode) { statusNode.hidden = true; statusNode.textContent = ''; }
      try {
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        const response = await fetch('/api/v1/public/access-requests', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(data?.error || 'request failed'));
        if (statusNode) {
          statusNode.hidden = false;
          statusNode.className = 'landing-access-status is-success';
          statusNode.textContent = text('accessRequestSuccess').replace('{REQUEST_CODE}', String(data?.requestCode || '-'));
        }
        form.reset();
      } catch {
        if (statusNode) {
          statusNode.hidden = false;
          statusNode.className = 'landing-access-status is-error';
          statusNode.textContent = text('accessRequestError');
        }
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  function initAccessButtons() {
    accessRequestButtons.forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); $('#landingAccessRequestOverlay')?.remove(); showAccessModal(); }));
  }

  function initReveal() {
    const sections = $$('.section-reveal');
    if (!('IntersectionObserver' in window)) return sections.forEach((section) => section.classList.add('revealed'));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  function initNav() {
    const sections = navLinks.map((link) => ({ link, element: $(link.getAttribute('href')) })).filter((item) => item.element);
    const setActive = (targetLink) => navLinks.forEach((link) => link.classList.toggle('active', link === targetLink));
    const sync = () => {
      const probe = (window.scrollY || window.pageYOffset || 0) + 140;
      let current = sections[0];
      sections.forEach((section) => { if (section.element.offsetTop <= probe) current = section; });
      setActive(current?.link || null);
    };
    scrollLinks.forEach((link) => link.addEventListener('click', (event) => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (navLinks.includes(link)) setActive(link);
    }));
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  function initHeader() {
    const header = $('.landing-header');
    if (!header) return;
    let lastY = window.scrollY || window.pageYOffset || 0;
    let ticking = false;
    const update = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const past = y > 180;
      header.classList.toggle('is-floating', past);
      if (!past || y < lastY || y < 40) header.classList.add('is-visible');
      else if (y > lastY) header.classList.remove('is-visible');
      lastY = y;
      ticking = false;
    };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  function setHeroActive(id) {
    heroState.active = HERO_SEQUENCE.includes(id) ? id : 'core';
    if (heroScene) heroScene.setAttribute('data-active-node', heroState.active);
    heroNodes.forEach((node) => node.classList.toggle('is-active', node.getAttribute('data-hero-node') === heroState.active));
    heroLines.forEach((line) => line.classList.toggle('is-active', line.getAttribute('data-from') === heroState.active || line.getAttribute('data-to') === heroState.active));
  }

  function clearHeroTimers() {
    if (heroState.timer) clearInterval(heroState.timer);
    if (heroState.resume) clearTimeout(heroState.resume);
    heroState.timer = 0;
    heroState.resume = 0;
  }

  function startHeroRotation() {
    clearHeroTimers();
    heroState.timer = setInterval(() => {
      const index = HERO_SEQUENCE.indexOf(heroState.active);
      setHeroActive(HERO_SEQUENCE[(index + 1) % HERO_SEQUENCE.length]);
    }, HERO_DELAY);
  }

  function requestHeroFrame() {
    if (heroState.frame || !heroScene) return;
    heroState.frame = requestAnimationFrame(function render() {
      heroState.currentX += (heroState.targetX - heroState.currentX) * 0.12;
      heroState.currentY += (heroState.targetY - heroState.currentY) * 0.12;
      heroState.currentGX += (heroState.targetGX - heroState.currentGX) * 0.12;
      heroState.currentGY += (heroState.targetGY - heroState.currentGY) * 0.12;
      heroScene.style.setProperty('--hero-shift-x', `${heroState.currentX.toFixed(2)}px`);
      heroScene.style.setProperty('--hero-shift-y', `${heroState.currentY.toFixed(2)}px`);
      heroScene.style.setProperty('--hero-glow-x', `${heroState.currentGX.toFixed(2)}%`);
      heroScene.style.setProperty('--hero-glow-y', `${heroState.currentGY.toFixed(2)}%`);
      const moving = Math.abs(heroState.targetX - heroState.currentX) > 0.08 || Math.abs(heroState.targetY - heroState.currentY) > 0.08 || Math.abs(heroState.targetGX - heroState.currentGX) > 0.12 || Math.abs(heroState.targetGY - heroState.currentGY) > 0.12;
      if (moving) heroState.frame = requestAnimationFrame(render);
      else heroState.frame = 0;
    });
  }

  function initHero() {
    if (!heroScene || !heroNodes.length) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setHeroActive('core');
    heroNodes.forEach((node) => node.addEventListener('mouseenter', () => {
      clearHeroTimers();
      setHeroActive(node.getAttribute('data-hero-node'));
      heroState.resume = setTimeout(startHeroRotation, HERO_DELAY + 600);
    }));
    if (reduced) return;
    startHeroRotation();
    heroScene.addEventListener('pointermove', (event) => {
      const bounds = heroScene.getBoundingClientRect();
      const nx = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const ny = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      heroState.targetX = nx * 12;
      heroState.targetY = ny * 10;
      heroState.targetGX = 50 + (nx * 18);
      heroState.targetGY = 44 + (ny * 16);
      requestHeroFrame();
    }, { passive: true });
    heroScene.addEventListener('pointerleave', () => {
      heroState.targetX = 0;
      heroState.targetY = 0;
      heroState.targetGX = 50;
      heroState.targetGY = 44;
      requestHeroFrame();
    });
  }

  initLanguage();
  initHeader();
  initReveal();
  initNav();
  initHero();
  initAccessButtons();
  renderAbout();
  loadContentSettings();
  loadMetrics();
})();
