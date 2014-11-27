var http = require('http'),
	express = require('express'),
    debug = require('debug')('chikorita:app');

var app = express(),
	server = http.Server(app);

require(__dirname + '/constantLoader').init();
require(__dirname + '/configLoader').init();
require(__dirname + '/appKernel').init(app, server);

server.listen(global.config.server.port, process.env.npm_package_config_address, function() {
	debug(
		'Server %s listening on %s:%d in %s mode - [%s]',
		global.config.server.version,
		this.address().address,
		this.address().port,
		process.env.npm_package_config_env || 'no env',
		process.env.npm_package_config_developer || 'unknown developer'
	);
});

module.exports = { app: app, server: server };