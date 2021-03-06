/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns-mongodb').factory.clone();

/*Attributes definitions*/

	MongoFactory._name = 'Item';
	MongoFactory._collectionName = 'directories';

/*Model definition*/

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MongoFactory.get.byOwner = getByOwner;
	MongoFactory.get.byItemId = getByItemId;
	MongoFactory.get.byPath = getByPath;
	MongoFactory.get.size = getSize;
	MongoFactory.get.totalSize = getTotalSize;

	MongoFactory.update.size = updateSize;

	MongoFactory.delete.byOwner = deleteByOwner;

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getByOwner(ownerId){
		return this.get({'ownerId': parseInt(ownerId,10)});
	}

	function getByItemId(itemId){
		return this.get({'itemId': this.ObjectID(itemId)});
	}

	function getByPath(ownerId, path){
		return this.get({'ownerId': parseInt(ownerId,10), 'path': path});
	}

	function getSize(ownerId) {
		return this.aggregate([{$match: {ownerId: parseInt(ownerId, 10), type: 'file'} }, {$group: {_id: '$contentType', size: {$sum: '$size'} } }]);
	}

	function getTotalSize(ownerId) {
		return this.aggregate([{$match: {ownerId: parseInt(ownerId, 10), type: 'file'} }, {$group: {_id: '$type', size: {$sum: '$size'} } }]);
	}

	function deleteByOwner(ownerId) {
		return this.delete({'ownerId':parseInt(ownerId,10)});
	}

	function updateSize(id, size, username) {
		return this.prepare()
			.then((collection) => new Promise((resolve, reject) => 
				collection.update( {'_id': id}, {$inc: { size: parseInt(size, 10) }, $set: {lastUpdate: new Date(), lastUpdateName: username} }, { safe : true }, (error) => error ? resolve() : reject(error) ) ) 
			);
	}