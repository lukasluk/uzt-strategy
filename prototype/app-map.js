// Map-specific rendering and interaction functions extracted from app.js
// This file must be loaded before app.js.

function estimateGuidelineNodeHeight(totalScore) {
  const score = Math.max(0, Number(totalScore || 0));
  const voteRows = Math.max(1, Math.ceil(score / MAP_VOTE_SQUARES_PER_ROW));
  return 104 + voteRows * 14;
}

function estimateInitiativeNodeHeight(totalScore) {
  const score = Math.max(0, Number(totalScore || 0));
  const voteRows = Math.max(1, Math.ceil(score / MAP_VOTE_SQUARES_PER_ROW));
  return 110 + voteRows * 14;
}

const PARENT_GUIDELINE_SCALE = 1.2;

function resolveAutoSide(fromNode, toNode) {
  const fromCenterX = fromNode.x + fromNode.w / 2;
  const fromCenterY = fromNode.y + fromNode.h / 2;
  const toCenterX = toNode.x + toNode.w / 2;
  const toCenterY = toNode.y + toNode.h / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
}

function oppositeSide(side) {
  if (side === 'left') return 'right';
  if (side === 'right') return 'left';
  if (side === 'top') return 'bottom';
  return 'top';
}

function anchorForSide(node, side) {
  if (side === 'left') return { x: node.x, y: node.y + node.h / 2 };
  if (side === 'right') return { x: node.x + node.w, y: node.y + node.h / 2 };
  if (side === 'top') return { x: node.x + node.w / 2, y: node.y };
  return { x: node.x + node.w / 2, y: node.y + node.h };
}

function controlPointForSide(point, side, offset = 86) {
  if (side === 'left') return { x: point.x - offset, y: point.y };
  if (side === 'right') return { x: point.x + offset, y: point.y };
  if (side === 'top') return { x: point.x, y: point.y - offset };
  return { x: point.x, y: point.y + offset };
}

function edgePath(fromNode, toNode, preferredSide) {
  const sourceSide = normalizeLineSide(preferredSide) === 'auto'
    ? resolveAutoSide(fromNode, toNode)
    : normalizeLineSide(preferredSide);
  const targetSide = oppositeSide(sourceSide);
  const from = anchorForSide(fromNode, sourceSide);
  const to = anchorForSide(toNode, targetSide);
  const c1 = controlPointForSide(from, sourceSide);
  const c2 = controlPointForSide(to, targetSide);
  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
}


function applyMapTransform(viewport, world) {
  const { x, y, scale } = state.mapTransform;
  world.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  const gridSize = 48 * scale;
  viewport.style.setProperty('--grid-size', `${Math.max(18, gridSize)}px`);
  viewport.style.setProperty('--grid-x', `${x % gridSize}px`);
  viewport.style.setProperty('--grid-y', `${y % gridSize}px`);
}

function updateMapFullscreenButtonLabel() {
  const fullscreenButtons = document.querySelectorAll('[data-map-fullscreen-btn]');
  if (!fullscreenButtons.length) return;
  const isFullscreen = document.fullscreenElement === elements.stepView;
  fullscreenButtons.forEach((button) => {
    button.innerHTML = isFullscreen ? MAP_FULLSCREEN_ICON_EXIT : MAP_FULLSCREEN_ICON_ENTER;
    button.setAttribute('aria-label', isFullscreen ? 'Išjungti pilno ekrano režimą' : 'Įjungti pilno ekrano režimą');
    button.setAttribute('title', isFullscreen ? 'Išjungti pilno ekrano režimą' : 'Įjungti pilno ekrano režimą');
    button.setAttribute('aria-pressed', isFullscreen ? 'true' : 'false');
  });
}

