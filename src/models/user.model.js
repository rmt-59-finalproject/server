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
      const option = {};

      if (role) {
        option.role = role
      }

      const users = await this.collection().find(option, {
        projection: {
          password: 0,
          refresh_token: 0,
        }
      }).toArray();

      return users
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;