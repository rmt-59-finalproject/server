const OrderModel = require("../models/order.model");

class OrderController {
  static async readAllOrders(req, res, next) {
    try {
      const { status } = req.query;
      const data = await OrderModel.getAllOrders(status);

      if (data.length === 0)
        res.status(404).json({
          message: "No orders found.",
        });

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const { id: outletId } = req.user;
      if (!req.body) {
        throw { name: "BadRequest", message: "Items is required." };
      }

      const { items } = req.body;

      const { message } = await OrderModel.postOrder(items, outletId);

      res.status(201).json({
        message,
      });
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

  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.body) {
        throw { name: "BadRequest", message: "Updated status is required." };
      }

      const { status, notes = "" } = req.body;

      const order = await OrderModel.patchOrderStatus(id, status, notes);

      res.status(200).json({
        message: `Successfully update order status to ${order.status}`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderDriver(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.body) {
        throw { name: "BadRequest", message: "Driver is required." };
      }

      const { driverId } = req.body;

      const { driver } = await OrderModel.patchOrderDriver(id, driverId);

      res.status(200).json({
        message: `Successfully assign order to ${driver.username}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;
