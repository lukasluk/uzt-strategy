// Map interaction and focus handlers.
// This file must load before app-map.js.

function resetMapInitiativeFocusState() {
  state.mapInitiativeFocusId = '';
  state.mapInitiativeHoverId = '';
  state.mapGuidelineFocusId = '';
  state.mapGuidelineHoverId = '';
}

function flushPendingMapNodeFocus(viewport, world) {
  if (!(viewport instanceof HTMLElement) || !(world instanceof HTMLElement)) return;
  const focusKind = String(state.pendingMapFocusKind || '').trim().toLowerCase();
  const focusId = String(state.pendingMapFocusId || '').trim();
  if (!focusKind || !focusId) return;

  const nodes = Array.from(world.querySelectorAll('.strategy-map-node[data-kind][data-entity-id]'));
  const target = nodes.find((node) => {
    if (!(node instanceof HTMLElement)) return false;
    const nodeKind = String(node.dataset.kind || '').trim().toLowerCase();
    const nodeId = String(node.dataset.entityId || '').trim();
    return nodeKind === focusKind && nodeId === focusId;
  });
  if (!(target instanceof HTMLElement)) return;

  state.pendingMapFocusKind = '';
  state.pendingMapFocusId = '';

  const nodeX = Number(target.dataset.x || 0);
  const nodeY = Number(target.dataset.y || 0);
  const nodeW = Number(target.dataset.w || target.offsetWidth || 0);
  const nodeH = Number(target.dataset.h || target.offsetHeight || 0);
  const centerX = nodeX + nodeW / 2;
  const centerY = nodeY + nodeH / 2;
  const scale = Number(state.mapTransform.scale || 1) || 1;

  state.mapTransform.x = viewport.clientWidth / 2 - centerX * scale;
  state.mapTransform.y = viewport.clientHeight / 2 - centerY * scale;
  applyMapTransform(viewport, world);

  if (focusKind === 'initiative' && state.mapLayer === 'initiatives') {
    state.mapInitiativeFocusId = focusId;
    state.mapGuidelineFocusId = '';
    state.mapInitiativeHoverId = '';
    state.mapGuidelineHoverId = '';
    applyInitiativeLayerFocusState(viewport, world);
  } else {
    resetMapInitiativeFocusState();
    applyInitiativeLayerFocusState(viewport, world);
  }

  target.classList.remove('map-node-focus-pulse');
  void target.offsetWidth;
  target.classList.add('map-node-focus-pulse');
  window.setTimeout(() => target.classList.remove('map-node-focus-pulse'), 10000);
}

