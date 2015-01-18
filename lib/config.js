'use strict';

var config = module.exports;

config.port = process.env.PORT || 3000;

config.pipeDefs = JSON.parse(process.env.PIPE_DEFS);
