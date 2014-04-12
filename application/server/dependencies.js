var dependencies;
var fs = require('fs');
var http = require('http');

dependencies = function(server, app) {

	require(global.paths.server + '/database/core').init();
	require(global.paths.server + '/routing/core').init(app);
	require(global.paths.server + '/websockets/core').init(server);


	// var userProvider = require(global.paths.server + '/database/mysql/tables/user');
	// var roleProvider = require(global.paths.server + '/database/mysql/tables/role');
	
	// roleProvider.create.role('Admin', function(data) {
	// 	console.log(data);

	// 	var date = new Date();
	// 	var user = {
	// 		username: 'Polochon',
	// 		password: 'rku2bmcu',
	// 		firstname: 'Nicolas',
	// 		lastname: 'Gaignoux',
	// 		email: 'gaignoux.nicolas@gmail.com',
	// 		birthdate: date.getFullYear()+':'+(date.getMonth()<10?'0'+date.getMonth():date.getMonth())+':'+(date.getDate()<10?'0'+date.getDate():date.getDate()),
	// 		roleId: 1
	// 	};

	// 	userProvider.create.user(user, function(data) {
	// 		console.log('user created', data);
	// 	})

	// })

}

module.exports = dependencies;