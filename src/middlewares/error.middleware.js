const { ZodError } = require("zod");

function errorMiddleware(error, req, res, next) {
  console.log(error, "<<<< error");

  if (error.name === "NotFound") {
    return res.status(404).json({ message: error.message });
  }

  if (error.name === "Forbidden") {
    return res.status(403).json({ message: error.message });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token." });
  }

  if (error.name === "BadRequest") {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "BSONError") {
    return res.status(400).json({ message: "Invalid ID." });
  }

  if (error.name === "Unauthorized") {
    return res.status(401).json({ message: error.message });
  }

  if (error.name === "Conflict") {
    return res.status(409).json({ message: error.message });
  }

  if (error instanceof ZodError) {
    const messages = error.errors.map((err) => {
      const path = err.path[0];
      const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
      return `${capitalize(path)}: ${err.message.toLowerCase()}`;
    });

    return res.status(400).json({ message: messages.join(", ") });
  }

  if (error.name === "InvalidId") {
    return res.status(400).json({ message: error.message });
  }

  if (error.name === "InternalServerError") {
    return res.status(500).json({ message: error.message });
  }

  res.status(500).json({ message: "Internal server error." });
}

module.exports = errorMiddleware;
