'use strict';

var http = require('http');
var https = require('https');

var bodyParser = require('body-parser');
var express = require('express');
var logfmt = require('logfmt');
var logger = require('morgan');

var config = require('./config');
var routes = require('./routes');

http.globalAgent.maxSockets = 100;
https.globalAgent.maxSockets = 100;

var app = express();

app.set('port', config.port);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({ type: 'application/logplex-1' }));

app.use(routes);

app.listen(app.get('port'), function () {
  logfmt.log({ listening: true, port: app.get('port') });
});
