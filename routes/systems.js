module.exports = require('express').Router();

module.exports.get('/', function(req, res, next) {
  res.send(require('../public/data/system.json'));
});
