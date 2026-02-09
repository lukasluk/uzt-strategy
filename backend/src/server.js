const http = require('http');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { query } = require('./db');
const { registerV1Routes } = require('./v1');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_CODE = process.env.ADMIN_CODE || 'change-me';
const VOTE_BUDGET = Number(process.env.VOTE_BUDGET || 10);

function uuid() {
  return crypto.randomUUID();
}

async function getSetting(key) {
  const res = await query('select value from settings where key = $1', [key]);
  return res.rows[0]?.value;
}

async function setSetting(key, value) {
  await query('insert into settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value', [key, value]);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { name, role, adminCode } = req.body || {};
  if (!name || !role) return res.status(400).json({ error: 'name and role required' });
  if (role === 'admin' && adminCode !== ADMIN_CODE) {
    return res.status(403).json({ error: 'invalid admin code' });
  }

  const userId = uuid();
  await query('insert into users (id, name, role) values ($1, $2, $3)', [userId, name, role]);
  res.json({ id: userId, name, role });
});

app.get('/api/guidelines', async (req, res) => {
  const userId = req.query.userId || null;
  const resultsPublished = (await getSetting('results_published')) === 'true';

  const guidelines = await query('select * from guidelines order by featured desc, title asc');
  const comments = await query('select * from comments');
  const proposals = await query('select * from proposals');
  const initiatives = await query('select * from initiatives');
  const votes = await query('select * from votes');

  const byGuideline = (rows) => rows.reduce((acc, row) => {
    acc[row.guideline_id] = acc[row.guideline_id] || [];
    acc[row.guideline_id].push(row);
    return acc;
  }, {});

  const commentsBy = byGuideline(comments.rows);
  const proposalsBy = byGuideline(proposals.rows);
  const initiativesBy = byGuideline(initiatives.rows);
  const votesBy = byGuideline(votes.rows);

  const payload = guidelines.rows.map((g) => {
    const voteRows = votesBy[g.id] || [];
    const totalScore = voteRows.reduce((sum, v) => sum + v.score, 0);
    const userScore = userId ? voteRows.find((v) => v.user_id === userId)?.score || 0 : 0;
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      tags: g.tags,
      featured: g.featured,
      totalScore: resultsPublished ? totalScore : null,
      userScore,
      comments: (commentsBy[g.id] || []).map((c) => ({
        id: c.id,
        body: c.body,
        userId: c.user_id,
        createdAt: c.created_at
      })),
      proposals: (proposalsBy[g.id] || []).map((p) => ({
        id: p.id,
        body: p.body,
        userId: p.user_id,
        createdAt: p.created_at
      })),
      initiatives: (initiativesBy[g.id] || []).map((i) => ({
        id: i.id,
        action: i.action,
        kpi: i.kpi,
        userId: i.user_id,
        createdAt: i.created_at
      })),
      votes: resultsPublished
        ? voteRows.map((v) => ({ userId: v.user_id, score: v.score }))
        : []
    };
  });

  res.json({ resultsPublished, guidelines: payload });
});

app.post('/api/guidelines/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { userId, body } = req.body || {};
  if (!userId || !body) return res.status(400).json({ error: 'userId and body required' });
  await query('insert into comments (id, guideline_id, user_id, body) values ($1, $2, $3, $4)', [uuid(), id, userId, body]);
  broadcast({ type: 'comment', guidelineId: id });
  res.json({ ok: true });
});

app.post('/api/guidelines/:id/proposals', async (req, res) => {
  const { id } = req.params;
  const { userId, body } = req.body || {};
  if (!userId || !body) return res.status(400).json({ error: 'userId and body required' });
  await query('insert into proposals (id, guideline_id, user_id, body) values ($1, $2, $3, $4)', [uuid(), id, userId, body]);
  broadcast({ type: 'proposal', guidelineId: id });
  res.json({ ok: true });
});

app.post('/api/guidelines/:id/initiatives', async (req, res) => {
  const { id } = req.params;
  const { userId, action, kpi } = req.body || {};
  if (!userId || !action) return res.status(400).json({ error: 'userId and action required' });
  await query('insert into initiatives (id, guideline_id, user_id, action, kpi) values ($1, $2, $3, $4, $5)', [uuid(), id, userId, action, kpi || null]);
  broadcast({ type: 'initiative', guidelineId: id });
  res.json({ ok: true });
});

app.post('/api/guidelines/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { userId, delta } = req.body || {};
  if (!userId || !Number.isInteger(delta)) return res.status(400).json({ error: 'userId and delta required' });

  const currentVotes = await query('select guideline_id, score from votes where user_id = $1', [userId]);
  const totalUsed = currentVotes.rows.reduce((sum, v) => sum + v.score, 0);
  const current = currentVotes.rows.find((v) => v.guideline_id === id)?.score || 0;

  const next = Math.max(0, Math.min(5, current + delta));
  const newTotal = totalUsed - current + next;
  if (newTotal > VOTE_BUDGET) {
    return res.status(400).json({ error: 'vote budget exceeded' });
  }

  if (currentVotes.rows.find((v) => v.guideline_id === id)) {
    await query('update votes set score = $1, updated_at = now() where user_id = $2 and guideline_id = $3', [next, userId, id]);
  } else {
    await query('insert into votes (id, guideline_id, user_id, score) values ($1, $2, $3, $4)', [uuid(), id, userId, next]);
  }

  broadcast({ type: 'vote', guidelineId: id });
  res.json({ ok: true, score: next });
});

app.post('/api/admin/guidelines/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, tags, featured } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  await query('update guidelines set title = $1, description = $2, tags = $3, featured = $4, updated_at = now() where id = $5', [title, description || null, tags || null, Boolean(featured), id]);
  broadcast({ type: 'guideline', guidelineId: id });
  res.json({ ok: true });
});

app.post('/api/admin/results', async (req, res) => {
  const { published } = req.body || {};
  await setSetting('results_published', published ? 'true' : 'false');
  broadcast({ type: 'results', published: Boolean(published) });
  res.json({ ok: true });
});

registerV1Routes({ app, query, broadcast, uuid });

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'hello' }));
});

server.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
