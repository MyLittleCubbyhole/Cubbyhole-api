/*Behaviour requiring*/

	var KantoBehaviours = require('kanto-patterns')._behaviours;
/*Services requiring*/

	var _ = require('lodash'),
		path = require('path');

/*Class declaration*/

	class ConfigAggregator {}

/*Behaviour injections*/

	KantoBehaviours.logger.injectTo(ConfigAggregator);

/*Static methods declarations*/

	ConfigAggregator.aggregate = aggregate;
	ConfigAggregator.resolve = resolve;

module.exports = ConfigAggregator;

/*Static methods definitions*/

	function aggregate(prefix = 'config', target = '_') {
		var configJson, envConfig, devConfig = {},
			envPkgDeveloper = process.env.npm_package_config_developer,
			envPkgEnvironment = process.env.npm_package_config_env,
			configPath = path.normalize(global.paths.app + '/configs/' + prefix + '.json'),
			envConfigPath = path.normalize(global.paths.app + '/configs/' + prefix + '.' + envPkgEnvironment + '.json'),
			devConfigPath = path.normalize(global.paths.app + '/configs/' + prefix + '.' + envPkgDeveloper + '.json');

		try {
			configJson = require(configPath);
		}
		catch(exception) {
            this.error('No ' + prefix + ' file found', {path: envConfigPath});
			throw Error('server configuration not found');
		}

		if(envPkgEnvironment !== '')
			try {
				envConfig = require(envConfigPath);
				if(envPkgEnvironment === 'prod')
					this.resolve(envConfig);
			}
			catch(exception) {
				envConfig = {};
				this.log('warning', 'No ' + prefix + ' file found for the given environment name', {path: envConfigPath});
			}

		if(envPkgDeveloper !== '')
			try {
				devConfig = require(devConfigPath);
			}
			catch(exception) {
				devConfig = {};
				this.log('warning', 'No ' + prefix + ' file found for the given developer name', {path: devConfigPath});
			}

		_.merge(configJson, envConfig, devConfig);

		global[target] = configJson;

	}

	function resolve(node) {
		for(var prop in node) {
			if(node[prop] instanceof Object)
				this.resolve(node[prop]);
			else
				node[prop] = process.env[node[prop]] || node[prop];
		}
	}