function fitMapToCurrentNodes(viewport, world) {
  const nodes = Array.from(world.querySelectorAll('.strategy-map-node[data-node-id]')).map((node) => ({
    x: Number(node.dataset.x || 0),
    y: Number(node.dataset.y || 0),
    w: Number(node.dataset.w || node.offsetWidth || 0),
    h: Number(node.dataset.h || node.offsetHeight || 0)
  }));
  if (!nodes.length) {
    state.mapTransform = { x: 120, y: 80, scale: 1 };
    applyMapTransform(viewport, world);
    return;
  }

  const minX = nodes.reduce((acc, node) => Math.min(acc, node.x), Infinity);
  const minY = nodes.reduce((acc, node) => Math.min(acc, node.y), Infinity);
  const maxX = nodes.reduce((acc, node) => Math.max(acc, node.x + node.w), -Infinity);
  const maxY = nodes.reduce((acc, node) => Math.max(acc, node.y + node.h), -Infinity);

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const pad = 72;
  const viewportW = Math.max(1, viewport.clientWidth);
  const viewportH = Math.max(1, viewport.clientHeight);
  const scale = clamp(
    Math.min((viewportW - pad) / width, (viewportH - pad) / height),
    0.2,
    1.8
  );

  state.mapTransform = {
    scale,
    x: (viewportW - width * scale) / 2 - minX * scale,
    y: (viewportH - height * scale) / 2 - minY * scale
  };
  applyMapTransform(viewport, world);
}