function applyInitiativeLayerFocusState(viewport, world) {
  if (!(viewport instanceof HTMLElement) || !(world instanceof HTMLElement)) return;

  const initiativeNodes = Array.from(world.querySelectorAll('.strategy-map-node[data-kind="initiative"]'));
  const guidelineNodes = Array.from(world.querySelectorAll('.strategy-map-node[data-kind="guideline"]'));
  const institutionNode = world.querySelector('.strategy-map-node[data-kind="institution"]');
  const initiativeEdges = Array.from(world.querySelectorAll('.strategy-map-edge.edge-initiative-layer'));
  const initiativesLayer = state.mapLayer === 'initiatives';

  viewport.classList.remove('map-initiative-focus-active', 'map-initiative-focus-selected');
  initiativeNodes.forEach((node) => {
    node.classList.remove(
      'map-initiative-selected',
      'map-initiative-hovered',
      'map-initiative-related',
      'map-initiative-dimmed'
    );
  });
  guidelineNodes.forEach((node) => {
    node.classList.remove(
      'map-guideline-related',
      'map-guideline-hovered',
      'map-guideline-selected',
      'map-guideline-dimmed'
    );
  });
  if (institutionNode) institutionNode.classList.remove('map-institution-dimmed-strong');
  initiativeEdges.forEach((edge) => edge.classList.remove('map-edge-active'));

  if (!initiativesLayer) return;

  const initiativeByEntityId = new Map(
    initiativeNodes.map((node) => [String(node.dataset.entityId || '').trim(), node])
  );
  const guidelineByEntityId = new Map(
    guidelineNodes.map((node) => [String(node.dataset.entityId || '').trim(), node])
  );

  let initiativeFocusEntityId = String(state.mapInitiativeFocusId || '').trim();
  if (initiativeFocusEntityId && !initiativeByEntityId.has(initiativeFocusEntityId)) {
    initiativeFocusEntityId = '';
    state.mapInitiativeFocusId = '';
  }

  let initiativeHoverEntityId = String(state.mapInitiativeHoverId || '').trim();
  if (initiativeHoverEntityId && !initiativeByEntityId.has(initiativeHoverEntityId)) {
    initiativeHoverEntityId = '';
    state.mapInitiativeHoverId = '';
  }

  let guidelineFocusEntityId = String(state.mapGuidelineFocusId || '').trim();
  if (guidelineFocusEntityId && !guidelineByEntityId.has(guidelineFocusEntityId)) {
    guidelineFocusEntityId = '';
    state.mapGuidelineFocusId = '';
  }

  let guidelineHoverEntityId = String(state.mapGuidelineHoverId || '').trim();
  if (guidelineHoverEntityId && !guidelineByEntityId.has(guidelineHoverEntityId)) {
    guidelineHoverEntityId = '';
    state.mapGuidelineHoverId = '';
  }

  let activeKind = '';
  let activeFocusEntityId = '';
  let activeHoverEntityId = '';
  if (initiativeFocusEntityId) {
    activeKind = 'initiative';
    activeFocusEntityId = initiativeFocusEntityId;
  } else if (guidelineFocusEntityId) {
    activeKind = 'guideline';
    activeFocusEntityId = guidelineFocusEntityId;
  } else if (initiativeHoverEntityId) {
    activeKind = 'initiative';
    activeHoverEntityId = initiativeHoverEntityId;
  } else if (guidelineHoverEntityId) {
    activeKind = 'guideline';
    activeHoverEntityId = guidelineHoverEntityId;
  }
  if (!activeKind) return;

  viewport.classList.add('map-initiative-focus-active');
  if (activeFocusEntityId) viewport.classList.add('map-initiative-focus-selected');
  if (institutionNode) institutionNode.classList.add('map-institution-dimmed-strong');

  if (activeKind === 'initiative') {
    const activeEntityId = activeFocusEntityId || activeHoverEntityId;
    const activeNode = initiativeByEntityId.get(activeEntityId);
    if (!activeNode) return;
    const activeNodeId = String(activeNode.dataset.nodeId || '').trim();
    if (!activeNodeId) return;

    const relatedGuidelineNodeIds = new Set();
    initiativeEdges.forEach((edge) => {
      const isActive = String(edge.dataset.from || '').trim() === activeNodeId;
      edge.classList.toggle('map-edge-active', isActive);
      if (isActive) {
        relatedGuidelineNodeIds.add(String(edge.dataset.to || '').trim());
      }
    });

    initiativeNodes.forEach((node) => {
      const nodeId = String(node.dataset.nodeId || '').trim();
      const isActiveNode = nodeId === activeNodeId;
      const isSelected = activeFocusEntityId
        && String(node.dataset.entityId || '').trim() === activeFocusEntityId;
      const isHovered = !activeFocusEntityId
        && activeHoverEntityId
        && String(node.dataset.entityId || '').trim() === activeHoverEntityId;

      node.classList.toggle('map-initiative-selected', Boolean(isSelected));
      node.classList.toggle('map-initiative-hovered', Boolean(isHovered));
      node.classList.toggle('map-initiative-related', isActiveNode);
      node.classList.toggle('map-initiative-dimmed', !isActiveNode);
    });

    guidelineNodes.forEach((node) => {
      const nodeId = String(node.dataset.nodeId || '').trim();
      const isRelated = relatedGuidelineNodeIds.has(nodeId);
      node.classList.toggle('map-guideline-related', isRelated);
      node.classList.toggle('map-guideline-dimmed', !isRelated);
    });
    return;
  }

  const activeEntityId = activeFocusEntityId || activeHoverEntityId;
  const activeGuidelineNode = guidelineByEntityId.get(activeEntityId);
  if (!activeGuidelineNode) return;
  const activeGuidelineNodeId = String(activeGuidelineNode.dataset.nodeId || '').trim();
  if (!activeGuidelineNodeId) return;

  const relatedInitiativeNodeIds = new Set();
  initiativeEdges.forEach((edge) => {
    const isRelated = String(edge.dataset.to || '').trim() === activeGuidelineNodeId;
    edge.classList.toggle('map-edge-active', isRelated);
    if (isRelated) {
      relatedInitiativeNodeIds.add(String(edge.dataset.from || '').trim());
    }
  });

  initiativeNodes.forEach((node) => {
    const nodeId = String(node.dataset.nodeId || '').trim();
    const isRelated = relatedInitiativeNodeIds.has(nodeId);
    node.classList.toggle('map-initiative-related', isRelated);
    node.classList.toggle('map-initiative-dimmed', !isRelated);
  });

  guidelineNodes.forEach((node) => {
    const nodeId = String(node.dataset.nodeId || '').trim();
    const isActiveNode = nodeId === activeGuidelineNodeId;
    const isSelected = activeFocusEntityId
      && String(node.dataset.entityId || '').trim() === activeFocusEntityId;
    const isHovered = !activeFocusEntityId
      && activeHoverEntityId
      && String(node.dataset.entityId || '').trim() === activeHoverEntityId;

    node.classList.toggle('map-guideline-related', isActiveNode);
    node.classList.toggle('map-guideline-selected', Boolean(isSelected));
    node.classList.toggle('map-guideline-hovered', Boolean(isHovered));
    node.classList.toggle('map-guideline-dimmed', !isActiveNode);
  });
}

