const {
  getPolicyAlignmentAiConfig,
  requestPolicyAlignmentJson
} = require('./policyAlignmentAiService');
const { resolveProviderCompatibleModel } = require('./aiProviderService');

const SUPPORTED_VIEWS = new Set([
  'guidelines',
  'guideline-detail',
  'initiatives',
  'initiative-detail',
  'implementation-plan',
  'map'
]);

function normalizeView(value) {
  return String(value || '').trim().toLowerCase();
}

function cleanText(value, maxLength = 4000) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  return text.slice(0, maxLength).trim();
}

function cleanPreviewText(value, maxLength = 400) {
  const text = cleanText(value, 4000);
  const limit = Math.max(40, Number(maxLength) || 400);
  if (!text || text.length <= limit) return text;

  const slice = text.slice(0, limit);
  const boundaryIndex = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('; '),
    slice.lastIndexOf(', '),
    slice.lastIndexOf(' ')
  );
  const safeIndex = boundaryIndex >= 120 ? boundaryIndex : limit;
  return `${slice.slice(0, safeIndex).trim()}…`;
}

function formatDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.slice(0, 10);
}

function createTitleLookup(items) {
  const map = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const id = String(item?.id || '').trim();
    if (!id || map.has(id)) return;
    map.set(id, item);
  });
  return map;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function truncateList(items, maxItems = 40) {
  const list = Array.isArray(items) ? items : [];
  return list.slice(0, Math.max(0, Number(maxItems) || 0));
}

function gremlinLocalizedReviewLabel(locale) {
  return String(locale || '').trim().toLowerCase() === 'en'
    ? 'Strategy-wide review'
    : 'Strategijos visumos analizė';
}

function gremlinLocalizedFocusLabel(view, locale) {
  const normalizedView = normalizeView(view);
  const isEnglish = String(locale || '').trim().toLowerCase() === 'en';
  if (normalizedView === 'guideline-detail') return isEnglish ? 'Guideline detail' : 'Gairės kortelė';
  if (normalizedView === 'initiative-detail') return isEnglish ? 'Initiative detail' : 'Iniciatyvos kortelė';
  if (normalizedView === 'guidelines') return isEnglish ? 'Guidelines list' : 'Gairių sąrašas';
  if (normalizedView === 'initiatives') return isEnglish ? 'Initiatives list' : 'Iniciatyvų sąrašas';
  if (normalizedView === 'implementation-plan') return isEnglish ? 'Implementation plan' : 'Įgyvendinimo planas';
  if (normalizedView === 'map') return isEnglish ? 'Strategy map' : 'Strategijų žemėlapis';
  return isEnglish ? 'Page' : 'Puslapis';
}

function createPageReviewIntent(config) {
  return {
    primaryPurpose: cleanText(config?.primaryPurpose, 260),
    primaryQuestions: truncateList(
      normalizeArray(config?.primaryQuestions).map((item) => cleanText(item, 220)).filter(Boolean),
      6
    ),
    prioritize: truncateList(
      normalizeArray(config?.prioritize).map((item) => cleanText(item, 180)).filter(Boolean),
      6
    ),
    avoid: truncateList(
      normalizeArray(config?.avoid).map((item) => cleanText(item, 180)).filter(Boolean),
      6
    )
  };
}

function createProposalDraftConfig(config) {
  const enabled = Boolean(config?.enabled);
  const entityKind = String(config?.entityKind || '').trim().toLowerCase();
  return {
    enabled,
    entityKind: entityKind === 'initiative' ? 'initiative' : entityKind === 'guideline' ? 'guideline' : '',
    goal: cleanText(config?.goal, 260),
    rules: truncateList(
      normalizeArray(config?.rules).map((item) => cleanText(item, 220)).filter(Boolean),
      8
    )
  };
}

function clampScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(1, Math.min(10, Math.round(numeric)));
}

function hasMergeOrDedupSignal(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return false;
  return [
    'merge',
    'merged',
    'merging',
    'consolidate',
    'consolidating',
    'deduplicate',
    'deduplication',
    'remove duplication',
    'duplicate',
    'redundant',
    'retire',
    'sujung',
    'konsolid',
    'dubli',
    'perteklin',
    'atsisaky',
    'ištrint',
    'istrint'
  ].some((token) => text.includes(token));
}

function analysisRequiresDeleteDraft(value) {
  const improvements = normalizeArray(value?.improvements);
  const nextActions = normalizeArray(value?.nextActions);
  return improvements.some((item) => hasMergeOrDedupSignal(item?.issue) || hasMergeOrDedupSignal(item?.recommendation))
    || nextActions.some((item) => hasMergeOrDedupSignal(item));
}

function summarizeGuideline(item) {
  return {
    id: item.id,
    title: cleanText(item.title, 160),
    description: cleanPreviewText(item.description, 400),
    relationType: cleanText(item.relation_type || item.relationType, 40) || 'orphan',
    parentTitle: cleanText(item.parent_title || item.parentTitle, 160) || null,
    implementationDate: formatDate(item.implementation_target_date || item.implementationDate),
    implementationOwner: cleanText(item.implementation_owner || item.implementationOwner, 120),
    totalScore: Number(item.total_score || item.totalScore || 0),
    commentCount: Number(item.comment_count || item.commentCount || 0),
    childCount: Number(item.child_count || item.childCount || 0),
    linkedInitiatives: Number(item.initiative_count || item.linkedInitiatives || 0)
  };
}