function layoutStrategyMap() {
  const institutions = Array.isArray(state.mapData?.institutions) ? state.mapData.institutions : [];
  const selectedSlug = normalizeSlug(state.institutionSlug);
  if (!selectedSlug) {
    return {
      nodes: [],
      guidelineEdges: [],
      initiativeEdges: [],
      width: 1200,
      height: 820,
      institution: null
    };
  }

  const institution = institutions.find((item) => normalizeSlug(item.slug) === selectedSlug);
  if (!institution) {
    return {
      nodes: [],
      guidelineEdges: [],
      initiativeEdges: [],
      width: 1200,
      height: 820,
      institution: null
    };
  }

  const toNumberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const nodes = [];
  const guidelineEdges = [];
  const initiativeEdges = [];
  const baseX = 140;
  const institutionNodeId = `inst-${institution.id}`;
  const institutionX = toNumberOrNull(institution.cycle?.mapX) ?? baseX;
  const institutionY = toNumberOrNull(institution.cycle?.mapY) ?? 48;
  nodes.push({
    id: institutionNodeId,
    kind: 'institution',
    entityId: institution.id,
    cycleId: institution.cycle?.id || null,
    x: institutionX,
    y: institutionY,
    w: 390,
    h: 220,
    institution
  });

  const guidelines = Array.isArray(institution.guidelines) ? institution.guidelines : [];
  const initiatives = Array.isArray(institution.initiatives) ? institution.initiatives : [];

  const guidelineNodeIdByEntity = {};
  const guidelineById = Object.fromEntries(guidelines.map((g) => [g.id, g]));
  if (guidelines.length) {
    const childrenByParent = {};
    guidelines.forEach((guideline) => {
      const parentId = guideline.parentGuidelineId;
      if (!parentId || !guidelineById[parentId]) return;
      if (!childrenByParent[parentId]) childrenByParent[parentId] = [];
      childrenByParent[parentId].push(guideline);
    });

    const roots = guidelines.filter((guideline) => {
      const parentId = guideline.parentGuidelineId;
      return guideline.relationType !== 'child' || !parentId || !guidelineById[parentId];
    });

    const visited = new Set();
    let nextY = institutionY + 170;
    const placeNodeTree = (guideline, depth, parentNodeId) => {
      if (visited.has(guideline.id)) return;
      visited.add(guideline.id);

      const nodeId = `guide-${guideline.id}`;
      const defaultX = institutionX + 46 + depth * 250;
      const defaultY = nextY;
      nextY += 100;

      const nodeX = toNumberOrNull(guideline.mapX) ?? defaultX;
      const nodeY = toNumberOrNull(guideline.mapY) ?? defaultY;
      const isParentGuideline = String(guideline.relationType || '').toLowerCase() === 'parent';
      const sizeScale = isParentGuideline ? PARENT_GUIDELINE_SCALE : 1;
      const node = {
        id: nodeId,
        kind: 'guideline',
        entityId: guideline.id,
        cycleId: institution.cycle?.id || null,
        x: nodeX,
        y: nodeY,
        w: Math.round(220 * sizeScale),
        h: Math.round(estimateGuidelineNodeHeight(guideline.totalScore) * sizeScale),
        institution,
        guideline
      };
      nodes.push(node);
      guidelineNodeIdByEntity[guideline.id] = nodeId;

      if (parentNodeId) {
        guidelineEdges.push({ from: parentNodeId, to: nodeId, type: 'child', layer: 'guidelines' });
      } else {
        guidelineEdges.push({
          from: institutionNodeId,
          to: nodeId,
          type: guideline.relationType === 'orphan' ? 'orphan' : 'root',
          layer: 'guidelines'
        });
      }

      const children = childrenByParent[guideline.id] || [];
      children.forEach((child) => placeNodeTree(child, depth + 1, nodeId));
    };

    roots.forEach((root) => placeNodeTree(root, 0, null));
    guidelines.forEach((guideline) => {
      if (!visited.has(guideline.id)) placeNodeTree(guideline, 0, null);
    });
  }

  if (initiatives.length) {
    let floatingY = institutionY + 120;
    initiatives.forEach((initiative, index) => {
      const nodeId = `initiative-${initiative.id}`;
      const defaultX = institutionX + 520 + (index % 4) * 260;
      const defaultY = floatingY + Math.floor(index / 4) * 170;
      const nodeX = toNumberOrNull(initiative.mapX) ?? defaultX;
      const nodeY = toNumberOrNull(initiative.mapY) ?? defaultY;
      const node = {
        id: nodeId,
        kind: 'initiative',
        entityId: initiative.id,
        cycleId: institution.cycle?.id || null,
        x: nodeX,
        y: nodeY,
        w: 250,
        h: estimateInitiativeNodeHeight(initiative.totalScore),
        institution,
        initiative
      };
      nodes.push(node);

      const linkedGuidelineIds = Array.isArray(initiative.guidelineIds) ? initiative.guidelineIds : [];
      linkedGuidelineIds.forEach((guidelineId) => {
        const targetNodeId = guidelineNodeIdByEntity[guidelineId];
        if (!targetNodeId) return;
        initiativeEdges.push({
          from: nodeId,
          to: targetNodeId,
          type: 'initiative-link',
          layer: 'initiatives',
          lineSide: normalizeLineSide(initiative.lineSide)
        });
      });
    });
  }

  const minLeft = nodes.reduce((acc, node) => Math.min(acc, node.x), Infinity);
  const minTop = nodes.reduce((acc, node) => Math.min(acc, node.y), Infinity);
  const maxRight = nodes.reduce((acc, node) => Math.max(acc, node.x + node.w), -Infinity);
  const maxBottom = nodes.reduce((acc, node) => Math.max(acc, node.y + node.h), -Infinity);

  const pad = 320;
  const shiftX = Number.isFinite(minLeft) ? pad - minLeft : 0;
  const shiftY = Number.isFinite(minTop) ? pad - minTop : 0;
  nodes.forEach((node) => {
    node.x += shiftX;
    node.y += shiftY;
  });

  const rawWidth = Number.isFinite(maxRight) && Number.isFinite(minLeft)
    ? (maxRight - minLeft) + pad * 2
    : 1800;
  const rawHeight = Number.isFinite(maxBottom) && Number.isFinite(minTop)
    ? (maxBottom - minTop) + pad * 2
    : 920;
  const width = Math.max(1800, rawWidth);
  const height = Math.max(920, rawHeight);
  return {
    nodes,
    guidelineEdges,
    initiativeEdges,
    width,
    height,
    institution
  };
}


function syncMapNodeBounds(world) {
  world.querySelectorAll('.strategy-map-node[data-node-id]').forEach((node) => {
    const width = Math.round(node.offsetWidth);
    const height = Math.round(node.offsetHeight);
    if (Number.isFinite(width) && width > 0) node.dataset.w = String(width);
    if (Number.isFinite(height) && height > 0) node.dataset.h = String(height);
  });
}

