const db = require("../config/mongodb");
const { hashPassword } = require("../helpers/bcrypt");

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
      });

      return newUser;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;