function summarizeInitiative(item) {
  return {
    id: item.id,
    title: cleanText(item.title, 160),
    description: cleanPreviewText(item.description, 400),
    implementationDate: formatDate(item.implementation_target_date || item.implementationDate),
    implementationOwner: cleanText(item.implementation_owner || item.implementationOwner, 120),
    totalScore: Number(item.total_score || item.totalScore || 0),
    commentCount: Number(item.comment_count || item.commentCount || 0),
    linkedGuidelines: truncateList(
      normalizeArray(item.guideline_titles || item.guidelineTitles)
        .map((title) => cleanText(title, 160))
        .filter(Boolean),
      8
    )
  };
}

async function loadCycleSnapshot(query, cycleId) {
  const cycleRes = await query(
    `select c.id,
            c.title,
            c.state,
            c.mission_text,
            c.vision_text,
            c.strategy_id,
            s.title as strategy_title,
            s.slug as strategy_slug,
            i.name as institution_name,
            i.slug as institution_slug
     from strategy_cycles c
     join institutions i on i.id = c.institution_id
     left join institution_strategies s on s.id = c.strategy_id
     where c.id = $1
     limit 1`,
    [cycleId]
  );
  const cycle = cycleRes.rows[0] || null;
  if (!cycle) return null;

  const guidelinesRes = await query(
    `select g.id,
            g.title,
            g.description,
            g.relation_type,
            g.parent_guideline_id,
            parent.title as parent_title,
            g.implementation_target_date,
            g.implementation_owner,
            g.status,
            coalesce(v.total_score, 0)::int as total_score,
            coalesce(comments.comment_count, 0)::int as comment_count,
            coalesce(children.child_count, 0)::int as child_count,
            coalesce(initiatives.initiative_count, 0)::int as initiative_count
     from strategy_guidelines g
     left join strategy_guidelines parent on parent.id = g.parent_guideline_id
     left join (
       select guideline_id, sum(score)::int as total_score
       from strategy_votes
       group by guideline_id
     ) v on v.guideline_id = g.id
     left join (
       select guideline_id, count(*)::int as comment_count
       from strategy_comments
       where status = 'visible'
       group by guideline_id
     ) comments on comments.guideline_id = g.id
     left join (
       select parent_guideline_id, count(*)::int as child_count
       from strategy_guidelines
       where parent_guideline_id is not null
         and status in ('active', 'disabled', 'merged')
       group by parent_guideline_id
     ) children on children.parent_guideline_id = g.id
     left join (
       select ig.guideline_id, count(distinct ig.initiative_id)::int as initiative_count
       from strategy_initiative_guidelines ig
       join strategy_initiatives si on si.id = ig.initiative_id
       where si.status in ('active', 'disabled', 'merged')
       group by ig.guideline_id
     ) initiatives on initiatives.guideline_id = g.id
     where g.cycle_id = $1
       and g.status in ('active', 'disabled', 'merged')
     order by g.created_at asc`,
    [cycleId]
  );

  const initiativesRes = await query(
    `select i.id,
            i.title,
            i.description,
            i.implementation_target_date,
            i.implementation_owner,
            i.status,
            coalesce(v.total_score, 0)::int as total_score,
            coalesce(comments.comment_count, 0)::int as comment_count,
            coalesce(
              array_agg(distinct g.title) filter (where g.title is not null),
              '{}'::text[]
            ) as guideline_titles
     from strategy_initiatives i
     left join strategy_initiative_guidelines ig on ig.initiative_id = i.id
     left join strategy_guidelines g on g.id = ig.guideline_id
     left join (
       select initiative_id, sum(score)::int as total_score
       from strategy_initiative_votes
       group by initiative_id
     ) v on v.initiative_id = i.id
     left join (
       select initiative_id, count(*)::int as comment_count
       from strategy_initiative_comments
       where status = 'visible'
       group by initiative_id
     ) comments on comments.initiative_id = i.id
     where i.cycle_id = $1
       and i.status in ('active', 'disabled', 'merged')
     group by i.id, v.total_score, comments.comment_count
     order by i.created_at asc`,
    [cycleId]
  );

  return {
    cycle,
    guidelines: guidelinesRes.rows.map(summarizeGuideline),
    initiatives: initiativesRes.rows.map(summarizeInitiative)
  };
}

async function loadFullEntityDescription(query, { kind, entityId }) {
  const normalizedKind = String(kind || '').trim().toLowerCase();
  const id = String(entityId || '').trim();
  if (!id) return '';

  if (normalizedKind === 'guideline') {
    const res = await query(
      `select description
       from strategy_guidelines
       where id = $1
       limit 1`,
      [id]
    );
    return cleanText(res.rows[0]?.description, 6000);
  }

  if (normalizedKind === 'initiative') {
    const res = await query(
      `select description
       from strategy_initiatives
       where id = $1
       limit 1`,
      [id]
    );
    return cleanText(res.rows[0]?.description, 6000);
  }

  return '';
}

