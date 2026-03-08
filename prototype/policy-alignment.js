
function policyAlignmentAnalysisStatusLabel(status) {
  const key = String(status || '').trim().toLowerCase();
  if (key === 'draft') return langText('Juodraštis', 'Draft');
  if (key === 'queued') return langText('Eilėje', 'Queued');
  if (key === 'processing') return langText('Analizuojama', 'Processing');
  if (key === 'completed') return langText('Užbaigta', 'Completed');
  if (key === 'failed') return langText('Nepavyko', 'Failed');
  return key || '-';
}

function policyAlignmentFrameworkBuildState(framework) {
  const meta = framework?.meta && typeof framework.meta === 'object' ? framework.meta : {};
  const value = String(meta.buildStatus || '').trim().toLowerCase();
  if (value === 'processing' || value === 'completed' || value === 'failed') return value;
  if (Number(framework?.requirementCount || 0) > 0) return 'completed';
  return 'processing';
}

function policyAlignmentFrameworkBuildStatusLabel(framework) {
  const status = policyAlignmentFrameworkBuildState(framework);
  if (status === 'processing') return langText('Kuriama', 'Building');
  if (status === 'failed') return langText('Nepavyko', 'Failed');
  return langText('Paruošta', 'Ready');
}

function policyAlignmentFrameworkReady(framework) {
  return policyAlignmentFrameworkBuildState(framework) === 'completed';
}

function renderPolicyAlignmentProcessingIndicator(label) {
  return `
    <span class="policy-alignment-status-chip is-processing">
      <span class="policy-alignment-spinner" aria-hidden="true"></span>
      <span>${escapeHtml(label)}</span>
    </span>
  `;
}

function clearPolicyAlignmentFrameworkPoll() {
  if (state.policyAlignmentFrameworkPollTimerId) {
    window.clearTimeout(state.policyAlignmentFrameworkPollTimerId);
    state.policyAlignmentFrameworkPollTimerId = 0;
  }
}

function clearPolicyAlignmentAnalysisPoll() {
  if (state.policyAlignmentAnalysisPollTimerId) {
    window.clearTimeout(state.policyAlignmentAnalysisPollTimerId);
    state.policyAlignmentAnalysisPollTimerId = 0;
  }
}

function schedulePolicyAlignmentFrameworkPoll(frameworkId, delayMs = 4000) {
  const nextId = String(frameworkId || '').trim();
  clearPolicyAlignmentFrameworkPoll();
  if (!nextId || !isLoggedIn() || !state.cycle?.id) return;
  state.policyAlignmentFrameworkPollTimerId = window.setTimeout(async () => {
    state.policyAlignmentFrameworkPollTimerId = 0;
    try {
      await refreshPolicyAlignmentFrameworks({ silent: true });
      const framework = await loadPolicyAlignmentFrameworkDetail(nextId, { silent: true });
      render();
      if (framework && !policyAlignmentFrameworkReady(framework) && policyAlignmentFrameworkBuildState(framework) !== 'failed') {
        schedulePolicyAlignmentFrameworkPoll(nextId, 4000);
      }
    } catch {
      // keep silent; manual refresh remains available
    }
  }, Math.max(1000, Number(delayMs) || 4000));
}

function schedulePolicyAlignmentAnalysisPoll(analysisId, delayMs = 4000) {
  const nextId = String(analysisId || '').trim();
  clearPolicyAlignmentAnalysisPoll();
  if (!nextId || !isLoggedIn() || !state.cycle?.id) return;
  state.policyAlignmentAnalysisPollTimerId = window.setTimeout(async () => {
    state.policyAlignmentAnalysisPollTimerId = 0;
    try {
      await refreshPolicyAlignments({ selectedId: nextId, silent: true });
      const analysis = await loadPolicyAlignmentDetail(nextId, { silent: true });
      render();
      if (analysis && ['draft', 'queued', 'processing'].includes(String(analysis.status || '').trim().toLowerCase())) {
        schedulePolicyAlignmentAnalysisPoll(nextId, 4000);
      }
    } catch {
      // keep silent; manual refresh remains available
    }
  }, Math.max(1000, Number(delayMs) || 4000));
}

function policyAlignmentCoverageLabel(status) {
  const key = String(status || '').trim().toLowerCase();
  if (key === 'covered') return langText('Padengta', 'Covered');
  if (key === 'partial') return langText('Dalinai padengta', 'Partially covered');
  if (key === 'weak') return langText('Paminėta silpnai', 'Mentioned but weak');
  if (key === 'missing') return langText('Trūksta', 'Missing');
  if (key === 'contradicted') return langText('Prieštarauja', 'Contradicted');
  if (key === 'unclear') return langText('Neaišku', 'Unclear');
  return key || '-';
}

function policyAlignmentSourceModeLabel(mode) {
  const key = String(mode || '').trim().toLowerCase();
  if (key === 'uploaded_document') return langText('Tik įkelti dokumentai', 'Uploaded documents only');
  if (key === 'existing_strategy') return langText('Tik esama strategija', 'Existing strategy only');
  if (key === 'existing_cycle') return langText('Tik esamas ciklas', 'Existing cycle only');
  if (key === 'mixed') return langText('Mišrus šaltinis', 'Mixed source');
  return key || '-';
}

function policyAlignmentWorkspaceTabKey() {
  const key = String(state.policyAlignmentWorkspaceTab || 'frameworks').trim().toLowerCase();
  if (key === 'strategy-analysis' || key === 'external-analysis' || key === 'frameworks') return key;
  return 'frameworks';
}

function policyAlignmentAnalysisBucketForMode(sourceMode) {
  return String(sourceMode || '').trim().toLowerCase() === 'existing_strategy'
    ? 'strategy-analysis'
    : 'external-analysis';
}

function policyAlignmentSuggestionKindLabel(kind) {
  return String(kind || '').trim().toLowerCase() === 'initiative'
    ? langText('Iniciatyvos juodraštis', 'Initiative draft')
    : langText('Gairės juodraštis', 'Guideline draft');
}

function normalizePolicyAlignmentFramework(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    ...value,
    id: String(value.id || '').trim(),
    cycleId: String(value.cycleId || value.cycle_id || '').trim(),
    institutionId: String(value.institutionId || value.institution_id || '').trim(),
    title: String(value.title || '').trim(),
    description: String(value.description || '').trim(),
    status: String(value.status || 'active').trim().toLowerCase(),
    meta: value.meta && typeof value.meta === 'object' ? value.meta : {},
    requirementCount: Number(value.requirementCount || value.requirement_count || 0) || 0,
    documentCount: Number(value.documentCount || value.document_count || 0) || 0,
    createdAt: value.createdAt || value.created_at || null,
    updatedAt: value.updatedAt || value.updated_at || null,
    documents: Array.isArray(value.documents) ? value.documents : [],
    chunks: Array.isArray(value.chunks) ? value.chunks : [],
    requirements: Array.isArray(value.requirements) ? value.requirements : []
  };
}

function sortedPolicyAlignmentFrameworks(list) {
  return [...(Array.isArray(list) ? list : [])].sort((left, right) => {
    const leftTime = new Date(left?.updatedAt || left?.createdAt || 0).getTime() || 0;
    const rightTime = new Date(right?.updatedAt || right?.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  });
}

async function refreshPolicyAlignmentFrameworks({ silent = false } = {}) {
  if (!isLoggedIn() || !state.cycle?.id) {
    state.policyAlignmentFrameworks = [];
    state.policyAlignmentFrameworkLoading = false;
    state.policyAlignmentFrameworkError = '';
    state.policyAlignmentFrameworkSelectedId = '';
    state.policyAlignmentFrameworkCurrent = null;
    state.policyAlignmentFrameworkDetailLoading = false;
    return [];
  }
  if (!silent) {
    state.policyAlignmentFrameworkLoading = true;
    state.policyAlignmentFrameworkError = '';
    render();
  }
  try {
    const payload = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/policy-alignment-frameworks`);
    state.policyAlignmentFrameworks = sortedPolicyAlignmentFrameworks(
      (Array.isArray(payload?.frameworks) ? payload.frameworks : [])
        .map((item) => normalizePolicyAlignmentFramework(item))
        .filter(Boolean)
    );
    const selectedId = String(state.policyAlignmentFrameworkSelectedId || '').trim();
    const selectedExists = selectedId && state.policyAlignmentFrameworks.some((item) => item.id === selectedId);
    if (!selectedExists) {
      state.policyAlignmentFrameworkSelectedId = String(state.policyAlignmentFrameworks[0]?.id || '').trim();
      state.policyAlignmentFrameworkCurrent = null;
    }
    return state.policyAlignmentFrameworks;
  } catch (error) {
    state.policyAlignmentFrameworks = [];
    state.policyAlignmentFrameworkError = toUserMessage(error);
    state.policyAlignmentFrameworkCurrent = null;
    return [];
  } finally {
    if (!silent) {
      state.policyAlignmentFrameworkLoading = false;
      render();
    }
  }
}

function policyAlignmentFindingRisky(status) {
  const key = String(status || '').trim().toLowerCase();
  return key === 'missing' || key === 'weak' || key === 'contradicted' || key === 'partial';
}

function normalizePolicyAlignmentComparableKey(parts) {
  return (Array.isArray(parts) ? parts : [])
    .map((part) => String(part || '')
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean)
    .join(' | ');
}

function dedupePolicyAlignmentFindings(findings, suggestionFindingIds = new Set()) {
  const groups = new Map();
  (Array.isArray(findings) ? findings : []).forEach((finding, index) => {
    const key = normalizePolicyAlignmentComparableKey([
      finding?.theme,
      finding?.requirementTitle,
      finding?.requirementDescription
    ]) || `finding-${index + 1}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(finding);
  });

  return Array.from(groups.values()).map((items) => {
    const ranked = [...items].sort((left, right) => {
      const leftScore =
        (suggestionFindingIds.has(String(left?.id || '').trim()) ? 10000 : 0)
        + ((Array.isArray(left?.evidence) ? left.evidence.length : 0) * 100)
        + ((Array.isArray(left?.matchedSourceRefs) ? left.matchedSourceRefs.length : 0) * 50)
        + Math.round((Number(left?.confidence) || 0) * 100)
        + (String(left?.explanation || '').trim().length ? 10 : 0);
      const rightScore =
        (suggestionFindingIds.has(String(right?.id || '').trim()) ? 10000 : 0)
        + ((Array.isArray(right?.evidence) ? right.evidence.length : 0) * 100)
        + ((Array.isArray(right?.matchedSourceRefs) ? right.matchedSourceRefs.length : 0) * 50)
        + Math.round((Number(right?.confidence) || 0) * 100)
        + (String(right?.explanation || '').trim().length ? 10 : 0);
      return rightScore - leftScore;
    });
    const primary = { ...ranked[0] };
    const seenMatched = new Set();
    const mergedMatched = [];
    const seenEvidence = new Set();
    const mergedEvidence = [];

    items.forEach((item) => {
      (Array.isArray(item?.matchedSourceRefs) ? item.matchedSourceRefs : []).forEach((ref) => {
        const token = [
          String(ref?.sourceRefId || '').trim(),
          String(ref?.entityKind || '').trim().toLowerCase(),
          String(ref?.entityId || '').trim(),
          String(ref?.title || '').trim().toLowerCase()
        ].join(':');
        if (!token || seenMatched.has(token)) return;
        seenMatched.add(token);
        mergedMatched.push(ref);
      });
      (Array.isArray(item?.evidence) ? item.evidence : []).forEach((evidence) => {
        const token = [
          String(evidence?.sourceRefId || '').trim(),
          String(evidence?.quote || '').trim().toLowerCase()
        ].join(':');
        if (!token || seenEvidence.has(token)) return;
        seenEvidence.add(token);
        mergedEvidence.push(evidence);
      });
    });

    const bestExplanation = items
      .map((item) => String(item?.explanation || '').trim())
      .filter(Boolean)
      .sort((left, right) => right.length - left.length)[0] || null;
    const bestOverlap = items
      .map((item) => String(item?.overlapSummary || '').trim())
      .filter(Boolean)
      .sort((left, right) => right.length - left.length)[0] || null;
    const bestConfidence = items
      .map((item) => Number(item?.confidence))
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => right - left)[0];

    return {
      ...primary,
      matchedSourceRefs: mergedMatched,
      evidence: mergedEvidence,
      explanation: bestExplanation,
      overlapSummary: bestOverlap,
      confidence: Number.isFinite(bestConfidence) ? bestConfidence : primary.confidence,
      duplicateCount: items.length
    };
  });
}

