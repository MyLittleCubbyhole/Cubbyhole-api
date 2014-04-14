var socketIO = require('socket.io')
,	uploader = require(global.paths.server + '/websockets/dataTransfer/uploader')
,	websocket = {}
,	sockets;

websocket.init = function(server) {

	sockets = socketIO.listen(server, { log: false }).of('/cubbyhole');
	
	sockets.on('connection', function(socket) {
		uploader.init(socket);
	});

	return sockets;
}

websocket.get = function() {
	return sockets;
}

module.exports = websocket;