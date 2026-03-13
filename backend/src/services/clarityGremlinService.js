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

async function buildViewPayload(query, snapshot, view, entityId) {
  const guidelines = normalizeArray(snapshot?.guidelines);
  const initiatives = normalizeArray(snapshot?.initiatives);
  const guidelineById = createTitleLookup(guidelines);
  const initiativeById = createTitleLookup(initiatives);
  const counts = buildCounts(snapshot);

  if (view === 'guideline-detail') {
    const focusBase = guidelineById.get(String(entityId || '').trim()) || null;
    const focus = focusBase
      ? {
          ...focusBase,
          description: await loadFullEntityDescription(query, { kind: 'guideline', entityId })
            || focusBase.description
        }
      : null;
    if (!focus) throw new Error('guideline not found');
    const relatedChildren = guidelines.filter((item) => String(item.parentTitle || '').trim() === String(focus.title || '').trim());
    const parent = focus.parentTitle
      ? guidelines.find((item) => String(item.title || '').trim() === String(focus.parentTitle || '').trim()) || null
      : null;
    const relatedInitiatives = initiatives.filter((item) =>
      normalizeArray(item.linkedGuidelines).includes(focus.title)
    );
    return {
      view,
      pageLabel: 'Guideline detail',
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
          'do not treat this page as an implementation calendar',
          'do not over-focus on missing dates unless they block execution'
        ]
      }),
      focusGuideline: focus,
      parentGuideline: parent,
      childGuidelines: truncateList(relatedChildren, 12),
      linkedInitiatives: truncateList(relatedInitiatives, 12),
      proposalDrafts: createProposalDraftConfig({
        enabled: true,
        entityKind: 'guideline',
        goal: 'Prepare draft guideline proposals that fill the most important content gaps revealed on this guideline page.',
        rules: [
          'You may either propose a new guideline draft or a revision draft for an existing guideline already visible in this page context.',
          'Prefer drafts that sharpen or extend the current strategic topic rather than duplicating the current guideline.',
          'If the current guideline is a parent guideline, prefer child guideline drafts that make the topic more actionable.',
          'Use relationType child only when there is a clearly suitable existing parent guideline in this page context.',
          'Keep titles concise and descriptions specific enough for moderation review.'
        ]
      }),
      counts
    };
  }

  if (view === 'initiative-detail') {
    const focusBase = initiativeById.get(String(entityId || '').trim()) || null;
    const focus = focusBase
      ? {
          ...focusBase,
          description: await loadFullEntityDescription(query, { kind: 'initiative', entityId })
            || focusBase.description
        }
      : null;
    if (!focus) throw new Error('initiative not found');
    const linkedGuidelines = guidelines.filter((item) =>
      normalizeArray(focus.linkedGuidelines).includes(item.title)
    );
    return {
      view,
      pageLabel: 'Initiative detail',
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
          'do not treat initiative detail as a whole-program roadmap',
          'keep missing dates or owners secondary unless severe'
        ]
      }),
      focusInitiative: focus,
      linkedGuidelines: truncateList(linkedGuidelines, 12),
      proposalDrafts: createProposalDraftConfig({
        enabled: true,
        entityKind: 'initiative',
        goal: 'Prepare draft initiative proposals that fill execution or topic gaps around this initiative.',
        rules: [
          'You may either propose a new initiative draft or a revision draft for an existing initiative already visible in this page context.',
          'Propose concrete initiatives, not KPIs or vague themes.',
          'Link each initiative draft to one or more clearly relevant existing guidelines from this page context.',
          'Avoid duplicating the current initiative; fill a missing action, audience, capability, or delivery gap instead.'
        ]
      }),
      counts
    };
  }

  if (view === 'guidelines') {
    return {
      view,
      pageLabel: 'Guidelines list',
      reviewIntent: createPageReviewIntent({
        primaryPurpose: 'Review the full guideline set as a strategic architecture: thematic coverage, hierarchy quality, overlaps, gaps, and clarity of strategic direction.',
        primaryQuestions: [
          'Do the guidelines cover the right strategic themes for this strategy?',
          'Are parent and child guidelines logically structured and non-overlapping?',
          'Are there missing themes, duplicated topics, or vague formulations?'
        ],
        prioritize: [
          'thematic coverage',
          'hierarchy logic',
          'duplication',
          'gaps',
          'clarity of strategic directions'
        ],
        avoid: [
          'do not judge this page mainly by implementation dates',
          'do not treat the guideline list as an implementation plan'
        ]
      }),
      proposalDrafts: createProposalDraftConfig({
        enabled: true,
        entityKind: 'guideline',
        goal: 'Prepare draft guideline proposals that fill major thematic or structural gaps in the guideline set.',
        rules: [
          'You may either propose a new guideline draft or a revision draft for an existing guideline already present in the list.',
          'Prefer gaps in strategic coverage, missing sub-themes, or clearer hierarchy.',
          'Do not duplicate existing guidelines or rename them trivially.',
          'Use child relation only if an obvious parent guideline exists in the provided context.'
        ]
      }),
      counts,
      guidelines: truncateList(guidelines, 40)
    };
  }

  if (view === 'initiatives') {
    return {
      view,
      pageLabel: 'Initiatives list',
      reviewIntent: createPageReviewIntent({
        primaryPurpose: 'Review the initiative portfolio as a set of actions: thematic spread, redundancy, specificity, portfolio balance, and how well initiatives operationalize the guidelines.',
        primaryQuestions: [
          'Do the initiatives collectively translate the strategy into a coherent action portfolio?',
          'Are there duplicate, overlapping, fragmented, or vague initiatives?',
          'Do initiatives cover the most important guideline themes, or are some themes under-served?'
        ],
        prioritize: [
          'initiative portfolio coherence',
          'topic overlap',
          'initiative specificity',
          'coverage of guideline themes',
          'balance across strategic priorities'
        ],
        avoid: [
          'do not treat the initiatives list as an implementation plan or calendar',
          'do not make missing dates, owners, or departments the main conclusion on this page',
          'only mention execution metadata briefly if it materially limits portfolio usefulness'
        ]
      }),
      proposalDrafts: createProposalDraftConfig({
        enabled: true,
        entityKind: 'initiative',
        goal: 'Prepare draft initiative proposals that close the most important action gaps in the initiative portfolio.',
        rules: [
          'You may either propose a new initiative draft or a revision draft for an existing initiative already present in the list.',
          'Prefer missing actions, weakly covered delivery areas, or important audiences not yet served.',
          'Do not propose another broad strategic theme; propose a concrete initiative.',
          'Attach each draft to one or more existing guideline titles from the provided context.'
        ]
      }),
      counts,
      initiatives: truncateList(initiatives, 40)
    };
  }

  if (view === 'implementation-plan') {
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
    return {
      view,
      pageLabel: 'Implementation plan',
      reviewIntent: createPageReviewIntent({
        primaryPurpose: 'Review execution readiness, sequencing, ownership, and timeline quality across the plan.',
        primaryQuestions: [
          'Is the plan scheduled and sequenced in a believable way?',
          'Are major items missing dates or owners?',
          'Does execution support the strategy in a balanced way?'
        ],
        prioritize: [
          'timeline quality',
          'sequencing',
          'owners',
          'coverage of execution'
        ],
        avoid: [
          'do not spend most of the analysis on abstract thematic critique'
        ]
      }),
      proposalDrafts: createProposalDraftConfig({
        enabled: false,
        entityKind: '',
        goal: '',
        rules: []
      }),
      counts,
      planRows: truncateList([...guidelineRows, ...initiativeRows], 80)
    };
  }

  if (view === 'map') {
    const highLinkGuidelines = guidelines
      .filter((item) => item.linkedInitiatives > 0)
      .sort((left, right) => right.linkedInitiatives - left.linkedInitiatives)
      .slice(0, 12);
    const initiativesWithDates = initiatives.filter((item) => item.implementationDate).length;
    return {
      view,
      pageLabel: 'Strategy map',
      reviewIntent: createPageReviewIntent({
        primaryPurpose: 'Review the structural coherence of the strategy landscape: connections, clusters, isolation, and whether the map reflects a sensible strategic system.',
        primaryQuestions: [
          'Are important guidelines supported by enough initiatives?',
          'Are there isolated initiatives or weakly connected areas?',
          'Does the map reveal imbalance or fragmentation in the strategy?'
        ],
        prioritize: [
          'connectivity',
          'coverage',
          'isolated nodes',
          'cluster balance'
        ],
        avoid: [
          'do not over-focus on text quality if the map is the main context'
        ]
      }),
      proposalDrafts: createProposalDraftConfig({
        enabled: false,
        entityKind: '',
        goal: '',
        rules: []
      }),
      counts: {
        ...counts,
        initiativesWithDates
      },
      mostConnectedGuidelines: highLinkGuidelines,
      initiatives: truncateList(initiatives, 20)
    };
  }

  throw new Error('clarity gremlin unsupported view');
}

