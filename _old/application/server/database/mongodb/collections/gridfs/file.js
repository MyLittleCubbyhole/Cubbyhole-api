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

/**
 * Get a gridfs file by it's fullpath
 *
 * ex: provider.get.byPath({
 * 	 fullPath: "xx/xx/xx",
 *   range: 500
 * }, function() {...})
 *
 * @param  {object}   data     params needed to find the file
 * @param  {Function} callback
 */
provider.get.byPath = function(data, callback){
	var range = data.range;
	directoryProvider.get.byFullPath(data.fullPath,function(error, data){
		if(data && data.type == 'file' && !error)
			provider.download({id : data.itemId, range : range}, callback);
		else
			callback.call(this,'file not found');
	})
}

/**
 * Get a gridfs file by it's md5 and it's user
 * @param  {object}   data     params needed to get the file
 * @param  {Function} callback
 */
provider.get.byMD5 = function(data, callback){

	mongo.collection('fs.files', function(error, collection){
		collection.findOne({ "md5" : data.md5, "metadata.owner" : data.owner }, callback);
	})
}

/**
 * Get the md5 of a file
 * @param {string}   id       id of the file used to get the md5
 * @param {Function} callback
 */
provider.get.MD5 = function(id, callback){

	mongo.collection('fs.files', function(error, collection){
		collection.findOne({ "_id" : id}, function (error, data) {
			callback.call(this, error, data.md5);
		});
	})
}

/**
 * Get metada of a file
 * @param  {string}   id       id of the file used to get metada
 * @param  {Function} callback
 */
provider.get.metadata = function(id, callback){

	var gridFS = new GridStorage(mongo, id, 'r' );

	gridFS.open(function(err, collection) {
		callback.call(this, err, collection.metadata);
	});
}

/********************************[ CREATE ]********************************/


/********************************[ DELETE ]********************************/

/**
 * Delete a gridfs file by it's id
 * @param  {string}   id       id of the file to delete
 * @param  {Function} callback
 */
provider.delete.file = function(id, callback){

	var gridFS = new GridStorage(mongo, id, 'r' );

	gridFS.open(function(error, collection) {
		if(!error)
			collection.unlink(callback);
	});
}

/********************************[ UPDATE ]********************************/

/**
 * Update the name of a gridfs file
 *
 * ex: provider.update.fileName({
 *     itemId: "xxx",
 *     name: "xxx"
 * }, function() {...})
 *
 * @param  {object}   data     params needed to update the file
 * @param  {Function} callback
 */
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

/**
 * Upload a file. Create a gridfs file.
 *
 * ex: provider.upload({
 *     mode: x (r | w),
 *     id: "xxxx",
 *     type: "xxxx",
 *     name: "xxxx",
 *     ownerId: xx,
 *     data: {object}
 * }, function() {...})
 *
 * @param  {object}   params   params needed to create the file
 * @param  {Function} callback
 */
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

/**
 * Upload a file from a client path. Create a gridfs file
 *
 * ex: provider.uploadFromPath({
 *     id: "xxxx",
 *     type: "xxxx",
 *     name: "xxxx",
 *     ownerId: xx,
 *     data: multipart
 * }, function() {...})
 *
 * @param  {object}   data     params needed to create the file
 * @param  {Function} callback
 */
provider.uploadFromPath = function(data, callback) {
	var gridFS = new GridStorage(mongo, data.id, data.name, 'w', { content_type : data.data.type, metadata : { name : data.name, owner : parseInt(data.ownerId, 10) } } );

	gridFS.writeFile(data.data.path, function(error, file) {
		if(!error)
			fs.unlink(data.data.path, callback);
		else
			callback.call(this, error, files);
	});
}

/**
 * Download a file from gridfs storage
 *
 * ex: provider.download({
 *     id: "xxxxx",
 *     range: 1000
 * }, function() {...})
 *
 * @param  {object}   data     params needed to download the file
 * @param  {Function} callback
 */
provider.download = function(data, callback){

	var gridFS = new GridStorage(mongo, data.id, 'r' );

	gridFS.open(function(error, collection) {
		if(collection && !error)
			collection.seek(data.range, function() {
				collection.read(function(error, data) {
					callback(error, { "type": collection.metadata.type, "data": data, "metadata" : collection.metadata, "length" : collection.length, "fileId": collection.fileId})
				});
			});
		else
			callback('file not found '+error)
	});
}

/**
 * Zip a folder
 *
 * ex: provider.zip({
 *     path: ["xx", "xx", "xx"], (equivalent of xx/xx/xx in an array)
 *     ownerId: xxx
 * }, function() {...})
 *
 * @param  {object}   data     params needed to zip a folder
 * @param  {Function} callback
 */
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

/**
 * Zip items
 *
 * ex: provider.zipItems({
 *     ownerId: xx,
 *     items: ["/xx", "/xxx/", ...]
 * }, function() {...})
 *
 * @param  {object}   data     params needed to zip items
 * @param  {Function} callback
 */
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