function bindInitiativeLayerFocusInteractions(viewport, world) {
  if (!(viewport instanceof HTMLElement) || !(world instanceof HTMLElement)) return;

  const initiativeNodes = Array.from(world.querySelectorAll('.strategy-map-node[data-kind="initiative"]'));
  const guidelineNodes = Array.from(world.querySelectorAll('.strategy-map-node[data-kind="guideline"]'));
  if (!initiativeNodes.length && !guidelineNodes.length) return;

  const applyState = () => applyInitiativeLayerFocusState(viewport, world);
  const hasLockedFocus = () => Boolean(
    String(state.mapInitiativeFocusId || '').trim()
    || String(state.mapGuidelineFocusId || '').trim()
  );

  initiativeNodes.forEach((node) => {
    node.addEventListener('mouseenter', () => {
      if (state.mapLayer !== 'initiatives') return;
      if (hasLockedFocus()) return;
      state.mapInitiativeHoverId = String(node.dataset.entityId || '').trim();
      state.mapGuidelineHoverId = '';
      applyState();
    });

    node.addEventListener('mouseleave', () => {
      if (state.mapLayer !== 'initiatives') return;
      if (hasLockedFocus()) return;
      const entityId = String(node.dataset.entityId || '').trim();
      if (!entityId || entityId !== String(state.mapInitiativeHoverId || '').trim()) return;
      state.mapInitiativeHoverId = '';
      applyState();
    });

    node.addEventListener('click', (event) => {
      if (state.mapLayer !== 'initiatives') return;
      if (!(event.currentTarget instanceof HTMLElement)) return;
      if (event.currentTarget.dataset.justDragged === '1') return;
      if (viewport.dataset.justPanned === '1') return;
      if (event.target instanceof Element && event.target.closest('[data-map-interactive="true"]')) return;

      event.preventDefault();
      event.stopPropagation();

      const entityId = String(event.currentTarget.dataset.entityId || '').trim();
      if (!entityId) return;
      if (String(state.mapInitiativeFocusId || '').trim() === entityId) {
        resetMapInitiativeFocusState();
      } else {
        state.mapInitiativeFocusId = entityId;
        state.mapInitiativeHoverId = '';
        state.mapGuidelineFocusId = '';
        state.mapGuidelineHoverId = '';
      }
      applyState();
    });
  });

  guidelineNodes.forEach((node) => {
    node.addEventListener('mouseenter', () => {
      if (state.mapLayer !== 'initiatives') return;
      if (hasLockedFocus()) return;
      state.mapGuidelineHoverId = String(node.dataset.entityId || '').trim();
      state.mapInitiativeHoverId = '';
      applyState();
    });

    node.addEventListener('mouseleave', () => {
      if (state.mapLayer !== 'initiatives') return;
      if (hasLockedFocus()) return;
      const entityId = String(node.dataset.entityId || '').trim();
      if (!entityId || entityId !== String(state.mapGuidelineHoverId || '').trim()) return;
      state.mapGuidelineHoverId = '';
      applyState();
    });

    node.addEventListener('click', (event) => {
      if (state.mapLayer !== 'initiatives') return;
      if (!(event.currentTarget instanceof HTMLElement)) return;
      if (event.currentTarget.dataset.justDragged === '1') return;
      if (viewport.dataset.justPanned === '1') return;
      if (event.target instanceof Element && event.target.closest('[data-map-interactive="true"]')) return;

      event.preventDefault();
      event.stopPropagation();

      const entityId = String(event.currentTarget.dataset.entityId || '').trim();
      if (!entityId) return;
      if (String(state.mapGuidelineFocusId || '').trim() === entityId) {
        resetMapInitiativeFocusState();
      } else {
        state.mapGuidelineFocusId = entityId;
        state.mapGuidelineHoverId = '';
        state.mapInitiativeFocusId = '';
        state.mapInitiativeHoverId = '';
      }
      applyState();
    });
  });

  viewport.addEventListener('click', (event) => {
    if (state.mapLayer !== 'initiatives') return;
    if (!state.mapInitiativeFocusId && !state.mapGuidelineFocusId) return;
    if (viewport.dataset.justPanned === '1') return;

    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('.strategy-map-node[data-kind="initiative"], .strategy-map-node[data-kind="guideline"]')) return;
    if (target.closest('[data-map-interactive="true"]')) return;

    resetMapInitiativeFocusState();
    applyState();
  });

  viewport.addEventListener('pointermove', (event) => {
    if (state.mapLayer !== 'initiatives') return;
    if (hasLockedFocus()) return;

    const rawTarget = event.target;
    const target = rawTarget instanceof Element ? rawTarget : null;
    const node = target ? target.closest('.strategy-map-node[data-kind]') : null;
    if (!(node instanceof HTMLElement)) {
      if (state.mapInitiativeHoverId || state.mapGuidelineHoverId) {
        state.mapInitiativeHoverId = '';
        state.mapGuidelineHoverId = '';
        applyState();
      }
      return;
    }

    const kind = String(node.dataset.kind || '').trim();
    const entityId = String(node.dataset.entityId || '').trim();
    if (!entityId) return;

    if (kind === 'guideline') {
      if (state.mapGuidelineHoverId !== entityId || state.mapInitiativeHoverId) {
        state.mapGuidelineHoverId = entityId;
        state.mapInitiativeHoverId = '';
        applyState();
      }
      return;
    }

    if (kind === 'initiative') {
      if (state.mapInitiativeHoverId !== entityId || state.mapGuidelineHoverId) {
        state.mapInitiativeHoverId = entityId;
        state.mapGuidelineHoverId = '';
        applyState();
      }
      return;
    }

    if (state.mapInitiativeHoverId || state.mapGuidelineHoverId) {
      state.mapInitiativeHoverId = '';
      state.mapGuidelineHoverId = '';
      applyState();
    }
  });

  viewport.addEventListener('mouseleave', () => {
    if (state.mapLayer !== 'initiatives') return;
    if (hasLockedFocus()) return;
    if (!state.mapInitiativeHoverId && !state.mapGuidelineHoverId) return;
    state.mapInitiativeHoverId = '';
    state.mapGuidelineHoverId = '';
    applyState();
  });
}

