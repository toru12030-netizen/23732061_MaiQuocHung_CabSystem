const axios = require('axios');

const BASE_URL = process.env.API_GATEWAY_URL || process.env.GATEWAY_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: () => true // Allow handling all HTTP status codes directly in tests without throw
});

module.exports = {
  BASE_URL,
  apiClient,
  rawAxios: axios
};
