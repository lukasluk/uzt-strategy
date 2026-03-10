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
    'renderMapLoadingState',
    'renderMapErrorState',
    'renderMapEmptyState',
    'renderMapInstitutionPromptState',
    'renderStrategicLinksPendingState',
    'setMapLayerAndRender',
    'bindMapLayerButtons',
    'bindMapPlanButtons',
    'resolveActiveMapLayer',
    'resolveMapGraphForLayer',
    'buildMapViewRenderPayload',
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

function parseMapPlanDateValue(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  if (!Number.isFinite(time)) return null;
  return { raw, time };
}

function stopMapPlanPlayback() {
  if (state.mapPlanAnimationFrameId) {
    window.cancelAnimationFrame(state.mapPlanAnimationFrameId);
    state.mapPlanAnimationFrameId = 0;
  }
  state.mapPlanPlaying = false;
  state.mapPlanPlaybackStartedAt = 0;
}

function mapPlanPlaybackButtonIconMarkup(isPlaying) {
  if (typeof buildMapPlanPlaybackIcon === 'function') {
    return buildMapPlanPlaybackIcon(isPlaying);
  }
  return isPlaying ? '||' : '>';
}

function triggerMapPlanRevealRipple(node) {
  if (!(node instanceof HTMLElement)) return;
  let rippleClass = 'map-plan-ripple-initiative';
  if (node.classList.contains('guideline-node')) {
    if (node.classList.contains('relation-parent')) rippleClass = 'map-plan-ripple-parent';
    else if (node.classList.contains('relation-child')) rippleClass = 'map-plan-ripple-child';
    else rippleClass = 'map-plan-ripple-orphan';
  }
  node.classList.remove('map-plan-ripple-parent', 'map-plan-ripple-child', 'map-plan-ripple-orphan', 'map-plan-ripple-initiative');
  void node.offsetWidth;
  node.classList.add(rippleClass);
  window.setTimeout(() => {
    node.classList.remove(rippleClass);
  }, 1100);
}

function mapPlanCurrentDateText(firstDate, lastDate, progress) {
  const formatDate = typeof formatInstitutionDate === 'function'
    ? formatInstitutionDate
    : (value) => String(value || '').trim();
  const first = parseMapPlanDateValue(firstDate);
  const last = parseMapPlanDateValue(lastDate);
  if (!first || !last) return '';
  if (progress <= 0) return formatDate(first.raw) || first.raw;
  const span = Math.max(0, last.time - first.time);
  const currentTime = span > 0
    ? first.time + Math.round(span * Math.max(0, Math.min(1, progress)))
    : last.time;
  const currentDate = new Date(currentTime);
  const year = currentDate.getUTCFullYear();
  const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getUTCDate()).padStart(2, '0');
  const raw = `${year}-${month}-${day}`;
  return formatDate(raw) || raw;
}

function applyMapPlanTimelineState(viewport, world, timelineRoot) {
  if (!(viewport instanceof HTMLElement) || !(world instanceof HTMLElement) || !(timelineRoot instanceof HTMLElement)) return;
  const progress = Math.max(0, Math.min(1, Number(state.mapPlanProgress || 0)));
  const firstDate = String(timelineRoot.dataset.planFirstDate || '').trim();
  const lastDate = String(timelineRoot.dataset.planLastDate || '').trim();
  const first = parseMapPlanDateValue(firstDate);
  const last = parseMapPlanDateValue(lastDate);
  const currentLabel = timelineRoot.querySelector('#mapPlanTimelineCurrent');
  const range = timelineRoot.querySelector('#mapPlanTimelineRange');
  const playButton = timelineRoot.querySelector('[data-map-plan-play]');

  if (range instanceof HTMLInputElement) {
    range.value = String(Math.round(progress * 1000));
  }
  if (currentLabel) {
    currentLabel.textContent = mapPlanCurrentDateText(firstDate, lastDate, progress);
  }
  if (playButton instanceof HTMLElement) {
    playButton.innerHTML = mapPlanPlaybackButtonIconMarkup(state.mapPlanPlaying);
    const nextLabel = state.mapPlanPlaying
      ? mapLang('Pauzė', 'Pause')
      : mapLang('Play', 'Play');
    playButton.setAttribute('aria-label', nextLabel);
    playButton.setAttribute('title', nextLabel);
    playButton.classList.toggle('btn-primary', state.mapPlanPlaying);
    playButton.classList.toggle('btn-ghost', !state.mapPlanPlaying);
  }

  const span = first && last ? Math.max(0, last.time - first.time) : 0;
  const currentTime = first && last
    ? (span > 0 ? first.time + span * progress : last.time)
    : 0;
  const datedNodes = Array.from(world.querySelectorAll('.strategy-map-node[data-plan-date]'));
  datedNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const parsed = parseMapPlanDateValue(node.dataset.planDate);
    if (!parsed) {
      node.classList.remove('map-plan-dated', 'map-plan-visible');
      return;
    }
    node.classList.add('map-plan-dated');
    const wasVisible = node.classList.contains('map-plan-visible');
    const revealed = progress > 0 && (progress >= 1 || span <= 0 || parsed.time <= currentTime);
    node.classList.toggle('map-plan-visible', revealed);
    if (!wasVisible && revealed) {
      triggerMapPlanRevealRipple(node);
    }
  });
  const datedEdges = Array.from(world.querySelectorAll('.strategy-map-edge[data-plan-date]'));
  datedEdges.forEach((edge) => {
    if (!(edge instanceof SVGElement)) return;
    const parsed = parseMapPlanDateValue(edge.dataset.planDate);
    if (!parsed) {
      edge.classList.remove('map-plan-visible');
      return;
    }
    const revealed = progress > 0 && (progress >= 1 || span <= 0 || parsed.time <= currentTime);
    edge.classList.toggle('map-plan-visible', revealed);
  });
  const timelineDots = Array.from(timelineRoot.querySelectorAll('[data-plan-dot-date]'));
  timelineDots.forEach((dot) => {
    if (!(dot instanceof HTMLElement)) return;
    const parsed = parseMapPlanDateValue(dot.dataset.planDotDate);
    if (!parsed) {
      dot.classList.remove('is-reached');
      return;
    }
    const reached = progress > 0 && (progress >= 1 || span <= 0 || parsed.time <= currentTime);
    dot.classList.toggle('is-reached', reached);
  });
}

