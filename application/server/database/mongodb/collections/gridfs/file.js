var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,	tools = require(global.paths.server + '/database/tools/mongodb/core')
,	ObjectID = MongoProvider.gridStore
,	GridStorage = MongoProvider.objectId
,	mongo = MongoProvider.db
,	provider = { get: {}, create: {}, delete: {}, update: {} };



/********************************[  GET   ]********************************/

provider.get.byPath = function(data, callback){
	var range = data.range;
	directory.findPath(data,function(error, data){
		if(data.type == 'file')
			provider.download({id : data.id, range : range}, callback);
		else
			callback.call(this,'file not found');
	})
}

provider.get.byMD5 = function(data, callback){

	mongo.collection('fs.files', function(error, collection){
		collection.findOne({ "md5" : data.md5, "metadata.owner" : data.owner }, callback);
	})
}

provider.get.metadata = function(id, callback){

	var gridFS = new GridStorage(mongo, id, 'r' );

	gridFS.open(function(err, collection) {
		callback.call(this, collection.metadata);
	});
}

/********************************[ CREATE ]********************************/


/********************************[ DELETE ]********************************/

provider.delete.file = function(id, callback){

	var gridFS = new GridStorage(mongo, id, 'r' );

	gridFS.open(function(err, collection) {
		collection.unlink(callback);
	});
}

/********************************[ DELETE ]********************************/

provider.update.fileName = function(data, callback) {

    mongo.collection('fs.files', function(error, collection){
        collection.findOne({ "id" : data._id}, function(error, file) {
            file.metadata.name = data.name;
            collection.save(file, { safe : true }, callback);
        });
    });
}

/********************************[ OTHER ]********************************/

provider.upload = function(data, callback){
	var gridFS = new GridStorage(mongo, data.id, 'w', { content_type : data.type, metadata : { name : data.name, owner : parseInt(data.owner, 10) } } );

	gridFS.writeFile(data.path, callback);

}

provider.download = function(data, callback){

	var gridFS = new GridStorage(mongo, data.id, 'r' );

	gridFS.open(function(error, collection) {
		collection.seek(data.range, function() {
			collection.read(function(error, data) {
				callback(error, { "type": collection.contentType, "data": data, "metadata" : collection.metadata, "length" : collection.length })
			});
		});
	});
}