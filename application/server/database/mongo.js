var mongo  		= require('mongodb')
,	Server		= mongo.Server
,	database	= mongo.Db
,	GridStore 	= mongo.GridStore
,	ObjectID	= mongo.ObjectID;

var	server 		= new Server('localhost', 27017, { auto_reconnect : true  })
,	db 			= new database('CubbyHole', server, { safe : true });

db.open(function(error, db){
	if(!error)
		console.log('db connected');
});

module.exports = { 'db' : db, 'gridStore' : GridStore, 'objectId' : ObjectID };