function dedupePolicyAlignmentSuggestions(suggestions, dedupedFindings) {
  const allowedFindingIds = new Set((Array.isArray(dedupedFindings) ? dedupedFindings : []).map((item) => String(item?.id || '').trim()).filter(Boolean));
  const groups = new Map();
  (Array.isArray(suggestions) ? suggestions : []).forEach((suggestion, index) => {
    if (allowedFindingIds.size && suggestion?.findingId && !allowedFindingIds.has(String(suggestion.findingId).trim())) return;
    const key = normalizePolicyAlignmentComparableKey([
      suggestion?.suggestionKind,
      suggestion?.title,
      suggestion?.description,
      suggestion?.meta?.relationType,
      Array.isArray(suggestion?.meta?.guidelineIds) ? suggestion.meta.guidelineIds.join(',') : ''
    ]) || `suggestion-${index + 1}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(suggestion);
  });

  return Array.from(groups.values()).map((items) => {
    const ranked = [...items].sort((left, right) => {
      const rank = (item) => {
        const status = String(item?.status || '').trim().toLowerCase();
        if (status === 'converted') return 3;
        if (status === 'draft') return 2;
        return 1;
      };
      return rank(right) - rank(left);
    });
    return ranked[0];
  });
}

function buildPolicyAlignmentFindingsModel(analysis, options = {}) {
  const selected = analysis && typeof analysis === 'object' ? analysis : null;
  const rawSuggestions = Array.isArray(selected?.suggestions) ? selected.suggestions : [];
  const suggestionFindingIds = new Set(
    rawSuggestions
      .map((item) => String(item?.findingId || '').trim())
      .filter(Boolean)
  );
  const findings = dedupePolicyAlignmentFindings(
    Array.isArray(selected?.findings) ? selected.findings : [],
    suggestionFindingIds
  );
  const suggestions = dedupePolicyAlignmentSuggestions(rawSuggestions, findings);
  const suggestionByFindingId = new Map(
    suggestions
      .filter((item) => item?.findingId)
      .map((item) => [String(item.findingId), item])
  );
  const sourceRefById = new Map(
    (Array.isArray(selected?.sourceRefs) ? selected.sourceRefs : [])
      .filter((item) => item?.id)
      .map((item) => [String(item.id), item])
  );
  const groupBy = String(options.groupBy || state.policyAlignmentGroupBy || 'theme').trim().toLowerCase() || 'theme';
  const themeOptions = [...new Set(
    findings
      .map((item) => String(item?.theme || '').trim())
      .filter(Boolean)
  )].sort((left, right) => left.localeCompare(right));
  const filteredFindings = findings.filter((finding) => {
    const statusPass = state.policyAlignmentFilterStatus === 'all'
      || String(finding?.coverageStatus || '').trim().toLowerCase() === state.policyAlignmentFilterStatus;
    const themePass = state.policyAlignmentFilterTheme === 'all'
      || String(finding?.theme || '').trim() === state.policyAlignmentFilterTheme;
    return statusPass && themePass;
  });
  const grouped = groupBy === 'none'
    ? [{ theme: '', items: filteredFindings }]
    : filteredFindings.reduce((acc, item) => {
      const theme = String(item?.theme || '').trim() || langText('Be temos', 'Unthemed');
      let bucket = acc.find((entry) => entry.theme === theme);
      if (!bucket) {
        bucket = { theme, items: [] };
        acc.push(bucket);
      }
      bucket.items.push(item);
      return acc;
    }, []);

  return {
    filteredFindings,
    grouped,
    suggestions,
    suggestionByFindingId,
    sourceRefById,
    themeOptions
  };
}

function buildPolicyAlignmentOverviewData(analysis, frameworkById) {
  if (!analysis || typeof analysis !== 'object') return null;
  const total = Number(analysis.summary?.total || analysis.targetSummary?.requirementCount || analysis.requirements?.length || 0);
  const covered = Number(analysis.summary?.covered || 0);
  const partial = Number(analysis.summary?.partial || 0);
  const weak = Number(analysis.summary?.weak || 0);
  const missing = Number(analysis.summary?.missing || 0);
  const contradicted = Number(analysis.summary?.contradicted || 0);
  const unclear = Number(analysis.summary?.unclear || 0);
  const suggestionCount = Number(analysis.summary?.suggestionCount || analysis.suggestions?.length || 0);
  const riskCount = missing + weak + contradicted;
  const docs = Array.isArray(analysis.documents) ? analysis.documents : [];
  const sourceDocs = docs.filter((item) => String(item?.role || '').trim().toLowerCase() === 'source');
  const targetDocs = docs.filter((item) => String(item?.role || '').trim().toLowerCase() === 'target');
  const topThemes = Array.from(new Set(
    (Array.isArray(analysis.findings) ? analysis.findings : [])
      .map((item) => String(item?.theme || '').trim())
      .filter(Boolean)
  )).slice(0, 4);
  const frameworkTitle = analysis.targetFrameworkId && frameworkById.get(analysis.targetFrameworkId)
    ? String(frameworkById.get(analysis.targetFrameworkId).title || '').trim()
    : '';
  const sourceModeLabel = policyAlignmentSourceModeLabel(analysis.sourceMode);
  const narrativeParts = [
    total
      ? langText(
        `AI įvertino ${total} politikos karkaso reikalavimų pagal pasirinktus analizės šaltinius.`,
        `AI assessed ${total} policy framework requirements against the selected analysis sources.`
      )
      : langText(
        'Reikalavimų vertinimas dar nebaigtas arba nebuvo pakankamai duomenų pilnam įvertinimui.',
        'Requirement assessment is not finished yet or there was not enough data for a full evaluation.'
      ),
    frameworkTitle
      ? langText(
        `Analizė atlikta naudojant politikos karkasą „${frameworkTitle}“.`,
        `The analysis was run against the policy framework "${frameworkTitle}".`
      )
      : '',
    total
      ? langText(
        `Pilnai padengta ${covered}, dalinai padengta ${partial}, rizikos ar trūkumo būsenoje ${riskCount}, neaišku ${unclear}.`,
        `${covered} were fully covered, ${partial} partially covered, ${riskCount} were in risk or missing status, and ${unclear} remained unclear.`
      )
      : '',
    suggestionCount
      ? langText(
        `Sukurta ${suggestionCount} veiksmų juodraščių tolimesniam moderavimui.`,
        `${suggestionCount} draft actions were prepared for follow-up moderation.`
      )
      : langText(
        'Naujų veiksmų juodraščių šiame etape nesugeneruota.',
        'No new draft actions were generated at this stage.'
      ),
    topThemes.length
      ? langText(
        `Dažniausiai pasikartojančios temos: ${topThemes.join(', ')}.`,
        `Most visible themes: ${topThemes.join(', ')}.`
      )
      : ''
  ].filter(Boolean);

  return {
    total,
    covered,
    partial,
    weak,
    missing,
    contradicted,
    unclear,
    suggestionCount,
    riskCount,
    docs,
    sourceDocs,
    targetDocs,
    topThemes,
    frameworkTitle,
    sourceModeLabel,
    narrative: narrativeParts.join(' ')
  };
}

function renderPolicyAlignmentMatchedRefs(finding) {
  const refs = Array.isArray(finding?.matchedSourceRefs) ? finding.matchedSourceRefs : [];
  if (!refs.length) return `<span class="tag">${escapeHtml(langText('Atitikmenų nerasta', 'No matched source items'))}</span>`;
  return refs.map((item) => {
    const kind = String(item?.entityKind || '').trim().toLowerCase();
    const entityId = String(item?.entityId || '').trim();
    const title = String(item?.title || entityId || '-').trim() || '-';
    if ((kind === 'guideline' || kind === 'initiative') && entityId) {
      return `<button type="button" class="tag tag-link-button tag-link-ref" data-action="open-policy-source" data-kind="${escapeHtml(kind)}" data-entity-id="${escapeHtml(entityId)}">${escapeHtml(title)}</button>`;
    }
    return `<span class="tag tag-link-ref">${escapeHtml(title)}</span>`;
  }).join('');
}

function renderPolicyAlignmentEvidence(finding, sourceRefById) {
  const evidence = Array.isArray(finding?.evidence) ? finding.evidence.slice(0, 3) : [];
  if (!evidence.length) {
    return `<span class="prompt">${escapeHtml(langText('Tiesioginių įrodymų neišskirta.', 'No direct evidence extracted.'))}</span>`;
  }
  return `
    <ul class="policy-alignment-evidence-list">
      ${evidence.map((item) => {
    const sourceRef = sourceRefById.get(String(item?.sourceRefId || '').trim()) || null;
    const sourceLabel = String(sourceRef?.title || langText('Šaltinis', 'Source')).trim();
    const quote = String(item?.quote || '').trim();
    return `
          <li>
            <strong>${escapeHtml(sourceLabel)}</strong>
            ${quote ? `<span>${escapeHtml(quote)}</span>` : ''}
          </li>
        `;
  }).join('')}
    </ul>
  `;
}

function renderPolicyAlignmentOverlap(finding) {
  const refs = Array.isArray(finding?.matchedSourceRefs) ? finding.matchedSourceRefs : [];
  const summary = String(finding?.overlapSummary || '').trim() || String(finding?.explanation || '').trim();
  if (!refs.length && !summary) {
    return `<span class="prompt">${escapeHtml(langText('Persidengimo nenustatyta.', 'No overlap identified.'))}</span>`;
  }
  return `
    <div class="policy-alignment-overlap-cell">
      ${refs.length ? `<div class="policy-alignment-chip-list">${renderPolicyAlignmentMatchedRefs(finding)}</div>` : ''}
      ${summary ? `<div class="prompt">${escapeHtml(summary)}</div>` : ''}
    </div>
  `;
}

function renderPolicyAlignmentCoverageRows(grouped, suggestionByFindingId, sourceRefById, options = {}) {
  const actionsEnabled = options.actionsEnabled !== false;
  return grouped.map((group) => `
    ${group.theme
    ? `<tr class="policy-alignment-theme-row"><td colspan="7">${escapeHtml(group.theme)}</td></tr>`
    : ''}
    ${group.items.map((finding) => {
    const suggestion = suggestionByFindingId.get(String(finding?.id || '').trim()) || null;
    const confidence = Number.isFinite(Number(finding?.confidence))
      ? `${Math.round(Number(finding.confidence) * 100)}%`
      : '-';
    const primaryRef = policyAlignmentPrimaryNavigableRef(finding);
    const actionCell = actionsEnabled
      ? `
          <div class="policy-alignment-action-stack">
            ${suggestion
              ? (String(suggestion.status || '').trim().toLowerCase() === 'converted'
                ? `<span class="tag">${escapeHtml(langText('Paversta pasiūlymu', 'Converted to proposal'))}</span>`
                : `<button type="button" class="btn btn-primary policy-alignment-inline-btn" data-action="convert-policy-suggestion" data-suggestion-id="${escapeHtml(suggestion.id)}">${escapeHtml(policyAlignmentSuggestionKindLabel(suggestion.suggestionKind))}</button>`)
              : `<span class="tag">${escapeHtml(langText('Peržiūra', 'Review'))}</span>`}
            ${primaryRef
              ? `<button type="button" class="btn btn-ghost policy-alignment-inline-btn" data-action="open-policy-source-map" data-kind="${escapeHtml(String(primaryRef.entityKind || '').trim().toLowerCase())}" data-entity-id="${escapeHtml(String(primaryRef.entityId || '').trim())}">${escapeHtml(langText('Rodyti žemėlapyje', 'Show on map'))}</button>`
              : ''}
            <button type="button" class="btn btn-ghost policy-alignment-inline-btn" data-action="link-policy-finding" data-finding-id="${escapeHtml(String(finding?.id || '').trim())}">${escapeHtml(langText('Susieti kortelę', 'Link card'))}</button>
          </div>
        `
      : `<span class="tag">${escapeHtml(langText('Tik vertinimas', 'Evaluation only'))}</span>`;
    return `
          <tr class="policy-alignment-table-row status-${escapeHtml(String(finding?.coverageStatus || 'unclear').trim().toLowerCase())}">
            <td>
              <strong>${escapeHtml(finding?.requirementTitle || '-')}</strong>
              ${finding?.requirementDescription ? `<div class="prompt">${escapeHtml(finding.requirementDescription)}</div>` : ''}
            </td>
            <td><span class="tag">${escapeHtml(policyAlignmentCoverageLabel(finding?.coverageStatus))}</span></td>
            <td>${escapeHtml(confidence)}</td>
            <td>${renderPolicyAlignmentOverlap(finding)}</td>
            <td>${renderPolicyAlignmentEvidence(finding, sourceRefById)}</td>
            <td>${escapeHtml(finding?.explanation || '-')}</td>
            <td>${actionCell}</td>
          </tr>
        `;
  }).join('')}
  `).join('');
}

function policyAlignmentPrimaryNavigableRef(finding) {
  const refs = Array.isArray(finding?.matchedSourceRefs) ? finding.matchedSourceRefs : [];
  return refs.find((item) => {
    const kind = String(item?.entityKind || '').trim().toLowerCase();
    const entityId = String(item?.entityId || '').trim();
    return (kind === 'guideline' || kind === 'initiative') && entityId;
  }) || null;
}

function openPolicyAlignmentLinkModal(analysis, finding) {
  const currentAnalysis = analysis && typeof analysis === 'object' ? analysis : null;
  const currentFinding = finding && typeof finding === 'object' ? finding : null;
  if (!currentAnalysis?.id || !currentFinding?.id) return;

  const existing = document.getElementById('policyAlignmentLinkOverlay');
  if (existing) existing.remove();

  const guidelineOptions = (Array.isArray(state.guidelines) ? state.guidelines : [])
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title || item.id)}</option>`)
    .join('');
  const initiativeOptions = (Array.isArray(state.initiatives) ? state.initiatives : [])
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title || item.id)}</option>`)
    .join('');

  const overlay = document.createElement('div');
  overlay.id = 'policyAlignmentLinkOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card" role="dialog" aria-modal="true" aria-labelledby="policyAlignmentLinkTitle">
      <div class="auth-modal-header">
        <div>
          <h3 id="policyAlignmentLinkTitle">${escapeHtml(langText('Susieti radinį su esama kortele', 'Link finding to existing card'))}</h3>
          <p class="prompt" style="margin: 6px 0 0;">${escapeHtml(currentFinding.requirementTitle || '-')}</p>
        </div>
        <button type="button" class="btn btn-ghost" id="closePolicyAlignmentLinkModal">${escapeHtml(langText('Uždaryti', 'Close'))}</button>
      </div>
      <form id="policyAlignmentLinkForm" class="policy-alignment-create-form">
        <div class="policy-alignment-filter-grid">
          <label>
            <span>${escapeHtml(langText('Gairė', 'Guideline'))}</span>
            <select name="guidelineId">
              <option value="">${escapeHtml(langText('Nepasirinkta', 'Not selected'))}</option>
              ${guidelineOptions}
            </select>
          </label>
          <label>
            <span>${escapeHtml(langText('Iniciatyva', 'Initiative'))}</span>
            <select name="initiativeId">
              <option value="">${escapeHtml(langText('Nepasirinkta', 'Not selected'))}</option>
              ${initiativeOptions}
            </select>
          </label>
          <div class="policy-alignment-link-note">
            <strong>${escapeHtml(langText('Pastaba', 'Note'))}</strong>
            <span class="prompt">${escapeHtml(langText('Pasirinkite vieną esamą kortelę. Ji bus pridėta prie šio radinio atitikmenų.', 'Select one existing card. It will be added to this finding as a matched source item.'))}</span>
          </div>
        </div>
        <div id="policyAlignmentLinkError" class="auth-error" style="display:none;"></div>
        <div class="form-actions">
          <button type="submit" id="policyAlignmentLinkSubmit" class="btn btn-primary">${escapeHtml(langText('Susieti', 'Link'))}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeModal = () => {
    const current = document.getElementById('policyAlignmentLinkOverlay');
    if (current) current.remove();
  };
  const closeBtn = overlay.querySelector('#closePolicyAlignmentLinkModal');
  const form = overlay.querySelector('#policyAlignmentLinkForm');
  const errorBox = overlay.querySelector('#policyAlignmentLinkError');
  const submitButton = overlay.querySelector('#policyAlignmentLinkSubmit');

  function showError(message) {
    const text = String(message || '').trim();
    errorBox.textContent = text;
    errorBox.style.display = text ? 'block' : 'none';
    if (text) notifyError(text);
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');
    const fd = new FormData(form);
    const guidelineId = String(fd.get('guidelineId') || '').trim();
    const initiativeId = String(fd.get('initiativeId') || '').trim();
    if ((guidelineId && initiativeId) || (!guidelineId && !initiativeId)) {
      showError(langText('Pasirinkite vieną gairę arba vieną iniciatyvą.', 'Select one guideline or one initiative.'));
      return;
    }
    const entityKind = guidelineId ? 'guideline' : 'initiative';
    const entityId = guidelineId || initiativeId;
    submitButton.disabled = true;
    try {
      await api(`/api/v1/policy-alignments/${encodeURIComponent(currentAnalysis.id)}/findings/${encodeURIComponent(currentFinding.id)}/link-source`, {
        method: 'POST',
        body: { entityKind, entityId }
      });
      await loadPolicyAlignmentDetail(currentAnalysis.id, { silent: true });
      closeModal();
      notifySuccess(langText('Radinys susietas su esama kortele.', 'Finding linked to existing card.'));
      render();
    } catch (error) {
      showError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
    }
  });
}
function selectedPolicyAlignmentFrameworkFromState() {
  const selectedId = String(state.policyAlignmentFrameworkSelectedId || '').trim();
  if (selectedId && state.policyAlignmentFrameworkCurrent?.id === selectedId) {
    return state.policyAlignmentFrameworkCurrent;
  }
  return sortedPolicyAlignmentFrameworks(state.policyAlignmentFrameworks).find((item) => item.id === selectedId) || null;
}

async function loadPolicyAlignmentFrameworkDetail(frameworkId, { silent = false } = {}) {
  const nextId = String(frameworkId || '').trim();
  if (!nextId || !isLoggedIn()) return null;
  if (!silent) {
    state.policyAlignmentFrameworkDetailLoading = true;
    state.policyAlignmentFrameworkError = '';
    render();
  }
  try {
    const payload = await api(`/api/v1/policy-alignment-frameworks/${encodeURIComponent(nextId)}`);
    const framework = normalizePolicyAlignmentFramework(payload?.framework);
    if (!framework) throw new Error('framework not found');
    state.policyAlignmentFrameworkCurrent = framework;
    state.policyAlignmentFrameworkSelectedId = framework.id;
    state.policyAlignmentFrameworks = sortedPolicyAlignmentFrameworks(
      state.policyAlignmentFrameworks.some((item) => item.id === framework.id)
        ? state.policyAlignmentFrameworks.map((item) => (item.id === framework.id ? { ...item, ...framework } : item))
        : [...state.policyAlignmentFrameworks, framework]
    );
    if (!policyAlignmentFrameworkReady(framework) && policyAlignmentFrameworkBuildState(framework) !== 'failed') {
      schedulePolicyAlignmentFrameworkPoll(framework.id, 4000);
    } else {
      clearPolicyAlignmentFrameworkPoll();
    }
    return framework;
  } catch (error) {
    state.policyAlignmentFrameworkError = toUserMessage(error);
    return null;
  } finally {
    if (!silent) {
      state.policyAlignmentFrameworkDetailLoading = false;
      render();
    }
  }
}

function openPolicyAlignmentFrameworkDocumentModal(framework, documentRecord) {
  return openPolicyAlignmentFrameworkEvidenceModal(framework, {
    documentId: documentRecord?.id || null
  });
}

function highlightPolicyAlignmentQuote(text, quote) {
  const sourceText = String(text || '');
  const sourceQuote = String(quote || '').trim();
  const escapedText = escapeHtml(sourceText);
  if (!sourceQuote) return escapedText;

  const lowerText = sourceText.toLowerCase();
  const lowerQuote = sourceQuote.toLowerCase();
  const start = lowerText.indexOf(lowerQuote);
  if (start < 0) return escapedText;

  const before = sourceText.slice(0, start);
  const matched = sourceText.slice(start, start + sourceQuote.length);
  const after = sourceText.slice(start + sourceQuote.length);
  return `${escapeHtml(before)}<mark class="policy-alignment-highlight">${escapeHtml(matched)}</mark>${escapeHtml(after)}`;
}

function openPolicyAlignmentFrameworkEvidenceModal(framework, options = {}) {
  const currentFramework = framework && typeof framework === 'object' ? framework : null;
  const targetDocumentId = String(options?.documentId || '').trim();
  const targetChunkOrdinal = Number.isFinite(Number(options?.chunkOrdinal)) ? Number(options.chunkOrdinal) : null;
  const highlightQuote = String(options?.quote || '').trim();
  const requirementTitle = String(options?.requirementTitle || '').trim();
  const documentItem = (Array.isArray(currentFramework?.documents) ? currentFramework.documents : [])
    .find((item) => String(item?.id || '').trim() === targetDocumentId)
    || (Array.isArray(currentFramework?.documents) ? currentFramework.documents[0] : null);
  if (!currentFramework?.id || !documentItem?.id) return;

  const frameworkChunks = Array.isArray(currentFramework?.chunks) ? currentFramework.chunks : [];
  const relevantChunk = targetChunkOrdinal === null
    ? null
    : frameworkChunks.find((item) => Number(item?.ordinal) === targetChunkOrdinal && String(item?.documentId || '').trim() === String(documentItem.id || '').trim())
      || frameworkChunks.find((item) => Number(item?.ordinal) === targetChunkOrdinal)
      || null;
  const bodyHtml = relevantChunk
    ? `
      <div class="policy-alignment-evidence-focus">
        <div class="policy-alignment-document-meta">
          <span class="tag">${escapeHtml(langText('Reference', 'Reference'))}: ${escapeHtml(String(targetChunkOrdinal))}</span>
          ${relevantChunk.sectionPath ? `<span class="tag">${escapeHtml(relevantChunk.sectionPath)}</span>` : ''}
          ${relevantChunk.heading ? `<span class="tag">${escapeHtml(relevantChunk.heading)}</span>` : ''}
        </div>
        ${requirementTitle ? `<p class="prompt" style="margin: 0 0 10px;"><strong>${escapeHtml(langText('Requirement', 'Requirement'))}:</strong> ${escapeHtml(requirementTitle)}</p>` : ''}
        <div class="policy-alignment-document-body"><pre>${highlightPolicyAlignmentQuote(String(relevantChunk.textExcerpt || '').trim(), highlightQuote)}</pre></div>
      </div>
    `
    : `<div class="policy-alignment-document-body"><pre>${escapeHtml(String(documentItem.extractedText || '').trim() || langText('No extracted text available.', 'No extracted text available.'))}</pre></div>`;

  const existing = document.getElementById('policyAlignmentFrameworkDocOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'policyAlignmentFrameworkDocOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card policy-alignment-document-modal" role="dialog" aria-modal="true" aria-labelledby="policyAlignmentFrameworkDocTitle">
      <div class="auth-modal-header">
        <div>
          <h3 id="policyAlignmentFrameworkDocTitle">${escapeHtml(documentItem.filename || '-')}</h3>
          <p class="prompt" style="margin: 6px 0 0;">${escapeHtml(currentFramework.title || '-')}</p>
        </div>
        <button type="button" class="btn btn-ghost" id="closePolicyAlignmentFrameworkDocModal">${escapeHtml(langText('Close', 'Close'))}</button>
      </div>
      <div class="policy-alignment-document-meta">
        <span class="tag">${escapeHtml(langText('Built into policy framework', 'Built into policy framework'))}</span>
        <span class="tag">${escapeHtml(langText('Uploaded', 'Uploaded'))}: ${escapeHtml(formatCommentDateTime(documentItem.createdAt))}</span>
        <span class="tag">${escapeHtml(langText('Chars', 'Chars'))}: ${Number(documentItem.meta?.chars || String(documentItem.extractedText || '').length || 0)}</span>
      </div>
      ${bodyHtml}
    </div>
  `;
  document.body.appendChild(overlay);

  const closeModal = () => {
    const current = document.getElementById('policyAlignmentFrameworkDocOverlay');
    if (current) current.remove();
  };
  overlay.querySelector('#closePolicyAlignmentFrameworkDocModal')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
}

