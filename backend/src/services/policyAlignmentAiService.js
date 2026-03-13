const {
  buildAiProviderConfig,
  requestAiCompletion
} = require('./aiProviderService');

function stripCodeFence(raw) {
  const text = String(raw || '').trim();
  if (!text.startsWith('```')) return text;
  return text
    .replace(/^```[a-zA-Z0-9_-]*\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractBalancedJson(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';

  const startIndex = (() => {
    const objectIndex = text.indexOf('{');
    const arrayIndex = text.indexOf('[');
    if (objectIndex === -1) return arrayIndex;
    if (arrayIndex === -1) return objectIndex;
    return Math.min(objectIndex, arrayIndex);
  })();
  if (startIndex < 0) return '';

  const openChar = text[startIndex];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char === '\\') {
        isEscaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === openChar) {
      depth += 1;
      continue;
    }
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1).trim();
      }
    }
  }

  return '';
}

function parseJsonResponseText(raw) {
  const normalized = stripCodeFence(String(raw || '').trim().replace(/^\uFEFF/, ''));
  if (!normalized) {
    throw new Error('ai response invalid');
  }

  try {
    return JSON.parse(normalized);
  } catch {
    const extracted = extractBalancedJson(normalized);
    if (!extracted) {
      throw new Error('ai response invalid');
    }
    try {
      return JSON.parse(extracted);
    } catch {
      throw new Error('ai response invalid');
    }
  }
}

function safePreviewText(raw, maxLength = 800) {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function getPolicyAlignmentAiConfig({ provider, modelOverride } = {}) {
  return buildAiProviderConfig(provider, {
    apiKeyEnvNames: ['POLICY_ALIGNMENT_API_KEY', 'AI_STRATEGY_API_KEY'],
    modelEnvNames: ['POLICY_ALIGNMENT_MODEL', 'AI_STRATEGY_MODEL'],
    baseUrlEnvNames: ['POLICY_ALIGNMENT_API_BASE_URL', 'AI_STRATEGY_API_BASE_URL'],
    timeoutMsEnvNames: ['POLICY_ALIGNMENT_TIMEOUT_MS', 'AI_STRATEGY_TIMEOUT_MS'],
    defaultModel: provider === 'mistral' ? 'mistral-small-latest' : 'gpt-5-mini',
    modelOverride
  });
}

async function requestPolicyAlignmentJson({
  provider,
  apiKey,
  model,
  baseUrl,
  systemText,
  userText,
  timeoutMs = 120000,
  operationName = 'policy-alignment'
}) {
  const finalApiKey = String(apiKey || '').trim();
  if (!finalApiKey) {
    throw new Error('ai api key not configured');
  }
  const finalProvider = String(provider || 'openai').trim() || 'openai';
  const finalModel = String(model || '').trim()
    || (finalProvider === 'mistral' ? 'mistral-small-latest' : 'gpt-5-mini');

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await requestAiCompletion({
        provider: finalProvider,
        apiKey: finalApiKey,
        model: finalModel,
        baseUrl,
        systemText: attempt === 0
          ? String(systemText || '')
          : `${String(systemText || '')}\n\nCRITICAL: Return only one valid JSON object. No markdown. No commentary. No trailing text.`,
        userText: attempt === 0
          ? String(userText || '')
          : `${String(userText || '')}\n\nReturn strictly valid JSON only.`,
        timeoutMs,
        responseFormat: 'json',
        maxOutputTokens: 9000
      });
      const outputText = String(response.outputText || '').trim();

      try {
        const parsed = parseJsonResponseText(outputText);
        return {
          model: String(response.model || finalModel || '').trim() || null,
          outputText,
          parsed
        };
      } catch (error) {
        if (attempt === 0) continue;
        console.error('[policy-alignment] ai response parse failed', {
          operationName,
          provider: finalProvider,
          model: String(response.model || finalModel || '').trim() || null,
          preview: safePreviewText(outputText)
        });
        throw error;
      }
    } catch (error) {
      if (String(error?.message || '').trim() === 'ai response invalid' && attempt === 0) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('ai response invalid');
}

module.exports = {
  getPolicyAlignmentAiConfig,
  requestPolicyAlignmentJson,
  stripCodeFence,
  extractBalancedJson,
  parseJsonResponseText
};
