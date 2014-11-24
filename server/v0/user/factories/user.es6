/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns').factory.clone();

/*Attributes definitions*/

	MongoFactory._name = 'User';
	MongoFactory._table = 'User';

/*Model definition*/

	MongoFactory.model.password = '';
	MongoFactory.model.salt = '';
	MongoFactory.model.photo = '';
	MongoFactory.model.storage = 0;
	MongoFactory.model.firstname = '';
	MongoFactory.model.lastname = '';
	MongoFactory.model.inscriptiondate = new Date();
	MongoFactory.model.birthdate = new Date();
	MongoFactory.model.email = '';
	MongoFactory.model.country = '';
	MongoFactory.model.countrycode = '';
	MongoFactory.model.activated = false;
	MongoFactory.model.roleid = 0;

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