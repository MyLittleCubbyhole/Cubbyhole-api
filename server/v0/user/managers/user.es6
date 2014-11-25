/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Factory requiring*/

	var SharingFactory = require('..todo..'),
		HistoricFactory = require('..todo..'),
		UserFactory = require('/../factories/user');

/*Service requiring*/

	var Security = require('kanto-tools-security');

/*Attributes definitions*/

	Manager._name = 'User';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.create.user = createUser;
	Manager.update.password = updateUserPassword;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function createUser(model) {
		return this.get.byEmail(model.email)
			.then(() => { throw Error('UserAlreadyExist'); },
			() => Security.generateHash(model.password))
			.then((result) => {
				model.hash = result.hash;
				model.salt = result.salt;
				return UserFactory.create(model);
			});
	}

	function updateUserPassword(model) {
		return Security.generateHash(model.password)
			.then((result) => UserFactory.update.password(model.id, result.hash, result.salt));
	}


