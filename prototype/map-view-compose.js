// Map view shell payload assembly helpers extracted from app-map.js.
// This file must load before app-map.js.

function buildMapPlanPlaybackIcon(isPlaying) {
  return isPlaying
    ? `
      <svg viewBox="0 0 24 24" class="map-plan-play-icon" aria-hidden="true">
        <path d="M8 6.5h3.5v11H8z"></path>
        <path d="M12.5 6.5H16v11h-3.5z"></path>
      </svg>
    `
    : `
      <svg viewBox="0 0 24 24" class="map-plan-play-icon" aria-hidden="true">
        <path d="M8 6.5l9 5.5-9 5.5z"></path>
      </svg>
    `;
}

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
  const shiftDate = (rawDate, days) => {
    const match = String(rawDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return '';
    const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days);
    const next = new Date(utc);
    const year = next.getUTCFullYear();
    const month = String(next.getUTCMonth() + 1).padStart(2, '0');
    const day = String(next.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const earliestEventDate = datedItems[0] || '';
  const latestEventDate = datedItems[datedItems.length - 1] || earliestEventDate || '';
  const firstDate = earliestEventDate ? shiftDate(earliestEventDate, -5) : '';
  const lastDate = latestEventDate ? shiftDate(latestEventDate, 5) : firstDate || '';
  const hasTimeline = Boolean(firstDate && lastDate);
  const playbackOptions = Array.isArray(MAP_PLAN_PLAYBACK_OPTIONS) && MAP_PLAN_PLAYBACK_OPTIONS.length
    ? MAP_PLAN_PLAYBACK_OPTIONS
    : [10000, 30000, 60000, 300000];
  const selectedPlaybackMs = playbackOptions.includes(Number(state.mapPlanPlaybackMs))
    ? Number(state.mapPlanPlaybackMs)
    : 10000;
  const playbackLabel = (ms) => {
    if (ms === 10000) return '10sec';
    if (ms === 30000) return '30sec';
    if (ms === 60000) return '1min';
    if (ms === 300000) return '5min';
    return `${Math.round(ms / 1000)}sec`;
  };

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
        aria-label="${escapeHtml(state.mapPlanPlaying ? mapLang('Pauzė', 'Pause') : mapLang('Play', 'Play'))}"
        title="${escapeHtml(state.mapPlanPlaying ? mapLang('Pauzė', 'Pause') : mapLang('Play', 'Play'))}"
        ${hasTimeline ? '' : 'disabled'}
      >${buildMapPlanPlaybackIcon(state.mapPlanPlaying)}</button>
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
      <label class="map-plan-duration">
        <select id="mapPlanDurationSelect" class="map-plan-duration-select" data-map-plan-duration>
          ${playbackOptions.map((ms) => `
            <option value="${ms}" ${selectedPlaybackMs === ms ? 'selected' : ''}>${escapeHtml(playbackLabel(ms))}</option>
          `).join('')}
        </select>
      </label>
      <div id="mapPlanTimelineCurrent" class="map-plan-timeline-current"></div>
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
  const planTimelineMarkup = buildMapPlanTimelineMarkup(graph, activeLayer);
  const strategicNoLinksMarkup = activeLayer === 'strategic-links' && !graph.hasStrategicLinks
    ? '<div class="map-strategic-empty-note">No strategic links</div>'
    : '';
  const mapWatermarkClass = state.embedMapMode ? 'map-fullscreen-watermark embed-visible' : 'map-fullscreen-watermark';
  const nodeById = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  const guidelineEdgeMarkup = buildGuidelineEdgeMarkup({ graph, nodeById, activeLayer });
  const strategyGuidelineEdgeMarkup = buildStrategyGuidelineEdgeMarkup({ graph, nodeById });
  const strategicEdgeMarkup = buildStrategicEdgeMarkup({ graph, nodeById });
  const initiativeEdgeMarkup = buildInitiativeEdgeMarkup({ graph, nodeById, activeLayer });
  const nodeMarkup = buildNodeMarkup({ graph, activeLayer, editable });

  return {
    mapHeader,
    activeLayer,
    editable,
    mapToolbar,
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
