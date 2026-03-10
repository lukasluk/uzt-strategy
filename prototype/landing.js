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
      headerCta: 'Atidaryti platforma',
      heroKicker: 'Strategijų platforma viešajam sektoriui',
      heroTitle: 'Nuo idėjų iki audituojamo įgyvendinimo šiuolaikinėms viešojo sektoriaus institucijoms.',
      heroCopy: 'Kurkite gairių struktūras, susiekite iniciatyvas, įtraukite komandas į skaidrų balsavimą ir publikuokite strategijų žemėlapius, kuriuos supranta visa bendruomenė.',
      heroPrimaryCta: 'Atidaryti platforma',
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
      feature3Title: 'AI strategijos juodrastis is PDF',
      feature3Copy: 'Ikelkite bet kokius susijusius PDF dokumentus, o sistema automatiskai sugeneruos pradine strategijos juodrasti su gairiu ir iniciatyvu struktura.',
      feature3Item1: 'Keli PDF failai vienoje generacijoje',
      feature3Item2: 'Automatinis gairiu ir iniciatyvu pasiulymas',
      feature3Item3: 'Greitas startas tolesniam komandos tobulinimui',
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
      finalCta: 'Atidaryti platforma',
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
      headerCta: 'Open Platform',
      heroKicker: 'Public Strategy OS',
      heroTitle: 'From ideas to auditable execution for modern public institutions.',
      heroCopy: 'Build guideline structures, connect initiatives, involve teams in transparent voting, and publish strategy maps your community can actually understand.',
      heroPrimaryCta: 'Open Platform',
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
      finalCta: 'Open Platform',
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

  const LANDING_REFRESH_TRANSLATIONS = {
    lt: {
      metaTitle: 'digistrategy.eu | Gyva strategijų platforma viešajam sektoriui',
      metaDescription: 'digistrategy.eu sujungia strategijų biblioteką, gairių ir iniciatyvų žemėlapį, įgyvendinimo planą ir plan playback vienoje platformoje.',
      headerCta: 'Atidaryti gyvą platformą',
      heroKicker: 'Gyva strategijų platforma',
      heroTitle: 'Strategija, importas ir įgyvendinimas viename gyvame žemėlapyje.',
      heroCopy: 'digistrategy.eu sujungia viešą strategijų biblioteką, gairių ir iniciatyvų žemėlapį, įgyvendinimo planą, strateginius ryšius ir plan playback vienoje darbo erdvėje institucijoms.',
      heroSecondaryCta: 'Naršyti strategijų biblioteką',
      heroPrimaryCta: 'Atidaryti platformą',
      heroProof1: 'Vieša strategijų biblioteka',
      heroProof2: '„Use in my strategy“ importas',
      heroProof3: 'Įgyvendinimo planas',
      heroProof4: 'Timeline playback',
      heroVisualBadge: 'Gyva strategijos darbo erdvė',
      heroFloatLabel1: 'Importas',
      heroFloatTitle1: 'Importuokite vieną gairę iš viešos bibliotekos.',
      heroFloatLabel2: 'Planas',
      heroFloatTitle2: 'Nustatykite datas ir atsakingus strategijos kontekste.',
      heroFloatLabel3: 'Playback',
      heroFloatTitle3: 'Atkurkite vykdymo eigą tame pačiame žemėlapyje.',
      heroObjectKicker: 'Gyvas strategijos žemėlapis',
      heroObjectTitle: 'Gairės, iniciatyvos, atsakingi ir laikas viename objekte.',
      heroObjectCopy: 'Vienas erdvinis modelis struktūrai, atskaitomybei ir vykdymui.',
      heroLibraryKicker: 'Importuokite tai, kas jau veikia',
      heroLibraryTitle: 'Naršykite išorines strategijas ir perkelkite vieną gairę į savo ciklą.',
      heroImportSourceLabel: 'Išorinė strategija',
      heroImportSourceItem: 'Darbuotojų produktyvumo didinimas',
      heroImportTargetLabel: 'Jūsų organizacija',
      heroImportTargetTitle: 'Sukurti pasiūlymą',
      heroImportTargetItem: 'Išsaugomas šaltinis ir strateginis ryšys',
      heroMapKicker: 'Plano režimas',
      heroMapTitle: 'Peržiūrėkite, kaip vykdymas atsiranda žemėlapyje laiko eigoje.',
      heroMapChip1: 'Gairės',
      heroMapChip2: 'Iniciatyvos',
      heroMapChip3: 'Planas',
      heroPlanKicker: 'Įgyvendinimo planas',
      heroPlanTitle: 'Nustatykite datas ir atsakingus padalinius neišeidami iš strategijos konteksto.',
      heroPlanOwner2: 'Klientų aptarnavimo padalinys',
      heroPlanOwner3: 'Duomenų valdysenos komanda',
      uspKicker: 'Produkto paviršiai',
      uspTitle: 'Visi nauji strategijos sluoksniai vienoje sistemoje',
      uspCopy: 'Landing dabar turi rodyti ne vien planavimą, bet ir tai, kaip strategija pernaudojama, valdoma, susiejama ir paverčiama į realų vykdymą.',
      uspBadge1: 'Biblioteka → Importas',
      uspBadge2: 'Žemėlapis → Planas',
      uspBadge3: 'Ryšiai → Kontekstas',
      uspBadge4: 'AI → Juodraštis',
      product1Kicker: 'Tarpinstitucinis mokymasis',
      product1Title: 'Naršykite viešas strategijas ir importuokite tai, kas tinka.',
      product1Copy: 'Strategijų biblioteka skirta ne tik skaitymui. Komanda gali atsidaryti išorinę strategiją, pasirinkti gairę ar iniciatyvą ir perkelti ją į savo moderuojamą eigą.',
      product1Item1: 'Mygtukas rodomas tik naršant išorines strategijas',
      product1Item2: 'Sukuriamas pasiūlymas, o ne tiesioginis įrašas į aktyvų ciklą',
      product1Item3: 'Išsaugoma kilmė ir strateginiai ryšiai',
      product1VisualSource: 'Išorinė biblioteka',
      product1VisualSourceItem: 'Use in my strategy',
      product1VisualTarget: 'Tikslinis ciklas',
      product1VisualTargetTitle: 'Importo pasiūlymas',
      product1VisualTargetItem: 'Ryšys, tėvinė gairė, pastabos, provenance',
      product2Kicker: 'Vykdymo playback',
      product2Title: 'Perjunkite į Plano režimą ir stebėkite, kaip žemėlapyje atsiranda vykdymas.',
      product2Copy: 'Tas pats žemėlapis dabar vienu metu rodo gaires ir iniciatyvas, kartu su playback valdikliais, datomis ir timeline taškais.',
      product2Tag1: 'Plano sluoksnis',
      product2Tag2: 'Timeline',
      product2Tag3: 'Ripple efektas',
      product3Kicker: 'Įgyvendinimo darbo erdvė',
      product3Title: 'Priskirkite datas ir atsakingus kiekvienam elementui.',
      product3Copy: 'Administratoriai redaguoja atskiroje įgyvendinimo planavimo skiltyje ir vidiniuose kortelių puslapiuose. Kiti mato vieną bendrą tiesos šaltinį.',
      product3Tag1: 'Datos',
      product3Tag2: 'Atsakingi',
      product3Tag3: 'Peržiūra kitiems',
      product4Kicker: 'Strateginė atmintis',
      product4Title: 'Išlaikykite šaltinio kontekstą, užuot jį praradę copy-paste procese.',
      product4Copy: 'Strateginiai ryšiai, pasiūlymų moderavimas ir viešai parengti vaizdai leidžia pernaudoti idėjas saugiai ir skaidriai.',
      product4Tag1: 'Strateginiai ryšiai',
      product4Tag2: 'Moderavimas',
      product4Tag3: 'Parengta viešinimui',
      product5Kicker: 'AI pagreitinimas',
      product5Title: 'Pradėkite nuo PDF, tada tobulinkite struktūrą su komanda.',
      product5Copy: 'Sugeneruokite strategijos juodraštį iš dokumentų, paverskite šaltinių idėjas anglišku JSON ir tęskite darbą toje pačioje gairių ir iniciatyvų eigoje.',
      product5Tag1: 'Keli PDF viename juodraštyje',
      product5Tag2: 'English JSON',
      product5Tag3: 'Komandinis tobulinimas',
      backboneTitle: 'Patikimas pagrindas strategijos valdymui ir įgyvendinimui.',
      flowTitle: 'Kaip institucijos pereina nuo krypties prie vykdymo',
      flow1Title: 'Pakvieskite komandas pagal roles',
      flow1Copy: 'Meta administratorius sukuria vienkartines pakvietimo nuorodas ir priskiria narystes pagal institucijas.',
      flow2Title: 'Sugeneruokite arba importuokite struktūrą',
      flow2Copy: 'Pradėkite nuo AI juodraščio arba viešos bibliotekos, tada komanda diskutuoja, balsuoja ir tikslina gaires.',
      flow3Title: 'Susiekite iniciatyvas ir strateginius ryšius',
      flow3Copy: 'Žemėlapis parodo, kaip gairės, vaikinės gairės, iniciatyvos ir pernaudoti elementai susijungia viename vaizde.',
      flow4Title: 'Priskirkite datas, atsakingus ir paleiskite planą',
      flow4Copy: 'Administratoriaus įgyvendinimo planas ir plan playback leidžia tą pačią strategiją matyti ir kaip struktūrą, ir kaip vykdymo eigą.',
      trustTitle: 'Sukurta instituciniam valdymui, ne rinkodaros triukšmui',
      finalKicker: 'Pasiruošę pamatyti gyvai?',
      finalTitle: 'Atidarykite gyvą strategijos platformą dabar.',
      finalCopy: 'Peržiūrėkite viešą strategijos erdvę ir pamatykite, kaip susijungia gairės, iniciatyvos, strateginiai ryšiai ir įgyvendinimo planas.',
      finalSecondaryCta: 'Naršyti strategijų biblioteką',
      finalCta: 'Atidaryti platformą'
    },
    en: {
      metaTitle: 'digistrategy.eu | Living strategy platform for public institutions',
      metaDescription: 'digistrategy.eu combines a public strategy library, map-based strategy design, implementation planning, strategic links, and plan playback in one platform.',
      headerCta: 'Open Live Platform',
      heroKicker: 'Living strategy platform',
      heroTitle: 'Strategy, import, and implementation on one living map.',
      heroCopy: 'digistrategy.eu connects a public strategy library, guideline and initiative mapping, implementation planning, strategic links, and plan playback in one workspace for institutions.',
      heroSecondaryCta: 'Browse Strategy Library',
      heroPrimaryCta: 'Open Platform',
      heroProof1: 'Public strategy library',
      heroProof2: '"Use in my strategy" import',
      heroProof3: 'Implementation plan',
      heroProof4: 'Timeline playback',
      heroVisualBadge: 'Live strategy workspace',
      heroFloatLabel1: 'Import',
      heroFloatTitle1: 'Import one guideline from the public library.',
      heroFloatLabel2: 'Plan',
      heroFloatTitle2: 'Set dates and owners inside strategy context.',
      heroFloatLabel3: 'Playback',
      heroFloatTitle3: 'Replay delivery over time on the same map.',
      heroObjectKicker: 'Living strategy map',
      heroObjectTitle: 'Guidelines, initiatives, owners, and time in one object.',
      heroObjectCopy: 'A single spatial model for structure, accountability, and execution.',
      heroLibraryKicker: 'Import what already works',
      heroLibraryTitle: 'Browse external strategies and bring one guideline into your own cycle.',
      heroImportSourceLabel: 'External strategy',
      heroImportSourceItem: 'Workforce productivity boost',
      heroImportTargetLabel: 'Your organization',
      heroImportTargetTitle: 'Create proposal',
      heroImportTargetItem: 'Source attribution and strategic link kept',
      heroMapKicker: 'Plan mode',
      heroMapTitle: 'See execution appear on the map over time.',
      heroMapChip1: 'Guidelines',
      heroMapChip2: 'Initiatives',
      heroMapChip3: 'Plan',
      heroPlanKicker: 'Implementation plan',
      heroPlanTitle: 'Set dates and responsible units without leaving strategy context.',
      heroPlanOwner2: 'Customer service unit',
      heroPlanOwner3: 'Data governance team',
      uspKicker: 'Product surface',
      uspTitle: 'All the new strategy layers in one system',
      uspCopy: 'The landing page now needs to show more than planning. It needs to show reuse, governance, execution, and playback as one connected product.',
      uspBadge1: 'Library → Import',
      uspBadge2: 'Map → Plan',
      uspBadge3: 'Links → Context',
      uspBadge4: 'AI → Draft',
      product1Kicker: 'Cross-institution learning',
      product1Title: 'Browse public strategies and import what fits.',
      product1Copy: 'The strategy library is not just for reading. Teams can open an external strategy, select a guideline or initiative, and move it into their own moderated workflow.',
      product1Item1: 'Visible only while browsing external strategies',
      product1Item2: 'Creates a proposal instead of writing directly to the live cycle',
      product1Item3: 'Keeps source attribution and strategic links',
      product1VisualSource: 'External library',
      product1VisualSourceItem: 'Use in my strategy',
      product1VisualTarget: 'Target cycle',
      product1VisualTargetTitle: 'Create import proposal',
      product1VisualTargetItem: 'Relation, parent, notes, provenance',
      product2Kicker: 'Execution playback',
      product2Title: 'Switch to Plan mode and watch the map reveal delivery over time.',
      product2Copy: 'The same map now shows guidelines and initiatives together, with playback controls, reveal dates, and timeline markers.',
      product2Tag1: 'Plan layer',
      product2Tag2: 'Timeline',
      product2Tag3: 'Ripple reveal',
      product3Kicker: 'Implementation workspace',
      product3Title: 'Assign dates and responsible units for every item.',
      product3Copy: 'Admins edit in a dedicated implementation plan view and from internal detail pages. Everyone else sees the same plan in read-only mode.',
      product3Tag1: 'Dates',
      product3Tag2: 'Owners',
      product3Tag3: 'Read-only visibility',
      product4Kicker: 'Strategic memory',
      product4Title: 'Keep source context visible instead of losing it in copy-paste.',
      product4Copy: 'Strategic links, proposal moderation, and public-ready views preserve where ideas came from and how they were adapted.',
      product4Tag1: 'Strategic links',
      product4Tag2: 'Moderation',
      product4Tag3: 'Public-ready',
      product5Kicker: 'AI acceleration',
      product5Title: 'Start from PDFs, then refine structure with the team.',
      product5Copy: 'Generate a draft strategy from documents, translate source ideas into English JSON, and continue in the same guideline and initiative workflow.',
      product5Tag1: 'Multi-PDF draft',
      product5Tag2: 'English JSON output',
      product5Tag3: 'Team refinement',
      backboneTitle: 'A reliable backbone for strategy governance and execution.',
      flowTitle: 'How institutions move from direction to delivery',
      flow1Title: 'Invite teams by role',
      flow1Copy: 'Meta admins create one-time invite links and assign membership by institution.',
      flow2Title: 'Generate or import the structure',
      flow2Copy: 'Start from an AI draft or the public strategy library, then let the team debate, vote, and refine guidelines.',
      flow3Title: 'Connect initiatives and strategic links',
      flow3Copy: 'The map shows how parent guidelines, child guidelines, initiatives, and reused elements connect in one shared view.',
      flow4Title: 'Assign dates, owners, and play the plan',
      flow4Copy: 'The implementation workspace and plan playback turn the same strategy into both a structure view and a delivery timeline.',
      trustTitle: 'Built for institutional governance, not marketing noise',
      finalKicker: 'Ready to see it live?',
      finalTitle: 'Open the live strategy platform now.',
      finalCopy: 'Explore a public strategy workspace and see how guidelines, initiatives, strategic links, and implementation planning connect.',
      finalSecondaryCta: 'Browse Strategy Library',
      finalCta: 'Open Platform'
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
    const refresh = LANDING_REFRESH_TRANSLATIONS[normalized] || {};
    const adminOverrides = adminLandingTranslations[normalized] || {};
    return { ...base, ...refresh, ...adminOverrides };
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

          <div style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;" aria-hidden="true">
            <label for="landingAccessOrgWebsite">Organization website</label>
            <input id="landingAccessOrgWebsite" type="text" name="organizationWebsite" tabindex="-1" autocomplete="off" />
          </div>

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
          notes: String(fd.get('notes') || '').trim(),
          organizationWebsite: String(fd.get('organizationWebsite') || '').trim()
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

  function initHeroScene() {
    const scene = document.querySelector('[data-hero-scene]');
    if (!(scene instanceof HTMLElement)) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let targetGlowX = 50;
    let targetGlowY = 34;
    let currentGlowX = 50;
    let currentGlowY = 34;
    let frameId = 0;

    const render = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      currentGlowX += (targetGlowX - currentGlowX) * 0.12;
      currentGlowY += (targetGlowY - currentGlowY) * 0.12;

      scene.style.setProperty('--scene-tilt-y', `${currentX.toFixed(2)}deg`);
      scene.style.setProperty('--scene-tilt-x', `${currentY.toFixed(2)}deg`);
      scene.style.setProperty('--scene-glow-x', `${currentGlowX.toFixed(2)}%`);
      scene.style.setProperty('--scene-glow-y', `${currentGlowY.toFixed(2)}%`);

      const moving = Math.abs(targetX - currentX) > 0.02
        || Math.abs(targetY - currentY) > 0.02
        || Math.abs(targetGlowX - currentGlowX) > 0.08
        || Math.abs(targetGlowY - currentGlowY) > 0.08;

      if (moving) {
        frameId = window.requestAnimationFrame(render);
      } else {
        frameId = 0;
      }
    };

    const requestRender = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(render);
    };

    scene.addEventListener('pointermove', (event) => {
      const bounds = scene.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const px = (event.clientX - bounds.left) / bounds.width;
      const py = (event.clientY - bounds.top) / bounds.height;
      const nx = (px - 0.5) * 2;
      const ny = (py - 0.5) * 2;
      targetX = nx * 12;
      targetY = ny * -9;
      targetGlowX = 50 + (nx * 18);
      targetGlowY = 34 + (ny * 16);
      requestRender();
    }, { passive: true });

    scene.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      targetGlowX = 50;
      targetGlowY = 34;
      requestRender();
    });
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
  initHeroScene();
  loadAdminLandingTranslations();
  loadPublicInstitutions();
  initAccessRequestButtons();
  initReveal();
  initNavScroll();
})();
