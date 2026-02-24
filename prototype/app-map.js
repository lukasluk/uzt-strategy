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
const MAP_WORLD_PAD = 320;
const MAP_NODE_MIN_RENDER_X = -3000;
const MAP_NODE_MIN_RENDER_Y = -3000;

function notifyMapError(message) {
  const text = String(message || '').trim();
  if (!text) return;
  if (window.DigiAlerts && typeof window.DigiAlerts.error === 'function') {
    window.DigiAlerts.error(text);
  }
}

function mapNormalizeStrategyLinks(value) {
  if (typeof normalizeGuidelineStrategyLinks === 'function') {
    return normalizeGuidelineStrategyLinks(value);
  }
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const otherGuidelineId = String(item.otherGuidelineId || '').trim();
      if (!otherGuidelineId) return null;
      return {
        otherGuidelineId,
        otherInstitutionSlug: String(item.otherInstitutionSlug || '').trim().toLowerCase(),
        otherStrategySlug: String(item.otherStrategySlug || '').trim().toLowerCase(),
        otherInstitutionName: String(item.otherInstitutionName || '').trim(),
        otherStrategyTitle: String(item.otherStrategyTitle || '').trim(),
        isCrossStrategy: Boolean(item.isCrossStrategy)
      };
    })
    .filter(Boolean);
}

function mapStrategyLinkLabel(link) {
  if (typeof strategyLinkLabel === 'function') return strategyLinkLabel(link);
  const institution = String(link?.otherInstitutionSlug || link?.otherInstitutionName || '-').trim();
  const strategy = String(link?.otherStrategyTitle || link?.otherStrategySlug || 'default').trim();
  return `${institution} / ${strategy}`;
}