function buildCounts(snapshot) {
  const guidelines = normalizeArray(snapshot?.guidelines);
  const initiatives = normalizeArray(snapshot?.initiatives);
  return {
    guidelinesTotal: guidelines.length,
    parentGuidelines: guidelines.filter((item) => item.relationType === 'parent').length,
    childGuidelines: guidelines.filter((item) => item.relationType === 'child').length,
    orphanGuidelines: guidelines.filter((item) => item.relationType === 'orphan').length,
    undatedGuidelines: guidelines.filter((item) => !item.implementationDate).length,
    initiativesTotal: initiatives.length,
    undatedInitiatives: initiatives.filter((item) => !item.implementationDate).length,
    initiativesWithoutLinks: initiatives.filter((item) => !normalizeArray(item.linkedGuidelines).length).length
  };
}

function buildGuidelineEntityPayload({ guidelines, initiatives, focus, counts, locale, view }) {
  const relatedChildren = guidelines.filter((item) => String(item.parentTitle || '').trim() === String(focus.title || '').trim());
  const parent = focus.parentTitle
    ? guidelines.find((item) => String(item.title || '').trim() === String(focus.parentTitle || '').trim()) || null
    : null;
  const relatedInitiatives = initiatives.filter((item) => normalizeArray(item.linkedGuidelines).includes(focus.title));
  return {
    view,
    pageLabel: String(locale || '').trim().toLowerCase() === 'en' ? 'Guideline analysis' : 'Gairės analizė',
    focusLabel: gremlinLocalizedFocusLabel(view, locale),
    reviewIntent: createPageReviewIntent({
      primaryPurpose: 'Review this one guideline as a strategic direction: whether it is clear, focused, non-overlapping, and well supported by child guidelines or initiatives.',
      primaryQuestions: [
        'Is the guideline conceptually clear and strategically meaningful?',
        'Is it too broad, too vague, or mixing several themes at once?',
        'Are child guidelines or linked initiatives sufficient and coherent for this guideline?'
      ],
      prioritize: [
        'title clarity',
        'description specificity',
        'theme coherence',
        'fit within hierarchy',
        'supporting initiatives'
      ],
      avoid: [
        'do not treat this analysis as a whole-strategy portfolio review',
        'do not over-focus on missing dates unless they block execution'
      ]
    }),
    proposalDrafts: createProposalDraftConfig({
      enabled: true,
      entityKind: 'guideline',
      goal: 'Prepare draft guideline proposals that improve this specific guideline and its immediate structure.',
      rules: [
        'Return only guideline drafts for this analysis.',
        'You may create, update, or delete guidelines, but keep changes tightly connected to this guideline.',
        'If the current guideline is a parent guideline, child guideline drafts are preferred when they make the topic more actionable.',
        'Use relationType child only when there is a clearly suitable existing parent guideline in this immediate context.'
      ]
    }),
    counts,
    focusGuideline: focus,
    focusInitiative: null,
    focusSummary: {
      focusKind: 'guideline',
      focusTitle: focus.title,
      parentGuideline: parent,
      childGuidelines: truncateList(relatedChildren, 12),
      linkedInitiatives: truncateList(relatedInitiatives, 12)
    },
    guidelines: truncateList(guidelines, 60),
    initiatives: truncateList(initiatives, 60)
  };
}

function buildInitiativeEntityPayload({ guidelines, initiatives, focus, counts, locale, view }) {
  const linkedGuidelines = guidelines.filter((item) => normalizeArray(focus.linkedGuidelines).includes(item.title));
  return {
    view,
    pageLabel: String(locale || '').trim().toLowerCase() === 'en' ? 'Initiative analysis' : 'Iniciatyvos analizė',
    focusLabel: gremlinLocalizedFocusLabel(view, locale),
    reviewIntent: createPageReviewIntent({
      primaryPurpose: 'Review this initiative as a concrete action: whether it is specific, actionable, relevant to the strategy, and well connected to the supported guidelines.',
      primaryQuestions: [
        'Is the initiative concrete enough to be understood and executed?',
        'Does it clearly contribute to the linked guidelines?',
        'Is it duplicative, too broad, or missing a sharper delivery focus?'
      ],
      prioritize: [
        'actionability',
        'scope clarity',
        'fit to guidelines',
        'distinctiveness',
        'expected strategic contribution'
      ],
      avoid: [
        'do not treat this analysis as a whole-strategy portfolio review',
        'keep missing dates or owners secondary unless severe'
      ]
    }),
    proposalDrafts: createProposalDraftConfig({
      enabled: true,
      entityKind: 'initiative',
      goal: 'Prepare draft initiative proposals that improve this specific initiative and its immediate execution fit.',
      rules: [
        'Return only initiative drafts for this analysis.',
        'You may create, update, or delete initiatives, but keep changes tightly connected to this initiative.',
        'Propose concrete initiatives, not KPIs or vague themes.',
        'Link each initiative draft to one or more clearly relevant existing guidelines from this immediate context.'
      ]
    }),
    counts,
    focusGuideline: null,
    focusInitiative: focus,
    focusSummary: {
      focusKind: 'initiative',
      focusTitle: focus.title,
      linkedGuidelines: truncateList(linkedGuidelines, 12)
    },
    guidelines: truncateList(guidelines, 60),
    initiatives: truncateList(initiatives, 60)
  };
}

