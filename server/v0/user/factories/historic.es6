/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns').factory.clone();

/*Attributes definitions*/

	MongoFactory._name = 'historic';

/*Model definition*/

	MongoFactory.model.ownerId = -1;
	MongoFactory.model.targetOwner = -1;
	MongoFactory.model.fullPath = '';
	MongoFactory.model.action = '';
	MongoFactory.model.name = '';
	MongoFactory.model.itemType = '';
	MongoFactory.model.date = new Date();

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MongoFactory.get.byOwner = getByOwner;
	MongoFactory.get.byTargetOwner = getByTargetOwner;

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getByOwner(ownerId = -1) {
		return this.get({'ownerId':ownerId});
	}

	function getByTargetOwner(targetId = -1) {
		return this.get({'targetOwner': targetId});
	}