function refreshMapEdges(world) {
  const nodeElements = Array.from(world.querySelectorAll('.strategy-map-node[data-node-id]'));
  const nodeById = new Map();
  nodeElements.forEach((node) => {
    nodeById.set(node.dataset.nodeId, {
      x: Number(node.dataset.x),
      y: Number(node.dataset.y),
      w: Number(node.dataset.w),
      h: Number(node.dataset.h)
    });
  });

  world.querySelectorAll('.strategy-map-edge').forEach((path) => {
    const fromNode = nodeById.get(path.dataset.from);
    const toNode = nodeById.get(path.dataset.to);
    if (!fromNode || !toNode) return;

    const lineSide = path.dataset.lineSide || 'auto';
    path.setAttribute('d', edgePath(fromNode, toNode, lineSide));
  });
}

function resetMapInitiativeFocusState() {
  state.mapInitiativeFocusId = '';
  state.mapInitiativeHoverId = '';
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
    node.classList.remove('map-initiative-selected', 'map-initiative-hovered', 'map-initiative-dimmed');
  });
  guidelineNodes.forEach((node) => {
    node.classList.remove('map-guideline-related', 'map-guideline-dimmed');
  });
  if (institutionNode) institutionNode.classList.remove('map-institution-dimmed-strong');
  initiativeEdges.forEach((edge) => edge.classList.remove('map-edge-active'));

  if (!initiativesLayer) return;

  const initiativeByEntityId = new Map(
    initiativeNodes.map((node) => [String(node.dataset.entityId || '').trim(), node])
  );

  let focusEntityId = String(state.mapInitiativeFocusId || '').trim();
  if (focusEntityId && !initiativeByEntityId.has(focusEntityId)) {
    focusEntityId = '';
    state.mapInitiativeFocusId = '';
  }

  let hoverEntityId = String(state.mapInitiativeHoverId || '').trim();
  if (hoverEntityId && !initiativeByEntityId.has(hoverEntityId)) {
    hoverEntityId = '';
    state.mapInitiativeHoverId = '';
  }

  const activeEntityId = focusEntityId || hoverEntityId;
  if (!activeEntityId) return;

  const activeNode = initiativeByEntityId.get(activeEntityId);
  if (!activeNode) return;
  const activeNodeId = String(activeNode.dataset.nodeId || '').trim();
  if (!activeNodeId) return;

  viewport.classList.add('map-initiative-focus-active');
  if (focusEntityId) viewport.classList.add('map-initiative-focus-selected');
  if (institutionNode) institutionNode.classList.add('map-institution-dimmed-strong');

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
    const isSelected = focusEntityId && String(node.dataset.entityId || '').trim() === focusEntityId;
    const isHovered = !focusEntityId && hoverEntityId && String(node.dataset.entityId || '').trim() === hoverEntityId;

    node.classList.toggle('map-initiative-selected', Boolean(isSelected));
    node.classList.toggle('map-initiative-hovered', Boolean(isHovered));
    node.classList.toggle('map-initiative-dimmed', !isActiveNode);
  });

  guidelineNodes.forEach((node) => {
    const nodeId = String(node.dataset.nodeId || '').trim();
    const isRelated = relatedGuidelineNodeIds.has(nodeId);
    node.classList.toggle('map-guideline-related', isRelated);
    node.classList.toggle('map-guideline-dimmed', !isRelated);
  });
}

function bindInitiativeLayerFocusInteractions(viewport, world) {
  if (!(viewport instanceof HTMLElement) || !(world instanceof HTMLElement)) return;

  const initiativeNodes = Array.from(world.querySelectorAll('.strategy-map-node[data-kind="initiative"]'));
  if (!initiativeNodes.length) return;

  const applyState = () => applyInitiativeLayerFocusState(viewport, world);

  initiativeNodes.forEach((node) => {
    node.addEventListener('mouseenter', () => {
      if (state.mapLayer !== 'initiatives') return;
      if (state.mapInitiativeFocusId) return;
      state.mapInitiativeHoverId = String(node.dataset.entityId || '').trim();
      applyState();
    });

    node.addEventListener('mouseleave', () => {
      if (state.mapLayer !== 'initiatives') return;
      if (state.mapInitiativeFocusId) return;
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
      }
      applyState();
    });
  });

  viewport.addEventListener('click', (event) => {
    if (state.mapLayer !== 'initiatives') return;
    if (!state.mapInitiativeFocusId) return;
    if (viewport.dataset.justPanned === '1') return;

    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('.strategy-map-node[data-kind="initiative"]')) return;
    if (target.closest('[data-map-interactive="true"]')) return;

    resetMapInitiativeFocusState();
    applyState();
  });
}

