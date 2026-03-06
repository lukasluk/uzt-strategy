const {
  requestPolicyAlignmentJson,
  getPolicyAlignmentAiConfig
} = require('./policyAlignmentAiService');
const {
  batchRequirements,
  buildCandidateContextByRequirement,
  refineFindingWithDeterministicSignals,
  sentenceSplit,
  trimText
} = require('./policyAlignmentAnalysisHelpers');

function splitParagraphs(text) {
  return trimText(text)
    .split(/\n\s*\n/g)
    .map((part) => trimText(part))
    .filter(Boolean);
}

function estimateTokens(text) {
  const length = String(text || '').length;
  if (!length) return 0;
  return Math.max(1, Math.round(length / 4));
}

function normalizeLocaleHint(value) {
  return String(value || '').trim().toLowerCase() === 'lt' ? 'lt' : 'en';
}

function clampConfidence(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(1, Number(parsed.toFixed(3))));
}

function normalizeCoverageStatus(value) {
  const token = String(value || '').trim().toLowerCase();
  if (['covered', 'partial', 'weak', 'missing', 'contradicted', 'unclear'].includes(token)) {
    return token;
  }
  return 'unclear';
}

function normalizeActionability(value) {
  const token = String(value || '').trim().toLowerCase();
  if (['none', 'review', 'suggest_guideline', 'suggest_initiative'].includes(token)) {
    return token;
  }
  return 'review';
}

function buildDocumentChunks(documents, options = {}) {
  const docs = Array.isArray(documents) ? documents : [];
  const maxChars = Math.max(600, Number(options.maxChars || 1600));
  const chunks = [];

  docs.forEach((document) => {
    const paragraphs = splitParagraphs(document.extractedText || '');
    let bucket = [];
    let bucketLength = 0;
    let ordinal = 0;

    const flushBucket = () => {
      if (!bucket.length) return;
      const textExcerpt = bucket.join('\n\n').trim();
      chunks.push({
        documentId: document.id,
        chunkRole: document.role,
        ordinal,
        pageFrom: null,
        pageTo: null,
        sectionPath: document.filename,
        heading: bucket[0].slice(0, 120),
        tokenEstimate: estimateTokens(textExcerpt),
        textExcerpt,
        meta: {
          filename: document.filename,
          sourceKind: document.sourceKind,
          paragraphCount: bucket.length
        }
      });
      ordinal += 1;
      bucket = [];
      bucketLength = 0;
    };

    paragraphs.forEach((paragraph) => {
      const text = trimText(paragraph, maxChars * 2);
      if (!text) return;
      if (text.length > maxChars) {
        flushBucket();
        let offset = 0;
        while (offset < text.length) {
          const slice = trimText(text.slice(offset, offset + maxChars));
          if (slice) {
            chunks.push({
              documentId: document.id,
              chunkRole: document.role,
              ordinal,
              pageFrom: null,
              pageTo: null,
              sectionPath: document.filename,
              heading: slice.slice(0, 120),
              tokenEstimate: estimateTokens(slice),
              textExcerpt: slice,
              meta: {
                filename: document.filename,
                sourceKind: document.sourceKind,
                splitFromLongParagraph: true
              }
            });
            ordinal += 1;
          }
          offset += maxChars;
        }
        return;
      }

      const nextLength = bucketLength + text.length + (bucket.length ? 2 : 0);
      if (bucket.length && nextLength > maxChars) {
        flushBucket();
      }
      bucket.push(text);
      bucketLength += text.length + (bucket.length > 1 ? 2 : 0);
    });

    flushBucket();
  });

  return chunks;
}