function bindMapPlanTimeline(viewport, world, stepView) {
  if (!(viewport instanceof HTMLElement) || !(world instanceof HTMLElement) || !(stepView instanceof HTMLElement)) return;
  const timelineRoot = stepView.querySelector('#mapPlanTimeline');
  if (!(timelineRoot instanceof HTMLElement)) return;
  const range = timelineRoot.querySelector('#mapPlanTimelineRange');
  const playButton = timelineRoot.querySelector('[data-map-plan-play]');
  const durationSelect = timelineRoot.querySelector('[data-map-plan-duration]');
  const hasTimeline = !timelineRoot.classList.contains('is-empty');
  let hideTimerId = 0;

  const sync = () => applyMapPlanTimelineState(viewport, world, timelineRoot);

  const showTimeline = () => {
    timelineRoot.classList.remove('is-idle-hidden');
  };

  const scheduleHide = () => {
    if (hideTimerId) window.clearTimeout(hideTimerId);
    hideTimerId = window.setTimeout(() => {
      timelineRoot.classList.add('is-idle-hidden');
    }, 1000);
  };

  const registerActivity = () => {
    showTimeline();
    scheduleHide();
  };

  const startPlayback = () => {
    if (!hasTimeline) return;
    if (state.mapPlanProgress >= 1) {
      state.mapPlanProgress = 0;
    }
    stopMapPlanPlayback();
    state.mapPlanPlaying = true;
    const playbackMs = Math.max(1000, Number(state.mapPlanPlaybackMs || MAP_PLAN_PLAYBACK_MS));
    state.mapPlanPlaybackStartedAt = performance.now() - (state.mapPlanProgress * playbackMs);
    const tick = (timestamp) => {
      const elapsed = Math.max(0, timestamp - Number(state.mapPlanPlaybackStartedAt || timestamp));
      state.mapPlanProgress = Math.max(0, Math.min(1, elapsed / playbackMs));
      sync();
      if (state.mapPlanProgress >= 1) {
        stopMapPlanPlayback();
        sync();
        return;
      }
      state.mapPlanAnimationFrameId = window.requestAnimationFrame(tick);
    };
    state.mapPlanAnimationFrameId = window.requestAnimationFrame(tick);
    sync();
  };

  range?.addEventListener('input', () => {
    stopMapPlanPlayback();
    state.mapPlanProgress = Math.max(0, Math.min(1, Number(range.value || 0) / 1000));
    sync();
    registerActivity();
  });

  durationSelect?.addEventListener('change', () => {
    const nextMs = Number(durationSelect.value || MAP_PLAN_PLAYBACK_MS);
    state.mapPlanPlaybackMs = Array.isArray(MAP_PLAN_PLAYBACK_OPTIONS) && MAP_PLAN_PLAYBACK_OPTIONS.includes(nextMs)
      ? nextMs
      : MAP_PLAN_PLAYBACK_MS;
    stopMapPlanPlayback();
    sync();
    registerActivity();
  });

  playButton?.addEventListener('click', () => {
    registerActivity();
    if (state.mapPlanPlaying) {
      stopMapPlanPlayback();
      sync();
      return;
    }
    startPlayback();
  });

  ['mousemove', 'pointermove', 'pointerdown', 'wheel', 'touchstart'].forEach((eventName) => {
    viewport.addEventListener(eventName, registerActivity, { passive: true });
  });

  timelineRoot.addEventListener('mousemove', registerActivity, { passive: true });
  timelineRoot.addEventListener('pointerdown', registerActivity, { passive: true });

  sync();
  registerActivity();
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
  const mapRenderPayload = buildMapViewRenderPayload({ graph, activeLayer, hasInitiativeNodes, editable });
  elements.stepView.innerHTML = buildMapViewShellMarkup(mapRenderPayload);

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
  const planButtons = Array.from(elements.stepView.querySelectorAll('[data-map-layer-btn="plan"]'));
  bindMapLayerButtons(layerGuidelinesButtons, layerInitiativesButtons, layerStrategicButtons);
  bindMapPlanButtons(planButtons);
  elements.stepView.querySelectorAll('[data-action="show-related-initiatives"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof focusGuidelineInitiativesInMap !== 'function') return;
      focusGuidelineInitiativesInMap(button.dataset.guidelineId);
    });
  });

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
  if (activeLayer === 'plan') {
    bindMapPlanTimeline(viewport, world, elements.stepView);
  } else {
    stopMapPlanPlayback();
  }
}


