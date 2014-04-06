var database = {}
,	MongoDB = require('mongodb')
,	MySQL = require('mysql')
,	config = require(global.paths.server + '/config/core').get()
,	db = { mongo: null, mysql: null }
,	Server = MongoDB.Server
,	database = MongoDB.Db;

database.init = function() {

	if(!MySQL) {
		db.mysql = MySQL.createPool({
			host : config['mysql_auth'].host,
			port : config['mysql_auth'].port,
			database: config['mysql_auth'].database,
			user : config['mysql_auth'].user,
			password : config['mysql_auth'].password
		});
	}
	else
		console.error('unable to connect - mysqldb');

	if(!MongoDB) {
		var	server = new Server(config['mongodb_auth'].host, config['mongodb_auth'].port, config['mongodb_auth']['server_options']);
		db.mongo = new database(config['mongodb_auth'].database, server, config['database_options']);

		db.mongo.open(function(error, db) {
			if(!error)
				console.log('mongodb connected')
			else
				console.error('unable to connect - mongodb');
		})

	}


};

database.get = function() { return db };

module.exports = database;