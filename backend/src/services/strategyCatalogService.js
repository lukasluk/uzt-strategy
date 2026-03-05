const EU_COUNTRY_NAMES = {
  AT: 'Austria',
  BE: 'Belgium',
  BG: 'Bulgaria',
  HR: 'Croatia',
  CY: 'Cyprus',
  CZ: 'Czechia',
  DK: 'Denmark',
  EE: 'Estonia',
  FI: 'Finland',
  FR: 'France',
  DE: 'Germany',
  GR: 'Greece',
  HU: 'Hungary',
  IE: 'Ireland',
  IT: 'Italy',
  LV: 'Latvia',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  MT: 'Malta',
  NL: 'Netherlands',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  SK: 'Slovakia',
  SI: 'Slovenia',
  ES: 'Spain',
  SE: 'Sweden'
};

const GOVERNMENT_SECTORS = [
  'All Government',
  'Gov-Digital',
  'Gov-Health',
  'Gov-Education',
  'Gov-Social',
  'Gov-Finance',
  'Gov-Justice',
  'Gov-Environment',
  'Gov-Transport',
  'Gov-PublicSafety'
];
const VALID_SECTORS = new Set([
  ...GOVERNMENT_SECTORS,
  'Municipality',
  'NGO',
  'University',
  'Private'
]);
let activeRefreshPromise = null;

function trimText(value, maxLength = 400) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.slice(0, maxLength).trim();
}

