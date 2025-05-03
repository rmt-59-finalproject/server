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

  static async createOrder(req, res, next) {
    try {
      const { id: outletId } = req.user;
      const { items } = req.body;

      const { message } = await OrderModel.postOrder(items, outletId);

      res.status(201).json({
        message
      })
    } catch (error) {
      next(error);
    }
  }

  static async readOrderById(req, res, next) {
    try {
      const { id } = req.params;

      const order = await OrderModel.getOrderById(id);

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;