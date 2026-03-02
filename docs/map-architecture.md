# Map Architecture (Refactor Baseline)

This document describes current map frontend boundaries after the first refactor pass.

## Script load order

1. `i18n.js`
2. `map-shared.js`
3. `map-geometry.js`
4. `map-interactions.js`
5. `app-map.js`
6. `app.js`

`map-shared.js`, `map-geometry.js`, and `map-interactions.js` must load before `app-map.js`.

## File responsibilities

- `prototype/map-shared.js`
  - Shared map constants (node widths, map padding, strategic palette)
  - Shared helper functions used by map layer code:
    - `mapNormalizeStrategyLinks`
    - `mapStrategyLinkLabel`
    - `mapLang`
    - `strategicToneForIndex`

- `prototype/app-map.js`
  - Map layout calculation (`layoutStrategyMap`, `layoutStrategicLinksMap`)
  - Map rendering (`renderMapView`)
  - View composition and layer-specific markup

- `prototype/app.js`
  - Application state container (`state`)
  - Data loading and API orchestration
  - View routing and top-level UI wiring

- `prototype/map-geometry.js`
  - Edge path geometry (`edgePath` and anchors/control points)
  - Viewport transforms (`applyMapTransform`, `fitMapToCurrentNodes`)
  - Edge refresh helpers (`syncMapNodeBounds`, `refreshMapEdges`)

- `prototype/map-interactions.js`
  - Initiative focus state management
  - Map drag/pan/zoom bindings
  - Position persistence for map nodes

## Refactor next steps

1. Add minimal integration smoke checks for map-layer switch and node drag persistence.
2. Extract layout functions (`layoutStrategyMap`, `layoutStrategicLinksMap`) into `map-layout.js`.
3. Keep `app-map.js` as a coordinator/composition layer only.
4. Consolidate repeated map typography rules in `styles.css` via CSS custom properties.
