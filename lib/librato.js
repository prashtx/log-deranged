'use strict';

var util = require('util');
var request = require('request');

var config = require('./config');

var url = 'https://metrics-api.librato.com/v1/metrics';

exports.send = function send(data, done) {
  var d = data;
  if (!util.isArray(data)) {
    d = [data];
  }
  request.post({
    url: url,
    auth: {
      user: config.libratoUser,
      password: config.libratoPassword
    },
    form: {
      gauges: d
    }
  }, function (error, response, body) {
    if (error) {
      console.log(error);
      done(error);
      return;
    }
    if (response.statusCode !== 200) {
      console.log('Got status ' + response.statusCode + ' from Librato.');
      console.log(body);
    }
    done(error);
  });
};
