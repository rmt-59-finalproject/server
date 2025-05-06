require('dotenv').config();
const db = require('../config/mongodb');
const { hashPassword } = require('../helpers/bcrypt');

(async function seedWarehouse() {
  try {
    // Clear existing warehouse admin
    await db.collection("users").findOneAndDelete({ username: 'stockify' });

    // Insert warehouse admin
    await db.collection("users").insertOne({
      name: 'Stockify',
      username: "stockify",
      password: hashPassword(process.env.WAREHOUSE_PASSWORD),
      role: "warehouse"
    });

    console.log('Warehouse account seeded successfully.')
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
})();