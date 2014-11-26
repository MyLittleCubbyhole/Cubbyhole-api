/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns-mongodb').factory.clone();

/*Attributes definitions*/

	MongoFactory._name = 'File';
	MongoFactory._collectionName = 'directories';

/*Model definition*/

	MongoFactory.model._id = '';
	MongoFactory.model.ownerId = -1;
	MongoFactory.model.creatorId = -1;
	MongoFactory.model.path = '/';
	MongoFactory.model.name = '';
	MongoFactory.model.type = 'file';
	MongoFactory.model.lastUpdate = new Date();
	MongoFactory.model.lastUpdateName = '';
	MongoFactory.model.downloads = 0;
	MongoFactory.model.size = 0;
	MongoFactory.model.shared = false;
	MongoFactory.model.itemId = '';
	MongoFactory.model.contentType = '';
	MongoFactory.model.md5 = '';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/