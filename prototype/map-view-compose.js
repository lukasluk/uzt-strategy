// Map view shell payload assembly helpers extracted from app-map.js.
// This file must load before app-map.js.

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
  const planButtonMarkup = `
    <div class="map-plan-dock">
      <button type="button" class="btn ${activeLayer === 'plan' ? 'btn-primary' : 'btn-ghost'}" data-map-layer-btn="plan">
        ${escapeHtml(mapLang('Planas', 'Plan'))}
      </button>
    </div>
  `;
  const strategicNoLinksMarkup = activeLayer === 'strategic-links' && !graph.hasStrategicLinks
    ? '<div class="map-strategic-empty-note">No strategic links</div>'
    : '';
  const mapWatermarkClass = state.embedMapMode ? 'map-fullscreen-watermark embed-visible' : 'map-fullscreen-watermark';
  const nodeById = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  const guidelineEdgeMarkup = buildGuidelineEdgeMarkup({ graph, nodeById, activeLayer });
  const strategyGuidelineEdgeMarkup = buildStrategyGuidelineEdgeMarkup({ graph, nodeById });
  const strategicEdgeMarkup = buildStrategicEdgeMarkup({ graph, nodeById });
  const initiativeEdgeMarkup = buildInitiativeEdgeMarkup({ graph, nodeById });
  const nodeMarkup = buildNodeMarkup({ graph, activeLayer, editable });

  return {
    mapHeader,
    activeLayer,
    editable,
    mapToolbar,
    planButtonMarkup,
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