async function buildViewPayload(query, snapshot, view, entityId, locale = 'lt', mode = 'strategy') {
  const guidelines = normalizeArray(snapshot?.guidelines);
  const initiatives = normalizeArray(snapshot?.initiatives);
  const guidelineById = createTitleLookup(guidelines);
  const initiativeById = createTitleLookup(initiatives);
  const counts = buildCounts(snapshot);
  const normalizedMode = String(mode || '').trim().toLowerCase() === 'entity' ? 'entity' : 'strategy';

  if (normalizedMode === 'entity') {
    if (view === 'guideline-detail') {
      const focusBase = guidelineById.get(String(entityId || '').trim()) || null;
      const focus = focusBase
        ? {
          ...focusBase,
          description: await loadFullEntityDescription(query, { kind: 'guideline', entityId }) || focusBase.description
        }
        : null;
      if (!focus) throw new Error('guideline not found');
      return buildGuidelineEntityPayload({ guidelines, initiatives, focus, counts, locale, view });
    }
    if (view === 'initiative-detail') {
      const focusBase = initiativeById.get(String(entityId || '').trim()) || null;
      const focus = focusBase
        ? {
          ...focusBase,
          description: await loadFullEntityDescription(query, { kind: 'initiative', entityId }) || focusBase.description
        }
        : null;
      if (!focus) throw new Error('initiative not found');
      return buildInitiativeEntityPayload({ guidelines, initiatives, focus, counts, locale, view });
    }
    throw new Error('clarity gremlin unsupported entity mode');
  }

  let focusGuideline = null;
  let focusInitiative = null;
  let focusSummary = null;
  let focusLabel = '';

  if (view === 'guideline-detail') {
    const focusBase = guidelineById.get(String(entityId || '').trim()) || null;
    const focus = focusBase
      ? {
        ...focusBase,
        description: await loadFullEntityDescription(query, { kind: 'guideline', entityId }) || focusBase.description
      }
      : null;
    if (!focus) throw new Error('guideline not found');
    focusGuideline = focus;
    focusLabel = gremlinLocalizedFocusLabel(view, locale);
    const relatedChildren = guidelines.filter((item) => String(item.parentTitle || '').trim() === String(focus.title || '').trim());
    const parent = focus.parentTitle
      ? guidelines.find((item) => String(item.title || '').trim() === String(focus.parentTitle || '').trim()) || null
      : null;
    const relatedInitiatives = initiatives.filter((item) => normalizeArray(item.linkedGuidelines).includes(focus.title));
    focusSummary = {
      focusKind: 'guideline',
      focusTitle: focus.title,
      parentGuideline: parent,
      childGuidelines: truncateList(relatedChildren, 12),
      linkedInitiatives: truncateList(relatedInitiatives, 12)
    };
  } else if (view === 'initiative-detail') {
    const focusBase = initiativeById.get(String(entityId || '').trim()) || null;
    const focus = focusBase
      ? {
        ...focusBase,
        description: await loadFullEntityDescription(query, { kind: 'initiative', entityId }) || focusBase.description
      }
      : null;
    if (!focus) throw new Error('initiative not found');
    focusInitiative = focus;
    focusLabel = gremlinLocalizedFocusLabel(view, locale);
    const linkedGuidelines = guidelines.filter((item) => normalizeArray(focus.linkedGuidelines).includes(item.title));
    focusSummary = {
      focusKind: 'initiative',
      focusTitle: focus.title,
      linkedGuidelines: truncateList(linkedGuidelines, 12)
    };
  } else if (view === 'guidelines') {
    focusLabel = gremlinLocalizedFocusLabel(view, locale);
  } else if (view === 'initiatives') {
    focusLabel = gremlinLocalizedFocusLabel(view, locale);
  } else if (view === 'implementation-plan') {
    focusLabel = gremlinLocalizedFocusLabel(view, locale);
  } else if (view === 'map') {
    focusLabel = gremlinLocalizedFocusLabel(view, locale);
  } else {
    throw new Error('clarity gremlin unsupported view');
  }

  const guidelineRows = guidelines.map((item) => ({
    kind: 'guideline',
    title: item.title,
    relationType: item.relationType,
    parentTitle: item.parentTitle,
    implementationDate: item.implementationDate,
    implementationOwner: item.implementationOwner,
    linkedInitiatives: item.linkedInitiatives
  }));
  const initiativeRows = initiatives.map((item) => ({
    kind: 'initiative',
    title: item.title,
    implementationDate: item.implementationDate,
    implementationOwner: item.implementationOwner,
    linkedGuidelines: truncateList(item.linkedGuidelines, 6)
  }));
  const mostConnectedGuidelines = guidelines
    .filter((item) => item.linkedInitiatives > 0)
    .sort((left, right) => right.linkedInitiatives - left.linkedInitiatives)
    .slice(0, 12);

  return {
    view,
    pageLabel: gremlinLocalizedReviewLabel(locale),
    focusLabel,
    reviewIntent: createPageReviewIntent({
      primaryPurpose: 'Review the full strategy system as one portfolio: guidelines, initiatives, overlaps, gaps, hierarchy quality, and execution readiness. Use the currently opened page only as the focus point for where to look first.',
      primaryQuestions: [
        'Do the guidelines and initiatives together form a coherent strategic system?',
        'Where are the main overlaps, duplications, vague areas, under-served themes, or weak links between strategic direction and concrete action?',
        'How does the current focus page reveal the most important systemic weaknesses or opportunities in the whole strategy?'
      ],
      prioritize: [
        'whole-strategy coherence',
        'guideline and initiative alignment',
        'overlaps and duplication',
        'missing themes or action gaps',
        'clarity of strategic architecture',
        'focus-page relevance'
      ],
      avoid: [
        'do not analyze only the currently open page in isolation',
        'do not ignore the focus page; use it as the main lens into the whole strategy',
        'do not make implementation metadata the main conclusion unless it severely blocks execution'
      ]
    }),
    proposalDrafts: createProposalDraftConfig({
      enabled: true,
      entityKind: '',
      goal: 'Prepare up to 9 concrete mixed draft proposals across both guidelines and initiatives so the whole strategy becomes clearer, less duplicated, and more actionable.',
      rules: [
        'You may return a mix of guideline and initiative drafts in the same analysis.',
        'You may use create, update, or delete drafts for either guidelines or initiatives.',
        'Prefer the smallest set of changes that most improves the whole strategy system.',
        'When a focus page reveals a broader structural problem, include the necessary drafts even if they touch other visible items in the strategy.',
        'Use delete only when an existing visible item is clearly redundant, duplicative, or misleading.'
      ]
    }),
    counts: {
      ...counts,
      initiativesWithDates: initiatives.filter((item) => item.implementationDate).length
    },
    focusGuideline,
    focusInitiative,
    focusSummary,
    guidelines: truncateList(guidelines, 60),
    initiatives: truncateList(initiatives, 60),
    planRows: truncateList([...guidelineRows, ...initiativeRows], 120),
    mostConnectedGuidelines
  };
}

