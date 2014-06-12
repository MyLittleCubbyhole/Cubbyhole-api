var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,	fs = require('fs')
,	GridStorage = MongoProvider.gridStore
,	ObjectID = MongoProvider.objectId
,	mongo = MongoProvider.db
,	tools
,	directoryProvider
,	provider = { get: {}, create: {}, delete: {}, update: {} };


provider.init = function() {
	if(!tools) {
		tools = require(global.paths.server + '/database/tools/mongodb/core');
		tools.init();

	}
	if(!directoryProvider)
		directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory');
}

/********************************[  GET   ]********************************/

provider.get.byPath = function(data, callback){
	var range = data.range;
	directoryProvider.get.byFullPath(data.fullPath,function(error, data){
		if(data && data.type == 'file' && !error)
			provider.download({id : data.itemId, range : range}, callback);
		else
			callback.call(this,'file not found');
	})
}

provider.get.byMD5 = function(data, callback){

	mongo.collection('fs.files', function(error, collection){
		collection.findOne({ "md5" : data.md5, "metadata.owner" : data.owner }, callback);
	})
}

provider.get.MD5 = function(id, callback){

	mongo.collection('fs.files', function(error, collection){
		collection.findOne({ "_id" : id}, function (error, data) {
			callback.call(this, error, data.md5);
		});
	})
}

provider.get.metadata = function(id, callback){

	var gridFS = new GridStorage(mongo, id, 'r' );

	gridFS.open(function(err, collection) {
		callback.call(this, err, collection.metadata);
	});
}

/********************************[ CREATE ]********************************/


/********************************[ DELETE ]********************************/

provider.delete.file = function(id, callback){

	var gridFS = new GridStorage(mongo, id, 'r' );

	gridFS.open(function(error, collection) {
		if(!error)
			collection.unlink(callback);
	});
}

/********************************[ UPDATE ]********************************/

provider.update.fileName = function(data, callback) {
	var id = data.itemId;
    mongo.collection('fs.files', function(error, collection) {
        collection.findOne({ "_id" : id}, function(error, file) {
            if(!error && file && file.metadata) {
                file.metadata.name = data.name;
                collection.save(file, { safe : true }, callback);
            }
            else
                collection.save(file, { safe : true }, function(error){callback.call(this, error)});
        });
    });
}

/********************************[ OTHERS ]********************************/

provider.upload = function(params, callback){
	var mode = params.mode || 'w';

	var gridStore = new GridStorage(mongo, params.id, params.name, mode, {
		content_type : params.type,
		metadata : {
			type : params.type,
			name : params.name,
			owner : parseInt(params.ownerId, 10)
		}
	});

	params.data = params.data != '' ? params.data : ' ';

	gridStore.open(function(error, gridStore) {
		if(!error && gridStore)
			gridStore.write(new Buffer(params.data, 'binary'), function(error, gridStore) {
				gridStore.close(function(error, result) {
					GridStorage.read(mongo, params.id, function(error, file) {
						provider.get.MD5(params.id, function(error, md5) {
							callback.call(this, error, md5);
						})
					});
				});
			});
		else
			callback.call(this, error);
	});

}

provider.uploadFromPath = function(data, callback) {
	var gridFS = new GridStorage(mongo, data.id, data.name, 'w', { content_type : data.data.type, metadata : { name : data.name, owner : parseInt(data.ownerId, 10) } } );

	gridFS.writeFile(data.data.path, function(error, file) {
		if(!error)
			fs.unlink(data.data.path, callback);
		else
			callback.call(this, error, files);
	});
}

provider.download = function(data, callback){

	var gridFS = new GridStorage(mongo, data.id, 'r' );

	gridFS.open(function(error, collection) {
		if(collection && !error)
			collection.seek(data.range, function() {
				collection.read(function(error, data) {
					callback(error, { "type": collection.metadata.type, "data": data, "metadata" : collection.metadata, "length" : collection.length })
				});
			});
		else
			callback('file not found '+error)
	});
}

provider.zip = function(data, callback) {

	var name = data.path.length >  1 ? data.path[data.path.length - 2] : data.path[data.path.length - 1];
	directoryProvider.get.byOwner(data.ownerId, function(error, items){
		if(!error && items && items.length>0) {
			var rows = tools.format(items);
			rows = tools.browse(data.path, rows);
			tools.zipFolder({name: name, data:rows}, {callback: callback});
		}
		else
			callback.call(this,'path not found');
	})

}

provider.zipItems = function(data, callback) {
	var length = data.items.length
	,	self = this
	,	items = [];

	for(var i = 0; i<data.items.length; i++)
		directoryProvider.get.byFullPath(data.ownerId + data.items[i], function(error, item) {
			if(!error && item && item._id) {
				items.push(item);
				--length <= 0 && tools.zipItems.call(self, items, callback);
			}
			else
				callback.call(this,'item not found');
		})
}

module.exports = provider;