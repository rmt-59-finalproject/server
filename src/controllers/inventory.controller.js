const ProductModel = require("../models/product.model");

class InventoryController {
  static async getInventories(req, res, next) {
    try {
      const search = req.query.search || "";
      const page = req.query.page ? parseInt(req.query.page) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

      const inventories = await ProductModel.getAll(search, page, limit);

      res.status(200).json(inventories);
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryById(req, res, next) {
    try {
      const { id } = req.params;

      const inventory = await ProductModel.getById(id);

      res.status(200).json(inventory);
    } catch (error) {
      next(error);
    }
  }

  static async createInventory(req, res, next) {
    try {
      const inventory = await ProductModel.create({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json(inventory);
    } catch (error) {
      next(error);
    }
  }

  static async updateInventory(req, res, next) {
    try {
      const { id } = req.params;

      const updatedProduct = await ProductModel.update(id, {
        ...req.body,
        updatedAt: new Date(),
      });
      if (!updatedProduct) {
        throw { name: "NotFound", message: "Product not found" };
      }

      res.status(200).json({
        message: `${updatedProduct.name} updated successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInventory(req, res, next) {
    try {
      const { id } = req.params;

      const deletedProduct = await ProductModel.delete(id);
      if (!deletedProduct) {
        throw { name: "NotFound", message: "Product not found" };
      }

      res.status(200).json({
        message: `${deletedProduct.name} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InventoryController;
