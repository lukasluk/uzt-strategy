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
    'bindMapInteractions'
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
  const mapHeader = state.embedMapMode
    ? ''
    : `
      <div class="step-header">
        <h2>${escapeHtml(mapLang('Strategiju zemelapis', 'Strategy map'))}</h2>
        <div class="header-stack step-header-actions">
          <span class="tag">${escapeHtml(mapLang('Institucija', 'Institution'))}: ${escapeHtml(graph.institution.name || graph.institution.slug)}</span>
          <span class="tag">${escapeHtml(mapLang('Strategija', 'Strategy'))}: ${escapeHtml(graph.institution.strategy?.title || '-')}</span>
          ${activeLayer === 'strategic-links' ? `<span class="tag tag-main">${escapeHtml(mapLang('Rodoma', 'Viewing'))}: ${escapeHtml(graph.institution.name || graph.institution.slug)} / ${escapeHtml(graph.institution.strategy?.title || '-')} - Strategic links</span>` : ''}
          ${editable ? `<span class="tag tag-main">${escapeHtml(mapLang('Admin: galite tempti', 'Admin: you can drag'))} ${escapeHtml(activeLayer === 'initiatives' ? mapLang('iniciatyvu korteles', 'initiative cards') : mapLang('gairiu korteles', 'guideline cards'))}</span>` : ''}
        </div>
      </div>
      <p class="prompt">${activeLayer === 'strategic-links'
        ? escapeHtml(mapLang('Perziurekite tiesioginius tarpstrateginius rysius. Rodoma aktyvios strategijos struktura ir susietos kitu strategiju gaires.', 'Review direct cross-strategy links. You see the active strategy structure and linked guidelines from related strategies.'))
        : escapeHtml(mapLang('Perziurekite pasirinktos institucijos strategijos sluoksnius. Iniciatyvu sluoksnyje gairiu korteles lieka matomos, bet uzrakintos.', 'Review selected institution strategy layers. In the initiatives layer, guideline cards remain visible, but locked.'))}</p>
    `;
  const mapToolbar = `
      <div class="map-overlay-toolbar">
        <div class="map-layer-toggle map-overlay-layer-toggle">
          <button type="button" data-map-layer-btn="guidelines" class="btn ${activeLayer === 'guidelines' ? 'btn-primary' : 'btn-ghost'}">${escapeHtml(mapLang('Gaires', 'Guidelines'))}</button>
          <button type="button" data-map-layer-btn="initiatives" class="btn ${activeLayer === 'initiatives' ? 'btn-primary' : 'btn-ghost'}" ${hasInitiativeNodes ? '' : 'disabled'}>${escapeHtml(mapLang('Iniciatyvos', 'Initiatives'))}</button>
          <button type="button" data-map-layer-btn="strategic-links" class="btn ${activeLayer === 'strategic-links' ? 'btn-primary' : 'btn-ghost'}">Strategic links</button>
        </div>
        <div class="map-overlay-actions">
          <button type="button" data-map-reset-btn class="btn btn-ghost">${escapeHtml(mapLang('Centruoti vaizda', 'Center view'))}</button>
          <button type="button" data-map-fullscreen-btn class="btn btn-ghost btn-icon map-fullscreen-btn" aria-label="${escapeHtml(mapLang('Ijungti pilno ekrano rezima', 'Enable fullscreen mode'))}" title="${escapeHtml(mapLang('Ijungti pilno ekrano rezima', 'Enable fullscreen mode'))}"></button>
        </div>
      </div>
    `;
  const strategicNoLinksMarkup = activeLayer === 'strategic-links' && !graph.hasStrategicLinks
    ? '<div class="map-strategic-empty-note">No strategic links</div>'
    : '';
  const mapWatermarkClass = state.embedMapMode ? 'map-fullscreen-watermark embed-visible' : 'map-fullscreen-watermark';
  const nodeById = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  const guidelineEdgeMarkup = graph.guidelineEdges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const lineSide = fromNode.kind === 'guideline'
      ? normalizeLineSide(fromNode.guideline?.lineSide)
      : 'auto';
    const isParentRoot = edge.type === 'root'
      && toNode.kind === 'guideline'
      && String(toNode.guideline?.relationType || '').toLowerCase() === 'parent';
    const parentRootClass = isParentRoot ? ' edge-root-parent' : '';
    const edgeTone = activeLayer === 'strategic-links'
      ? (toNode.strategyTone || fromNode.strategyTone || null)
      : null;
    const edgeToneStyle = edgeTone
      ? ` style="--strategy-guideline-edge:${escapeHtml(edgeTone.border)}"`
      : '';
    return `<path class="strategy-map-edge edge-${escapeHtml(edge.type)}${parentRootClass} edge-guideline-layer" data-layer="guidelines" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="${escapeHtml(lineSide)}"${edgeToneStyle} d="${edgePath(fromNode, toNode, lineSide)}"></path>`;
  }).join('');
  const strategyGuidelineEdgeMarkup = graph.strategyGuidelineEdges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    return `<path class="strategy-map-edge edge-strategy-link edge-guideline-layer" data-layer="guidelines" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="auto" d="${edgePath(fromNode, toNode, 'auto')}"></path>`;
  }).join('');
  const strategicEdgeMarkup = (Array.isArray(graph.strategicEdges) ? graph.strategicEdges : []).map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const tone = edge?.strategyTone && typeof edge.strategyTone === 'object' ? edge.strategyTone : null;
    const toneStyle = tone
      ? ` style="--strategy-edge:${escapeHtml(tone.edge)};--strategy-edge-soft:${escapeHtml(tone.border)}"`
      : '';
    return `<path class="strategy-map-edge edge-strategic-cross edge-strategic-layer" data-layer="strategic-links" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="auto"${toneStyle} d="${edgePath(fromNode, toNode, 'auto')}"></path>`;
  }).join('');
  const initiativeEdgeMarkup = graph.initiativeEdges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const lineSide = fromNode.kind === 'initiative'
      ? normalizeLineSide(fromNode.initiative?.lineSide)
      : 'auto';
    return `<path class="strategy-map-edge edge-initiative edge-initiative-layer" data-layer="initiatives" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="${escapeHtml(lineSide)}" d="${edgePath(fromNode, toNode, lineSide)}"></path>`;
  }).join('');

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

  elements.stepView.innerHTML = `
    <section class="map-view-shell">
      ${mapHeader}
      <section id="strategyMapViewport" class="strategy-map-viewport map-layer-${activeLayer} ${editable ? 'map-editable' : ''}">
        ${mapToolbar}
        ${strategicNoLinksMarkup}
        <div id="strategyMapWorld" class="strategy-map-world" style="width:${graph.width}px;height:${graph.height}px;">
          <svg class="strategy-map-lines guideline-lines" viewBox="0 0 ${graph.width} ${graph.height}" preserveAspectRatio="none">
            ${guidelineEdgeMarkup}
            ${strategyGuidelineEdgeMarkup}
          </svg>
          <svg class="strategy-map-lines initiative-lines" viewBox="0 0 ${graph.width} ${graph.height}" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mapInitiativeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#2b6fbe" />
                <stop offset="100%" stop-color="#1f4f84" />
              </linearGradient>
            </defs>
            ${initiativeEdgeMarkup}
          </svg>
          ${nodeMarkup}
          <svg class="strategy-map-lines strategic-overlay-lines" viewBox="0 0 ${graph.width} ${graph.height}" preserveAspectRatio="none">
            ${strategicEdgeMarkup}
          </svg>
        </div>
        <div class="${mapWatermarkClass}" aria-hidden="true">
          <img src="assets/digistrategija-logo.svg?v=20260212c" alt="" />
        </div>
        ${embedBranding}
      </section>
    </section>
    <section id="mapCommentModal" class="map-comment-modal" hidden>
      <button type="button" class="map-comment-backdrop" data-map-comment-close="1" aria-label="Uždaryti"></button>
      <article class="map-comment-card" role="dialog" aria-modal="true" aria-labelledby="mapCommentTitle">
        <div class="header-row">
          <h3 id="mapCommentTitle">Elementas</h3>
          <button id="mapCommentCloseBtn" class="btn btn-ghost" type="button" data-map-comment-close="1">Uždaryti</button>
        </div>
        <p id="mapCommentDescription" class="prompt map-comment-description"></p>
        <div class="map-comment-actions">
          <button id="mapCommentOpenCardBtn" class="btn btn-primary" type="button">Atidaryti kortelę</button>
        </div>
        <strong>Komentarai</strong>
        <ul id="mapCommentList" class="mini-list"></ul>
      </article>
    </section>
  `;

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


