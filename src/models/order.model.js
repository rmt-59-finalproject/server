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

  static async postOrder(items, outletId) {
    try {
      const newItem = items.map(item => ({
        ...item,
        productId: new ObjectId(item.productId),
        checkedByDriver: false,
        driverCheckTime: null,
        checkedByOutlet: false,
        outletCheckTime: null
      }));

      await this.collection().insertOne({
        outletId: new ObjectId(outletId),
        driverId: null,
        status: 'requested',
        items: newItem,
        createdAt: new Date,
        updatedAt: new Date
      })

      return {
        message: 'Successfully create new order.'
      }
    } catch (error) {
      throw error;
    }
  }

  static async getOrderById(id) {
    try {
      const order = await this.collection().findOne({ _id: new ObjectId(id) });

      if (!order) {
        throw { name: 'NotFound', message: 'Order not found!' }
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  static async patchOrderStatus(id, status) {
    try {
      // "requested" | "approved" | "in_transit" | "delivered" | "completed"
      const order = await this.collection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status } },
        { returnDocument: 'after' }
      )

      return order;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OrderModel;