function stripCodeFence(raw) {
  const text = String(raw || '').trim();
  if (!text.startsWith('```')) return text;
  return text
    .replace(/^```[a-zA-Z0-9_-]*\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractOutputText(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  if (Array.isArray(payload.output)) {
    const chunks = [];
    payload.output.forEach((message) => {
      const content = Array.isArray(message?.content) ? message.content : [];
      content.forEach((part) => {
        if (typeof part?.text === 'string' && part.text.trim()) {
          chunks.push(part.text.trim());
        } else if (typeof part?.output_text === 'string' && part.output_text.trim()) {
          chunks.push(part.output_text.trim());
        }
      });
    });
    if (chunks.length) return chunks.join('\n').trim();
  }
  const legacy = payload?.choices?.[0]?.message?.content;
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim();
  return '';
}

function normalizeCountryCode(value) {
  const token = String(value || '').trim().toUpperCase();
  if (!token) return '';
  if (token.length === 2 && /^[A-Z]{2}$/.test(token)) return token;
  return '';
}

function countryNameFromCode(countryCode) {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return '';
  return EU_COUNTRY_NAMES[normalized] || normalized;
}

function normalizeSector(value, fallback) {
  const raw = trimText(value, 40).toLowerCase();
  if (raw === 'government' || raw === 'public' || raw === 'state') return 'All Government';
  if (raw === 'all government') return 'All Government';
  if (raw === 'gov-digital' || raw === 'gov digital') return 'Gov-Digital';
  if (raw === 'gov-health' || raw === 'gov health') return 'Gov-Health';
  if (raw === 'gov-education' || raw === 'gov education') return 'Gov-Education';
  if (raw === 'gov-social' || raw === 'gov social') return 'Gov-Social';
  if (raw === 'gov-finance' || raw === 'gov finance') return 'Gov-Finance';
  if (raw === 'gov-justice' || raw === 'gov justice') return 'Gov-Justice';
  if (raw === 'gov-environment' || raw === 'gov environment') return 'Gov-Environment';
  if (raw === 'gov-transport' || raw === 'gov transport') return 'Gov-Transport';
  if (raw === 'gov-publicsafety' || raw === 'gov public safety' || raw === 'gov-public-safety') return 'Gov-PublicSafety';
  if (raw === 'municipality' || raw === 'local government' || raw === 'city') return 'Municipality';
  if (raw === 'ngo' || raw === 'non-profit' || raw === 'nonprofit') return 'NGO';
  if (raw === 'university' || raw === 'education') return 'University';
  if (raw === 'private' || raw === 'company' || raw === 'business') return 'Private';
  if (VALID_SECTORS.has(trimText(value, 40))) return trimText(value, 40);
  return fallback;
}

function normalizeTheme(value, fallback) {
  const raw = trimText(value, 80)
    .replace(/[^a-zA-Z0-9/&\-\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!raw) return fallback;
  return raw.slice(0, 60);
}

function normalizeRegion(value, countryCode, fallback) {
  const token = trimText(value, 80);
  if (token) {
    if (/^EU-[A-Za-z][A-Za-z\s-]*$/.test(token)) return token;
    const normalizedToken = token.replace(/\s+/g, ' ').trim();
    if (/^[A-Za-z][A-Za-z\s-]*$/.test(normalizedToken)) {
      return normalizedToken.slice(0, 60);
    }
  }
  const code = normalizeCountryCode(countryCode);
  if (code && EU_COUNTRY_NAMES[code]) return `EU-${EU_COUNTRY_NAMES[code]}`;
  if (code) return code;
  return fallback;
}

function inferGovernmentSubsector(rawText) {
  const text = String(rawText || '').toLowerCase();
  if (!text) return 'All Government';
  if (/\b(health|hospital|clinic|medical|care)\b/.test(text)) return 'Gov-Health';
  if (/\b(digital|it|technology|data|cyber|platform)\b/.test(text)) return 'Gov-Digital';
  if (/\b(education|school|learning|student|curriculum)\b/.test(text)) return 'Gov-Education';
  if (/\b(social|welfare|employment|labor|benefit)\b/.test(text)) return 'Gov-Social';
  if (/\b(finance|budget|treasury|tax|fiscal)\b/.test(text)) return 'Gov-Finance';
  if (/\b(justice|court|legal|law|prosecution)\b/.test(text)) return 'Gov-Justice';
  if (/\b(environment|climate|energy|sustainab|green)\b/.test(text)) return 'Gov-Environment';
  if (/\b(transport|mobility|traffic|rail|road)\b/.test(text)) return 'Gov-Transport';
  if (/\b(police|fire|rescue|emergency|public safety|security)\b/.test(text)) return 'Gov-PublicSafety';
  return 'All Government';
}

function inferSectorFromText(rawText) {
  const text = String(rawText || '').toLowerCase();
  if (!text) return 'All Government';
  if (/\b(city|municipality|municipal|local council|local authority)\b/.test(text)) return 'Municipality';
  if (/\b(university|college|faculty|academic|research institute)\b/.test(text)) return 'University';
  if (/\b(ngo|non-profit|nonprofit|association|foundation|charity)\b/.test(text)) return 'NGO';
  if (/\b(ltd|uab|ab|inc|corp|company|private|enterprise|group)\b/.test(text)) return 'Private';
  return inferGovernmentSubsector(text);
}

function inferThemeFromText(rawText) {
  const text = String(rawText || '').toLowerCase();
  if (!text) return 'Digital Transformation';
  if (/\b(cyber|security|resilience)\b/.test(text)) return 'Cybersecurity';
  if (/\b(ai|artificial intelligence|machine learning)\b/.test(text)) return 'AI Adoption';
  if (/\b(data|governance|analytics|interoperability)\b/.test(text)) return 'Data Governance';
  if (/\b(skill|education|talent|training|competenc)\b/.test(text)) return 'Digital Skills';
  if (/\b(service|citizen|customer|user experience|portal)\b/.test(text)) return 'Public Services';
  if (/\b(health|hospital|care)\b/.test(text)) return 'Digital Health';
  if (/\b(climate|green|sustainab)\b/.test(text)) return 'Green Transition';
  return 'Digital Transformation';
}

function buildFallbackStrategyCatalogClassification(strategy) {
  const institutionName = trimText(strategy?.institution_name || strategy?.institutionName, 200);
  const strategyTitle = trimText(strategy?.strategy_title || strategy?.title, 200);
  const strategyDescription = trimText(strategy?.strategy_description || strategy?.description, 300);
  const cycleTitle = trimText(strategy?.latest_cycle_title || strategy?.cycleTitle, 160);
  const countryCode = normalizeCountryCode(strategy?.country_code || strategy?.countryCode);
  const combinedText = [institutionName, strategyTitle, strategyDescription, cycleTitle]
    .filter(Boolean)
    .join(' | ');

  const sector = inferSectorFromText(combinedText);
  const theme = inferThemeFromText(combinedText);
  const region = normalizeRegion('', countryCode, 'Global');

  return {
    sector,
    theme,
    region,
    confidence: 0.35,
    model: 'heuristic-fallback',
    raw: {
      source: 'heuristic-fallback',
      countryCode,
      countryName: countryNameFromCode(countryCode)
    }
  };
}

function buildAiPromptRows(strategies) {
  const rows = (Array.isArray(strategies) ? strategies : []).map((item) => {
    return {
      strategyId: item.strategy_id,
      strategyTitle: trimText(item.strategy_title, 180),
      strategyDescription: trimText(item.strategy_description, 280),
      institutionName: trimText(item.institution_name, 140),
      countryCode: normalizeCountryCode(item.country_code),
      cycleTitle: trimText(item.latest_cycle_title, 140)
    };
  });
  return rows;
}

function parseAiClassifications(text) {
  let parsed;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    return {};
  }
  const list = Array.isArray(parsed?.classifications) ? parsed.classifications : [];
  const output = {};
  list.forEach((item) => {
    const strategyId = trimText(item?.strategyId, 80);
    if (!strategyId) return;
    output[strategyId] = {
      sector: trimText(item?.sector, 40),
      theme: trimText(item?.theme, 80),
      region: trimText(item?.region, 80),
      confidence: Number.isFinite(Number(item?.confidence)) ? Number(item.confidence) : null,
      raw: item
    };
  });
  return output;
}

async function requestAiClassifications({
  strategies,
  apiKey,
  model,
  baseUrl,
  timeoutMs = 30000
}) {
  const endpoint = `${String(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/responses`;
  const inputRows = buildAiPromptRows(strategies);
  if (!inputRows.length) return {};

  const systemPrompt = [
    'You classify public strategy records into short catalog tags.',
    'Return JSON only. No markdown. No additional commentary.',
    'Output schema:',
    '{ "classifications": [',
    '  {',
    '    "strategyId": "uuid from input",',
    '    "sector": "All Government|Gov-Digital|Gov-Health|Gov-Education|Gov-Social|Gov-Finance|Gov-Justice|Gov-Environment|Gov-Transport|Gov-PublicSafety|Municipality|NGO|University|Private",',
    '    "theme": "2-4 words in English",',
    '    "region": "EU-CountryName for EU member countries, otherwise CountryName",',
    '    "confidence": 0.0',
    '  }',
    '] }',
    'Keep sector strictly one of the allowed values.',
    'Keep theme concise and useful for discovery pages.',
    'All output values must be English.'
  ].join('\n');

  const userPrompt = [
    'Classify each strategy row:',
    JSON.stringify(inputRows)
  ].join('\n\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(12000, Number(timeoutMs || 0)));
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_output_tokens: 1400,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt }]
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }]
          }
        ]
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = trimText(payload?.error?.message, 240) || `HTTP ${response.status}`;
    throw new Error(`strategy catalog ai classification failed: ${message}`);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) return {};
  return {
    classifications: parseAiClassifications(outputText),
    model: trimText(payload?.model || model, 120) || null
  };
}

function normalizeClassifiedRecord(strategy, candidate, modelHint) {
  const fallback = buildFallbackStrategyCatalogClassification(strategy);
  const sector = normalizeSector(candidate?.sector, fallback.sector);
  const theme = normalizeTheme(candidate?.theme, fallback.theme);
  const region = normalizeRegion(candidate?.region, strategy.country_code, fallback.region);
  const confidence = Number.isFinite(Number(candidate?.confidence))
    ? Math.max(0, Math.min(1, Number(candidate.confidence)))
    : fallback.confidence;
  const model = trimText(modelHint || candidate?.model, 120) || fallback.model;

  return {
    sector,
    theme,
    region,
    confidence,
    model,
    raw: candidate?.raw || fallback.raw
  };
}

async function runRefreshStrategyCatalogClassifications({
  query,
  maxStrategies = 24,
  force = false,
  requireAi = false
}) {
  let staleRes;
  try {
    const refreshFilter = force
      ? ''
      : `
         and (
           cls.strategy_id is null
           or cls.classified_at < (now() - interval '7 days')
         )`;
    staleRes = await query(
      `select s.id as strategy_id,
              s.title as strategy_title,
              s.description as strategy_description,
              s.created_at as strategy_created_at,
              i.name as institution_name,
              i.country_code,
              latest_cycle.title as latest_cycle_title,
              cls.classified_at
       from institution_strategies s
       join institutions i on i.id = s.institution_id
       left join lateral (
         select sc.title
         from strategy_cycles sc
         where sc.strategy_id = s.id
         order by sc.created_at desc
         limit 1
       ) latest_cycle on true
       left join strategy_catalog_classifications cls on cls.strategy_id = s.id
       where s.status = 'active'
         and i.status = 'active'
         ${refreshFilter}
       order by cls.classified_at asc nulls first, s.created_at desc
       limit $1`,
      [Math.max(1, Math.min(300, Number(maxStrategies) || 24))]
    );
  } catch (error) {
    if (String(error?.code || '') === '42P01') {
      throw new Error('classification storage not initialized');
    }
    throw error;
  }

  const staleRows = Array.isArray(staleRes?.rows) ? staleRes.rows : [];
  if (!staleRows.length) {
    return { processed: 0, updated: 0, mode: 'skip' };
  }

  const apiKey = trimText(
    process.env.STRATEGY_LIBRARY_API_KEY || process.env.AI_STRATEGY_API_KEY || process.env.OPENAI_API_KEY,
    240
  );
  const model = trimText(
    process.env.STRATEGY_LIBRARY_MODEL || process.env.AI_STRATEGY_MODEL || process.env.OPENAI_MODEL,
    120
  ) || 'gpt-4.1-mini';
  const baseUrl = trimText(
    process.env.STRATEGY_LIBRARY_API_BASE_URL || process.env.AI_STRATEGY_API_BASE_URL || 'https://api.openai.com/v1',
    200
  );
  const timeoutMs = Number(process.env.STRATEGY_LIBRARY_AI_TIMEOUT_MS || process.env.AI_STRATEGY_TIMEOUT_MS || 30000);

  let aiByStrategyId = {};
  let aiModel = null;
  let mode = 'fallback';
  if (requireAi && !apiKey) {
    throw new Error('ai api key not configured');
  }

  if (apiKey) {
    try {
      const aiResult = await requestAiClassifications({
        strategies: staleRows,
        apiKey,
        model,
        baseUrl,
        timeoutMs
      });
      aiByStrategyId = aiResult?.classifications || {};
      aiModel = aiResult?.model || model;
      mode = 'ai';
    } catch (error) {
      if (requireAi) {
        throw error;
      }
      console.warn('[strategy-catalog] AI refresh failed, using fallback classification', error?.message || error);
    }
  }

  let updated = 0;
  for (const row of staleRows) {
    const aiCandidate = aiByStrategyId[row.strategy_id] || null;
    const normalized = normalizeClassifiedRecord(row, aiCandidate, aiModel);
    await query(
      `insert into strategy_catalog_classifications (
         strategy_id,
         sector,
         theme,
         region,
         confidence,
         model,
         raw_json,
         classified_at
       )
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
       on conflict (strategy_id) do update set
         sector = excluded.sector,
         theme = excluded.theme,
         region = excluded.region,
         confidence = excluded.confidence,
         model = excluded.model,
         raw_json = excluded.raw_json,
         classified_at = excluded.classified_at`,
      [
        row.strategy_id,
        normalized.sector,
        normalized.theme,
        normalized.region,
        normalized.confidence,
        normalized.model,
        JSON.stringify(normalized.raw || {})
      ]
    );
    updated += 1;
  }

  return { processed: staleRows.length, updated, mode };
}

async function refreshStrategyCatalogClassifications({
  query,
  maxStrategies = 24,
  force = false,
  requireAi = false
}) {
  if (activeRefreshPromise) return activeRefreshPromise;
  activeRefreshPromise = runRefreshStrategyCatalogClassifications({
    query,
    maxStrategies,
    force,
    requireAi
  })
    .finally(() => {
      activeRefreshPromise = null;
    });
  return activeRefreshPromise;
}

async function loadStrategyCatalogClassificationSummary(query) {
  try {
    const [totalsRes, sectorRes] = await Promise.all([
      query(
        `select count(*)::int as total_classified,
                max(classified_at) as last_classified_at
         from strategy_catalog_classifications`
      ),
      query(
        `select sector, count(*)::int as total
         from strategy_catalog_classifications
         group by sector
         order by count(*) desc, sector asc`
      )
    ]);

    const totals = totalsRes.rows[0] || {};
    return {
      totalClassified: Number(totals.total_classified || 0),
      lastClassifiedAt: totals.last_classified_at || null,
      bySector: (sectorRes.rows || []).map((row) => ({
        sector: row.sector,
        total: Number(row.total || 0)
      })),
      supportedSectors: Array.from(VALID_SECTORS.values()),
      storageReady: true
    };
  } catch (error) {
    if (String(error?.code || '') !== '42P01') {
      console.warn('[strategy-catalog] classification summary unavailable', error?.message || error);
    }
    return {
      totalClassified: 0,
      lastClassifiedAt: null,
      bySector: [],
      supportedSectors: Array.from(VALID_SECTORS.values()),
      storageReady: false
    };
  }
}

module.exports = {
  buildFallbackStrategyCatalogClassification,
  refreshStrategyCatalogClassifications,
  loadStrategyCatalogClassificationSummary
};