async function loadCycleSourceEntities({ query, cycleId }) {
  const cycleRes = await query(
    `select c.id,
            c.title,
            c.mission_text,
            c.vision_text,
            s.title as strategy_title,
            s.description as strategy_description
     from strategy_cycles c
     left join institution_strategies s on s.id = c.strategy_id
     where c.id = $1
     limit 1`,
    [cycleId]
  );
  if (!cycleRes.rowCount) {
    throw new Error('cycle not found');
  }

  const guidelineRes = await query(
    `select id, title, description, relation_type, parent_guideline_id
     from strategy_guidelines
     where cycle_id = $1
       and status in ('active', 'disabled', 'merged')
     order by created_at asc`,
    [cycleId]
  );

  const initiativeRes = await query(
    `select i.id, i.title, i.description,
            coalesce(jsonb_agg(jsonb_build_object('guidelineId', g.id, 'guidelineTitle', g.title) order by g.created_at asc)
              filter (where g.id is not null), '[]'::jsonb) as guideline_links_json
     from strategy_initiatives i
     left join strategy_initiative_guidelines ig on ig.initiative_id = i.id
     left join strategy_guidelines g on g.id = ig.guideline_id
     where i.cycle_id = $1
       and i.status in ('active', 'disabled', 'merged')
     group by i.id
     order by min(i.created_at) asc, i.id asc`,
    [cycleId]
  );

  const cycle = cycleRes.rows[0];
  const refs = [];

  const narrativeParts = [
    trimText(cycle.strategy_title, 240),
    trimText(cycle.strategy_description, 1200),
    trimText(cycle.title, 240),
    trimText(cycle.mission_text, 1800),
    trimText(cycle.vision_text, 1800)
  ].filter(Boolean);

  if (narrativeParts.length) {
    refs.push({
      entityKind: 'cycle',
      entityId: cycle.id,
      title: trimText(cycle.strategy_title || cycle.title || 'Strategy cycle', 240) || 'Strategy cycle',
      description: narrativeParts.join('\n\n'),
      meta: {
        source: 'cycle_narrative'
      }
    });
  }

  guidelineRes.rows.forEach((row) => {
    refs.push({
      entityKind: 'guideline',
      entityId: row.id,
      title: trimText(row.title, 240) || row.id,
      description: trimText(row.description, 2200),
      meta: {
        relationType: row.relation_type || 'orphan',
        parentGuidelineId: row.parent_guideline_id || null,
        source: 'guideline'
      }
    });
  });

  initiativeRes.rows.forEach((row) => {
    const links = Array.isArray(row.guideline_links_json) ? row.guideline_links_json : [];
    const linkedTitles = links
      .map((item) => trimText(item?.guidelineTitle, 180))
      .filter(Boolean);
    const description = [
      trimText(row.description, 1800),
      linkedTitles.length ? `Supports guidelines: ${linkedTitles.join('; ')}` : ''
    ].filter(Boolean).join('\n\n');

    refs.push({
      entityKind: 'initiative',
      entityId: row.id,
      title: trimText(row.title, 240) || row.id,
      description,
      meta: {
        guidelineIds: links
          .map((item) => String(item?.guidelineId || '').trim())
          .filter(Boolean),
        guidelineTitles: linkedTitles,
        source: 'initiative'
      }
    });
  });

  return refs;
}

function buildDocumentSourceRefs(chunks) {
  const refs = [];
  (Array.isArray(chunks) ? chunks : []).forEach((chunk) => {
    const baseTitle = trimText(chunk.heading || chunk.sectionPath || `Document chunk ${chunk.ordinal + 1}`, 240);
    refs.push({
      entityKind: 'document',
      entityId: null,
      title: baseTitle,
      description: trimText(chunk.textExcerpt, 2200),
      sourceDocumentId: chunk.documentId,
      sourceChunkId: chunk.id || null,
      meta: {
        chunkOrdinal: chunk.ordinal,
        sectionPath: chunk.sectionPath || null,
        tokenEstimate: chunk.tokenEstimate || null,
        source: 'document_chunk'
      }
    });

    const claims = sentenceSplit(chunk.textExcerpt)
      .filter((sentence) => sentence.length >= 70)
      .slice(0, 2);
    claims.forEach((sentence, index) => {
      refs.push({
        entityKind: 'document',
        entityId: null,
        title: trimText(`${baseTitle} claim ${index + 1}`, 240),
        description: trimText(sentence, 700),
        sourceDocumentId: chunk.documentId,
        sourceChunkId: chunk.id || null,
        meta: {
          chunkOrdinal: chunk.ordinal,
          claimIndex: index,
          sectionPath: chunk.sectionPath || null,
          source: 'document_claim'
        }
      });
    });
  });
  return refs;
}

