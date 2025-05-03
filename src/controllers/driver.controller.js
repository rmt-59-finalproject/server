const DriverModel = require("../models/driver.model");

class DriverController {
  static async readAllOrders(req, res, next) {
    try {
      const { id: driverId } = req.user;
      const { status } = req.body;

      const order = await DriverModel.getAllOrders(driverId, status);

      res.status(200).json(order)
    } catch (error) {
      next(error);
    }
  }

  static async readDriverOrderById(req, res, next) {
    try {
      const { id: driverId } = req.user;
      const { id } = req.params;

      const order = await DriverModel.getOrdersById(driverId, id);

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DriverController;