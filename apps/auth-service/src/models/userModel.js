const db = require('../config/db');

const UserModel = {
  async findByUsername(username) {
    const res = await db.query('SELECT uid, username, password, role FROM users WHERE username = $1', [username]);
    return res.rows[0] || null;
  },

  async findByUid(uid) {
    const res = await db.query('SELECT uid, username, role, created_at FROM users WHERE uid = $1', [uid]);
    return res.rows[0] || null;
  },

  async create({ uid, username, password, role = 'member' }) {
    const res = await db.query(`
      INSERT INTO users (uid, username, password, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING uid, username, role, created_at
    `, [uid, username, password, role]);
    return res.rows[0];
  }
};

module.exports = UserModel;
