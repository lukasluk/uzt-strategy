const ALIGNMENT_ANALYSIS_STATUSES = Object.freeze([
  'draft',
  'queued',
  'processing',
  'completed',
  'failed'
]);

const ALIGNMENT_COVERAGE_STATUSES = Object.freeze([
  'covered',
  'partial',
  'weak',
  'missing',
  'contradicted',
  'unclear'
]);

const ALIGNMENT_ENTITY_KINDS = Object.freeze([
  'document',
  'guideline',
  'initiative',
  'cycle',
  'strategy_framework'
]);

const ALIGNMENT_SOURCE_MODES = Object.freeze([
  'uploaded_document',
  'existing_strategy',
  'existing_cycle',
  'mixed'
]);

const ALIGNMENT_TARGET_MODES = Object.freeze([
  'uploaded_document',
  'framework'
]);

const ALIGNMENT_DOCUMENT_ROLES = Object.freeze([
  'source',
  'target'
]);

const ALIGNMENT_DOCUMENT_SOURCE_KINDS = Object.freeze([
  'uploaded_pdf',
  'existing_strategy_export',
  'existing_cycle_export',
  'framework_document'
]);

const ALIGNMENT_FINDING_ACTIONS = Object.freeze([
  'none',
  'review',
  'suggest_guideline',
  'suggest_initiative'
]);

const ALIGNMENT_SUGGESTION_KINDS = Object.freeze([
  'guideline',
  'initiative'
]);

const ALIGNMENT_SUGGESTION_STATUSES = Object.freeze([
  'draft',
  'converted',
  'dismissed'
]);

function normalizeFromSet(value, allowed, fallback) {
  const normalized = String(value || '').trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeAnalysisStatus(value) {
  return normalizeFromSet(value, ALIGNMENT_ANALYSIS_STATUSES, 'draft');
}

function normalizeCoverageStatus(value) {
  return normalizeFromSet(value, ALIGNMENT_COVERAGE_STATUSES, 'unclear');
}

function normalizeAlignmentEntityKind(value) {
  return normalizeFromSet(value, ALIGNMENT_ENTITY_KINDS, 'document');
}

function normalizeSourceMode(value) {
  return normalizeFromSet(value, ALIGNMENT_SOURCE_MODES, 'uploaded_document');
}

function normalizeTargetMode(value) {
  return normalizeFromSet(value, ALIGNMENT_TARGET_MODES, 'uploaded_document');
}

function normalizeDocumentRole(value) {
  return normalizeFromSet(value, ALIGNMENT_DOCUMENT_ROLES, 'source');
}

function normalizeDocumentSourceKind(value) {
  return normalizeFromSet(value, ALIGNMENT_DOCUMENT_SOURCE_KINDS, 'uploaded_pdf');
}

function normalizeFindingAction(value) {
  return normalizeFromSet(value, ALIGNMENT_FINDING_ACTIONS, 'review');
}

function normalizeSuggestionKind(value) {
  return normalizeFromSet(value, ALIGNMENT_SUGGESTION_KINDS, 'guideline');
}

function normalizeSuggestionStatus(value) {
  return normalizeFromSet(value, ALIGNMENT_SUGGESTION_STATUSES, 'draft');
}

function trimText(value, maxLength = 0) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (maxLength > 0) return text.slice(0, maxLength).trim();
  return text;
}

function toNullableText(value, maxLength = 0) {
  const text = trimText(value, maxLength);
  return text || null;
}

function toIntegerOrNull(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

function clampConfidence(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(1, Number(parsed.toFixed(3))));
}

function normalizeJsonObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function normalizeJsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseJsonField(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function mapFrameworkRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    institutionId: row.institution_id || null,
    strategyId: row.strategy_id || null,
    cycleId: row.cycle_id || null,
    title: row.title,
    slug: row.slug || null,
    description: row.description || null,
    status: String(row.status || 'active').trim().toLowerCase(),
    sourceHash: row.source_hash || null,
    meta: parseJsonField(row.meta_json, {}),
    createdBy: row.created_by || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapDocumentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    analysisId: row.analysis_id || null,
    frameworkId: row.framework_id || null,
    role: normalizeDocumentRole(row.role),
    sourceKind: normalizeDocumentSourceKind(row.source_kind),
    filename: row.filename,
    mimeType: row.mime_type || null,
    fileBytes: toIntegerOrNull(row.file_bytes),
    pageCount: toIntegerOrNull(row.page_count),
    sha256Hash: row.sha256_hash || null,
    extractedText: row.extracted_text || '',
    extractionStatus: String(row.extraction_status || 'pending').trim().toLowerCase(),
    extractionError: row.extraction_error || null,
    meta: parseJsonField(row.meta_json, {}),
    createdBy: row.created_by || null,
    createdAt: row.created_at || null
  };
}

function mapChunkRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    analysisId: row.analysis_id || null,
    documentId: row.document_id,
    chunkRole: normalizeDocumentRole(row.chunk_role),
    ordinal: toIntegerOrNull(row.ordinal) || 0,
    pageFrom: toIntegerOrNull(row.page_from),
    pageTo: toIntegerOrNull(row.page_to),
    sectionPath: row.section_path || null,
    heading: row.heading || null,
    tokenEstimate: toIntegerOrNull(row.token_estimate),
    textExcerpt: row.text_excerpt || '',
    meta: parseJsonField(row.meta_json, {}),
    createdAt: row.created_at || null
  };
}

function mapRequirementRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    frameworkId: row.framework_id || null,
    analysisId: row.analysis_id || null,
    sourceDocumentId: row.source_document_id || null,
    requirementKey: row.requirement_key || null,
    theme: row.theme || null,
    title: row.title,
    description: row.description || null,
    status: String(row.status || 'active').trim().toLowerCase(),
    ordinal: toIntegerOrNull(row.ordinal) || 0,
    evidence: parseJsonField(row.evidence_json, []),
    raw: parseJsonField(row.raw_json, {}),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapSourceRefRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    analysisId: row.analysis_id,
    entityKind: normalizeAlignmentEntityKind(row.entity_kind),
    entityId: row.entity_id || null,
    title: row.title,
    description: row.description || null,
    sourceDocumentId: row.source_document_id || null,
    sourceChunkId: row.source_chunk_id || null,
    meta: parseJsonField(row.meta_json, {}),
    createdAt: row.created_at || null
  };
}

function mapFindingRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    analysisId: row.analysis_id,
    requirementId: row.requirement_id || null,
    theme: row.theme || null,
    requirementTitle: row.requirement_title,
    requirementDescription: row.requirement_description || null,
    coverageStatus: normalizeCoverageStatus(row.coverage_status),
    confidence: clampConfidence(row.confidence),
    explanation: row.explanation || null,
    overlapSummary: row.overlap_summary || null,
    evidence: parseJsonField(row.evidence_json, []),
    matchedSourceRefs: parseJsonField(row.matched_source_refs_json, []),
    actionability: normalizeFindingAction(row.actionability),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapSuggestionRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    analysisId: row.analysis_id,
    findingId: row.finding_id || null,
    suggestionKind: normalizeSuggestionKind(row.suggestion_kind),
    title: row.title,
    description: row.description || null,
    rationale: row.rationale || null,
    status: normalizeSuggestionStatus(row.status),
    linkedGuidelineId: row.linked_guideline_id || null,
    linkedInitiativeId: row.linked_initiative_id || null,
    proposalId: row.proposal_id || null,
    meta: parseJsonField(row.meta_json, {}),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

function mapAnalysisRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    institutionId: row.institution_id,
    strategyId: row.strategy_id || null,
    cycleId: row.cycle_id || null,
    targetFrameworkId: row.target_framework_id || null,
    title: row.title,
    description: row.description || null,
    sourceMode: normalizeSourceMode(row.source_mode),
    targetMode: normalizeTargetMode(row.target_mode),
    status: normalizeAnalysisStatus(row.status),
    sourceSummary: parseJsonField(row.source_summary_json, {}),
    targetSummary: parseJsonField(row.target_summary_json, {}),
    summary: parseJsonField(row.summary_json, {}),
    errorMessage: row.error_message || null,
    startedAt: row.started_at || null,
    completedAt: row.completed_at || null,
    createdBy: row.created_by || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    documentCount: toIntegerOrNull(row.document_count) || 0,
    findingCount: toIntegerOrNull(row.finding_count) || 0,
    suggestionCount: toIntegerOrNull(row.suggestion_count) || 0
  };
}

function createPolicyAlignmentService({ query, uuid }) {
  const nextId = () => {
    if (typeof uuid === 'function') return uuid();
    return '';
  };

  async function createFramework({
    frameworkId,
    institutionId = null,
    strategyId = null,
    cycleId = null,
    title,
    slug = null,
    description = null,
    status = 'active',
    sourceHash = null,
    meta = {},
    createdBy = null
  }) {
    const id = String(frameworkId || nextId()).trim();
    if (!id) throw new Error('frameworkId required');
    const finalTitle = trimText(title, 240);
    if (!finalTitle) throw new Error('framework title required');

    await query(
      `insert into policy_alignment_frameworks (
         id, institution_id, strategy_id, cycle_id, title, slug, description, status,
         source_hash, meta_json, created_by
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)`,
      [
        id,
        institutionId || null,
        strategyId || null,
        cycleId || null,
        finalTitle,
        toNullableText(slug, 180),
        toNullableText(description, 4000),
        String(status || 'active').trim().toLowerCase() === 'archived' ? 'archived' : 'active',
        toNullableText(sourceHash, 128),
        JSON.stringify(normalizeJsonObject(meta)),
        createdBy || null
      ]
    );

    return loadFrameworkById(id);
  }

  async function loadFrameworkById(frameworkId) {
    const result = await query(
      `select *
       from policy_alignment_frameworks
       where id = $1
       limit 1`,
      [frameworkId]
    );
    return result.rowCount ? mapFrameworkRow(result.rows[0]) : null;
  }

  async function listFrameworksForCycle(cycleId, institutionId = null) {
    const finalCycleId = String(cycleId || '').trim();
    if (!finalCycleId) throw new Error('cycleId required');
    const result = await query(
      `select framework.*,
              (
                select count(*)
                from policy_alignment_requirements requirement
                where requirement.framework_id = framework.id
              ) as requirement_count,
              (
                select count(*)
                from policy_alignment_documents document
                where document.framework_id = framework.id
              ) as document_count
       from policy_alignment_frameworks framework
       where framework.cycle_id = $1
         and ($2::uuid is null or framework.institution_id = $2)
       order by framework.updated_at desc, framework.created_at desc`,
      [finalCycleId, institutionId || null]
    );
    return result.rows.map((row) => ({
      ...mapFrameworkRow(row),
      requirementCount: toIntegerOrNull(row.requirement_count) || 0,
      documentCount: toIntegerOrNull(row.document_count) || 0
    }));
  }

  async function getFrameworkById(frameworkId) {
    const framework = await loadFrameworkById(frameworkId);
    if (!framework) return null;

    const [documentsRes, requirementsRes] = await Promise.all([
      query(
        `select *
         from policy_alignment_documents
         where framework_id = $1
         order by created_at asc`,
        [frameworkId]
      ),
      query(
        `select *
         from policy_alignment_requirements
         where framework_id = $1
         order by ordinal asc, created_at asc`,
        [frameworkId]
      )
    ]);

    return {
      ...framework,
      documents: documentsRes.rows.map(mapDocumentRow),
      requirements: requirementsRes.rows.map(mapRequirementRow),
      requirementCount: requirementsRes.rowCount || 0,
      documentCount: documentsRes.rowCount || 0
    };
  }

  async function createAnalysis({
    analysisId,
    institutionId,
    strategyId = null,
    cycleId = null,
    targetFrameworkId = null,
    title,
    description = null,
    sourceMode = 'uploaded_document',
    targetMode = 'uploaded_document',
    sourceSummary = {},
    targetSummary = {},
    summary = {},
    createdBy = null,
    status = 'draft'
  }) {
    const id = String(analysisId || nextId()).trim();
    if (!id) throw new Error('analysisId required');
    const finalInstitutionId = String(institutionId || '').trim();
    if (!finalInstitutionId) throw new Error('institutionId required');
    const finalTitle = trimText(title, 240);
    if (!finalTitle) throw new Error('analysis title required');

    await query(
      `insert into policy_alignment_analyses (
         id, institution_id, strategy_id, cycle_id, target_framework_id, title, description,
         source_mode, target_mode, status, source_summary_json, target_summary_json,
         summary_json, created_by
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14)`,
      [
        id,
        finalInstitutionId,
        strategyId || null,
        cycleId || null,
        targetFrameworkId || null,
        finalTitle,
        toNullableText(description, 4000),
        normalizeSourceMode(sourceMode),
        normalizeTargetMode(targetMode),
        normalizeAnalysisStatus(status),
        JSON.stringify(normalizeJsonObject(sourceSummary)),
        JSON.stringify(normalizeJsonObject(targetSummary)),
        JSON.stringify(normalizeJsonObject(summary)),
        createdBy || null
      ]
    );

    return getAnalysisById(id);
  }

  async function setAnalysisStatus({
    analysisId,
    status,
    errorMessage = null,
    startedAt = undefined,
    completedAt = undefined
  }) {
    const nextStatus = normalizeAnalysisStatus(status);
    const effectiveStartedAt = startedAt === undefined
      ? (nextStatus === 'processing' ? new Date().toISOString() : null)
      : startedAt;
    const effectiveCompletedAt = completedAt === undefined
      ? ((nextStatus === 'completed' || nextStatus === 'failed') ? new Date().toISOString() : null)
      : completedAt;

    const result = await query(
      `update policy_alignment_analyses
       set status = $2,
           error_message = $3,
           started_at = case when $4::timestamptz is null then started_at else $4::timestamptz end,
           completed_at = case when $5::timestamptz is null then completed_at else $5::timestamptz end,
           updated_at = now()
       where id = $1
       returning *`,
      [
        analysisId,
        nextStatus,
        toNullableText(errorMessage, 4000),
        effectiveStartedAt,
        effectiveCompletedAt
      ]
    );
    return result.rowCount ? mapAnalysisRow(result.rows[0]) : null;
  }

  async function updateAnalysisSummary({
    analysisId,
    sourceSummary = undefined,
    targetSummary = undefined,
    summary = undefined,
    errorMessage = undefined
  }) {
    const current = await query(
      `select *
       from policy_alignment_analyses
       where id = $1
       limit 1`,
      [analysisId]
    );
    if (!current.rowCount) return null;
    const row = current.rows[0];

    const nextSourceSummary = sourceSummary === undefined
      ? parseJsonField(row.source_summary_json, {})
      : normalizeJsonObject(sourceSummary);
    const nextTargetSummary = targetSummary === undefined
      ? parseJsonField(row.target_summary_json, {})
      : normalizeJsonObject(targetSummary);
    const nextSummary = summary === undefined
      ? parseJsonField(row.summary_json, {})
      : normalizeJsonObject(summary);
    const nextErrorMessage = errorMessage === undefined
      ? row.error_message
      : toNullableText(errorMessage, 4000);

    const result = await query(
      `update policy_alignment_analyses
       set source_summary_json = $2::jsonb,
           target_summary_json = $3::jsonb,
           summary_json = $4::jsonb,
           error_message = $5,
           updated_at = now()
       where id = $1
       returning *`,
      [
        analysisId,
        JSON.stringify(nextSourceSummary),
        JSON.stringify(nextTargetSummary),
        JSON.stringify(nextSummary),
        nextErrorMessage
      ]
    );
    return result.rowCount ? mapAnalysisRow(result.rows[0]) : null;
  }

  async function createDocument({
    documentId,
    analysisId = null,
    frameworkId = null,
    role,
    sourceKind,
    filename,
    mimeType = null,
    fileBytes = null,
    pageCount = null,
    sha256Hash = null,
    extractedText = '',
    extractionStatus = 'pending',
    extractionError = null,
    meta = {},
    createdBy = null
  }) {
    const id = String(documentId || nextId()).trim();
    if (!id) throw new Error('documentId required');
    if (!analysisId && !frameworkId) throw new Error('analysisId or frameworkId required');
    const finalFilename = trimText(filename, 400);
    if (!finalFilename) throw new Error('filename required');
    const finalExtractionStatus = ['pending', 'completed', 'failed'].includes(String(extractionStatus || '').trim().toLowerCase())
      ? String(extractionStatus || '').trim().toLowerCase()
      : 'pending';

    await query(
      `insert into policy_alignment_documents (
         id, analysis_id, framework_id, role, source_kind, filename, mime_type, file_bytes,
         page_count, sha256_hash, extracted_text, extraction_status, extraction_error, meta_json, created_by
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15)`,
      [
        id,
        analysisId || null,
        frameworkId || null,
        normalizeDocumentRole(role),
        normalizeDocumentSourceKind(sourceKind),
        finalFilename,
        toNullableText(mimeType, 160),
        toIntegerOrNull(fileBytes),
        toIntegerOrNull(pageCount),
        toNullableText(sha256Hash, 128),
        String(extractedText || ''),
        finalExtractionStatus,
        toNullableText(extractionError, 4000),
        JSON.stringify(normalizeJsonObject(meta)),
        createdBy || null
      ]
    );

    return loadDocumentById(id);
  }

  async function loadDocumentById(documentId) {
    const result = await query(
      `select *
       from policy_alignment_documents
       where id = $1
       limit 1`,
      [documentId]
    );
    return result.rowCount ? mapDocumentRow(result.rows[0]) : null;
  }

  async function replaceDocumentChunks({ analysisId = null, documentId, chunks }) {
    const finalDocumentId = String(documentId || '').trim();
    if (!finalDocumentId) throw new Error('documentId required');
    const inputChunks = Array.isArray(chunks) ? chunks : [];

    await query(
      `delete from policy_alignment_chunks
       where document_id = $1`,
      [finalDocumentId]
    );

    for (let index = 0; index < inputChunks.length; index += 1) {
      const item = inputChunks[index] || {};
      const chunkId = String(item.id || nextId()).trim();
      if (!chunkId) throw new Error('chunk id required');
      await query(
        `insert into policy_alignment_chunks (
           id, analysis_id, document_id, chunk_role, ordinal, page_from, page_to, section_path,
           heading, token_estimate, text_excerpt, meta_json
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`,
        [
          chunkId,
          analysisId || null,
          finalDocumentId,
          normalizeDocumentRole(item.chunkRole || item.role),
          toIntegerOrNull(item.ordinal) ?? index,
          toIntegerOrNull(item.pageFrom),
          toIntegerOrNull(item.pageTo),
          toNullableText(item.sectionPath, 400),
          toNullableText(item.heading, 240),
          toIntegerOrNull(item.tokenEstimate),
          trimText(item.textExcerpt || item.text, 12000),
          JSON.stringify(normalizeJsonObject(item.meta))
        ]
      );
    }

    const result = await query(
      `select *
       from policy_alignment_chunks
       where document_id = $1
       order by ordinal asc, created_at asc`,
      [finalDocumentId]
    );
    return result.rows.map(mapChunkRow);
  }

  async function replaceRequirements({
    analysisId = null,
    frameworkId = null,
    sourceDocumentId = null,
    requirements,
    regenerateIds = false
  }) {
    if (!analysisId && !frameworkId) throw new Error('analysisId or frameworkId required');
    const inputRequirements = Array.isArray(requirements) ? requirements : [];

    if (analysisId) {
      await query(
        `delete from policy_alignment_requirements
         where analysis_id = $1`,
        [analysisId]
      );
    } else {
      await query(
        `delete from policy_alignment_requirements
         where framework_id = $1`,
        [frameworkId]
      );
    }

    for (let index = 0; index < inputRequirements.length; index += 1) {
      const item = inputRequirements[index] || {};
      const requirementId = String((regenerateIds ? '' : item.id) || nextId()).trim();
      if (!requirementId) throw new Error('requirement id required');
      const title = trimText(item.title, 400);
      if (!title) continue;
      await query(
        `insert into policy_alignment_requirements (
           id, framework_id, analysis_id, source_document_id, requirement_key, theme, title, description,
           status, ordinal, evidence_json, raw_json
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb)`,
        [
          requirementId,
          frameworkId || null,
          analysisId || null,
          sourceDocumentId || null,
          toNullableText(item.requirementKey || item.key, 200),
          toNullableText(item.theme, 240),
          title,
          toNullableText(item.description, 4000),
          String(item.status || 'active').trim().toLowerCase() === 'archived' ? 'archived' : 'active',
          toIntegerOrNull(item.ordinal) ?? index,
          JSON.stringify(normalizeJsonArray(item.evidence)),
          JSON.stringify(normalizeJsonObject(item.raw))
        ]
      );
    }

    const result = await query(
      `select *
       from policy_alignment_requirements
       where ($1::uuid is not null and analysis_id = $1)
          or ($2::uuid is not null and framework_id = $2)
       order by ordinal asc, created_at asc`,
      [analysisId || null, frameworkId || null]
    );
    return result.rows.map(mapRequirementRow);
  }

  async function replaceSourceRefs({ analysisId, refs }) {
    const finalAnalysisId = String(analysisId || '').trim();
    if (!finalAnalysisId) throw new Error('analysisId required');
    const inputRefs = Array.isArray(refs) ? refs : [];

    await query(
      `delete from policy_alignment_source_refs
       where analysis_id = $1`,
      [finalAnalysisId]
    );

    for (const item of inputRefs) {
      const refId = String(item?.id || nextId()).trim();
      const title = trimText(item?.title, 400);
      if (!refId || !title) continue;
      await query(
        `insert into policy_alignment_source_refs (
           id, analysis_id, entity_kind, entity_id, title, description, source_document_id, source_chunk_id, meta_json
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
        [
          refId,
          finalAnalysisId,
          normalizeAlignmentEntityKind(item?.entityKind),
          item?.entityId || null,
          title,
          toNullableText(item?.description, 4000),
          item?.sourceDocumentId || null,
          item?.sourceChunkId || null,
          JSON.stringify(normalizeJsonObject(item?.meta))
        ]
      );
    }

    const result = await query(
      `select *
       from policy_alignment_source_refs
       where analysis_id = $1
       order by created_at asc`,
      [finalAnalysisId]
    );
    return result.rows.map(mapSourceRefRow);
  }

  async function replaceFindings({ analysisId, findings }) {
    const finalAnalysisId = String(analysisId || '').trim();
    if (!finalAnalysisId) throw new Error('analysisId required');
    const inputFindings = Array.isArray(findings) ? findings : [];

    await query(
      `delete from policy_alignment_findings
       where analysis_id = $1`,
      [finalAnalysisId]
    );

    for (const item of inputFindings) {
      const findingId = String(item?.id || nextId()).trim();
      const requirementTitle = trimText(item?.requirementTitle || item?.title, 400);
      if (!findingId || !requirementTitle) continue;
      await query(
        `insert into policy_alignment_findings (
           id, analysis_id, requirement_id, theme, requirement_title, requirement_description,
           coverage_status, confidence, explanation, overlap_summary, evidence_json,
           matched_source_refs_json, actionability
         )
         values (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11::jsonb,
           $12::jsonb, $13
         )`,
        [
          findingId,
          finalAnalysisId,
          item?.requirementId || null,
          toNullableText(item?.theme, 240),
          requirementTitle,
          toNullableText(item?.requirementDescription || item?.description, 4000),
          normalizeCoverageStatus(item?.coverageStatus || item?.status),
          clampConfidence(item?.confidence),
          toNullableText(item?.explanation, 6000),
          toNullableText(item?.overlapSummary, 4000),
          JSON.stringify(normalizeJsonArray(item?.evidence)),
          JSON.stringify(normalizeJsonArray(item?.matchedSourceRefs)),
          normalizeFindingAction(item?.actionability)
        ]
      );
    }

    const result = await query(
      `select *
       from policy_alignment_findings
       where analysis_id = $1
       order by created_at asc`,
      [finalAnalysisId]
    );
    return result.rows.map(mapFindingRow);
  }

  async function replaceSuggestions({ analysisId, suggestions }) {
    const finalAnalysisId = String(analysisId || '').trim();
    if (!finalAnalysisId) throw new Error('analysisId required');
    const inputSuggestions = Array.isArray(suggestions) ? suggestions : [];

    await query(
      `delete from policy_alignment_suggestions
       where analysis_id = $1`,
      [finalAnalysisId]
    );

    for (const item of inputSuggestions) {
      const suggestionId = String(item?.id || nextId()).trim();
      const title = trimText(item?.title, 400);
      if (!suggestionId || !title) continue;
      await query(
        `insert into policy_alignment_suggestions (
           id, analysis_id, finding_id, suggestion_kind, title, description, rationale,
           status, linked_guideline_id, linked_initiative_id, proposal_id, meta_json
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)`,
        [
          suggestionId,
          finalAnalysisId,
          item?.findingId || null,
          normalizeSuggestionKind(item?.suggestionKind || item?.kind),
          title,
          toNullableText(item?.description, 4000),
          toNullableText(item?.rationale, 6000),
          normalizeSuggestionStatus(item?.status),
          item?.linkedGuidelineId || null,
          item?.linkedInitiativeId || null,
          item?.proposalId || null,
          JSON.stringify(normalizeJsonObject(item?.meta))
        ]
      );
    }

    const result = await query(
      `select *
       from policy_alignment_suggestions
       where analysis_id = $1
       order by created_at asc`,
      [finalAnalysisId]
    );
    return result.rows.map(mapSuggestionRow);
  }

  async function listAnalysesForCycle(cycleId) {
    const result = await query(
      `select a.*,
              coalesce(doc_stats.document_count, 0)::int as document_count,
              coalesce(finding_stats.finding_count, 0)::int as finding_count,
              coalesce(suggestion_stats.suggestion_count, 0)::int as suggestion_count
       from policy_alignment_analyses a
       left join lateral (
         select count(*)::int as document_count
         from policy_alignment_documents d
         where d.analysis_id = a.id
       ) doc_stats on true
       left join lateral (
         select count(*)::int as finding_count
         from policy_alignment_findings f
         where f.analysis_id = a.id
       ) finding_stats on true
       left join lateral (
         select count(*)::int as suggestion_count
         from policy_alignment_suggestions s
         where s.analysis_id = a.id
       ) suggestion_stats on true
       where a.cycle_id = $1
       order by a.created_at desc`,
      [cycleId]
    );
    return result.rows.map(mapAnalysisRow);
  }

  async function getAnalysisById(analysisId) {
    const analysisRes = await query(
      `select a.*,
              coalesce(doc_stats.document_count, 0)::int as document_count,
              coalesce(finding_stats.finding_count, 0)::int as finding_count,
              coalesce(suggestion_stats.suggestion_count, 0)::int as suggestion_count
       from policy_alignment_analyses a
       left join lateral (
         select count(*)::int as document_count
         from policy_alignment_documents d
         where d.analysis_id = a.id
       ) doc_stats on true
       left join lateral (
         select count(*)::int as finding_count
         from policy_alignment_findings f
         where f.analysis_id = a.id
       ) finding_stats on true
       left join lateral (
         select count(*)::int as suggestion_count
         from policy_alignment_suggestions s
         where s.analysis_id = a.id
       ) suggestion_stats on true
       where a.id = $1
       limit 1`,
      [analysisId]
    );
    if (!analysisRes.rowCount) return null;

    const [documentsRes, chunksRes, requirementsRes, sourceRefsRes, findingsRes, suggestionsRes] = await Promise.all([
      query(
        `select *
         from policy_alignment_documents
         where analysis_id = $1
         order by created_at asc`,
        [analysisId]
      ),
      query(
        `select *
         from policy_alignment_chunks
         where analysis_id = $1
         order by document_id asc, ordinal asc, created_at asc`,
        [analysisId]
      ),
      query(
        `select *
         from policy_alignment_requirements
         where analysis_id = $1
         order by ordinal asc, created_at asc`,
        [analysisId]
      ),
      query(
        `select *
         from policy_alignment_source_refs
         where analysis_id = $1
         order by created_at asc`,
        [analysisId]
      ),
      query(
        `select *
         from policy_alignment_findings
         where analysis_id = $1
         order by created_at asc`,
        [analysisId]
      ),
      query(
        `select *
         from policy_alignment_suggestions
         where analysis_id = $1
         order by created_at asc`,
        [analysisId]
      )
    ]);

    return {
      ...mapAnalysisRow(analysisRes.rows[0]),
      documents: documentsRes.rows.map(mapDocumentRow),
      chunks: chunksRes.rows.map(mapChunkRow),
      requirements: requirementsRes.rows.map(mapRequirementRow),
      sourceRefs: sourceRefsRes.rows.map(mapSourceRefRow),
      findings: findingsRes.rows.map(mapFindingRow),
      suggestions: suggestionsRes.rows.map(mapSuggestionRow)
    };
  }

  return {
    ALIGNMENT_ANALYSIS_STATUSES,
    ALIGNMENT_COVERAGE_STATUSES,
    ALIGNMENT_ENTITY_KINDS,
    ALIGNMENT_SOURCE_MODES,
    ALIGNMENT_TARGET_MODES,
    ALIGNMENT_DOCUMENT_ROLES,
    ALIGNMENT_DOCUMENT_SOURCE_KINDS,
    ALIGNMENT_FINDING_ACTIONS,
    ALIGNMENT_SUGGESTION_KINDS,
    ALIGNMENT_SUGGESTION_STATUSES,
    normalizeAnalysisStatus,
    normalizeCoverageStatus,
    normalizeAlignmentEntityKind,
    normalizeSourceMode,
    normalizeTargetMode,
    normalizeDocumentRole,
    normalizeDocumentSourceKind,
    normalizeFindingAction,
    normalizeSuggestionKind,
    normalizeSuggestionStatus,
    createFramework,
    loadFrameworkById,
    listFrameworksForCycle,
    getFrameworkById,
    createAnalysis,
    setAnalysisStatus,
    updateAnalysisSummary,
    createDocument,
    loadDocumentById,
    replaceDocumentChunks,
    replaceRequirements,
    replaceSourceRefs,
    replaceFindings,
    replaceSuggestions,
    listAnalysesForCycle,
    getAnalysisById
  };
}

module.exports = {
  ALIGNMENT_ANALYSIS_STATUSES,
  ALIGNMENT_COVERAGE_STATUSES,
  ALIGNMENT_ENTITY_KINDS,
  ALIGNMENT_SOURCE_MODES,
  ALIGNMENT_TARGET_MODES,
  ALIGNMENT_DOCUMENT_ROLES,
  ALIGNMENT_DOCUMENT_SOURCE_KINDS,
  ALIGNMENT_FINDING_ACTIONS,
  ALIGNMENT_SUGGESTION_KINDS,
  ALIGNMENT_SUGGESTION_STATUSES,
  normalizeAnalysisStatus,
  normalizeCoverageStatus,
  normalizeAlignmentEntityKind,
  normalizeSourceMode,
  normalizeTargetMode,
  normalizeDocumentRole,
  normalizeDocumentSourceKind,
  normalizeFindingAction,
  normalizeSuggestionKind,
  normalizeSuggestionStatus,
  createPolicyAlignmentService
};
