// Map geometry and viewport transform helpers.
// This file must load before app-map.js.

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
    button.setAttribute('aria-label', isFullscreen ? 'IÅ¡jungti pilno ekrano reÅ¾imÄ…' : 'Ä®jungti pilno ekrano reÅ¾imÄ…');
    button.setAttribute('title', isFullscreen ? 'IÅ¡jungti pilno ekrano reÅ¾imÄ…' : 'Ä®jungti pilno ekrano reÅ¾imÄ…');
    button.setAttribute('aria-pressed', isFullscreen ? 'true' : 'false');
  });
}

function fitMapToCurrentNodes(viewport, world) {
  const activeLayer = String(state.mapLayer || 'guidelines').trim().toLowerCase();
  const nodeElements = Array.from(world.querySelectorAll('.strategy-map-node[data-node-id]')).filter((node) => {
    const kind = String(node.dataset.kind || '').trim().toLowerCase();
    if (!kind || kind === 'institution') return true;
    if (activeLayer === 'guidelines') return kind === 'guideline';
    if (activeLayer === 'initiatives') return kind === 'guideline' || kind === 'initiative';
    if (activeLayer === 'strategic-links') return kind === 'guideline';
    return true;
  });
  const nodes = nodeElements.map((node) => ({
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
