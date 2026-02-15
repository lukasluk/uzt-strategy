const crypto = require('crypto');
const {
  createAuthToken,
  hashPassword,
  normalizeEmail,
  sha256,
  timingSafeEqual
} = require('./security');
const {
  getActivePasswordResetTokenInfo,
  consumePasswordResetTokenAndSetPassword
} = require('./passwordResetService');

const DUMMY_PASSWORD_SALT = '00000000000000000000000000000000';
const DUMMY_PASSWORD_HASH = hashPassword('invalid-password-placeholder', DUMMY_PASSWORD_SALT);

function registerAuthRoutes({
  app,
  query,
  uuid,
  inviteAcceptRateLimit,
  loginRateLimit,
  requireAuth,
  getInstitutionBySlug,
  getCurrentCycle,
  voteBudget,
  authSecret,
  authTtlHours
}) {
  app.get('/api/v1/invites/token-info', inviteAcceptRateLimit, async (req, res) => {
    const token = String(req.query?.token || '').trim();
    if (!token) return res.status(400).json({ error: 'token required' });

    const invite = await query(
      `select inv.id, inv.institution_id, inv.email, inv.role, inv.expires_at, inv.used_at, inv.revoked_at,
              i.slug as institution_slug, i.name as institution_name
       from institution_invites inv
       join institutions i on i.id = inv.institution_id
       where inv.token_hash = $1`,
      [sha256(token)]
    );
    const row = invite.rows[0];
    if (!row) return res.status(404).json({ error: 'invite not found' });
    if (row.revoked_at) return res.status(403).json({ error: 'invite revoked' });
    if (row.used_at) return res.status(403).json({ error: 'invite already used' });
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(403).json({ error: 'invite expired' });

    const existingUserRes = await query(
      'select id, display_name, status from platform_users where email = $1',
      [normalizeEmail(row.email)]
    );
    const existingUser = existingUserRes.rows[0] || null;

    res.json({
      ok: true,
      email: normalizeEmail(row.email),
      role: row.role,
      expiresAt: row.expires_at,
      existingUser: existingUser
        ? {
            id: existingUser.id,
            displayName: existingUser.display_name || '',
            status: existingUser.status || 'active'
          }
        : null,
      institution: {
        id: row.institution_id,
        slug: row.institution_slug,
        name: row.institution_name
      }
    });
  });

  app.post('/api/v1/invites/accept', inviteAcceptRateLimit, async (req, res) => {
    const token = String(req.body?.token || '').trim();
    const emailInput = normalizeEmail(req.body?.email);
    const displayNameInput = String(req.body?.displayName || '').trim();
    const password = String(req.body?.password || '');
    if (!token || !emailInput) return res.status(400).json({ error: 'token and email required' });

    const invite = await query(
      `select id, institution_id, email, role, expires_at, used_at, revoked_at
       from institution_invites
       where token_hash = $1`,
      [sha256(token)]
    );
    const row = invite.rows[0];
    if (!row) return res.status(404).json({ error: 'invite not found' });
    if (row.revoked_at) return res.status(403).json({ error: 'invite revoked' });
    if (row.used_at) return res.status(403).json({ error: 'invite already used' });
    if (new Date(row.expires_at).getTime() < Date.now()) return res.status(403).json({ error: 'invite expired' });

    const email = normalizeEmail(row.email);
    if (emailInput !== email) return res.status(400).json({ error: 'invite email mismatch' });

    const institutionRes = await query(
      'select id, slug, name from institutions where id = $1',
      [row.institution_id]
    );
    if (institutionRes.rowCount === 0) return res.status(404).json({ error: 'institution not found' });
    const institution = institutionRes.rows[0];

    let user = await query('select id, email, display_name, password_salt, password_hash, status from platform_users where email = $1', [email]);
    let userRow = user.rows[0];

    if (!userRow) {
      if (!displayNameInput) return res.status(400).json({ error: 'displayName required for new user' });
      if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 chars' });
      const userId = uuid();
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword(password, salt);
      await query(
        `insert into platform_users (id, email, display_name, password_salt, password_hash, status)
         values ($1, $2, $3, $4, $5, 'active')`,
        [userId, email, displayNameInput, salt, hash]
      );
      user = await query('select id, email, display_name, status from platform_users where id = $1', [userId]);
      userRow = user.rows[0];
    } else {
      if (userRow.status !== 'active') {
        await query(
          `update platform_users
           set status = 'active',
               display_name = case
                 when $2::text <> '' then $2
                 else display_name
               end
           where id = $1`,
          [userRow.id, displayNameInput]
        );
      } else if (displayNameInput && displayNameInput !== userRow.display_name) {
        await query(
          `update platform_users
           set display_name = $2
           where id = $1`,
          [userRow.id, displayNameInput]
        );
      }

      const refreshed = await query(
        'select id, email, display_name, status from platform_users where id = $1',
        [userRow.id]
      );
      userRow = refreshed.rows[0];
    }

    await query(
      `insert into institution_memberships (id, institution_id, user_id, role, status)
       values ($1, $2, $3, $4, 'active')
       on conflict (institution_id, user_id) do update set role = excluded.role, status = 'active'`,
      [uuid(), row.institution_id, userRow.id, row.role]
    );

    await query('update institution_invites set used_at = now() where id = $1', [row.id]);

    const tokenPayload = {
      sub: userRow.id,
      email: userRow.email,
      institutionId: row.institution_id,
      role: row.role,
      exp: Date.now() + authTtlHours * 60 * 60 * 1000
    };

    res.json({
      token: createAuthToken(tokenPayload, authSecret),
      user: {
        id: userRow.id,
        email: userRow.email,
        displayName: userRow.display_name
      },
      institution: {
        id: institution.id,
        slug: institution.slug,
        name: institution.name
      },
      institutionId: row.institution_id,
      role: row.role
    });
  });

  app.post('/api/v1/auth/login', loginRateLimit, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const institutionSlug = String(req.body?.institutionSlug || '').trim();
    if (!email || !password || !institutionSlug) {
      return res.status(400).json({ error: 'email, password, institutionSlug required' });
    }

    const institution = await getInstitutionBySlug(query, institutionSlug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const userRes = await query(
      'select id, email, display_name, password_salt, password_hash, status from platform_users where email = $1',
      [email]
    );
    const user = userRes.rows[0] || null;
    const expectedHash = String(user?.password_hash || DUMMY_PASSWORD_HASH);
    const attemptedHash = hashPassword(password, user?.password_salt || DUMMY_PASSWORD_SALT);
    const passwordMatches = timingSafeEqual(attemptedHash, expectedHash);
    if (!user || user.status !== 'active' || !passwordMatches) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const membershipRes = await query(
      `select role, status from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [institution.id, user.id]
    );
    const membership = membershipRes.rows[0];
    if (!membership || membership.status !== 'active') return res.status(403).json({ error: 'membership inactive' });

    const payload = {
      sub: user.id,
      email: user.email,
      institutionId: institution.id,
      role: membership.role,
      exp: Date.now() + authTtlHours * 60 * 60 * 1000
    };

    res.json({
      token: createAuthToken(payload, authSecret),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name
      },
      institution: {
        id: institution.id,
        slug: institution.slug,
        name: institution.name
      },
      role: membership.role
    });
  });

  app.post('/api/v1/auth/switch-institution', requireAuth, async (req, res) => {
    const institutionSlug = String(req.body?.institutionSlug || '').trim();
    if (!institutionSlug) return res.status(400).json({ error: 'institutionSlug required' });

    const institution = await getInstitutionBySlug(query, institutionSlug);
    if (!institution) return res.status(404).json({ error: 'institution not found' });

    const userRes = await query(
      'select id, email, display_name, status from platform_users where id = $1',
      [req.auth.sub]
    );
    const user = userRes.rows[0] || null;
    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'user inactive' });
    }

    const membershipRes = await query(
      `select role, status
       from institution_memberships
       where institution_id = $1 and user_id = $2`,
      [institution.id, user.id]
    );
    const membership = membershipRes.rows[0] || null;
    if (!membership || membership.status !== 'active') {
      return res.status(403).json({ error: 'membership inactive' });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      institutionId: institution.id,
      role: membership.role,
      exp: Date.now() + authTtlHours * 60 * 60 * 1000
    };

    res.json({
      token: createAuthToken(payload, authSecret),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name
      },
      institution: {
        id: institution.id,
        slug: institution.slug,
        name: institution.name
      },
      role: membership.role
    });
  });

  app.get('/api/v1/auth/password-reset/token-info', inviteAcceptRateLimit, async (req, res) => {
    const token = String(req.query?.token || '').trim();
    if (!token) return res.status(400).json({ error: 'reset token required' });

    const tokenInfo = await getActivePasswordResetTokenInfo(query, token);
    if (!tokenInfo) return res.status(404).json({ error: 'reset token invalid' });

    res.json({
      ok: true,
      email: tokenInfo.email,
      displayName: tokenInfo.display_name,
      expiresAt: tokenInfo.expires_at
    });
  });

  app.post('/api/v1/auth/password-reset/complete', inviteAcceptRateLimit, async (req, res) => {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');

    if (!token) return res.status(400).json({ error: 'reset token required' });
    if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 chars' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const result = await consumePasswordResetTokenAndSetPassword({
      query,
      rawToken: token,
      passwordSalt: salt,
      passwordHash: hash
    });

    if (!result) return res.status(404).json({ error: 'reset token invalid' });

    res.json({
      ok: true,
      user: {
        id: result.user_id,
        email: result.email,
        displayName: result.display_name
      }
    });
  });

  app.get('/api/v1/me/context', requireAuth, async (req, res) => {
    const institution = await query(
      'select id, name, slug, status from institutions where id = $1',
      [req.auth.institutionId]
    );
    if (institution.rowCount === 0) return res.status(404).json({ error: 'institution not found' });

    const userRes = await query(
      'select id, email, display_name, status from platform_users where id = $1',
      [req.auth.sub]
    );
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'user not found' });
    if (userRes.rows[0].status !== 'active') return res.status(403).json({ error: 'user inactive' });

    const cycle = await getCurrentCycle(query, req.auth.institutionId);
    const membership = await query(
      `select role, status from institution_memberships where institution_id = $1 and user_id = $2`,
      [req.auth.institutionId, req.auth.sub]
    );
    if (membership.rowCount === 0) return res.status(403).json({ error: 'membership not found' });
    if (String(membership.rows[0].status || '').trim() !== 'active') {
      return res.status(403).json({ error: 'membership inactive' });
    }

    res.json({
      user: {
        id: userRes.rows[0].id,
        email: userRes.rows[0].email,
        displayName: userRes.rows[0].display_name
      },
      institution: institution.rows[0],
      membership: membership.rows[0],
      cycle,
      rules: {
        voteBudget,
        minPerGuideline: 0,
        maxPerGuideline: 5,
        minPerInitiative: 0,
        maxPerInitiative: 5
      }
    });
  });
}

module.exports = { registerAuthRoutes };
