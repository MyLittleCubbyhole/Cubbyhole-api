/*Bin requiring*/

	var Module = require(__dirname + '/module'),
		Database = require(__dirname + '/database'),
		Session = require(__dirname + '/session'),
		Websocket = require(__dirname + '/websocket'),
		debug = require('debug')('chikorita:kernel');

/*Behaviour requiring*/

	var KantoBehaviours = require('kanto-patterns')._behaviours;

/*Class declaration*/

	class Kernel {

		/*Getters & Setters*/

			/*BeforeAll*/
			get beforeAll() {
				return this._beforeAll;
			}
			set beforeAll(fn) {
				this._$beforeAll = fn;
			}

			/*AfterAll*/
			get afterAll() {
				return this._afterAll;
			}
			set afterAll(fn) {
				this._$afterAll = fn;
			}

			/*OnDbLoaded*/
			get onDbLoaded() {
				return this._onDbLoaded;
			}
			set onDbLoaded(fn) {
				this._$onDbLoaded = fn;
			}

		/*Private methods definitions*/

			_$beforeAll() { return Promise.resolve(); }
			_$afterAll() {}
			_$onDbLoaded() {}

			_beforeAll() { 
				debug('Before All');
				return this._$beforeAll(this.app, this.server);
			}

			_afterAll() {
				debug('After All');
				return this._$afterAll(this.app, this.server);
			}

			_onDbLoaded() { 
				debug('Db Loaded');
				return this._$onDbLoaded(this.app, this.server, Database);
			}

			_initializeModuleChain() {
				Module.init(this.app);
				if(global.config.websocket && global.config.websocket.enabled)
					Websocket.init(this.app, this.server);
			}

		/*Public methods definitions*/

			init(app, server) {

				this.app = app;
				this.server = server;

				Promise.resolve()
					.then(() => this.beforeAll())
					.then(() => {

						if(global.config.session && global.config.session.enabled)
							Session.init().setSession(this.app);

						var dbPromise = Database.init()
							.catch((error) => {
								this.log('error', error);
								this.error('an error occurred during the kernel database initialization', { error: error.toString() });
							});

						if(global.config.server.parallelizeInitialization)
							this._initializeModuleChain();
						else
							dbPromise
								.then(() => this._initializeModuleChain());
						return dbPromise;
					})
					.then(() => this.onDbLoaded())
					.then(() => this.afterAll())
					.catch((error) => {
						this.log('error', error);
						this.error('an error occurred during the kernel initialization', { error: error.toString() });
					});

			}

	}

/*Behaviour injections*/

	KantoBehaviours.logger.injectTo(Kernel.prototype);

module.exports = new Kernel();