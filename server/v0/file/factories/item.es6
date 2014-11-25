/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns-mongodb').factory.clone();

/*Attributes definitions*/

	MongoFactory._name = 'Item';
	MongoFactory._collectionName = 'directories';

/*Model definition*/

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getByOwner(ownerId){
		return MongoFactory.get({'ownerId': parseInt(ownerId,10)});
	}

	function getByItemId(itemId){
		return MongoFactory.get({'itemId': MongoFactory.ObjectID(itemId)});
	}

	function getByPath(ownerId, path){
		return MongoFactory.get({'ownerId': parseInt(ownerId,10), 'path': path});
	}

	function getSize(ownerId, callback) {
		return MongoFactory.self.prepare()
			// .then((collection) => collection.aggregate[{$match: {ownerId: parseInt(ownerId, 10), type: 'file'} }, {$group: {_id: '$contentType', size: {$sum: '$size'} } }], callback);
	}