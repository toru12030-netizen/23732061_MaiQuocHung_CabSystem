const { pool } = require('../config/db');

const AuditModel = {
  async logAction({ action, resource, userId, username, details, ipAddress, status = 'SUCCESS' }) {
    const logId = `aud_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const actorId = userId || 'system';
    const actorRole = username || 'user';
    const actionUpper = (action || 'UNKNOWN').toUpperCase();
    const targetResource = resource || '/api/v1';
    const ip = ipAddress || '127.0.0.1';
    const detailsJson = typeof details === 'object' ? JSON.stringify(details) : JSON.stringify({ message: details || '' });

    const sql = `
      INSERT INTO audit_logs (id, actor_id, actor_role, action, resource, ip_address, status, details, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, CURRENT_TIMESTAMP)
      RETURNING id, actor_id, actor_role, action, resource, ip_address, status, details, timestamp
    `;

    const { rows } = await pool.query(sql, [
      logId,
      actorId,
      actorRole,
      actionUpper,
      targetResource,
      ip,
      status,
      detailsJson
    ]);

    const row = rows[0];
    return {
      logId: row.id,
      id: row.id,
      action: row.action,
      resource: row.resource,
      userId: row.actor_id,
      username: row.actor_role,
      details: row.details,
      ipAddress: row.ip_address,
      status: row.status,
      timestamp: row.timestamp
    };
  },

  async queryLogs({ action, resource, userId, from, to, page = 1, limit = 20 } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (action) {
      conditions.push(`action = $${idx++}`);
      values.push(action.toUpperCase());
    }
    if (resource) {
      conditions.push(`resource = $${idx++}`);
      values.push(resource);
    }
    if (userId) {
      conditions.push(`actor_id = $${idx++}`);
      values.push(userId);
    }
    if (from) {
      conditions.push(`timestamp >= $${idx++}`);
      values.push(new Date(from));
    }
    if (to) {
      conditions.push(`timestamp <= $${idx++}`);
      values.push(new Date(to));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countSql = `SELECT COUNT(*) AS total FROM audit_logs ${whereClause}`;
    const countRes = await pool.query(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);

    // Query paginated
    const offset = (page - 1) * limit;
    const querySql = `
      SELECT id, actor_id, actor_role, action, resource, ip_address, status, details, timestamp
      FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const queryValues = [...values, limit, offset];
    const { rows } = await pool.query(querySql, queryValues);

    const logs = rows.map(r => ({
      logId: r.id,
      id: r.id,
      action: r.action,
      resource: r.resource,
      userId: r.actor_id,
      username: r.actor_role,
      details: r.details,
      ipAddress: r.ip_address,
      status: r.status,
      timestamp: r.timestamp
    }));

    return {
      total,
      page,
      limit,
      logs
    };
  },

  async recordSecurityEvent({ eventType, severity = 'HIGH', ipAddress, details, targetEndpoint }) {
    const eventId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const eventTypeUpper = (eventType || 'UNKNOWN_ALERT').toUpperCase();
    const ip = ipAddress || '127.0.0.1';
    const source = targetEndpoint || 'gateway';
    const detailsJson = typeof details === 'object' ? JSON.stringify(details) : JSON.stringify({ message: details || '' });

    const sql = `
      INSERT INTO security_events (id, event_type, severity, source, ip_address, details, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, CURRENT_TIMESTAMP)
      RETURNING id, event_type, severity, source, ip_address, details, timestamp
    `;

    const { rows } = await pool.query(sql, [
      eventId,
      eventTypeUpper,
      severity,
      source,
      ip,
      detailsJson
    ]);

    const row = rows[0];
    return {
      eventId: row.id,
      id: row.id,
      eventType: row.event_type,
      severity: row.severity,
      targetEndpoint: row.source,
      ipAddress: row.ip_address,
      details: row.details,
      timestamp: row.timestamp
    };
  },

  async querySecurityEvents({ eventType, severity, page = 1, limit = 20 } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (eventType) {
      conditions.push(`event_type = $${idx++}`);
      values.push(eventType.toUpperCase());
    }
    if (severity) {
      conditions.push(`severity = $${idx++}`);
      values.push(severity.toUpperCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM security_events ${whereClause}`;
    const countRes = await pool.query(countSql, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT id, event_type, severity, source, ip_address, details, timestamp
      FROM security_events
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const queryValues = [...values, limit, offset];
    const { rows } = await pool.query(querySql, queryValues);

    const events = rows.map(r => ({
      eventId: r.id,
      id: r.id,
      eventType: r.event_type,
      severity: r.severity,
      targetEndpoint: r.source,
      ipAddress: r.ip_address,
      details: r.details,
      timestamp: r.timestamp
    }));

    return { total, page, limit, events };
  }
};

module.exports = AuditModel;
