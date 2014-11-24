/*Behaviour requiring*/

	var KantoBehaviours = require('kanto-patterns')._behaviours;

/*Services requiring*/

	var debug = require('debug')('chikorita:session');

/*Variables requiring*/

	var Session = null;

/*Class declarations*/

	class SessionProvider {}

/*Behaviour injections*/

	KantoBehaviours.logger.injectTo(SessionProvider);

/*Static methods declarations*/

	SessionProvider.init = init;
	SessionProvider.setSession = setSession;
	SessionProvider.getSession = getSession;
	SessionProvider.getSessionStore = getSessionStore;

module.exports = SessionProvider;

/*Static methods definitions*/

	function init() {
		if(global.config.session && global.config.session.path) {
			Session = require( (!global.config.session.module ? global.paths.bin : '') + global.config.session.path );
			debug('session ' + global.config.session.name + ' initialized');
		}
		else {
			this.error('session path not found int the current config', {config: global.config.session});
			throw Error('session path not found int the current config');
		}
		return this;
	}

	function setSession(app) {
		if(Session)
			app.use(Session.getSession());
		else {
			this.error('setSession used before session initialization');
			throw Error('setSession used before session initialization');
		}
	}

	function getSession() {
		if(Session)
			return Session.getSession();
		else {
			this.error('getSession used before session initialization');
			throw Error('getSession used before session initialization');
		}
	}

	function getSessionStore() {
		if(Session)
			return Session.getSessionStore();
		else {
			this.error('getSessionStore used before session initialization');
			throw Error('getSessionStore used before session initialization');
		}
	}
