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

let mapPlanAudioContext = null;
let mapPlanLastSoundAt = 0;

function ensureMapPlanAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!mapPlanAudioContext) {
    try {
      mapPlanAudioContext = new AudioCtor();
    } catch {
      mapPlanAudioContext = null;
    }
  }
  return mapPlanAudioContext;
}

function resolveMapPlanRevealKind(node) {
  if (!(node instanceof HTMLElement)) return 'initiative';
  if (!node.classList.contains('guideline-node')) return 'initiative';
  if (node.classList.contains('relation-parent')) return 'parent';
  if (node.classList.contains('relation-child')) return 'child';
  return 'orphan';
}

function playMapPlanRevealSound(kinds = []) {
  if (!state.mapPlanPlaying || !state.mapPlanSoundEnabled) return;
  const audioContext = ensureMapPlanAudioContext();
  if (!audioContext) return;
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  const nowStamp = performance.now();
  if (nowStamp - mapPlanLastSoundAt < 55) return;
  mapPlanLastSoundAt = nowStamp;

  const kindList = Array.isArray(kinds) ? kinds.filter(Boolean) : [];
  const uniqueKinds = new Set(kindList);
  let baseFrequency = 420;
  if (uniqueKinds.has('initiative')) baseFrequency = 520;
  else if (uniqueKinds.has('child')) baseFrequency = 470;
  else if (uniqueKinds.has('parent')) baseFrequency = 390;
  else if (uniqueKinds.has('orphan')) baseFrequency = 445;

  const layerCount = Math.max(1, Math.min(4, kindList.length || uniqueKinds.size || 1));
  const now = audioContext.currentTime + 0.01;
  const masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.linearRampToValueAtTime(0.022 + (layerCount * 0.004), now + 0.012);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
  masterGain.connect(audioContext.destination);

  const toneFilter = audioContext.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.setValueAtTime(1800 + (layerCount * 120), now);
  toneFilter.Q.setValueAtTime(0.8, now);
  toneFilter.connect(masterGain);

  const bodyOsc = audioContext.createOscillator();
  const bodyGain = audioContext.createGain();
  bodyOsc.type = 'triangle';
  bodyOsc.frequency.setValueAtTime(baseFrequency * 1.1, now);
  bodyOsc.frequency.exponentialRampToValueAtTime(baseFrequency * 0.76, now + 0.22);
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.linearRampToValueAtTime(0.95, now + 0.01);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  bodyOsc.connect(bodyGain);
  bodyGain.connect(toneFilter);

  const bellOsc = audioContext.createOscillator();
  const bellGain = audioContext.createGain();
  bellOsc.type = 'sine';
  bellOsc.frequency.setValueAtTime(baseFrequency * 2.02, now);
  bellOsc.frequency.exponentialRampToValueAtTime(baseFrequency * 1.26, now + 0.17);
  bellGain.gain.setValueAtTime(0.0001, now);
  bellGain.gain.linearRampToValueAtTime(0.42, now + 0.008);
  bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  bellOsc.connect(bellGain);
  bellGain.connect(masterGain);

  const transientBuffer = audioContext.createBuffer(1, Math.max(1, Math.floor(audioContext.sampleRate * 0.05)), audioContext.sampleRate);
  const transientData = transientBuffer.getChannelData(0);
  for (let index = 0; index < transientData.length; index += 1) {
    const decay = 1 - (index / transientData.length);
    transientData[index] = (Math.random() * 2 - 1) * Math.pow(decay, 2.6);
  }
  const transientSource = audioContext.createBufferSource();
  transientSource.buffer = transientBuffer;
  const transientFilter = audioContext.createBiquadFilter();
  transientFilter.type = 'bandpass';
  transientFilter.frequency.setValueAtTime(920 + (layerCount * 70), now);
  transientFilter.Q.setValueAtTime(1.4, now);
  const transientGain = audioContext.createGain();
  transientGain.gain.setValueAtTime(0.0001, now);
  transientGain.gain.linearRampToValueAtTime(0.16, now + 0.004);
  transientGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  transientSource.connect(transientFilter);
  transientFilter.connect(transientGain);
  transientGain.connect(masterGain);

  bodyOsc.start(now);
  bellOsc.start(now);
  transientSource.start(now);
  bodyOsc.stop(now + 0.24);
  bellOsc.stop(now + 0.18);
  transientSource.stop(now + 0.07);
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
  const floatingCurrentLabel = viewport.querySelector('#mapPlanFloatingCurrent');
  const range = timelineRoot.querySelector('#mapPlanTimelineRange');
  const playButton = timelineRoot.querySelector('[data-map-plan-play]');
  const soundButton = timelineRoot.querySelector('[data-map-plan-sound]');

  if (range instanceof HTMLInputElement) {
    range.value = String(Math.round(progress * 1000));
  }
  if (currentLabel) {
    currentLabel.textContent = mapPlanCurrentDateText(firstDate, lastDate, progress);
  }
  if (floatingCurrentLabel) {
    const currentText = mapPlanCurrentDateText(firstDate, lastDate, progress);
    floatingCurrentLabel.textContent = currentText;
    const shouldShowFloating = Boolean(currentText)
      && timelineRoot.classList.contains('is-idle-hidden')
      && (state.mapPlanPlaying || progress > 0);
    floatingCurrentLabel.classList.toggle('is-visible', shouldShowFloating);
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
  if (soundButton instanceof HTMLElement) {
    if (typeof buildMapPlanSoundIcon === 'function') {
      soundButton.innerHTML = buildMapPlanSoundIcon(Boolean(state.mapPlanSoundEnabled));
    }
    const soundLabel = state.mapPlanSoundEnabled
      ? mapLang('Išjungti garsą', 'Mute sound')
      : mapLang('Įjungti garsą', 'Enable sound');
    soundButton.setAttribute('aria-label', soundLabel);
    soundButton.setAttribute('title', soundLabel);
    soundButton.classList.toggle('is-muted', !state.mapPlanSoundEnabled);
  }

  const span = first && last ? Math.max(0, last.time - first.time) : 0;
  const currentTime = first && last
    ? (span > 0 ? first.time + span * progress : last.time)
    : 0;
  const datedNodes = Array.from(world.querySelectorAll('.strategy-map-node[data-plan-date]'));
  const newlyRevealedKinds = [];
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
      newlyRevealedKinds.push(resolveMapPlanRevealKind(node));
      triggerMapPlanRevealRipple(node);
    }
  });
  if (newlyRevealedKinds.length) {
    playMapPlanRevealSound(newlyRevealedKinds);
  }
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
  const soundButton = timelineRoot.querySelector('[data-map-plan-sound]');
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

  soundButton?.addEventListener('click', () => {
    registerActivity();
    state.mapPlanSoundEnabled = !state.mapPlanSoundEnabled;
    if (state.mapPlanSoundEnabled) {
      const audioContext = ensureMapPlanAudioContext();
      if (audioContext?.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }
    }
    sync();
  });

  ['mousemove', 'pointermove', 'pointerdown', 'wheel', 'touchstart'].forEach((eventName) => {
    viewport.addEventListener(eventName, registerActivity, { passive: true });
  });

  timelineRoot.addEventListener('mousemove', registerActivity, { passive: true });
  timelineRoot.addEventListener('pointerdown', registerActivity, { passive: true });

  sync();
  registerActivity();
}

