var express = require('express');
var router = express.Router();
const sequelize = require('../config/db');
const User = require('../models/User');

/* /users */
router.get('/', async function(req, res, next) {
  try {
    const users = await User.findAll();
    res.render('users', { users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