async function persistMapNodePosition(nodeElement) {
  if (!nodeElement) return;
  const cycleId = String(nodeElement.dataset.cycleId || '').trim();
  if (!cycleId) return;

  const kind = String(nodeElement.dataset.kind || '').trim();
  const entityId = String(nodeElement.dataset.entityId || '').trim();
  const renderedX = Number(nodeElement.dataset.x);
  const renderedY = Number(nodeElement.dataset.y);
  if (!Number.isFinite(renderedX) || !Number.isFinite(renderedY)) return;
  const shift = state.mapRenderShift || { x: 0, y: 0 };
  const x = Math.round(renderedX - Number(shift.x || 0));
  const y = Math.round(renderedY - Number(shift.y || 0));

  const selectedSlug = normalizeSlug(state.institutionSlug);
  const institutions = Array.isArray(state.mapData?.institutions) ? state.mapData.institutions : [];
  const institution = institutions.find((item) => normalizeSlug(item.slug) === selectedSlug);
  if (!institution) return;

  if (kind === 'institution') {
    if (institution.cycle) {
      institution.cycle.mapX = x;
      institution.cycle.mapY = y;
    }
    await api(`/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/map-layout`, {
      method: 'PUT',
      body: {
        institutionPosition: { x, y }
      }
    });
    return;
  }

  if (kind === 'guideline' && entityId) {
    const guideline = Array.isArray(institution.guidelines)
      ? institution.guidelines.find((item) => item.id === entityId)
      : null;
    if (guideline) {
      guideline.mapX = x;
      guideline.mapY = y;
    }
    await api(`/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/map-layout`, {
      method: 'PUT',
      body: {
        guidelinePositions: [{ guidelineId: entityId, x, y }]
      }
    });
    return;
  }

  if (kind === 'initiative' && entityId) {
    const initiative = Array.isArray(institution.initiatives)
      ? institution.initiatives.find((item) => item.id === entityId)
      : null;
    if (initiative) {
      initiative.mapX = x;
      initiative.mapY = y;
    }
    await api(`/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/map-layout`, {
      method: 'PUT',
      body: {
        initiativePositions: [{ initiativeId: entityId, x, y }]
      }
    });
  }
}

