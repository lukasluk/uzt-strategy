// Map-specific rendering and interaction functions extracted from app.js
// This file must be loaded before app.js.

function ensureMapRuntimeDependencies() {
  const requiredFunctions = [
    'layoutStrategyMap',
    'layoutStrategicLinksMap',
    'edgePath',
    'applyMapTransform',
    'updateMapFullscreenButtonLabel',
    'fitMapToCurrentNodes',
    'syncMapNodeBounds',
    'refreshMapEdges',
    'resetMapInitiativeFocusState',
    'flushPendingMapNodeFocus',
    'applyInitiativeLayerFocusState',
    'bindInitiativeLayerFocusInteractions',
    'bindMapInteractions',
    'buildMapHeaderMarkup',
    'buildMapToolbarMarkup',
    'buildGuidelineEdgeMarkup',
    'buildStrategyGuidelineEdgeMarkup',
    'buildStrategicEdgeMarkup',
    'buildInitiativeEdgeMarkup',
    'buildNodeMarkup',
    'bindMapCommentModalInteractions',
    'bindMapStrategyNavigationInteractions',
    'bindMapViewportControlInteractions',
    'buildMapViewShellMarkup'
  ];
  const missing = requiredFunctions.filter((name) => typeof globalThis[name] !== 'function');
  if (!missing.length) return true;

  const errorText = `Map runtime dependencies missing: ${missing.join(', ')}`;
  console.error(errorText);
  const hasElements = typeof elements !== 'undefined' && elements && elements.stepView;
  const safeEscape = typeof escapeHtml === 'function'
    ? escapeHtml
    : (value) => String(value || '');
  if (hasElements) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Map module load error</strong>
        <p class="prompt" style="margin: 8px 0 0;">${safeEscape(errorText)}</p>
      </div>
    `;
  }
  return false;
}

function notifyMapError(message) {
  const text = String(message || '').trim();
  if (!text) return;
  if (window.DigiAlerts && typeof window.DigiAlerts.error === 'function') {
    window.DigiAlerts.error(text);
  }
}

function renderMapLoadingState() {
  elements.stepView.innerHTML = '<div class="card"><strong>Kraunamas strategijų žemėlapis...</strong></div>';
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
      <strong>Strategijų žemėlapis dar tuščias</strong>
      <p class="prompt" style="margin: 8px 0 0;">Kai institucijos turės strategijas, jos atsiras šiame žemėlapyje.</p>
    </div>
  `;
}

function renderMapInstitutionPromptState() {
  elements.stepView.innerHTML = `
    <div class="card">
      <strong>Pasirinkite instituciją</strong>
      <p class="prompt" style="margin: 8px 0 0;">Žemėlapyje rodoma tik viršuje pasirinktos institucijos strategija.</p>
    </div>
  `;
}

