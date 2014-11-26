/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns-mongodb').factory.clone();

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
	MongoFactory.model.lastUpdate = new Date();
	MongoFactory.model.lastUpdateName = '';
	MongoFactory.model.size = 0;
	MongoFactory.model.itemId = '';
	MongoFactory.model.undeletable = false;
	MongoFactory.model.children = [];

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MongoFactory.update.addChildren = addChildren;
	MongoFactory.update.removeChildren = removeChildren;

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function addChildren(id, childrenId) {
		return MongoFactory.prepare()
			.then((collection) => collection.update({_id: id}, {$push: childrenId}, {safe:true}));
	}

	// function removeChildren(index) {
	// 	var index = directory.children.indexOf(fullPath);

	// 	if(index != -1)
	// 		directory.children.splice(index);
	// 	collection.save(directory, { safe : true }, callback);
	// }