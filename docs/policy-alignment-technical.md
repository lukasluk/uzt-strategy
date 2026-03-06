# Policy Alignment Technical Note

## Purpose

Policy Alignment compares:

1. source strategy material
2. target policy/framework material

and produces explainable findings that show:

- covered areas
- partial coverage
- weak mentions
- missing areas
- contradicted areas
- overlap evidence

The module is integrated into the existing Digistrategy environment so findings can point back to guidelines, initiatives, and the strategy map, while missing areas can be converted into moderated proposals.

## Architecture

### Backend

Main files:

- [policyAlignmentRoutes.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/src/policyAlignmentRoutes.js)
- [policyAlignmentService.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/src/services/policyAlignmentService.js)
- [policyAlignmentPipelineService.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/src/services/policyAlignmentPipelineService.js)
- [policyAlignmentAiService.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/src/services/policyAlignmentAiService.js)
- [policyAlignmentAnalysisHelpers.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/src/services/policyAlignmentAnalysisHelpers.js)

Pattern used:

- raw SQL service layer, matching existing backend style
- Express route module wired from [v1.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/src/v1.js)
- synchronous request-time execution for MVP
- AI calls isolated behind a dedicated service

### Frontend

Main files:

- [app.js](C:/Users/lukos/Documents/UŽT%20strategija/prototype/app.js)
- [policy-alignment.js](C:/Users/lukos/Documents/UŽT%20strategija/prototype/policy-alignment.js)
- [styles.css](C:/Users/lukos/Documents/UŽT%20strategija/prototype/styles.css)

Pattern used:

- existing single-page vanilla JS shell
- existing sidebar and render switch extended with a new view
- results rendered as evidence-first tables and cards using current styling primitives

## Data Model

Tables introduced:

- `policy_alignment_frameworks`
- `policy_alignment_analyses`
- `policy_alignment_documents`
- `policy_alignment_chunks`
- `policy_alignment_requirements`
- `policy_alignment_source_refs`
- `policy_alignment_findings`
- `policy_alignment_suggestions`

### Practical model summary

- `frameworks`: reusable target policy frameworks
- `analyses`: user-created alignment runs for a cycle
- `documents`: uploaded source/target PDFs
- `chunks`: normalized extracted sections used for decomposition
- `requirements`: extracted target requirements/objectives/themes
- `source_refs`: source strategy entities and document-derived claims used for matching
- `findings`: final explainable assessment per target requirement
- `suggestions`: draft guideline/initiative suggestions derived from findings

### Explainability fields

Explainability is preserved through:

- evidence JSON
- matched source refs
- per-finding explanation
- overlap summary
- confidence score

## Analysis Flow

Current flow:

1. Create analysis
2. Upload source PDFs and/or rely on existing cycle entities
3. Upload target PDFs or choose a saved framework
4. Extract target requirements
5. Build source references from:
   - cycle
   - guidelines
   - initiatives
   - document chunks
   - document claim snippets
6. Rank candidates deterministically
7. Ask AI to classify coverage within narrowed candidate sets
8. Refine findings with deterministic post-processing
9. Generate draft suggestions
10. Convert suggestions into existing moderated proposal workflow when needed

## Coverage Categories

Supported statuses:

- `covered`
- `partial`
- `weak`
- `missing`
- `contradicted`
- `unclear`

## Extension Points

### Embeddings / vector search

There is no embeddings layer yet.

The current extension point is the boundary between:

- deterministic candidate ranking in [policyAlignmentAnalysisHelpers.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/src/services/policyAlignmentAnalysisHelpers.js)
- AI comparison in [policyAlignmentPipelineService.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/src/services/policyAlignmentPipelineService.js)

A future implementation can replace or augment candidate selection with:

- embeddings
- vector similarity search
- hybrid lexical + vector retrieval

without changing the stored finding format.

### AI provider

AI config resolution:

- `POLICY_ALIGNMENT_*`
- fallback to `AI_STRATEGY_*`
- fallback to `OPENAI_*`

This keeps Policy Alignment aligned with the current OpenAI-backed setup.

## API Summary

Main endpoints:

- `GET /api/v1/cycles/:cycleId/policy-alignments`
- `POST /api/v1/cycles/:cycleId/policy-alignments`
- `POST /api/v1/policy-alignments/:analysisId/documents`
- `GET /api/v1/policy-alignments/:analysisId`
- `POST /api/v1/policy-alignments/:analysisId/run`
- `POST /api/v1/policy-alignments/:analysisId/findings/:findingId/link-source`
- `POST /api/v1/policy-alignments/:analysisId/suggestions/:suggestionId/create-proposal`
- `GET /api/v1/cycles/:cycleId/policy-alignment-frameworks`
- `GET /api/v1/policy-alignment-frameworks/:frameworkId`

## Frontend Integration Summary

The Policy Alignment view supports:

- analysis list
- framework library list
- create-analysis modal
- coverage table
- gap analysis
- overlap/mapping view
- suggestion conversion
- navigation to guideline/initiative detail
- navigation to strategy map
- manual finding-to-card linking

## Tests Added

Current tests:

- deterministic helper unit tests
- route-level API tests with mocked services

Files:

- [policyAlignmentAnalysisHelpers.test.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/tests/policyAlignmentAnalysisHelpers.test.js)
- [policyAlignmentRoutes.test.js](C:/Users/lukos/Documents/UŽT%20strategija/backend/tests/policyAlignmentRoutes.test.js)

Run with:

```bash
cd backend
npm test
```

## Known Limitations

- analysis execution is synchronous and can be slow on large PDFs
- no background jobs yet
- no embeddings/vector retrieval yet
- framework UI currently exposes library selection, but not a dedicated framework detail screen
- browser interaction tests were not added in this phase
- route tests use mocks, not a live Postgres-backed integration environment

## Recommended Next Improvements

1. add async job execution with progress polling
2. add framework detail screen and requirement preview
3. add vector retrieval for larger policy libraries
4. add database-backed integration tests