function bindMapOverlayToolbarAutoHide(viewport, stepView) {
  if (!(viewport instanceof HTMLElement) || !(stepView instanceof HTMLElement)) return;
  const toolbar = stepView.querySelector('.map-overlay-toolbar');
  if (!(toolbar instanceof HTMLElement)) return;
  let hideTimerId = 0;

  const showToolbar = () => {
    toolbar.classList.remove('is-idle-hidden');
  };

  const scheduleHide = () => {
    if (hideTimerId) window.clearTimeout(hideTimerId);
    hideTimerId = window.setTimeout(() => {
      toolbar.classList.add('is-idle-hidden');
    }, 1000);
  };

  const registerActivity = () => {
    showToolbar();
    scheduleHide();
  };

  ['mousemove', 'pointermove', 'pointerdown', 'wheel', 'touchstart'].forEach((eventName) => {
    viewport.addEventListener(eventName, registerActivity, { passive: true });
  });

  toolbar.addEventListener('mousemove', registerActivity, { passive: true });
  toolbar.addEventListener('pointerdown', registerActivity, { passive: true });

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
  bindMapOverlayToolbarAutoHide(viewport, elements.stepView);
  if (activeLayer === 'plan') {
    bindMapPlanTimeline(viewport, world, elements.stepView);
  } else {
    stopMapPlanPlayback();
  }
}


