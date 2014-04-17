var config = {}
,	_ = require('lodash')
,	baseConfig = require(global.paths.server + '/config/jsons/config.json')
,	envConfig = require(global.paths.server + '/config/jsons/' + global.configFile.env)
,	developerConfig = global.configFile.developer != '' ? require(global.paths.server + '/config/jsons/' + global.configFile.developer) : ''
,	extended;

config.init = function() { 
	extended = _.merge(baseConfig, envConfig);
	if(developerConfig != '')
		extended = _.merge(extended, developerConfig);

	return extended;
}
config.get = function() { return extended; }

module.exports = config;