const express = require('express');
const router = express.Router();
const config = require('../config');
const { createProxyHandler } = require('../controllers/proxyController');
const { authenticateJWT } = require('../middlewares/auth');

const tripProxy = createProxyHandler(config.services.trip);

// All trip endpoints require authenticated user (Customer, Driver, or Admin)
router.use(authenticateJWT);

router.post('/', tripProxy);
router.get('/:id', tripProxy);
router.put('/:id/status', tripProxy);
router.post('/:id/location', tripProxy);
router.put('/:id/location', tripProxy);
router.get('/:id/location', tripProxy);
router.get('/:id/route', tripProxy);
router.get('/customers/:customerId', tripProxy);

module.exports = router;
