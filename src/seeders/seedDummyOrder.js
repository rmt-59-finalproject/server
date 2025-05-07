require('dotenv').config();
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
    orderId: order.orderId,
    outletId: new ObjectId(order.outletId),
    driverId: order.driverId ? new ObjectId(order.driverId) : null,
    items: order.items.map(parseItem),
    status: order.status || "requested",
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

(async function seedDummyOrder() {
  try {
    const data = require('../data/dummy_orders.json')

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
