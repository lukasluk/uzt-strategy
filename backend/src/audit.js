async function logAuditEvent({ query, uuid, institutionId = null, actorId = null, action, entityType, entityId = null, payload = null }) {
  if (!query || !uuid || !action || !entityType) return;

  try {
    await query(
      `insert into audit_events (id, institution_id, actor_id, action, entity_type, entity_id, payload_json)
       values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        uuid(),
        institutionId || null,
        actorId || null,
        String(action),
        String(entityType),
        entityId || null,
        payload ? JSON.stringify(payload) : null
      ]
    );
  } catch (error) {
    console.error('[audit] failed to write event', {
      action,
      entityType,
      error: error?.message || error
    });
  }
}

module.exports = { logAuditEvent };
