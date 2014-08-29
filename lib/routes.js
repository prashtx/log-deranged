'use strict';

var async = require('async');
var express = require('express');

var papertrail = require('./papertrail');

var routes = module.exports = express.Router();

function handleError(error, req, res, next) {
  if (error) {
    console.log(error);
    res.status(500).end();
    return;
  }
  next();
}

routes.use(handleError);

routes.use('/papertrail', papertrail);

