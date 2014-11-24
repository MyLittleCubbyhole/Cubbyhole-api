var database = {}
,	MongoDB = require('mongodb')
,	MySQL = require('mysql')
,	config = require(global.paths.server + '/config/core').get()
,	db = { mongo: null, mysql: null }
,	Server = MongoDB.Server
,	database = MongoDB.Db;

database.init = function() {

	if(!db.mysql) {
		db.mysql = MySQL.createPool({
			host : config['mysql_auth'].host,
			port : config['mysql_auth'].port,
			database: config['mysql_auth'].database,
			user : config['mysql_auth'].user,
			password : config['mysql_auth'].password
		});
	}

	if(!db.mongo) {
		var	server = new Server(config['mongodb_auth'].host, config['mongodb_auth'].port, config['mongodb_auth']['server_options']);
		db.mongo = new database(config['mongodb_auth'].database.name, server, config['mongodb_auth'].database.options);

		db.mongo.open(function(error, db) {
			if(!error) {
				db.authenticate(config['mongodb_auth'].database.user, config['mongodb_auth'].database.password, function(error2, data2) {
					console.log('mongodb connected')
					db.collection('directories', function(error, collection){
						collection.findOne({'_id': '1/admin' }, function(error, data) {
							if(!data)
								collection.insert({_id: '1/userPhotos', ownerId: 1, creatorId: 1, path: '/', name: 'userPhotos', type: 'folder', size: 0, lastUpdate: new Date(), undeletable: true, children: []}, { safe : true }, function() {
										collection.insert({_id: '1/admin', ownerId: 1, creatorId: 1, path: '/', name: 'admin', type: 'folder', size: 0, lastUpdate: new Date(), undeletable: true, children: []}, { safe : true }, function() {
										})
								})
						})
					})
				})
			}
			else
				console.error('unable to connect - mongodb');
		})

	}


};

database.get = function() { return db };

module.exports = database;