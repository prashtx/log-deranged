'use strict';

var express = require('express');
var logfmt = require('logfmt');
var parser = require('glossy').Parse;

var pipeline = require('./pipeline');

var routes = module.exports = express.Router();

function handleError(error, req, res, next) {
  if (error) {
    console.log(error);
    res.status(500).end();
    return;
  }
  next();
}

function syslogParser(req, res, next) {
  var body = req.body;
  var len;
  var logs = [];
  var start = 0;
  var i;
  var line;
  try {
    var done = false;
    while (!done) {
      i = body.indexOf(' ', start);
      line = null;
      if (i > -1) {
        len = parseInt(body.substring(start, i), 10);
        line = body.substr(i + 1, len);
        start = i + len + 1;
        if (line !== '') {
          logs.push(parser.parse(line));
        }
      }
      if (i === -1 || start >= body.length) {
        done = true;
      }
    }
    logfmt.log({ parsed: true, fmt: 'logplex-1', lines: logs.length });
    req.body = logs;
    next();
  } catch (error) {
    next(error);
  }
}


routes.use(handleError);

routes.use('/drain', syslogParser);

routes.post('/drain/pipeline', pipeline.post);
