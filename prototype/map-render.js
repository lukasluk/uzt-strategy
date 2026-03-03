// Map render markup builders extracted from app-map.js
// This file must load before app-map.js.

function buildMapHeaderMarkup({ graph, activeLayer, editable }) {
  if (state.embedMapMode) return '';
  return `
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
}

function buildMapToolbarMarkup({ activeLayer, hasInitiativeNodes }) {
  return `
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
}

function buildGuidelineEdgeMarkup({ graph, nodeById, activeLayer }) {
  return graph.guidelineEdges.map((edge) => {
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
}

function buildStrategyGuidelineEdgeMarkup({ graph, nodeById }) {
  return graph.strategyGuidelineEdges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    return `<path class="strategy-map-edge edge-strategy-link edge-guideline-layer" data-layer="guidelines" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="auto" d="${edgePath(fromNode, toNode, 'auto')}"></path>`;
  }).join('');
}

function buildStrategicEdgeMarkup({ graph, nodeById }) {
  return (Array.isArray(graph.strategicEdges) ? graph.strategicEdges : []).map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const tone = edge?.strategyTone && typeof edge.strategyTone === 'object' ? edge.strategyTone : null;
    const toneStyle = tone
      ? ` style="--strategy-edge:${escapeHtml(tone.edge)};--strategy-edge-soft:${escapeHtml(tone.border)}"`
      : '';
    return `<path class="strategy-map-edge edge-strategic-cross edge-strategic-layer" data-layer="strategic-links" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="auto"${toneStyle} d="${edgePath(fromNode, toNode, 'auto')}"></path>`;
  }).join('');
}

function buildInitiativeEdgeMarkup({ graph, nodeById }) {
  return graph.initiativeEdges.map((edge) => {
    const fromNode = nodeById[edge.from];
    const toNode = nodeById[edge.to];
    if (!fromNode || !toNode) return '';
    const lineSide = fromNode.kind === 'initiative'
      ? normalizeLineSide(fromNode.initiative?.lineSide)
      : 'auto';
    return `<path class="strategy-map-edge edge-initiative edge-initiative-layer" data-layer="initiatives" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="${escapeHtml(lineSide)}" d="${edgePath(fromNode, toNode, lineSide)}"></path>`;
  }).join('');
}

function buildMapViewShellMarkup({
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
}) {
  return `
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
}
