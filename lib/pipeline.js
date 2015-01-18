'use strict';

var _ = require('lodash');
var logfmt = require('logfmt');
var Promise = require('bluebird');

var config = require('./config');
var librato = require('./librato');
var statHat = require('./stathat');

var pipeline = module.exports;

function filterStr(test, pipeDef, logs) {
  return process(pipeDef, _.filter(logs, function (log) {
    return log.message.indexOf(test) > -1;
  }));
}

function filterRE(pattern, flags, pipeDef, logs) {
  if (logs === undefined) {
    logs = pipeDef;
    pipeDef = flags;
    flags = undefined;
  }

  var re = new RegExp(pattern, flags);

  return process(pipeDef, _.filter(logs, function (log) {
    return re.test(log.message);
  }));
}

function parseLogFmt(pipeDef, logs) {
  _.each(logs, function (log) {
    log.parsed = logfmt.parse(log.message);
  });
  return process(pipeDef, logs);
}

function split(arr, logs) {
  return Promise.map(arr, function (item) {
    return process(item, logs);
  });
}

function sendLibratoGauge(user, token, gaugeDefs, logs) {
  var gauges = _.map(gaugeDefs, function (def) {
    return _.map(logs, function (log) {
      var time = log.time.getTime();
      var now = Date.now();
      if (now - time > 60000) {
        time = now;
      }
      return {
        source: _.template(def[0])(log),
        name: def[1],
        value: _.template(def[2])(log),
        measure_time: Math.round(time / 1000)
      };
    });
  });

  return librato.sendGauges({
    user: user,
    token: token,
    gauges: _.flatten(gauges, true)
  });
}

function sendLibratoCounter(user, token, defs, logs) {
  var len = logs.length;
  var time = logs[len - 1].time.getTime();
  var now = Date.now();
  if (now - time > 60000) {
    time = now;
  }
  var ts = Math.round(time / 1000);
  var counters = _.map(defs, function (def) {
    return {
      source: def[0],
      name: def[1],
      value: logs.length,
      measure_time: ts
    };
  });

  return librato.sendCounters({
    user: user,
    token: token,
    counters: counters
  });
}

function sendStatHatValue(key, stat, template, logs) {
  return Promise.map(logs, function (log) {
    var ts = log.time.getTime() / 1000;
    return statHat.send({
      key: key,
      stat: stat,
      time: ts,
      value: _.template(template)(log)
    });
  });
}

function sendStatHatCount(key, stat, logs) {
  var len = logs.length;
  var ts = logs[len - 1].time.getTime() / 1000;
    return statHat.send({
      key: key,
      stat: stat,
      time: ts,
      count: len
    });
}

var actions = {
  "filter": filterStr,
  "filter-re": filterRE,
  "parse-logfmt": parseLogFmt,
  "split": split,
  "librato-value": sendLibratoGauge,
  "librato-count": sendLibratoCounter,
  "stathat-value": sendStatHatValue,
  "stathat-count": sendStatHatCount
};

function process(pipeDef, logs) {
  if (logs.length === 0) {
    return;
  }
  var action = actions[pipeDef[0]];
  var args = pipeDef.slice(1);
  args.push(logs);
  return action.apply(null, args);
}

pipeline.post = function post(req, res) {
  var pipeDef = [];
  Promise.try(function () {
    // Parse the definition
    if (req.query.key) {
      pipeDef = config.pipeDefs[req.query.key];
    } else if (req.query.def) {
      pipeDef = JSON.parse(decodeURIComponent(req.query.def));
    }
    return req.body;
  }).then(function (logs) {
    // Process the set of syslog messages in req.body
    return process(pipeDef, logs);
  }).then(function () {
    res.status(201).end();
  }).catch(function (error) {
    console.log(error);
    console.log(error.stack);
    res.status(500).end();
  });
};
