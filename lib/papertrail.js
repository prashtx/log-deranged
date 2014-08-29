'use strict';

var express = require('express');

var librato = require('./librato');

var routes = module.exports = express.Router();

function papertrailParser(req, res, next) {
  try {
    req.body.payload = JSON.parse(req.body.payload);
  } catch (e) {
    console.log('error parsing papertrail payload');
    console.log(e);
    res.status(500).end();
    return;
  }
  next();
}

routes.use(papertrailParser);

function parsePapertrailPG(message) {
  var data = {};
  var pieces = message.split(' ');
  pieces.forEach(function (item) {
    var kv = item.split('=');
    data[kv[0]] = kv[1];
  });
  return data;
}

routes.post('/pgsample/librato', function (req, res, next) {
  var gauges = req.body.payload.events.map(function (event) {
    var data = parsePapertrailPG(event.message);
    var ts = Math.floor(Date.parse(event.received_at) / 1000);
    return {
      source: 'pg-production',
      name: 'table_cache_hit_rate',
      value: data['sample#table-cache-hit-rate'],
      measure_time: ts
    };
  });
  librato.send(gauges, function (error) {
    if (error) { return next(error); }
    res.status(200).end();
  });
});

routes.post('/memory/librato', function (req, res, next) {
  var prefix = req.query.name || 'unknown';
  var gauges = [];
  var events = req.body.payload.events;
  var data;
  var ts;
  var event;
  var i;
  for (i = 0; i < events.length; i += 1) {
    event = events[i];
    data = parsePapertrailPG(event.message);
    ts = Math.floor(Date.parse(event.received_at) / 1000);
    gauges[2*i] = {
      source: data.source,
      name: prefix + '_memory_total',
      value: data['sample#memory_total'].slice(0,-2),
      measure_time: ts
    };
    gauges[2*i + 1] = {
      source: data.source,
      name: prefix + '_memory_rss',
      value: data['sample#memory_rss'].slice(0,-2),
      measure_time: ts
    };
  }
  librato.send(gauges, function (error) {
    if (error) { return next(error); }
    res.status(200).end();
  });
});
