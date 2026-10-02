const { apiClient } = require('./api-client');
const fixtures = require('../fixtures/test-data.json');

/**
 * Login and retrieve dynamic JWT token
 */
async function login(username, password) {
  const res = await apiClient.post('/auth/login', { username, password });
  if (res.status !== 200 || !res.data?.data?.token) {
    throw new Error(`Failed to login as ${username}: status ${res.status}, msg: ${res.data?.message || res.data?.error?.message}`);
  }
  return {
    token: res.data.data.token,
    uid: res.data.data.uid,
    username: res.data.data.username,
    role: res.data.data.role,
    authHeader: { Authorization: `Bearer ${res.data.data.token}` }
  };
}

async function loginCustomer() {
  return login(fixtures.accounts.customer.username, fixtures.accounts.customer.password);
}

async function loginAdmin() {
  return login(fixtures.accounts.admin.username, fixtures.accounts.admin.password);
}

function generateUniqueUsername(prefix = 'cust') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

module.exports = {
  login,
  loginCustomer,
  loginAdmin,
  generateUniqueUsername
};