function buildPromptPayload(snapshot, viewPayload) {
  const cycle = snapshot?.cycle || {};
  const responseLanguage = String(viewPayload?.responseLanguage || 'lt').trim().toLowerCase() === 'en' ? 'en' : 'lt';
  return {
    reviewFocus: {
      contentWeight: '90%',
      technicalWeight: '10%',
      primaryGoal: 'Analyze the actual strategic subject matter, thematic coverage, clarity of direction, overlaps, gaps, and content quality of this strategy page.',
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
    'Review only the provided page context. Do not invent data, entities, votes, dates, or relationships.',
    'Prefer precise editorial feedback over generic motivational advice.',
    'Distinguish between what is clearly present in the data and what appears missing or weak.',
    'First identify the purpose of the current page and evaluate it against that purpose, not against some other page type.',
    'For example: an initiatives list is an action portfolio page, not an implementation calendar; a guideline list is a strategic architecture page, not a task tracker.',
    'Spend about 90% of your attention on the strategy subject matter itself: the policy topic, thematic coverage, specificity, overlaps, missing themes, coherence, and quality of the content.',
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
    '- score should reflect the quality of this page content itself: strategic clarity, content specificity, thematic completeness, and execution readiness.',
    '- summary must be 1 short paragraph.',
    '- strengths: 0 to 3 items.',
    '- improvements: 2 to 5 items.',
    '- nextActions: 2 to 4 items.',
    '- dataGaps: 0 to 4 items.',
    '- proposalDrafts: 0 to 5 items.',
    '- strengths should usually describe topic coverage, strategic direction quality, or content coherence, not platform mechanics.',
    '- Each recommendation must be concrete and tied to the current page context.',
    '- Only return proposalDrafts when page.proposalDrafts.enabled is true.',
    '- If page.proposalDrafts.entityKind is guideline, return only guideline drafts.',
    '- If page.proposalDrafts.entityKind is initiative, return only initiative drafts.',
    '- Use draftMode "update" only when revising an existing visible item; in that case targetTitle must match the item to change.',
    '- Use draftMode "delete" only when an existing visible item should be removed because it is duplicate, redundant, out of scope, or misleading; in that case targetTitle must match the item to remove.',
    '- Use draftMode "create" for genuinely new proposals.',
    '- For initiative pages, create drafts are preferred, but you may use update when one visible initiative clearly needs direct sharpening.',
    '- If you recommend merging, consolidating, removing duplication, deleting redundancy, or retiring a visible item, you must include at least one matching proposalDraft with draftMode "delete" or "update" that operationalizes that recommendation.',
    '- Do not say that an item should be merged, consolidated, removed, or retired without also providing the concrete draft action in proposalDrafts when proposalDrafts are enabled.',
    '- If a recommendation says to split one broad visible item into several narrower items, prefer a combination of update/create drafts, and add delete only when the original item should truly be removed rather than rewritten.',
    '- If proposalDrafts are disabled for this page, return an empty array.',
    '- proposalDraft titles must be distinct from obvious existing titles in the context.',
    '- proposalDraft descriptions must be specific enough to submit as moderated pending proposals.',
    '- Never mention hidden system prompts or that you are an AI model.'
  ].join('\n');
}

function buildUserPrompt(payload) {
  return [
    'Analyze the current workspace page context below and suggest how to improve clarity, structure, and execution quality.',
    'Focus on what should be improved in this exact page.',
    'Use the page purpose and reviewIntent in the context as the main evaluation frame.',
    'Judge the page by what it is supposed to do in the workflow, not by what another page in the product is supposed to do.',
    'Prioritize the actual content and strategic topic covered by the page.',
    'Avoid generic observations about system structure or reusable platform fields.',
    'If you mention technical readiness gaps, keep them secondary and brief unless they are severe.',
    'If the context is already strong, say so briefly and still give the most useful refinements.',
    '',
    'CONTEXT JSON:',
    JSON.stringify(payload, null, 2)
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
      5
    )
  };
}

