var socketIO = require('socket.io')
,	fs = require('fs')
,   config = require(global.paths.server + '/config/core').get()
,	uploader
,   tokenProvider
,   sharingProvider
,   userProvider
,	websocket = {}
,	sockets;

websocket.init = function(server) {

	uploader = require(global.paths.server + '/websockets/dataTransfer/uploader');
	tokenProvider = require(global.paths.server + '/database/mysql/tables/token');
	userProvider = require(global.paths.server + '/database/mysql/tables/user');
	sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings');

	sockets = socketIO.listen(server, { log: false }).of('/cubbyhole');

	sockets.on('connection', function(socket) {
		console.log('client : ' + socket.handshake.address.address + ':' + socket.handshake.address.port);
		var roomSubscribe = new Array()
		,	userId = -1;

		function clean() {
			for(var i = 0; i<roomSubscribe.length; i++) {
				socket.leave(roomSubscribe[i]);
			}
		}

		uploader.init(socket, sockets);

		socket.on('socket-authentication', function(data) {
			data.token = data.token || '';
			tokenProvider.isValidForAuthentication(data.token, function(error, token) {
				if(!error && token && token.userid) {
					userId = token.userid;
					userProvider.bandwidth(userId, function(error, user) {
						var row = 'upload;add;'+ socket.handshake.address.port +';'+ user.upload + "\n";
						if(config.limit_file && !error && user.upload)
							fs.appendFile(config.limit_file, row, function (error) {
								if(error)
									throw 'an error occured';
							});
					})

					clean();
					roomSubscribe.push('user_' + token.userid);
					socket.join('user_' + token.userid);
					sharingProvider.get.bySharedWith(token.userid, function(error, sharings) {
						if(!error && sharings && sharings.length > 0)
							for(var i = 0; i<sharings.length; i++) {
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
			if(userId != -1) {
				var row = 'upload;del;'+ socket.handshake.address.port +";0\n";
				if(config.limit_file)
					fs.appendFile(config.limit_file, row, function (error) {
						if(error)
							throw 'an error occured';
					});
			}

			clean();
		})


		socket.emit('socket-authentication', {});
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