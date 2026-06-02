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

function uniqueTrimmed(values) {
  return Array.from(new Set(
    normalizeArray(values)
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  ));
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

function hasDeleteActionSignal(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return false;
  return [
    'merge',
    'merged',
    'merging',
    'consolidate',
    'consolidating',
    'deduplicate',
    'remove duplication',
    'combine',
    'remove',
    'delete',
    'retire',
    'drop',
    'sujung',
    'konsolid',
    'atsisaky',
    'pašalin',
    'pasalin',
    'panaikin',
    'ištrint',
    'istrint'
  ].some((token) => text.includes(token));
}

function analysisRequiresDeleteDraft(value) {
  const improvements = normalizeArray(value?.improvements);
  const nextActions = normalizeArray(value?.nextActions);
  return improvements.some((item) => hasDeleteActionSignal(item?.recommendation))
    || nextActions.some((item) => hasDeleteActionSignal(item));
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

function summarizeStrategicLinkCandidateGuideline(item) {
  return {
    id: item.id,
    title: cleanText(item.title, 160),
    description: cleanPreviewText(item.description, 320),
    relationType: cleanText(item.relation_type || item.relationType, 40) || 'orphan',
    parentTitle: cleanText(item.parent_title || item.parentTitle, 160) || null,
    totalScore: Number(item.total_score || item.totalScore || 0),
    childCount: Number(item.child_count || item.childCount || 0),
    linkedInitiatives: Number(item.initiative_count || item.linkedInitiatives || 0)
  };
}

function normalizeStrategicLinkConfidence(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
  return 'medium';
}

function strategicLinkGroupLabel(group, locale) {
  const isEnglish = String(locale || '').trim().toLowerCase() === 'en';
  if (String(group || '').trim().toLowerCase() === 'otherinstitutions') {
    return isEnglish ? 'Other institutions' : 'Kitos institucijos';
  }
  return isEnglish ? 'Same institution' : 'Ta pati institucija';
}

async function loadCycleSnapshot(query, cycleId) {
  const cycleRes = await query(
    `select c.id,
            c.institution_id,
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
            0::int as total_score,
            coalesce(comments.comment_count, 0)::int as comment_count,
            coalesce(children.child_count, 0)::int as child_count,
            coalesce(initiatives.initiative_count, 0)::int as initiative_count
     from strategy_guidelines g
     left join strategy_guidelines parent on parent.id = g.parent_guideline_id
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

async function loadStrategicLinkCandidateStrategies(query, {
  institutionId,
  strategyId,
  sameInstitution = true,
  maxStrategies = 6,
  maxGuidelinesPerStrategy = 6
}) {
  const strategiesRes = await query(
    `select s.id as strategy_id,
            s.title as strategy_title,
            s.slug as strategy_slug,
            i.id as institution_id,
            i.name as institution_name,
            i.slug as institution_slug,
            c.id as cycle_id,
            c.title as cycle_title
     from institution_strategies s
     join institutions i on i.id = s.institution_id
     join lateral (
       select c.id, c.title, c.created_at
       from strategy_cycles c
       where c.strategy_id = s.id
         and c.state in ('open', 'closed')
       order by c.created_at desc
       limit 1
     ) c on true
     where s.status = 'active'
       and i.status = 'active'
       and (($1::boolean = true and i.id = $2 and s.id <> $3)
         or ($1::boolean = false and i.id <> $2))
     order by
       case when $1::boolean = true then i.name else i.name end asc,
       s.created_at asc
     limit $4`,
    [sameInstitution, institutionId, strategyId, Math.max(1, Number(maxStrategies) || 6)]
  );

  const strategies = strategiesRes.rows.map((row) => ({
    institutionId: row.institution_id,
    institutionName: row.institution_name,
    institutionSlug: row.institution_slug,
    strategyId: row.strategy_id,
    strategyTitle: row.strategy_title,
    strategySlug: row.strategy_slug,
    cycleId: row.cycle_id,
    cycleTitle: row.cycle_title,
    guidelines: []
  }));
  const cycleIds = uniqueTrimmed(strategies.map((item) => item.cycleId));
  if (!cycleIds.length) return [];

  const guidelinesRes = await query(
    `select g.id,
            g.cycle_id,
            g.title,
            g.description,
            g.relation_type,
            parent.title as parent_title,
            0::int as total_score,
            coalesce(children.child_count, 0)::int as child_count,
            coalesce(initiatives.initiative_count, 0)::int as initiative_count
     from strategy_guidelines g
     left join strategy_guidelines parent on parent.id = g.parent_guideline_id
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
     where g.cycle_id = any($1::uuid[])
       and g.status = 'active'
     order by g.created_at asc`,
    [cycleIds]
  );

  const guidelinesByCycleId = guidelinesRes.rows.reduce((acc, row) => {
    const cycleId = String(row.cycle_id || '').trim();
    if (!cycleId) return acc;
    if (!acc[cycleId]) acc[cycleId] = [];
    if (acc[cycleId].length >= Math.max(1, Number(maxGuidelinesPerStrategy) || 6)) return acc;
    acc[cycleId].push(summarizeStrategicLinkCandidateGuideline(row));
    return acc;
  }, {});

  return strategies
    .map((item) => ({
      ...item,
      guidelines: normalizeArray(guidelinesByCycleId[item.cycleId])
    }))
    .filter((item) => item.guidelines.length);
}

async function loadExistingStrategicLinkPairs(query, sourceGuidelineIds, targetGuidelineIds) {
  const sourceIds = uniqueTrimmed(sourceGuidelineIds);
  const targetIds = uniqueTrimmed(targetGuidelineIds);
  if (!sourceIds.length || !targetIds.length) return [];

  const res = await query(
    `select source_guideline_id, target_guideline_id
     from strategy_guideline_links
     where (source_guideline_id = any($1::uuid[]) and target_guideline_id = any($2::uuid[]))
        or (source_guideline_id = any($2::uuid[]) and target_guideline_id = any($1::uuid[]))`,
    [sourceIds, targetIds]
  );

  return res.rows.map((row) => ({
    sourceGuidelineId: String(row.source_guideline_id || '').trim(),
    targetGuidelineId: String(row.target_guideline_id || '').trim()
  })).filter((item) => item.sourceGuidelineId && item.targetGuidelineId);
}

function buildStrategicLinkSearchPayload({
  snapshot,
  sourceGuidelines,
  sameInstitutionTargets,
  otherInstitutionTargets,
  existingLinks,
  locale
}) {
  return {
    responseLanguage: String(locale || '').trim().toLowerCase() === 'en' ? 'en' : 'lt',
    sourceStrategy: {
      institutionName: cleanText(snapshot?.cycle?.institution_name, 140),
      strategyTitle: cleanText(snapshot?.cycle?.strategy_title, 140),
      cycleTitle: cleanText(snapshot?.cycle?.title, 140),
      missionText: cleanPreviewText(snapshot?.cycle?.mission_text, 240),
      visionText: cleanPreviewText(snapshot?.cycle?.vision_text, 240)
    },
    sourceGuidelines: truncateList(normalizeArray(sourceGuidelines).map((item) => ({
      id: item.id,
      title: cleanText(item.title, 160),
      description: cleanPreviewText(item.description, 320),
      relationType: cleanText(item.relationType, 40) || 'orphan',
      parentTitle: cleanText(item.parentTitle, 160) || null,
      totalScore: Number(item.totalScore || 0),
      childCount: Number(item.childCount || 0),
      linkedInitiatives: Number(item.linkedInitiatives || 0)
    })), 16),
    existingLinks: truncateList(normalizeArray(existingLinks).map((item) => ({
      sourceGuidelineId: item.sourceGuidelineId,
      targetGuidelineId: item.targetGuidelineId
    })), 80),
    targetGroups: {
      sameInstitution: truncateList(normalizeArray(sameInstitutionTargets).map((item) => ({
        institutionId: item.institutionId,
        institutionName: cleanText(item.institutionName, 140),
        institutionSlug: cleanText(item.institutionSlug, 80),
        strategyId: item.strategyId,
        strategyTitle: cleanText(item.strategyTitle, 140),
        strategySlug: cleanText(item.strategySlug, 80),
        cycleId: item.cycleId,
        cycleTitle: cleanText(item.cycleTitle, 140),
        guidelines: truncateList(normalizeArray(item.guidelines).map((guideline) => ({
          id: guideline.id,
          title: cleanText(guideline.title, 160),
          description: cleanPreviewText(guideline.description, 280),
          relationType: cleanText(guideline.relationType, 40) || 'orphan',
          parentTitle: cleanText(guideline.parentTitle, 160) || null,
          totalScore: Number(guideline.totalScore || 0),
          childCount: Number(guideline.childCount || 0),
          linkedInitiatives: Number(guideline.linkedInitiatives || 0)
        })), 8)
      })), 8),
      otherInstitutions: truncateList(normalizeArray(otherInstitutionTargets).map((item) => ({
        institutionId: item.institutionId,
        institutionName: cleanText(item.institutionName, 140),
        institutionSlug: cleanText(item.institutionSlug, 80),
        strategyId: item.strategyId,
        strategyTitle: cleanText(item.strategyTitle, 140),
        strategySlug: cleanText(item.strategySlug, 80),
        cycleId: item.cycleId,
        cycleTitle: cleanText(item.cycleTitle, 140),
        guidelines: truncateList(normalizeArray(item.guidelines).map((guideline) => ({
          id: guideline.id,
          title: cleanText(guideline.title, 160),
          description: cleanPreviewText(guideline.description, 280),
          relationType: cleanText(guideline.relationType, 40) || 'orphan',
          parentTitle: cleanText(guideline.parentTitle, 160) || null,
          totalScore: Number(guideline.totalScore || 0),
          childCount: Number(guideline.childCount || 0),
          linkedInitiatives: Number(guideline.linkedInitiatives || 0)
        })), 8)
      })), 8)
    }
  };
}

function buildStrategicLinkSearchSystemPrompt(locale) {
  const isEnglish = String(locale || '').trim().toLowerCase() === 'en';
  const requiredLanguageCode = isEnglish ? 'en' : 'lt';
  return [
    'You are Clarity Gremlin, focused on finding useful guideline-to-guideline strategic links across strategies.',
    'Use only the provided source guideline IDs and target guideline IDs.',
    'Suggest only meaningful cross-strategy guideline links that would genuinely help users explore related strategic directions.',
    'A suggestion is good when the themes clearly reinforce, overlap, complement, or connect at strategic level.',
    'You may use parent, child, and orphan guidelines. Relation type provides context, but it is not a restriction.',
    'Do not suggest weak, generic, or trivial matches.',
    'Do not suggest a pair that already exists in existingLinks.',
    'The sameInstitution group is for other strategies in the same institution.',
    'The otherInstitutions group is for strategies from different institutions.',
    `Return every string in ${isEnglish ? 'English' : 'Lithuanian'}.`,
    `Set responseLanguage to exactly "${requiredLanguageCode}".`,
    'Return only valid JSON with this exact schema:',
    '{',
    `  "responseLanguage": "${requiredLanguageCode}",`,
    '  "sameInstitution": [',
    '    {',
    '      "sourceGuidelineId": "uuid",',
    '      "targetGuidelineId": "uuid",',
    '      "rationale": "string",',
    '      "confidence": "high|medium|low"',
    '    }',
    '  ],',
    '  "otherInstitutions": [',
    '    {',
    '      "sourceGuidelineId": "uuid",',
    '      "targetGuidelineId": "uuid",',
    '      "rationale": "string",',
    '      "confidence": "high|medium|low"',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- sameInstitution: 0 to 6 items.',
    '- otherInstitutions: 0 to 6 items.',
    '- Never return the same source-target pair twice.',
    '- Keep rationale concise and specific.',
    '- Prefer high-confidence suggestions only when the thematic fit is genuinely clear.',
    '- If there are no strong matches in a group, return an empty array for that group.',
    '- Return only one JSON object. No markdown. No explanation.'
  ].join('\n');
}

function buildStrategicLinkSearchUserPrompt(payload, provider) {
  const compactPayload = String(provider || '').trim().toLowerCase() === 'mistral'
    ? JSON.stringify(payload)
    : JSON.stringify(payload, null, 2);
  return [
    'Find strategic link suggestions for the current strategy.',
    'Match the source strategy guidelines against the provided target strategies.',
    'Consider all guideline types, including parent, child, and orphan guidelines.',
    'Only propose links that are strategically useful to show in the strategic links map.',
    '',
    'CONTEXT JSON:',
    compactPayload
  ].join('\n');
}

function buildStrategicLinkSchemaRetryPrompt(locale) {
  const isEnglish = String(locale || '').trim().toLowerCase() === 'en';
  return isEnglish
    ? [
        'RETRY REQUIREMENT:',
        'Your previous response was invalid or incomplete.',
        'Regenerate the full JSON from scratch.',
        'You must include responseLanguage, sameInstitution, and otherInstitutions.',
        'Each item must include sourceGuidelineId, targetGuidelineId, rationale, confidence.',
        'Return only one valid JSON object.'
      ].join('\n')
    : [
        'PAKARTOTINIO BANDYMO TAISYKLE:',
        'Ankstesnis atsakymas buvo netinkamas arba nepilnas.',
        'Sugeneruokite visa JSON is naujo.',
        'Privalote itraukti responseLanguage, sameInstitution ir otherInstitutions.',
        'Kiekvienas irasas turi tureti sourceGuidelineId, targetGuidelineId, rationale ir confidence.',
        'Grazinkite tik viena validu JSON objekta.'
      ].join('\n');
}

function normalizeStrategicLinkSearchResult(raw) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const normalizeGroup = (items) => truncateList(
    normalizeArray(items).map((item) => ({
      sourceGuidelineId: String(item?.sourceGuidelineId || '').trim(),
      targetGuidelineId: String(item?.targetGuidelineId || '').trim(),
      rationale: cleanText(item?.rationale, 260),
      confidence: normalizeStrategicLinkConfidence(item?.confidence)
    })).filter((item) => item.sourceGuidelineId && item.targetGuidelineId && item.rationale),
    8
  );
  return {
    responseLanguage: String(value.responseLanguage || '').trim().toLowerCase(),
    sameInstitution: normalizeGroup(value.sameInstitution),
    otherInstitutions: normalizeGroup(value.otherInstitutions)
  };
}

function validateStrategicLinkSearchResult(value, {
  locale,
  sourceGuidelineIdSet,
  sameInstitutionTargetIdSet,
  otherInstitutionTargetIdSet,
  existingPairKeySet
}) {
  const requiredLanguage = String(locale || '').trim().toLowerCase() === 'en' ? 'en' : 'lt';
  if (value.responseLanguage !== requiredLanguage) {
    throw new Error('ai response language mismatch');
  }
  const ensureGroup = (items, targetIds, groupKey) => {
    const seen = new Set();
    normalizeArray(items).forEach((item) => {
      const sourceGuidelineId = String(item?.sourceGuidelineId || '').trim();
      const targetGuidelineId = String(item?.targetGuidelineId || '').trim();
      if (!sourceGuidelineIdSet.has(sourceGuidelineId)) throw new Error('ai response invalid');
      if (!targetIds.has(targetGuidelineId)) throw new Error('ai response invalid');
      const pairKey = `${sourceGuidelineId}|${targetGuidelineId}`;
      if (existingPairKeySet.has(pairKey)) throw new Error('ai response invalid');
      const uniqueKey = `${groupKey}|${pairKey}`;
      if (seen.has(uniqueKey)) throw new Error('ai response invalid');
      seen.add(uniqueKey);
    });
  };
  ensureGroup(value.sameInstitution, sameInstitutionTargetIdSet, 'same');
  ensureGroup(value.otherInstitutions, otherInstitutionTargetIdSet, 'other');
}

async function searchStrategicLinks({
  query,
  cycleId,
  locale,
  aiConfig
}) {
  const snapshot = await loadCycleSnapshot(query, cycleId);
  if (!snapshot?.cycle) {
    throw new Error('cycle not found');
  }

  const sourceGuidelines = normalizeArray(snapshot.guidelines).filter((item) => item);
  if (!sourceGuidelines.length) {
    return {
      model: null,
      responseLanguage: String(locale || '').trim().toLowerCase() === 'en' ? 'en' : 'lt',
      sameInstitution: [],
      otherInstitutions: []
    };
  }

  const sameInstitutionTargets = await loadStrategicLinkCandidateStrategies(query, {
    institutionId: snapshot.cycle.institution_id,
    strategyId: snapshot.cycle.strategy_id,
    sameInstitution: true,
    maxStrategies: 6,
    maxGuidelinesPerStrategy: 6
  });
  const otherInstitutionTargets = await loadStrategicLinkCandidateStrategies(query, {
    institutionId: snapshot.cycle.institution_id,
    strategyId: snapshot.cycle.strategy_id,
    sameInstitution: false,
    maxStrategies: 8,
    maxGuidelinesPerStrategy: 5
  });

  const targetGuidelineIds = uniqueTrimmed([
    ...sameInstitutionTargets.flatMap((item) => normalizeArray(item.guidelines).map((guideline) => guideline.id)),
    ...otherInstitutionTargets.flatMap((item) => normalizeArray(item.guidelines).map((guideline) => guideline.id))
  ]);
  if (!targetGuidelineIds.length) {
    return {
      model: null,
      responseLanguage: String(locale || '').trim().toLowerCase() === 'en' ? 'en' : 'lt',
      sameInstitution: [],
      otherInstitutions: []
    };
  }

  const sourceGuidelineIds = uniqueTrimmed(sourceGuidelines.map((item) => item.id));
  const existingLinks = await loadExistingStrategicLinkPairs(query, sourceGuidelineIds, targetGuidelineIds);
  const payload = buildStrategicLinkSearchPayload({
    snapshot,
    sourceGuidelines,
    sameInstitutionTargets,
    otherInstitutionTargets,
    existingLinks,
    locale
  });
  const systemText = buildStrategicLinkSearchSystemPrompt(locale);
  const baseUserText = buildStrategicLinkSearchUserPrompt(payload, aiConfig?.provider);

  const sourceGuidelineById = new Map(sourceGuidelines.map((item) => [String(item.id || '').trim(), item]));
  const sameInstitutionTargetById = new Map(
    sameInstitutionTargets.flatMap((item) => normalizeArray(item.guidelines).map((guideline) => [String(guideline.id || '').trim(), { ...guideline, strategy: item }]))
  );
  const otherInstitutionTargetById = new Map(
    otherInstitutionTargets.flatMap((item) => normalizeArray(item.guidelines).map((guideline) => [String(guideline.id || '').trim(), { ...guideline, strategy: item }]))
  );
  const existingPairKeySet = new Set(existingLinks.flatMap((item) => {
    const sourceGuidelineId = String(item.sourceGuidelineId || '').trim();
    const targetGuidelineId = String(item.targetGuidelineId || '').trim();
    return [
      `${sourceGuidelineId}|${targetGuidelineId}`,
      `${targetGuidelineId}|${sourceGuidelineId}`
    ];
  }));

  const requestSuggestions = async (extraPrompt = '', operationSuffix = '') => {
    const response = await requestPolicyAlignmentJson({
      ...aiConfig,
      systemText,
      userText: extraPrompt ? `${baseUserText}\n\n${extraPrompt}` : baseUserText,
      maxOutputTokens: Math.min(8000, Number(aiConfig?.maxOutputTokens || 8000)),
      operationName: `clarity-gremlin:strategic-links${operationSuffix}`
    });
    const suggestions = normalizeStrategicLinkSearchResult(response?.parsed);
    validateStrategicLinkSearchResult(suggestions, {
      locale,
      sourceGuidelineIdSet: new Set(sourceGuidelineById.keys()),
      sameInstitutionTargetIdSet: new Set(sameInstitutionTargetById.keys()),
      otherInstitutionTargetIdSet: new Set(otherInstitutionTargetById.keys()),
      existingPairKeySet
    });
    return {
      response,
      suggestions
    };
  };

  let response;
  let suggestions;
  try {
    ({ response, suggestions } = await requestSuggestions('', ''));
  } catch (error) {
    const message = String(error?.message || '').trim();
    if (message === 'ai response invalid') {
      ({ response, suggestions } = await requestSuggestions(buildStrategicLinkSchemaRetryPrompt(locale), ':retry-schema'));
    } else {
      throw error;
    }
  }

  const enrichGroup = (items, targetById, groupKey) => normalizeArray(items).map((item) => {
    const source = sourceGuidelineById.get(String(item.sourceGuidelineId || '').trim());
    const target = targetById.get(String(item.targetGuidelineId || '').trim());
    if (!source || !target?.strategy) return null;
    return {
      sourceGuidelineId: source.id,
      sourceGuidelineTitle: source.title,
      targetGuidelineId: target.id,
      targetGuidelineTitle: target.title,
      targetInstitutionId: target.strategy.institutionId,
      targetInstitutionName: target.strategy.institutionName,
      targetInstitutionSlug: target.strategy.institutionSlug,
      targetStrategyId: target.strategy.strategyId,
      targetStrategyTitle: target.strategy.strategyTitle,
      targetStrategySlug: target.strategy.strategySlug,
      targetCycleId: target.strategy.cycleId,
      rationale: item.rationale,
      confidence: item.confidence,
      scope: strategicLinkGroupLabel(groupKey, locale),
      canCreate: groupKey === 'sameInstitution'
    };
  }).filter(Boolean);

  return {
    model: response?.model || null,
    responseLanguage: suggestions.responseLanguage,
    sameInstitution: enrichGroup(suggestions.sameInstitution, sameInstitutionTargetById, 'sameInstitution'),
    otherInstitutions: enrichGroup(suggestions.otherInstitutions, otherInstitutionTargetById, 'otherInstitutions')
  };
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
      goal: 'Prepare as many concrete mixed draft proposals across both guidelines and initiatives as are genuinely needed so the whole strategy becomes clearer, less duplicated, and more actionable.',
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

function compactPromptGuideline(item) {
  return {
    id: item?.id,
    title: cleanText(item?.title, 120),
    description: cleanPreviewText(item?.description, 220),
    relationType: cleanText(item?.relationType, 20) || 'orphan',
    parentTitle: cleanText(item?.parentTitle, 120) || null,
    implementationDate: formatDate(item?.implementationDate),
    linkedInitiatives: Number(item?.linkedInitiatives || 0)
  };
}

function compactPromptInitiative(item) {
  return {
    id: item?.id,
    title: cleanText(item?.title, 120),
    description: cleanPreviewText(item?.description, 220),
    implementationDate: formatDate(item?.implementationDate),
    linkedGuidelines: truncateList(normalizeArray(item?.linkedGuidelines).map((title) => cleanText(title, 120)).filter(Boolean), 4)
  };
}

function compactPromptPayloadForProvider(payload, provider) {
  const normalizedProvider = String(provider || '').trim().toLowerCase();
  if (normalizedProvider !== 'mistral') return payload;

  const page = payload?.page && typeof payload.page === 'object' ? payload.page : {};
  const compactFocusSummary = page?.focusSummary && typeof page.focusSummary === 'object'
    ? {
        ...page.focusSummary,
        focusTitle: cleanText(page.focusSummary.focusTitle, 140),
        parentGuideline: page.focusSummary.parentGuideline ? compactPromptGuideline(page.focusSummary.parentGuideline) : null,
        childGuidelines: truncateList(normalizeArray(page.focusSummary.childGuidelines).map(compactPromptGuideline), 6),
        linkedInitiatives: truncateList(normalizeArray(page.focusSummary.linkedInitiatives).map(compactPromptInitiative), 6),
        linkedGuidelines: truncateList(normalizeArray(page.focusSummary.linkedGuidelines).map(compactPromptGuideline), 6)
      }
    : null;

  return {
    ...payload,
    reviewFocus: {
      ...payload.reviewFocus,
      avoid: truncateList(normalizeArray(payload?.reviewFocus?.avoid), 3)
    },
    strategy: {
      ...payload.strategy,
      title: cleanText(payload?.strategy?.title, 140),
      cycleTitle: cleanText(payload?.strategy?.cycleTitle, 140),
      institutionName: cleanText(payload?.strategy?.institutionName, 140),
      missionText: cleanPreviewText(payload?.strategy?.missionText, 320),
      visionText: cleanPreviewText(payload?.strategy?.visionText, 320)
    },
    page: {
      ...page,
      reviewIntent: {
        ...page.reviewIntent,
        primaryQuestions: truncateList(normalizeArray(page?.reviewIntent?.primaryQuestions), 4),
        prioritize: truncateList(normalizeArray(page?.reviewIntent?.prioritize), 4),
        avoid: truncateList(normalizeArray(page?.reviewIntent?.avoid), 4)
      },
      proposalDrafts: {
        ...page.proposalDrafts,
        rules: truncateList(normalizeArray(page?.proposalDrafts?.rules), 5)
      },
      focusGuideline: page.focusGuideline ? compactPromptGuideline(page.focusGuideline) : null,
      focusInitiative: page.focusInitiative ? compactPromptInitiative(page.focusInitiative) : null,
      focusSummary: compactFocusSummary,
      guidelines: truncateList(normalizeArray(page.guidelines).map(compactPromptGuideline), 28),
      initiatives: truncateList(normalizeArray(page.initiatives).map(compactPromptInitiative), 28),
      planRows: truncateList(normalizeArray(page.planRows).map((item) => ({
        kind: cleanText(item?.kind, 20),
        title: cleanText(item?.title, 120),
        relationType: cleanText(item?.relationType, 20) || null,
        parentTitle: cleanText(item?.parentTitle, 120) || null,
        implementationDate: formatDate(item?.implementationDate),
        implementationOwner: cleanText(item?.implementationOwner, 80),
        linkedInitiatives: Number(item?.linkedInitiatives || 0),
        linkedGuidelines: truncateList(normalizeArray(item?.linkedGuidelines).map((title) => cleanText(title, 120)).filter(Boolean), 3)
      })), 48),
      mostConnectedGuidelines: truncateList(normalizeArray(page.mostConnectedGuidelines).map(compactPromptGuideline), 8)
    }
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
    '- proposalDrafts: 0 or more items.',
    '- When proposalDrafts are enabled, return as many concrete drafts as are genuinely needed to move the strategy toward 10/10 clarity. Do not stop at an arbitrary cap.',
    '- Keep proposalDraft titles, descriptions, and rationales concise. Prefer compact, specific wording over long explanations.',
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

function buildUserPrompt(payload, provider) {
  const compactPayload = compactPromptPayloadForProvider(payload, provider);
  const prettyJson = String(provider || '').trim().toLowerCase() === 'mistral'
    ? JSON.stringify(compactPayload)
    : JSON.stringify(compactPayload, null, 2);
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
    String(provider || '').trim().toLowerCase() === 'mistral'
      ? 'Be concise, select only the most important evidence from the provided context, and avoid repeating similar observations.'
      : '',
    '',
    'CONTEXT JSON:',
    prettyJson
  ].filter(Boolean).join('\n');
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

function buildSchemaRetryPrompt(locale) {
  const isEnglish = String(locale || '').trim().toLowerCase() === 'en';
  return isEnglish
    ? [
        'RETRY REQUIREMENT:',
        'Your previous response was rejected because the JSON schema was incomplete or invalid.',
        'Regenerate the full JSON from scratch.',
        'You must include all required top-level keys: responseLanguage, pageLabel, score, summary, strengths, improvements, nextActions, dataGaps, proposalDrafts.',
        'You must include at least one improvement and at least one nextAction.',
        'Keep every field concise so the full JSON fits in one response. If you return many proposalDrafts, keep each title, description, and rationale compact and non-repetitive.',
        'Return only one valid JSON object with no markdown, no explanation, and no trailing text.'
      ].join('\n')
    : [
        'PAKARTOTINIO BANDYMO TAISYKLĖ:',
        'Ankstesnis atsakymas buvo atmestas, nes JSON schema buvo nepilna arba netinkama.',
        'Sugeneruokite visą JSON iš naujo.',
        'Privalote įtraukti visus privalomus viršutinio lygio laukus: responseLanguage, pageLabel, score, summary, strengths, improvements, nextActions, dataGaps, proposalDrafts.',
        'Privalote pateikti bent vieną improvement ir bent vieną nextAction.',
        'Grąžinkite tik vieną validų JSON objektą be markdown, be paaiškinimų ir be papildomo teksto.'
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
    proposalDrafts: normalizeArray(value.proposalDrafts)
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
      .filter((item) => item.entityKind && item.title && item.description && ((item.draftMode !== 'update' && item.draftMode !== 'delete') || item.targetTitle))
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
  const baseUserText = buildUserPrompt(promptPayload, aiConfig?.provider);
  const requestAnalysis = async (extraPrompt = '', operationSuffix = '') => {
    const response = await requestPolicyAlignmentJson({
      ...aiConfig,
      systemText,
      userText: extraPrompt ? `${baseUserText}\n\n${extraPrompt}` : baseUserText,
      maxOutputTokens: aiConfig?.maxOutputTokens,
      operationName: `clarity-gremlin:${normalizedView}${operationSuffix}`
    });
    const analysis = normalizeAnalysis(response?.parsed);
    validateAnalysis(analysis, locale, viewPayload);
    return { response, analysis };
  };

  let response;
  let analysis;
  try {
    ({ response, analysis } = await requestAnalysis('', ''));
  } catch (error) {
    const message = String(error?.message || '').trim();
    if (message === 'ai response invalid') {
      ({ response, analysis } = await requestAnalysis(buildSchemaRetryPrompt(locale), ':retry-schema'));
    } else if (message === 'ai response missing delete draft') {
      ({ response, analysis } = await requestAnalysis(buildDeleteDraftRetryPrompt(locale), ':retry-delete-draft'));
    } else {
      throw error;
    }
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
  const defaultTimeoutMs = String(provider || '').trim().toLowerCase() === 'mistral' ? 180000 : 120000;
  const defaultMaxOutputTokens = 12000;
  return {
    ...base,
    model: resolveProviderCompatibleModel(
      provider || base.provider,
      process.env.CLARITY_GREMLIN_MODEL,
      fallbackModel
    ),
    maxOutputTokens: Math.max(
      4000,
      Number(process.env.CLARITY_GREMLIN_MAX_OUTPUT_TOKENS || base.maxOutputTokens || defaultMaxOutputTokens)
    ),
    timeoutMs: Math.max(
      defaultTimeoutMs,
      Number(process.env.CLARITY_GREMLIN_TIMEOUT_MS || base.timeoutMs || defaultTimeoutMs)
    )
  };
}

module.exports = {
  SUPPORTED_VIEWS,
  getClarityGremlinConfig,
  analyzeStrategyPage,
  normalizeAnalysis,
  searchStrategicLinks
};
