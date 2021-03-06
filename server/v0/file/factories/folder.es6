/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns-mongodb').factory.clone();

/*Service requiring*/

	var moment = require('moment');

/*Attributes definitions*/

	MongoFactory._name = 'Folder';
	MongoFactory._collectionName = 'directories';

/*Model definition*/

	MongoFactory.model._id = '';
	MongoFactory.model.ownerId = -1;
	MongoFactory.model.creatorId = -1;
	MongoFactory.model.path = '/';
	MongoFactory.model.name = '';
	MongoFactory.model.type = 'folder';
	MongoFactory.model.lastUpdate = moment().format('YYY-MM-DD');
	MongoFactory.model.lastUpdateName = '';
	MongoFactory.model.size = 0;
	MongoFactory.model.itemId = '';
	MongoFactory.model.undeletable = false;
	MongoFactory.model.children = [];

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MongoFactory.get.folderById = getFolderById;
	MongoFactory.update.addChildren = addChildren;
	MongoFactory.update.children = updateChildren;

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getFolderById(id) {
		return this.prepare()
			.then((collection) => new Promise((resolve, reject) => collection.findOne({_id: id, type: 'folder'}, (error, result) => error ? reject(error) : resolve(result)) ));
	}

	function addChildren(id, childrenId) {
		return this.prepare()
			.then((collection) => new Promise((resolve, reject) => collection.update( {'_id': id}, {$push: childrenId}, { safe : true }, (error) => error ? resolve() : reject(error) ) ) );
	}

	function updateChildren(id, children) {
		
		return this.update.byId(id, {children: children});
	}