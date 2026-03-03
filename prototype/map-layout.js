// Strategy map layout and graph-building functions extracted from app-map.js
// This file must be loaded before app-map.js.

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

function longestWordLength(values) {
  let maxLength = 0;
  (Array.isArray(values) ? values : [values]).forEach((value) => {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    words.forEach((word) => {
      if (word.length > maxLength) maxLength = word.length;
    });
  });
  return maxLength;
}

function estimateCardWidthFromLongestWord({
  textValues,
  minWidth,
  fontPx,
  reservePx
}) {
  const longest = longestWordLength(textValues);
  if (!longest) return minWidth;
  const longestWordWidth = Math.ceil(longest * Number(fontPx || 28) * 0.62);
  return Math.max(Number(minWidth || 0), longestWordWidth + Number(reservePx || 0));
}

function estimateInstitutionNodeWidth(institution) {
  return estimateCardWidthFromLongestWord({
    textValues: [
      institution?.name,
      institution?.strategy?.title
    ],
    minWidth: MAP_INSTITUTION_BASE_WIDTH,
    fontPx: 50,
    reservePx: 96
  });
}

function estimateGuidelineNodeWidth(guideline, institution, sizeScale) {
  const baseWidth = Math.round(MAP_GUIDELINE_BASE_WIDTH * Number(sizeScale || 1));
  return estimateCardWidthFromLongestWord({
    textValues: [
      guideline?.title,
      institution?.name,
      institution?.strategy?.title,
      institution?.slug
    ],
    minWidth: baseWidth,
    fontPx: 28,
    reservePx: 196
  });
}

function estimateInitiativeNodeWidth(initiative, institution) {
  return estimateCardWidthFromLongestWord({
    textValues: [
      initiative?.title,
      institution?.name,
      institution?.strategy?.title
    ],
    minWidth: MAP_INITIATIVE_BASE_WIDTH,
    fontPx: 28,
    reservePx: 196
  });
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
    w: estimateInstitutionNodeWidth(institution),
    h: MAP_INSTITUTION_BASE_MIN_HEIGHT,
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
      const defaultX = institutionX + 46 + depth * 360;
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
        w: estimateGuidelineNodeWidth(guideline, institution, sizeScale),
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
        w: estimateInitiativeNodeWidth(initiative, institution),
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
      w: estimateInstitutionNodeWidth(institution),
      h: MAP_INSTITUTION_BASE_MIN_HEIGHT,
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
      const defaultX = institutionX + 46 + depth * 360;
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
        w: estimateGuidelineNodeWidth(guideline, institution, sizeScale),
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
      .reduce((acc, node) => Math.max(acc, node.x + node.w), institutionX + MAP_INSTITUTION_BASE_WIDTH);
    const maxY = nodes
      .filter((item) => item.strategyKey === strategyKey)
      .reduce((acc, node) => Math.max(acc, node.y + node.h), institutionY + MAP_INSTITUTION_BASE_MIN_HEIGHT);

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

  const computeSliceBounds = (strategyKey) => {
    const sliceNodes = nodes.filter((node) => node.strategyKey === strategyKey);
    if (!sliceNodes.length) return null;
    return {
      minX: sliceNodes.reduce((acc, node) => Math.min(acc, node.x), Infinity),
      minY: sliceNodes.reduce((acc, node) => Math.min(acc, node.y), Infinity),
      maxX: sliceNodes.reduce((acc, node) => Math.max(acc, node.x + node.w), -Infinity),
      maxY: sliceNodes.reduce((acc, node) => Math.max(acc, node.y + node.h), -Infinity)
    };
  };

  const moveSlice = (strategyKey, dx, dy) => {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    nodes.forEach((node) => {
      if (node.strategyKey !== strategyKey) return;
      node.x += dx;
      node.y += dy;
    });
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
      offsetX: 0,
      offsetY: 0
    });
  });

  const orderedStrategyKeys = [
    activeStrategyKey,
    ...relatedStrategies.map((item) => String(item?.key || '').trim()).filter((key) => key && key !== activeStrategyKey)
  ].filter((key, index, arr) => arr.indexOf(key) === index && sliceByKey.has(key));
  const strategyToneByKey = Object.create(null);
  orderedStrategyKeys.forEach((strategyKey, index) => {
    strategyToneByKey[strategyKey] = strategicToneForIndex(index);
  });

  const horizontalGap = 260;
  const baseLeft = 140;
  const baseTop = 48;
  let cursorX = baseLeft;
  orderedStrategyKeys.forEach((strategyKey) => {
    const bounds = computeSliceBounds(strategyKey);
    if (!bounds) return;
    const dx = cursorX - bounds.minX;
    const dy = baseTop - bounds.minY;
    moveSlice(strategyKey, dx, dy);
    const shiftedBounds = computeSliceBounds(strategyKey);
    if (!shiftedBounds) return;
    cursorX = shiftedBounds.maxX + horizontalGap;
  });

  nodes.forEach((node) => {
    if (!node?.strategyKey) return;
    const tone = strategyToneByKey[node.strategyKey];
    if (!tone) return;
    node.strategyTone = tone;
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
        lineSide: 'auto',
        strategyKey,
        strategyTone: strategyToneByKey[strategyKey] || null
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