function buildPolicyAlignmentRequirementReferences(requirement, framework) {
  const chunks = Array.isArray(framework?.chunks) ? framework.chunks : [];
  const documents = Array.isArray(framework?.documents) ? framework.documents : [];
  const byDocumentId = new Map(documents.map((item) => [String(item?.id || '').trim(), item]));
  const seen = new Set();
  const sourceDocumentId = String(requirement?.sourceDocumentId || '').trim();

  return (Array.isArray(requirement?.evidence) ? requirement.evidence : [])
    .map((entry) => {
      const chunkOrdinal = Number.isFinite(Number(entry?.chunkOrdinal)) ? Number(entry.chunkOrdinal) : null;
      if (chunkOrdinal === null) return null;
      const token = `${chunkOrdinal}:${String(entry?.quote || '').trim().toLowerCase()}`;
      if (seen.has(token)) return null;
      seen.add(token);
      const quote = String(entry?.quote || '').trim();
      const normalizedQuote = quote.toLowerCase();
      const chunk = chunks.find((item) => (
        Number(item?.ordinal) === chunkOrdinal
        && (!sourceDocumentId || String(item?.documentId || '').trim() === sourceDocumentId)
      ))
        || chunks.find((item) => (
          Number(item?.ordinal) === chunkOrdinal
          && normalizedQuote
          && String(item?.textExcerpt || '').toLowerCase().includes(normalizedQuote)
        ))
        || chunks.find((item) => (
          normalizedQuote
          && String(item?.textExcerpt || '').toLowerCase().includes(normalizedQuote)
          && (!sourceDocumentId || String(item?.documentId || '').trim() === sourceDocumentId)
        ))
        || chunks.find((item) => Number(item?.ordinal) === chunkOrdinal)
        || null;
      const documentId = String(chunk?.documentId || sourceDocumentId || '').trim();
      return {
        chunkOrdinal,
        quote,
        chunk,
        document: byDocumentId.get(documentId) || null
      };
    })
    .filter(Boolean);
}

