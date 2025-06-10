const { ObjectId } = require("mongodb");
const db = require("../config/mongodb");
const { verifyAccessToken } = require("../helpers/jwt");

async function authentication(req, res, next) {
  try {
    // Ensure cookies are defined
    if (!req.cookies || typeof req.cookies !== "object") {
      throw {
        name: "Unauthorized",
        message: "Cookies are not properly parsed.",
      };
    }
    console.log(req.cookies);
    // Extract access token from cookie
    const { access_token } = req.cookies;

    // If access token doesnt exist, throw an error
    if (!access_token) {
      console.log("access token gaada");
      throw { name: "Unauthorized", message: "Invalid token." };
    }

    // Get auth type & token
    const [bearer, token] = access_token.split(" ");

    // If auth type is not Bearer OR token is not provided, throw an error
    if (bearer !== "Bearer" || !token) {
      throw { name: "Unauthorized", message: "Invalid token." };
    }

    // Get token payload
    const { id } = verifyAccessToken(token);

    // Find user based on payload
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    // If user doesnt exist, throw an error
    if (!user) {
      throw { name: "Unauthorized", message: "Invalid token." };
    }

    req.user = {
      id: user._id,
      role: user.role,
      refresh_token: user.refresh_token,
    };

    next();
  } catch (error) {
    next(error);
  }
}

async function authWarehouse(req, res, next) {
  try {
    if (req.user.role !== "warehouse") {
      throw {
        name: "Forbidden",
        message: "You are not authorized to access this resource.",
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}

async function authOutlet(req, res, next) {
  try {
    if (req.user.role !== "outlet" && req.user.role !== "warehouse") {
      throw {
        name: "Forbidden",
        message: "You are not authorized to access this resource.",
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}

async function authDriver(req, res, next) {
  try {
    if (req.user.role !== "driver" && req.user.role !== "warehouse") {
      throw {
        name: "Forbidden",
        message: "You are not authorized to access this resource.",
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authentication,
  authWarehouse,
  authDriver,
  authOutlet,
};
