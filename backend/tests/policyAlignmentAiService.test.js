const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractBalancedJson,
  parseJsonResponseText,
  stripCodeFence
} = require('../src/services/policyAlignmentAiService');

test('stripCodeFence removes fenced wrapper', () => {
  const raw = '```json\n{"ok":true}\n```';
  assert.equal(stripCodeFence(raw), '{"ok":true}');
});

test('extractBalancedJson recovers json object from prose wrapper', () => {
  const raw = 'Here is the result:\n\n{"findings":[{"status":"covered"}]}\n\nDone.';
  assert.equal(extractBalancedJson(raw), '{"findings":[{"status":"covered"}]}');
});

test('parseJsonResponseText parses fenced json with extra commentary', () => {
  const raw = '```json\n{"requirements":[{"title":"Digital skills"}]}\n```\nNotes: generated from source.';
  const parsed = parseJsonResponseText(raw);
  assert.equal(parsed.requirements[0].title, 'Digital skills');
});

test('parseJsonResponseText throws on non-json text', () => {
  assert.throws(() => parseJsonResponseText('No structured output available'), /ai response invalid/);
});
