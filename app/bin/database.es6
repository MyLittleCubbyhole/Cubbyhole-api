/*Behaviour requiring*/

	var KantoBehaviours = require('kanto-patterns')._behaviours;

/*Services requiring*/

	var debug = require('debug')('chikorita:database');

/*Class declarations*/

	class DbLoader {}

/*Behaviour injections*/

	KantoBehaviours.logger.injectTo(DbLoader);

/*Variable declarations*/

	var databases = {};

/*Static methods declarations*/

	DbLoader.init = init;
	DbLoader.get = get;

module.exports = DbLoader;

/*Static methods definitions*/

	function init() {
		var promises = [Promise.resolve()],
			currentPath = '';
		for(var i in global.config.databases) {
			currentPath = (!global.config.databases[i].module ? global.paths.bin : '') + global.config.databases[i].path;
			try {
				databases[i] = require( currentPath );
				promises.push( databases[i].init() );
				debug(i + ' database initialization');
			}
			catch(exception) {
				this.log('error', exception);
				this.error('unable to load the database '+ i, { error: exception.toString(), path: currentPath, dbName: i });
			}
		}

		return Promise.all(promises);
	}

	function get(name) {

		var self = this;

		return new Promise(function(resolve, reject) {
			if(name && databases[name.toLowerCase()]) {
				resolve(databases[name.toLowerCase()].get());
			}
			else {
				self.log('warn', 'Database not found for the given name', {name: name, databases: databases});
				reject(Error('Database not found for the given name'));
			}
		});
	}
