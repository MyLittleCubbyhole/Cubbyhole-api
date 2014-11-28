/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns').factory.clone();

/*Attributes definitions*/

	MongoFactory._name = 'Sharing';
	MongoFactory._collectionName = 'sharing';

/*Model definition*/

	MongoFactory.model.ownerId =  -1;
	MongoFactory.model.itemId =  -1;
	MongoFactory.model.right =  'W';
	MongoFactory.model.sharedWith =  -1;

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/


module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

