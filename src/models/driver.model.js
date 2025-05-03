const { ObjectId } = require("mongodb");
const db = require("../config/mongodb");

class DriverModel {
  static collection() {
    return db.collection("orders");
  }

  static async getAllOrders(id) {
    try {
      const order = await this.collection().aggregate(
        [
          {
            '$match': {
              'driverId': new ObjectId(id)
            }
          }, {
            '$lookup': {
              'from': 'users',
              'localField': 'driverId',
              'foreignField': '_id',
              'as': 'driver'
            }
          }, {
            '$unwind': '$driver'
          }, {
            '$lookup': {
              'from': 'users',
              'localField': 'outletId',
              'foreignField': '_id',
              'as': 'outlet'
            }
          }, {
            '$unwind': '$outlet'
          }, {
            '$unwind': '$items'
          }, {
            '$lookup': {
              'from': 'products',
              'localField': 'items.productId',
              'foreignField': '_id',
              'as': 'items.product'
            }
          }, {
            '$unwind': '$items.product'
          }, {
            '$group': {
              '_id': '$_id',
              'driver': {
                '$first': '$driver'
              },
              'outlet': {
                '$first': '$outlet'
              },
              'status': {
                '$first': '$status'
              },
              'items': {
                '$push': {
                  'name': '$items.product.name',
                  'quantity': '$items.quantity',
                  'unit': '$items.product.unit',
                  'category': '$items.product.category',
                  'checkedByDriver': '$items.checkedByDriver',
                  'driverCheckTime': '$items.driverCheckTime',
                  'checkedByOutlet': '$items.checkedByOutlet',
                  'outletCheckTime': '$items.outletCheckTime'
                }
              },
              'createdAt': {
                '$first': '$createdAt'
              },
              'updatedAt': {
                '$first': '$updatedAt'
              }
            }
          }, {
            '$project': {
              'driver.password': 0,
              'driver.refresh_token': 0,
              'outlet.password': 0,
              'outlet.refresh_token': 0
            }
          }
        ]
      ).toArray();

      if (order.length === 0) {
        throw { name: 'NotFound', message: 'Order not found!' }
      }

      return order;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DriverModel;