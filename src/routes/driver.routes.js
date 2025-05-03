const DriverController = require('../controllers/driver.controller');
const { authDriver } = require('../middlewares/auth.middleware');
const driver = require('express').Router();

driver.get('/orders', authDriver, DriverController.readAllOrders);
driver.get('/orders/:id', authDriver, DriverController.readDriverOrderById);
driver.patch('/orders/:id', authDriver, DriverController.updateItemStatus);

module.exports = driver;