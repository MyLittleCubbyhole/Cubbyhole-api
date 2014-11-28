/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns').factory.clone();

/*Attributes definitions*/

	MongoFactory._name = 'Sharing';
	MongoFactory._collectionName = 'sharings';

/*Model definition*/

	MongoFactory.model.ownerId =  -1;
	MongoFactory.model.itemId =  -1;
	MongoFactory.model.right =  'R';
	MongoFactory.model.sharedWith =  -1;

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MongoFactory.get.byItem = getByItem;
	MongoFactory.get.byItemAndTarget = getByItemAndTarget;
	MongoFactory.get.byTarget = getByTarget;
	MongoFactory.update.right = updateRight;
	MongoFactory.delete.byItemAndTarget = deleteByItemAndTarget;

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getByItem(id) {
		return this.get({'itemId': id});
	}

	function getByTarget(id) {
		return this.get({'sharedWith':id});
	}

	function getByItemAndTarget(itemId, targetId) {
		return this.get({'itemId': itemId, 'sharedWith': targetId});
	}

	function updateRight(itemId, right = 'R') {
		return this.update({'itemId': itemId}, {'right': right});
	}

	function deleteByItemAndTarget(itemId, targetId) {
		return this.delete({'itemId': itemId, 'sharedWith': targetId});
	}