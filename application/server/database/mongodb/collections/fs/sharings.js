var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   fileProvider
,   directoryProvider
,   tools = require(global.paths.server + '/database/tools/mongodb/core')
,   _ = require('lodash')
,   ObjectID = MongoProvider.objectId
,   mongo = MongoProvider.db
,   provider = { get: {}, create: {}, delete: {}, update: {} };

provider.init = function() {
    if(!fileProvider)
    fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');
    if(!directoryProvider)
    directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory');
}


/********************************[  GET   ]********************************/

provider.get.byItemFullPath = function(fullPath, callback){
    mongo.collection('sharings', function(error, collection) {
        collection.find({'itemId':fullPath}).toArray(callback);
    })
}

provider.get.byItemAndTarget = function(parameters, callback){
    mongo.collection('sharings', function(error, collection) {
        collection.findOne({'itemId':parameters.fullPath, 'sharedWith':parameters.targetId}, callback);
    })
}


/********************************[ CREATE ]********************************/

/**
 * create a sharing row
 *
 *ex: provider.create.sharing({
 *	ownerId: xx
 *	fullPath: "xx/xx/",
 *	targetId: xx,
 *	right: xx { R | W | N }
 *}, function() {...})
 *
 * @param  {object}   params   contains all needed property to execute the sharing
 * @param  {Function} callback
 */
provider.create.sharing = function(params, callback) {

	mongo.collection('sharings', function(error, collection) {

		collection.insert({
			ownerId: params.ownerId,
			itemId: params.fullPath,
			right: params.right,
			sharedWith: params.targetId
		},
		{ safe : true }, callback);

	})

}

/********************************[ UPDATE ]********************************/

/**
 * update a sharing row
 *
 *ex: provider.create.sharing({
 *	fullPath: "xx/xx/",
 *	right: xx { R | W | N }
 *}, function() {...})
 *
 * @param  {object}   params
 * @param  {Function} callback
 */
provider.update.right = function(params, callback) {

	mongo.collection('sharings', function(error, collection) {
		collection.update({'itemId': params.fullPath}, {'right': params.right}, callback);
	})

}

/********************************[ DELETE ]********************************/

provider.delete.byItemFullPath = function(fullPath, callback) {
	mongo.collection('sharings', function(error, collection) {
        collection.remove({'itemId':fullPath}, {safe:true}, callback);
    });
}

provider.delete.byItemAndTarget = function(parameters, callback) {
	mongo.collection('sharings', function(error, collection) {
        collection.remove({'itemId': parameters.fullPath, 'sharedWith': parameters.targetId}, {safe:true}, callback);
    });
}

/********************************[ OTHER  ]********************************/

provider.checkRight = function(parameters, callback) {
	var fullPath = parameters.fullPath;
	provider.get.byItemAndTarget(parameters, function(error, data) {

		if(!error && data && data._id) {
			callback && callback.call(this, error, data);
		}
		else {
			var length = fullPath.indexOf('/') != -1 ? fullPath.split('/').length : 0;

			if(length <= 2)
				callback && callback.call(this, 'not found');
			else {
				fullPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
				return provider.checkRight({'fullPath': fullPath, 'targetId': parameters.targetId}, callback);
			}
		}

	})


}

provider.duplicateWithNewItemPath = function(parameters, callback) {

	var path = parameters.fullPath
	,	newPath = parameters.newPath
	,	length ;

	provider.get.byItemFullPath(path, function(error, data) {
		if(!error && data) {
			length = data.length;

			for(var i = 0; i<data.length; i++)
				provider.create.sharing({
					ownerId: data[i].ownerId,
					fullPath: newPath,
					right: data[i].right,
					targetId: data[i].sharedWith
				}, function(error, data) {
            		mongo.collection('directories', function(error, collection) {
            			console.log('share',data[0].sharedWith + '/Shared', newPath)
						collection.update({'_id': data[0].sharedWith + '/Shared'}, {
							$push: { children: newPath}
						}, { safe : true },
						function(error, data) {
							--length <= 0 && callback && callback.call();
						})
					})
				});

		}
		else
			callback.call(this, 'error during duplicate');

	})
}


module.exports = provider;