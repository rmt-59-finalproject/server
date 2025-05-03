const DriverModel = require("../models/driver.model");

class DriverController {
  static async readAllOrders(req, res, next) {
    try {
      const { id } = req.user;

      const order = await DriverModel.getAllOrders(id);

      res.status(200).json(order)
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DriverController;