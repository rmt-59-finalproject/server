const OrderController = require('../controllers/order.controller');
const { authOutlet } = require('../middlewares/auth.middleware');
const order = require('express').Router();

order.get('/', OrderController.readAllOrders);
<<<<<<< HEAD
=======
order.post('/', authOutlet, OrderController.createOrder);
order.get('/:id', OrderController.readOrderById);
>>>>>>> 4e186e2 (feat: GET /orders/:id)

module.exports = order;