
function policyAlignmentAnalysisStatusLabel(status) {
  const key = String(status || '').trim().toLowerCase();
  if (key === 'draft') return langText('Juodraštis', 'Draft');
  if (key === 'queued') return langText('Eilėje', 'Queued');
  if (key === 'processing') return langText('Analizuojama', 'Processing');
  if (key === 'completed') return langText('Užbaigta', 'Completed');
  if (key === 'failed') return langText('Nepavyko', 'Failed');
  return key || '-';
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
    if (!state.policyAlignmentFrameworkSelectedId && state.policyAlignmentFrameworks[0]?.id) {
      state.policyAlignmentFrameworkSelectedId = state.policyAlignmentFrameworks[0].id;
    }
    return state.policyAlignmentFrameworks;
  } catch (error) {
    state.policyAlignmentFrameworks = [];
    state.policyAlignmentFrameworkError = toUserMessage(error);
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
function openPolicyAlignmentCreateModal() {
  if (!state.cycle?.id) return;
  const existing = document.getElementById('policyAlignmentCreateOverlay');
  if (existing) existing.remove();
  const frameworks = sortedPolicyAlignmentFrameworks(state.policyAlignmentFrameworks);
  const selectedFrameworkId = String(state.policyAlignmentFrameworkSelectedId || frameworks[0]?.id || '').trim();

  const overlay = document.createElement('div');
  overlay.id = 'policyAlignmentCreateOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card policy-alignment-modal-card" role="dialog" aria-modal="true" aria-labelledby="policyAlignmentCreateTitle">
      <div class="auth-modal-header">
        <div>
          <h3 id="policyAlignmentCreateTitle">${escapeHtml(langText('Nauja Policy Alignment analizė', 'New Policy Alignment analysis'))}</h3>
          <p class="prompt" style="margin: 6px 0 0;">${escapeHtml(langText('Įkelkite šaltinio ir tikslinį dokumentus, tada paleiskite AI palyginimą.', 'Upload source and target documents, then run the AI comparison.'))}</p>
        </div>
        <button type="button" class="btn btn-ghost" id="closePolicyAlignmentCreateModal">${escapeHtml(langText('Uždaryti', 'Close'))}</button>
      </div>
      <form id="policyAlignmentCreateForm" class="policy-alignment-create-form">
        <div class="inline-form-grid">
          <input type="text" name="title" placeholder="${escapeHtml(langText('Analizės pavadinimas', 'Analysis title'))}" required />
          <select name="targetMode" id="policyAlignmentTargetMode">
            <option value="uploaded_document">${escapeHtml(langText('Tikslas: įkelti dokumentą', 'Target: uploaded document'))}</option>
            <option value="framework" ${frameworks.length ? '' : 'disabled'}>${escapeHtml(langText('Tikslas: iš bibliotekos', 'Target: from library'))}</option>
          </select>
        </div>
        <div class="inline-form-grid">
          <select name="sourceMode">
            <option value="mixed">${escapeHtml(langText('Mišrus šaltinis', 'Mixed source'))}</option>
            <option value="existing_strategy">${escapeHtml(langText('Tik esama strategija', 'Existing strategy only'))}</option>
            <option value="existing_cycle">${escapeHtml(langText('Tik esamas ciklas', 'Existing cycle only'))}</option>
            <option value="uploaded_document">${escapeHtml(langText('Tik įkelti dokumentai', 'Uploaded documents only'))}</option>
          </select>
          <select name="targetFrameworkId" id="policyAlignmentFrameworkSelect" ${frameworks.length ? '' : 'disabled'} hidden>
            <option value="">${escapeHtml(langText('Pasirinkite karkasą', 'Select framework'))}</option>
            ${frameworks.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedFrameworkId ? 'selected' : ''}>${escapeHtml(item.title)} (${item.requirementCount})</option>`).join('')}
          </select>
        </div>
        <textarea name="description" placeholder="${escapeHtml(langText('Trumpas analizės tikslas', 'Short analysis objective'))}"></textarea>
        <div class="policy-alignment-upload-grid" id="policyAlignmentUploadGrid">
          <label class="policy-alignment-upload-card">
            <strong>${escapeHtml(langText('Šaltinio dokumentai', 'Source documents'))}</strong>
            <span class="prompt">${escapeHtml(langText('Nebūtina, jei remiatės esama strategija ar ciklu.', 'Optional if you rely on the existing strategy or cycle.'))}</span>
            <input type="file" id="policyAlignmentSourceFiles" accept="application/pdf,.pdf" multiple />
          </label>
          <label class="policy-alignment-upload-card">
            <strong>${escapeHtml(langText('Tikslinis politikos dokumentas', 'Target policy document'))}</strong>
            <span class="prompt">${escapeHtml(langText('Privaloma bent vienas PDF dokumentas.', 'At least one PDF is required.'))}</span>
            <input type="file" id="policyAlignmentTargetFiles" accept="application/pdf,.pdf" multiple required />
          </label>
        </div>
        <div class="inline-form-grid">
          <select name="localeHint">
            <option value="en">${escapeHtml(langText('Rezultatai EN', 'Results in EN'))}</option>
            <option value="lt">${escapeHtml(langText('Rezultatai LT', 'Results in LT'))}</option>
          </select>
          <label class="policy-alignment-checkbox" id="policyAlignmentSaveFrameworkWrap">
            <input type="checkbox" name="saveTargetAsFramework" value="true" ${state.role === 'institution_admin' ? '' : 'disabled'} />
            <span>${escapeHtml(langText('Išsaugoti tikslą kaip pakartotinai naudojamą karkasą', 'Save target as reusable framework'))}</span>
          </label>
        </div>
        <div id="policyAlignmentCreateError" class="auth-error" style="display:none;"></div>
        <div class="form-actions">
          <button type="submit" id="policyAlignmentCreateSubmit" class="btn btn-primary">${escapeHtml(langText('Sukurti ir paleisti analizę', 'Create and run analysis'))}</button>
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
  const targetInput = overlay.querySelector('#policyAlignmentTargetFiles');
  const targetModeSelect = overlay.querySelector('#policyAlignmentTargetMode');
  const frameworkSelect = overlay.querySelector('#policyAlignmentFrameworkSelect');
  const uploadGrid = overlay.querySelector('#policyAlignmentUploadGrid');
  const saveFrameworkWrap = overlay.querySelector('#policyAlignmentSaveFrameworkWrap');

  function showError(message) {
    const text = String(message || '').trim();
    errorBox.textContent = text;
    errorBox.style.display = text ? 'block' : 'none';
    if (text) notifyError(text);
  }

  function syncTargetModeUi() {
    const mode = String(targetModeSelect?.value || 'uploaded_document').trim().toLowerCase();
    const useFramework = mode === 'framework';
    if (frameworkSelect) {
      frameworkSelect.hidden = !useFramework;
      frameworkSelect.disabled = !useFramework || !frameworks.length;
    }
    if (uploadGrid) uploadGrid.hidden = useFramework;
    if (saveFrameworkWrap) saveFrameworkWrap.hidden = useFramework;
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModal();
  });
  targetModeSelect?.addEventListener('change', syncTargetModeUi);
  syncTargetModeUi();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');
    if (!submitButton) return;
    const fd = new FormData(form);
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim();
    const sourceMode = String(fd.get('sourceMode') || 'mixed').trim().toLowerCase();
    const targetMode = String(fd.get('targetMode') || 'uploaded_document').trim().toLowerCase();
    const targetFrameworkId = String(fd.get('targetFrameworkId') || '').trim();
    const localeHint = String(fd.get('localeHint') || currentLanguage() || 'en').trim().toLowerCase();
    const saveTargetAsFramework = String(fd.get('saveTargetAsFramework') || '').trim().toLowerCase() === 'true';
    const sourceFiles = Array.from(sourceInput?.files || []);
    const targetFiles = Array.from(targetInput?.files || []);

    if (!title) {
      showError(toUserMessage(new Error('analysis title required')));
      return;
    }
    if (targetMode === 'framework' && !targetFrameworkId) {
      showError(toUserMessage(new Error('analysis target framework required')));
      return;
    }
    if (targetMode !== 'framework' && !targetFiles.length) {
      showError(toUserMessage(new Error('target documents required')));
      return;
    }
    if (sourceMode === 'uploaded_document' && !sourceFiles.length) {
      showError(toUserMessage(new Error('source material required')));
      return;
    }

    submitButton.disabled = true;
    const initialLabel = submitButton.textContent;
    submitButton.textContent = langText('Vykdoma...', 'Running...');
    try {
      const created = await api(`/api/v1/cycles/${encodeURIComponent(state.cycle.id)}/policy-alignments`, {
        method: 'POST',
        body: {
          title,
          description,
          sourceMode,
          targetMode,
          targetFrameworkId: targetMode === 'framework' ? targetFrameworkId : undefined
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

      if (targetMode !== 'framework') {
        const targetForm = new FormData();
        targetForm.append('role', 'target');
        targetForm.append('replaceExisting', 'true');
        targetFiles.forEach((file) => targetForm.append('documents', file));
        await api(`/api/v1/policy-alignments/${encodeURIComponent(analysisId)}/documents`, {
          method: 'POST',
          body: targetForm
        });
      }

      const executed = await api(`/api/v1/policy-alignments/${encodeURIComponent(analysisId)}/run`, {
        method: 'POST',
        body: { localeHint, saveTargetAsFramework: targetMode === 'framework' ? false : saveTargetAsFramework }
      });
      const finalAnalysis = normalizePolicyAlignmentAnalysis(executed?.analysis);
      if (finalAnalysis) {
        state.policyAlignmentCurrent = finalAnalysis;
        state.policyAlignmentSelectedId = finalAnalysis.id;
      }
      await refreshPolicyAlignments({ selectedId: analysisId, silent: true });
      closeModal();
      notifySuccess(langText('Policy Alignment analizė parengta.', 'Policy Alignment analysis completed.'));
      render();
    } catch (error) {
      showError(toUserMessage(error));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = initialLabel;
    }
  });
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

  if (!state.policyAlignmentLoading && state.policyAlignmentCycleId !== String(state.cycle.id || '').trim()) {
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

  const analysis = selectedPolicyAlignmentFromState();
  const analyses = sortedPolicyAlignments(state.policyAlignments);
  const frameworks = sortedPolicyAlignmentFrameworks(state.policyAlignmentFrameworks);
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

  elements.stepView.innerHTML = `
    <div class="step-header">
      <div class="header-stack step-header-actions">
        <button id="openPolicyAlignmentCreateBtn" class="btn btn-primary">${escapeHtml(langText('Nauja analizė', 'New analysis'))}</button>
        <button id="refreshPolicyAlignmentBtn" class="btn btn-ghost">${escapeHtml(langText('Atnaujinti', 'Refresh'))}</button>
        <span class="tag">${langText('Institucija', 'Institution')}: ${escapeHtml(state.institution?.name || state.institutionSlug)}</span>
        <span class="tag">${langText('Strategija', 'Strategy')}: ${escapeHtml(state.strategy?.title || '-')}</span>
        <span class="tag">${langText('Analizių', 'Analyses')}: ${analyses.length}</span>
      </div>
    </div>

    <p class="prompt">${escapeHtml(stepPrompt('policy-alignment'))}</p>
    ${state.policyAlignmentError ? `<div class="card" style="margin-bottom: 12px;"><strong>${escapeHtml(state.policyAlignmentError)}</strong></div>` : ''}
    ${state.policyAlignmentLoading ? `<div class="card" style="margin-bottom: 12px;"><strong>${escapeHtml(langText('Kraunamos Policy Alignment analizės...', 'Loading Policy Alignment analyses...'))}</strong></div>` : ''}

    <section class="policy-alignment-layout">
      <div class="policy-alignment-column policy-alignment-column-list">
        <div class="card" style="margin-bottom: 16px;">
          <div class="guideline-group-header">
            <strong>${escapeHtml(langText('Karkasų biblioteka', 'Framework library'))}</strong>
            <span class="tag">${frameworks.length}</span>
          </div>
          ${state.policyAlignmentFrameworkError ? `<p class="prompt">${escapeHtml(state.policyAlignmentFrameworkError)}</p>` : ''}
          ${state.policyAlignmentFrameworkLoading ? `<p class="prompt">${escapeHtml(langText('Kraunami karkasai...', 'Loading frameworks...'))}</p>` : ''}
          ${frameworks.length
    ? `<div class="policy-alignment-analysis-list">
              ${frameworks.map((item) => `
                <button
                  type="button"
                  class="policy-alignment-analysis-item${state.policyAlignmentFrameworkSelectedId === item.id ? ' active' : ''}"
                  data-action="select-policy-framework"
                  data-framework-id="${escapeHtml(item.id)}"
                >
                  <strong>${escapeHtml(item.title || item.id)}</strong>
                  <span>${escapeHtml(formatCommentDateTime(item.updatedAt || item.createdAt))}</span>
                  <div class="policy-alignment-chip-list">
                    <span class="tag">${escapeHtml(langText('Reikalavimų', 'Requirements'))}: ${Number(item.requirementCount || 0)}</span>
                    <span class="tag">${escapeHtml(langText('Dokumentų', 'Documents'))}: ${Number(item.documentCount || 0)}</span>
                  </div>
                </button>
              `).join('')}
            </div>`
    : `<p class="prompt">${escapeHtml(langText('Išsaugotų karkasų dar nėra. Juos sukursite pažymėję išsaugojimą analizės paleidimo metu.', 'No saved frameworks yet. They are created when you save a target during analysis run.'))}</p>`}
        </div>
        <div class="card">
          <div class="guideline-group-header">
            <strong>${escapeHtml(langText('Analizių sąrašas', 'Analysis list'))}</strong>
            <span class="tag">${analyses.length}</span>
          </div>
          ${analyses.length
    ? `<div class="policy-alignment-analysis-list">
              ${analyses.map((item) => `
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
                    <span class="tag">${escapeHtml(langText('Radiniai', 'Findings'))}: ${Number(item.findingCount || 0)}</span>
                  </div>
                </button>
              `).join('')}
            </div>`
    : `<p class="prompt">${escapeHtml(langText('Dar nėra analizės įrašų. Sukurkite pirmą Policy Alignment analizę.', 'No analysis records yet. Create the first Policy Alignment analysis.'))}</p>`}
        </div>
      </div>

      <div class="policy-alignment-column policy-alignment-column-main">
        ${analysis
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
        ? `<span class="tag">${escapeHtml(langText('Karkasas', 'Framework'))}: ${escapeHtml(frameworkById.get(analysis.targetFrameworkId).title)}</span>`
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
    : `<div class="card"><strong>${escapeHtml(langText('Pasirinkite analizę arba sukurkite naują.', 'Select an analysis or create a new one.'))}</strong></div>`}
      </div>
    </section>
  `;

  const createBtn = elements.stepView.querySelector('#openPolicyAlignmentCreateBtn');
  if (createBtn) createBtn.addEventListener('click', openPolicyAlignmentCreateModal);
  const refreshBtn = elements.stepView.querySelector('#refreshPolicyAlignmentBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => {
    void refreshPolicyAlignments({ selectedId: analysis?.id || '', silent: false });
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

  elements.stepView.querySelectorAll('[data-action="select-policy-framework"]').forEach((button) => {
    button.addEventListener('click', () => {
      const frameworkId = String(button.dataset.frameworkId || '').trim();
      if (!frameworkId) return;
      state.policyAlignmentFrameworkSelectedId = frameworkId;
      renderPolicyAlignmentView();
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
