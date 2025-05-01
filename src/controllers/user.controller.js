const UserModel = require("../models/user.model");

class UserController {
  static async register(req, res, next) {
    try {
      // Extract data from request body
      const { username, password, role } = req.body;

      // Validate input data
      if (!username || !password || !role) {
        throw { name: 'BadRequest', message: 'All fields are required!' };
      }

      await UserModel.createUser(username, password, role);

      res.status(201).json({
        message: `User with role ${role} created successfully!`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;