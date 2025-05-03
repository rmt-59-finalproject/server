const OrderModel = require("../models/order.model");

class OrderController {
  static async readAllOrders(req, res, next) {
    try {
      const data = await OrderModel.getAllOrders();

      res.status(200).json(data)
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;