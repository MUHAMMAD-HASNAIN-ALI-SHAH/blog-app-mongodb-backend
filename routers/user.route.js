const express = require('express');
const { login, verify, logout, getCode, register } = require('../controllers/user.controller');
const { protectedRoute } = require('../middlewares/auth.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const router = express.Router();

router.route('/get-code').post(registerValidator,getCode);
router.route('/register').post(register);
router.route('/login').post(loginValidator,login);
router.route('/verify').get(protectedRoute,verify);
router.route('/logout').get(logout);

module.exports = router;