function buildRequirementExtractionPrompt({ localeHint, targetChunks }) {
  const locale = normalizeLocaleHint(localeHint);
  const documentsText = (Array.isArray(targetChunks) ? targetChunks : [])
    .slice(0, 80)
    .map((chunk) => [
      `CHUNK ${chunk.ordinal + 1}`,
      chunk.heading ? `Heading: ${chunk.heading}` : '',
      chunk.sectionPath ? `Section: ${chunk.sectionPath}` : '',
      chunk.textExcerpt
    ].filter(Boolean).join('\n'))
    .join('\n\n');

  const systemText = [
    'You are a policy analyst extracting concrete policy requirements from a framework document.',
    'Return only valid JSON.',
    'Output schema:',
    '{',
    '  "requirements": [',
    '    {',
    '      "requirementKey": "short-stable-key",',
    '      "theme": "string",',
    '      "title": "string",',
    '      "description": "string",',
    '      "evidence": [',
    '        { "chunkOrdinal": 1, "quote": "string" }',
    '      ]',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- Extract concrete, non-duplicative requirements/objectives/themes.',
    '- Merge synonymous items instead of repeating them.',
    '- Keep titles specific and short.',
    '- Keep descriptions actionable and faithful to the source.',
    '- Every requirement must include at least one evidence entry referencing a chunk ordinal.',
    locale === 'lt'
      ? '- Output all strings in Lithuanian.'
      : '- Output all strings in English.'
  ].join('\n');

  const userText = [
    'Extract the policy requirements from these target policy chunks.',
    documentsText
  ].join('\n\n');

  return { systemText, userText };
}

function normalizeExtractedRequirements(parsed) {
  const rawList = Array.isArray(parsed?.requirements) ? parsed.requirements : [];
  const byKey = new Map();
  rawList.forEach((item, index) => {
    const title = trimText(item?.title, 400);
    if (!title) return;
    const theme = trimText(item?.theme, 240) || 'General';
    const key = trimText(item?.requirementKey, 120) || `${theme.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`;
    if (byKey.has(key)) return;
    byKey.set(key, {
      requirementKey: key,
      theme,
      title,
      description: trimText(item?.description, 4000) || null,
      evidence: (Array.isArray(item?.evidence) ? item.evidence : [])
        .map((evidence) => ({
          chunkOrdinal: Number.isFinite(Number(evidence?.chunkOrdinal)) ? Number(evidence.chunkOrdinal) : null,
          quote: trimText(evidence?.quote, 800)
        }))
        .filter((evidence) => evidence.chunkOrdinal !== null || evidence.quote)
    });
  });
  return Array.from(byKey.values());
}

