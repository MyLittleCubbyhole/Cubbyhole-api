var expressSession = require('express-session'),
	RedisStore = require('connect-redis')(expressSession),
	sessionStore = new RedisStore(global.config.session.storeOptions);

/*Class declarations*/

	class Session {}

/*Static methods declarations*/

	Session.getSession = getSession;
	Session.getSessionStore = getSessionStore;

module.exports = Session;

/*Static methods definitions*/

	function getSession() {
		return expressSession({store : sessionStore, key : global.config.session.key, secret: global.config.session.secret, resave : true, saveUninitialized : true});
	}

	function getSessionStore() {
		return sessionStore;
	}


