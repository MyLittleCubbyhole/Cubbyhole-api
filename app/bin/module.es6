/*Services requiring*/

	var Path = require('path'),
		debug = require('debug')('chikorita:module');

/*Behaviour requiring*/

	var KantoBehaviours = require('kanto-patterns')._behaviours;

/*Class declarations*/

	class ModuleLoader {}

/*Behaviour injections*/

	KantoBehaviours.logger.injectTo(ModuleLoader);

/*Variables declarations*/

	var versions = {};

/*Static methods declarations*/

	ModuleLoader.init = init;
	ModuleLoader.socketInit = socketInit;

module.exports = ModuleLoader;

/*Static methods definitions*/

	function init(app) {
		for(let i in global.paths.versions) {
			try {
				versions[i] = require(Path.normalize(global.paths.versions[i] + '/core'));
				versions[i].init(app);
				debug('version ' + i + ' initialized');
			}
			catch(exception) {
				this.log('error', exception);
				this.error('unable to load the version', { error: exception.toString(), path: global.paths.versions[i] });
			}
		}
	}

	function socketInit(sockets, socket) {

		for(let i in versions) {
			versions[i].socketInit(sockets, socket);
		}
	}