function buildComparisonPrompt({ localeHint, requirements, candidateContext, sourceRefsById }) {
  const locale = normalizeLocaleHint(localeHint);
  const requirementText = (Array.isArray(requirements) ? requirements : [])
    .map((item) => {
      const candidates = candidateContext.get(item.id) || [];
      const candidateLines = candidates.length
        ? candidates.map((candidate) => {
          const sourceRef = candidate.sourceRef;
          return [
            `- Source Ref ID: ${sourceRef.id}`,
            `  Kind: ${sourceRef.entityKind}`,
            `  Title: ${sourceRef.title}`,
            sourceRef.description ? `  Description: ${sourceRef.description}` : '',
            `  Deterministic score: ${candidate.match.score}`,
            candidate.match.sharedKeywords.length
              ? `  Shared keywords: ${candidate.match.sharedKeywords.join(', ')}`
              : ''
          ].filter(Boolean).join('\n');
        }).join('\n')
        : '- No strong deterministic candidates.';

      return [
        `Requirement ID: ${item.id}`,
        item.theme ? `Theme: ${item.theme}` : '',
        `Title: ${item.title}`,
        item.description ? `Description: ${item.description}` : '',
        'Candidate source references:',
        candidateLines
      ].filter(Boolean).join('\n');
    })
    .join('\n\n');

  const allCandidateIds = [...new Set(
    (Array.from(candidateContext.values()).flatMap((items) => items || []))
      .map((item) => String(item?.sourceRef?.id || '').trim())
      .filter(Boolean)
  )];

  const sourceText = allCandidateIds
    .map((sourceRefId) => sourceRefsById.get(sourceRefId))
    .filter(Boolean)
    .map((item) => [
      `Source Ref ID: ${item.id}`,
      `Kind: ${item.entityKind}`,
      `Title: ${item.title}`,
      item.description ? `Description: ${item.description}` : ''
    ].filter(Boolean).join('\n'))
    .join('\n\n');

  const systemText = [
    'You are a policy alignment analyst.',
    'Compare target requirements against source strategy material.',
    'Return only valid JSON.',
    'Output schema:',
    '{',
    '  "findings": [',
    '    {',
    '      "requirementId": "uuid",',
    '      "coverageStatus": "covered|partial|weak|missing|contradicted|unclear",',
    '      "confidence": 0.0,',
    '      "explanation": "string",',
    '      "overlapSummary": "string",',
    '      "matchedSourceRefIds": ["uuid"],',
    '      "evidence": [',
    '        { "sourceRefId": "uuid", "quote": "string" }',
    '      ],',
    '      "actionability": "none|review|suggest_guideline|suggest_initiative"',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- Return one finding for every requirement id provided.',
    '- Base your answer only on the provided candidate source refs for each requirement.',
    '- Use "missing" when there is no meaningful source coverage.',
    '- Use "weak" when only vague mention exists without concrete commitment.',
    '- Use "partial" when the source covers part but not the full requirement.',
    '- Use "contradicted" when the source direction conflicts with the requirement.',
    '- Use only source ref ids that are provided.',
    '- Every non-missing finding should include at least one evidence entry where possible.',
    '- Explanations must be evidence-first and concise.',
    locale === 'lt'
      ? '- Output all strings in Lithuanian.'
      : '- Output all strings in English.'
  ].join('\n');

  const userText = [
    'Requirements with deterministic candidate hints:',
    requirementText,
    '',
    'Source reference catalog:',
    sourceText || 'No candidate source references were identified.'
  ].join('\n');

  return { systemText, userText };
}

function normalizeComparisonFindings(parsed, requirementsById, sourceRefsById) {
  const rawFindings = Array.isArray(parsed?.findings) ? parsed.findings : [];
  const result = [];
  const seen = new Set();

  rawFindings.forEach((item) => {
    const requirementId = String(item?.requirementId || '').trim();
    if (!requirementId || !requirementsById.has(requirementId) || seen.has(requirementId)) return;
    seen.add(requirementId);
    const requirement = requirementsById.get(requirementId);
    const matchedIds = [...new Set(
      (Array.isArray(item?.matchedSourceRefIds) ? item.matchedSourceRefIds : [])
        .map((value) => String(value || '').trim())
        .filter((value) => sourceRefsById.has(value))
    )];

    result.push({
      requirementId,
      theme: requirement.theme || null,
      requirementTitle: requirement.title,
      requirementDescription: requirement.description || null,
      coverageStatus: normalizeCoverageStatus(item?.coverageStatus),
      confidence: clampConfidence(item?.confidence),
      explanation: trimText(item?.explanation, 6000) || null,
      overlapSummary: trimText(item?.overlapSummary, 4000) || null,
      evidence: Array.isArray(item?.evidence) ? item.evidence : [],
      matchedSourceRefs: matchedIds.map((sourceRefId) => ({
        sourceRefId,
        entityKind: sourceRefsById.get(sourceRefId).entityKind,
        entityId: sourceRefsById.get(sourceRefId).entityId || null,
        title: sourceRefsById.get(sourceRefId).title
      })),
      actionability: normalizeActionability(item?.actionability)
    });
  });

  requirementsById.forEach((requirement, requirementId) => {
    if (seen.has(requirementId)) return;
    result.push({
      requirementId,
      theme: requirement.theme || null,
      requirementTitle: requirement.title,
      requirementDescription: requirement.description || null,
      coverageStatus: 'unclear',
      confidence: null,
      explanation: null,
      overlapSummary: null,
      evidence: [],
      matchedSourceRefs: [],
      actionability: 'review'
    });
  });

  return result;
}

