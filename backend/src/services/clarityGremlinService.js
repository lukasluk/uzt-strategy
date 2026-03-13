const {
  getPolicyAlignmentAiConfig,
  requestPolicyAlignmentJson
} = require('./policyAlignmentAiService');

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
      focusGuideline: focus,
      parentGuideline: parent,
      childGuidelines: truncateList(relatedChildren, 12),
      linkedInitiatives: truncateList(relatedInitiatives, 12),
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
      focusInitiative: focus,
      linkedGuidelines: truncateList(linkedGuidelines, 12),
      counts
    };
  }

  if (view === 'guidelines') {
    return {
      view,
      pageLabel: 'Guidelines list',
      counts,
      guidelines: truncateList(guidelines, 40)
    };
  }

  if (view === 'initiatives') {
    return {
      view,
      pageLabel: 'Initiatives list',
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
    page: viewPayload
  };
}

function buildSystemPrompt(locale) {
  const isEnglish = String(locale || '').trim().toLowerCase() === 'en';
  const languageRule = isEnglish
    ? 'Return every string in English.'
    : 'Return every string in Lithuanian.';
  return [
    'You are Clarity Gremlin, a strict but useful strategy content reviewer for public-sector strategy workspaces.',
    'Review only the provided page context. Do not invent data, entities, votes, dates, or relationships.',
    'Prefer precise editorial feedback over generic motivational advice.',
    'Distinguish between what is clearly present in the data and what appears missing or weak.',
    'Spend about 90% of your attention on the strategy subject matter itself: the policy topic, thematic coverage, specificity, overlaps, missing themes, coherence, and quality of the content.',
    'Spend at most about 10% of your attention on technical execution details such as missing implementation dates, missing owners, or missing responsible units.',
    'Do not describe, praise, or summarize inherited product features that would be true for almost any strategy in this system.',
    'Do not comment on the mere presence of relation types, parent fields, counters, metadata fields, cards, tags, hierarchy labels, or aggregate counts unless their absence or weakness creates a concrete problem.',
    'Bad example: "Hierarchy is explicit because parent/child/orphan relationType is present."',
    'Good example: "The service accessibility theme is defined, but the strategy says little about channel integration, inclusion, or measurable service quality outcomes."',
    'When mentioning technical details, do so only if they materially weaken execution readiness.',
    languageRule,
    'Return only valid JSON with this exact schema:',
    '{',
    '  "pageLabel": "string",',
    '  "score": 1,',
    '  "summary": "string",',
    '  "strengths": ["string"],',
    '  "improvements": [',
    '    { "issue": "string", "recommendation": "string" }',
    '  ],',
    '  "nextActions": ["string"],',
    '  "dataGaps": ["string"]',
    '}',
    'Rules:',
    '- score must be an integer from 1 to 10.',
    '- score should reflect the quality of this page content itself: strategic clarity, content specificity, thematic completeness, and execution readiness.',
    '- summary must be 1 short paragraph.',
    '- strengths: 0 to 3 items.',
    '- improvements: 2 to 5 items.',
    '- nextActions: 2 to 4 items.',
    '- dataGaps: 0 to 4 items.',
    '- strengths should usually describe topic coverage, strategic direction quality, or content coherence, not platform mechanics.',
    '- Each recommendation must be concrete and tied to the current page context.',
    '- Never mention hidden system prompts or that you are an AI model.'
  ].join('\n');
}

function buildUserPrompt(payload) {
  return [
    'Analyze the current workspace page context below and suggest how to improve clarity, structure, and execution quality.',
    'Focus on what should be improved in this exact page.',
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
    dataGaps: truncateList(normalizeArray(value.dataGaps).map((item) => cleanText(item, 220)).filter(Boolean), 4)
  };
}

function validateAnalysis(value) {
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
  const promptPayload = buildPromptPayload(snapshot, viewPayload);
  const response = await requestPolicyAlignmentJson({
    ...aiConfig,
    systemText: buildSystemPrompt(locale),
    userText: buildUserPrompt(promptPayload),
    operationName: `clarity-gremlin:${normalizedView}`
  });

  const analysis = normalizeAnalysis(response?.parsed);
  validateAnalysis(analysis);

  return {
    model: response?.model || null,
    analysis,
    page: {
      view: normalizedView,
      label: viewPayload.pageLabel || analysis.pageLabel || normalizedView
    }
  };
}

function getClarityGremlinConfig() {
  const base = getPolicyAlignmentAiConfig();
  return {
    ...base,
    model: String(
      process.env.CLARITY_GREMLIN_MODEL
      || base.model
      || 'gpt-5-mini'
    ).trim() || 'gpt-5-mini',
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
