const db = require("../config/mongodb");
const { hashPassword, comparePassword } = require("../helpers/bcrypt");
const { signAccessToken, signRefreshToken } = require("../helpers/jwt");

class UserModel {
  static collection() {
    return db.collection("users");
  }

  static async createUser(username, password, role) {
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
      console.log(refresh_token)

      // Update the user's refresh token in the database
      await this.collection().updateOne(
        { _id: user._id },
        { $set: { refresh_token } }
      );

      return {
        access_token,
        refresh_token,
        role: user.role
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;