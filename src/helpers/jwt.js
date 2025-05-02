const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

function signAccessToken(payload) {
  // This function signs the access token using the secret key and sets an expiration time of 8 hours
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
}

function signRefreshToken(payload) {
  // This function signs the refresh token using the secret key and sets an expiration time of 1 day
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
}

function verifyAccessToken(token) {
  // This function verifies the access token using the secret key
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(token) {
  // This function verifies the refresh token using the secret key
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
}