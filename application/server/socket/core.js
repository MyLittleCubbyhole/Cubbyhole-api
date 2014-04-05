//@TODO systeme de room et abonnement - push des que modif
var socketIO = require('socket.io');

webSocket = function(server){

	var sockets = socketIO.listen(server, { log: false }).of('/api');
	
	sockets.on('connection', function (socket) { 

		console.log('user connected');

		socket.on('disconnect', function () {

			console.log('user disconnected');
		});

	});

}

module.exports = webSocket