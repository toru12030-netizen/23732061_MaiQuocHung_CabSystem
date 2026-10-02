const db = require('../config/db');

const TokenBlacklistModel = {
  async add(token, uid = null, expiresAt = null) {
    const res = await db.query(`
      INSERT INTO token_blacklist (token, uid, expires_at)
      VALUES ($1, $2, COALESCE($3, NOW() + INTERVAL '24 hours'))
      RETURNING *
    `, [token, uid, expiresAt]);
    return res.rows[0];
  },

  async isBlacklisted(token) {
    const res = await db.query('SELECT 1 FROM token_blacklist WHERE token = $1', [token]);
    return res.rowCount > 0;
  }
};

module.exports = TokenBlacklistModel;
