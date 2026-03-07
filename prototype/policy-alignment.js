
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

function buildPolicyAlignmentFindingsModel(analysis) {
  const selected = analysis && typeof analysis === 'object' ? analysis : null;
  const findings = Array.isArray(selected?.findings) ? selected.findings : [];
  const suggestions = Array.isArray(selected?.suggestions) ? selected.suggestions : [];
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
  const grouped = state.policyAlignmentGroupBy === 'none'
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

function renderPolicyAlignmentCoverageRows(grouped, suggestionByFindingId, sourceRefById) {
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
    const actionCell = `
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
    `;
    return `
          <tr class="policy-alignment-table-row status-${escapeHtml(String(finding?.coverageStatus || 'unclear').trim().toLowerCase())}">
            <td>
              <strong>${escapeHtml(finding?.requirementTitle || '-')}</strong>
              ${finding?.requirementDescription ? `<div class="prompt">${escapeHtml(finding.requirementDescription)}</div>` : ''}
            </td>
            <td><span class="tag">${escapeHtml(policyAlignmentCoverageLabel(finding?.coverageStatus))}</span></td>
            <td>${escapeHtml(confidence)}</td>
            <td><div class="policy-alignment-chip-list">${renderPolicyAlignmentMatchedRefs(finding)}</div></td>
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
  const currentFramework = framework && typeof framework === 'object' ? framework : null;
  const documentItem = documentRecord && typeof documentRecord === 'object' ? documentRecord : null;
  if (!currentFramework?.id || !documentItem?.id) return;

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
      <div class="policy-alignment-document-body"><pre>${escapeHtml(String(documentItem.extractedText || '').trim() || langText('No extracted text available.', 'No extracted text available.'))}</pre></div>
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

function openPolicyAlignmentCreateModal() {
  if (!state.cycle?.id) return;
  if (state.role !== 'institution_admin') {
    notifyError(langText('Tik administratoriai gali kurti Policy Alignment analizes.', 'Only administrators can create Policy Alignment analyses.'));
    return;
  }
  const frameworks = sortedPolicyAlignmentFrameworks(state.policyAlignmentFrameworks);
  const readyFrameworks = frameworks.filter((item) => policyAlignmentFrameworkReady(item));
  const selectedFrameworkId = String(state.policyAlignmentFrameworkSelectedId || readyFrameworks[0]?.id || '').trim();
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
      <div class="auth-modal-header">
        <div>
          <h3 id="policyAlignmentCreateTitle">${escapeHtml(langText('Create analysis from policy framework', 'Create analysis from policy framework'))}</h3>
          <p class="prompt" style="margin: 6px 0 0;">${escapeHtml(langText('Antras žingsnis: pasirinkite politikos karkasą ir palyginkite su juo savo dabartinę strategiją.', 'Second step: choose the policy framework and compare your current strategy against it.'))}</p>
        </div>
        <button type="button" class="btn btn-ghost" id="closePolicyAlignmentCreateModal">${escapeHtml(langText('Close', 'Close'))}</button>
      </div>
      <form id="policyAlignmentCreateForm" class="policy-alignment-create-form">
        <div class="inline-form-grid">
          <input type="text" name="title" placeholder="${escapeHtml(langText('Analysis title', 'Analysis title'))}" required />
          <select name="targetFrameworkId" id="policyAlignmentFrameworkSelect">
            ${readyFrameworks.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedFrameworkId ? 'selected' : ''}>${escapeHtml(item.title)} (${item.requirementCount})</option>`).join('')}
          </select>
        </div>
        <div class="inline-form-grid">
          <select name="sourceMode">
            <option value="existing_strategy">${escapeHtml(langText('Use current strategy as source', 'Use current strategy as source'))}</option>
            <option value="existing_cycle">${escapeHtml(langText('Use current cycle as source', 'Use current cycle as source'))}</option>
            <option value="mixed">${escapeHtml(langText('Strategy plus uploaded source files', 'Strategy plus uploaded source files'))}</option>
            <option value="uploaded_document">${escapeHtml(langText('Uploaded source files only', 'Uploaded source files only'))}</option>
          </select>
          <select name="localeHint">
            <option value="en">${escapeHtml(langText('Results in EN', 'Results in EN'))}</option>
            <option value="lt">${escapeHtml(langText('Results in LT', 'Results in LT'))}</option>
          </select>
        </div>
        <textarea name="description" placeholder="${escapeHtml(langText('What do you want to learn from this comparison?', 'What do you want to learn from this comparison?'))}"></textarea>
        <label class="policy-alignment-upload-card">
          <strong>${escapeHtml(langText('Optional source documents', 'Optional source documents'))}</strong>
          <span class="prompt">${escapeHtml(langText('Only needed if your strategy evidence is outside the current strategy or cycle records.', 'Only needed if your strategy evidence is outside the current strategy or cycle records.'))}</span>
          <input type="file" id="policyAlignmentSourceFiles" accept="application/pdf,.pdf" multiple />
        </label>
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
    submitButton.textContent = langText('Running...', 'Running...');
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
      state.policyAlignmentWorkspaceTab = 'analyses';
      await refreshPolicyAlignments({ selectedId: analysisId, silent: true });
      closeModal();
      notifySuccess(langText('Policy Alignment analysis completed.', 'Policy Alignment analysis completed.'));
      render();
    } catch (error) {
      showError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
    }
  });
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
    && (!state.policyAlignmentCurrent || state.policyAlignmentCurrent.id !== state.policyAlignmentSelectedId)
    && !state.policyAlignmentDetailLoading
  ) {
    void loadPolicyAlignmentDetail(state.policyAlignmentSelectedId, { silent: false });
  }
  if (
    !state.policyAlignmentFrameworkLoading
    && state.policyAlignmentFrameworkSelectedId
    && (!state.policyAlignmentFrameworkCurrent || state.policyAlignmentFrameworkCurrent.id !== state.policyAlignmentFrameworkSelectedId || !Array.isArray(state.policyAlignmentFrameworkCurrent.requirements))
    && !state.policyAlignmentFrameworkDetailLoading
  ) {
    void loadPolicyAlignmentFrameworkDetail(state.policyAlignmentFrameworkSelectedId, { silent: false });
  }

  const analysis = selectedPolicyAlignmentFromState();
  const framework = selectedPolicyAlignmentFrameworkFromState();
  const analyses = sortedPolicyAlignments(state.policyAlignments);
  const frameworks = sortedPolicyAlignmentFrameworks(state.policyAlignmentFrameworks);
  const processingFrameworks = frameworks.filter((item) => policyAlignmentFrameworkBuildState(item) === 'processing');
  const frameworkById = new Map(frameworks.map((item) => [item.id, item]));
  const {
    filteredFindings,
    grouped,
    suggestions,
    suggestionByFindingId,
    sourceRefById,
    themeOptions
  } = buildPolicyAlignmentFindingsModel(analysis);
  const gapFindings = filteredFindings.filter((item) => policyAlignmentFindingRisky(item?.coverageStatus));
  const overlapFindings = filteredFindings.filter((item) => Array.isArray(item?.matchedSourceRefs) && item.matchedSourceRefs.length);
  const activeTab = String(state.policyAlignmentWorkspaceTab || 'frameworks').trim().toLowerCase() === 'analyses' ? 'analyses' : 'frameworks';
  const sidebarCollapsed = !!state.policyAlignmentSidebarCollapsed;
  const frameworkDocuments = Array.isArray(framework?.documents) ? framework.documents : [];
  const frameworkRequirements = Array.isArray(framework?.requirements) ? framework.requirements : [];

  elements.stepView.innerHTML = `
    <div class="step-header">
      <div class="header-stack step-header-actions">
        ${activeTab === 'frameworks'
          ? `<button id="openPolicyAlignmentFrameworkCreateBtn" class="btn btn-primary" ${state.role === 'institution_admin' ? '' : 'disabled'}>${escapeHtml(langText('Naujas politikos karkasas', 'New policy framework'))}</button>`
          : `<button id="openPolicyAlignmentCreateBtn" class="btn btn-primary" ${(state.role === 'institution_admin' && frameworks.some((item) => policyAlignmentFrameworkReady(item))) ? '' : 'disabled'}>${escapeHtml(langText('Nauja analizė', 'New analysis'))}</button>`}
        <button id="refreshPolicyAlignmentBtn" class="btn btn-ghost">${escapeHtml(langText('Atnaujinti', 'Refresh'))}</button>
        <button id="togglePolicyAlignmentSidebarBtn" class="btn btn-ghost">${escapeHtml(sidebarCollapsed ? langText('Rodyti skydelį', 'Show panel') : langText('Slėpti skydelį', 'Hide panel'))}</button>
        <span class="tag">${langText('Institucija', 'Institution')}: ${escapeHtml(state.institution?.name || state.institutionSlug)}</span>
        <span class="tag">${langText('Strategija', 'Strategy')}: ${escapeHtml(state.strategy?.title || '-')}</span>
        <span class="tag">${langText('Politikos karkasų', 'Policy frameworks')}: ${frameworks.length}</span>
        <span class="tag">${langText('Analizių', 'Analyses')}: ${analyses.length}</span>
      </div>
      <p class="prompt" style="margin-top:12px;">${escapeHtml(activeTab === 'frameworks'
        ? langText('Pirma sukurkite politikos karkasą iš įkeltų politikos dokumentų. Tada jį naudokite kaip pakartotinai naudojamą atskaitos tašką analizėms.', 'First build a policy framework from uploaded policy documents. Then use it as a reusable reference point for analyses.')
        : langText('Antrame etape palyginkite dabartinę strategiją su pasirinktu politikos karkasu ir peržiūrėkite padengimo lentelę pilname darbiniame plote.', 'In the second phase, compare the current strategy against the selected policy framework and review the coverage table in a wider workspace.'))}</p>
    </div>

    <div class="card policy-alignment-stage-card" style="margin-bottom: 16px;">
      <div class="policy-alignment-stage-tabs">
        <button type="button" class="btn ${activeTab === 'frameworks' ? 'btn-primary' : 'btn-ghost'}" data-action="policy-alignment-tab" data-tab="frameworks">${escapeHtml(langText('1. Politikos karkasai', '1. Policy frameworks'))}</button>
        <button type="button" class="btn ${activeTab === 'analyses' ? 'btn-primary' : 'btn-ghost'}" data-action="policy-alignment-tab" data-tab="analyses">${escapeHtml(langText('2. Analizės', '2. Analyses'))}</button>
      </div>
    </div>

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
                            <span>${escapeHtml(formatCommentDateTime(item.updatedAt || item.createdAt))}</span>
                            <div class="policy-alignment-chip-list">
                              <span class="tag">${escapeHtml(langText('Requirements', 'Requirements'))}: ${Number(item.requirementCount || 0)}</span>
                              <span class="tag">${escapeHtml(langText('Documents', 'Documents'))}: ${Number(item.documentCount || 0)}</span>
                              ${policyAlignmentFrameworkBuildState(item) === 'processing'
                                ? renderPolicyAlignmentProcessingIndicator(policyAlignmentFrameworkBuildStatusLabel(item))
                                : `<span class="tag">${escapeHtml(policyAlignmentFrameworkBuildStatusLabel(item))}</span>`}
                            </div>
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
                  <strong>${escapeHtml(langText('Analizių sąrašas', 'Analysis list'))}</strong>
                  <span class="tag">${analyses.length}</span>
                </div>
                ${frameworks.length
                  ? `<p class="prompt">${escapeHtml(langText('Analizes iš pasirinkto politikos karkaso gali kurti tik administratoriai. Jei reikia, grįžkite į pirmą žingsnį ir pasirinkite ar sukurkite karkasą.', 'Only administrators can create analyses from a selected policy framework. If needed, go back to step one and choose or build a framework.'))}</p>`
                  : `<p class="prompt">${escapeHtml(langText('Pirma sukurkite politikos karkasą iš įkeltų politikos dokumentų. Be karkaso analizės paleisti nereikėtų.', 'Build a policy framework from uploaded policy documents first. Analyses should not start without a framework.'))}</p>`}
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
                  : `<p class="prompt">${escapeHtml(langText('No analyses yet. Create the first analysis from the selected policy framework.', 'No analyses yet. Create the first analysis from the selected policy framework.'))}</p>`}
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
                      <span>${escapeHtml(langText('Next step', 'Next step'))}</span>
                      <button type="button" class="btn btn-primary policy-alignment-inline-btn" data-action="open-analysis-create-from-framework" ${(state.role === 'institution_admin' && policyAlignmentFrameworkReady(framework)) ? '' : 'disabled'}>${escapeHtml(langText('Create analysis', 'Create analysis'))}</button>
                    </div>
                  </div>
                </section>

                <section class="policy-alignment-subgrid">
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
                      <strong>${escapeHtml(langText('Extracted policy requirements preview', 'Extracted policy requirements preview'))}</strong>
                      <span class="tag">${frameworkRequirements.length}</span>
                    </div>
                    ${frameworkRequirements.length
                      ? `<div class="history-table-wrap">
                          <table class="history-table policy-alignment-table policy-alignment-table-compact">
                            <thead>
                              <tr>
                                <th>${escapeHtml(langText('Theme', 'Theme'))}</th>
                                <th>${escapeHtml(langText('Requirement', 'Requirement'))}</th>
                                <th>${escapeHtml(langText('Description', 'Description'))}</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${frameworkRequirements.slice(0, 24).map((requirement) => `
                                <tr>
                                  <td>${escapeHtml(requirement.theme || '-')}</td>
                                  <td><strong>${escapeHtml(requirement.title || '-')}</strong></td>
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
              <div class="guideline-group-header">
                <div>
                  <strong>${escapeHtml(analysis.title || analysis.id)}</strong>
                  ${analysis.description ? `<p class="prompt" style="margin: 6px 0 0;">${escapeHtml(analysis.description)}</p>` : ''}
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
              <div class="policy-alignment-summary-grid">
                <div class="policy-alignment-summary-card">
                  <span>${escapeHtml(langText('Reikalavimų', 'Requirements'))}</span>
                  <strong>${Number(analysis.summary?.total || analysis.targetSummary?.requirementCount || analysis.requirements?.length || 0)}</strong>
                </div>
                <div class="policy-alignment-summary-card">
                  <span>${escapeHtml(langText('Padengta', 'Covered'))}</span>
                  <strong>${Number(analysis.summary?.covered || 0)}</strong>
                </div>
                <div class="policy-alignment-summary-card">
                  <span>${escapeHtml(langText('Trūksta / rizika', 'Missing / risk'))}</span>
                  <strong>${Number((analysis.summary?.missing || 0) + (analysis.summary?.weak || 0) + (analysis.summary?.contradicted || 0))}</strong>
                </div>
                <div class="policy-alignment-summary-card">
                  <span>${escapeHtml(langText('Siūlymų', 'Suggestions'))}</span>
                  <strong>${Number(analysis.summary?.suggestionCount || analysis.suggestions?.length || 0)}</strong>
                </div>
              </div>
              <div class="policy-alignment-chip-list" style="margin-top: 12px;">
                ${(Array.isArray(analysis.documents) ? analysis.documents : []).map((document) => `
                  <span class="tag">${escapeHtml(document.role === 'target' ? langText('Tikslas', 'Target') : langText('Šaltinis', 'Source'))}: ${escapeHtml(document.filename || '-')}</span>
                `).join('')}
                ${analysis.targetFrameworkId && frameworkById.get(analysis.targetFrameworkId)
                  ? `<span class="tag">${escapeHtml(langText('Policy framework', 'Policy framework'))}: ${escapeHtml(frameworkById.get(analysis.targetFrameworkId).title)}</span>`
                  : ''}
              </div>
              ${analysis.errorMessage ? `<div class="prompt" style="margin-top: 12px; color: #a23333;">${escapeHtml(analysis.errorMessage)}</div>` : ''}
            </section>

            <section class="card" style="margin-bottom: 16px;">
              <div class="guideline-group-header">
                <strong>${escapeHtml(langText('Filtrai', 'Filters'))}</strong>
                <span class="tag">${filteredFindings.length}</span>
              </div>
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
                <label>
                  <span>${escapeHtml(langText('Grupavimas', 'Grouping'))}</span>
                  <select id="policyAlignmentGroupBy">
                    <option value="theme" ${state.policyAlignmentGroupBy === 'theme' ? 'selected' : ''}>${escapeHtml(langText('Pagal temą', 'By theme'))}</option>
                    <option value="none" ${state.policyAlignmentGroupBy === 'none' ? 'selected' : ''}>${escapeHtml(langText('Be grupavimo', 'No grouping'))}</option>
                  </select>
                </label>
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
                      <th>${escapeHtml(langText('Atitikę šaltiniai', 'Matched source items'))}</th>
                      <th>${escapeHtml(langText('Įrodymai', 'Evidence'))}</th>
                      <th>${escapeHtml(langText('Paaiškinimas', 'Explanation'))}</th>
                      <th>${escapeHtml(langText('Veiksmas', 'Action'))}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredFindings.length
    ? renderPolicyAlignmentCoverageRows(grouped, suggestionByFindingId, sourceRefById)
    : `<tr><td colspan="7">${escapeHtml(langText('Pagal pasirinktus filtrus įrašų nerasta.', 'No findings match the selected filters.'))}</td></tr>`}
                  </tbody>
                </table>
              </div>
            </section>

            <section class="policy-alignment-subgrid">
              <div class="card">
                <div class="guideline-group-header">
                  <strong>${escapeHtml(langText('Trūkumų analizė', 'Gap analysis'))}</strong>
                  <span class="tag">${gapFindings.length}</span>
                </div>
                ${gapFindings.length
    ? `<div class="policy-alignment-gap-list">
                      ${gapFindings.map((finding) => `
                        <article class="policy-alignment-gap-item status-${escapeHtml(String(finding.coverageStatus || 'unclear').trim().toLowerCase())}">
                          <strong>${escapeHtml(finding.requirementTitle || '-')}</strong>
                          <div class="policy-alignment-chip-list">
                            <span class="tag">${escapeHtml(policyAlignmentCoverageLabel(finding.coverageStatus))}</span>
                            ${finding.theme ? `<span class="tag">${escapeHtml(finding.theme)}</span>` : ''}
                          </div>
                          <p>${escapeHtml(finding.explanation || finding.requirementDescription || '-')}</p>
                        </article>
                      `).join('')}
                    </div>`
    : `<p class="prompt">${escapeHtml(langText('Šiuo filtruose trūkumų nerasta.', 'No gaps in the current filter set.'))}</p>`}
              </div>

              <div class="card">
                <div class="guideline-group-header">
                  <strong>${escapeHtml(langText('Persidengimų ir ryšių vaizdas', 'Overlap and mapping view'))}</strong>
                  <span class="tag">${overlapFindings.length}</span>
                </div>
                ${overlapFindings.length
    ? `<div class="history-table-wrap">
                      <table class="history-table policy-alignment-table">
                        <thead>
                          <tr>
                            <th>${escapeHtml(langText('Reikalavimas', 'Requirement'))}</th>
                            <th>${escapeHtml(langText('Susieti šaltiniai', 'Mapped sources'))}</th>
                            <th>${escapeHtml(langText('Persidengimas', 'Overlap'))}</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${overlapFindings.map((finding) => `
                            <tr>
                              <td>${escapeHtml(finding.requirementTitle || '-')}</td>
                              <td><div class="policy-alignment-chip-list">${renderPolicyAlignmentMatchedRefs(finding)}</div></td>
                              <td>${escapeHtml(finding.overlapSummary || finding.explanation || '-')}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>`
    : `<p class="prompt">${escapeHtml(langText('Persidengimų šiame filtre nėra.', 'No overlaps in the current filter set.'))}</p>`}
              </div>
            </section>

            <section class="card" style="margin-top: 16px;">
              <div class="guideline-group-header">
                <strong>${escapeHtml(langText('Veiksmų panelė', 'Action panel'))}</strong>
                <span class="tag">${suggestions.length}</span>
              </div>
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
  elements.stepView.querySelectorAll('[data-action="policy-alignment-tab"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.policyAlignmentWorkspaceTab = String(button.dataset.tab || 'frameworks').trim().toLowerCase() === 'analyses' ? 'analyses' : 'frameworks';
      renderPolicyAlignmentView();
    });
  });
  elements.stepView.querySelectorAll('[data-action="open-analysis-create-from-framework"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.policyAlignmentWorkspaceTab = 'analyses';
      renderPolicyAlignmentView();
      openPolicyAlignmentCreateModal();
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
      state.policyAlignmentSelectedId = analysisId;
      void loadPolicyAlignmentDetail(analysisId, { silent: false });
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

  elements.stepView.querySelectorAll('[data-action="view-policy-framework-document"]').forEach((button) => {
    button.addEventListener('click', () => {
      const documentId = String(button.dataset.documentId || '').trim();
      const currentFramework = selectedPolicyAlignmentFrameworkFromState();
      const documentItem = (Array.isArray(currentFramework?.documents) ? currentFramework.documents : []).find((item) => String(item?.id || '').trim() === documentId);
      if (!currentFramework || !documentItem) return;
      openPolicyAlignmentFrameworkDocumentModal(currentFramework, documentItem);
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