function buildSuggestionsFromFindings(findings) {
  return (Array.isArray(findings) ? findings : [])
    .flatMap((finding) => {
      const guidelineIds = (Array.isArray(finding.matchedSourceRefs) ? finding.matchedSourceRefs : [])
        .filter((item) => item?.entityKind === 'guideline' && item?.entityId)
        .map((item) => item.entityId);
      const uniqueGuidelineIds = [...new Set(guidelineIds)];

      let suggestionKind = '';
      if (finding.coverageStatus === 'missing') {
        suggestionKind = 'guideline';
      } else if (finding.coverageStatus === 'weak' || finding.coverageStatus === 'contradicted') {
        suggestionKind = uniqueGuidelineIds.length ? 'initiative' : 'guideline';
      } else if (finding.coverageStatus === 'partial' && uniqueGuidelineIds.length) {
        suggestionKind = 'initiative';
      } else {
        return [];
      }

      const title = suggestionKind === 'guideline'
        ? finding.requirementTitle
        : `Deliver on ${finding.requirementTitle}`;
      const description = suggestionKind === 'guideline'
        ? trimText(finding.requirementDescription || finding.explanation, 3000)
        : trimText(finding.explanation || finding.requirementDescription, 3000);

      return [{
        findingId: finding.id,
        suggestionKind,
        title,
        description,
        rationale: trimText([
          finding.overlapSummary,
          finding.explanation
        ].filter(Boolean).join('\n\n'), 5000) || null,
        status: 'draft',
        meta: suggestionKind === 'initiative'
          ? { guidelineIds: uniqueGuidelineIds }
          : { relationType: 'orphan' }
      }];
    });
}

function buildSummaryFromFindings(findings) {
  const summary = {
    total: 0,
    covered: 0,
    partial: 0,
    weak: 0,
    missing: 0,
    contradicted: 0,
    unclear: 0,
    averageConfidence: null
  };

  let confidenceTotal = 0;
  let confidenceCount = 0;
  (Array.isArray(findings) ? findings : []).forEach((finding) => {
    const status = normalizeCoverageStatus(finding?.coverageStatus);
    summary.total += 1;
    summary[status] += 1;
    if (Number.isFinite(Number(finding?.confidence))) {
      confidenceTotal += Number(finding.confidence);
      confidenceCount += 1;
    }
  });

  if (confidenceCount) {
    summary.averageConfidence = Number((confidenceTotal / confidenceCount).toFixed(3));
  }

  return summary;
}

function attachIds(items, makeId, options = {}) {
  const preserveExisting = options.preserveExisting !== false;
  return (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    id: String((preserveExisting ? item?.id : '') || makeId()).trim()
  })).filter((item) => item.id);
}

async function compareRequirementBatch({ requirements, sourceRefsById, localeHint, candidateContext }) {
  const { systemText, userText } = buildComparisonPrompt({
    localeHint,
    requirements,
    candidateContext,
    sourceRefsById
  });
  const aiConfig = getPolicyAlignmentAiConfig();
  const response = await requestPolicyAlignmentJson({
    ...aiConfig,
    systemText,
    userText,
    operationName: 'policy-alignment-compare'
  });
  return {
    model: response.model,
    parsed: response.parsed
  };
}

