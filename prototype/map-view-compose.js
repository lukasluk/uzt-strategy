// Map view shell payload assembly helpers extracted from app-map.js.
// This file must load before app-map.js.

function buildMapPlanTimelineMarkup(graph, activeLayer) {
  if (activeLayer !== 'plan') return '';
  const normalizeDate = typeof normalizeImplementationDateInputValue === 'function'
    ? normalizeImplementationDateInputValue
    : (value) => String(value || '').trim();
  const formatDate = typeof formatInstitutionDate === 'function'
    ? formatInstitutionDate
    : (value) => String(value || '').trim();
  const datedItems = graph.nodes
    .filter((node) => node.kind === 'guideline' || node.kind === 'initiative')
    .map((node) => normalizeDate(node.guideline?.implementationDate || node.initiative?.implementationDate))
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort();
  const firstDate = datedItems[0] || '';
  const lastDate = datedItems[datedItems.length - 1] || firstDate || '';
  const hasTimeline = Boolean(firstDate && lastDate);
  const currentDate = hasTimeline
    ? (state.mapPlanProgress > 0 ? lastDate : firstDate)
    : '';

  return `
    <section
      id="mapPlanTimeline"
      class="map-plan-timeline${hasTimeline ? '' : ' is-empty'}"
      data-plan-first-date="${escapeHtml(firstDate)}"
      data-plan-last-date="${escapeHtml(lastDate)}"
    >
      <button
        type="button"
        class="btn ${state.mapPlanPlaying ? 'btn-primary' : 'btn-ghost'} map-plan-play-btn"
        data-map-plan-play
        ${hasTimeline ? '' : 'disabled'}
      >${escapeHtml(state.mapPlanPlaying ? mapLang('Pauzė', 'Pause') : mapLang('Play', 'Play'))}</button>
      <div class="map-plan-timeline-track">
        <span class="map-plan-timeline-boundary">${escapeHtml(firstDate ? formatDate(firstDate) || firstDate : mapLang('Nėra datų', 'No dates'))}</span>
        <input
          id="mapPlanTimelineRange"
          class="map-plan-timeline-range"
          type="range"
          min="0"
          max="1000"
          step="1"
          value="${Math.round(Math.max(0, Math.min(1, Number(state.mapPlanProgress || 0))) * 1000)}"
          ${hasTimeline ? '' : 'disabled'}
        />
        <span class="map-plan-timeline-boundary">${escapeHtml(lastDate ? formatDate(lastDate) || lastDate : mapLang('Nėra datų', 'No dates'))}</span>
      </div>
      <div id="mapPlanTimelineCurrent" class="map-plan-timeline-current">${escapeHtml(currentDate ? formatDate(currentDate) || currentDate : '')}</div>
    </section>
  `;
}

function buildMapViewRenderPayload({ graph, activeLayer, hasInitiativeNodes, editable }) {
  const embedBranding = state.embedMapMode
    ? `
      <p class="embed-map-branding-note">
        <a href="${escapeHtml(EMBED_BRAND_LINK)}" target="_blank" rel="noopener noreferrer">
          Strategiju zemelapis by digistrategy.eu
        </a>
      </p>
    `
    : '';

  const mapHeader = buildMapHeaderMarkup({ graph, activeLayer, editable });
  const mapToolbar = buildMapToolbarMarkup({ activeLayer, hasInitiativeNodes });
  const planButtonMarkup = `
    <div class="map-plan-dock">
      <button type="button" class="btn ${activeLayer === 'plan' ? 'btn-primary' : 'btn-ghost'}" data-map-layer-btn="plan">
        ${escapeHtml(mapLang('Planas', 'Plan'))}
      </button>
    </div>
  `;
  const planTimelineMarkup = buildMapPlanTimelineMarkup(graph, activeLayer);
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

  return {
    mapHeader,
    activeLayer,
    editable,
    mapToolbar,
    planButtonMarkup,
    planTimelineMarkup,
    strategicNoLinksMarkup,
    graph,
    guidelineEdgeMarkup,
    strategyGuidelineEdgeMarkup,
    initiativeEdgeMarkup,
    nodeMarkup,
    strategicEdgeMarkup,
    mapWatermarkClass,
    embedBranding
  };
}
