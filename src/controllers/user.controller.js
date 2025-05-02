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

  static async login(req, res, next) {
    try {
      // Extract data from request body
      const { username, password } = req.body;

      // Validate input data
      if (!username || !password) {
        throw { name: 'BadRequest', message: 'All fields are required!' };
      }

      // Extract token & role if user successfully login
      const { access_token, refresh_token, role } = await UserModel.login(username, password);

      // Send access_token via cookie that expires in 8 hours
      res.cookie('access_token', `Bearer ${access_token}`, {
        httpOnly: true,
        secure: true,
        maxAge: 8 * 60 * 60 * 1000
      });
      
      // Send refresh_token via cookie that expires in 1 day
      res.cookie('refresh_token', `Bearer ${refresh_token}`, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        message: 'User login successfully!',
        data: {
          username,
          role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkToken(req, res, next) {
    try {
      // Check if the access token is present in the request headers
      const { refresh_token } = req.user;

      // If the access token is not present, throw an error
      if (!refresh_token) {
        throw { name: "BadRequest", message: "Please login first!" };
      }

      // Check if the refresh token is valid
      const { access_token } = await UserModel.checkToken(refresh_token);

      // Set the access token in the response cookies
      res.cookie('access_token', `Bearer ${access_token}`, {
        httpOnly: true,
        secure: true,
        maxAge: 8 * 60 * 60 * 1000
      });

      res.status(200).json({
        message: "Token is valid.",
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // Check if the refresh token is present in the request headers
      const { refresh_token } = req.user;

      // If the refresh token is not present, throw an error
      if (!refresh_token) {
        throw { name: "BadRequest", message: "Please login first!" };
      }

      // Check if the refresh token is valid
      const result = await UserModel.logout(refresh_token);

      // Clear the cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.status(200).json({
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;