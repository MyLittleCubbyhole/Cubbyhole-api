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
        collection.findOne({"itemId":fullPath}, callback);
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

/********************************[ OTHER  ]********************************/

provider.checkRight = function(fullPath, callback) {

	provider.get.byItemFullPath(fullPath, function(error, data) {
		// console.log(typeof data);
		if(!error && data && data._id) {
			callback && callback.call(this, error, data);
			return data;
		}

		var length = fullPath.indexOf('/') != -1 ? fullPath.split('/').length : 0;

		if(length <= 2)
			callback && callback.call(this, 'not found');
		else {
			fullPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
			console.log('->'+fullPath)
			return provider.checkRight(fullPath, callback);
		}

	})


}


module.exports = provider;