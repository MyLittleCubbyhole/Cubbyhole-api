/*Behaviour requiring*/

	var KantoBehaviours = require('kanto-patterns')._behaviours;

/*Services requiring*/

	var Path = require('path'),
		debug = require('debug')('chikorita:websocket');

/*Variables requiring*/

	var SocketServer = null;

/*Class declarations*/

	class WebsocketProvider {}

/*Behaviour injections*/

	KantoBehaviours.logger.injectTo(WebsocketProvider);

/*Static methods declarations*/

	WebsocketProvider.init = init;
	WebsocketProvider.get = get;

module.exports = WebsocketProvider;

/*Static methods definitions*/

	function init(app, server) {
		if(global.config.websocket && global.config.websocket.path) {
			var wsPath = Path.normalize( (!global.config.websocket.module ? global.paths.bin : '') + global.config.websocket.path );
			try {
				SocketServer = require( wsPath );
			}
			catch(exception) {
				this.log('error', exception);
				this.error('websocket module not found', {path: wsPath, error: exception.toString()});
				throw Error('websocket module not found');
			}
			debug(global.config.websocket.name + ' ws server initialization');
			SocketServer.init(app, server);
		}
		else {
			this.error('websocket path not found int the current config', {config: global.config.websocket});
			throw Error('websocket path not found int the current config');
		}

		return SocketServer;
	}

	function get() {
		return SocketServer.get();
	}
