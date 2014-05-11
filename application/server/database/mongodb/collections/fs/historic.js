var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   tools = require(global.paths.server + '/database/tools/mongodb/core')
,   ObjectID = MongoProvider.objectId
,   mongo = MongoProvider.db
,   provider = { get: {}, create: {}, delete: {}, update: {} };


/********************************[  GET   ]********************************/

provider.get.byOwnerId = function(ownerId, callback){
    mongo.collection('historic', function(error, collection) {
        collection.find({"ownerId":ownerId}).toArray(callback);
    })
}

provider.get.byTargetOwner = function(targetOwner, callback){
    mongo.collection('historic', function(error, collection) {
        collection.find({"targetOwner":targetOwner}).toArray(callback);
    })
}

provider.get.byUser = function(userId, callback) {

    mongo.collection('historic', function(error, collection) {
        collection.find({ $or: [ {"ownerId":userId}, {"targetOwner":userId} ] }).sort( { date: -1 } ).toArray(callback);
    })
	
}

/********************************[ CREATE ]********************************/

provider.create.event = function(params, callback) {
	callback = callback || function() {};

	if(typeof params.ownerId != 'undefined')
		mongo.collection('historic', function(error, collection) {

			collection.insert({
				ownerId: params.ownerId,
				targetOwner: params.targetOwner,
				fullPath: params.fullPath,
				action: params.action,
				name: params.name,
				itemType: params.itemType,
				date: new Date()
			}, 
			{ safe : true }, callback);

		})

}

module.exports = provider;