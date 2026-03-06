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
  timeoutMs = 120000
}) {
  const finalApiKey = String(apiKey || '').trim();
  if (!finalApiKey) {
    throw new Error('ai api key not configured');
  }

  const endpoint = `${String(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/responses`;
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
        model: String(model || 'gpt-5-mini').trim() || 'gpt-5-mini',
        max_output_tokens: 9000,
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

  return {
    model: String(payload?.model || model || '').trim() || null,
    outputText,
    parsed
  };
}

module.exports = {
  getPolicyAlignmentAiConfig,
  requestPolicyAlignmentJson,
  extractOutputText,
  stripCodeFence
};
