const test = require('node:test');
const assert = require('node:assert/strict');

function mockModule(modulePath, exportsValue) {
  const resolved = require.resolve(modulePath);
  const previous = require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportsValue
  };
  return () => {
    if (previous) require.cache[resolved] = previous;
    else delete require.cache[resolved];
  };
}

test('compareRequirementsToSource regenerates requirement ids for analysis rows', async () => {
  const teardown = [];
  teardown.push(mockModule('../src/services/policyAlignmentAiService', {
    getPolicyAlignmentAiConfig: () => ({ model: 'test-model' }),
    requestPolicyAlignmentJson: async () => ({
      model: 'test-model',
      parsed: {
        findings: [{
          requirementId: 'generated-1',
          coverageStatus: 'covered',
          confidence: 0.91,
          explanation: 'Covered by the linked guideline.',
          overlapSummary: 'Strong overlap.',
          matchedSourceRefIds: ['source-1'],
          evidence: [{ sourceRefId: 'source-1', quote: 'Digital skills programme' }],
          actionability: 'none'
        }]
      }
    })
  }));

  const modulePath = require.resolve('../src/services/policyAlignmentPipelineService');
  delete require.cache[modulePath];
  const { createPolicyAlignmentPipelineService } = require('../src/services/policyAlignmentPipelineService');

  try {
    let counter = 0;
    const service = createPolicyAlignmentPipelineService({
      query: async () => ({ rows: [], rowCount: 0 }),
      uuid: () => {
        counter += 1;
        return `generated-${counter}`;
      }
    });

    const result = await service.compareRequirementsToSource({
      requirements: [{
        id: 'framework-req-1',
        requirementKey: 'skills-1',
        theme: 'Skills',
        title: 'Increase digital skills',
        description: 'Raise digital capacity across the institution.'
      }],
      sourceRefs: [{
        id: 'source-1',
        entityKind: 'guideline',
        entityId: 'guideline-1',
        title: 'Digital skills programme',
        description: 'Upskill staff and citizens in digital competencies.'
      }],
      localeHint: 'en'
    });

    assert.equal(result.requirements.length, 1);
    assert.equal(result.requirements[0].id, 'generated-1');
    assert.notEqual(result.requirements[0].id, 'framework-req-1');
    assert.equal(result.findings[0].requirementId, 'generated-1');
  } finally {
    delete require.cache[modulePath];
    teardown.reverse().forEach((restore) => restore());
  }
});

test('compareRequirementsToSource deduplicates comparable requirements before analysis', async () => {
  const teardown = [];
  teardown.push(mockModule('../src/services/policyAlignmentAiService', {
    getPolicyAlignmentAiConfig: () => ({ model: 'test-model' }),
    requestPolicyAlignmentJson: async () => ({
      model: 'test-model',
      parsed: {
        findings: [{
          requirementId: 'generated-1',
          coverageStatus: 'missing',
          confidence: 0.22,
          explanation: 'No sufficient coverage found.',
          overlapSummary: '',
          matchedSourceRefIds: [],
          evidence: [],
          actionability: 'suggest_guideline'
        }]
      }
    })
  }));

  const modulePath = require.resolve('../src/services/policyAlignmentPipelineService');
  delete require.cache[modulePath];
  const { createPolicyAlignmentPipelineService } = require('../src/services/policyAlignmentPipelineService');

  try {
    let counter = 0;
    const service = createPolicyAlignmentPipelineService({
      query: async () => ({ rows: [], rowCount: 0 }),
      uuid: () => {
        counter += 1;
        return `generated-${counter}`;
      }
    });

    const result = await service.compareRequirementsToSource({
      requirements: [
        {
          title: 'Increase sustainable employment transitions',
          theme: 'Employment',
          description: 'Provide individualized labour market services and active labour market measures.'
        },
        {
          title: 'Increase sustainable employment transitions',
          theme: 'Employment',
          description: 'Provide individualized labour market services and active labour market measures.'
        }
      ],
      sourceRefs: [{
        id: 'source-1',
        entityKind: 'guideline',
        entityId: 'guideline-1',
        title: 'Employment support',
        description: 'Support employment transitions.'
      }],
      localeHint: 'en'
    });

    assert.equal(result.requirements.length, 1);
    assert.equal(result.findings.length, 1);
    assert.equal(result.summary.total, 1);
  } finally {
    delete require.cache[modulePath];
    teardown.reverse().forEach((restore) => restore());
  }
});

test('extractRequirementsFromTargetDocuments splits timed out batches and merges results', async () => {
  const teardown = [];
  teardown.push(mockModule('../src/services/policyAlignmentAiService', {
    getPolicyAlignmentAiConfig: () => ({ model: 'test-model' }),
    requestPolicyAlignmentJson: async ({ userText }) => {
      const text = String(userText || '');
      const chunkCount = (text.match(/CHUNK /g) || []).length;
      if (chunkCount > 1) {
        throw new Error('ai request timed out');
      }
      if (text.includes('skills.pdf')) {
        return {
          model: 'test-model',
          parsed: {
            requirements: [{
              requirementKey: 'skills-1',
              theme: 'Skills',
              title: 'Increase digital skills',
              description: 'Raise digital capacity across the institution.',
              evidence: [{ chunkOrdinal: 1, quote: 'Raise digital capacity across the institution.' }]
            }]
          }
        };
      }
      return {
        model: 'test-model',
        parsed: {
          requirements: [{
            requirementKey: 'data-1',
            theme: 'Data',
            title: 'Improve data governance',
            description: 'Strengthen stewardship, quality and interoperability.',
            evidence: [{ chunkOrdinal: 1, quote: 'Strengthen stewardship, quality and interoperability.' }]
          }]
        }
      };
    }
  }));

  const modulePath = require.resolve('../src/services/policyAlignmentPipelineService');
  delete require.cache[modulePath];
  const { createPolicyAlignmentPipelineService } = require('../src/services/policyAlignmentPipelineService');

  try {
    const service = createPolicyAlignmentPipelineService({
      query: async () => ({ rows: [], rowCount: 0 }),
      uuid: () => 'generated-id'
    });

    const result = await service.extractRequirementsFromTargetDocuments({
      documents: [
        {
          id: 'doc-1',
          role: 'target',
          filename: 'skills.pdf',
          extractedText: 'Raise digital capacity across the institution.\n\nProvide measurable learning programmes.'
        },
        {
          id: 'doc-2',
          role: 'target',
          filename: 'data.pdf',
          extractedText: 'Strengthen stewardship, quality and interoperability.\n\nMaintain reusable standards.'
        }
      ],
      localeHint: 'en'
    });

    assert.equal(result.requirements.length, 2);
    assert.equal(result.chunkBatchCount, 1);
    assert.deepEqual(
      result.requirements.map((item) => item.title).sort(),
      ['Improve data governance', 'Increase digital skills']
    );
  } finally {
    delete require.cache[modulePath];
    teardown.reverse().forEach((restore) => restore());
  }
});
