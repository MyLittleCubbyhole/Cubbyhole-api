var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   fileProvider
,   directoryProvider
,   tools = require(global.paths.server + '/database/tools/mongodb/core')
,   socket = require(global.paths.server + '/websockets/core')
,   _ = require('lodash')
,   ObjectID = MongoProvider.objectId
,   mongo = MongoProvider.db
,   provider = { get: {}, create: {}, delete: {}, update: {} };

provider.init = function() {}


/********************************[  GET  ]********************************/

/**
 * Get all sharing objects of a folder
 * @param  {string}   fullPath fullPath used to find corresponding sharing objects
 * @param  {Function} callback
 */
provider.get.byItemFullPath = function(fullPath, callback){
    mongo.collection('sharings', function(error, collection) {
        collection.find({'itemId':fullPath}).toArray(callback);
    })
}

/**
 * Get a sharing object of a folder and a specific user
 *
 * ex: provider.get.byItemAndTarget({
 *      fullPath: "xx/xx",
 *      targetId: xx
 * }, function() {...})
 *
 * @param  {object}   parameters params needed to find the object
 * @param  {Function} callback
 */
provider.get.byItemAndTarget = function(parameters, callback){
    mongo.collection('sharings', function(error, collection) {
        collection.findOne({'itemId':parameters.fullPath, 'sharedWith':parameters.targetId}, callback);
    })
}

/**
 * Get all sharings objects shared to an user
 * @param  {integer}   userId   user id used to find objects
 * @param  {Function} callback
 */
provider.get.bySharedWith = function(userId, callback) {
    mongo.collection('sharings', function(error, collection) {
		collection.find({"sharedWith":userId}).toArray(callback);
    })
}


/********************************[ CREATE ]********************************/

/**
 * Create a sharing row
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
			ownerId: parseInt(params.ownerId),
			itemId: params.fullPath,
			right: params.right,
			sharedWith: parseInt(params.targetId)
		},
		{ safe : true }, function(error, data) {

			socket.send('user_'+parseInt(params.targetId), 'socket-authentication', {});
			callback.call(this, error, data)
		});

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

/**
 * Delete all sharing objects of a folder
 * @param  {string}   fullPath fullPath of the folder used to delete objects
 * @param  {Function} callback
 */
provider.delete.byItemFullPath = function(fullPath, callback) {
	mongo.collection('sharings', function(error, collection) {
		provider.get.byItemFullPath(fullPath, function(error, items) {
        	for(var i = 0; i<items.length; i++)
				socket.send('user_'+parseInt(items[i].sharedWith), 'socket-authentication', {});
        	collection.remove({'itemId':fullPath}, {safe:true}, callback);

		})
    });
}

/**
 * Delete all sharing objects of a folder and a specific user
 *
 * ex: provider.delete.byItemAndTarget({
 *     fullPath: "xx/xx",
 *     targetId: xx
 * }, function() {...})
 *
 * @param  {object}   parameters params needed to delete sharing objects
 * @param  {Function} callback
 */
provider.delete.byItemAndTarget = function(parameters, callback) {
	mongo.collection('sharings', function(error, collection) {
        collection.remove({'itemId': parameters.fullPath, 'sharedWith': parameters.targetId}, {safe:true}, function(error, data) {
			socket.send('user_'+parseInt(parameters.targetId), 'socket-authentication', {});
        	callback.call(this, error, data)
        });
    });
}

/********************************[ OTHER  ]********************************/

/**
 * Check if a folder is shared and return the corresponding sharing object if found
 * @param  {string}   fullPath fullPath of the folder to check
 * @param  {Function} callback
 */
provider.isShared = function(fullPath, callback) {

	var splitPath = fullPath.split('/')
	,	current = ""
	,	sharings = new Array()
	,	started = 0;

	for(var i = 0; i< splitPath.length; i++) {
		current += splitPath[i] + ( i == 0 ? '/' : '' );
		started++;
		provider.get.byItemFullPath(current, function(error, data) {

			if(!error && data.length > 0)
				sharings = _.union(sharings, data)

			!--started && callback && callback.call(this, sharings);
		})
	}
}

/**
 * [RECURSION] Check rights of a given user on a given folder. Return the sharing object found
 *
 * ex: provider.checkRight({
 *     fullPath: "xx/xx/x",
 *     targetId: xx
 * }, function() {...})
 *
 * @param  {object}   parameters params needed to check rights
 * @param  {Function} callback
 */
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

/**
 * Duplicate a sharing object with a new item path
 *
 * ex: provider.duplicateWithNewItemPath({
 *     fullPath: "xx/xx/xx",
 *     newPath: "xx/xx"
 * }, function() {...})
 *
 * @param  {object}   parameters params needed to duplicate
 * @param  {Function} callback
 */
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
            			// console.log('share',data[0].sharedWith + '/Shared', newPath)
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