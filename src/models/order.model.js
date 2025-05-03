const db = require("../config/mongodb");

class OrderModel {
  static collection() {
    return db.collection("orders");
  }

  static async getAllOrders() {
    try {
      const data = await this.collection().find({}).toArray();

      return data
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OrderModel;