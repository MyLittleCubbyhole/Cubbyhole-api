var socketIO = require('socket.io')
,	fs = require('fs')
,   config = require(global.paths.server + '/config/core').get()
,	uploader
,   tokenProvider
,   sharingProvider
,   userProvider
,	websocket = {}
,	IO
,	sockets;

/**
 * Initialize webesockets. Manage connections, deconnections et re-authentication to receive all events in a sharing context
 * @param  {object} server
 */
websocket.init = function(server) {

	uploader = require(global.paths.server + '/websockets/dataTransfer/uploader');
	tokenProvider = require(global.paths.server + '/database/mysql/tables/token');
	userProvider = require(global.paths.server + '/database/mysql/tables/user');
	sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings');

	IO = socketIO.listen(server, { log: false });
	sockets = IO.of('/cubbyhole');

	sockets.on('connection', function(socket) {
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
					// Write some informations in a file to manage bandwidth limitations thanks to a call to a QOS daemon
					userProvider.bandwidth(userId, function(error, user) {
						var row = user.id + ';' + user.upload + ';' + user.download + ';' + socket.manager.remotePort + ';upload\n';
						if(config.limit_file && !error && user.id)
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
					})
				}
				else
					console.error('authentication failed')
			})
		})

		socket.on('disconnect', function() {
			clean();
		})


		socket.emit('socket-authentication', {});
	});

	return sockets;
}

websocket.get = function() {
	return sockets;
}

/**
 * Send a socket event to a client
 * @param  {string} roomId room id used to send the event
 * @param  {string} type   event type (create_file, delete, ...)
 * @param  {object} data   data to send
 */
websocket.send = function(roomId, type, data) {
	type = type || 'message';
	sockets.in(roomId).emit(type, data);
}

module.exports = websocket;