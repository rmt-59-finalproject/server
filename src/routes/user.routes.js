const UserController = require('../controllers/user.controller');
const { authentication, authWarehouse } = require('../middlewares/auth.middleware');
const user = require('express').Router();

user.post('/register', authentication, authWarehouse, UserController.register);
user.post('/login', UserController.login);
user.get('/login', authentication, UserController.checkToken);
user.get('/logout', authentication, UserController.logout);

module.exports = user;