const db = require('../config/db');

/**
 * Pricing Model (Data Access Layer for PostgreSQL payment_db.pricing_configs)
 */
const PricingModel = {
  async getActiveConfigs() {
    const res = await db.query(
      'SELECT vehicle_type, base_fare, price_per_km, price_per_min FROM pricing_configs WHERE is_active = TRUE'
    );
    return res.rows;
  }
};

module.exports = PricingModel;