function mapLang(lt, en) {
  if (typeof langText === 'function') return langText(lt, en);
  return String(en || lt || '');
}

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
      strategyGuidelineEdges: [],
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
      strategyGuidelineEdges: [],
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
  const strategyGuidelineEdges = [];
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

    const strategyLinkPairSet = new Set();
    guidelines.forEach((guideline) => {
      const fromNodeId = guidelineNodeIdByEntity[guideline.id];
      if (!fromNodeId) return;
      const links = Array.isArray(guideline.strategyLinks) ? guideline.strategyLinks : [];
      links.forEach((link) => {
        const otherGuidelineId = String(link?.otherGuidelineId || '').trim();
        if (!otherGuidelineId) return;
        const toNodeId = guidelineNodeIdByEntity[otherGuidelineId];
        if (!toNodeId || toNodeId === fromNodeId) return;
        const pairKey = [fromNodeId, toNodeId].sort().join('|');
        if (strategyLinkPairSet.has(pairKey)) return;
        strategyLinkPairSet.add(pairKey);
        strategyGuidelineEdges.push({
          from: fromNodeId,
          to: toNodeId,
          type: 'strategy-link',
          layer: 'guidelines',
          lineSide: 'auto'
        });
      });
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

  const shiftX = Number.isFinite(minLeft) && minLeft < MAP_WORLD_PAD
    ? MAP_WORLD_PAD - minLeft
    : 0;
  const shiftY = Number.isFinite(minTop) && minTop < MAP_WORLD_PAD
    ? MAP_WORLD_PAD - minTop
    : 0;
  nodes.forEach((node) => {
    node.x += shiftX;
    node.y += shiftY;
  });

  const rawWidth = Number.isFinite(maxRight) && Number.isFinite(minLeft)
    ? (maxRight - minLeft) + MAP_WORLD_PAD * 2
    : 1800;
  const rawHeight = Number.isFinite(maxBottom) && Number.isFinite(minTop)
    ? (maxBottom - minTop) + MAP_WORLD_PAD * 2
    : 920;
  const width = Math.max(1800, rawWidth);
  const height = Math.max(920, rawHeight);
  state.mapRenderShift = { x: shiftX, y: shiftY };
  return {
    nodes,
    guidelineEdges,
    strategyGuidelineEdges,
    initiativeEdges,
    strategicEdges: [],
    hasStrategicLinks: false,
    width,
    height,
    institution
  };
}

function layoutStrategicLinksMap(strategicData) {
  const emptyGraph = {
    nodes: [],
    guidelineEdges: [],
    strategyGuidelineEdges: [],
    initiativeEdges: [],
    strategicEdges: [],
    hasStrategicLinks: false,
    width: 1200,
    height: 820,
    institution: null
  };
  const activeInstitution = strategicData?.activeInstitution && typeof strategicData.activeInstitution === 'object'
    ? strategicData.activeInstitution
    : null;
  if (!activeInstitution) return emptyGraph;

  const toNumberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const nodes = [];
  const guidelineEdges = [];
  const strategyGuidelineEdges = [];
  const initiativeEdges = [];
  const strategicEdges = [];
  const sliceByKey = new Map();
  const linksByStrategyKey = strategicData?.linksByStrategyKey && typeof strategicData.linksByStrategyKey === 'object'
    ? strategicData.linksByStrategyKey
    : {};

  const buildInstitutionSlice = ({
    institution,
    strategyKey,
    linkedGuidelineIds = [],
    includeAllGuidelines = false,
    clusterRole = 'related',
    offsetX = 0,
    offsetY = 0
  }) => {
    if (!institution || typeof institution !== 'object') return null;
    const prefixBase = String(strategyKey || institution.slug || institution.id || 'strategy')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'strategy';
    const nodePrefix = `${prefixBase}-`;
    const institutionNodeId = `${nodePrefix}inst-${institution.id}`;
    const linkedGuidelineSet = new Set((Array.isArray(linkedGuidelineIds) ? linkedGuidelineIds : []).map((item) => String(item || '').trim()));
    const institutionX = (toNumberOrNull(institution.cycle?.mapX) ?? 140) + Number(offsetX || 0);
    const institutionY = (toNumberOrNull(institution.cycle?.mapY) ?? 48) + Number(offsetY || 0);

    nodes.push({
      id: institutionNodeId,
      kind: 'institution',
      entityId: institution.id,
      cycleId: institution.cycle?.id || null,
      x: institutionX,
      y: institutionY,
      w: 390,
      h: 220,
      institution,
      strategyKey,
      clusterRole,
      canSwitchPerspective: clusterRole === 'related'
    });

    const guidelines = Array.isArray(institution.guidelines) ? institution.guidelines : [];
    const visibleGuidelines = includeAllGuidelines
      ? guidelines
      : guidelines.filter((item) => linkedGuidelineSet.has(String(item?.id || '').trim()));
    const visibleGuidelineById = Object.fromEntries(visibleGuidelines.map((item) => [item.id, item]));
    const guidelineNodeIdByEntity = {};
    const childrenByParent = {};
    visibleGuidelines.forEach((guideline) => {
      const parentId = guideline.parentGuidelineId;
      if (!parentId || !visibleGuidelineById[parentId]) return;
      if (!childrenByParent[parentId]) childrenByParent[parentId] = [];
      childrenByParent[parentId].push(guideline);
    });

    const roots = visibleGuidelines.filter((guideline) => {
      const parentId = guideline.parentGuidelineId;
      return String(guideline.relationType || '').toLowerCase() !== 'child' || !parentId || !visibleGuidelineById[parentId];
    });
    const visited = new Set();
    let nextY = institutionY + 170;
    const placeNodeTree = (guideline, depth, parentNodeId) => {
      if (!guideline || visited.has(guideline.id)) return;
      visited.add(guideline.id);

      const nodeId = `${nodePrefix}guide-${guideline.id}`;
      const defaultX = institutionX + 46 + depth * 250;
      const defaultY = nextY;
      nextY += 100;
      const nodeX = toNumberOrNull(guideline.mapX) ?? defaultX;
      const nodeY = toNumberOrNull(guideline.mapY) ?? defaultY;
      const isParentGuideline = String(guideline.relationType || '').toLowerCase() === 'parent';
      const sizeScale = isParentGuideline ? PARENT_GUIDELINE_SCALE : 1;
      nodes.push({
        id: nodeId,
        kind: 'guideline',
        entityId: guideline.id,
        cycleId: institution.cycle?.id || null,
        x: nodeX,
        y: nodeY,
        w: Math.round(220 * sizeScale),
        h: Math.round(estimateGuidelineNodeHeight(guideline.totalScore) * sizeScale),
        institution,
        guideline,
        strategyKey,
        clusterRole,
        isStrategicLinked: linkedGuidelineSet.has(String(guideline.id || '').trim())
      });
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
    visibleGuidelines.forEach((guideline) => {
      if (!visited.has(guideline.id)) placeNodeTree(guideline, 0, null);
    });

    const minX = nodes
      .filter((item) => item.strategyKey === strategyKey)
      .reduce((acc, node) => Math.min(acc, node.x), institutionX);
    const minY = nodes
      .filter((item) => item.strategyKey === strategyKey)
      .reduce((acc, node) => Math.min(acc, node.y), institutionY);
    const maxX = nodes
      .filter((item) => item.strategyKey === strategyKey)
      .reduce((acc, node) => Math.max(acc, node.x + node.w), institutionX + 390);
    const maxY = nodes
      .filter((item) => item.strategyKey === strategyKey)
      .reduce((acc, node) => Math.max(acc, node.y + node.h), institutionY + 220);

    const slice = {
      strategyKey,
      institution,
      institutionNodeId,
      guidelineNodeIdByEntity,
      linkedGuidelineSet,
      clusterRole,
      minX,
      minY,
      maxX,
      maxY
    };
    sliceByKey.set(strategyKey, slice);
    return slice;
  };

  const activeStrategyKey = `${normalizeSlug(activeInstitution.slug)}|${normalizeSlug(activeInstitution.strategy?.slug || state.strategySlug)}`;
  const activeLinkedGuidelines = Array.isArray(linksByStrategyKey[activeStrategyKey]) ? linksByStrategyKey[activeStrategyKey] : [];
  const activeSlice = buildInstitutionSlice({
    institution: activeInstitution,
    strategyKey: activeStrategyKey,
    linkedGuidelineIds: activeLinkedGuidelines,
    includeAllGuidelines: true,
    clusterRole: 'active',
    offsetX: 0,
    offsetY: 0
  });
  if (!activeSlice) return emptyGraph;

  const relatedStrategies = Array.isArray(strategicData?.relatedStrategies) ? strategicData.relatedStrategies : [];
  let relatedOffsetX = 880;
  relatedStrategies.forEach((item) => {
    const strategyKey = String(item?.key || '').trim();
    const institution = item?.institution;
    if (!strategyKey || !institution) return;
    const targetGuidelineIds = Array.isArray(item.targetGuidelineIds) ? item.targetGuidelineIds : [];
    buildInstitutionSlice({
      institution,
      strategyKey,
      linkedGuidelineIds: targetGuidelineIds,
      includeAllGuidelines: false,
      clusterRole: 'related',
      offsetX: relatedOffsetX,
      offsetY: 0
    });
    relatedOffsetX += 880;
  });

  relatedStrategies.forEach((item) => {
    const strategyKey = String(item?.key || '').trim();
    const relatedSlice = sliceByKey.get(strategyKey);
    if (!relatedSlice) return;
    const links = Array.isArray(item.links) ? item.links : [];
    links.forEach((link) => {
      const sourceId = String(link?.sourceGuidelineId || '').trim();
      const targetId = String(link?.targetGuidelineId || '').trim();
      if (!sourceId || !targetId) return;
      const fromNodeId = activeSlice.guidelineNodeIdByEntity[sourceId];
      const toNodeId = relatedSlice.guidelineNodeIdByEntity[targetId];
      if (!fromNodeId || !toNodeId) return;
      strategicEdges.push({
        from: fromNodeId,
        to: toNodeId,
        type: 'strategic-cross',
        layer: 'strategic-links',
        lineSide: 'auto'
      });
    });
  });

  const minLeft = nodes.reduce((acc, node) => Math.min(acc, node.x), Infinity);
  const minTop = nodes.reduce((acc, node) => Math.min(acc, node.y), Infinity);
  const maxRight = nodes.reduce((acc, node) => Math.max(acc, node.x + node.w), -Infinity);
  const maxBottom = nodes.reduce((acc, node) => Math.max(acc, node.y + node.h), -Infinity);
  const shiftX = Number.isFinite(minLeft) && minLeft < MAP_WORLD_PAD ? MAP_WORLD_PAD - minLeft : 0;
  const shiftY = Number.isFinite(minTop) && minTop < MAP_WORLD_PAD ? MAP_WORLD_PAD - minTop : 0;
  nodes.forEach((node) => {
    node.x += shiftX;
    node.y += shiftY;
  });

  const rawWidth = Number.isFinite(maxRight) && Number.isFinite(minLeft)
    ? (maxRight - minLeft) + MAP_WORLD_PAD * 2
    : 1800;
  const rawHeight = Number.isFinite(maxBottom) && Number.isFinite(minTop)
    ? (maxBottom - minTop) + MAP_WORLD_PAD * 2
    : 920;
  const width = Math.max(1800, rawWidth);
  const height = Math.max(920, rawHeight);
  state.mapRenderShift = { x: shiftX, y: shiftY };
  return {
    nodes,
    guidelineEdges,
    strategyGuidelineEdges,
    initiativeEdges,
    strategicEdges,
    hasStrategicLinks: strategicEdges.length > 0,
    width,
    height,
    institution: activeInstitution
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

function renderMapView() {
  document.body.classList.remove('map-comment-modal-open');

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

  const primaryGraph = layoutStrategyMap();
  if (!primaryGraph.institution) {
    elements.stepView.innerHTML = `
      <div class="card">
        <strong>Pasirinkite instituciją</strong>
        <p class="prompt" style="margin: 8px 0 0;">Žemėlapyje rodoma tik viršuje pasirinktos institucijos strategija.</p>
      </div>
    `;
    return;
  }

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

  let graph = primaryGraph;
  if (activeLayer === 'strategic-links') {
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
      } else {
        elements.stepView.innerHTML = `<div class="card"><strong>${escapeHtml(mapLang('Kraunami strateginiai rysiai...', 'Loading strategic links...'))}</strong></div>`;
      }
      return;
    }

    graph = layoutStrategicLinksMap(state.mapStrategicLinksData);
  }

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
    return `<path class="strategy-map-edge edge-${escapeHtml(edge.type)}${parentRootClass} edge-guideline-layer" data-layer="guidelines" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="${escapeHtml(lineSide)}" d="${edgePath(fromNode, toNode, lineSide)}"></path>`;
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
    return `<path class="strategy-map-edge edge-strategic-cross edge-strategic-layer" data-layer="strategic-links" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-line-side="auto" d="${edgePath(fromNode, toNode, 'auto')}"></path>`;
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
        relatedInstitutionInStrategicLayer ? 'map-strategy-related' : '',
        activeLayer === 'strategic-links' && node.clusterRole === 'active' ? 'map-strategy-active' : '',
        activeLayer === 'strategic-links' && node.canSwitchPerspective ? 'map-strategy-switchable' : ''
      ].filter(Boolean).join(' ');
      const perspectiveAttrs = activeLayer === 'strategic-links' && node.canSwitchPerspective
        ? `data-action="open-strategy-perspective" data-map-interactive="true" data-target-institution="${escapeHtml(node.institution.slug || '')}" data-target-strategy="${escapeHtml(node.institution.strategy?.slug || '')}" role="button" tabindex="0" aria-label="${escapeHtml(switchPerspectiveLabel)}" title="${escapeHtml(switchPerspectiveLabel)}"`
        : '';
      const strategicNodeTag = activeLayer === 'strategic-links'
        ? `<span class="tag">${escapeHtml(node.clusterRole === 'related' ? mapLang('Susieta strategija', 'Linked strategy') : mapLang('Aktyvi strategija', 'Active strategy'))}</span>`
        : `<span class="tag">${escapeHtml(cycleState.toUpperCase())}</span>`;
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
                 style="left:${node.x}px;top:${node.y}px;width:${node.w}px;height:${node.h}px;">
          <strong>${escapeHtml(node.institution.name)}</strong>
          <small class="institution-subtitle">${escapeHtml(strategyTitle)}</small>
          ${strategicNodeTag}
          <small class="institution-cycle-label">${escapeHtml(mapLang('Strategijos ciklo busena', 'Strategy cycle status'))}</small>
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
        ? `${node.clusterRole === 'related' ? ' map-strategy-related' : ' map-strategy-active'} ${node.isStrategicLinked ? 'map-strategic-linked' : 'map-strategic-unlinked'}`
        : '';
      const guidelineOwnerLabel = activeLayer === 'strategic-links'
        ? `${String(node.institution.name || node.institution.slug || '').trim()} / ${String(node.institution.strategy?.title || '-').trim()}`
        : `${String(node.institution.slug || '').trim()} - ${relationText}`;

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
            ${strategicEdgeMarkup}
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
  const mapCommentItems = new Map();
  graph.nodes.forEach((node) => {
    if (node.kind === 'guideline' && node.guideline?.id) {
      mapCommentItems.set(`guideline:${node.guideline.id}`, {
        kind: 'guideline',
        id: node.guideline.id,
        title: node.guideline.title || 'Gairė',
        description: node.guideline.description || 'Aprašymas nepateiktas.',
        comments: Array.isArray(node.guideline.comments) ? node.guideline.comments : []
      });
    }
    if (node.kind === 'initiative' && node.initiative?.id) {
      mapCommentItems.set(`initiative:${node.initiative.id}`, {
        kind: 'initiative',
        id: node.initiative.id,
        title: node.initiative.title || 'Iniciatyva',
        description: node.initiative.description || 'Aprašymas nepateiktas.',
        comments: Array.isArray(node.initiative.comments) ? node.initiative.comments : []
      });
    }
  });

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
  layerStrategicButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (state.mapLayer === 'strategic-links') return;
      state.mapLayer = 'strategic-links';
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


