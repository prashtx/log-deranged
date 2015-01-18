'use strict';

var logfmt = require('logfmt');
var Promise = require('bluebird');
var request = require('request');

var url = 'https://metrics-api.librato.com/v1/metrics';

Promise.promisifyAll(request);

exports.send = function send(user, token, data) {
  return request.postAsync({
    url: url,
    auth: {
      user: user,
      password: token
    },
    json: data
  }).spread(function (response, body) {
    if (response.statusCode !== 200) {
      logfmt.log({
        sink: 'librato',
        status: response.statusCode,
        body: JSON.stringify(body)
      });
    } else {
      logfmt.log({
        sink: 'librato',
        status: response.statusCode
      });
    }
  });
};

exports.sendGauges = function sendGauges(data) {
  return exports.send(data.user, data.token, {
    gauges: data.gauges
  });
};

exports.sendCounters = function sendCounters(data) {
  return exports.send(data.user, data.token, {
    counters: data.counters
  });
};
