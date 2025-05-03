const DriverModel = require("../models/driver.model");

class DriverController {
  static async readAllOrders(req, res, next) {
    try {
      const { id: driverId } = req.user;
      const { status } = req.query || undefined;

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

  static async updateItemStatus(req, res, next) {
    try {
      const { id: driverId } = req.user;
      const { id } = req.params;
      const { productId, status } = req.body;

      if (!productId) {
        throw { name: 'BadRequest', message: 'Product ID is required.' }
      }

      const { name, quantity, unit } = await DriverModel.updateItemStatus(driverId, id, productId, status);

      res.status(200).json({
        message: `Checked ${quantity} ${unit} of ${name}.`
      })
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DriverController;