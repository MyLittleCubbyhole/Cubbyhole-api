var mongoService	= require('../../mongo')
,	directory		= require('../fs/directory')
,	mongo 			= mongoService.db
,	GridStorage		= mongoService.gridStore
,	ObjectID 		= mongoService.objectId;

exports.findByPath = function(data, callback){
	var range = data.range;
	directory.findPath(data,function(error, data){
		if(data.type == 'file')
			exports.download({id : data.id, range : range}, callback);
		else
			callback.call(this,'file not found');
	})
}

exports.findByMD5 = function(data, callback){

	mongo.collection('fs.files', function(error, collection){
		collection.findOne({ "md5" : data.md5, "metadata.owner" : data.owner }, callback);
	})
}

exports.getMetadata = function(id, callback){

	var gridFS = new GridStorage(mongo, id, 'r' );

	gridFS.open(function(err, collection) {
		callback.call(this, collection.metadata);
	});
}

exports.upload = function(data, callback){
	var gridFS = new GridStorage(mongo, data.id, 'w', { content_type : data.type, metadata : { name : data.name, owner : parseInt(data.owner, 10) } } );

	gridFS.writeFile(data.path, callback);

}

exports.remove = function(id, callback){

	var gridFS = new GridStorage(mongo, id, 'r' );

	gridFS.open(function(err, collection) {
		collection.unlink(callback);
	});
}

exports.download = function(data, callback){

	var gridFS = new GridStorage(mongo, data.id, 'r' );

	gridFS.open(function(error, collection) {
		collection.seek(data.range, function() {
			collection.read(function(error, data) {
				callback(error, { "type": collection.contentType, "data": data, "metadata" : collection.metadata, "length" : collection.length })
			});
		});
	});
}

exports.updateFilename = function(data, callback) {

    mongo.collection('fs.files', function(error, collection){
        collection.findOne({ "id" : data._id}, function(error, file) {
            file.metadata.name = data.name;
            collection.save(file, { safe : true }, callback);
        });
    });
}
