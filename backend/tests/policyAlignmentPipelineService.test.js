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
