const express = require('express');
const router = express.Router();
const TripController = require('../controllers/tripController');
const {
  validateCreateTrip,
  validateUpdateStatus,
  validateLocationUpdate
} = require('../middlewares/tripValidator');

// Trip CRUD & lifecycle
router.post('/', validateCreateTrip, TripController.createTrip);
router.get('/:id', TripController.getTripById);
router.put('/:id/status', validateUpdateStatus, TripController.updateTripStatus);

// Trip Real-time GPS Tracking
router.post('/:id/location', validateLocationUpdate, TripController.recordLocation);
router.put('/:id/location', validateLocationUpdate, TripController.recordLocation);
router.get('/:id/location', TripController.getTripLocation);
router.get('/:id/route', TripController.getTripRoute);

// Query by customer
router.get('/customers/:customerId', TripController.getTripsByCustomer);

module.exports = router;
