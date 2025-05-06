const OutletModel = require("../models/outlet.model");

class OutletController {
  static async getAllOrders(req, res, next) {
    try {
      const { id: outletId } = req.user;
      const { status } = req.query || undefined;

      const order = await OutletModel.getAllOrders(outletId, status);

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async getOrdersById(req, res, next) {
    try {
      const { id: outletId } = req.user;
      const { id } = req.params;

      const order = await OutletModel.getOrderById(outletId, id);

      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async updateItemStatusByOutlet(req, res, next) {
    try {
      const { id: outletId } = req.user;
      const { id } = req.params;
      const { productId, status } = req.body;

      if (!productId) {
        throw { name: 'BadRequest', message: 'Product ID is required.' }
      }
      
      if (!status) {
        throw { name: 'BadRequest', message: 'Status is required.' }
      }

      const { name, quantity, unit } = await OutletModel.updateItemStatus(
        outletId,
        id,
        productId,
        status
      );

      res.status(200).json({
        message: `Outlet ${status === 'true' ? 'checked' : 'unchecked'} ${quantity} ${unit} of ${name}.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OutletController;