function openPolicyAlignmentFrameworkCreateModal() {
  if (!state.cycle?.id || state.role !== 'institution_admin') return;
  const existing = document.getElementById('policyAlignmentFrameworkCreateOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'policyAlignmentFrameworkCreateOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card" role="dialog" aria-modal="true" aria-labelledby="policyAlignmentFrameworkCreateTitle">
      <div class="auth-modal-header">
        <div>
          <h3 id="policyAlignmentFrameworkCreateTitle">${escapeHtml(langText('Create policy framework', 'Create policy framework'))}</h3>
          <p class="prompt" style="margin: 6px 0 0;">${escapeHtml(langText('Upload one or more target policy documents. The policy framework library will be built from those documents first.', 'Upload one or more target policy documents. The policy framework library will be built from those documents first.'))}</p>
        </div>
        <button type="button" class="btn btn-ghost" id="closePolicyAlignmentFrameworkCreateModal">${escapeHtml(langText('Close', 'Close'))}</button>
      </div>
      <form id="policyAlignmentFrameworkCreateForm" class="policy-alignment-create-form">
        <div class="inline-form-grid">
          <input type="text" name="title" placeholder="${escapeHtml(langText('Politikos karkaso pavadinimas', 'Policy framework title'))}" required />
          <select name="localeHint">
            <option value="en">${escapeHtml(langText('Extract requirements in EN', 'Extract requirements in EN'))}</option>
            <option value="lt">${escapeHtml(langText('Extract requirements in LT', 'Extract requirements in LT'))}</option>
          </select>
        </div>
        <textarea name="description" placeholder="${escapeHtml(langText('Kokią politiką ar politikos karkasą atspindi šis dokumentų rinkinys?', 'What policy or policy framework is this document set representing?'))}"></textarea>
        <label class="policy-alignment-upload-card">
          <strong>${escapeHtml(langText('Politikos karkaso šaltinio dokumentai', 'Policy framework source documents'))}</strong>
          <span class="prompt">${escapeHtml(langText('Įkelkite tikslinės politikos PDF failus, naudojamus pakartotinai naudojamam politikos karkasui sukurti.', 'Upload the target policy PDF files used to build the reusable policy framework.'))}</span>
          <input type="file" id="policyAlignmentFrameworkFiles" accept="application/pdf,.pdf" multiple required />
        </label>
        <div id="policyAlignmentFrameworkCreateError" class="auth-error" style="display:none;"></div>
        <div class="form-actions">
          <button type="submit" id="policyAlignmentFrameworkCreateSubmit" class="btn btn-primary">${escapeHtml(langText('Kurti politikos karkasą', 'Build policy framework'))}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeModal = () => {
    const current = document.getElementById('policyAlignmentFrameworkCreateOverlay');
    if (current) current.remove();
  };
  const closeBtn = overlay.querySelector('#closePolicyAlignmentFrameworkCreateModal');
  const form = overlay.querySelector('#policyAlignmentFrameworkCreateForm');
  const errorBox = overlay.querySelector('#policyAlignmentFrameworkCreateError');
  const submitButton = overlay.querySelector('#policyAlignmentFrameworkCreateSubmit');
  const fileInput = overlay.querySelector('#policyAlignmentFrameworkFiles');

  function showError(message) {
    const text = String(message || '').trim();
    errorBox.textContent = text;
    errorBox.style.display = text ? 'block' : 'none';
    if (text) notifyError(text);
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');
    if (!submitButton) return;
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim();
    const localeHint = String(fd.get('localeHint') || currentLanguage() || 'en').trim().toLowerCase();
    const files = Array.from(fileInput?.files || []);

    if (!title) {
      showError(toUserMessage(new Error('policy framework title required')));
      return;
    }
    if (!files.length) {
      showError(toUserMessage(new Error('target documents required')));
      return;
    }

    submitButton.disabled = true;
    const initialLabel = submitButton.textContent;
    submitButton.textContent = langText('Kuriama...', 'Building...');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('localeHint', localeHint);
      files.forEach((file) => formData.append('documents', file));

      const payload = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/policy-alignment-frameworks`, {
        method: 'POST',
        body: formData
      });
      const framework = normalizePolicyAlignmentFramework(payload?.framework);
      if (framework?.id) {
        state.policyAlignmentFrameworkSelectedId = framework.id;
        state.policyAlignmentFrameworkCurrent = framework;
      }
      state.policyAlignmentWorkspaceTab = 'frameworks';
      await refreshPolicyAlignmentFrameworks({ silent: true });
      if (framework?.id) {
        await loadPolicyAlignmentFrameworkDetail(framework.id, { silent: true });
        if (!policyAlignmentFrameworkReady(framework)) {
          schedulePolicyAlignmentFrameworkPoll(framework.id, 2500);
        }
      }
      closeModal();
      notifySuccess(langText('Politikos karkaso kūrimas pradėtas. Dokumentai apdorojami fone.', 'Policy framework build started. Documents are being processed in the background.'));
      render();
    } catch (error) {
      showError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
    }
  });
}

function openPolicyAlignmentCreateModalLegacy() {
  if (!state.cycle?.id) return;
  if (state.role !== 'institution_admin') {
    notifyError(langText('Tik administratoriai gali kurti Policy Alignment analizes.', 'Only administrators can create Policy Alignment analyses.'));
    return;
  }
  const frameworks = sortedPolicyAlignmentFrameworks(state.policyAlignmentFrameworks);
  const readyFrameworks = frameworks.filter((item) => policyAlignmentFrameworkReady(item));
  const selectedFrameworkId = String(state.policyAlignmentFrameworkSelectedId || readyFrameworks[0]?.id || '').trim();
  const selectedStrategyTitle = String(
    state.strategy?.title
    || state.strategySlug
    || langText('Strategija nepasirinkta', 'No strategy selected')
  ).trim();
  const selectedInstitutionTitle = String(
    state.institution?.name
    || state.institutionSlug
    || langText('Institucija nepasirinkta', 'No institution selected')
  ).trim();
  if (!selectedFrameworkId) {
    notifyError(langText('Pirmiausia paruoškite politikos karkasą, tada paleiskite analizę iš jo.', 'Build a ready policy framework first, then run an analysis from it.'));
    return;
  }

  const existing = document.getElementById('policyAlignmentCreateOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'policyAlignmentCreateOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card" role="dialog" aria-modal="true" aria-labelledby="policyAlignmentCreateTitle">
      <button type="button" class="btn btn-ghost policy-alignment-modal-close" id="closePolicyAlignmentCreateModal" aria-label="${escapeHtml(langText('Uždaryti', 'Close'))}">×</button>
      <div class="auth-modal-header">
        <div>
          <h3 id="policyAlignmentCreateTitle">${escapeHtml(langText('Create analysis from policy framework', 'Create analysis from policy framework'))}</h3>
          <p class="prompt" style="margin: 6px 0 0;">${escapeHtml(langText('Pasirinkite analizės šaltinius kairėje ir politikos karkasą dešinėje. Analizė bus paleista fone, kaip ir politikos karkaso kūrimas.', 'Choose analysis sources on the left and the policy framework on the right. The analysis will start in the background, just like policy framework building.'))}</p>
        </div>
      </div>
      <form id="policyAlignmentCreateForm" class="policy-alignment-create-form">
        <div class="policy-alignment-create-topline">
          <input type="text" name="title" placeholder="${escapeHtml(langText('Analysis title', 'Analysis title'))}" required />
          <label class="policy-alignment-inline-field">
            <span>${escapeHtml(langText('Output language', 'Output language'))}</span>
            <select name="localeHint">
              <option value="en">${escapeHtml(langText('Results in EN', 'Results in EN'))}</option>
              <option value="lt">${escapeHtml(langText('Results in LT', 'Results in LT'))}</option>
            </select>
          </label>
        </div>
        <textarea name="description" placeholder="${escapeHtml(langText('What do you want to learn from this comparison?', 'What do you want to learn from this comparison?'))}"></textarea>
        <div class="policy-alignment-create-grid">
          <section class="policy-alignment-choice-panel">
            <strong>${escapeHtml(langText('Source material', 'Source material'))}</strong>
            <div class="policy-alignment-selected-strategy">
              <div class="policy-alignment-selected-strategy-head">
                <strong>${escapeHtml(langText('Selected Digistrategy strategy', 'Selected Digistrategy strategy'))}</strong>
                <span class="tag">${escapeHtml(langText('Institution', 'Institution'))}: ${escapeHtml(selectedInstitutionTitle)}</span>
              </div>
              <div class="policy-alignment-selected-strategy-title">${escapeHtml(selectedStrategyTitle)}</div>
            </div>
            <p class="prompt">${escapeHtml(langText('Pasirinkite, ar analizė remsis dabartine Digistrategy medžiaga, išoriniais PDF dokumentais, ar abiem šaltiniais kartu.', 'Choose whether the analysis should rely on current Digistrategy content, external PDF documents, or both combined.'))}</p>
            <label class="policy-alignment-source-option">
              <input type="radio" name="sourceMode" value="existing_strategy" checked />
              <span>
                <strong>${escapeHtml(langText('Naudoti Digistrategy strategiją', 'Use Digistrategy strategy'))}</strong>
                <small>${escapeHtml(langText('Naudojamas pasirinktos strategijos turinys iš Digistrategy.', 'Use the selected strategy content already stored in Digistrategy.'))}</small>
              </span>
            </label>
            <label class="policy-alignment-source-option">
              <input type="radio" name="sourceMode" value="uploaded_document" />
              <span>
                <strong>${escapeHtml(langText('Naudoti išorinius dokumentus', 'Use external documents'))}</strong>
                <small>${escapeHtml(langText('Analizė remsis tik jūsų įkeltais PDF dokumentais.', 'The analysis will rely only on the PDF documents you upload.'))}</small>
              </span>
            </label>
            <label class="policy-alignment-source-option">
              <input type="radio" name="sourceMode" value="mixed" />
              <span>
                <strong>${escapeHtml(langText('Naudoti abu šaltinius', 'Use both sources'))}</strong>
                <small>${escapeHtml(langText('Sujungiama Digistrategy medžiaga ir išoriniai PDF dokumentai.', 'Combine Digistrategy content with external PDF documents.'))}</small>
              </span>
            </label>
            <label class="policy-alignment-upload-card">
              <strong>${escapeHtml(langText('External source documents', 'External source documents'))}</strong>
              <span class="prompt" id="policyAlignmentSourceFilesHint">${escapeHtml(langText('Pasirinkite, jei analizė turi vertinti papildomus PDF šaltinius.', 'Choose files if the analysis should evaluate additional PDF sources.'))}</span>
              <input type="file" id="policyAlignmentSourceFiles" accept="application/pdf,.pdf" multiple />
            </label>
          </section>
          <section class="policy-alignment-choice-panel">
            <strong>${escapeHtml(langText('Policy framework', 'Policy framework'))}</strong>
            <p class="prompt">${escapeHtml(langText('Pasirinkite, su kuriuo paruoštu politikos karkasu bus lyginama analizė.', 'Select the prepared policy framework that this analysis should compare against.'))}</p>
            <select name="targetFrameworkId" id="policyAlignmentFrameworkSelect">
              ${readyFrameworks.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedFrameworkId ? 'selected' : ''}>${escapeHtml(item.title)} (${item.requirementCount})</option>`).join('')}
            </select>
            <div class="policy-alignment-framework-choice-meta" id="policyAlignmentFrameworkChoiceMeta"></div>
          </section>
        </div>
        <div id="policyAlignmentCreateError" class="auth-error" style="display:none;"></div>
        <div class="form-actions">
          <button type="submit" id="policyAlignmentCreateSubmit" class="btn btn-primary">${escapeHtml(langText('Run analysis', 'Run analysis'))}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeModal = () => {
    const current = document.getElementById('policyAlignmentCreateOverlay');
    if (current) current.remove();
  };
  const closeBtn = overlay.querySelector('#closePolicyAlignmentCreateModal');
  const form = overlay.querySelector('#policyAlignmentCreateForm');
  const errorBox = overlay.querySelector('#policyAlignmentCreateError');
  const submitButton = overlay.querySelector('#policyAlignmentCreateSubmit');
  const sourceInput = overlay.querySelector('#policyAlignmentSourceFiles');
  const sourceModeInputs = Array.from(overlay.querySelectorAll('input[name="sourceMode"]'));
  const sourceHint = overlay.querySelector('#policyAlignmentSourceFilesHint');
  const frameworkSelect = overlay.querySelector('#policyAlignmentFrameworkSelect');
  const frameworkMeta = overlay.querySelector('#policyAlignmentFrameworkChoiceMeta');

  function showError(message) {
    const text = String(message || '').trim();
    errorBox.textContent = text;
    errorBox.style.display = text ? 'block' : 'none';
    if (text) notifyError(text);
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });

  function updateSourceUploadState() {
    const sourceMode = String(form?.querySelector('input[name="sourceMode"]:checked')?.value || 'existing_strategy').trim().toLowerCase();
    const uploadRequired = sourceMode === 'uploaded_document';
    if (sourceInput) {
      sourceInput.required = uploadRequired;
    }
    if (sourceHint) {
      sourceHint.textContent = uploadRequired
        ? langText('Šie PDF dokumentai yra privalomi, nes analizė remsis tik išoriniais šaltiniais.', 'These PDF files are required because the analysis will rely only on external sources.')
        : langText('Įkelkite PDF dokumentus tik jei reikia papildyti Digistrategy turinį išoriniais šaltiniais.', 'Upload PDF documents only if you need to supplement Digistrategy content with external sources.');
    }
  }

  function updateFrameworkChoiceMeta() {
    const selected = readyFrameworks.find((item) => item.id === String(frameworkSelect?.value || '').trim()) || null;
    if (!frameworkMeta) return;
    frameworkMeta.innerHTML = selected
      ? `<div class="policy-alignment-chip-list">
          <span class="tag">${escapeHtml(langText('Requirements', 'Requirements'))}: ${Number(selected.requirementCount || 0)}</span>
          <span class="tag">${escapeHtml(langText('Documents', 'Documents'))}: ${Number(selected.documentCount || 0)}</span>
          <span class="tag">${escapeHtml(formatCommentDateTime(selected.updatedAt || selected.createdAt))}</span>
        </div>`
      : '';
  }

  sourceModeInputs.forEach((input) => input.addEventListener('change', updateSourceUploadState));
  frameworkSelect?.addEventListener('change', updateFrameworkChoiceMeta);
  updateSourceUploadState();
  updateFrameworkChoiceMeta();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');
    if (!submitButton) return;
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim();
    const sourceMode = String(fd.get('sourceMode') || 'existing_strategy').trim().toLowerCase();
    const targetFrameworkId = String(fd.get('targetFrameworkId') || '').trim();
    const localeHint = String(fd.get('localeHint') || currentLanguage() || 'en').trim().toLowerCase();
    const sourceFiles = Array.from(sourceInput?.files || []);

    if (!title) {
      showError(toUserMessage(new Error('analysis title required')));
      return;
    }
    if (!targetFrameworkId) {
      showError(toUserMessage(new Error('analysis target framework required')));
      return;
    }
    if (sourceMode === 'uploaded_document' && !sourceFiles.length) {
      showError(toUserMessage(new Error('source material required')));
      return;
    }

    submitButton.disabled = true;
    const initialLabel = submitButton.textContent;
    submitButton.textContent = langText('Starting...', 'Starting...');
    try {
      const created = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/policy-alignments`, {
        method: 'POST',
        body: {
          title,
          description,
          sourceMode,
          targetMode: 'framework',
          targetFrameworkId
        }
      });
      const analysisId = String(created?.analysis?.id || '').trim();
      if (!analysisId) throw new Error('analysis not found');

      if (sourceFiles.length) {
        const sourceForm = new FormData();
        sourceForm.append('role', 'source');
        sourceForm.append('replaceExisting', 'true');
        sourceFiles.forEach((file) => sourceForm.append('documents', file));
        await api(`/api/v1/policy-alignments/${encodeURIComponent(analysisId)}/documents`, {
          method: 'POST',
          body: sourceForm
        });
      }

      const executed = await api(`/api/v1/policy-alignments/${encodeURIComponent(analysisId)}/run`, {
        method: 'POST',
        body: { localeHint, saveTargetAsFramework: false }
      });
      const finalAnalysis = normalizePolicyAlignmentAnalysis(executed?.analysis);
      if (finalAnalysis) {
        state.policyAlignmentCurrent = finalAnalysis;
        state.policyAlignmentSelectedId = finalAnalysis.id;
      }
      state.policyAlignmentWorkspaceTab = 'strategy-analysis';
      await refreshPolicyAlignments({ selectedId: analysisId, silent: true });
      schedulePolicyAlignmentAnalysisPoll(analysisId, 2500);
      closeModal();
      notifySuccess(langText('Policy Alignment analysis started. It is processing in the background.', 'Policy Alignment analysis started. It is processing in the background.'));
      render();
    } catch (error) {
      showError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
    }
  });
}

async function loadPolicyAlignmentStrategyChoice(strategySlug) {
  const normalizedStrategySlug = normalizeSlug(strategySlug) || normalizeSlug(state.strategySlug);
  if (!state.institutionSlug || !normalizedStrategySlug) throw new Error('strategy not selected');
  const params = new URLSearchParams();
  params.set('strategy', normalizedStrategySlug);
  const summaryPayload = await api(
    `/api/v1/public/institutions/${encodeURIComponent(state.institutionSlug)}/cycles/current/summary?${params.toString()}`,
    { auth: 'optional' }
  );
  const strategy = normalizeStrategyRecord(summaryPayload?.strategy)
    || strategiesForSelectedInstitution().find((item) => normalizeSlug(item?.slug) === normalizedStrategySlug)
    || null;
  const cycle = summaryPayload?.cycle || null;
  if (!cycle?.id) throw new Error('strategy cycle not found');
  const frameworkPayload = await api(`/api/v1/cycles/${encodeURIComponent(cycle.id)}/policy-alignment-frameworks`);
  const frameworks = sortedPolicyAlignmentFrameworks(
    (Array.isArray(frameworkPayload?.frameworks) ? frameworkPayload.frameworks : [])
      .map((item) => normalizePolicyAlignmentFramework(item))
      .filter(Boolean)
  ).filter((item) => policyAlignmentFrameworkReady(item));
  return { strategy, cycle, frameworks };
}

async function switchPolicyAlignmentStrategyContext(strategySlug) {
  const normalizedStrategySlug = normalizeSlug(strategySlug);
  if (!normalizedStrategySlug || normalizedStrategySlug === normalizeSlug(state.strategySlug)) return;
  state.strategySlug = normalizedStrategySlug;
  const strategies = strategiesForSelectedInstitution();
  const matched = strategies.find((item) => normalizeSlug(item?.slug) === normalizedStrategySlug) || null;
  if (matched) state.strategy = matched;
  rememberStrategySlugForInstitution(state.institutionSlug, normalizedStrategySlug);
  if (state.token && !state.embedMapMode) {
    await switchInstitutionSession(state.institutionSlug, normalizedStrategySlug);
  }
  await bootstrap();
}

function openPolicyAlignmentStrategyCreateModal() {
  if (state.role !== 'institution_admin') {
    notifyError(langText('Tik administratoriai gali kurti strategijos analizes.', 'Only administrators can create strategy analyses.'));
    return;
  }
  const strategyOptions = strategiesForSelectedInstitution();
  const defaultStrategySlug = normalizeSlug(state.strategySlug) || normalizeSlug(strategyOptions[0]?.slug);
  if (!defaultStrategySlug) {
    notifyError(langText('Pasirinktoje institucijoje nėra prieinamų strategijų analizei.', 'There are no available strategies to analyse in this institution.'));
    return;
  }

  const existing = document.getElementById('policyAlignmentCreateOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'policyAlignmentCreateOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card" role="dialog" aria-modal="true" aria-labelledby="policyAlignmentCreateTitle">
      <button type="button" class="btn btn-ghost policy-alignment-modal-close" id="closePolicyAlignmentCreateModal" aria-label="${escapeHtml(langText('Uždaryti', 'Close'))}">×</button>
      <div class="auth-modal-header">
        <div>
          <h3 id="policyAlignmentCreateTitle">${escapeHtml(langText('Create strategy analysis', 'Create strategy analysis'))}</h3>
          <p class="prompt" style="margin: 6px 0 0;">${escapeHtml(langText('Pasirinkite strategiją savo institucijoje ir politikos karkasą, su kuriuo ją vertinsite.', 'Choose a strategy in your institution and the policy framework against which it will be evaluated.'))}</p>
        </div>
      </div>
      <form id="policyAlignmentCreateForm" class="policy-alignment-create-form policy-alignment-create-form-split">
        <div class="policy-alignment-create-grid">
          <section class="policy-alignment-choice-panel">
            <strong>${escapeHtml(langText('Strategy analysis source', 'Strategy analysis source'))}</strong>
            <label>
              <span>${escapeHtml(langText('Strategy', 'Strategy'))}</span>
              <select name="strategySlug" id="policyAlignmentStrategySelect">
                ${strategyOptions.map((item) => `<option value="${escapeHtml(item.slug)}" ${normalizeSlug(item.slug) === defaultStrategySlug ? 'selected' : ''}>${escapeHtml(item.title || item.slug)}</option>`).join('')}
              </select>
            </label>
            <div class="policy-alignment-selected-strategy" id="policyAlignmentSelectedStrategyCard"></div>
          </section>
          <section class="policy-alignment-choice-panel">
            <strong>${escapeHtml(langText('Policy framework', 'Policy framework'))}</strong>
            <label>
              <span>${escapeHtml(langText('Framework', 'Framework'))}</span>
              <select name="targetFrameworkId" id="policyAlignmentFrameworkSelect"></select>
            </label>
            <div class="policy-alignment-framework-choice-meta" id="policyAlignmentFrameworkChoiceMeta"></div>
          </section>
        </div>
        <div id="policyAlignmentCreateError" class="auth-error" style="display:none;"></div>
        <div class="form-actions">
          <button type="submit" id="policyAlignmentCreateSubmit" class="btn btn-primary">${escapeHtml(langText('Run analysis', 'Run analysis'))}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeModal = () => {
    const current = document.getElementById('policyAlignmentCreateOverlay');
    if (current) current.remove();
  };
  const closeBtn = overlay.querySelector('#closePolicyAlignmentCreateModal');
  const form = overlay.querySelector('#policyAlignmentCreateForm');
  const errorBox = overlay.querySelector('#policyAlignmentCreateError');
  const submitButton = overlay.querySelector('#policyAlignmentCreateSubmit');
  const strategySelect = overlay.querySelector('#policyAlignmentStrategySelect');
  const frameworkSelect = overlay.querySelector('#policyAlignmentFrameworkSelect');
  const frameworkMeta = overlay.querySelector('#policyAlignmentFrameworkChoiceMeta');
  const strategyCard = overlay.querySelector('#policyAlignmentSelectedStrategyCard');
  const modalState = { current: null, loading: false };

  function showError(message) {
    const text = String(message || '').trim();
    errorBox.textContent = text;
    errorBox.style.display = text ? 'block' : 'none';
    if (text) notifyError(text);
  }

  function renderStrategyCard() {
    const current = modalState.current;
    if (!strategyCard) return;
    if (!current?.strategy) {
      strategyCard.innerHTML = `<p class="prompt">${escapeHtml(langText('Nepavyko įkelti pasirinktos strategijos konteksto.', 'Could not load the selected strategy context.'))}</p>`;
      return;
    }
    strategyCard.innerHTML = `
      <div class="policy-alignment-selected-strategy-head">
        <strong>${escapeHtml(langText('Selected Digistrategy strategy', 'Selected Digistrategy strategy'))}</strong>
        <span class="tag">${escapeHtml(langText('Institution', 'Institution'))}: ${escapeHtml(state.institution?.name || state.institutionSlug || '-')}</span>
      </div>
      <div class="policy-alignment-selected-strategy-title">${escapeHtml(current.strategy.title || current.strategy.slug || '-')}</div>
      <div class="policy-alignment-chip-list">
        ${current.cycle?.title ? `<span class="tag">${escapeHtml(langText('Cycle', 'Cycle'))}: ${escapeHtml(current.cycle.title)}</span>` : ''}
        <span class="tag">${escapeHtml(langText('Strategy slug', 'Strategy slug'))}: ${escapeHtml(current.strategy.slug || '-')}</span>
      </div>
    `;
  }

  function updateFrameworkChoiceMeta() {
    if (!frameworkMeta) return;
    const frameworks = Array.isArray(modalState.current?.frameworks) ? modalState.current.frameworks : [];
    const selected = frameworks.find((item) => item.id === String(frameworkSelect?.value || '').trim()) || null;
    frameworkMeta.innerHTML = selected
      ? `<div class="policy-alignment-chip-list">
          <span class="tag">${escapeHtml(langText('Requirements', 'Requirements'))}: ${Number(selected.requirementCount || 0)}</span>
          <span class="tag">${escapeHtml(langText('Documents', 'Documents'))}: ${Number(selected.documentCount || 0)}</span>
          <span class="tag">${escapeHtml(formatCommentDateTime(selected.updatedAt || selected.createdAt))}</span>
        </div>`
      : `<p class="prompt">${escapeHtml(langText('Pirma paruoškite bent vieną politikos karkasą šiai strategijai.', 'Prepare at least one policy framework for this strategy first.'))}</p>`;
  }

  function renderFrameworkOptions() {
    if (!frameworkSelect) return;
    const frameworks = Array.isArray(modalState.current?.frameworks) ? modalState.current.frameworks : [];
    const selectedId = String(frameworkSelect.value || frameworks[0]?.id || '').trim();
    frameworkSelect.innerHTML = frameworks.length
      ? frameworks.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedId ? 'selected' : ''}>${escapeHtml(item.title)} (${Number(item.requirementCount || 0)})</option>`).join('')
      : `<option value="">${escapeHtml(langText('No ready frameworks for this strategy', 'No ready frameworks for this strategy'))}</option>`;
    frameworkSelect.disabled = !frameworks.length || modalState.loading;
    updateFrameworkChoiceMeta();
  }

  async function refreshModalStrategyContext() {
    const selectedStrategySlug = normalizeSlug(strategySelect?.value || '');
    if (!selectedStrategySlug) return;
    modalState.loading = true;
    submitButton.disabled = true;
    showError('');
    frameworkMeta.innerHTML = `<p class="prompt">${escapeHtml(langText('Įkeliami strategijos politikos karkasai...', 'Loading policy frameworks for the selected strategy...'))}</p>`;
    try {
      modalState.current = await loadPolicyAlignmentStrategyChoice(selectedStrategySlug);
      renderStrategyCard();
      renderFrameworkOptions();
    } catch (error) {
      modalState.current = null;
      renderStrategyCard();
      if (frameworkSelect) {
        frameworkSelect.innerHTML = `<option value="">${escapeHtml(langText('Framework not available', 'Framework not available'))}</option>`;
        frameworkSelect.disabled = true;
      }
      frameworkMeta.innerHTML = '';
      showError(toUserMessage(error));
    } finally {
      modalState.loading = false;
      submitButton.disabled = !modalState.current?.frameworks?.length;
    }
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  strategySelect?.addEventListener('change', () => {
    void refreshModalStrategyContext();
  });
  frameworkSelect?.addEventListener('change', updateFrameworkChoiceMeta);
  void refreshModalStrategyContext();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');
    if (!submitButton) return;
    const selectedStrategySlug = normalizeSlug(strategySelect?.value || '');
    const selectedFrameworkId = String(frameworkSelect?.value || '').trim();
    const current = modalState.current;
    if (!selectedStrategySlug || !current?.cycle?.id || !current?.strategy) {
      showError(toUserMessage(new Error('strategy not selected')));
      return;
    }
    if (!selectedFrameworkId) {
      showError(toUserMessage(new Error('analysis target framework required')));
      return;
    }

    submitButton.disabled = true;
    const initialLabel = submitButton.textContent;
    submitButton.textContent = langText('Starting...', 'Starting...');
    try {
      const chosenFramework = current.frameworks.find((item) => item.id === selectedFrameworkId) || null;
      const title = `${current.strategy.title || current.strategy.slug || 'Strategy'} - ${chosenFramework?.title || 'Framework'}`;
      const created = await api(`/api/v1/cycles/${encodeURIComponent(current.cycle.id)}/policy-alignments`, {
        method: 'POST',
        body: {
          title,
          description: '',
          sourceMode: 'existing_strategy',
          targetMode: 'framework',
          targetFrameworkId: selectedFrameworkId
        }
      });
      const analysisId = String(created?.analysis?.id || '').trim();
      if (!analysisId) throw new Error('analysis not found');
      await api(`/api/v1/policy-alignments/${encodeURIComponent(analysisId)}/run`, {
        method: 'POST',
        body: { localeHint: currentLanguage(), saveTargetAsFramework: false }
      });

      if (selectedStrategySlug !== normalizeSlug(state.strategySlug)) {
        await switchPolicyAlignmentStrategyContext(selectedStrategySlug);
      }
      state.policyAlignmentWorkspaceTab = 'strategy-analysis';
      state.policyAlignmentAnalysisSubview = 'overview';
      state.policyAlignmentSelectedId = analysisId;
      await refreshPolicyAlignments({ selectedId: analysisId, silent: true });
      schedulePolicyAlignmentAnalysisPoll(analysisId, 2500);
      closeModal();
      notifySuccess(langText('Strategijos analizė pradėta. Ji vykdoma fone.', 'Strategy analysis started. It is processing in the background.'));
      render();
    } catch (error) {
      showError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
    }
  });
}

