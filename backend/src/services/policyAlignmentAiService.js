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

function getPolicyAlignmentAiConfig() {
  return {
    apiKey: String(
      process.env.POLICY_ALIGNMENT_API_KEY
      || process.env.AI_STRATEGY_API_KEY
      || process.env.OPENAI_API_KEY
      || ''
    ).trim(),
    model: String(
      process.env.POLICY_ALIGNMENT_MODEL
      || process.env.AI_STRATEGY_MODEL
      || process.env.OPENAI_MODEL
      || 'gpt-5-mini'
    ).trim(),
    baseUrl: String(
      process.env.POLICY_ALIGNMENT_API_BASE_URL
      || process.env.AI_STRATEGY_API_BASE_URL
      || process.env.OPENAI_API_BASE_URL
      || 'https://api.openai.com/v1'
    ).trim(),
    timeoutMs: Math.max(
      15000,
      Number(
        process.env.POLICY_ALIGNMENT_TIMEOUT_MS
        || process.env.AI_STRATEGY_TIMEOUT_MS
        || 120000
      )
    )
  };
}

async function requestPolicyAlignmentJson({
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

  const endpoint = `${String(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/responses`;
  const finalModel = String(model || 'gpt-5-mini').trim() || 'gpt-5-mini';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(15000, Number(timeoutMs || 0)));
    let response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${finalApiKey}`
        },
        body: JSON.stringify({
          model: finalModel,
          max_output_tokens: 9000,
          input: [
            {
              role: 'system',
              content: [{
                type: 'input_text',
                text: attempt === 0
                  ? String(systemText || '')
                  : `${String(systemText || '')}\n\nCRITICAL: Return only one valid JSON object. No markdown. No commentary. No trailing text.`
              }]
            },
            {
              role: 'user',
              content: [{
                type: 'input_text',
                text: attempt === 0
                  ? String(userText || '')
                  : `${String(userText || '')}\n\nReturn strictly valid JSON only.`
              }]
            }
          ]
        }),
        signal: controller.signal
      });
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
      const apiError = String(payload?.error?.message || '').trim();
      if (apiError) {
        throw new Error(`ai provider error: ${apiError}`);
      }
      throw new Error(`ai provider error: HTTP ${response.status}`);
    }

    const outputText = extractOutputText(payload);
    if (!outputText) {
      if (attempt === 0) continue;
      console.error('[policy-alignment] ai output missing', {
        operationName,
        model: String(payload?.model || finalModel || '').trim() || null
      });
      throw new Error('ai response invalid');
    }

    try {
      const parsed = parseJsonResponseText(outputText);
      return {
        model: String(payload?.model || finalModel || '').trim() || null,
        outputText,
        parsed
      };
    } catch (error) {
      if (attempt === 0) continue;
      console.error('[policy-alignment] ai response parse failed', {
        operationName,
        model: String(payload?.model || finalModel || '').trim() || null,
        preview: safePreviewText(outputText)
      });
      throw error;
    }
  }

  throw new Error('ai response invalid');
}

module.exports = {
  getPolicyAlignmentAiConfig,
  requestPolicyAlignmentJson,
  extractOutputText,
  stripCodeFence,
  extractBalancedJson,
  parseJsonResponseText
};
