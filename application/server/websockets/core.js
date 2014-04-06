var socketIO = require('socket.io')
,	websocket = {}
,	sockets;

websocket.init = function(server){

	sockets = socketIO.listen(server, { log: false }).of('/cubbyhole');

	sockets.on('connection', function (socket) {

	});

	return sockets;
}

websocket.get = function() {
	return sockets;
}

module.exports = websocket;