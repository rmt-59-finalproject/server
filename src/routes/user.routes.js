const UserController = require('../controllers/user.controller');
const user = require('express').Router();

user.post('/register', UserController.register);
user.post('/login', UserController.login);

module.exports = user;