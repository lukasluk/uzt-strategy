const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeAnalysis } = require('../src/services/clarityGremlinService');

test('normalizeAnalysis keeps all valid proposal drafts instead of truncating at nine', () => {
  const proposalDrafts = Array.from({ length: 12 }, (_value, index) => ({
    entityKind: 'initiative',
    draftMode: 'create',
    title: `Draft ${index + 1}`,
    description: `Description ${index + 1}`,
    rationale: `Rationale ${index + 1}`,
    guidelineTitles: ['Guideline A']
  }));

  const analysis = normalizeAnalysis({
    responseLanguage: 'lt',
    pageLabel: 'Test',
    score: 6,
    summary: 'Summary',
    strengths: [],
    improvements: [{ issue: 'Issue', recommendation: 'Recommendation' }],
    nextActions: ['Action'],
    dataGaps: [],
    proposalDrafts
  });

  assert.equal(analysis.proposalDrafts.length, 12);
  assert.equal(analysis.proposalDrafts[0].title, 'Draft 1');
  assert.equal(analysis.proposalDrafts[11].title, 'Draft 12');
});
