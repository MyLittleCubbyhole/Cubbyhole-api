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

provider.get.byUser = function(parameters, callback) {
	parameters.offset = parameters.offset || 0;
	parameters.limit = parameters.limit || 50;

    mongo.collection('historic', function(error, collection) {
        collection.find({ $or: [ {"ownerId":parameters.userId}, {"targetOwner":parameters.userId} ] }).
        	skip(parseInt(parameters.offset)).
        	limit(parseInt(parameters.limit)).
        	sort( { date: -1 } ).
        	toArray(callback);
    })
	
}

/********************************[ CREATE ]********************************/

provider.create.event = function(params, callback) {
	callback = callback || function() {};

	if(typeof params.ownerId != 'undefined')
		mongo.collection('historic', function(error, collection) {

			collection.insert({
				ownerId: parseInt(params.ownerId),
				targetOwner: parseInt(params.targetOwner),
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