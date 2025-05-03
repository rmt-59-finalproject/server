const OrderController = require('../controllers/order.controller');
const order = require('express').Router();

order.get('/', OrderController.readAllOrders);

module.exports = order;