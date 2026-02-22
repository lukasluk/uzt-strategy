const pdfParse = require('pdf-parse');

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
    ? 'Write all generated titles and descriptions in clear English.'
    : 'Write all generated titles and descriptions in clear Lithuanian.';

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

async function generateStrategyFromAi({
  apiKey,
  model,
  baseUrl,
  instruction,
  docs,
  localeHint = 'lt',
  timeoutMs = 120000
}) {
  const prompt = buildPrompt({ instruction, docs, localeHint });
  const endpoint = `${String(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/responses`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(15000, Number(timeoutMs || 0)));
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
        temperature: 0.2,
        max_output_tokens: 9000,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: prompt.system }]
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt.user }]
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
    const apiError = String(payload?.error?.message || '').trim();
    if (apiError) {
      throw new Error(`ai provider error: ${apiError}`);
    }
    throw new Error(`ai provider error: HTTP ${response.status}`);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error('ai response invalid');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(stripCodeFence(outputText));
  } catch {
    throw new Error('ai response invalid');
  }

  const normalized = normalizeGeneratedStrategy(parsed, {
    fallbackTitle: cleanText(instruction, 180)
  });
  validateGeneratedStrategy(normalized);

  return {
    model: String(payload?.model || model || '').trim() || null,
    normalized,
    rawText: outputText
  };
}

module.exports = {
  extractPdfTexts,
  generateStrategyFromAi,
  normalizeGeneratedStrategy,
  validateGeneratedStrategy
};
