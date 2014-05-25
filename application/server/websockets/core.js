var socketIO = require('socket.io')
,	uploader
,   tokenProvider
,   sharingProvider
,	websocket = {}
,	sockets;

websocket.init = function(server) {

	uploader = require(global.paths.server + '/websockets/dataTransfer/uploader');
	tokenProvider = require(global.paths.server + '/database/mysql/tables/token');
	sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings');
	
	sockets = socketIO.listen(server, { log: false }).of('/cubbyhole');
	
	sockets.on('connection', function(socket) {
		var roomSubscribe = new Array();

		function clean() {
			for(var i = 0; i<roomSubscribe.length; i++) {
				console.log('(-) user leave the room n°'+roomSubscribe[i]);
				socket.leave(roomSubscribe[i]);
			}
		} 

		console.log('user connected');
		uploader.init(socket, sockets);

		socket.on('socket-authentication', function(data) {
			data.token = data.token || '';
			tokenProvider.isValidForAuthentication(data.token, function(error, token) {				
				if(!error && token && token.userid) {
					clean();
					roomSubscribe.push('user_' + token.userid);
					socket.join('user_' + token.userid);
					console.log('(+) user join the room n°user_'+token.userid);
					sharingProvider.get.bySharedWith(token.userid, function(error, sharings) {
						if(!error && sharings && sharings.length > 0)
							for(var i = 0; i<sharings.length; i++) {
								console.log('(+) user join the room n°'+sharings[i]._id);
								roomSubscribe.push(sharings[i]._id);
								socket.join(sharings[i]._id);
							}
						else
							console.log('no sharing found');
					})
				}
				else
					console.error('authentication failed')
			})
		})

		socket.on('disconnect', function() {
			clean();
			console.log('user disconnected')
		})



		socket.emit('socket-authentication');
	});

	return sockets;
}

websocket.get = function() {
	return sockets;
}

websocket.send = function(roomId, type, data) {
	type = type || 'message';
	sockets.in(roomId).emit(type, data);
}

module.exports = websocket;