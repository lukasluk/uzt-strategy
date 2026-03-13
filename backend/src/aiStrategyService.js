const pdfParse = require('pdf-parse');
const {
  buildAiProviderConfig,
  requestAiCompletion
} = require('./services/aiProviderService');

function cleanText(value, maxLength = 4000) {
  const text = String(value || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

function normalizeRelationType(value) {
  const token = String(value || '').trim().toLowerCase();
  if (token === 'parent') return 'parent';
  if (token === 'child') return 'child';
  return 'orphan';
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function getAiStrategyConfig({ provider } = {}) {
  return buildAiProviderConfig(provider, {
    apiKeyEnvNames: ['AI_STRATEGY_API_KEY'],
    modelEnvNames: ['AI_STRATEGY_MODEL'],
    baseUrlEnvNames: ['AI_STRATEGY_API_BASE_URL'],
    timeoutMsEnvNames: ['AI_STRATEGY_TIMEOUT_MS'],
    defaultModel: provider === 'mistral' ? 'mistral-small-latest' : 'gpt-5-mini'
  });
}

function normalizeGuidelines(guidelinesRaw) {
  const rawList = Array.isArray(guidelinesRaw) ? guidelinesRaw : [];
  const byKey = new Map();

  rawList.forEach((item) => {
    const title = cleanText(item?.title, 160);
    if (!title) return;
    const key = normalizeKey(title);
    if (byKey.has(key)) return;
    byKey.set(key, {
      title,
      description: cleanText(item?.description, 4000) || null,
      relationType: normalizeRelationType(item?.relationType),
      parentTitle: cleanText(item?.parentTitle, 160) || null
    });
  });

  const guidelines = Array.from(byKey.values());
  if (!guidelines.length) return [];

  const existingKeys = new Set(guidelines.map((item) => normalizeKey(item.title)));
  guidelines.forEach((item) => {
    if (item.relationType !== 'child') {
      item.parentTitle = null;
      return;
    }
    const parentKey = normalizeKey(item.parentTitle);
    const selfKey = normalizeKey(item.title);
    if (!parentKey || parentKey === selfKey || !existingKeys.has(parentKey)) {
      item.relationType = 'orphan';
      item.parentTitle = null;
      return;
    }
    const parent = guidelines.find((g) => normalizeKey(g.title) === parentKey);
    if (parent && parent.relationType !== 'parent') {
      parent.relationType = 'parent';
      parent.parentTitle = null;
    }
  });

  return guidelines;
}

function normalizeInitiatives(initiativesRaw, guidelines) {
  const rawList = Array.isArray(initiativesRaw) ? initiativesRaw : [];
  const guidelineKeyToTitle = new Map(
    (Array.isArray(guidelines) ? guidelines : []).map((g) => [normalizeKey(g.title), g.title])
  );
  const fallbackTitle = Array.from(guidelineKeyToTitle.values())[0] || '';
  const initiativesByKey = new Map();

  rawList.forEach((item) => {
    const title = cleanText(item?.title, 160);
    if (!title) return;
    const key = normalizeKey(title);
    const description = cleanText(item?.description, 4000) || null;
    const fromArray = Array.isArray(item?.guidelineTitles) ? item.guidelineTitles : [];
    const single = cleanText(item?.guidelineTitle, 160);
    const combined = single ? [single, ...fromArray] : fromArray;
    const resolvedGuidelines = [];
    const seen = new Set();

    combined.forEach((rawGuidelineTitle) => {
      const lookup = guidelineKeyToTitle.get(normalizeKey(rawGuidelineTitle));
      if (!lookup) return;
      const token = normalizeKey(lookup);
      if (seen.has(token)) return;
      seen.add(token);
      resolvedGuidelines.push(lookup);
    });

    if (!resolvedGuidelines.length && fallbackTitle) {
      resolvedGuidelines.push(fallbackTitle);
    }
    if (!resolvedGuidelines.length) return;

    if (!initiativesByKey.has(key)) {
      initiativesByKey.set(key, {
        title,
        description,
        guidelineTitles: resolvedGuidelines
      });
      return;
    }

    const existing = initiativesByKey.get(key);
    const merged = new Set([...(existing.guidelineTitles || []), ...resolvedGuidelines]);
    existing.guidelineTitles = Array.from(merged);
    if (!existing.description && description) {
      existing.description = description;
    }
  });

  return Array.from(initiativesByKey.values());
}

function normalizeGeneratedStrategy(raw, { fallbackTitle = '' } = {}) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const guidelines = normalizeGuidelines(value.guidelines);
  const initiatives = normalizeInitiatives(value.initiatives, guidelines);

  return {
    strategyTitle: cleanText(value.strategyTitle, 180) || cleanText(fallbackTitle, 180) || null,
    strategyDescription: cleanText(value.strategyDescription, 4000) || null,
    cycleTitle: cleanText(value.cycleTitle, 180) || null,
    missionText: cleanText(value.missionText, 6000) || null,
    visionText: cleanText(value.visionText, 6000) || null,
    guidelines,
    initiatives
  };
}

function validateGeneratedStrategy(generated) {
  if (!generated || typeof generated !== 'object') {
    throw new Error('ai response invalid');
  }
  if (!Array.isArray(generated.guidelines) || generated.guidelines.length < 1) {
    throw new Error('generated guidelines missing');
  }
  if (!Array.isArray(generated.initiatives) || generated.initiatives.length < 1) {
    throw new Error('generated initiatives missing');
  }
}

async function extractPdfTexts(files, { maxCombinedChars = 120000 } = {}) {
  const list = Array.isArray(files) ? files : [];
  let combinedChars = 0;
  const docs = [];

  for (const file of list) {
    const filename = String(file?.originalname || file?.name || 'document.pdf');
    const buffer = Buffer.isBuffer(file?.buffer) ? file.buffer : null;
    if (!buffer) {
      throw new Error('pdf parsing failed');
    }

    let parsed;
    try {
      parsed = await pdfParse(buffer);
    } catch {
      throw new Error('pdf parsing failed');
    }

    const text = cleanText(parsed?.text, maxCombinedChars);
    if (!text) {
      throw new Error('pdf parsing failed');
    }

    combinedChars += text.length;
    if (combinedChars > maxCombinedChars) {
      throw new Error('pdf content too large');
    }

    docs.push({
      filename,
      bytes: Number(file?.size || buffer.length || 0),
      chars: text.length,
      text
    });
  }

  return docs;
}

function buildPrompt({ instruction, docs, localeHint = 'lt' }) {
  const userInstruction = cleanText(instruction, 5000);
  const docsText = docs
    .map((doc, index) => {
      return `### DOCUMENT ${index + 1}: ${doc.filename}\n${doc.text}`;
    })
    .join('\n\n');

  const locale = String(localeHint || 'lt').toLowerCase() === 'en' ? 'en' : 'lt';
  const languageHint = locale === 'en'
    ? [
      'Output language MUST be English for every string field in the JSON.',
      'Translate source ideas to English even if source documents are Lithuanian.',
      'This applies to: strategyTitle, strategyDescription, cycleTitle, missionText, visionText, guideline titles/descriptions, initiative titles/descriptions.',
      'Do not output Lithuanian words.'
    ].join(' ')
    : [
      'Output language MUST be Lithuanian for every string field in the JSON.',
      'This applies to: strategyTitle, strategyDescription, cycleTitle, missionText, visionText, guideline titles/descriptions, initiative titles/descriptions.'
    ].join(' ');

  const system = [
    'You are a public-sector strategy architect.',
    'Transform source documents into a structured strategy model.',
    'Return ONLY valid JSON (no markdown, no prose).',
    'Use this JSON schema exactly:',
    '{',
    '  "strategyTitle": "string",',
    '  "strategyDescription": "string",',
    '  "cycleTitle": "string",',
    '  "missionText": "string",',
    '  "visionText": "string",',
    '  "guidelines": [',
    '    {',
    '      "title": "string",',
    '      "description": "string",',
    '      "relationType": "parent|child|orphan",',
    '      "parentTitle": "string or empty"',
    '    }',
    '  ],',
    '  "initiatives": [',
    '    {',
    '      "title": "string",',
    '      "description": "string",',
    '      "guidelineTitles": ["guideline title 1", "guideline title 2"]',
    '    }',
    '  ]',
    '}',
    'Constraints:',
    '- At least 4 guidelines and at least 4 initiatives.',
    '- Every initiative must reference one or more existing guideline titles.',
    '- Child guidelines must reference an existing parent guideline title.',
    '- Keep content concrete and implementation-oriented.',
    languageHint
  ].join('\n');

  const user = [
    'Additional request from meta-admin:',
    userInstruction || '(no extra instruction)',
    '',
    'Source documents:',
    docsText
  ].join('\n');

  return { system, user };
}

function collectGeneratedText(generated) {
  const parts = [];
  if (!generated || typeof generated !== 'object') return '';
  parts.push(
    generated.strategyTitle || '',
    generated.strategyDescription || '',
    generated.cycleTitle || '',
    generated.missionText || '',
    generated.visionText || ''
  );
  const guidelines = Array.isArray(generated.guidelines) ? generated.guidelines : [];
  const initiatives = Array.isArray(generated.initiatives) ? generated.initiatives : [];
  guidelines.forEach((item) => {
    parts.push(item?.title || '', item?.description || '', item?.parentTitle || '');
  });
  initiatives.forEach((item) => {
    parts.push(item?.title || '', item?.description || '');
    (Array.isArray(item?.guidelineTitles) ? item.guidelineTitles : []).forEach((g) => parts.push(g || ''));
  });
  return parts.join(' ').trim();
}

function looksLithuanianContent(text) {
  const value = String(text || '').toLowerCase();
  if (!value) return false;
  if (/[ąčęėįšųūž]/i.test(value)) return true;
  const ltHits = (value.match(/\b(gair(?:e|es|iu)|iniciatyv(?:a|os|u)|uzdavin(?:ys|iai)|strategij(?:a|os|u)|skaitmenin(?:is|e|iu)|paslaug(?:a|os|u)|duomen(?:ys|u|imis))\b/g) || []).length;
  const enHits = (value.match(/\b(guideline|guidelines|initiative|initiatives|strategy|strategies|digital|service|services|data|mission|vision)\b/g) || []).length;
  return ltHits > Math.max(2, enHits);
}

async function requestAiText({
  provider,
  apiKey,
  model,
  baseUrl,
  systemText,
  userText,
  timeoutMs
}) {
  return requestAiCompletion({
    provider,
    apiKey,
    model,
    baseUrl,
    systemText,
    userText,
    timeoutMs,
    responseFormat: 'json',
    maxOutputTokens: 9000
  });
}

async function generateStrategyFromAi({
  provider = 'openai',
  apiKey,
  model,
  baseUrl,
  instruction,
  docs,
  localeHint = 'lt',
  timeoutMs = 120000
}) {
  const locale = String(localeHint || 'lt').toLowerCase() === 'en' ? 'en' : 'lt';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt = buildPrompt({ instruction, docs, localeHint: locale });
    const enforcedUser = attempt === 0
      ? prompt.user
      : `${prompt.user}\n\nCRITICAL RETRY RULE: Previous output was not in requested language. Output strictly in ${locale === 'en' ? 'English' : 'Lithuanian'} only.`;

    const aiResponse = await requestAiText({
      provider,
      apiKey,
      model,
      baseUrl,
      systemText: prompt.system,
      userText: enforcedUser,
      timeoutMs
    });

    let parsed = null;
    try {
      parsed = JSON.parse(stripCodeFence(aiResponse.outputText));
    } catch {
      throw new Error('ai response invalid');
    }

    const normalized = normalizeGeneratedStrategy(parsed, {
      fallbackTitle: cleanText(instruction, 180)
    });
    validateGeneratedStrategy(normalized);

    if (locale === 'en') {
      const generatedText = collectGeneratedText(normalized);
      if (looksLithuanianContent(generatedText)) {
        if (attempt === 0) continue;
        throw new Error('ai response language mismatch');
      }
    }

    return {
      model: aiResponse.model,
      normalized,
      rawText: aiResponse.outputText
    };
  }

  throw new Error('ai response invalid');
}

module.exports = {
  extractPdfTexts,
  getAiStrategyConfig,
  generateStrategyFromAi,
  normalizeGeneratedStrategy,
  validateGeneratedStrategy
};
