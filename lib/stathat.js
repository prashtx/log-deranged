'use strict';

var logfmt = require('logfmt');
var Promise = require('bluebird');
var request = require('request');

Promise.promisifyAll(request);

exports.send = function send(options) {
  var data = {
    ezkey: options.key,
    stat: options.stat,
    t: options.time
  };

  if (options.value !== undefined) {
    data.value = options.value;
  } else {
    data.count = options.count;
  }

  return request.postAsync({
    url: 'http://api.stathat.com/ez',
    form: data
  }).spread(function (response, body) {
    logfmt.log({
      sink: 'stathat',
      status: response.statusCode
    });
  });
};