function buildPromptPayload(snapshot, viewPayload) {
  const cycle = snapshot?.cycle || {};
  const responseLanguage = String(viewPayload?.responseLanguage || 'lt').trim().toLowerCase() === 'en' ? 'en' : 'lt';
  return {
    reviewFocus: {
      contentWeight: '90%',
      technicalWeight: '10%',
      primaryGoal: 'Analyze the whole strategy system across both guidelines and initiatives, using the currently open page only as the focus lens for what to emphasize first.',
      technicalGoal: 'Only briefly note missing implementation dates, owners, or responsible units when those omissions materially weaken execution readiness.',
      avoid: [
        'Do not describe or praise generic system-wide product features.',
        'Do not comment on the existence of schema fields, relationType fields, parentTitle fields, counters, tags, cards, or inherited UI structure unless they are missing and materially harmful.',
        'Do not say that hierarchy, metadata, or counts are useful simply because they exist in the system.',
        'Do not restate database or JSON field names in the analysis.'
      ]
    },
    strategy: {
      title: cleanText(cycle.strategy_title, 180) || cleanText(cycle.title, 180),
      cycleTitle: cleanText(cycle.title, 180),
      state: cleanText(cycle.state, 30),
      institutionName: cleanText(cycle.institution_name, 160),
      missionText: cleanText(cycle.mission_text, 600),
      visionText: cleanText(cycle.vision_text, 600)
    },
    requestedResponseLanguage: responseLanguage,
    page: viewPayload
  };
}

