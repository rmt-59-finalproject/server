const { ObjectId } = require("mongodb");
const db = require("../config/mongodb");

class DriverModel {
  static collection() {
    return db.collection("orders");
  }

  static async getAllOrders(driverId, status) {
    try {
      const pipeline = [
        {
          '$match': {
            'driverId': new ObjectId(driverId)
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
      ];

      // Add the $match stage only if status is provided
      if (status) {
        pipeline.splice(11, 0, {
          '$match': {
            'status': status
          }
        });
      }

      const order = await this.collection().aggregate(pipeline).toArray();

      if (order.length === 0) {
        throw { name: 'NotFound', message: 'Order not found!' }
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  static async getOrdersById(driverId, id) {
    try {
      const order = await this.collection().aggregate(
        [
          {
            '$match': {
              'driverId': new ObjectId(driverId)
            }
          }, {
            '$match': {
              '_id': new ObjectId(id)
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
              'createdAt': {
                '$first': '$createdAt'
              },
              'updatedAt': {
                '$first': '$updatedAt'
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

      return order[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DriverModel;