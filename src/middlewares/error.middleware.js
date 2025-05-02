function errorMiddleware(error, req, res, next) {
  console.log(error, '<<<<')

  if (error.name === 'NotFound') {
    return res.status(404).json({ message: error.message });
  }

  if (error.name === "Forbidden") {
    return res.status(403).json({ message: error.message });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token." });
  }

  if (error.name === 'BadRequest') {
    return res.status(400).json({ message: error.message })
  }

  if (error.name === 'Unauthorized') {
    return res.status(401).json({ message: error.message })
  }
  
  if (error.name === 'Conflict') {
    return res.status(409).json({ message: error.message })
  }

  if (error.name === 'InternalServerError') {
    return res.status(500).json({ message: error.message })
  }

  res.status(500).json({ message: 'Internal server error.' });
}

module.exports = errorMiddleware;