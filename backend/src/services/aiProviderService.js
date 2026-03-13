const DEFAULT_AI_PROVIDER = 'openai';
const SUPPORTED_AI_PROVIDERS = new Set(['openai', 'mistral']);

function normalizeAiProvider(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return SUPPORTED_AI_PROVIDERS.has(normalized) ? normalized : DEFAULT_AI_PROVIDER;
}

function isProviderCompatibleModel(provider, model) {
  const resolvedProvider = normalizeAiProvider(provider);
  const modelText = String(model || '').trim();
  if (!modelText) return false;
  if (resolvedProvider === 'mistral') {
    return /mistral/i.test(modelText);
  }
  return !/mistral/i.test(modelText);
}

function resolveProviderCompatibleModel(provider, preferredModel, fallbackModel = '') {
  const resolvedProvider = normalizeAiProvider(provider);
  const preferred = String(preferredModel || '').trim();
  const fallback = String(fallbackModel || '').trim();
  if (preferred && isProviderCompatibleModel(resolvedProvider, preferred)) {
    return preferred;
  }
  if (fallback && isProviderCompatibleModel(resolvedProvider, fallback)) {
    return fallback;
  }
  return resolvedProvider === 'mistral' ? 'mistral-small-latest' : 'gpt-5-mini';
}

async function resolveInstitutionAiProvider(query, institutionId) {
  const id = String(institutionId || '').trim();
  if (!id || typeof query !== 'function') {
    return DEFAULT_AI_PROVIDER;
  }
  const result = await query(
    `select ai_provider
     from institutions
     where id = $1
     limit 1`,
    [id]
  );
  return normalizeAiProvider(result.rows?.[0]?.ai_provider);
}

function pickEnvValue(names, fallback = '') {
  const list = Array.isArray(names) ? names : [];
  for (const name of list) {
    const key = String(name || '').trim();
    if (!key) continue;
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return String(fallback || '').trim();
}

function pickEnvNumber(names, fallback) {
  const list = Array.isArray(names) ? names : [];
  for (const name of list) {
    const key = String(name || '').trim();
    if (!key) continue;
    const value = Number(process.env[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
}

function buildAiProviderConfig(provider, {
  apiKeyEnvNames = [],
  modelEnvNames = [],
  baseUrlEnvNames = [],
  timeoutMsEnvNames = [],
  defaultModel = ''
} = {}) {
  const resolvedProvider = normalizeAiProvider(provider);
  const providerApiKeyEnv = resolvedProvider === 'mistral' ? 'MISTRAL_API_KEY' : 'OPENAI_API_KEY';
  const providerModelEnv = resolvedProvider === 'mistral' ? 'MISTRAL_MODEL' : 'OPENAI_MODEL';
  const providerBaseUrlEnv = resolvedProvider === 'mistral' ? 'MISTRAL_API_BASE_URL' : 'OPENAI_API_BASE_URL';
  const providerDefaultModel = resolvedProvider === 'mistral' ? 'mistral-small-latest' : 'gpt-5-mini';
  const providerDefaultBaseUrl = resolvedProvider === 'mistral'
    ? 'https://api.mistral.ai/v1'
    : 'https://api.openai.com/v1';
  const providerOnlyModel = pickEnvValue([providerModelEnv], defaultModel || providerDefaultModel);
  const preferredModel = pickEnvValue([providerModelEnv, ...modelEnvNames], providerOnlyModel);

  return {
    provider: resolvedProvider,
    apiKey: pickEnvValue([providerApiKeyEnv, ...apiKeyEnvNames], ''),
    model: resolveProviderCompatibleModel(resolvedProvider, preferredModel, providerOnlyModel),
    baseUrl: pickEnvValue([providerBaseUrlEnv, ...baseUrlEnvNames], providerDefaultBaseUrl),
    timeoutMs: Math.max(15000, pickEnvNumber(timeoutMsEnvNames, 120000))
  };
}

function extractAiText(payload) {
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

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }
  if (content && typeof content === 'object' && typeof content.text === 'string' && content.text.trim()) {
    return content.text.trim();
  }
  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return '';
      })
      .join('\n')
      .trim();
    if (text) return text;
  }
  return '';
}

async function requestAiCompletion({
  provider,
  apiKey,
  model,
  baseUrl,
  systemText,
  userText,
  timeoutMs = 120000,
  maxOutputTokens = 9000,
  responseFormat = 'text'
}) {
  const resolvedProvider = normalizeAiProvider(provider);
  const finalApiKey = String(apiKey || '').trim();
  if (!finalApiKey) {
    throw new Error('ai api key not configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(15000, Number(timeoutMs || 0)));
  let response;

  try {
    if (resolvedProvider === 'mistral') {
      response = await fetch(`${String(baseUrl || 'https://api.mistral.ai/v1').replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${finalApiKey}`
        },
        body: JSON.stringify({
          model: String(model || 'mistral-small-latest').trim() || 'mistral-small-latest',
          temperature: 0.2,
          max_tokens: Math.max(512, Number(maxOutputTokens || 0)),
          messages: [
            { role: 'system', content: String(systemText || '') },
            { role: 'user', content: String(userText || '') }
          ]
        }),
        signal: controller.signal
      });
    } else {
      response = await fetch(`${String(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${finalApiKey}`
        },
        body: JSON.stringify({
          model: String(model || 'gpt-5-mini').trim() || 'gpt-5-mini',
          max_output_tokens: Math.max(512, Number(maxOutputTokens || 0)),
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: String(systemText || '') }]
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: String(userText || '') }]
            }
          ]
        }),
        signal: controller.signal
      });
    }
  } catch (error) {
    if (String(error?.name || '').trim() === 'AbortError') {
      throw new Error('ai request timed out');
    }
    throw error;
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
    const apiError = String(payload?.error?.message || payload?.message || '').trim();
    if (apiError) {
      throw new Error(`ai provider error: ${apiError}`);
    }
    throw new Error(`ai provider error: HTTP ${response.status}`);
  }

  const outputText = extractAiText(payload);
  if (!outputText) {
    throw new Error('ai response invalid');
  }

  return {
    model: String(payload?.model || model || '').trim() || null,
    outputText,
    payload
  };
}

module.exports = {
  DEFAULT_AI_PROVIDER,
  SUPPORTED_AI_PROVIDERS,
  normalizeAiProvider,
  isProviderCompatibleModel,
  resolveInstitutionAiProvider,
  resolveProviderCompatibleModel,
  buildAiProviderConfig,
  requestAiCompletion,
  extractAiText
};
