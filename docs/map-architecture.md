# Map Architecture (Refactor Baseline)

This document describes current map frontend boundaries after the first refactor pass.

## Script load order

1. `i18n.js`
2. `map-shared.js`
3. `app-map.js`
4. `app.js`

`map-shared.js` must load before `app-map.js` because it defines shared constants and helpers used by map rendering/layout code.

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
  - Edge path geometry and transform helpers
  - User interactions (drag/pan/zoom/focus)

- `prototype/app.js`
  - Application state container (`state`)
  - Data loading and API orchestration
  - View routing and top-level UI wiring

## Refactor next steps

1. Extract edge geometry/path helpers from `app-map.js` into `map-geometry.js`.
2. Extract map interaction logic into `map-interactions.js`.
3. Keep `app-map.js` as a coordinator file that composes imported globals.
4. Consolidate repeated map typography rules in `styles.css` via CSS custom properties.