async function persistMapNodePosition(nodeElement) {
  if (!nodeElement) return;
  const cycleId = String(nodeElement.dataset.cycleId || '').trim();
  if (!cycleId) return;

  const kind = String(nodeElement.dataset.kind || '').trim();
  const entityId = String(nodeElement.dataset.entityId || '').trim();
  const x = Number(nodeElement.dataset.x);
  const y = Number(nodeElement.dataset.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  const selectedSlug = normalizeSlug(state.institutionSlug);
  const institutions = Array.isArray(state.mapData?.institutions) ? state.mapData.institutions : [];
  const institution = institutions.find((item) => normalizeSlug(item.slug) === selectedSlug);
  if (!institution) return;

  if (kind === 'institution') {
    if (institution.cycle) {
      institution.cycle.mapX = Math.round(x);
      institution.cycle.mapY = Math.round(y);
    }
    await api(`/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/map-layout`, {
      method: 'PUT',
      body: {
        institutionPosition: { x: Math.round(x), y: Math.round(y) }
      }
    });
    return;
  }

  if (kind === 'guideline' && entityId) {
    const guideline = Array.isArray(institution.guidelines)
      ? institution.guidelines.find((item) => item.id === entityId)
      : null;
    if (guideline) {
      guideline.mapX = Math.round(x);
      guideline.mapY = Math.round(y);
    }
    await api(`/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/map-layout`, {
      method: 'PUT',
      body: {
        guidelinePositions: [{ guidelineId: entityId, x: Math.round(x), y: Math.round(y) }]
      }
    });
    return;
  }

  if (kind === 'initiative' && entityId) {
    const initiative = Array.isArray(institution.initiatives)
      ? institution.initiatives.find((item) => item.id === entityId)
      : null;
    if (initiative) {
      initiative.mapX = Math.round(x);
      initiative.mapY = Math.round(y);
    }
    await api(`/api/v1/admin/cycles/${encodeURIComponent(cycleId)}/map-layout`, {
      method: 'PUT',
      body: {
        initiativePositions: [{ initiativeId: entityId, x: Math.round(x), y: Math.round(y) }]
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
      const nextX = Math.round(nodeOriginX + dx);
      const nextY = Math.round(nodeOriginY + dy);
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

function renderMapView() {
  if (state.loading && !state.mapData) {
    elements.stepView.innerHTML = '<div class="card"><strong>Kraunamas strategijų žemėlapis...</strong></div>';
    return;
  }

  if (state.mapError) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Nepavyko ikelti strategiju zemelapio</strong>
        <p class="prompt" style="margin: 8px 0 0;">${escapeHtml(state.mapError)}</p>
        <button id="retryMapLoadBtn" class="btn btn-primary" style="margin-top: 12px;">Bandyti dar karta</button>
      </div>
    `;
    const retryBtn = elements.stepView.querySelector('#retryMapLoadBtn');
    if (retryBtn) retryBtn.addEventListener('click', bootstrap);
    return;
  }

  if (!Array.isArray(state.mapData?.institutions) || !state.mapData.institutions.length) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Strategijų žemėlapis dar tuščias</strong>
        <p class="prompt" style="margin: 8px 0 0;">Kai institucijos turės strategijas, jos atsiras šiame žemėlapyje.</p>
      </div>
    `;
    return;
  }

  const graph = layoutStrategyMap();
  if (!graph.institution) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Pasirinkite instituciją</strong>
        <p class="prompt" style="margin: 8px 0 0;">Žemėlapyje rodoma tik viršuje pasirinktos institucijos strategija.</p>
      </div>
    `;
    return;
  }

  const hasInitiativeNodes = graph.nodes.some((node) => node.kind === 'initiative');
  if (state.mapLayer !== 'guidelines' && state.mapLayer !== 'initiatives') {
    state.mapLayer = 'guidelines';
  }
  if (state.mapLayer === 'initiatives' && !hasInitiativeNodes) {
    state.mapLayer = 'guidelines';
  }
  const activeLayer = state.mapLayer;
  if (activeLayer !== 'initiatives') {
    resetMapInitiativeFocusState();
  }

  const editable = canEditMapLayout()
    && normalizeSlug(graph.institution.slug) === normalizeSlug(state.institutionSlug)
    && Boolean(graph.institution.cycle?.id);
  const embedBranding = state.embedMapMode
    ? `
      <p class="embed-map-branding-note">
        <a href="${escapeHtml(EMBED_BRAND_LINK)}" target="_blank" rel="noopener noreferrer">
          Strategijų žemėlapis by digistrategija.lt
        </a>
      </p>
    `
    : '';
  const mapHeader = state.embedMapMode
    ? ''
    : `
      <div class="step-header">
        <h2>Strategijų žemėlapis</h2>
        <div class="header-stack step-header-actions">
          <span class="tag">Institucija: ${escapeHtml(graph.institution.name || graph.institution.slug)}</span>
          ${editable ? `<span class="tag tag-main">Admin: galite tempti ${activeLayer === 'initiatives' ? 'iniciatyvų' : 'gairių'} korteles</span>` : ''}
        </div>
      </div>
      <p class="prompt">Peržiūrėkite pasirinktos institucijos strategijos sluoksnius. Iniciatyvų sluoksnyje gairių kortelės lieka matomos, bet užrakintos.</p>
    `;
  const mapToolbar = `
      <div class="map-overlay-toolbar">
        <div class="map-layer-toggle map-overlay-layer-toggle">
          <button type="button" data-map-layer-btn="guidelines" class="btn ${activeLayer === 'guidelines' ? 'btn-primary' : 'btn-ghost'}">Gairės</button>
          <button type="button" data-map-layer-btn="initiatives" class="btn ${activeLayer === 'initiatives' ? 'btn-primary' : 'btn-ghost'}" ${hasInitiativeNodes ? '' : 'disabled'}>Iniciatyvos</button>
        </div>
        <div class="map-overlay-actions">
          <button type="button" data-map-reset-btn class="btn btn-ghost">Centruoti vaizdą</button>
          <button type="button" data-map-fullscreen-btn class="btn btn-ghost btn-icon map-fullscreen-btn" aria-label="Įjungti pilno ekrano režimą" title="Įjungti pilno ekrano režimą"></button>
        </div>
      </div>
    `;
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
    return `<path class="strategy-map-edge edge-${escapeHtml(edge.type)}${parentRootClass} edge-guideline-layer" data-layer="guidelines" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="${escapeHtml(lineSide)}" d="${edgePath(fromNode, toNode, lineSide)}"></path>`;
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
      return `
        <article class="strategy-map-node institution-node ${node.institution.slug === state.institutionSlug ? 'active' : ''}"
                 data-node-id="${escapeHtml(node.id)}"
                 data-kind="institution"
                 data-entity-id="${escapeHtml(node.entityId)}"
                 data-cycle-id="${escapeHtml(node.cycleId || '')}"
                 data-x="${node.x}"
                 data-y="${node.y}"
                 data-w="${node.w}"
                 data-h="${node.h}"
                 data-draggable="${editable ? 'true' : 'false'}"
                 style="left:${node.x}px;top:${node.y}px;width:${node.w}px;height:${node.h}px;">
          <strong>${escapeHtml(node.institution.name)}</strong>
          <small class="institution-subtitle">Skaitmenizacijos strategija</small>
          <span class="tag">${escapeHtml(cycleState.toUpperCase())}</span>
          <small class="institution-cycle-label">Strategijos ciklo būsena</small>
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
      const scoreForSquares = Math.max(0, Math.round(score));
      const voteSquares = scoreForSquares
        ? Array.from({ length: scoreForSquares }, () => '<span class="map-vote-square" aria-hidden="true"></span>').join('')
        : '<span class="map-vote-empty">Dar nebalsuota</span>';

      return `
        <article class="strategy-map-node guideline-node relation-${escapeHtml(relation)} status-${escapeHtml(String(node.guideline.status || 'active').toLowerCase())}"
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
                 style="left:${node.x}px;top:${node.y}px;width:${node.w}px;min-height:${node.h}px;">
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
          <small>${escapeHtml(node.institution.slug)} - ${escapeHtml(relationText)}</small>
          <div class="map-vote-row">
            <span class="map-vote-chip" title="Bendras balas">
              <strong>${score}</strong>
            </span>
          </div>
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
        <div id="strategyMapWorld" class="strategy-map-world" style="width:${graph.width}px;height:${graph.height}px;">
          <svg class="strategy-map-lines guideline-lines" viewBox="0 0 ${graph.width} ${graph.height}" preserveAspectRatio="none">
            ${guidelineEdgeMarkup}
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
  const commentList = elements.stepView.querySelector('#mapCommentList');
  const mapCommentItems = new Map();
  graph.nodes.forEach((node) => {
    if (node.kind === 'guideline' && node.guideline?.id) {
      mapCommentItems.set(`guideline:${node.guideline.id}`, {
        title: node.guideline.title || 'Gairė',
        description: node.guideline.description || 'Aprašymas nepateiktas.',
        comments: Array.isArray(node.guideline.comments) ? node.guideline.comments : []
      });
    }
    if (node.kind === 'initiative' && node.initiative?.id) {
      mapCommentItems.set(`initiative:${node.initiative.id}`, {
        title: node.initiative.title || 'Iniciatyva',
        description: node.initiative.description || 'Aprašymas nepateiktas.',
        comments: Array.isArray(node.initiative.comments) ? node.initiative.comments : []
      });
    }
  });

  const closeMapCommentModal = () => {
    if (!commentModal) return;
    commentModal.hidden = true;
  };

  const openMapCommentModal = (kind, itemId) => {
    if (!commentModal || !commentTitle || !commentDescription || !commentList) return;
    const payload = mapCommentItems.get(`${String(kind || '').trim()}:${String(itemId || '').trim()}`);
    if (!payload) return;
    const comments = Array.isArray(payload.comments) ? payload.comments : [];
    commentTitle.textContent = payload.title;
    commentDescription.textContent = payload.description;
    commentList.innerHTML = comments.length
      ? comments.map((comment) => renderCommentItem(comment)).join('')
      : '<li class="comment-item comment-item-empty">Komentarų dar nėra.</li>';
    commentModal.hidden = false;
  };

  if (commentModal) {
    commentModal.querySelectorAll('[data-map-comment-close="1"]').forEach((button) => {
      button.addEventListener('click', closeMapCommentModal);
    });
  }
  elements.stepView.querySelectorAll('[data-map-comment-id]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMapCommentModal(button.dataset.mapCommentKind, button.dataset.mapCommentId);
    });
  });

  const layerGuidelinesButtons = Array.from(elements.stepView.querySelectorAll('[data-map-layer-btn="guidelines"]'));
  const layerInitiativesButtons = Array.from(elements.stepView.querySelectorAll('[data-map-layer-btn="initiatives"]'));
  layerGuidelinesButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (state.mapLayer === 'guidelines') return;
      state.mapLayer = 'guidelines';
      resetMapInitiativeFocusState();
      renderStepView();
    });
  });
  layerInitiativesButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (state.mapLayer === 'initiatives') return;
      state.mapLayer = 'initiatives';
      resetMapInitiativeFocusState();
      renderStepView();
    });
  });

  if (viewport && world) {
    syncMapNodeBounds(world);
    refreshMapEdges(world);
    fitMapToCurrentNodes(viewport, world);
    bindMapInteractions(viewport, world, { editable });
    bindInitiativeLayerFocusInteractions(viewport, world);
    applyInitiativeLayerFocusState(viewport, world);
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
          render();
          return;
        }
        updateMapFullscreenButtonLabel();
        if (viewport && world) fitMapToCurrentNodes(viewport, world);
      });
    });
  }
}