function openPolicyAlignmentExternalCreateModal() {
  if (!state.cycle?.id) return;
  if (state.role !== 'institution_admin') {
    notifyError(langText('Tik administratoriai gali kurti išorines analizes.', 'Only administrators can create external analyses.'));
    return;
  }
  const frameworks = sortedPolicyAlignmentFrameworks(state.policyAlignmentFrameworks).filter((item) => policyAlignmentFrameworkReady(item));
  const selectedFrameworkId = String(state.policyAlignmentFrameworkSelectedId || frameworks[0]?.id || '').trim();
  if (!selectedFrameworkId) {
    notifyError(langText('Pirmiausia paruoškite politikos karkasą, tada paleiskite išorinę analizę.', 'Build a ready policy framework first, then run an external analysis.'));
    return;
  }

  const existing = document.getElementById('policyAlignmentCreateOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'policyAlignmentCreateOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card" role="dialog" aria-modal="true" aria-labelledby="policyAlignmentCreateTitle">
      <button type="button" class="btn btn-ghost policy-alignment-modal-close" id="closePolicyAlignmentCreateModal" aria-label="${escapeHtml(langText('Uždaryti', 'Close'))}">×</button>
      <div class="auth-modal-header">
        <div>
          <h3 id="policyAlignmentCreateTitle">${escapeHtml(langText('Create external analysis', 'Create external analysis'))}</h3>
          <p class="prompt" style="margin: 6px 0 0;">${escapeHtml(langText('Įkelkite išorinius PDF dokumentus ir pasirinkite politikos karkasą, su kuriuo jie bus lyginami.', 'Upload external PDF documents and choose the policy framework against which they will be evaluated.'))}</p>
        </div>
      </div>
      <form id="policyAlignmentCreateForm" class="policy-alignment-create-form policy-alignment-create-form-split">
        <div class="policy-alignment-create-grid">
          <section class="policy-alignment-choice-panel">
            <strong>${escapeHtml(langText('External source documents', 'External source documents'))}</strong>
            <label class="policy-alignment-upload-card">
              <span class="prompt">${escapeHtml(langText('Įkelkite vieną ar daugiau PDF dokumentų, kurie bus vertinami prieš pasirinktą politikos karkasą.', 'Upload one or more PDF documents that will be evaluated against the selected policy framework.'))}</span>
              <input type="file" id="policyAlignmentSourceFiles" accept="application/pdf,.pdf" multiple required />
            </label>
          </section>
          <section class="policy-alignment-choice-panel">
            <strong>${escapeHtml(langText('Policy framework', 'Policy framework'))}</strong>
            <label>
              <span>${escapeHtml(langText('Framework', 'Framework'))}</span>
              <select name="targetFrameworkId" id="policyAlignmentFrameworkSelect">
                ${frameworks.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedFrameworkId ? 'selected' : ''}>${escapeHtml(item.title)} (${Number(item.requirementCount || 0)})</option>`).join('')}
              </select>
            </label>
            <div class="policy-alignment-framework-choice-meta" id="policyAlignmentFrameworkChoiceMeta"></div>
          </section>
        </div>
        <div id="policyAlignmentCreateError" class="auth-error" style="display:none;"></div>
        <div class="form-actions">
          <button type="submit" id="policyAlignmentCreateSubmit" class="btn btn-primary">${escapeHtml(langText('Run analysis', 'Run analysis'))}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeModal = () => {
    const current = document.getElementById('policyAlignmentCreateOverlay');
    if (current) current.remove();
  };
  const closeBtn = overlay.querySelector('#closePolicyAlignmentCreateModal');
  const form = overlay.querySelector('#policyAlignmentCreateForm');
  const errorBox = overlay.querySelector('#policyAlignmentCreateError');
  const submitButton = overlay.querySelector('#policyAlignmentCreateSubmit');
  const sourceInput = overlay.querySelector('#policyAlignmentSourceFiles');
  const frameworkSelect = overlay.querySelector('#policyAlignmentFrameworkSelect');
  const frameworkMeta = overlay.querySelector('#policyAlignmentFrameworkChoiceMeta');

  function showError(message) {
    const text = String(message || '').trim();
    errorBox.textContent = text;
    errorBox.style.display = text ? 'block' : 'none';
    if (text) notifyError(text);
  }

  function updateFrameworkChoiceMeta() {
    const selected = frameworks.find((item) => item.id === String(frameworkSelect?.value || '').trim()) || null;
    frameworkMeta.innerHTML = selected
      ? `<div class="policy-alignment-chip-list">
          <span class="tag">${escapeHtml(langText('Requirements', 'Requirements'))}: ${Number(selected.requirementCount || 0)}</span>
          <span class="tag">${escapeHtml(langText('Documents', 'Documents'))}: ${Number(selected.documentCount || 0)}</span>
          <span class="tag">${escapeHtml(formatCommentDateTime(selected.updatedAt || selected.createdAt))}</span>
        </div>`
      : '';
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  frameworkSelect?.addEventListener('change', updateFrameworkChoiceMeta);
  updateFrameworkChoiceMeta();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');
    if (!submitButton) return;
    const targetFrameworkId = String(frameworkSelect?.value || '').trim();
    const sourceFiles = Array.from(sourceInput?.files || []);
    if (!targetFrameworkId) {
      showError(toUserMessage(new Error('analysis target framework required')));
      return;
    }
    if (!sourceFiles.length) {
      showError(toUserMessage(new Error('source material required')));
      return;
    }

    submitButton.disabled = true;
    const initialLabel = submitButton.textContent;
    submitButton.textContent = langText('Starting...', 'Starting...');
    try {
      const selectedFramework = frameworks.find((item) => item.id === targetFrameworkId) || null;
      const title = `${langText('External analysis', 'External analysis')} - ${selectedFramework?.title || 'Framework'}`;
      const created = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/policy-alignments`, {
        method: 'POST',
        body: {
          title,
          description: '',
          sourceMode: 'uploaded_document',
          targetMode: 'framework',
          targetFrameworkId
        }
      });
      const analysisId = String(created?.analysis?.id || '').trim();
      if (!analysisId) throw new Error('analysis not found');

      const sourceForm = new FormData();
      sourceForm.append('role', 'source');
      sourceForm.append('replaceExisting', 'true');
      sourceFiles.forEach((file) => sourceForm.append('documents', file));
      await api(`/api/v1/policy-alignments/${encodeURIComponent(analysisId)}/documents`, {
        method: 'POST',
        body: sourceForm
      });

      await api(`/api/v1/policy-alignments/${encodeURIComponent(analysisId)}/run`, {
        method: 'POST',
        body: { localeHint: currentLanguage(), saveTargetAsFramework: false }
      });

      state.policyAlignmentWorkspaceTab = 'external-analysis';
      state.policyAlignmentAnalysisSubview = 'overview';
      state.policyAlignmentSelectedId = analysisId;
      await refreshPolicyAlignments({ selectedId: analysisId, silent: true });
      schedulePolicyAlignmentAnalysisPoll(analysisId, 2500);
      closeModal();
      notifySuccess(langText('Išorinė analizė pradėta. Ji vykdoma fone.', 'External analysis started. It is processing in the background.'));
      render();
    } catch (error) {
      showError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
    }
  });
}

function openPolicyAlignmentCreateModal() {
  const workspaceTab = policyAlignmentWorkspaceTabKey();
  if (workspaceTab === 'external-analysis') {
    openPolicyAlignmentExternalCreateModal();
    return;
  }
  openPolicyAlignmentStrategyCreateModal();
}

async function deletePolicyAlignmentAnalysis(analysisId) {
  const finalAnalysisId = String(analysisId || '').trim();
  if (!finalAnalysisId || state.role !== 'institution_admin') return;

  const confirmed = window.confirm(
    langText(
      'Ar tikrai norite pašalinti šią Policy Alignment analizę? Susiję dokumentai, radiniai ir siūlymai bus ištrinti.',
      'Do you want to remove this Policy Alignment analysis? Related documents, findings, and suggestions will be deleted.'
    )
  );
  if (!confirmed) return;

  try {
    await api(`/api/v1/policy-alignments/${encodeURIComponent(finalAnalysisId)}/delete`, {
      method: 'POST',
      body: {}
    });
    if (String(state.policyAlignmentSelectedId || '').trim() === finalAnalysisId) {
      state.policyAlignmentSelectedId = '';
      state.policyAlignmentCurrent = null;
    }
    await refreshPolicyAlignments({ silent: true });
    notifySuccess(langText('Policy Alignment analizė pašalinta.', 'Policy Alignment analysis removed.'));
    render();
  } catch (error) {
    notifyError(toUserMessage(error));
  }
}

