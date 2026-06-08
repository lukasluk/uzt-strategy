function normalizeInitiativeKeywords(value) {
  const source = Array.isArray(value)
    ? value
    : String(value || '')
      .split(/[,;\n]+/);

  const seen = new Set();
  const keywords = [];
  for (const item of source) {
    const text = String(item || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    if (text.length > 40) continue;
    const key = text.toLocaleLowerCase('lt-LT');
    if (seen.has(key)) continue;
    seen.add(key);
    keywords.push(text);
    if (keywords.length >= 16) break;
  }
  return keywords;
}

module.exports = { normalizeInitiativeKeywords };
