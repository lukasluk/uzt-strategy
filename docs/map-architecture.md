# Map Architecture (Refactor Baseline)

This document describes current map frontend boundaries after the first refactor pass.

## Script load order

1. `i18n.js`
2. `map-shared.js`
3. `map-geometry.js`
4. `map-layout.js`
5. `map-interactions.js`
6. `map-render.js`
7. `app-map.js`
8. `app.js`

`map-shared.js`, `map-geometry.js`, `map-layout.js`, `map-interactions.js`, and `map-render.js` must load before `app-map.js`.

## File responsibilities

- `prototype/map-shared.js`
  - Shared map constants (node widths, map padding, strategic palette)
  - Shared helper functions used by map layer code:
    - `mapNormalizeStrategyLinks`
    - `mapStrategyLinkLabel`
    - `mapLang`
    - `strategicToneForIndex`

- `prototype/app-map.js`
  - Map rendering entrypoint (`renderMapView`)
  - View composition and layer-specific markup
  - Runtime dependency guard for map module load failures (`ensureMapRuntimeDependencies`)
  - Render orchestration helpers for:
    - map state cards (loading/error/empty/institution prompt)
    - active-layer normalization
    - strategic-links data readiness flow
    - layer-button binding and map comment item mapping

- `prototype/map-layout.js`
  - Map graph construction and sizing:
    - `estimateGuidelineNodeHeight`
    - `estimateInitiativeNodeHeight`
    - `layoutStrategyMap`
    - `layoutStrategicLinksMap`

- `prototype/map-render.js`
  - Map render markup builders:
    - map header + toolbar markup
    - edge SVG path markup by layer
    - map shell + modal markup wrapper
    - node card markup builders (institution/guideline/initiative)
    - map comment modal item mapping + event wiring

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
2. Continue extraction from `app-map.js` into `map-render.js`:
   - strategy-link/perspective click handlers
   - fullscreen/reset button binding helpers
3. Add a small map bootstrap validator that asserts required global helpers are present at runtime.
4. Consolidate repeated map typography rules in `styles.css` via CSS custom properties.
