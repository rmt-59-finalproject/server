require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('../config/mongodb');
const { ObjectId } = require('mongodb');

function parseItem(item) {
  return {
    productId: new ObjectId(item.productId),
    quantity: item.quantity,
    checkedByDriver: item.checkedByDriver,
    driverCheckTime: item.driverCheckTime ? new Date(item.driverCheckTime) : null,
    checkedByOutlet: item.checkedByOutlet,
    outletCheckTime: item.outletCheckTime ? new Date(item.outletCheckTime) : null,
  };
}

function parseOrder(order) {
  return {
    outletId: new ObjectId(order.outletId),
    driverId: new ObjectId(order.driverId),
    items: order.items.map(parseItem),
    status: order.status || "requested",
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

(async function seedDummyOrder() {
  try {
    const filePath = path.join(__dirname, '../data/dummy_orders.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) throw new Error('Invalid JSON format');

    await db.collection('orders').deleteMany({});
    const parsedOrders = data.map(order => parseOrder(order));

    await db.collection('orders').insertMany(parsedOrders);
    console.log('✅ Successfully seeded dummy orders');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  } finally {
    process.exit(0);
  }
})();
