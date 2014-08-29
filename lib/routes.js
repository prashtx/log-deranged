'use strict';

var async = require('async');
var express = require('express');

var librato = require('./librato');

var routes = module.exports = express.Router();

var papertrail = express.Router();
routes.use('/papertrail', papertrail);

function parsePapertrailPG(message) {
  var data = {};
  var pieces = message.split(' ');
  pieces.forEach(function (item) {
    var kv = item.split('=');
    data[kv[0]] = kv[1];
  });
  return data;
}

papertrail.post('/pgsample/librato', function (req, res, next) {
  var payload;
  try {
    payload = JSON.parse(req.body.payload);
  } catch (e) {
    console.log('error parsing papertrail payload');
    console.log(e);
    res.status(200).end();
    return;
  }

  async.each(payload.events, function (event, next) {
    var data = parsePapertrailPG(event.message);
    var ts = Math.floor((new Date(event.received_at).getTime()) / 1000);
    librato.send({
      source: 'pg-production',
      name: 'table_cache_hit_rate',
      value: data['sample#table-cache-hit-rate'],
      measure_time: ts
    }, next);
  }, function (error) {
    if (error) {
      console.log('error sending data to librato');
      console.log(error);
      res.status(500).end();
      return;
    }
    res.status(200).end();
  });
});
