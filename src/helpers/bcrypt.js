const bcrypt = require('bcrypt');

function hashPassword(password) {
  // Generate a salt
  const salt = bcrypt.genSaltSync(10);

  // Return hashed password
  return bcrypt.hashSync(password, salt);
}

function comparePassword(password, hashedPassword) {
  // Compare the provided password with the hashed password
  return bcrypt.compareSync(password, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword
}