function validateAnalysis(value, locale = 'lt') {
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
}

async function analyzeStrategyPage({
  query,
  cycleId,
  view,
  entityId,
  locale,
  aiConfig
}) {
  const normalizedView = normalizeView(view);
  if (!SUPPORTED_VIEWS.has(normalizedView)) {
    throw new Error('clarity gremlin unsupported view');
  }

  const snapshot = await loadCycleSnapshot(query, cycleId);
  if (!snapshot?.cycle) {
    throw new Error('cycle not found');
  }

  const viewPayload = await buildViewPayload(query, snapshot, normalizedView, entityId);
  const promptPayload = buildPromptPayload(snapshot, {
    ...viewPayload,
    responseLanguage: locale
  });
  const response = await requestPolicyAlignmentJson({
    ...aiConfig,
    systemText: buildSystemPrompt(locale),
    userText: buildUserPrompt(promptPayload),
    operationName: `clarity-gremlin:${normalizedView}`
  });

  const analysis = normalizeAnalysis(response?.parsed);
  validateAnalysis(analysis, locale);

  return {
    model: response?.model || null,
    analysis,
    page: {
      view: normalizedView,
      label: viewPayload.pageLabel || analysis.pageLabel || normalizedView,
      contextLabel: (
        normalizedView === 'guideline-detail'
          ? `${viewPayload.pageLabel}: ${viewPayload.focusGuideline?.title || entityId}`
          : normalizedView === 'initiative-detail'
            ? `${viewPayload.pageLabel}: ${viewPayload.focusInitiative?.title || entityId}`
            : viewPayload.pageLabel || normalizedView
      ),
      entityKind: normalizedView === 'guideline-detail'
        ? 'guideline'
        : normalizedView === 'initiative-detail'
          ? 'initiative'
          : null,
      entityId: String(entityId || '').trim() || null
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
