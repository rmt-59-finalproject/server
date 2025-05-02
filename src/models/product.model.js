const { ObjectId } = require("mongodb");
const db = require("../config/mongodb");
const productSchema = require("../validators/productSchema");

class ProductModel {
  static collection() {
    return db.collection("products");
  }

  static async getAll() {
    try {
      const products = await this.collection()
        .find()
        .sort({ updatedAt: -1 })
        .toArray();

      return products;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      if (!ObjectId.isValid(id)) {
        throw { name: "InvalidId", message: "Invalid product ID" };
      }

      const product = await this.collection().findOne({
        _id: new ObjectId(id),
      });

      if (!product) {
        throw { name: "NotFound", message: "Product not found" };
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  static async create(product) {
    try {
      const validatedProduct = productSchema.parse(product);

      const result = await this.collection().insertOne(validatedProduct);

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, product) {
    try {
      if (!ObjectId.isValid(id)) {
        throw { name: "InvalidId", message: "Invalid product ID" };
      }

      const result = await this.collection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: product },
        { returnDocument: "after" }
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      if (!ObjectId.isValid(id)) {
        throw { name: "InvalidId", message: "Invalid product ID" };
      }

      const result = await this.collection().findOneAndDelete(
        { _id: new ObjectId(id) },
        { returnDocument: "after" }
      );

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductModel;