function createPolicyAlignmentPipelineService({ query, uuid }) {
  const nextId = () => (typeof uuid === 'function' ? uuid() : '');

  async function extractRequirementsFromTargetDocuments({ documents, localeHint = 'en' }) {
    const chunks = buildDocumentChunks(documents);
    const { systemText, userText } = buildRequirementExtractionPrompt({ localeHint, targetChunks: chunks });
    const aiConfig = getPolicyAlignmentAiConfig();
    const response = await requestPolicyAlignmentJson({
      ...aiConfig,
      systemText,
      userText,
      operationName: 'policy-alignment-extract-requirements'
    });
    const requirements = normalizeExtractedRequirements(response.parsed);
    return {
      model: response.model,
      chunks,
      requirements
    };
  }

  async function buildSourceReferences({ cycleId, sourceDocuments, includeCycleEntities = true }) {
    const cycleRefs = includeCycleEntities
      ? await loadCycleSourceEntities({ query, cycleId })
      : [];
    const documentChunks = buildDocumentChunks(sourceDocuments);
    const documentRefs = buildDocumentSourceRefs(documentChunks);
    return {
      chunks: documentChunks,
      refs: [...cycleRefs, ...documentRefs]
    };
  }

  async function compareRequirementsToSource({ requirements, sourceRefs, localeHint = 'en' }) {
    // Requirement rows are persisted per analysis, so framework-owned ids must not be reused here.
    const requirementsWithIds = attachIds(requirements, nextId, { preserveExisting: false });
    const sourceRefsWithIds = attachIds(sourceRefs, nextId);
    const requirementsById = new Map(requirementsWithIds.map((item) => [item.id, item]));
    const sourceRefsById = new Map(sourceRefsWithIds.map((item) => [item.id, item]));
    const candidateContext = buildCandidateContextByRequirement(requirementsWithIds, sourceRefsWithIds, {
      threshold: 0.08,
      limit: 8
    });
    const batchSize = Math.max(
      3,
      Math.min(8, Number(process.env.POLICY_ALIGNMENT_REQUIREMENT_BATCH_SIZE || 6))
    );
    const batches = batchRequirements(requirementsWithIds, batchSize);

    const rawFindings = [];
    const modelSet = new Set();

    for (const batch of batches) {
      const batchCandidateContext = new Map(batch.map((requirement) => [
        requirement.id,
        candidateContext.get(requirement.id) || []
      ]));
      const batchResponse = await compareRequirementBatch({
        requirements: batch,
        sourceRefsById,
        localeHint,
        candidateContext: batchCandidateContext
      });
      if (batchResponse.model) modelSet.add(batchResponse.model);
      rawFindings.push(...normalizeComparisonFindings(batchResponse.parsed, requirementsById, sourceRefsById));
    }

    const findings = rawFindings
      .map((finding) => refineFindingWithDeterministicSignals(
        finding,
        candidateContext.get(finding.requirementId) || [],
        sourceRefsById
      ))
      .map((finding) => ({ ...finding, id: nextId() }));

    const suggestions = buildSuggestionsFromFindings(findings)
      .map((suggestion) => ({ ...suggestion, id: nextId() }));

    return {
      model: [...modelSet][0] || null,
      requirements: requirementsWithIds,
      sourceRefs: sourceRefsWithIds,
      findings,
      suggestions,
      summary: {
        ...buildSummaryFromFindings(findings),
        batchedRequirementCount: batches.length,
        sourceRefCount: sourceRefsWithIds.length
      }
    };
  }

  async function loadFrameworkRequirements(frameworkId) {
    const result = await query(
      `select *
       from policy_alignment_requirements
       where framework_id = $1
       order by ordinal asc, created_at asc`,
      [frameworkId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      requirementKey: row.requirement_key || null,
      theme: row.theme || null,
      title: row.title,
      description: row.description || null,
      evidence: typeof row.evidence_json === 'object' ? row.evidence_json : []
    }));
  }

  return {
    buildDocumentChunks,
    buildSourceReferences,
    extractRequirementsFromTargetDocuments,
    compareRequirementsToSource,
    loadFrameworkRequirements,
    buildSummaryFromFindings
  };
}

module.exports = {
  createPolicyAlignmentPipelineService,
  buildDocumentChunks,
  buildSummaryFromFindings,
  normalizeLocaleHint
};
