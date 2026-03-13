// Map view state-card and layer-toggle helpers extracted from app-map.js.
// This file must load before app-map.js.

function renderMapLoadingState() {
  elements.stepView.innerHTML = '<div class="card"><strong>Kraunamas strategiju zemelapis...</strong></div>';
}

function renderMapErrorState() {
  elements.stepView.innerHTML = `
    <div class="card">
      <strong>Nepavyko ikelti strategiju zemelapio</strong>
      <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.mapError)}</p>
      <button id="retryMapLoadBtn" class="btn btn-primary" style="margin-top: 12px;">Bandyti dar karta</button>
    </div>
  `;
  const retryBtn = elements.stepView.querySelector('#retryMapLoadBtn');
  if (retryBtn) retryBtn.addEventListener('click', bootstrap);
}

function renderMapEmptyState() {
  elements.stepView.innerHTML = `
    <div class="card">
      <strong>Strategiju zemelapis dar tuscias</strong>
      <p class="prompt" style="margin: 8px 0 0;">Kai institucijos tures strategijas, jos atsiras siame zemelapyje.</p>
    </div>
  `;
}

function renderMapInstitutionPromptState() {
  elements.stepView.innerHTML = `
    <div class="card">
      <strong>Pasirinkite institucija</strong>
      <p class="prompt" style="margin: 8px 0 0;">Zemelapyje rodoma tik virsuje pasirinktos institucijos strategija.</p>
    </div>
  `;
}

function renderStrategicLinksPendingState() {
  if (state.mapStrategicLinksError) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>${escapeHtml(mapLang('Nepavyko ikelti strateginiu rysiu', 'Failed to load strategic links'))}</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.mapStrategicLinksError)}</p>
        <button id="retryStrategicLinksBtn" class="btn btn-primary" style="margin-top: 12px;">${escapeHtml(mapLang('Bandyti dar karta', 'Try again'))}</button>
      </div>
    `;
    const retryStrategicBtn = elements.stepView.querySelector('#retryStrategicLinksBtn');
    if (retryStrategicBtn) {
      retryStrategicBtn.addEventListener('click', async () => {
        if (typeof ensureStrategicLinksData !== 'function') return;
        state.mapStrategicLinksError = '';
        state.mapStrategicLinksLoading = true;
        renderStepView();
        try {
          await ensureStrategicLinksData({ force: true });
        } catch {
          // Error already handled in state.
        }
        renderStepView();
      });
    }
    return;
  }

  elements.stepView.innerHTML = `<div class="card"><strong>${escapeHtml(mapLang('Kraunami strateginiai rysiai...', 'Loading strategic links...'))}</strong></div>`;
}

function setMapLayerAndRender(nextLayer) {
  if (state.mapLayer === nextLayer) return;
  if (state.mapPlanAnimationFrameId) {
    window.cancelAnimationFrame(state.mapPlanAnimationFrameId);
    state.mapPlanAnimationFrameId = 0;
  }
  state.mapPlanPlaying = false;
  state.mapPlanPlaybackStartedAt = 0;
  state.mapLayer = nextLayer;
  state.mapGuidelinesShowInitiatives = false;
  state.mapPlanProgress = 0;
  resetMapInitiativeFocusState();
  renderStepView();
}

function focusGuidelineInitiativesInMap(guidelineId) {
  const nextId = String(guidelineId || '').trim();
  if (!nextId) return;
  if (state.mapPlanAnimationFrameId) {
    window.cancelAnimationFrame(state.mapPlanAnimationFrameId);
    state.mapPlanAnimationFrameId = 0;
  }
  state.mapPlanPlaying = false;
  state.mapPlanPlaybackStartedAt = 0;
  state.mapPlanProgress = 0;
  state.mapLayer = 'initiatives';
  state.mapGuidelinesShowInitiatives = false;
  resetMapInitiativeFocusState();
  state.pendingMapFocusKind = 'guideline';
  state.pendingMapFocusId = nextId;
  renderStepView();
}

function bindMapLayerButtons(layerGuidelinesButtons, layerInitiativesButtons, layerStrategicButtons) {
  layerGuidelinesButtons.forEach((button) => {
    button.addEventListener('click', () => setMapLayerAndRender('guidelines'));
  });
  layerInitiativesButtons.forEach((button) => {
    button.addEventListener('click', () => setMapLayerAndRender('initiatives'));
  });
  layerStrategicButtons.forEach((button) => {
    button.addEventListener('click', () => setMapLayerAndRender('strategic-links'));
  });
}

function bindMapPlanButtons(planButtons) {
  planButtons.forEach((button) => {
    button.addEventListener('click', () => setMapLayerAndRender('plan'));
  });
}
