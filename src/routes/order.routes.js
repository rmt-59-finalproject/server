const OrderController = require('../controllers/order.controller');
const { authOutlet } = require('../middlewares/auth.middleware');
const order = require('express').Router();

order.get('/', OrderController.readAllOrders);
order.post('/', authOutlet, OrderController.createOrder);
order.get('/:id', OrderController.readOrderById);
order.patch('/:id', OrderController.updateOrderStatus);

module.exports = order;