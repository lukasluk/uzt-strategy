const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'into', 'is', 'it', 'of', 'on', 'or',
  'that', 'the', 'their', 'this', 'to', 'with', 'we', 'will', 'our', 'your', 'can', 'must', 'should', 'may',
  'not', 'than', 'via', 'per', 'using', 'use', 'used', 'also', 'all', 'any', 'such', 'more', 'most',
  'ir', 'ar', 'bei', 'kad', 'kaip', 'kur', 'tai', 'turi', 'turetu', 'gali', 'buti', 'yra', 'sie', 'si', 'sio',
  'del', 'nuo', 'iki', 'per', 'po', 'su', 'be', 'i', 'is', 'uz', 'prie', 'pagal', 'tarp', 'jei', 'jeigu', 'nes',
  'thei', 'them'
]);

function trimText(value, maxLength = 0) {
  const text = String(value || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return '';
  if (maxLength > 0) return text.slice(0, maxLength).trim();
  return text;
}

function normalizeComparableText(value) {
  return trimText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeText(value) {
  return normalizeComparableText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function sentenceSplit(value) {
  return trimText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => trimText(sentence, 600))
    .filter(Boolean);
}

function keywordFrequencyMap(tokens) {
  const map = new Map();
  (Array.isArray(tokens) ? tokens : []).forEach((token) => {
    map.set(token, (map.get(token) || 0) + 1);
  });
  return map;
}

function computeTokenOverlap(leftTokens, rightTokens) {
  const leftMap = keywordFrequencyMap(leftTokens);
  const rightMap = keywordFrequencyMap(rightTokens);
  let overlap = 0;
  leftMap.forEach((count, token) => {
    if (!rightMap.has(token)) return;
    overlap += Math.min(count, rightMap.get(token));
  });
  const leftSize = leftTokens.length || 1;
  const rightSize = rightTokens.length || 1;
  const precision = overlap / rightSize;
  const recall = overlap / leftSize;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return {
    overlap,
    precision,
    recall,
    f1
  };
}

function scoreSourceRefAgainstRequirement(requirement, sourceRef) {
  const requirementTitleTokens = tokenizeText(requirement?.title || '');
  const requirementBodyTokens = tokenizeText([
    requirement?.title || '',
    requirement?.description || '',
    requirement?.theme || ''
  ].join(' '));
  const sourceTitleTokens = tokenizeText(sourceRef?.title || '');
  const sourceBodyTokens = tokenizeText([
    sourceRef?.title || '',
    sourceRef?.description || ''
  ].join(' '));

  const titleOverlap = computeTokenOverlap(requirementTitleTokens, sourceTitleTokens);
  const bodyOverlap = computeTokenOverlap(requirementBodyTokens, sourceBodyTokens);
  const exactTitleMatch = normalizeComparableText(requirement?.title || '') === normalizeComparableText(sourceRef?.title || '');

  const score = Math.max(0, Math.min(1,
    (titleOverlap.f1 * 0.55)
    + (bodyOverlap.f1 * 0.35)
    + (exactTitleMatch ? 0.10 : 0)
  ));

  return {
    score: Number(score.toFixed(3)),
    titleOverlap,
    bodyOverlap,
    exactTitleMatch,
    sharedKeywords: [...new Set(
      requirementBodyTokens.filter((token) => sourceBodyTokens.includes(token))
    )].slice(0, 12)
  };
}

function rankSourceRefsForRequirement(requirement, sourceRefs, options = {}) {
  const refs = Array.isArray(sourceRefs) ? sourceRefs : [];
  const threshold = Math.max(0, Math.min(1, Number(options.threshold ?? 0.08)));
  const limit = Math.max(3, Number(options.limit || 8));
  return refs
    .map((sourceRef) => ({
      sourceRef,
      match: scoreSourceRefAgainstRequirement(requirement, sourceRef)
    }))
    .filter((item) => item.match.score >= threshold)
    .sort((left, right) => {
      if (right.match.score !== left.match.score) return right.match.score - left.match.score;
      return String(left.sourceRef.title || '').localeCompare(String(right.sourceRef.title || ''), 'en');
    })
    .slice(0, limit);
}

function batchRequirements(requirements, batchSize = 10) {
  const items = Array.isArray(requirements) ? requirements : [];
  const size = Math.max(1, Number(batchSize || 10));
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function buildCandidateContextByRequirement(requirements, sourceRefs, options = {}) {
  const items = Array.isArray(requirements) ? requirements : [];
  const context = new Map();
  items.forEach((requirement) => {
    const candidates = rankSourceRefsForRequirement(requirement, sourceRefs, options);
    context.set(requirement.id, candidates);
  });
  return context;
}

function normalizeFindingEvidence(evidence, sourceRefsById) {
  return (Array.isArray(evidence) ? evidence : [])
    .map((entry) => {
      const sourceRefId = String(entry?.sourceRefId || '').trim();
      if (!sourceRefId || !sourceRefsById.has(sourceRefId)) return null;
      const sourceRef = sourceRefsById.get(sourceRefId);
      return {
        sourceRefId,
        quote: trimText(entry?.quote, 800) || null,
        title: sourceRef.title,
        entityKind: sourceRef.entityKind,
        entityId: sourceRef.entityId || null
      };
    })
    .filter(Boolean);
}

function backfillEvidenceFromMatches(finding, sourceRefsById) {
  const existing = Array.isArray(finding?.evidence) ? finding.evidence : [];
  if (existing.length) return existing;
  const matched = Array.isArray(finding?.matchedSourceRefs) ? finding.matchedSourceRefs : [];
  return matched.slice(0, 3).map((item) => {
    const sourceRefId = String(item?.sourceRefId || '').trim();
    const sourceRef = sourceRefsById.get(sourceRefId);
    if (!sourceRef) return null;
    const quote = sentenceSplit(sourceRef.description || '')[0] || trimText(sourceRef.description, 240) || null;
    return {
      sourceRefId,
      quote,
      title: sourceRef.title,
      entityKind: sourceRef.entityKind,
      entityId: sourceRef.entityId || null
    };
  }).filter(Boolean);
}

function refineFindingWithDeterministicSignals(finding, requirementCandidates, sourceRefsById) {
  const candidates = Array.isArray(requirementCandidates) ? requirementCandidates : [];
  const topCandidate = candidates[0] || null;
  const matchedSourceRefs = Array.isArray(finding?.matchedSourceRefs) ? finding.matchedSourceRefs : [];
  const evidence = backfillEvidenceFromMatches({
    ...finding,
    evidence: normalizeFindingEvidence(finding?.evidence, sourceRefsById),
    matchedSourceRefs
  }, sourceRefsById);

  let coverageStatus = String(finding?.coverageStatus || 'unclear').trim().toLowerCase();
  let confidence = Number.isFinite(Number(finding?.confidence)) ? Number(finding.confidence) : null;
  let actionability = String(finding?.actionability || 'review').trim().toLowerCase();
  let explanation = trimText(finding?.explanation, 6000) || null;
  let overlapSummary = trimText(finding?.overlapSummary, 4000) || null;

  if (!matchedSourceRefs.length && (!topCandidate || topCandidate.match.score < 0.08)) {
    coverageStatus = 'missing';
    actionability = actionability === 'none' ? 'review' : actionability;
  }

  if ((coverageStatus === 'covered' || coverageStatus === 'partial') && !evidence.length) {
    coverageStatus = coverageStatus === 'covered' ? 'partial' : 'weak';
  }

  if (coverageStatus === 'missing' && topCandidate && topCandidate.match.score >= 0.24) {
    coverageStatus = 'weak';
  }

  if (coverageStatus === 'unclear' && topCandidate && topCandidate.match.score >= 0.32) {
    coverageStatus = matchedSourceRefs.length ? 'partial' : 'weak';
  }

  if (!confidence && topCandidate) {
    confidence = topCandidate.match.score;
  }
  if (confidence !== null) {
    confidence = Math.max(0, Math.min(1, Number(confidence.toFixed(3))));
  }

  if (!overlapSummary && topCandidate) {
    overlapSummary = topCandidate.match.sharedKeywords.length
      ? `Shared keywords: ${topCandidate.match.sharedKeywords.join(', ')}`
      : null;
  }

  if (!explanation && topCandidate) {
    explanation = topCandidate.match.sharedKeywords.length
      ? `Top deterministic match with ${topCandidate.sourceRef.title} based on shared keywords: ${topCandidate.match.sharedKeywords.join(', ')}.`
      : `Top deterministic match with ${topCandidate.sourceRef.title}.`;
  }

  if (coverageStatus === 'missing') {
    actionability = matchedSourceRefs.length ? 'review' : (actionability === 'suggest_initiative' ? 'suggest_guideline' : actionability);
  }

  return {
    ...finding,
    coverageStatus,
    confidence,
    evidence,
    explanation,
    overlapSummary,
    actionability
  };
}

module.exports = {
  batchRequirements,
  buildCandidateContextByRequirement,
  normalizeComparableText,
  normalizeFindingEvidence,
  rankSourceRefsForRequirement,
  refineFindingWithDeterministicSignals,
  scoreSourceRefAgainstRequirement,
  sentenceSplit,
  tokenizeText,
  trimText
};