function buildSystemPrompt(locale) {
  const isEnglish = String(locale || '').trim().toLowerCase() === 'en';
  const languageRule = isEnglish
    ? 'Return every string in English. Use English even if the source strategy content is Lithuanian.'
    : 'Return every string in Lithuanian. Use Lithuanian even if the source strategy content or previous analyses contain English.';
  const requiredLanguageCode = isEnglish ? 'en' : 'lt';
  return [
    'You are Clarity Gremlin, a strict but useful strategy content reviewer for public-sector strategy workspaces.',
    'Review the whole provided strategy context. Do not invent data, entities, votes, dates, or relationships.',
    'Prefer precise editorial feedback over generic motivational advice.',
    'Distinguish between what is clearly present in the data and what appears missing or weak.',
    'Always evaluate the whole strategy system across both guidelines and initiatives.',
    'Use the currently opened page only as the focus point that should receive the most attention, examples, and prioritization.',
    'For example: if the focus is an initiative detail page, still review the wider strategy, but emphasize how that initiative exposes broader portfolio problems or strengths.',
    'Spend about 90% of your attention on the strategy subject matter itself: thematic coverage, specificity, overlaps, missing themes, coherence, and quality of the combined guideline + initiative system.',
    'Spend at most about 10% of your attention on technical execution details such as missing implementation dates, missing owners, or missing responsible units.',
    'Do not describe, praise, or summarize inherited product features that would be true for almost any strategy in this system.',
    'Do not comment on the mere presence of relation types, parent fields, counters, metadata fields, cards, tags, hierarchy labels, or aggregate counts unless their absence or weakness creates a concrete problem.',
    'Bad example: "Hierarchy is explicit because parent/child/orphan relationType is present."',
    'Good example: "The service accessibility theme is defined, but the strategy says little about channel integration, inclusion, or measurable service quality outcomes."',
    'When mentioning technical details, do so only if they materially weaken execution readiness.',
    languageRule,
    `The selected UI language is ${requiredLanguageCode}. You must answer in that selected language, not in the source document language.`,
    `Set responseLanguage to exactly "${requiredLanguageCode}".`,
    'Return only valid JSON with this exact schema:',
    '{',
    `  "responseLanguage": "${requiredLanguageCode}",`,
    '  "pageLabel": "string",',
    '  "score": 1,',
    '  "summary": "string",',
    '  "strengths": ["string"],',
    '  "improvements": [',
    '    { "issue": "string", "recommendation": "string" }',
    '  ],',
    '  "nextActions": ["string"],',
    '  "dataGaps": ["string"],',
    '  "proposalDrafts": [',
    '    {',
    '      "entityKind": "guideline|initiative",',
    '      "draftMode": "create|update|delete",',
    '      "targetTitle": "string|null",',
    '      "title": "string",',
    '      "description": "string",',
    '      "rationale": "string",',
    '      "relationType": "orphan|parent|child|null",',
    '      "parentGuidelineTitle": "string|null",',
    '      "guidelineTitles": ["string"]',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- score must be an integer from 1 to 10.',
    '- score should reflect the quality of this strategy review target: strategic clarity, specificity, thematic completeness, coherence between guidelines and initiatives, and execution readiness.',
    '- Use the full scale progressively, not conservatively.',
    '- 5 to 6 means mixed quality with multiple important structural weaknesses.',
    '- 7 means solid but still with several notable overlaps, gaps, vague areas, or execution weaknesses.',
    '- 8 means strong and mostly coherent, with only a few moderate issues remaining.',
    '- 9 means mission and vision are almost fully translated into a clear, non-duplicative, actionable guideline + initiative system, with only minor refinements left.',
    '- 10 is allowed when the strategy is exceptionally clear, coherent, non-duplicative, and fully aligned with mission and vision, with only negligible improvements remaining.',
    '- If the visible strategy appears improved and previously typical issues are no longer present, raise the score accordingly rather than defaulting to 7.',
    '- summary must be 1 short paragraph.',
    '- strengths: 0 to 3 items.',
    '- improvements: 2 to 5 items.',
    '- nextActions: 2 to 4 items.',
    '- dataGaps: 0 to 4 items.',
    '- proposalDrafts: 0 to 9 items.',
    '- strengths should usually describe topic coverage, strategic direction quality, or content coherence, not platform mechanics.',
    '- Each recommendation must be concrete and tied to the whole strategy, while still reflecting the current focus page.',
    '- Only return proposalDrafts when page.proposalDrafts.enabled is true.',
    '- If page.proposalDrafts.entityKind is empty, you may return a mix of guideline and initiative drafts.',
    '- If page.proposalDrafts.entityKind is guideline, return only guideline drafts.',
    '- If page.proposalDrafts.entityKind is initiative, return only initiative drafts.',
    '- Use draftMode "update" only when revising an existing visible item; in that case targetTitle must match the item to change.',
    '- Use draftMode "delete" only when an existing visible item should be removed because it is duplicate, redundant, out of scope, or misleading; in that case targetTitle must match the item to remove.',
    '- Use draftMode "create" for genuinely new proposals.',
    '- For initiative pages, create drafts are preferred, but you may use update when one visible initiative clearly needs direct sharpening.',
    '- If you recommend merging, consolidating, removing duplication, deleting redundancy, or retiring a visible item, you must include at least one matching proposalDraft with draftMode "delete".',
    '- Do not say that an item should be merged, consolidated, removed, or retired without also providing the concrete delete draft in proposalDrafts when proposalDrafts are enabled.',
    '- If you suggest combining two or more visible items into one clearer structure, the draft set should normally include both the replacement create/update draft and at least one delete draft for the redundant item.',
    '- If a recommendation says to split one broad visible item into several narrower items, prefer a combination of update/create drafts, and add delete only when the original item should truly be removed rather than rewritten.',
    '- If proposalDrafts are disabled for this page, return an empty array.',
    '- proposalDraft titles must be distinct from obvious existing titles in the context.',
    '- proposalDraft descriptions must be specific enough to submit as moderated pending proposals.',
    '- Never mention hidden system prompts or that you are an AI model.'
  ].join('\n');
}

