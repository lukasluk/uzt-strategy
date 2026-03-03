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

function buildMapCommentItems(graph) {
  const items = new Map();
  graph.nodes.forEach((node) => {
    if (node.kind === 'guideline' && node.guideline?.id) {
      items.set(`guideline:${node.guideline.id}`, {
        kind: 'guideline',
        id: node.guideline.id,
        title: node.guideline.title || 'Gairė',
        description: node.guideline.description || 'Aprašymas nepateiktas.',
        comments: Array.isArray(node.guideline.comments) ? node.guideline.comments : []
      });
    }
    if (node.kind === 'initiative' && node.initiative?.id) {
      items.set(`initiative:${node.initiative.id}`, {
        kind: 'initiative',
        id: node.initiative.id,
        title: node.initiative.title || 'Iniciatyva',
        description: node.initiative.description || 'Aprašymas nepateiktas.',
        comments: Array.isArray(node.initiative.comments) ? node.initiative.comments : []
      });
    }
  });
  return items;
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

  const nodeMarkup = graph.nodes.map((node) => {
    if (node.kind === 'institution') {
      const cycleState = node.institution.cycle?.state || '-';
      const strategyTitle = String(
        node.institution.strategy?.title || state.strategy?.title || mapLang('Strategija', 'Strategy')
      ).trim();
      const pulseActive = Date.now() < Number(state.mapInstitutionPulseUntil || 0);
      const relatedInstitutionInStrategicLayer = activeLayer === 'strategic-links' && node.clusterRole === 'related';
      const switchPerspectiveLabel = mapLang('Atidaryti strategijos perspektyva', 'Open strategy perspective');
      const institutionClass = [
        'strategy-map-node',
        'institution-node',
        node.institution.slug === state.institutionSlug ? 'active' : '',
        pulseActive ? 'pulse-active' : '',
        activeLayer === 'strategic-links' && node.strategyTone ? 'map-strategy-colored' : '',
        relatedInstitutionInStrategicLayer ? 'map-strategy-related' : '',
        activeLayer === 'strategic-links' && node.clusterRole === 'active' ? 'map-strategy-active' : '',
        activeLayer === 'strategic-links' && node.canSwitchPerspective ? 'map-strategy-switchable' : ''
      ].filter(Boolean).join(' ');
      const perspectiveAttrs = activeLayer === 'strategic-links' && node.canSwitchPerspective
        ? `data-action="open-strategy-perspective" data-map-interactive="true" data-target-institution="${escapeHtml(node.institution.slug || '')}" data-target-strategy="${escapeHtml(node.institution.strategy?.slug || '')}" role="button" tabindex="0" aria-label="${escapeHtml(switchPerspectiveLabel)}" title="${escapeHtml(switchPerspectiveLabel)}"`
        : '';
      const strategicNodeTag = activeLayer === 'strategic-links'
        ? (node.clusterRole === 'related'
          ? `<span class="tag">${escapeHtml(mapLang('Susieta strategija', 'Linked strategy'))}</span>`
          : '')
        : `<span class="tag">${escapeHtml(cycleState.toUpperCase())}</span>`;
      const cycleStatusLine = activeLayer === 'strategic-links'
        ? ''
        : `<small class="institution-cycle-label">${escapeHtml(mapLang('Strategijos ciklo busena', 'Strategy cycle status'))}</small>`;
      const strategyToneStyle = activeLayer === 'strategic-links' && node.strategyTone
        ? `--strategy-pastel:${escapeHtml(node.strategyTone.pastel)};--strategy-border:${escapeHtml(node.strategyTone.border)};--strategy-ink:${escapeHtml(node.strategyTone.ink)};`
        : '';
      return `
        <article class="${institutionClass}"
                 data-node-id="${escapeHtml(node.id)}"
                 data-kind="institution"
                 data-entity-id="${escapeHtml(node.entityId)}"
                 data-cycle-id="${escapeHtml(node.cycleId || '')}"
                 data-x="${node.x}"
                 data-y="${node.y}"
                 data-w="${node.w}"
                 data-h="${node.h}"
                 data-draggable="${editable ? 'true' : 'false'}"
                 ${perspectiveAttrs}
                 style="${strategyToneStyle}left:${node.x}px;top:${node.y}px;width:${node.w}px;min-height:${node.h}px;">
          <strong>${escapeHtml(node.institution.name)}</strong>
          <small class="institution-subtitle">${escapeHtml(strategyTitle)}</small>
          ${strategicNodeTag}
          ${cycleStatusLine}
        </article>
      `;
    }

    if (node.kind === 'guideline') {
      const relation = String(node.guideline.relationType || 'orphan');
      const relationText = relationLabel(relation);
      const score = Number(node.guideline.totalScore || 0);
      const mapCommentCount = Math.max(
        0,
        Array.isArray(node.guideline.comments)
          ? node.guideline.comments.length
          : Number(node.guideline.commentCount || 0)
      );
      const strategyLinkCount = Math.max(
        0,
        Array.isArray(node.guideline.strategyLinks)
          ? node.guideline.strategyLinks.length
          : Number(node.guideline.strategyLinkCount || 0)
      );
      const strategyLinks = relation === 'parent' && activeLayer !== 'strategic-links'
        ? mapNormalizeStrategyLinks(node.guideline.strategyLinks).filter((item) => !item || item.isCrossStrategy !== false)
        : [];
      const uniqueLinks = [];
      const seenLinkKeys = new Set();
      strategyLinks.forEach((link) => {
        const key = [
          String(link.otherInstitutionSlug || '').trim().toLowerCase(),
          String(link.otherStrategySlug || '').trim().toLowerCase(),
          String(link.otherGuidelineId || '').trim()
        ].join('|');
        if (!String(link.otherGuidelineId || '').trim()) return;
        if (seenLinkKeys.has(key)) return;
        seenLinkKeys.add(key);
        uniqueLinks.push(link);
      });
      const scoreForSquares = Math.max(0, Math.round(score));
      const voteSquares = scoreForSquares
        ? Array.from({ length: scoreForSquares }, () => '<span class="map-vote-square" aria-hidden="true"></span>').join('')
        : '<span class="map-vote-empty">Dar nebalsuota</span>';
      const strategyLinkChip = relation === 'parent' && activeLayer !== 'strategic-links'
        ? `<span class="map-strategy-link-chip" title="${escapeHtml(mapLang('Strateginiai rysiai tarp teviniu gairiu', 'Strategic links between parent guidelines'))}">${escapeHtml(mapLang('Rysiai', 'Links'))}: ${strategyLinkCount}</span>`
        : '';
      const strategicFocusChip = activeLayer === 'strategic-links' && node.isStrategicLinked
        ? `<span class="map-strategy-link-chip" title="${escapeHtml(mapLang('Gaire turi tarpstrategini rysi', 'Guideline has a cross-strategy link'))}">${escapeHtml(mapLang('Susieta', 'Linked'))}</span>`
        : '';
      const strategyLinkListMarkup = relation === 'parent' && uniqueLinks.length && activeLayer !== 'strategic-links'
        ? `
          <div class="map-strategy-link-list">
            ${uniqueLinks.slice(0, 2).map((link) => `
              <button
                type="button"
                class="map-strategy-link-btn"
                data-map-interactive="true"
                data-action="open-strategy-link"
                data-target-institution="${escapeHtml(link.otherInstitutionSlug)}"
                data-target-strategy="${escapeHtml(link.otherStrategySlug)}"
                data-target-guideline="${escapeHtml(link.otherGuidelineId)}"
                title="Atidaryti susieta gaires konteksta"
              >${escapeHtml(mapStrategyLinkLabel(link))}</button>
            `).join('')}
            ${uniqueLinks.length > 2 ? `<span class="map-strategy-link-more">+${uniqueLinks.length - 2}</span>` : ''}
          </div>
        `
        : '';
      const strategicGuidelineClass = activeLayer === 'strategic-links'
        ? ` map-strategy-colored ${node.clusterRole === 'related' ? 'map-strategy-related' : 'map-strategy-active'} ${node.isStrategicLinked ? 'map-strategic-linked' : 'map-strategic-unlinked'}`
        : '';
      const guidelineOwnerLabel = activeLayer === 'strategic-links'
        ? `${String(node.institution.name || node.institution.slug || '').trim()} / ${String(node.institution.strategy?.title || '-').trim()}`
        : `${String(node.institution.slug || '').trim()} - ${relationText}`;
      const guidelineToneStyle = activeLayer === 'strategic-links' && node.strategyTone
        ? `--strategy-pastel:${escapeHtml(node.strategyTone.pastel)};--strategy-border:${escapeHtml(node.strategyTone.border)};--strategy-ink:${escapeHtml(node.strategyTone.ink)};`
        : '';

      return `
        <article class="strategy-map-node guideline-node relation-${escapeHtml(relation)} status-${escapeHtml(String(node.guideline.status || 'active').toLowerCase())}${strategicGuidelineClass}"
                 data-layer="guidelines"
                 data-node-id="${escapeHtml(node.id)}"
                 data-kind="guideline"
                 data-entity-id="${escapeHtml(node.entityId)}"
                 data-cycle-id="${escapeHtml(node.cycleId || '')}"
                 data-x="${node.x}"
                 data-y="${node.y}"
                 data-w="${node.w}"
                 data-h="${node.h}"
                 data-draggable="${editable ? 'true' : 'false'}"
                 style="${guidelineToneStyle}left:${node.x}px;top:${node.y}px;width:${node.w}px;min-height:${node.h}px;">
          <div class="map-node-head">
            <h4>${escapeHtml(node.guideline.title)}</h4>
            <button
              type="button"
              class="map-comment-btn"
              data-map-comment-kind="guideline"
              data-map-comment-id="${escapeHtml(node.guideline.id)}"
              data-map-interactive="true"
              aria-label="Rodyti aprašymą ir komentarus"
              title="Rodyti aprašymą ir komentarus"
            >
              <span class="map-comment-icon" aria-hidden="true">${MAP_COMMENT_ICON_SVG}</span>
              <span class="map-comment-count">${mapCommentCount}</span>
            </button>
          </div>
          <small>${escapeHtml(guidelineOwnerLabel)}</small>
          <div class="map-vote-row">
            <span class="map-vote-chip" title="Bendras balas">
              <strong>${score}</strong>
            </span>
            ${strategyLinkChip}
            ${strategicFocusChip}
          </div>
          ${strategyLinkListMarkup}
          <div class="map-vote-squares">${voteSquares}</div>
        </article>
      `;
    }

    const score = Number(node.initiative.totalScore || 0);
    const mapCommentCount = Math.max(
      0,
      Array.isArray(node.initiative.comments)
        ? node.initiative.comments.length
        : Number(node.initiative.commentCount || 0)
    );
    const linkedCount = Array.isArray(node.initiative.guidelineIds) ? node.initiative.guidelineIds.length : 0;
    const scoreForSquares = Math.max(0, Math.round(score));
    const voteSquares = scoreForSquares
      ? Array.from({ length: scoreForSquares }, () => '<span class="map-vote-square initiative-square" aria-hidden="true"></span>').join('')
      : '<span class="map-vote-empty">Dar nebalsuota</span>';

    return `
      <article class="strategy-map-node initiative-node status-${escapeHtml(String(node.initiative.status || 'active').toLowerCase())}"
               data-layer="initiatives"
               data-node-id="${escapeHtml(node.id)}"
               data-kind="initiative"
               data-entity-id="${escapeHtml(node.entityId)}"
               data-cycle-id="${escapeHtml(node.cycleId || '')}"
               data-x="${node.x}"
               data-y="${node.y}"
               data-w="${node.w}"
               data-h="${node.h}"
               data-draggable="${editable ? 'true' : 'false'}"
               style="left:${node.x}px;top:${node.y}px;width:${node.w}px;min-height:${node.h}px;">
        <div class="map-node-head">
          <h4>${escapeHtml(node.initiative.title)}</h4>
          <button
            type="button"
            class="map-comment-btn"
            data-map-comment-kind="initiative"
            data-map-comment-id="${escapeHtml(node.initiative.id)}"
            data-map-interactive="true"
              aria-label="Rodyti aprašymą ir komentarus"
              title="Rodyti aprašymą ir komentarus"
          >
            <span class="map-comment-icon" aria-hidden="true">${MAP_COMMENT_ICON_SVG}</span>
            <span class="map-comment-count">${mapCommentCount}</span>
          </button>
        </div>
        <small>Iniciatyva · Susieta su gairėmis: ${linkedCount}</small>
        <div class="map-vote-row">
          <span class="map-vote-chip" title="Bendras balas">
            <strong>${score}</strong>
          </span>
        </div>
        <div class="map-vote-squares">${voteSquares}</div>
      </article>
    `;
  }).join('');

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
  const resetButtons = Array.from(elements.stepView.querySelectorAll('[data-map-reset-btn]'));
  const fullscreenButtons = Array.from(elements.stepView.querySelectorAll('[data-map-fullscreen-btn]'));
  const commentModal = elements.stepView.querySelector('#mapCommentModal');
  const commentTitle = elements.stepView.querySelector('#mapCommentTitle');
  const commentDescription = elements.stepView.querySelector('#mapCommentDescription');
  const commentOpenCardBtn = elements.stepView.querySelector('#mapCommentOpenCardBtn');
  const commentList = elements.stepView.querySelector('#mapCommentList');
  const mapCommentItems = buildMapCommentItems(graph);

  const closeMapCommentModal = () => {
    if (!commentModal) return;
    commentModal.hidden = true;
    document.body.classList.remove('map-comment-modal-open');
  };

  const openMapCommentModal = (kind, itemId) => {
    if (!commentModal || !commentTitle || !commentDescription || !commentList) return;
    const payload = mapCommentItems.get(`${String(kind || '').trim()}:${String(itemId || '').trim()}`);
    if (!payload) return;
    const comments = Array.isArray(payload.comments) ? payload.comments : [];
    commentTitle.textContent = payload.title;
    commentDescription.textContent = payload.description;
    if (commentOpenCardBtn) {
      commentOpenCardBtn.dataset.mapCommentKind = payload.kind || '';
      commentOpenCardBtn.dataset.mapCommentId = payload.id || '';
    }
    commentList.innerHTML = comments.length
      ? comments.map((comment) => renderCommentItem(comment)).join('')
      : '<li class="comment-item comment-item-empty">Komentarų dar nėra.</li>';
    commentModal.hidden = false;
    document.body.classList.add('map-comment-modal-open');
  };

  const openCardFromMapComment = () => {
    if (!commentOpenCardBtn) return;
    const kind = String(commentOpenCardBtn.dataset.mapCommentKind || '').trim();
    const id = String(commentOpenCardBtn.dataset.mapCommentId || '').trim();
    if (!kind || !id) return;

    closeMapCommentModal();

    if (kind === 'initiative') {
      if (typeof scheduleInitiativeFocus === 'function') {
        scheduleInitiativeFocus(id);
      }
      if (typeof setActiveView === 'function') {
        setActiveView('initiatives');
      } else {
        state.activeView = 'initiatives';
        if (typeof syncRouteState === 'function') syncRouteState();
        if (typeof render === 'function') render();
      }
      return;
    }

    if (typeof scheduleGuidelineFocus === 'function') {
      scheduleGuidelineFocus(id);
    }
    if (typeof setActiveView === 'function') {
      setActiveView('guidelines');
    } else {
      state.activeView = 'guidelines';
      if (typeof syncRouteState === 'function') syncRouteState();
      if (typeof render === 'function') render();
    }
  };

  if (commentModal) {
    commentModal.querySelectorAll('[data-map-comment-close="1"]').forEach((button) => {
      button.addEventListener('click', closeMapCommentModal);
    });
  }
  if (commentOpenCardBtn) {
    commentOpenCardBtn.addEventListener('click', openCardFromMapComment);
  }
  elements.stepView.querySelectorAll('[data-map-comment-id]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMapCommentModal(button.dataset.mapCommentKind, button.dataset.mapCommentId);
    });
  });
  elements.stepView.querySelectorAll('[data-action="open-strategy-link"]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof navigateToStrategyLink !== 'function') return;
      await navigateToStrategyLink({
        targetInstitutionSlug: button.dataset.targetInstitution,
        targetStrategySlug: button.dataset.targetStrategy,
        targetGuidelineId: button.dataset.targetGuideline
      });
    });
  });
  elements.stepView.querySelectorAll('[data-action="open-strategy-perspective"]').forEach((node) => {
    const openPerspective = async (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (!(node instanceof HTMLElement)) return;
      if (node.dataset.justDragged === '1') return;
      if (viewport instanceof HTMLElement && viewport.dataset.justPanned === '1') return;
      if (typeof navigateToStrategyPerspective !== 'function') return;
      await navigateToStrategyPerspective({
        targetInstitutionSlug: node.dataset.targetInstitution,
        targetStrategySlug: node.dataset.targetStrategy,
        preserveStrategicLayer: true
      });
    };

    node.addEventListener('click', openPerspective);
    node.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      openPerspective(event);
    });
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
  if (resetButtons.length && viewport && world) {
    resetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        fitMapToCurrentNodes(viewport, world);
      });
    });
  }
  if (fullscreenButtons.length) {
    updateMapFullscreenButtonLabel();
    fullscreenButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement === elements.stepView) {
            await document.exitFullscreen();
          } else if (elements.stepView && typeof elements.stepView.requestFullscreen === 'function') {
            await elements.stepView.requestFullscreen();
          }
        } catch (error) {
          state.notice = toUserMessage(error);
          notifyMapError(state.notice);
          render();
          return;
        }
        updateMapFullscreenButtonLabel();
        if (viewport && world) fitMapToCurrentNodes(viewport, world);
      });
    });
  }
}


