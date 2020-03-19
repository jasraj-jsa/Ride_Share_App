var express = require('express');
var router = express.Router();
var Count = require('../models/count');
/* GET home page. */
router.route('/')
    .get(function (req, res, next) {
    res.render('index', { title: 'Express' });
  });

module.exports = router;