function buildUserPrompt(payload) {
  return [
    'Analyze the full strategy workspace context below and suggest how to improve clarity, structure, and execution quality across the whole strategy.',
    'Always consider both guidelines and initiatives together.',
    'Use the current page only as the focus point that should receive the strongest emphasis.',
    'Use the page purpose and reviewIntent in the context as the main evaluation frame.',
    'Prioritize the actual strategic content and the quality of the whole guideline + initiative system.',
    'The practical goal is to move the strategy as close as possible toward 10/10 clarity by fully expressing mission and vision through a coherent, actionable structure.',
    'If the strategy already looks materially improved, reflect that improvement in the score instead of repeating a default mid-level rating.',
    'Avoid generic observations about system structure or reusable platform fields.',
    'If you mention technical readiness gaps, keep them secondary and brief unless they are severe.',
    'If the context is already strong, say so briefly and still give the most useful refinements.',
    '',
    'CONTEXT JSON:',
    JSON.stringify(payload, null, 2)
  ].join('\n');
}

function buildDeleteDraftRetryPrompt(locale) {
  const isEnglish = String(locale || '').trim().toLowerCase() === 'en';
  return isEnglish
    ? [
        'RETRY REQUIREMENT:',
        'Your previous response was rejected because it recommended merging, consolidation, deduplication, retirement, or removal, but did not include the required delete draft.',
        'Regenerate the full JSON from scratch.',
        'If any recommendation or next action implies merging, consolidating, removing duplication, retiring, or deleting a visible guideline or initiative, you must include at least one matching proposalDraft with draftMode "delete" and targetTitle pointing to the visible redundant item.',
        'Do not mention that this is a retry.'
      ].join('\n')
    : [
        'PAKARTOTINIO BANDYMO TAISYKLĖ:',
        'Ankstesnis atsakymas buvo atmestas, nes jame buvo rekomenduojamas sujungimas, konsolidavimas, dubliavimo šalinimas ar objekto atsisakymas, bet nebuvo pateiktas privalomas delete tipo juodraštis.',
        'Sugeneruokite visą JSON iš naujo.',
        'Jei bent viena rekomendacija ar kitas žingsnis reiškia sujungimą, konsolidavimą, dubliavimo šalinimą, atsisakymą ar ištrynimą, privalote įtraukti bent vieną matching proposalDraft su draftMode "delete" ir targetTitle, nurodančiu konkretų matomą perteklinį objektą.',
        'Neminekite, kad tai pakartotinis bandymas.'
      ].join('\n');
}

function normalizeAnalysis(raw) {
  const value = raw && typeof raw === 'object' ? raw : {};
  return {
    responseLanguage: String(value.responseLanguage || '').trim().toLowerCase(),
    pageLabel: cleanText(value.pageLabel, 120),
    score: clampScore(value.score),
    summary: cleanText(value.summary, 900),
    strengths: truncateList(normalizeArray(value.strengths).map((item) => cleanText(item, 220)).filter(Boolean), 3),
    improvements: truncateList(
      normalizeArray(value.improvements)
        .map((item) => ({
          issue: cleanText(item?.issue, 220),
          recommendation: cleanText(item?.recommendation, 320)
        }))
        .filter((item) => item.issue && item.recommendation),
      5
    ),
    nextActions: truncateList(normalizeArray(value.nextActions).map((item) => cleanText(item, 220)).filter(Boolean), 4),
    dataGaps: truncateList(normalizeArray(value.dataGaps).map((item) => cleanText(item, 220)).filter(Boolean), 4),
    proposalDrafts: truncateList(
      normalizeArray(value.proposalDrafts)
        .map((item) => {
          const entityKind = String(item?.entityKind || '').trim().toLowerCase();
          return {
            entityKind: entityKind === 'initiative' ? 'initiative' : entityKind === 'guideline' ? 'guideline' : '',
            draftMode: (() => {
              const draftMode = String(item?.draftMode || '').trim().toLowerCase();
              return draftMode === 'update' || draftMode === 'delete' ? draftMode : 'create';
            })(),
            targetTitle: cleanText(item?.targetTitle, 160) || null,
            title: cleanText(item?.title, 160),
            description: cleanText(item?.description, 1200),
            rationale: cleanText(item?.rationale, 260),
            relationType: (() => {
              const relationType = String(item?.relationType || '').trim().toLowerCase();
              return relationType === 'parent' || relationType === 'child' || relationType === 'orphan'
                ? relationType
                : null;
            })(),
            parentGuidelineTitle: cleanText(item?.parentGuidelineTitle, 160) || null,
            guidelineTitles: truncateList(
              normalizeArray(item?.guidelineTitles).map((title) => cleanText(title, 160)).filter(Boolean),
              6
            )
          };
        })
        .filter((item) => item.entityKind && item.title && item.description && ((item.draftMode !== 'update' && item.draftMode !== 'delete') || item.targetTitle)),
      9
    )
  };
}

