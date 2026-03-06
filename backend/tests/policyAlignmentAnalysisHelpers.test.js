const test = require('node:test');
const assert = require('node:assert/strict');

const {
  batchRequirements,
  buildCandidateContextByRequirement,
  rankSourceRefsForRequirement,
  refineFindingWithDeterministicSignals,
  scoreSourceRefAgainstRequirement,
  sentenceSplit,
  tokenizeText
} = require('../src/services/policyAlignmentAnalysisHelpers');

test('tokenizeText removes stop words and normalizes diacritics', () => {
  const tokens = tokenizeText('Skaitmeninė transformacija ir duomenų valdymas viešajame sektoriuje');
  assert(tokens.includes('skaitmenine'));
  assert(tokens.includes('transformacija'));
  assert(tokens.includes('duomenu'));
  assert(!tokens.includes('ir'));
});

test('sentenceSplit returns concise sentence chunks', () => {
  const sentences = sentenceSplit('First sentence. Second sentence! Third sentence?');
  assert.equal(sentences.length, 3);
  assert.equal(sentences[0], 'First sentence.');
});

test('scoreSourceRefAgainstRequirement ranks semantically similar refs higher', () => {
  const requirement = {
    title: 'Strengthen cybersecurity resilience',
    description: 'Improve incident readiness, cyber hygiene, and sector security baselines.',
    theme: 'Cybersecurity'
  };
  const strongRef = {
    title: 'Cybersecurity baseline across sectors',
    description: 'Adopt common cybersecurity capabilities and incident preparedness in public and private sectors.'
  };
  const weakRef = {
    title: 'Public service experience',
    description: 'Improve portal usability and citizen journeys.'
  };

  const strong = scoreSourceRefAgainstRequirement(requirement, strongRef);
  const weak = scoreSourceRefAgainstRequirement(requirement, weakRef);

  assert(strong.score > weak.score);
  assert(strong.score > 0.2);
});

test('rankSourceRefsForRequirement keeps highest scoring refs first', () => {
  const requirement = {
    id: 'r1',
    title: 'Improve health data interoperability',
    description: 'Exchange patient data securely across institutions.',
    theme: 'Digital Health'
  };
  const refs = [
    { id: 'a', title: 'Tourism campaigns', description: 'Promote the city internationally.' },
    { id: 'b', title: 'Health data platform', description: 'Enable secure patient data exchange and interoperability.' },
    { id: 'c', title: 'Hospital integration roadmap', description: 'Connect clinical systems and digital records.' }
  ];

  const ranked = rankSourceRefsForRequirement(requirement, refs, { threshold: 0.05, limit: 5 });
  assert.equal(ranked[0].sourceRef.id, 'b');
  assert(ranked.every((item) => item.match.score >= 0.05));
});

test('buildCandidateContextByRequirement builds per-requirement candidate sets', () => {
  const requirements = [
    { id: 'r1', title: 'Digital skills', description: 'Raise citizen skills', theme: 'Skills' },
    { id: 'r2', title: 'Cybersecurity', description: 'Improve resilience', theme: 'Cybersecurity' }
  ];
  const refs = [
    { id: 's1', title: 'Digital skills academy', description: 'Upskill staff and citizens' },
    { id: 's2', title: 'Cyber resilience programme', description: 'Security operations and readiness' }
  ];

  const context = buildCandidateContextByRequirement(requirements, refs, { threshold: 0.05, limit: 3 });
  assert.equal(context.size, 2);
  assert.equal(context.get('r1')[0].sourceRef.id, 's1');
  assert.equal(context.get('r2')[0].sourceRef.id, 's2');
});

test('refineFindingWithDeterministicSignals downgrades unsupported covered finding', () => {
  const sourceRef = {
    id: 's1',
    entityKind: 'guideline',
    entityId: 'g1',
    title: 'Cyber resilience programme',
    description: 'Improve cyber readiness and baseline controls.'
  };
  const sourceRefsById = new Map([[sourceRef.id, sourceRef]]);
  const finding = {
    id: 'f1',
    coverageStatus: 'covered',
    confidence: null,
    explanation: '',
    overlapSummary: '',
    evidence: [],
    matchedSourceRefs: [{
      sourceRefId: 's1',
      entityKind: 'guideline',
      entityId: 'g1',
      title: sourceRef.title
    }],
    actionability: 'review'
  };
  const requirementCandidates = [{
    sourceRef,
    match: {
      score: 0.41,
      sharedKeywords: ['cyber', 'readiness']
    }
  }];

  const refined = refineFindingWithDeterministicSignals(finding, requirementCandidates, sourceRefsById);
  assert.equal(refined.coverageStatus, 'covered');
  assert.equal(refined.evidence.length, 1);
  assert.equal(refined.confidence, 0.41);
});

test('refineFindingWithDeterministicSignals turns unsupported finding into missing', () => {
  const refined = refineFindingWithDeterministicSignals(
    {
      id: 'f2',
      coverageStatus: 'unclear',
      confidence: null,
      evidence: [],
      matchedSourceRefs: [],
      actionability: 'review'
    },
    [],
    new Map()
  );
  assert.equal(refined.coverageStatus, 'missing');
});

test('batchRequirements splits list into predictable chunks', () => {
  const requirements = Array.from({ length: 7 }, (_, index) => ({ id: `r${index}` }));
  const batches = batchRequirements(requirements, 3);
  assert.deepEqual(batches.map((batch) => batch.length), [3, 3, 1]);
});
