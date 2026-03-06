const multer = require('multer');
const { pool } = require('./db');
const { sha256 } = require('./security');
const { extractPdfTexts } = require('./aiStrategyService');
const { createPolicyAlignmentService } = require('./services/policyAlignmentService');
const {
  createPolicyAlignmentPipelineService,
  normalizeLocaleHint
} = require('./services/policyAlignmentPipelineService');

function registerPolicyAlignmentRoutes({
  app,
  uuid,
  memberWriteRateLimit,
  requireAuth,
  verifyCycleAccess,
  loadGuidelineContext,
  loadInitiativeContext,
  createGuidelineProposal,
  createInitiativeProposal
}) {
  const memberWriteGuard = typeof memberWriteRateLimit === 'function'
    ? memberWriteRateLimit
    : (_req, _res, next) => next();

  const MAX_FILES = Math.min(8, Math.max(1, Number(process.env.POLICY_ALIGNMENT_MAX_FILES || process.env.AI_STRATEGY_MAX_FILES || 4)));
  const MAX_FILE_MB = Math.min(20, Math.max(1, Number(process.env.POLICY_ALIGNMENT_MAX_FILE_MB || process.env.AI_STRATEGY_MAX_FILE_MB || 8)));
  const MAX_COMBINED_TEXT_CHARS = Math.max(
    30000,
    Number(process.env.POLICY_ALIGNMENT_MAX_COMBINED_TEXT_CHARS || process.env.AI_STRATEGY_MAX_COMBINED_TEXT_CHARS || 120000)
  );

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      files: MAX_FILES,
      fileSize: MAX_FILE_MB * 1024 * 1024
    },
    fileFilter: (_req, file, done) => {
      const name = String(file?.originalname || '').toLowerCase();
      const mime = String(file?.mimetype || '').toLowerCase();
      const isPdf = name.endsWith('.pdf') || mime.includes('pdf');
      if (!isPdf) {
        return done(new Error('only pdf files allowed'));
      }
      return done(null, true);
    }
  });

  function uploadMiddleware(req, res, next) {
    upload.array('documents', MAX_FILES)(req, res, (error) => {
      if (!error) return next();
      if (error?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'pdf file too large' });
      }
      if (error?.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'too many pdf files' });
      }
      return res.status(400).json({ error: error?.message || 'documents upload failed' });
    });
  }

  function createScopedService(queryFn) {
    return createPolicyAlignmentService({ query: queryFn, uuid });
  }

  function createScopedPipeline(queryFn) {
    return createPolicyAlignmentPipelineService({ query: queryFn, uuid });
  }

  async function withTransaction(task) {
    const client = await pool.connect();
    try {
      await client.query('begin');
      const queryFn = (text, params) => client.query(text, params);
      const result = await task({
        client,
        query: queryFn,
        alignmentService: createScopedService(queryFn),
        pipelineService: createScopedPipeline(queryFn)
      });
      await client.query('commit');
      return result;
    } catch (error) {
      try {
        await client.query('rollback');
      } catch {
        // ignore rollback errors
      }
      throw error;
    } finally {
      client.release();
    }
  }

  function normalizeBoolean(value) {
    return String(value || '').trim().toLowerCase() === 'true';
  }

  function mapErrorStatus(error) {
    const message = String(error?.message || '').trim() || 'internal server error';
    if ([
      'cycleId required',
      'analysisId required',
      'analysis title required',
      'institutionId required',
      'frameworkId required',
      'filename required',
      'documents upload failed',
      'only pdf files allowed',
      'pdf parsing failed',
      'pdf content too large',
      'pdf file too large',
      'too many pdf files',
      'role required',
      'invalid role',
      'suggestion not found',
      'finding not found',
      'entityKind and entityId required',
      'unsupported entity kind',
      'guideline not found',
      'initiative not found',
      'analysis target framework required',
      'target documents required',
      'source material required',
      'target requirements missing',
      'cannot upload target documents when target framework is selected',
      'initiative suggestion requires linked guidelines'
    ].includes(message)) {
      return 400;
    }
    if ([
      'cycle not found',
      'analysis not found'
    ].includes(message)) {
      return 404;
    }
    if ([
      'cross-institution forbidden',
      'analysis access forbidden'
    ].includes(message)) {
      return 403;
    }
    if ([
      'suggestion already processed'
    ].includes(message)) {
      return 409;
    }
    if (message === 'ai api key not configured') {
      return 503;
    }
    if (message.startsWith('ai provider error:')) {
      return 502;
    }
    if (message === 'ai response invalid') {
      return 422;
    }
    return 500;
  }

  async function loadAccessibleAnalysis(analysisId, auth) {
    const alignmentService = createScopedService((text, params) => pool.query(text, params));
    const analysis = await alignmentService.getAnalysisById(analysisId);
    if (!analysis) {
      throw new Error('analysis not found');
    }
    if (analysis.institutionId !== auth.institutionId) {
      throw new Error('analysis access forbidden');
    }
    if (analysis.cycleId) {
      const cycleAccess = await verifyCycleAccess(analysis.cycleId, auth.institutionId);
      if (!cycleAccess.ok) {
        throw new Error(cycleAccess.error || 'analysis access forbidden');
      }
    }
    return analysis;
  }

  function buildDefaultAnalysisTitle(cycleId) {
    const stamp = new Date().toISOString().slice(0, 10);
    return `Policy alignment ${stamp} (${String(cycleId || '').slice(0, 8)})`;
  }

  async function upsertFindingSourceLink({ query, analysisId, finding, sourceRef }) {
    const existing = Array.isArray(finding.matchedSourceRefs) ? finding.matchedSourceRefs : [];
    const next = existing.some((item) => String(item?.sourceRefId || '').trim() === sourceRef.id)
      ? existing
      : [
        ...existing,
        {
          sourceRefId: sourceRef.id,
          entityKind: sourceRef.entityKind,
          entityId: sourceRef.entityId || null,
          title: sourceRef.title
        }
      ];

    const result = await query(
      `update policy_alignment_findings
       set matched_source_refs_json = $3::jsonb,
           updated_at = now()
       where id = $1
         and analysis_id = $2
       returning *`,
      [finding.id, analysisId, JSON.stringify(next)]
    );
    return result.rows[0] || null;
  }

  app.get('/api/v1/cycles/:cycleId/policy-alignments', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    const alignmentService = createScopedService((text, params) => pool.query(text, params));
    const analyses = await alignmentService.listAnalysesForCycle(cycleId);
    res.json({ cycleId, analyses });
  });

  app.get('/api/v1/cycles/:cycleId/policy-alignment-frameworks', requireAuth, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    try {
      const alignmentService = createScopedService((text, params) => pool.query(text, params));
      const frameworks = await alignmentService.listFrameworksForCycle(cycleId, req.auth.institutionId);
      res.json({ cycleId, frameworks });
    } catch (error) {
      res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });

  app.get('/api/v1/policy-alignment-frameworks/:frameworkId', requireAuth, async (req, res) => {
    const frameworkId = String(req.params.frameworkId || '').trim();
    if (!frameworkId) return res.status(400).json({ error: 'frameworkId required' });

    try {
      const alignmentService = createScopedService((text, params) => pool.query(text, params));
      const framework = await alignmentService.getFrameworkById(frameworkId);
      if (!framework) {
        return res.status(404).json({ error: 'framework not found' });
      }
      if (String(framework.institutionId || '').trim() !== String(req.auth.institutionId || '').trim()) {
        return res.status(403).json({ error: 'analysis access forbidden' });
      }
      if (framework.cycleId) {
        const cycleAccess = await verifyCycleAccess(framework.cycleId, req.auth.institutionId);
        if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });
      }
      res.json({ ok: true, framework });
    } catch (error) {
      res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });

  app.post('/api/v1/cycles/:cycleId/policy-alignments', requireAuth, memberWriteGuard, async (req, res) => {
    const cycleId = String(req.params.cycleId || '').trim();
    if (!cycleId) return res.status(400).json({ error: 'cycleId required' });

    const cycleAccess = await verifyCycleAccess(cycleId, req.auth.institutionId);
    if (!cycleAccess.ok) return res.status(cycleAccess.status).json({ error: cycleAccess.error });

    const title = String(req.body?.title || '').trim() || buildDefaultAnalysisTitle(cycleId);
    const description = String(req.body?.description || '').trim();
    const sourceMode = String(req.body?.sourceMode || 'mixed').trim();
    const targetMode = String(req.body?.targetMode || 'uploaded_document').trim();
    const targetFrameworkId = String(req.body?.targetFrameworkId || '').trim() || null;

    if (targetMode === 'framework' && !targetFrameworkId) {
      return res.status(400).json({ error: 'analysis target framework required' });
    }

    try {
      const analysis = await withTransaction(async ({ alignmentService }) => {
        return alignmentService.createAnalysis({
          institutionId: req.auth.institutionId,
          strategyId: cycleAccess.cycle.strategy_id || null,
          cycleId,
          targetFrameworkId,
          title,
          description,
          sourceMode,
          targetMode,
          sourceSummary: {},
          targetSummary: targetFrameworkId ? { targetFrameworkId } : {},
          summary: {},
          createdBy: req.auth.sub,
          status: 'draft'
        });
      });

      res.status(201).json({ ok: true, analysis });
    } catch (error) {
      res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });

  app.post('/api/v1/policy-alignments/:analysisId/documents', requireAuth, memberWriteGuard, uploadMiddleware, async (req, res) => {
    const analysisId = String(req.params.analysisId || '').trim();
    const role = String(req.body?.role || '').trim().toLowerCase();
    const replaceExisting = normalizeBoolean(req.body?.replaceExisting);
    if (!analysisId) return res.status(400).json({ error: 'analysisId required' });
    if (!role) return res.status(400).json({ error: 'role required' });
    if (!['source', 'target'].includes(role)) return res.status(400).json({ error: 'invalid role' });

    try {
      const analysis = await loadAccessibleAnalysis(analysisId, req.auth);
      if (role === 'target' && analysis.targetMode === 'framework' && analysis.targetFrameworkId) {
        return res.status(400).json({ error: 'cannot upload target documents when target framework is selected' });
      }

      const files = Array.isArray(req.files) ? req.files : [];
      if (!files.length) {
        return res.status(400).json({ error: 'documents upload failed' });
      }

      const docs = await extractPdfTexts(files, { maxCombinedChars: MAX_COMBINED_TEXT_CHARS });
      const saved = await withTransaction(async ({ query, alignmentService, pipelineService }) => {
        if (replaceExisting) {
          await query(
            `delete from policy_alignment_documents
             where analysis_id = $1
               and role = $2`,
            [analysisId, role]
          );
        }

        const created = [];
        for (let index = 0; index < docs.length; index += 1) {
          const file = files[index] || {};
          const extracted = docs[index] || {};
          const createdDocument = await alignmentService.createDocument({
            analysisId,
            role,
            sourceKind: 'uploaded_pdf',
            filename: extracted.filename,
            mimeType: String(file?.mimetype || 'application/pdf').trim() || 'application/pdf',
            fileBytes: extracted.bytes || Number(file?.size || 0),
            pageCount: null,
            sha256Hash: sha256(file?.buffer || extracted.text || extracted.filename),
            extractedText: extracted.text,
            extractionStatus: 'completed',
            extractionError: null,
            meta: {
              chars: extracted.chars || String(extracted.text || '').length,
              uploadedBy: req.auth.sub
            },
            createdBy: req.auth.sub
          });

          const chunks = pipelineService.buildDocumentChunks([createdDocument]);
          await alignmentService.replaceDocumentChunks({
            analysisId,
            documentId: createdDocument.id,
            chunks
          });
          created.push(createdDocument);
        }
        return created;
      });

      res.status(201).json({ ok: true, documents: saved });
    } catch (error) {
      res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });

  app.get('/api/v1/policy-alignments/:analysisId', requireAuth, async (req, res) => {
    const analysisId = String(req.params.analysisId || '').trim();
    if (!analysisId) return res.status(400).json({ error: 'analysisId required' });

    try {
      const analysis = await loadAccessibleAnalysis(analysisId, req.auth);
      res.json({ ok: true, analysis });
    } catch (error) {
      res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });

  app.post('/api/v1/policy-alignments/:analysisId/run', requireAuth, memberWriteGuard, async (req, res) => {
    const analysisId = String(req.params.analysisId || '').trim();
    if (!analysisId) return res.status(400).json({ error: 'analysisId required' });

    try {
      const accessibleAnalysis = await loadAccessibleAnalysis(analysisId, req.auth);
      const localeHint = normalizeLocaleHint(req.body?.localeHint || 'en');
      const saveTargetAsFramework = normalizeBoolean(req.body?.saveTargetAsFramework);
      if (saveTargetAsFramework && req.auth.role !== 'institution_admin') {
        return res.status(403).json({ error: 'admin role required' });
      }

      await withTransaction(async ({ alignmentService }) => {
        await alignmentService.setAnalysisStatus({ analysisId, status: 'processing', errorMessage: null });
      });

      const analysis = await withTransaction(async ({ query, alignmentService, pipelineService }) => {
        const currentAnalysis = await alignmentService.getAnalysisById(analysisId);
        if (!currentAnalysis) throw new Error('analysis not found');

        const sourceDocuments = (currentAnalysis.documents || []).filter((item) => item.role === 'source');
        const targetDocuments = (currentAnalysis.documents || []).filter((item) => item.role === 'target');

        let rawRequirements = [];
        let targetModel = null;
        let targetFrameworkId = currentAnalysis.targetFrameworkId || null;

        if (currentAnalysis.targetMode === 'framework' && targetFrameworkId) {
          rawRequirements = await pipelineService.loadFrameworkRequirements(targetFrameworkId);
        } else {
          if (!targetDocuments.length) throw new Error('target documents required');
          const targetExtraction = await pipelineService.extractRequirementsFromTargetDocuments({
            documents: targetDocuments,
            localeHint
          });
          rawRequirements = targetExtraction.requirements;
          targetModel = targetExtraction.model;
        }

        if (!rawRequirements.length) {
          throw new Error('target requirements missing');
        }

        const sourceBundle = await pipelineService.buildSourceReferences({
          cycleId: currentAnalysis.cycleId,
          sourceDocuments,
          includeCycleEntities: currentAnalysis.sourceMode !== 'uploaded_document'
        });
        if (!sourceBundle.refs.length) {
          throw new Error('source material required');
        }

        const comparison = await pipelineService.compareRequirementsToSource({
          requirements: rawRequirements,
          sourceRefs: sourceBundle.refs,
          localeHint
        });

        await alignmentService.replaceSourceRefs({
          analysisId,
          refs: comparison.sourceRefs
        });

        await alignmentService.replaceRequirements({
          analysisId,
          requirements: comparison.requirements
        });

        await alignmentService.replaceFindings({
          analysisId,
          findings: comparison.findings
        });

        await alignmentService.replaceSuggestions({
          analysisId,
          suggestions: comparison.suggestions
        });

        if (!targetFrameworkId && saveTargetAsFramework) {
          const framework = await alignmentService.createFramework({
            institutionId: currentAnalysis.institutionId,
            strategyId: currentAnalysis.strategyId,
            cycleId: currentAnalysis.cycleId,
            title: currentAnalysis.title,
            description: currentAnalysis.description || 'Saved from policy alignment analysis',
            slug: null,
            sourceHash: sha256(targetDocuments.map((item) => item.sha256Hash || item.filename).join('|')),
            meta: {
              createdFromAnalysisId: currentAnalysis.id,
              localeHint,
              model: targetModel || comparison.model || null
            },
            createdBy: req.auth.sub
          });
          targetFrameworkId = framework.id;
          await alignmentService.replaceRequirements({
            frameworkId: framework.id,
            requirements: comparison.requirements
          });
          await query(
            `update policy_alignment_analyses
             set target_framework_id = $2,
                 target_mode = 'framework',
                 updated_at = now()
             where id = $1`,
            [analysisId, framework.id]
          );
        }

        await alignmentService.updateAnalysisSummary({
          analysisId,
          sourceSummary: {
            sourceMode: currentAnalysis.sourceMode,
            sourceDocumentCount: sourceDocuments.length,
            generatedSourceRefCount: comparison.sourceRefs.length
          },
          targetSummary: {
            targetMode: targetFrameworkId ? 'framework' : currentAnalysis.targetMode,
            targetDocumentCount: targetDocuments.length,
            requirementCount: comparison.requirements.length,
            targetFrameworkId: targetFrameworkId || null,
            targetModel: targetModel || null
          },
          summary: {
            ...comparison.summary,
            sourceRefCount: comparison.sourceRefs.length,
            suggestionCount: comparison.suggestions.length,
            comparisonModel: comparison.model || null,
            localeHint
          },
          errorMessage: null
        });

        await alignmentService.setAnalysisStatus({ analysisId, status: 'completed', errorMessage: null });
        return alignmentService.getAnalysisById(analysisId);
      });

      res.json({ ok: true, analysis });
    } catch (error) {
      try {
        await withTransaction(async ({ alignmentService }) => {
          await alignmentService.setAnalysisStatus({
            analysisId,
            status: 'failed',
            errorMessage: String(error?.message || 'internal server error')
          });
        });
      } catch {
        // ignore error state persistence failures
      }
      res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });

  app.post('/api/v1/policy-alignments/:analysisId/suggestions/:suggestionId/create-proposal', requireAuth, memberWriteGuard, async (req, res) => {
    const analysisId = String(req.params.analysisId || '').trim();
    const suggestionId = String(req.params.suggestionId || '').trim();
    if (!analysisId) return res.status(400).json({ error: 'analysisId required' });
    if (!suggestionId) return res.status(400).json({ error: 'suggestion not found' });

    try {
      const analysis = await loadAccessibleAnalysis(analysisId, req.auth);
      const suggestion = (analysis.suggestions || []).find((item) => item.id === suggestionId);
      if (!suggestion) throw new Error('suggestion not found');
      if (suggestion.status !== 'draft') throw new Error('suggestion already processed');

      const linkedFinding = (analysis.findings || []).find((item) => item.id === suggestion.findingId) || null;
      let proposalId = '';

      if (suggestion.suggestionKind === 'guideline') {
        proposalId = await createGuidelineProposal({
          institutionId: analysis.institutionId,
          cycleId: analysis.cycleId,
          strategyId: analysis.strategyId,
          title: suggestion.title,
          description: suggestion.description || suggestion.rationale || '',
          relationType: String(suggestion.meta?.relationType || 'orphan').trim().toLowerCase() || 'orphan',
          parentGuidelineId: suggestion.meta?.parentGuidelineId || null,
          createdBy: req.auth.sub,
          uuid
        });
      } else {
        const guidelineIds = [...new Set(
          (Array.isArray(suggestion.meta?.guidelineIds) ? suggestion.meta.guidelineIds : [])
            .concat(
              Array.isArray(linkedFinding?.matchedSourceRefs)
                ? linkedFinding.matchedSourceRefs
                  .filter((item) => item?.entityKind === 'guideline' && item?.entityId)
                  .map((item) => item.entityId)
                : []
            )
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        )];

        if (!guidelineIds.length) {
          throw new Error('initiative suggestion requires linked guidelines');
        }

        proposalId = await createInitiativeProposal({
          institutionId: analysis.institutionId,
          cycleId: analysis.cycleId,
          strategyId: analysis.strategyId,
          title: suggestion.title,
          description: suggestion.description || suggestion.rationale || '',
          lineSide: 'auto',
          guidelineIds,
          createdBy: req.auth.sub,
          uuid
        });
      }

      await pool.query(
        `update policy_alignment_suggestions
         set proposal_id = $3,
             status = 'converted',
             updated_at = now()
         where id = $1
           and analysis_id = $2`,
        [suggestionId, analysisId, proposalId]
      );

      res.status(201).json({ ok: true, proposalId, suggestionId, analysisId });
    } catch (error) {
      res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });

  app.post('/api/v1/policy-alignments/:analysisId/findings/:findingId/link-source', requireAuth, memberWriteGuard, async (req, res) => {
    const analysisId = String(req.params.analysisId || '').trim();
    const findingId = String(req.params.findingId || '').trim();
    const entityKind = String(req.body?.entityKind || '').trim().toLowerCase();
    const entityId = String(req.body?.entityId || '').trim();
    if (!analysisId) return res.status(400).json({ error: 'analysisId required' });
    if (!entityKind || !entityId) return res.status(400).json({ error: 'entityKind and entityId required' });
    if (!['guideline', 'initiative'].includes(entityKind)) {
      return res.status(400).json({ error: 'unsupported entity kind' });
    }

    try {
      const analysis = await loadAccessibleAnalysis(analysisId, req.auth);
      const finding = (analysis.findings || []).find((item) => item.id === findingId);
      if (!finding) throw new Error('finding not found');

      let context = null;
      if (entityKind === 'guideline') {
        context = await loadGuidelineContext(entityId);
        if (!context) throw new Error('guideline not found');
      } else {
        context = await loadInitiativeContext(entityId);
        if (!context) throw new Error('initiative not found');
      }
      if (context.institution_id !== req.auth.institutionId) throw new Error('cross-institution forbidden');
      if (String(context.cycle_id || '').trim() !== String(analysis.cycleId || '').trim()) {
        throw new Error('cross-institution forbidden');
      }

      const title = entityKind === 'guideline'
        ? String(context.title || entityId).trim()
        : String(context.title || entityId).trim();
      const description = String(context.description || '').trim() || null;

      const result = await withTransaction(async ({ query }) => {
        let sourceRefRes = await query(
          `select *
           from policy_alignment_source_refs
           where analysis_id = $1
             and entity_kind = $2
             and entity_id = $3
           limit 1`,
          [analysisId, entityKind, entityId]
        );

        let sourceRef = sourceRefRes.rows[0] || null;
        if (!sourceRef) {
          const sourceRefId = uuid();
          sourceRefRes = await query(
            `insert into policy_alignment_source_refs (
               id, analysis_id, entity_kind, entity_id, title, description, meta_json
             )
             values ($1, $2, $3, $4, $5, $6, $7::jsonb)
             returning *`,
            [
              sourceRefId,
              analysisId,
              entityKind,
              entityId,
              title,
              description,
              JSON.stringify({ linkedManually: true })
            ]
          );
          sourceRef = sourceRefRes.rows[0] || null;
        }

        const updatedFinding = await upsertFindingSourceLink({
          query,
          analysisId,
          finding,
          sourceRef: {
            id: sourceRef.id,
            entityKind: sourceRef.entity_kind,
            entityId: sourceRef.entity_id,
            title: sourceRef.title
          }
        });

        return updatedFinding;
      });

      res.json({ ok: true, finding: result });
    } catch (error) {
      res.status(mapErrorStatus(error)).json({ error: String(error?.message || 'internal server error') });
    }
  });
}

module.exports = { registerPolicyAlignmentRoutes };
