// Map layer and graph resolution helpers extracted from app-map.js.
// This file must load before app-map.js.

function resolveActiveMapLayer(primaryGraph) {
  const hasInitiativeNodes = primaryGraph.nodes.some((node) => node.kind === 'initiative');
  if (state.mapLayer !== 'guidelines' && state.mapLayer !== 'initiatives' && state.mapLayer !== 'plan' && state.mapLayer !== 'strategic-links') {
    state.mapLayer = 'guidelines';
  }
  if (state.mapLayer === 'initiatives' && !hasInitiativeNodes) {
    state.mapLayer = 'guidelines';
  }
  const activeLayer = state.mapLayer;
  if (activeLayer !== 'initiatives') {
    resetMapInitiativeFocusState();
  }
  return { activeLayer, hasInitiativeNodes };
}

function resolveMapGraphForLayer(primaryGraph, activeLayer) {
  if (activeLayer !== 'strategic-links') return primaryGraph;

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
    renderStrategicLinksPendingState();
    return null;
  }

  return layoutStrategicLinksMap(state.mapStrategicLinksData);
}