async function deletePolicyAlignmentFramework(frameworkId) {
  const finalFrameworkId = String(frameworkId || '').trim();
  if (!finalFrameworkId || state.role !== 'institution_admin') return;

  const confirmed = window.confirm(
    langText(
      'Ar tikrai norite pašalinti šį politikos karkasą? Su juo susieti dokumentai ir ištraukti reikalavimai bus ištrinti.',
      'Do you want to remove this policy framework? Its documents and extracted requirements will be deleted.'
    )
  );
  if (!confirmed) return;

  try {
    await api(`/api/v1/policy-alignment-frameworks/${encodeURIComponent(finalFrameworkId)}/delete`, {
      method: 'POST',
      body: {}
    });
    if (String(state.policyAlignmentFrameworkSelectedId || '').trim() === finalFrameworkId) {
      state.policyAlignmentFrameworkSelectedId = '';
      state.policyAlignmentFrameworkCurrent = null;
    }
    await refreshPolicyAlignmentFrameworks({ silent: true });
    notifySuccess(langText('Politikos karkasas pašalintas.', 'Policy framework removed.'));
    render();
  } catch (error) {
    notifyError(toUserMessage(error));
  }
}
function renderPolicyAlignmentView() {
  if (!state.institutionSlug) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Pasirinkite instituciją', 'Select an institution')}</strong>
      </div>
    `;
    return;
  }

  if (!isLoggedIn()) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${langText('Prisijunkite', 'Sign in required')}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${langText('Policy Alignment prieinamas tik prisijungusiems institucijos nariams.', 'Policy Alignment is available to signed-in institution members only.')}</p>
        <button id="openAuthFromPolicyAlignment" class="btn btn-primary" style="margin-top: 12px;">${langText('Prisijungti', 'Sign in')}</button>
      </div>
    `;
    const authBtn = elements.stepView.querySelector('#openAuthFromPolicyAlignment');
    if (authBtn) authBtn.addEventListener('click', () => showAuthModal('login'));
    return;
  }

  if (!state.cycle?.id) {
    elements.stepView.innerHTML = `<div class="card"><strong>${escapeHtml(langText('Aktyvus ciklas nerastas', 'Active cycle not found'))}</strong></div>`;
    return;
  }

  const activeCycleId = String(state.cycle.id || '').trim();
  if (!state.policyAlignmentLoading && state.policyAlignmentCycleId !== activeCycleId) {
    state.policyAlignmentCurrent = null;
    state.policyAlignmentSelectedId = '';
    state.policyAlignmentFrameworkCurrent = null;
    state.policyAlignmentFrameworkSelectedId = '';
    void refreshPolicyAlignments({ silent: false });
    void refreshPolicyAlignmentFrameworks({ silent: false });
  } else if (
    !state.policyAlignmentLoading
    && state.policyAlignmentSelectedId
    && (
      !state.policyAlignmentCurrent
      || state.policyAlignmentCurrent.id !== state.policyAlignmentSelectedId
      || !state.policyAlignmentCurrent.detailLoaded
    )
    && !state.policyAlignmentDetailLoading
  ) {
    void loadPolicyAlignmentDetail(state.policyAlignmentSelectedId, { silent: true }).then(() => render());
  }
  if (
    !state.policyAlignmentFrameworkLoading
    && state.policyAlignmentFrameworkSelectedId
    && (!state.policyAlignmentFrameworkCurrent || state.policyAlignmentFrameworkCurrent.id !== state.policyAlignmentFrameworkSelectedId || !Array.isArray(state.policyAlignmentFrameworkCurrent.requirements))
    && !state.policyAlignmentFrameworkDetailLoading
  ) {
    void loadPolicyAlignmentFrameworkDetail(state.policyAlignmentFrameworkSelectedId, { silent: false });
  }

  const selectedAnalysisState = selectedPolicyAlignmentFromState();
  const framework = selectedPolicyAlignmentFrameworkFromState();
  const frameworks = sortedPolicyAlignmentFrameworks(state.policyAlignmentFrameworks);
  const processingFrameworks = frameworks.filter((item) => policyAlignmentFrameworkBuildState(item) === 'processing');
  const frameworkById = new Map(frameworks.map((item) => [item.id, item]));
  const activeTab = policyAlignmentWorkspaceTabKey();
  const allAnalyses = sortedPolicyAlignments(state.policyAlignments);
  const analysisTabActive = activeTab === 'strategy-analysis' || activeTab === 'external-analysis';
  const analyses = analysisTabActive
    ? allAnalyses.filter((item) => policyAlignmentAnalysisBucketForMode(item?.sourceMode) === activeTab)
    : allAnalyses;
  const analysisCandidate = analysisTabActive
    ? (() => {
        const selectedId = String(state.policyAlignmentSelectedId || '').trim();
        return analyses.find((item) => item.id === selectedId) || analyses[0] || null;
      })()
    : selectedAnalysisState;
  if (analysisTabActive) {
    if (analysisCandidate && analysisCandidate.id !== String(state.policyAlignmentSelectedId || '').trim()) {
      state.policyAlignmentSelectedId = analysisCandidate.id;
      state.policyAlignmentCurrent = analysisCandidate;
      if (!analysisCandidate.detailLoaded) void loadPolicyAlignmentDetail(analysisCandidate.id, { silent: true });
    } else if (!analysisCandidate) {
      state.policyAlignmentSelectedId = '';
      state.policyAlignmentCurrent = null;
    }
  }
  const analysis = analysisTabActive ? analysisCandidate : selectedAnalysisState;
  const effectiveGroupBy = activeTab === 'strategy-analysis' ? 'none' : state.policyAlignmentGroupBy;
  const {
    filteredFindings,
    grouped,
    suggestions,
    suggestionByFindingId,
    sourceRefById,
    themeOptions
  } = buildPolicyAlignmentFindingsModel(analysis, { groupBy: effectiveGroupBy });
  const analysisSubviewRaw = String(state.policyAlignmentAnalysisSubview || 'overview').trim().toLowerCase();
  const analysisSubview = ['overview', 'analysis', 'actions'].includes(analysisSubviewRaw) ? analysisSubviewRaw : 'overview';
  const supportsActionPanel = activeTab === 'strategy-analysis';
  const effectiveAnalysisSubview = !supportsActionPanel && analysisSubview === 'actions' ? 'overview' : analysisSubview;
  state.policyAlignmentSidebarCollapsed = false;
  const sidebarCollapsed = false;
  const frameworkDocuments = Array.isArray(framework?.documents) ? framework.documents : [];
  const frameworkRequirements = Array.isArray(framework?.requirements) ? framework.requirements : [];
  const analysisProcessing = ['draft', 'queued', 'processing'].includes(String(analysis?.status || '').trim().toLowerCase());
  const frameworkAnalyses = framework
    ? allAnalyses.filter((item) => String(item?.targetFrameworkId || '').trim() === String(framework.id || '').trim())
    : [];
  const overview = buildPolicyAlignmentOverviewData(analysis, frameworkById);

  if (analysisTabActive && analysis?.id && analysisProcessing && !state.policyAlignmentAnalysisPollTimerId) {
    schedulePolicyAlignmentAnalysisPoll(analysis.id, 2500);
  }

  elements.stepView.innerHTML = `
    ${processingFrameworks.length
      ? `<div class="card policy-alignment-processing-banner" style="margin-bottom: 12px;">
          ${renderPolicyAlignmentProcessingIndicator(langText('Fone apdorojamas politikos karkasas', 'Policy framework is processing in the background'))}
          <strong>${escapeHtml(langText('Apdorojimas vyksta fone. Puslapis atsinaujina automatiškai, kai ištraukti reikalavimai bus paruošti.', 'Background processing is in progress. This page refreshes automatically when extracted requirements are ready.'))}</strong>
        </div>`
      : ''}

    ${state.policyAlignmentError ? `<div class="card" style="margin-bottom: 12px;"><strong>${escapeHtml(state.policyAlignmentError)}</strong></div>` : ''}
    ${(state.policyAlignmentLoading || state.policyAlignmentFrameworkLoading || state.policyAlignmentFrameworkDetailLoading)
      ? `<div class="card" style="margin-bottom: 12px;"><strong>${escapeHtml(langText('Atnaujinami Policy Alignment duomenys...', 'Refreshing Policy Alignment data...'))}</strong></div>`
      : ''}

    <section class="policy-alignment-layout${sidebarCollapsed ? ' sidebar-collapsed' : ''}">
      <div class="policy-alignment-column policy-alignment-sidebar">
        ${activeTab === 'frameworks'
          ? `
              <div class="card">
                <div class="guideline-group-header">
                  <strong>${escapeHtml(langText('Politikos karkasų biblioteka', 'Policy framework library'))}</strong>
                  <span class="tag">${frameworks.length}</span>
                </div>
                <div class="policy-alignment-sidebar-actions">
                  <button id="openPolicyAlignmentFrameworkCreateBtn" class="btn btn-primary" ${state.role === 'institution_admin' ? '' : 'disabled'}>${escapeHtml(langText('Naujas politikos karkasas', 'New policy framework'))}</button>
                </div>
                ${state.policyAlignmentFrameworkError ? `<p class="prompt">${escapeHtml(state.policyAlignmentFrameworkError)}</p>` : ''}
                ${frameworks.length
                  ? `<div class="policy-alignment-analysis-list">
                      ${frameworks.map((item) => `
                        <div class="policy-alignment-analysis-row${framework?.id === item.id ? ' active' : ''}">
                          <button
                            type="button"
                            class="policy-alignment-analysis-item${framework?.id === item.id ? ' active' : ''}"
                            data-action="select-policy-framework"
                            data-framework-id="${escapeHtml(item.id)}"
                          >
                            <strong>${escapeHtml(item.title || item.id)}</strong>
                            ${policyAlignmentFrameworkBuildState(item) === 'processing'
                              ? `<span class="policy-alignment-library-state">${renderPolicyAlignmentProcessingIndicator(policyAlignmentFrameworkBuildStatusLabel(item))}</span>`
                              : ''}
                          </button>
                          ${state.role === 'institution_admin'
                            ? `<button
                                type="button"
                                class="btn btn-danger policy-alignment-delete-btn"
                                data-action="delete-policy-framework"
                                data-framework-id="${escapeHtml(item.id)}"
                              >${escapeHtml(langText('Remove', 'Remove'))}</button>`
                            : ''}
                        </div>
                      `).join('')}
                    </div>`
                  : `<p class="prompt">${escapeHtml(langText('Politikos karkasų dar nėra. Sukurkite pirmą pakartotinai naudojamą politikos karkasą iš įkeltų dokumentų.', 'No policy frameworks yet. Build the first reusable policy framework from uploaded documents.'))}</p>`}
              </div>
            `
          : `
              <div class="card">
                <div class="guideline-group-header">
                  <strong>${escapeHtml(activeTab === 'external-analysis'
                    ? langText('Išorinių analizių sąrašas', 'External analysis list')
                    : langText('Strategijos analizių sąrašas', 'Strategy analysis list'))}</strong>
                  <span class="tag">${analyses.length}</span>
                </div>
                <div class="policy-alignment-sidebar-actions">
                  <button id="openPolicyAlignmentCreateBtn" class="btn btn-primary" ${(state.role === 'institution_admin' && frameworks.some((item) => policyAlignmentFrameworkReady(item))) ? '' : 'disabled'}>${escapeHtml(activeTab === 'external-analysis'
                    ? langText('Nauja išorinė analizė', 'New external analysis')
                    : langText('Nauja analizė', 'New analysis'))}</button>
                </div>
                ${analyses.length
                  ? `<div class="policy-alignment-analysis-list">
                      ${analyses.map((item) => `
                        <div class="policy-alignment-analysis-row${analysis?.id === item.id ? ' active' : ''}">
                          <button
                            type="button"
                            class="policy-alignment-analysis-item${analysis?.id === item.id ? ' active' : ''}"
                            data-action="select-policy-analysis"
                            data-analysis-id="${escapeHtml(item.id)}"
                          >
                            <strong>${escapeHtml(item.title || item.id)}</strong>
                            <span>${escapeHtml(policyAlignmentAnalysisStatusLabel(item.status))}</span>
                            <span>${escapeHtml(formatCommentDateTime(item.updatedAt || item.createdAt))}</span>
                            <div class="policy-alignment-chip-list">
                              <span class="tag">${escapeHtml(policyAlignmentSourceModeLabel(item.sourceMode))}</span>
                              <span class="tag">${escapeHtml(langText('Findings', 'Findings'))}: ${Number(item.findingCount || 0)}</span>
                            </div>
                          </button>
                          ${state.role === 'institution_admin'
                            ? `<button
                                type="button"
                                class="btn btn-danger policy-alignment-delete-btn"
                                data-action="delete-policy-analysis"
                                data-analysis-id="${escapeHtml(item.id)}"
                              >${escapeHtml(langText('Remove', 'Remove'))}</button>`
                            : ''}
                        </div>
                      `).join('')}
                    </div>`
                  : `<p class="prompt">${escapeHtml(activeTab === 'external-analysis'
                    ? langText('Išorinių analizių dar nėra. Įkelkite PDF dokumentus ir paleiskite pirmą analizę iš pasirinkto politikos karkaso.', 'No external analyses yet. Upload PDF documents and run the first analysis from the selected policy framework.')
                    : langText('Strategijos analizių dar nėra. Pasirinkite strategiją ir paleiskite pirmą analizę iš pasirinkto politikos karkaso.', 'No strategy analyses yet. Choose a strategy and run the first analysis from the selected policy framework.'))}</p>`}
              </div>
            `}
      </div>

      <div class="policy-alignment-column policy-alignment-column-main">
        ${activeTab === 'frameworks'
          ? (framework
            ? `
                <section class="card" style="margin-bottom: 16px;">
                  <div class="guideline-group-header">
                    <div>
                      <strong>${escapeHtml(framework.title || framework.id)}</strong>
                      ${framework.description ? `<p class="prompt" style="margin: 6px 0 0;">${escapeHtml(framework.description)}</p>` : ''}
                    </div>
                    <div class="policy-alignment-chip-list">
                      <span class="tag">${escapeHtml(langText('Pakartotinai naudojamas politikos karkasas', 'Reusable policy framework'))}</span>
                      ${policyAlignmentFrameworkBuildState(framework) === 'processing'
                        ? renderPolicyAlignmentProcessingIndicator(policyAlignmentFrameworkBuildStatusLabel(framework))
                        : `<span class="tag">${escapeHtml(policyAlignmentFrameworkBuildStatusLabel(framework))}</span>`}
                      <span class="tag">${escapeHtml(langText('Built', 'Built'))}: ${escapeHtml(formatCommentDateTime(framework.updatedAt || framework.createdAt))}</span>
                    </div>
                  </div>
                  <div class="policy-alignment-summary-grid">
                    <div class="policy-alignment-summary-card">
                      <span>${escapeHtml(langText('Source documents', 'Source documents'))}</span>
                      <strong>${Number(frameworkDocuments.length || 0)}</strong>
                    </div>
                    <div class="policy-alignment-summary-card">
                      <span>${escapeHtml(langText('Requirements', 'Requirements'))}</span>
                      <strong>${Number(framework.requirementCount || frameworkRequirements.length || 0)}</strong>
                    </div>
                    <div class="policy-alignment-summary-card">
                      <span>${escapeHtml(langText('Institution', 'Institution'))}</span>
                      <strong style="font-size:18px;">${escapeHtml(state.institution?.name || state.institutionSlug || '-')}</strong>
                    </div>
                    <div class="policy-alignment-summary-card">
                      <span>${escapeHtml(langText('Analyses', 'Analyses'))}</span>
                      <strong>${Number(frameworkAnalyses.length || 0)}</strong>
                    </div>
                    <div class="policy-alignment-summary-card">
                      <span>${escapeHtml(langText('Next step', 'Next step'))}</span>
                      <button type="button" class="btn btn-primary policy-alignment-inline-btn" data-action="open-analysis-create-from-framework" ${(state.role === 'institution_admin' && policyAlignmentFrameworkReady(framework)) ? '' : 'disabled'}>${escapeHtml(langText('Create analysis', 'Create analysis'))}</button>
                    </div>
                  </div>
                </section>

                <section class="policy-alignment-subgrid policy-alignment-framework-subgrid">
                  <div class="card">
                    <div class="guideline-group-header">
                      <strong>${escapeHtml(langText('Built from uploaded documents', 'Built from uploaded documents'))}</strong>
                      <span class="tag">${frameworkDocuments.length}</span>
                    </div>
                    ${policyAlignmentFrameworkBuildState(framework) === 'processing'
                      ? `<div class="policy-alignment-processing-banner">
                          ${renderPolicyAlignmentProcessingIndicator(langText('Kuriama', 'Building'))}
                          <strong>${escapeHtml(langText('Politikos karkasas dar kuriamas. Reikalavimai bus parodyti, kai apdorojimas baigsis.', 'The policy framework is still building. Requirements will appear when processing finishes.'))}</strong>
                        </div>`
                      : ''}
                    ${policyAlignmentFrameworkBuildState(framework) === 'failed'
                      ? `<p class="prompt" style="margin-bottom:12px; color:#a23333;">${escapeHtml(String(framework?.meta?.buildError || langText('Politikos karkaso kūrimas nepavyko.', 'Policy framework build failed.')))}</p>`
                      : ''}
                    ${frameworkDocuments.length
                      ? `<div class="policy-alignment-analysis-list">
                          ${frameworkDocuments.map((documentItem) => `
                            <article class="policy-alignment-gap-item">
                              <strong>${escapeHtml(documentItem.filename || '-')}</strong>
                              <div class="policy-alignment-chip-list">
                                <span class="tag">${escapeHtml(langText('Uploaded', 'Uploaded'))}: ${escapeHtml(formatCommentDateTime(documentItem.createdAt))}</span>
                                <span class="tag">${escapeHtml(langText('Chars', 'Chars'))}: ${Number(documentItem.meta?.chars || String(documentItem.extractedText || '').length || 0)}</span>
                              </div>
                              <button type="button" class="btn btn-ghost policy-alignment-inline-btn" data-action="view-policy-framework-document" data-document-id="${escapeHtml(documentItem.id)}">${escapeHtml(langText('View document', 'View document'))}</button>
                            </article>
                          `).join('')}
                        </div>`
                      : `<p class="prompt">${escapeHtml(langText('No source documents stored for this framework.', 'No source documents stored for this framework.'))}</p>`}
                  </div>

                  <div class="card">
                    <div class="guideline-group-header">
                      <strong>${escapeHtml(langText('Analyses using this policy framework', 'Analyses using this policy framework'))}</strong>
                      <span class="tag">${frameworkAnalyses.length}</span>
                    </div>
                    ${frameworkAnalyses.length
                      ? `<div class="history-table-wrap policy-alignment-related-table-wrap">
                          <table class="history-table policy-alignment-related-table">
                            <thead>
                              <tr>
                                <th>${escapeHtml(langText('Analysis', 'Analysis'))}</th>
                                <th>${escapeHtml(langText('Type', 'Type'))}</th>
                                <th>${escapeHtml(langText('Status', 'Status'))}</th>
                                <th>${escapeHtml(langText('Updated', 'Updated'))}</th>
                                <th>${escapeHtml(langText('Open', 'Open'))}</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${frameworkAnalyses.map((item) => `
                                <tr>
                                  <td><strong>${escapeHtml(item.title || item.id)}</strong></td>
                                  <td>${escapeHtml(policyAlignmentSourceModeLabel(item.sourceMode))}</td>
                                  <td>${escapeHtml(policyAlignmentAnalysisStatusLabel(item.status))}</td>
                                  <td>${escapeHtml(formatCommentDateTime(item.updatedAt || item.createdAt))}</td>
                                  <td>
                                    <button
                                      type="button"
                                      class="btn btn-ghost policy-alignment-table-link-btn"
                                      data-action="open-framework-linked-analysis"
                                      data-analysis-id="${escapeHtml(item.id)}"
                                      data-analysis-tab="${escapeHtml(policyAlignmentAnalysisBucketForMode(item.sourceMode))}"
                                    >${escapeHtml(langText('Open', 'Open'))}</button>
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>`
                      : `<p class="prompt">${escapeHtml(langText('No analyses have been run against this policy framework yet.', 'No analyses have been run against this policy framework yet.'))}</p>`}
                  </div>
                </section>

                <section class="card">
                  <div class="guideline-group-header">
                    <strong>${escapeHtml(langText('Extracted policy requirements preview', 'Extracted policy requirements preview'))}</strong>
                    <span class="tag">${frameworkRequirements.length}</span>
                  </div>
                  ${frameworkRequirements.length
                    ? `<div class="history-table-wrap policy-alignment-preview-wrap policy-alignment-preview-wrap-wide">
                        <table class="history-table policy-alignment-table policy-alignment-table-compact">
                          <thead>
                            <tr>
                              <th>${escapeHtml(langText('Theme', 'Theme'))}</th>
                              <th>${escapeHtml(langText('Requirement', 'Requirement'))}</th>
                              <th>${escapeHtml(langText('Description', 'Description'))}</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${frameworkRequirements.slice(0, 80).map((requirement) => `
                              <tr>
                                <td>${escapeHtml(requirement.theme || '-')}</td>
                                <td>
                                  <div class="policy-alignment-requirement-heading">
                                    <strong>${escapeHtml(requirement.title || '-')}</strong>
                                    ${(() => {
                                      const refs = buildPolicyAlignmentRequirementReferences(requirement, framework);
                                      return refs.length
                                        ? `<div class="policy-alignment-reference-tags">
                                            ${refs.map((ref) => `
                                              <button
                                                type="button"
                                                class="policy-alignment-reference-tag"
                                                data-action="open-policy-framework-reference"
                                                data-document-id="${escapeHtml(String(ref.document?.id || ''))}"
                                                data-chunk-ordinal="${escapeHtml(String(ref.chunkOrdinal))}"
                                                data-quote="${escapeHtml(ref.quote || '')}"
                                                data-requirement-title="${escapeHtml(requirement.title || '')}"
                                                title="${escapeHtml(ref.document?.filename || langText('Source reference', 'Source reference'))}"
                                              >${escapeHtml(String(ref.chunkOrdinal))}</button>
                                            `).join('')}
                                          </div>`
                                        : '';
                                    })()}
                                  </div>
                                </td>
                                <td>${escapeHtml(requirement.description || '-')}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </div>`
                    : `<p class="prompt">${escapeHtml(langText('No extracted policy requirements stored for this framework yet.', 'No extracted policy requirements stored for this framework yet.'))}</p>`}
                  </div>
                </section>
              `
            : `<div class="card"><strong>${escapeHtml(langText('Pasirinkite politikos karkasą arba sukurkite naują iš įkeltų politikos dokumentų.', 'Select a policy framework or build a new one from uploaded policy documents.'))}</strong></div>`)
          : (analysis
    ? `
            <section class="card" style="margin-bottom: 16px;">
              <div class="policy-alignment-analysis-header">
                <div class="policy-alignment-analysis-header-main">
                  <strong>${escapeHtml(analysis.title || analysis.id)}</strong>
                  ${analysis.description ? `<p class="prompt" style="margin: 6px 0 0;">${escapeHtml(analysis.description)}</p>` : ''}
                </div>
                <div class="policy-alignment-analysis-header-side">
                  <div class="policy-alignment-top-tabs policy-alignment-top-tabs-inline">
                    <button type="button" class="btn ${effectiveAnalysisSubview === 'overview' ? 'btn-primary' : 'btn-ghost'}" data-action="switch-policy-analysis-subview" data-subview="overview">${escapeHtml(langText('Apžvalga', 'Overview'))}</button>
                    <button type="button" class="btn ${effectiveAnalysisSubview === 'analysis' ? 'btn-primary' : 'btn-ghost'}" data-action="switch-policy-analysis-subview" data-subview="analysis">${escapeHtml(langText('Persidengimų ir trūkumų analizė', 'Overlap and gap analysis'))}</button>
                    ${supportsActionPanel ? `<button type="button" class="btn policy-alignment-action-launch-btn ${effectiveAnalysisSubview === 'actions' ? 'btn-primary' : ''}" data-action="switch-policy-analysis-subview" data-subview="actions">${escapeHtml(langText('Veiksmų panelė', 'Action panel'))}</button>` : ''}
                  </div>
                  <div class="policy-alignment-chip-list">
                  <span class="tag">${escapeHtml(policyAlignmentAnalysisStatusLabel(analysis.status))}</span>
                  <span class="tag">${escapeHtml(policyAlignmentSourceModeLabel(analysis.sourceMode))}</span>
                  <span class="tag">${escapeHtml(langText('Sukurta', 'Created'))}: ${escapeHtml(formatCommentDateTime(analysis.createdAt))}</span>
                  ${analysis.targetFrameworkId && frameworkById.get(analysis.targetFrameworkId)
        ? `<span class="tag">${escapeHtml(langText('Politikos karkasas', 'Policy framework'))}: ${escapeHtml(frameworkById.get(analysis.targetFrameworkId).title)}</span>`
        : ''}
                  </div>
                </div>
              </div>
              <div class="policy-alignment-chip-list" style="margin-top: 12px;">
                ${(Array.isArray(analysis.documents) ? analysis.documents : []).map((document) => `
                  <span class="tag">${escapeHtml(document.role === 'target' ? langText('Tikslas', 'Target') : langText('Šaltinis', 'Source'))}: ${escapeHtml(document.filename || '-')}</span>
                `).join('')}
              </div>
              ${analysis.errorMessage ? `<div class="prompt" style="margin-top: 12px; color: #a23333;">${escapeHtml(analysis.errorMessage)}</div>` : ''}
            </section>

            ${analysisProcessing
              ? `<div class="card policy-alignment-processing-banner" style="margin-bottom: 12px;">
                  ${renderPolicyAlignmentProcessingIndicator(langText('Analizė vykdoma fone', 'Analysis is processing in the background'))}
                  <strong>${escapeHtml(langText('Analizė vykdoma fone. Puslapis atsinaujina automatiškai, kai rezultatai bus paruošti.', 'The analysis is running in the background. This page refreshes automatically when results are ready.'))}</strong>
                </div>`
              : ''}
            ${effectiveAnalysisSubview === 'overview'
              ? `
                  <section class="card" style="margin-bottom: 16px;">
                    <div class="guideline-group-header">
                      <strong>${escapeHtml(langText('Apžvalga', 'Overview'))}</strong>
                      <span class="tag">${escapeHtml(policyAlignmentAnalysisStatusLabel(analysis.status))}</span>
                    </div>
                    <div class="policy-alignment-summary-grid">
                      <div class="policy-alignment-summary-card">
                        <span>${escapeHtml(langText('Reikalavimų', 'Requirements'))}</span>
                        <strong>${Number(overview?.total || 0)}</strong>
                      </div>
                      <div class="policy-alignment-summary-card">
                        <span>${escapeHtml(langText('Padengta', 'Covered'))}</span>
                        <strong>${Number(overview?.covered || 0)}</strong>
                      </div>
                      <div class="policy-alignment-summary-card">
                        <span>${escapeHtml(langText('Trūksta / rizika', 'Missing / risk'))}</span>
                        <strong>${Number(overview?.riskCount || 0)}</strong>
                      </div>
                      <div class="policy-alignment-summary-card">
                        <span>${escapeHtml(langText('Siūlymų', 'Suggestions'))}</span>
                        <strong>${Number(overview?.suggestionCount || 0)}</strong>
                      </div>
                    </div>
                  </section>

                  <section class="policy-alignment-subgrid">
                    <div class="card">
                      <div class="guideline-group-header">
                        <strong>${escapeHtml(langText('AI sugeneruota apžvalga', 'AI-generated overview'))}</strong>
                      </div>
                      <p>${escapeHtml(overview?.narrative || langText('AI apžvalga bus parodyta, kai analizės rezultatai bus paruošti.', 'The AI overview will appear when the analysis results are ready.'))}</p>
                      ${analysis.description ? `<p class="prompt">${escapeHtml(analysis.description)}</p>` : ''}
                      <div class="policy-alignment-howto">
                        <strong>${escapeHtml(langText('Kaip naudoti šį puslapį', 'How to use this page'))}</strong>
                        <ol>
                          <li>${escapeHtml(langText('Atidarykite Persidengimų ir trūkumų analizę, kad vienoje vietoje matytumėte padengimą, persidengimus ir likusias spragas.', 'Open Overlap and gap analysis to review coverage, overlaps, and remaining gaps in one place.'))}</li>
                          <li>${escapeHtml(langText('Pirmiausia peržiūrėkite persidengimo stulpelį ir įsitikinkite, kas jau yra padengta arba padengta iš dalies.', 'Check the overlap column first to confirm what is already covered or partly covered.'))}</li>
                          ${supportsActionPanel
                            ? `<li>${escapeHtml(langText('Jei trūkumas yra realus, eikite į Veiksmų panelę ir kurkite arba konvertuokite pasiūlymus.', 'If a gap is real, move to Action panel and create or convert proposals.'))}</li>`
                            : `<li>${escapeHtml(langText('Jei nustatote aiškų neatitikimą, naudokite šį rezultatą kaip suderinamumo vertinimo išvadą.', 'If you identify a clear gap, use this result as the compatibility assessment conclusion.'))}</li>`}
                        </ol>
                      </div>
                    </div>
                    <div class="card">
                      <div class="guideline-group-header">
                        <strong>${escapeHtml(langText('Analizės informacija', 'Analysis details'))}</strong>
                      </div>
                      <div class="policy-alignment-chip-list">
                        <span class="tag">${escapeHtml(langText('Sukurta', 'Created'))}: ${escapeHtml(formatCommentDateTime(analysis.createdAt))}</span>
                        ${analysis.updatedAt ? `<span class="tag">${escapeHtml(langText('Atnaujinta', 'Updated'))}: ${escapeHtml(formatCommentDateTime(analysis.updatedAt))}</span>` : ''}
                        <span class="tag">${escapeHtml(langText('Šaltinio tipas', 'Source mode'))}: ${escapeHtml(overview?.sourceModeLabel || policyAlignmentSourceModeLabel(analysis.sourceMode))}</span>
                        ${overview?.frameworkTitle ? `<span class="tag">${escapeHtml(langText('Policy framework', 'Policy framework'))}: ${escapeHtml(overview.frameworkTitle)}</span>` : ''}
                      </div>
                      <div class="policy-alignment-chip-list" style="margin-top: 10px;">
                        ${Array.isArray(overview?.sourceDocs) && overview.sourceDocs.length ? overview.sourceDocs.map((doc) => `<span class="tag">${escapeHtml(langText('Šaltinis', 'Source'))}: ${escapeHtml(doc.filename || '-')}</span>`).join('') : `<span class="tag">${escapeHtml(langText('Naudojamas Digistrategy turinys', 'Uses Digistrategy content'))}</span>`}
                        ${Array.isArray(overview?.targetDocs) ? overview.targetDocs.map((doc) => `<span class="tag">${escapeHtml(langText('Tikslas', 'Target'))}: ${escapeHtml(doc.filename || '-')}</span>`).join('') : ''}
                      </div>
                      ${Array.isArray(overview?.topThemes) && overview.topThemes.length
                        ? `<div class="policy-alignment-chip-list" style="margin-top: 10px;">
                            ${overview.topThemes.map((theme) => `<span class="tag">${escapeHtml(theme)}</span>`).join('')}
                          </div>`
                        : ''}
                    </div>
                  </section>
                `
              : effectiveAnalysisSubview === 'actions'
              ? `
                  <section class="card">
                    ${suggestions.length
                      ? `<div class="policy-alignment-suggestion-list">
                          ${suggestions.map((suggestion) => `
                            <article class="policy-alignment-suggestion-item">
                              <div class="guideline-group-header">
                                <strong>${escapeHtml(suggestion.title || '-')}</strong>
                                <div class="policy-alignment-chip-list">
                                  <span class="tag">${escapeHtml(policyAlignmentSuggestionKindLabel(suggestion.suggestionKind))}</span>
                                  <span class="tag">${escapeHtml(String(suggestion.status || '').trim().toLowerCase() === 'converted' ? langText('Konvertuota', 'Converted') : langText('Juodraštis', 'Draft'))}</span>
                                </div>
                              </div>
                              ${suggestion.description ? `<p>${escapeHtml(suggestion.description)}</p>` : ''}
                              ${suggestion.rationale ? `<p class="prompt">${escapeHtml(suggestion.rationale)}</p>` : ''}
                              <div class="policy-alignment-chip-list">
                                ${Array.isArray(suggestion.meta?.guidelineIds) ? suggestion.meta.guidelineIds.map((id) => `<span class="tag">${escapeHtml(langText('Gairė', 'Guideline'))}: ${escapeHtml(id)}</span>`).join('') : ''}
                                ${suggestion.meta?.relationType ? `<span class="tag">${escapeHtml(langText('Ryšio tipas', 'Relation type'))}: ${escapeHtml(String(suggestion.meta.relationType || '').trim())}</span>` : ''}
                              </div>
                              ${String(suggestion.status || '').trim().toLowerCase() === 'draft'
                                ? `<button type="button" class="btn btn-primary policy-alignment-inline-btn" data-action="convert-policy-suggestion" data-suggestion-id="${escapeHtml(suggestion.id)}">${escapeHtml(langText('Kurti pasiūlymą', 'Create proposal'))}</button>`
                                : `<span class="tag">${escapeHtml(langText('Pasiūlymas sukurtas', 'Proposal created'))}</span>`}
                            </article>
                          `).join('')}
                        </div>`
                      : `<p class="prompt">${escapeHtml(langText('AI kol kas nepasiūlė naujų gairių ar iniciatyvų juodraščių.', 'AI has not suggested any new guideline or initiative drafts yet.'))}</p>`}
                  </section>
                `
              : `
                  <section class="card" style="margin-bottom: 16px;">
                    <div class="guideline-group-header">
                      <strong>${escapeHtml(langText('Persidengimų ir trūkumų analizė', 'Overlap and gap analysis'))}</strong>
                      <span class="tag">${filteredFindings.length}</span>
                    </div>
                    <p class="prompt">${escapeHtml(langText('Vienoje vietoje peržiūrėkite visus reikalavimus, jų padengimą, persidengimus su esamomis kortelėmis ir likusias spragas.', 'Review all requirements, their coverage, overlaps with existing cards, and remaining gaps in one place.'))}</p>
                    <div class="policy-alignment-filter-grid">
                      <label>
                        <span>${escapeHtml(langText('Būsena', 'Status'))}</span>
                        <select id="policyAlignmentStatusFilter">
                          <option value="all">${escapeHtml(langText('Visos būsenos', 'All statuses'))}</option>
                          <option value="covered" ${state.policyAlignmentFilterStatus === 'covered' ? 'selected' : ''}>${escapeHtml(policyAlignmentCoverageLabel('covered'))}</option>
                          <option value="partial" ${state.policyAlignmentFilterStatus === 'partial' ? 'selected' : ''}>${escapeHtml(policyAlignmentCoverageLabel('partial'))}</option>
                          <option value="weak" ${state.policyAlignmentFilterStatus === 'weak' ? 'selected' : ''}>${escapeHtml(policyAlignmentCoverageLabel('weak'))}</option>
                          <option value="missing" ${state.policyAlignmentFilterStatus === 'missing' ? 'selected' : ''}>${escapeHtml(policyAlignmentCoverageLabel('missing'))}</option>
                          <option value="contradicted" ${state.policyAlignmentFilterStatus === 'contradicted' ? 'selected' : ''}>${escapeHtml(policyAlignmentCoverageLabel('contradicted'))}</option>
                          <option value="unclear" ${state.policyAlignmentFilterStatus === 'unclear' ? 'selected' : ''}>${escapeHtml(policyAlignmentCoverageLabel('unclear'))}</option>
                        </select>
                      </label>
                      <label>
                        <span>${escapeHtml(langText('Tema', 'Theme'))}</span>
                        <select id="policyAlignmentThemeFilter">
                          <option value="all">${escapeHtml(langText('Visos temos', 'All themes'))}</option>
                          ${themeOptions.map((theme) => `<option value="${escapeHtml(theme)}" ${state.policyAlignmentFilterTheme === theme ? 'selected' : ''}>${escapeHtml(theme)}</option>`).join('')}
                        </select>
                      </label>
                      ${activeTab === 'strategy-analysis' ? '' : `<label>
                        <span>${escapeHtml(langText('Grupavimas', 'Grouping'))}</span>
                        <select id="policyAlignmentGroupBy">
                          <option value="theme" ${state.policyAlignmentGroupBy === 'theme' ? 'selected' : ''}>${escapeHtml(langText('Pagal temą', 'By theme'))}</option>
                          <option value="none" ${state.policyAlignmentGroupBy === 'none' ? 'selected' : ''}>${escapeHtml(langText('Be grupavimo', 'No grouping'))}</option>
                        </select>
                      </label>`}
                    </div>
                  </section>
                  <section class="card" style="margin-bottom: 16px;">
                    <div class="guideline-group-header">
                      <strong>${escapeHtml(langText('Padengimo lentelė', 'Coverage table'))}</strong>
                      <span class="tag">${filteredFindings.length}</span>
                    </div>
                    <div class="history-table-wrap">
                      <table class="history-table policy-alignment-table">
                        <thead>
                          <tr>
                            <th>${escapeHtml(langText('Tikslinis reikalavimas', 'Target requirement'))}</th>
                            <th>${escapeHtml(langText('Būsena', 'Status'))}</th>
                            <th>${escapeHtml(langText('Pasitikėjimas', 'Confidence'))}</th>
                            <th>${escapeHtml(langText('Persidengimas', 'Overlap'))}</th>
                            <th>${escapeHtml(langText('Įrodymai', 'Evidence'))}</th>
                            <th>${escapeHtml(langText('Paaiškinimas', 'Explanation'))}</th>
                            <th>${escapeHtml(langText('Veiksmas', 'Action'))}</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${filteredFindings.length
                            ? renderPolicyAlignmentCoverageRows(grouped, suggestionByFindingId, sourceRefById, { actionsEnabled: supportsActionPanel })
                            : `<tr><td colspan="7">${escapeHtml(langText('Pagal pasirinktus filtrus įrašų nerasta.', 'No findings match the selected filters.'))}</td></tr>`}
                        </tbody>
                      </table>
                    </div>
                  </section>
                `}
          `
    : `<div class="card"><strong>${escapeHtml(langText('Pasirinkite analizę iš sąrašo arba sukurkite ją iš pasirinkto politikos karkaso.', 'Select an analysis from the list or create one from the selected policy framework.'))}</strong></div>`)}
      </div>
    </section>
  `;

  const createBtn = elements.stepView.querySelector('#openPolicyAlignmentCreateBtn');
  if (createBtn) createBtn.addEventListener('click', openPolicyAlignmentCreateModal);
  const frameworkCreateBtn = elements.stepView.querySelector('#openPolicyAlignmentFrameworkCreateBtn');
  if (frameworkCreateBtn) frameworkCreateBtn.addEventListener('click', openPolicyAlignmentFrameworkCreateModal);
  const refreshBtn = elements.stepView.querySelector('#refreshPolicyAlignmentBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => {
    void Promise.all([
      refreshPolicyAlignments({ selectedId: analysis?.id || '', silent: true }),
      refreshPolicyAlignmentFrameworks({ silent: true })
    ]).then(async () => {
      if (framework?.id) {
        await loadPolicyAlignmentFrameworkDetail(framework.id, { silent: true });
      }
    }).finally(() => render());
  });
  const sidebarBtn = elements.stepView.querySelector('#togglePolicyAlignmentSidebarBtn');
  if (sidebarBtn) {
    sidebarBtn.addEventListener('click', () => {
      state.policyAlignmentSidebarCollapsed = !state.policyAlignmentSidebarCollapsed;
      renderPolicyAlignmentView();
    });
  }
  elements.stepView.querySelectorAll('[data-action="open-analysis-create-from-framework"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.policyAlignmentWorkspaceTab = 'strategy-analysis';
      state.policyAlignmentAnalysisSubview = 'overview';
      renderPolicyAlignmentView();
      openPolicyAlignmentCreateModal();
    });
  });

  elements.stepView.querySelectorAll('[data-action="switch-policy-analysis-subview"]').forEach((button) => {
    button.addEventListener('click', () => {
      const subview = String(button.dataset.subview || 'overview').trim().toLowerCase();
      state.policyAlignmentAnalysisSubview = ['overview', 'analysis', 'actions'].includes(subview) ? subview : 'overview';
      renderPolicyAlignmentView();
    });
  });

  const statusFilter = elements.stepView.querySelector('#policyAlignmentStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      state.policyAlignmentFilterStatus = String(statusFilter.value || 'all').trim().toLowerCase() || 'all';
      renderPolicyAlignmentView();
    });
  }
  const themeFilter = elements.stepView.querySelector('#policyAlignmentThemeFilter');
  if (themeFilter) {
    themeFilter.addEventListener('change', () => {
      state.policyAlignmentFilterTheme = String(themeFilter.value || 'all').trim() || 'all';
      renderPolicyAlignmentView();
    });
  }
  const groupBySelect = elements.stepView.querySelector('#policyAlignmentGroupBy');
  if (groupBySelect) {
    groupBySelect.addEventListener('change', () => {
      state.policyAlignmentGroupBy = String(groupBySelect.value || 'theme').trim().toLowerCase() || 'theme';
      renderPolicyAlignmentView();
    });
  }

  elements.stepView.querySelectorAll('[data-action="select-policy-analysis"]').forEach((button) => {
    button.addEventListener('click', () => {
      const analysisId = String(button.dataset.analysisId || '').trim();
      if (!analysisId) return;
      const cached = analyses.find((item) => item.id === analysisId) || null;
      state.policyAlignmentSelectedId = analysisId;
      state.policyAlignmentAnalysisSubview = 'overview';
      if (cached) {
        state.policyAlignmentCurrent = cached;
      }
      state.policyAlignmentDetailLoading = true;
      renderPolicyAlignmentView();
      void loadPolicyAlignmentDetail(analysisId, { silent: true })
        .finally(() => {
          state.policyAlignmentDetailLoading = false;
          renderPolicyAlignmentView();
        });
    });
  });

  elements.stepView.querySelectorAll('[data-action="delete-policy-analysis"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const analysisId = String(button.dataset.analysisId || '').trim();
      if (!analysisId) return;
      void deletePolicyAlignmentAnalysis(analysisId);
    });
  });

  elements.stepView.querySelectorAll('[data-action="delete-policy-framework"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const frameworkId = String(button.dataset.frameworkId || '').trim();
      if (!frameworkId) return;
      void deletePolicyAlignmentFramework(frameworkId);
    });
  });

  elements.stepView.querySelectorAll('[data-action="select-policy-framework"]').forEach((button) => {
    button.addEventListener('click', () => {
      const frameworkId = String(button.dataset.frameworkId || '').trim();
      if (!frameworkId) return;
      state.policyAlignmentFrameworkSelectedId = frameworkId;
      void loadPolicyAlignmentFrameworkDetail(frameworkId, { silent: false });
    });
  });

  elements.stepView.querySelectorAll('[data-action="open-framework-linked-analysis"]').forEach((button) => {
    button.addEventListener('click', () => {
      const analysisId = String(button.dataset.analysisId || '').trim();
      const nextTab = String(button.dataset.analysisTab || '').trim().toLowerCase();
      if (!analysisId) return;
      state.policyAlignmentWorkspaceTab = nextTab === 'external-analysis' ? 'external-analysis' : 'strategy-analysis';
      state.policyAlignmentSelectedId = analysisId;
      state.policyAlignmentAnalysisSubview = 'overview';
      const cached = state.policyAlignments.find((item) => item.id === analysisId) || null;
      if (cached) {
        state.policyAlignmentCurrent = cached;
      }
      renderPolicyAlignmentView();
      void loadPolicyAlignmentDetail(analysisId, { silent: false });
    });
  });

  elements.stepView.querySelectorAll('[data-action="view-policy-framework-document"]').forEach((button) => {
    button.addEventListener('click', () => {
      const documentId = String(button.dataset.documentId || '').trim();
      const currentFramework = selectedPolicyAlignmentFrameworkFromState();
      const documentItem = (Array.isArray(currentFramework?.documents) ? currentFramework.documents : []).find((item) => String(item?.id || '').trim() === documentId);
      if (!currentFramework || !documentItem) return;
      openPolicyAlignmentFrameworkDocumentModal(currentFramework, documentItem);
    });
  });

  elements.stepView.querySelectorAll('[data-action="open-policy-framework-reference"]').forEach((button) => {
    button.addEventListener('click', () => {
      const currentFramework = selectedPolicyAlignmentFrameworkFromState();
      if (!currentFramework) return;
      openPolicyAlignmentFrameworkEvidenceModal(currentFramework, {
        documentId: String(button.dataset.documentId || '').trim(),
        chunkOrdinal: Number(button.dataset.chunkOrdinal),
        quote: String(button.dataset.quote || '').trim(),
        requirementTitle: String(button.dataset.requirementTitle || '').trim()
      });
    });
  });

  elements.stepView.querySelectorAll('[data-action="open-policy-source"]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = String(button.dataset.kind || '').trim().toLowerCase();
      const entityId = String(button.dataset.entityId || '').trim();
      if (!entityId) return;
      if (kind === 'initiative') {
        openInitiativeDetail(entityId);
        return;
      }
      openGuidelineDetail(entityId);
    });
  });

  elements.stepView.querySelectorAll('[data-action="open-policy-source-map"]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = String(button.dataset.kind || '').trim().toLowerCase();
      const entityId = String(button.dataset.entityId || '').trim();
      if (!entityId) return;
      if (kind !== 'initiative' && kind !== 'guideline') return;
      openMapForCard(kind, entityId);
    });
  });

  elements.stepView.querySelectorAll('[data-action="link-policy-finding"]').forEach((button) => {
    button.addEventListener('click', () => {
      const findingId = String(button.dataset.findingId || '').trim();
      if (!findingId || !analysis) return;
      const finding = (Array.isArray(analysis.findings) ? analysis.findings : []).find((item) => String(item?.id || '').trim() === findingId);
      if (!finding) return;
      openPolicyAlignmentLinkModal(analysis, finding);
    });
  });

  elements.stepView.querySelectorAll('[data-action="convert-policy-suggestion"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const suggestionId = String(button.dataset.suggestionId || '').trim();
      const analysisId = String(analysis?.id || '').trim();
      if (!suggestionId || !analysisId) return;
      button.disabled = true;
      try {
        await api(`/api/v1/policy-alignments/${encodeURIComponent(analysisId)}/suggestions/${encodeURIComponent(suggestionId)}/create-proposal`, {
          method: 'POST',
          body: {}
        });
        await Promise.all([
          loadPolicyAlignmentDetail(analysisId, { silent: true }),
          refreshHistory()
        ]);
        notifySuccess(langText('Policy Alignment pasiūlymas perkeltas į moderuojamą pasiūlymų srautą.', 'Policy Alignment suggestion was moved into the moderated proposal flow.'));
        render();
      } catch (error) {
        notifyError(toUserMessage(error));
        button.disabled = false;
      }
    });
  });
}