function resolveActiveMapLayer(primaryGraph) {
  const hasInitiativeNodes = primaryGraph.nodes.some((node) => node.kind === 'initiative');
  if (state.mapLayer !== 'guidelines' && state.mapLayer !== 'initiatives' && state.mapLayer !== 'strategic-links') {
    state.mapLayer = 'guidelines';
  }
  if (state.mapLayer === 'initiatives' && !hasInitiativeNodes) {
    state.mapLayer = 'guidelines';
  }
  const activeLayer = state.mapLayer;
  if (activeLayer !== 'initiatives') {
    resetMapInitiativeFocusState();
  }
  return { activeLayer, hasInitiativeNodes };
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

function resolveMapGraphForLayer(primaryGraph, activeLayer) {
  if (activeLayer !== 'strategic-links') return primaryGraph;

  const perspectiveKey = typeof mapPerspectiveKey === 'function'
    ? mapPerspectiveKey()
    : `${normalizeSlug(state.institutionSlug)}|${normalizeSlug(state.strategySlug)}`;
  const hasFreshStrategicData = state.mapStrategicLinksData?.contextKey === perspectiveKey;

  if (!hasFreshStrategicData) {
    if (!state.mapStrategicLinksLoading && typeof ensureStrategicLinksData === 'function') {
      ensureStrategicLinksData()
        .then(() => {
          if (state.activeView === 'map' && state.mapLayer === 'strategic-links') renderStepView();
        })
        .catch(() => {
          if (state.activeView === 'map' && state.mapLayer === 'strategic-links') renderStepView();
        });
    }
    renderStrategicLinksPendingState();
    return null;
  }

  return layoutStrategicLinksMap(state.mapStrategicLinksData);
}

function setMapLayerAndRender(nextLayer) {
  if (state.mapLayer === nextLayer) return;
  state.mapLayer = nextLayer;
  resetMapInitiativeFocusState();
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


function renderMapView() {
  document.body.classList.remove('map-comment-modal-open');
  if (!ensureMapRuntimeDependencies()) return;

  if (state.loading && !state.mapData) {
    renderMapLoadingState();
    return;
  }
  if (state.mapError) {
    renderMapErrorState();
    return;
  }
  if (!Array.isArray(state.mapData?.institutions) || !state.mapData.institutions.length) {
    renderMapEmptyState();
    return;
  }
  const primaryGraph = layoutStrategyMap();
  if (!primaryGraph.institution) {
    renderMapInstitutionPromptState();
    return;
  }
  const { activeLayer, hasInitiativeNodes } = resolveActiveMapLayer(primaryGraph);
  const graph = resolveMapGraphForLayer(primaryGraph, activeLayer);
  if (!graph) return;

  const editable = activeLayer !== 'strategic-links'
    && canEditMapLayout()
    && normalizeSlug(graph.institution.slug) === normalizeSlug(state.institutionSlug)
    && Boolean(graph.institution.cycle?.id);
  const embedBranding = state.embedMapMode
    ? `
      <p class="embed-map-branding-note">
        <a href="${escapeHtml(EMBED_BRAND_LINK)}" target="_blank" rel="noopener noreferrer">
          Strategijų žemėlapis by digistrategy.eu
        </a>
      </p>
    `
    : '';
  const mapHeader = buildMapHeaderMarkup({ graph, activeLayer, editable });
  const mapToolbar = buildMapToolbarMarkup({ activeLayer, hasInitiativeNodes });
  const strategicNoLinksMarkup = activeLayer === 'strategic-links' && !graph.hasStrategicLinks
    ? '<div class="map-strategic-empty-note">No strategic links</div>'
    : '';
  const mapWatermarkClass = state.embedMapMode ? 'map-fullscreen-watermark embed-visible' : 'map-fullscreen-watermark';
  const nodeById = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  const guidelineEdgeMarkup = buildGuidelineEdgeMarkup({ graph, nodeById, activeLayer });
  const strategyGuidelineEdgeMarkup = buildStrategyGuidelineEdgeMarkup({ graph, nodeById });
  const strategicEdgeMarkup = buildStrategicEdgeMarkup({ graph, nodeById });
  const initiativeEdgeMarkup = buildInitiativeEdgeMarkup({ graph, nodeById });

  const nodeMarkup = buildNodeMarkup({ graph, activeLayer, editable });

  elements.stepView.innerHTML = buildMapViewShellMarkup({
    mapHeader,
    activeLayer,
    editable,
    mapToolbar,
    strategicNoLinksMarkup,
    graph,
    guidelineEdgeMarkup,
    strategyGuidelineEdgeMarkup,
    initiativeEdgeMarkup,
    nodeMarkup,
    strategicEdgeMarkup,
    mapWatermarkClass,
    embedBranding
  });

  const viewport = elements.stepView.querySelector('#strategyMapViewport');
  const world = elements.stepView.querySelector('#strategyMapWorld');
  bindMapCommentModalInteractions({ stepView: elements.stepView, graph });
  bindMapStrategyNavigationInteractions({
    stepView: elements.stepView,
    viewport,
    navigateToStrategyLink,
    navigateToStrategyPerspective
  });

  const layerGuidelinesButtons = Array.from(elements.stepView.querySelectorAll('[data-map-layer-btn="guidelines"]'));
  const layerInitiativesButtons = Array.from(elements.stepView.querySelectorAll('[data-map-layer-btn="initiatives"]'));
  const layerStrategicButtons = Array.from(elements.stepView.querySelectorAll('[data-map-layer-btn="strategic-links"]'));
  bindMapLayerButtons(layerGuidelinesButtons, layerInitiativesButtons, layerStrategicButtons);

  if (viewport && world) {
    syncMapNodeBounds(world);
    refreshMapEdges(world);
    fitMapToCurrentNodes(viewport, world);
    bindMapInteractions(viewport, world, { editable });
    bindInitiativeLayerFocusInteractions(viewport, world);
    applyInitiativeLayerFocusState(viewport, world);
    flushPendingMapNodeFocus(viewport, world);

    const remainingInstitutionPulseMs = Math.max(0, Number(state.mapInstitutionPulseUntil || 0) - Date.now());
    if (state.mapInstitutionPulseTimerId) {
      window.clearTimeout(state.mapInstitutionPulseTimerId);
      state.mapInstitutionPulseTimerId = 0;
    }
    if (remainingInstitutionPulseMs > 0) {
      state.mapInstitutionPulseTimerId = window.setTimeout(() => {
        state.mapInstitutionPulseTimerId = 0;
        state.mapInstitutionPulseUntil = 0;
        if (state.activeView === 'map') {
          renderStepView();
        }
      }, remainingInstitutionPulseMs + 30);
    }
  }
  bindMapViewportControlInteractions({
    stepView: elements.stepView,
    viewport,
    world,
    onFullscreenError: (error) => {
      state.notice = toUserMessage(error);
      notifyMapError(state.notice);
      render();
    }
  });
}


