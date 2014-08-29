'use strict';

var config = module.exports;

config.port = process.env.PORT || 3000;

config.libratoUser = process.env.LIBRATO_USER;
config.libratoPassword = process.env.LIBRATO_PASSWORD;
