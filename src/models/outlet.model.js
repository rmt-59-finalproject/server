const { ObjectId } = require("mongodb");
const db = require("../config/mongodb");

class OutletModel {
  static collection() {
    return db.collection("orders");
  }

  static async getAllOrders(outletId, status) {
    try {
      const matchStage = {
        outletId: new ObjectId(outletId),
      };
      if (status) matchStage.status = status;

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: "users",
            localField: "driverId",
            foreignField: "_id",
            as: "driver",
          },
        },
        {
          $unwind: "$driver",
        },
        {
          $lookup: {
            from: "users",
            localField: "outletId",
            foreignField: "_id",
            as: "outlet",
          },
        },
        { $unwind: "$outlet" },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "items.product",
          },
        },
        { $unwind: "$items.product" },
        {
          $group: {
            _id: "$_id",
            'orderId': {
              '$first': '$orderId'
            },
            driver: { $first: "$driver" },
            outlet: { $first: "$outlet" },
            status: { $first: "$status" },
            items: {
              $push: {
                _id: "$items.product._id",
                name: "$items.product.name",
                quantity: "$items.quantity",
                unit: "$items.product.unit",
                category: "$items.product.category",
                checkedByDriver: "$items.checkedByDriver",
                driverCheckTime: "$items.driverCheckTime",
                checkedByOutlet: "$items.checkedByOutlet",
                outletCheckTime: "$items.outletCheckTime",
              },
            },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
          },
        },
        {
          $project: {
            "driver.password": 0,
            "driver.refresh_token": 0,
            "outlet.password": 0,
            "outlet.refresh_token": 0,
          },
        },
      ];

      return await this.collection().aggregate(pipeline).toArray();
    } catch (error) {
      throw error;
    }
  }

  static async getOrderById(outletId, id) {
    try {
      const [result] = await this.collection()
        .aggregate([
          {
            $match: {
              outletId: new ObjectId(outletId),
            },
          },
          {
            $match: {
              _id: new ObjectId(id),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "driverId",
              foreignField: "_id",
              as: "driver",
            },
          },
          {
            $unwind: "$driver",
          },
          {
            $lookup: {
              from: "users",
              localField: "outletId",
              foreignField: "_id",
              as: "outlet",
            },
          },
          { $unwind: "$outlet" },
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.productId",
              foreignField: "_id",
              as: "items.product",
            },
          },
          { $unwind: "$items.product" },
          {
            $group: {
              _id: "$_id",
              'orderId': {
                '$first': '$orderId'
              },
              driver: { $first: "$driver" },
              outlet: { $first: "$outlet" },
              status: { $first: "$status" },
              items: {
                $push: {
                  _id: "$items.product._id",
                  name: "$items.product.name",
                  quantity: "$items.quantity",
                  unit: "$items.product.unit",
                  category: "$items.product.category",
                  checkedByDriver: "$items.checkedByDriver",
                  driverCheckTime: "$items.driverCheckTime",
                  checkedByOutlet: "$items.checkedByOutlet",
                  outletCheckTime: "$items.outletCheckTime",
                },
              },
              createdAt: { $first: "$createdAt" },
              updatedAt: { $first: "$updatedAt" },
            },
          },
          {
            $project: {
              "driver.password": 0,
              "driver.refresh_token": 0,
              "outlet.password": 0,
              "outlet.refresh_token": 0,
            },
          },
        ])
        .toArray();

      if (!result) throw { name: "NotFound", message: "Order not found" };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateItemStatus(outletId, orderId, productId, status) {
    try {
      const order = await this.collection().findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
          outletId: new ObjectId(outletId),
          "items.productId": new ObjectId(productId),
        },
        {
          $set: {
            "items.$.checkedByDriver": status === "true" ? true : false,
            "items.$.outletCheckTime": new Date(),
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      if (!order) {
        throw {
          name: "NotFound",
          message: "Order not found or item not in order.",
        };
      }

      const item = await db
        .collection("products")
        .findOne({ _id: new ObjectId(productId) });

      return {
        quantity: order.items.find((item) =>
          item.productId.equals(new ObjectId(productId))
        )?.quantity,
        name: item.name,
        unit: item.unit,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OutletModel;
