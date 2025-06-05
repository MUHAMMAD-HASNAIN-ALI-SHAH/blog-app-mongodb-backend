const express = require('express');
const { login, verify, logout, register } = require('../controllers/user.controller');
const { protectedRoute } = require('../middlewares/auth.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(loginValidator,login);
router.route('/verify').get(protectedRoute,verify);
router.route('/logout').get(logout);

module.exports = router;
