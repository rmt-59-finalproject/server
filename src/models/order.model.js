const { ObjectId } = require("mongodb");
const db = require("../config/mongodb");

class OrderModel {
  static collection() {
    return db.collection("orders");
  }

  static async getAllOrders(status) {
    try {
      const pipeline = [
        {
          $lookup: {
            from: "users",
            localField: "driverId",
            foreignField: "_id",
            as: "driver",
          },
        },
        {
          $unwind: {
            path: "$driver",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "outletId",
            foreignField: "_id",
            as: "outlet",
          },
        },
        {
          $unwind: "$outlet",
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "items.product",
          },
        },
        {
          $unwind: "$items.product",
        },
        {
          $group: {
            _id: "$_id",
            driver: {
              $first: "$driver",
            },
            outlet: {
              $first: "$outlet",
            },
            status: {
              $first: "$status",
            },
            notes: {
              $first: "$notes",
            },
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
            createdAt: {
              $first: "$createdAt",
            },
            updatedAt: {
              $first: "$updatedAt",
            },
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

      // Add the $match stage only if status is provided
      if (status) {
        pipeline.splice(11, 0, {
          $match: {
            status: status,
          },
        });
      }

      const data = await this.collection().aggregate(pipeline).toArray();

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async postOrder(items, outletId) {
    try {
      const newItem = items.map((item) => ({
        ...item,
        productId: new ObjectId(item.productId),
        checkedByDriver: false,
        driverCheckTime: null,
        checkedByOutlet: false,
        outletCheckTime: null,
      }));

      await this.collection().insertOne({
        outletId: new ObjectId(outletId),
        driverId: null,
        notes: "",
        status: "requested",
        items: newItem,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        message: "Successfully create new order.",
      };
    } catch (error) {
      throw error;
    }
  }

  static async getOrderById(id) {
    try {
      const order = await this.collection()
        .aggregate([
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
          {
            $unwind: "$outlet",
          },
          {
            $unwind: "$items",
          },
          {
            $lookup: {
              from: "products",
              localField: "items.productId",
              foreignField: "_id",
              as: "items.product",
            },
          },
          {
            $unwind: "$items.product",
          },
          {
            $group: {
              _id: "$_id",
              driver: {
                $first: "$driver",
              },
              outlet: {
                $first: "$outlet",
              },
              status: {
                $first: "$status",
              },
              notes: {
                $first: "$notes",
              },
              createdAt: {
                $first: "$createdAt",
              },
              updatedAt: {
                $first: "$updatedAt",
              },
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

      if (order.length === 0) {
        throw { name: "NotFound", message: "Order not found!" };
      }

      return order[0];
    } catch (error) {
      throw error;
    }
  }

  static async patchOrderStatus(id, status, notes) {
    try {
      // "requested" | "approved" | "in_transit" | "delivered" | "completed" | "rejected"
      const order = await this.collection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status, notes, updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!order) {
        throw { name: "NotFound", message: "Order not found!" };
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  static async patchOrderDriver(id, driverId) {
    try {
      const driver = await db
        .collection("users")
        .findOne({ _id: new ObjectId(driverId) });
      if (!driver) {
        throw { name: "NotFound", message: "Driver not found!" };
      }

      const order = await this.collection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { driverId: new ObjectId(driverId), updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!order) {
        throw { name: "NotFound", message: "Order not found!" };
      }

      return {
        driver,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = OrderModel;