function validateAnalysis(value, locale = 'lt', viewPayload = null) {
  const requiredLanguage = String(locale || '').trim().toLowerCase() === 'en' ? 'en' : 'lt';
  if (value.responseLanguage !== requiredLanguage) {
    throw new Error('ai response language mismatch');
  }
  if (!Number.isInteger(value.score) || value.score < 1 || value.score > 10) {
    throw new Error('ai response invalid');
  }
  if (!value.summary) throw new Error('ai response invalid');
  if (!Array.isArray(value.improvements) || value.improvements.length < 1) {
    throw new Error('ai response invalid');
  }
  if (!Array.isArray(value.nextActions) || value.nextActions.length < 1) {
    throw new Error('ai response invalid');
  }
  const draftsEnabled = Boolean(viewPayload?.proposalDrafts?.enabled);
  if (draftsEnabled && analysisRequiresDeleteDraft(value)) {
    const hasDeleteDraft = normalizeArray(value.proposalDrafts).some((item) => String(item?.draftMode || '').trim().toLowerCase() === 'delete');
    if (!hasDeleteDraft) {
      throw new Error('ai response missing delete draft');
    }
  }
}

async function analyzeStrategyPage({
  query,
  cycleId,
  view,
  entityId,
  locale,
  aiConfig,
  mode = 'strategy'
}) {
  const normalizedView = normalizeView(view);
  const normalizedMode = String(mode || '').trim().toLowerCase() === 'entity' ? 'entity' : 'strategy';
  if (!SUPPORTED_VIEWS.has(normalizedView)) {
    throw new Error('clarity gremlin unsupported view');
  }

  const snapshot = await loadCycleSnapshot(query, cycleId);
  if (!snapshot?.cycle) {
    throw new Error('cycle not found');
  }

  const viewPayload = await buildViewPayload(query, snapshot, normalizedView, entityId, locale, normalizedMode);
  const promptPayload = buildPromptPayload(snapshot, {
    ...viewPayload,
    responseLanguage: locale
  });
  const systemText = buildSystemPrompt(locale);
  const baseUserText = buildUserPrompt(promptPayload);
  const requestAnalysis = async (retryDeleteDraft = false) => {
    const response = await requestPolicyAlignmentJson({
      ...aiConfig,
      systemText,
      userText: retryDeleteDraft
        ? `${baseUserText}\n\n${buildDeleteDraftRetryPrompt(locale)}`
        : baseUserText,
      operationName: `clarity-gremlin:${normalizedView}${retryDeleteDraft ? ':retry-delete-draft' : ''}`
    });
    const analysis = normalizeAnalysis(response?.parsed);
    validateAnalysis(analysis, locale, viewPayload);
    return { response, analysis };
  };

  let response;
  let analysis;
  try {
    ({ response, analysis } = await requestAnalysis(false));
  } catch (error) {
    if (String(error?.message || '').trim() !== 'ai response missing delete draft') {
      throw error;
    }
    ({ response, analysis } = await requestAnalysis(true));
  }

  return {
    model: response?.model || null,
    analysis,
    page: {
      view: normalizedView,
      mode: normalizedMode,
      label: viewPayload.pageLabel || analysis.pageLabel || normalizedView,
      contextLabel: (
        normalizedMode === 'strategy'
          ? (viewPayload.focusLabel || viewPayload.pageLabel || analysis.pageLabel || normalizedView)
          : normalizedView === 'guideline-detail'
          ? `${viewPayload.focusLabel || gremlinLocalizedFocusLabel('guideline-detail', locale)}: ${viewPayload.focusGuideline?.title || entityId}`
          : normalizedView === 'initiative-detail'
            ? `${viewPayload.focusLabel || gremlinLocalizedFocusLabel('initiative-detail', locale)}: ${viewPayload.focusInitiative?.title || entityId}`
            : viewPayload.focusLabel || viewPayload.pageLabel || normalizedView
      ),
      entityKind: normalizedMode === 'entity' && normalizedView === 'guideline-detail'
        ? 'guideline'
        : normalizedMode === 'entity' && normalizedView === 'initiative-detail'
          ? 'initiative'
          : null,
      entityId: normalizedMode === 'entity' ? (String(entityId || '').trim() || null) : null
    }
  };
}

function getClarityGremlinConfig({ provider, modelOverride } = {}) {
  const base = getPolicyAlignmentAiConfig({ provider, modelOverride });
  const fallbackModel = String(base.model || '').trim()
    || (String(provider || '').trim().toLowerCase() === 'mistral' ? 'mistral-small-latest' : 'gpt-5-mini');
  return {
    ...base,
    model: resolveProviderCompatibleModel(
      provider || base.provider,
      process.env.CLARITY_GREMLIN_MODEL,
      fallbackModel
    ),
    timeoutMs: Math.max(
      15000,
      Number(process.env.CLARITY_GREMLIN_TIMEOUT_MS || base.timeoutMs || 120000)
    )
  };
}

module.exports = {
  SUPPORTED_VIEWS,
  getClarityGremlinConfig,
  analyzeStrategyPage
};
