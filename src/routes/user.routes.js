const UserController = require('../controllers/user.controller');

const user = require('express').Router();

user.post('/register', UserController.register);

module.exports = user;