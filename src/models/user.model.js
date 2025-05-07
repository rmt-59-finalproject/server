const db = require("../config/mongodb");
const { hashPassword, comparePassword } = require("../helpers/bcrypt");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../helpers/jwt");

class UserModel {
  static collection() {
    return db.collection("users");
  }

  static async createUser(username, password, name, role) {
    try {
      // Check if user already exists
      const user = await this.collection().findOne({ username });

      // If user already exists, throw an error
      if (user) {
        throw { name: "Conflict", message: "User already exists!" };
      }

      // Hash the password before saving
      const newUser = await this.collection().insertOne({
        username,
        password: hashPassword(password),
        role,
        name,
        refresh_token: null
      });

      return newUser;
    } catch (error) {
      throw error;
    }
  }

  static async login(username, password) {
    try {
      // Check if user exists
      const user = await this.collection().findOne({ username });

      // If user doesnt exist, throw an error
      if (!user) {
        throw { name: 'Unauthorized', message: 'Invalid username/password.' }
      }

      // Check if password valid
      const isValidPassword = comparePassword(password, user.password);

      // If password invalid, throw an error
      if (!isValidPassword) {
        throw { name: 'Unauthorized', message: 'Invalid username/password.' }
      }

      // Generate access and refresh tokens
      const access_token = signAccessToken({ id: user._id });
      const refresh_token = signRefreshToken({ id: user._id });

      // Update the user's refresh token in the database
      await this.collection().updateOne(
        { _id: user._id },
        { $set: { refresh_token } }
      );

      return {
        access_token,
        refresh_token,
        name: user.name,
        role: user.role
      };
    } catch (error) {
      throw error;
    }
  }

  static async checkToken(refresh_token) {
    try {
      // Check if user with the provided refresh token exists
      const user = await this.collection().findOne({ refresh_token });

      // If user does not exist, throw an error
      if (!user) {
        throw { name: "Unauthorized", message: "Invalid refresh token." };
      }

      // Verify the refresh token
      const payload = verifyRefreshToken(refresh_token);

      // If the refresh token is invalid, throw an error
      if (!payload) {
        throw { name: "Unauthorized", message: "Invalid refresh token." };
      }

      // Generate a new access token
      const access_token = signAccessToken({ id: payload.id });

      return {
        access_token,
        name: user.name,
        role: user.role,
        username: user.username
      }
    } catch (error) {
      throw error;
    }
  }

  static async logout(refresh_token) {
    try {
      // Check if the user with the provided refresh token exists
      const user = await this.collection().findOne({ refresh_token });

      // If user does not exist, throw an error
      if (!user) {
        throw { name: "Unauthorized", message: "Invalid refresh token." };
      }

      // Remove the refresh token from the database
      await this.collection().updateOne(
        { refresh_token },
        { $unset: { refresh_token: null } }
      );

      return {
        message: "User logout successfully!"
      };
    } catch (error) {
      throw error;
    }
  }

  static async getAllUsers(role) {
    try {
      const pipeline = [
        {
          $project: {
            refresh_token: 0,
            password: 0
          }
        }
      ];

      if (role) {
        pipeline.pop()

        pipeline.push(
          {
            $match: {
              role
            }
          },
          {
            $lookup: {
              from: "orders",
              localField: "_id",
              foreignField: `${role}Id`,
              as: "orders"
            }
          },
          {
            $unwind: {
              path: "$orders",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: "$_id",
              username: {
                $first: "$username"
              },
              name: {
                $first: "$name"
              },
              role: {
                $first: "$role"
              },
              requested: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$orders.status", "requested"]
                    },
                    1,
                    0
                  ]
                }
              },
              approved: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$orders.status", "approved"]
                    },
                    1,
                    0
                  ]
                }
              },
              in_transit: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$orders.status",
                        "in_transit"
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              delivered: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$orders.status", "delivered"]
                    },
                    1,
                    0
                  ]
                }
              },
              completed: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$orders.status", "completed"]
                    },
                    1,
                    0
                  ]
                }
              },
              rejected: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$orders.status", "rejected"]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              username: 1,
              name: 1,
              role: 1,
              statistics: {
                $cond: [
                  {
                    $eq: ["$role", "outlet"]
                  },
                  {
                    requested: "$requested",
                    approved: "$approved",
                    completed: "$completed",
                    rejected: "$rejected"
                  },
                  {
                    approved: "$approved",
                    in_transit: "$in_transit",
                    delivered: "$delivered",
                    rejected: "$rejected"
                  }
                ]
              }
            }
          }
        )
      }

      const users = await this.collection().aggregate(pipeline).toArray();

      return users
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;