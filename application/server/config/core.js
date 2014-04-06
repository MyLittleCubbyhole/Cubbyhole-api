var config = {}
,	_ = require('lodash')
,	baseConfig = require(global.paths.server + '/config/jsons/config.json')
,	envConfig = require(global.paths.server + '/config/jsons/' + global.configFile)
,	extended;

config.init = function() { 
	extended = _.merge(baseConfig, envConfig);
	return extended;
}
config.get = function() { return extended; }

module.exports = config;