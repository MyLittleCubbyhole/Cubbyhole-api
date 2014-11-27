/*Services requiring*/

	var Socketio = require('socket.io'),
		cookieParser = require('cookie-parser'),
		socketHandshake = require('socket.io-handshake');

/*Bins requiring*/

	var Session = require(global.paths.bin + '/session'),
		Module = require(global.paths.bin + '/module');

/*Behaviour requiring*/

	var KantoBehaviours = require('kanto-patterns')._behaviours;

/*Class declarations*/

	class SocketIOServer {}

/*Behaviour injections*/

	KantoBehaviours.logger.injectTo(SocketIOServer);

/*Variable declarations*/

	var sockets = null;

/*Static methods declarations*/

	SocketIOServer.init = init;
	SocketIOServer.get = get;

module.exports = SocketIOServer;

/*Static methods definitions*/

	function init(app, server) {

		sockets = Socketio.listen(server, { log: true });

		if(global.config.session && global.config.session.enabled) {
			var handshake = socketHandshake({store: Session.getSessionStore(), key: global.config.session.key, secret:  global.config.session.secret, parser: cookieParser()});
			sockets.use(handshake);
		}

		sockets.on('connection', (socket) => Module.socketInit(socket, sockets, socket.handshake.session) );

		return this;
	}

	function get() {
		return sockets;
	}
