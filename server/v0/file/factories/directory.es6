/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns-mongodb').factory.clone();

/*Attributes definitions*/

	MongoFactory._name = 'Directory';
	MongoFactory._collectionName = 'directories';

/*Model definition*/

	MongoFactory.model.property = value;

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MongoFactory.get.methodName = method;

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function method(/*arguments*/) {
		/*content*/
	}