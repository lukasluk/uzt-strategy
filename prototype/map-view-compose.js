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

function buildMapPlanSoundIcon(isEnabled) {
  return isEnabled
    ? `
      <svg viewBox="0 0 24 24" class="map-plan-play-icon" aria-hidden="true">
        <path d="M5 14h3.2l4.8 4.1V5.9L8.2 10H5z"></path>
        <path d="M16.2 9.1a4.2 4.2 0 0 1 0 5.8" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"></path>
        <path d="M18.8 6.8a7.3 7.3 0 0 1 0 10.4" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"></path>
      </svg>
    `
    : `
      <svg viewBox="0 0 24 24" class="map-plan-play-icon" aria-hidden="true">
        <path d="M5 14h3.2l4.8 4.1V5.9L8.2 10H5z"></path>
        <path d="M16.5 8.2l5 7.6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"></path>
        <path d="M21.5 8.2l-5 7.6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"></path>
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
  const parseDateUtc = (rawDate) => {
    const match = String(rawDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  };
  const datedEvents = graph.nodes
    .filter((node) => node.kind === 'guideline' || node.kind === 'initiative')
    .map((node) => {
      const implementationDate = normalizeDate(node.guideline?.implementationDate || node.initiative?.implementationDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(implementationDate)) return null;
      const kind = node.kind === 'initiative'
        ? 'initiative'
        : (String(node.guideline?.relationType || '').toLowerCase() === 'child' ? 'child' : 'parent');
      return { date: implementationDate, kind };
    })
    .filter(Boolean)
    .sort((left, right) => left.date.localeCompare(right.date));
  const datedItems = datedEvents.map((event) => event.date);
  const shiftDate = (rawDate, days) => {
    const baseUtc = parseDateUtc(rawDate);
    if (baseUtc === null) return '';
    const utc = baseUtc + (days * 24 * 60 * 60 * 1000);
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
  const firstUtc = parseDateUtc(firstDate);
  const lastUtc = parseDateUtc(lastDate);
  const totalSpan = firstUtc !== null && lastUtc !== null
    ? Math.max(1, lastUtc - firstUtc)
    : 1;
  const dotGroups = Array.from(datedEvents.reduce((groups, event) => {
    const existing = groups.get(event.date) || { date: event.date, count: 0, kinds: new Set() };
    existing.count += 1;
    existing.kinds.add(event.kind);
    groups.set(event.date, existing);
    return groups;
  }, new Map()).values()).map((group) => {
    const eventUtc = parseDateUtc(group.date);
    const leftPercent = eventUtc === null || firstUtc === null
      ? 0
      : Math.max(0, Math.min(100, ((eventUtc - firstUtc) / totalSpan) * 100));
    const toneClass = group.kinds.size === 1
      ? (group.kinds.has('initiative')
        ? ' is-initiative'
        : (group.kinds.has('child') ? ' is-child' : ' is-parent'))
      : ' is-mixed';
    return {
      date: group.date,
      count: group.count,
      leftPercent,
      toneClass,
      title: `${formatDate(group.date) || group.date} • ${group.count}`
    };
  });

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
        <div class="map-plan-timeline-slider-wrap">
          <div class="map-plan-timeline-dots" aria-hidden="true">
            ${dotGroups.map((group) => `
              <span
                class="map-plan-timeline-dot${group.toneClass}"
                data-plan-dot-date="${escapeHtml(group.date)}"
                data-plan-dot-count="${group.count}"
                style="left:${group.leftPercent.toFixed(3)}%;"
                title="${escapeHtml(group.title)}"
              ></span>
            `).join('')}
          </div>
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
        </div>
        <span class="map-plan-timeline-boundary">${escapeHtml(lastDate ? formatDate(lastDate) || lastDate : mapLang('Nėra datų', 'No dates'))}</span>
      </div>
      <button
        type="button"
        class="btn btn-ghost map-plan-sound-btn"
        data-map-plan-sound
        aria-label="${escapeHtml(state.mapPlanSoundEnabled ? mapLang('Išjungti garsą', 'Mute sound') : mapLang('Įjungti garsą', 'Enable sound'))}"
        title="${escapeHtml(state.mapPlanSoundEnabled ? mapLang('Išjungti garsą', 'Mute sound') : mapLang('Įjungti garsą', 'Enable sound'))}"
      >${buildMapPlanSoundIcon(state.mapPlanSoundEnabled)}</button>
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
