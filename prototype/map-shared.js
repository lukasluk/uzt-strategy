// Shared map constants and helper functions.
// This file must load before app-map.js.

const PARENT_GUIDELINE_SCALE = 1.2;
const MAP_WORLD_PAD = 320;
const MAP_NODE_MIN_RENDER_X = -3000;
const MAP_NODE_MIN_RENDER_Y = -3000;
const MAP_GUIDELINE_BASE_WIDTH = 320;
const MAP_INITIATIVE_BASE_WIDTH = 320;
const MAP_INSTITUTION_BASE_WIDTH = 390;
const MAP_INSTITUTION_BASE_MIN_HEIGHT = 220;

const STRATEGIC_LAYER_PALETTE = Object.freeze([
  { pastel: '#eef7ff', border: '#5f90ca', ink: '#233b57', edge: '#c97769' },
  { pastel: '#fff0f0', border: '#d25f5f', ink: '#5e2323', edge: '#c97769' },
  { pastel: '#eefbf4', border: '#63ab87', ink: '#1f4a35', edge: '#c97769' },
  { pastel: '#fff7eb', border: '#c18a4f', ink: '#5a3d1f', edge: '#c97769' },
  { pastel: '#f4f0ff', border: '#8668c2', ink: '#3b2f59', edge: '#c97769' },
  { pastel: '#edf9fb', border: '#4d9cab', ink: '#1f4650', edge: '#c97769' }
]);

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

function strategicToneForIndex(index) {
  const palette = Array.isArray(STRATEGIC_LAYER_PALETTE) && STRATEGIC_LAYER_PALETTE.length
    ? STRATEGIC_LAYER_PALETTE
    : [{ pastel: '#eef7ff', border: '#5f90ca', ink: '#233b57', edge: '#c97769' }];
  const safeIndex = Math.max(0, Number(index || 0));
  return palette[safeIndex % palette.length];
}
