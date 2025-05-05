const { ObjectId } = require("mongodb");
const db = require("../config/mongodb");
const {
  productSchema,
  productUpdateSchema,
} = require("../validators/productSchema");

class ProductModel {
  static collection() {
    return db.collection("products");
  }

  static async getAll(search = "", page, limit) {
    try {
      let query = {};

      if (search.trim()) {
        const searchWords = search.trim().split(" ");

        query = {
          $and: searchWords.map((el) => ({
            name: {
              $regex: el,
              $options: "i",
            },
          })),
        };
      }

      const cursor = this.collection().find(query).sort({ updatedAt: -1 });

      const totalItems = await this.collection().countDocuments(query);

      if (page && limit) {
        const skip = (page - 1) * limit;
        const products = await cursor.skip(skip).limit(limit).toArray();

        const totalPages = Math.ceil(totalItems / limit);

        return {
          data: products,
          page,
          limit,
          totalItems,
          totalPages,
        };
      }

      const products = await cursor.toArray();
      return {
        totalItems,
        products: products,
      };
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

      const existingProduct = await this.collection().findOne({
        name: validatedProduct.name,
      });
      if (existingProduct) {
        throw { name: "Conflict", message: "This product already exists" };
      }

      await this.collection().insertOne(validatedProduct);

      return validatedProduct;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, product) {
    try {
      if (!ObjectId.isValid(id)) {
        throw { name: "InvalidId", message: "Invalid product ID" };
      }

      const validatedProduct = productUpdateSchema.parse(product);

      const result = await this.collection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: validatedProduct },
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
