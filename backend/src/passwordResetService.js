const crypto = require('crypto');
const { sha256 } = require('./security');

const RESET_TOKEN_BYTES = 32;
const MIN_RESET_TTL_MINUTES = 5;
const MAX_RESET_TTL_MINUTES = 24 * 60;
let passwordResetSchemaReady = false;

async function tableExists(query, qualifiedTableName) {
  const result = await query('select to_regclass($1) as table_name', [qualifiedTableName]);
  return Boolean(result.rows?.[0]?.table_name);
}

async function ensurePasswordResetTable(query) {
  if (passwordResetSchemaReady) return;
  try {
    await query(
      `create table if not exists password_reset_tokens (
        id uuid primary key,
        user_id uuid not null references platform_users(id) on delete cascade,
        token_hash text not null unique,
        expires_at timestamptz not null,
        used_at timestamptz,
        revoked_at timestamptz,
        created_by_scope text not null default 'meta_admin',
        created_by_id text,
        created_at timestamptz not null default now()
      )`
    );
    await query('create index if not exists idx_password_reset_user on password_reset_tokens(user_id)');
    await query('create index if not exists idx_password_reset_expires on password_reset_tokens(expires_at)');
    passwordResetSchemaReady = true;
  } catch (error) {
    if (String(error?.code || '') === '42501') {
      const exists = await tableExists(query, 'public.password_reset_tokens');
      if (exists) {
        passwordResetSchemaReady = true;
        return;
      }
    }
    throw error;
  }
}

function normalizeTtlMinutes(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 60;
  return Math.max(MIN_RESET_TTL_MINUTES, Math.min(MAX_RESET_TTL_MINUTES, Math.round(parsed)));
}

async function createPasswordResetToken({
  query,
  uuid,
  userId,
  ttlMinutes,
  createdByScope = 'meta_admin',
  createdById = null
}) {
  await ensurePasswordResetTable(query);

  const ttl = normalizeTtlMinutes(ttlMinutes);
  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
  const tokenHash = sha256(token);
  const tokenId = uuid();

  await query(
    `update password_reset_tokens
     set revoked_at = now()
     where user_id = $1
       and used_at is null
       and revoked_at is null
       and expires_at > now()`,
    [userId]
  );

  const result = await query(
    `insert into password_reset_tokens (id, user_id, token_hash, expires_at, created_by_scope, created_by_id)
     values ($1, $2, $3, now() + ($4 || ' minutes')::interval, $5, $6)
     returning id, expires_at`,
    [tokenId, userId, tokenHash, String(ttl), createdByScope, createdById]
  );

  return {
    tokenId: result.rows[0].id,
    token,
    expiresAt: result.rows[0].expires_at
  };
}

async function getActivePasswordResetTokenInfo(query, rawToken) {
  await ensurePasswordResetTable(query);
  const tokenHash = sha256(String(rawToken || '').trim());
  const result = await query(
    `select pr.id,
            pr.user_id,
            pr.expires_at,
            u.email,
            u.display_name,
            u.status
     from password_reset_tokens pr
     join platform_users u on u.id = pr.user_id
     where pr.token_hash = $1
       and pr.used_at is null
       and pr.revoked_at is null
       and pr.expires_at > now()`,
    [tokenHash]
  );
  if (!result.rowCount) return null;
  return result.rows[0];
}

async function consumePasswordResetTokenAndSetPassword({
  query,
  rawToken,
  passwordSalt,
  passwordHash
}) {
  await ensurePasswordResetTable(query);
  const tokenHash = sha256(String(rawToken || '').trim());

  const result = await query(
    `with consumed as (
       update password_reset_tokens
       set used_at = now()
       where token_hash = $1
         and used_at is null
         and revoked_at is null
         and expires_at > now()
       returning id, user_id
     )
     update platform_users u
     set password_salt = $2,
         password_hash = $3
     from consumed
     where u.id = consumed.user_id
     returning consumed.id as reset_token_id, u.id as user_id, u.email, u.display_name`,
    [tokenHash, passwordSalt, passwordHash]
  );

  if (!result.rowCount) return null;

  const row = result.rows[0];
  await query(
    `update password_reset_tokens
     set revoked_at = now()
     where user_id = $1
       and id <> $2
       and used_at is null
       and revoked_at is null
       and expires_at > now()`,
    [row.user_id, row.reset_token_id]
  );

  return row;
}

module.exports = {
  ensurePasswordResetTable,
  createPasswordResetToken,
  getActivePasswordResetTokenInfo,
  consumePasswordResetTokenAndSetPassword
};
