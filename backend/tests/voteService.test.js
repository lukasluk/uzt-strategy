const test = require('node:test');
const assert = require('node:assert/strict');
const { createVoteService } = require('../src/services/voteService');

test('getUserCycleVotes ignores legacy guideline votes and returns initiative budget usage', async () => {
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    return {
      rows: [
        { initiative_id: 'initiative-1', score: 5 },
        { initiative_id: 'initiative-2', score: 4 }
      ]
    };
  };
  const service = createVoteService({ query });

  const result = await service.getUserCycleVotes('cycle-1', 'user-1');

  assert.deepEqual(result.votes, []);
  assert.deepEqual(result.initiativeVotes, [
    { initiativeId: 'initiative-1', score: 5 },
    { initiativeId: 'initiative-2', score: 4 }
  ]);
  assert.equal(result.totalUsed, 9);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /strategy_initiative_votes/);
  assert.doesNotMatch(calls[0].sql, /strategy_votes/);
});

test('calculateUserCycleVoteTotal counts only initiative votes', async () => {
  const calls = [];
  const query = async (sql, params) => {
    calls.push({ sql, params });
    return { rows: [{ total_used: 9 }] };
  };
  const service = createVoteService({ query });

  const total = await service.calculateUserCycleVoteTotal('user-1', 'cycle-1');

  assert.equal(total, 9);
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /strategy_initiative_votes/);
  assert.doesNotMatch(calls[0].sql, /strategy_votes/);
});