function bindMapInteractions(viewport, world, { editable }) {
  let dragActive = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let originX = 0;
  let originY = 0;
  let draggedNode = null;
  let nodeOriginX = 0;
  let nodeOriginY = 0;
  let movedDuringDrag = false;
  let dragMode = '';
  const isNodeDraggableInCurrentLayer = (nodeElement) => {
    if (!editable || !(nodeElement instanceof HTMLElement)) return false;
    if (state.mapLayer === 'strategic-links') return false;
    const kind = String(nodeElement.dataset.kind || '').trim().toLowerCase();
    if (kind === 'institution') return true;
    const initiativesLayer = state.mapLayer === 'initiatives';
    if (kind === 'initiative') return initiativesLayer;
    if (kind === 'guideline') return !initiativesLayer;
    return nodeElement.dataset.draggable === 'true';
  };

  const onPointerMove = (event) => {
    if (!dragActive) return;
    if (Math.abs(event.clientX - dragStartX) > 2 || Math.abs(event.clientY - dragStartY) > 2) {
      movedDuringDrag = true;
    }
    if (draggedNode) {
      const dx = (event.clientX - dragStartX) / state.mapTransform.scale;
      const dy = (event.clientY - dragStartY) / state.mapTransform.scale;
      const nextX = Math.max(MAP_NODE_MIN_RENDER_X, Math.round(nodeOriginX + dx));
      const nextY = Math.max(MAP_NODE_MIN_RENDER_Y, Math.round(nodeOriginY + dy));
      draggedNode.dataset.x = String(nextX);
      draggedNode.dataset.y = String(nextY);
      draggedNode.style.left = `${nextX}px`;
      draggedNode.style.top = `${nextY}px`;
      refreshMapEdges(world);
      return;
    }

    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;
    state.mapTransform.x = originX + dx;
    state.mapTransform.y = originY + dy;
    applyMapTransform(viewport, world);
  };

  const endDrag = () => {
    const droppedNode = draggedNode;
    const didMove = movedDuringDrag;
    const completedDragMode = dragMode;
    dragActive = false;
    draggedNode = null;
    movedDuringDrag = false;
    dragMode = '';
    viewport.classList.remove('dragging');
    viewport.classList.remove('node-dragging');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);

    if (didMove) {
      if (droppedNode instanceof HTMLElement) {
        droppedNode.dataset.justDragged = '1';
        window.setTimeout(() => {
          if (droppedNode.dataset.justDragged === '1') delete droppedNode.dataset.justDragged;
        }, 220);
      } else if (completedDragMode === 'pan') {
        viewport.dataset.justPanned = '1';
        window.setTimeout(() => {
          if (viewport.dataset.justPanned === '1') delete viewport.dataset.justPanned;
        }, 220);
      }
    }

    if (!droppedNode || !editable || !didMove) return;
    persistMapNodePosition(droppedNode).catch((error) => {
      state.notice = toUserMessage(error);
      notifyMapError(state.notice);
      render();
    });
  };

  viewport.addEventListener('pointerdown', (event) => {
    const rawTarget = event.target;
    const target = rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement;
    if (event.button !== 0) return;
    if (!target) return;
    if (target.closest('button, a, input, textarea, select, [data-map-interactive="true"]')) return;

    if (editable) {
      const node = target.closest('.strategy-map-node');
      if (node instanceof HTMLElement && isNodeDraggableInCurrentLayer(node)) {
        dragActive = true;
        draggedNode = node;
        dragMode = 'node';
        movedDuringDrag = false;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        nodeOriginX = Number(node.dataset.x || 0);
        nodeOriginY = Number(node.dataset.y || 0);
        viewport.classList.add('node-dragging');
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', endDrag);
        return;
      }
    }

    if (target.closest('.strategy-map-node')) return;

    dragActive = true;
    dragMode = 'pan';
    movedDuringDrag = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    originX = state.mapTransform.x;
    originY = state.mapTransform.y;
    viewport.classList.add('dragging');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
  });

  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    const nextScale = clamp(
      state.mapTransform.scale + (event.deltaY < 0 ? 0.08 : -0.08),
      0.2,
      1.8
    );
    if (nextScale === state.mapTransform.scale) return;

    const rect = viewport.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const ratio = nextScale / state.mapTransform.scale;
    state.mapTransform.x = anchorX - (anchorX - state.mapTransform.x) * ratio;
    state.mapTransform.y = anchorY - (anchorY - state.mapTransform.y) * ratio;
    state.mapTransform.scale = nextScale;
    applyMapTransform(viewport, world);
  }, { passive: false });
}
