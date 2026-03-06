# Policy Alignment Implementation Plan

Date: 2026-03-06

## Phase 1 discovery summary

### Current architecture

- Frontend: static HTML + vanilla JavaScript under `prototype/`
- App routing: query/path-driven view state in `prototype/app.js`
- Backend: Express + CommonJS route modules in `backend/src/*Routes.js`
- Data access: hand-written SQL via `pg`; no ORM
- Reusable business logic: service factories in `backend/src/services/`
- Auth model:
  - public routes in `publicRoutes.js`
  - signed-in member routes in `memberRoutes.js`
  - institution admin routes in `adminRoutes.js`
  - global meta-admin routes in `metaAdminRoutes.js`
- Document AI ingestion already exists in:
  - `backend/src/aiStrategyService.js`
  - `adminRoutes.js`
  - `metaAdminRoutes.js`
- Current document parsing capability:
  - PDF upload via `multer`
  - text extraction via `pdf-parse`
  - structured AI output via OpenAI Responses-style calls
- Existing strategy domain model already supports:
  - institutions
  - institution strategies
  - cycles
  - guidelines
  - initiatives
  - comments
  - votes
  - proposal moderation
  - map positions and cross-strategy guideline links

### Constraints inferred from the codebase

- No background job runner or queue is present.
- No embeddings store or vector search infrastructure is present.
- Existing patterns favor:
  - thin route modules
  - explicit validation in routes
  - service-layer helpers
  - small focused SQL tables
  - incremental features over broad abstractions

## Recommended smallest viable implementation path

### Phase 2 data model

Use a compact relational model instead of an over-normalized graph.

Recommended initial tables:

- `policy_alignment_analyses`
  - one record per comparison run
  - stores source mode, target mode, status, summary counts, errors, created by
- `policy_alignment_documents`
  - uploaded source or target documents
  - stores role, filename, mime, extracted text, parse metadata
- `policy_alignment_chunks`
  - normalized chunks/sections for explainability
  - stores heading/section label, ordinal, page hint, text excerpt
- `policy_alignment_framework_requirements`
  - extracted target requirements/themes/objectives
  - reusable when a target document is saved as framework
- `policy_alignment_findings`
  - final row-oriented comparison output
  - status: covered / partial / weak / missing / contradicted / unclear
  - confidence, explanation, matched entities, evidence refs
- `policy_alignment_suggestions`
  - draft recommendations generated from missing or weak findings
  - can later become guideline/initiative proposals

Defer dedicated join tables until they are needed by actual queries.
For MVP, evidence and matched refs can be stored as `jsonb`.

### Phase 3 backend

Add a dedicated route module:

- `backend/src/policyAlignmentRoutes.js`

Register it from `backend/src/v1.js` with the same helper dependencies already used by member/admin routes.

Preferred route scope for MVP:

- institution member can list/read analyses for accessible cycle
- institution admin can create analyses and convert suggestions into proposals

Recommended initial endpoints:

- `GET /api/v1/cycles/:cycleId/policy-alignments`
- `POST /api/v1/cycles/:cycleId/policy-alignments`
- `GET /api/v1/policy-alignments/:analysisId`
- `POST /api/v1/policy-alignments/:analysisId/run`
- `POST /api/v1/policy-alignments/:analysisId/suggestions/:suggestionId/create-proposal`

For uploaded files, reuse:

- `multer.memoryStorage()`
- `extractPdfTexts()` patterns from `aiStrategyService.js`

### Phase 4 analysis pipeline

MVP pipeline should be synchronous in-process, but persisted with status fields so async execution can be added later without schema changes.

Recommended flow:

1. ingest uploaded PDFs or existing strategy entities
2. normalize extracted text into section/chunk records
3. decompose target into requirements/themes
4. decompose source into claims from:
   - uploaded source document chunks
   - existing guidelines
   - existing initiatives
5. run AI-assisted structured matching
6. apply deterministic post-processing for status normalization and evidence validation
7. persist row-level findings and summary counters
8. generate draft suggestions for missing/weak findings

Because embeddings do not exist today, keep semantic matching behind a service interface so a future embedding-backed matcher can replace or augment prompt-based matching.

### Phase 5 UI

Do not build a separate frontend stack.
Extend `prototype/app.js` with a new sidebar view after backend and schema exist.

Recommended first UI slice:

- Policy Alignment list
- New analysis form
- Results table with filters
- Suggestion actions

Reuse existing:

- sidebar/step navigation
- table styling from history view
- card shells from guideline/initiative/admin views

### Phase 6 integration with existing strategy entities

Do not create guidelines or initiatives directly from Policy Alignment findings.
Instead, create draft proposals through the same proposal-style workflow used elsewhere, so moderation/audit behavior stays consistent.

### Phase 7 framework reuse

Add optional target framework persistence after the first analysis path works.
Framework extraction should populate reusable requirement records so the same policy document is not decomposed repeatedly.

## Assumptions

- Source comparisons should be cycle-scoped because existing strategy content is cycle-scoped.
- PDF is the only required upload format for MVP because that is the only document parser already present.
- Explainability is more important than perfect semantic recall in the first version.
- Async execution is desirable later, but not required for a safe MVP.

## Phase 1 implementation note

To keep this incremental, the first code addition for Policy Alignment should be:

- a service scaffold with normalized statuses and entity kinds
- no public UI exposure until the backing schema and API exist

This avoids shipping a dead-end navigation path before the core workflow is usable.
