var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   tools = require(global.paths.server + '/database/tools/mongodb/core')
,   ObjectID = MongoProvider.objectId
,   mongo = MongoProvider.db
,   provider = { get: {}, create: {}, delete: {}, update: {} };


/********************************[  GET   ]********************************/

/**
 * Get historic objects by their ownerId
 * @param  {integer}   ownerId  user id used to find the objects
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
provider.get.byOwnerId = function(ownerId, callback){
    mongo.collection('historic', function(error, collection) {
        collection.find({"ownerId":ownerId}).toArray(callback);
    })
}

/**
 * Get historic objects by their target owner
 * @param  {integer}   targetOwner user id used to find the objects
 * @param  {Function} callback
 */
provider.get.byTargetOwner = function(targetOwner, callback){
    mongo.collection('historic', function(error, collection) {
        collection.find({"targetOwner":targetOwner}).toArray(callback);
    })
}

/**
 * Get historic objects of an user. Eventually specify an offset and a limit to manage a pagination.
 *
 * ex: provider.get.byUser({
 * 	 userId: xx,
 *   offset: xx,
 *   limit: xx
 *  }, function() {...})
 *
 * @param  {object}   parameters params needed to get objects
 * @param  {Function} callback
 */
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

/**
 * Create an historic object
 *
 * provider.create.event({
 *      ownerId: xx,
 *      targetOwner: xx,
 *      action: xx (delete | create | share | unshare | rename | move),
 *      fullPath: "xx/xx",
 *      name: "xx",
 *      itemType: "xx"
 * }, funciton() {...})
 *
 * @param  {object}   params   params needed to create the object
 * @param  {Function} callback
 */
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