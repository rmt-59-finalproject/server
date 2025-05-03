const DriverController = require('../controllers/driver.controller');
const driver = require('express').Router();

driver.get('/orders', DriverController.readAllOrders);

module.exports = driver;