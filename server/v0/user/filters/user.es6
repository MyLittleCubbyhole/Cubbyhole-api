/*Parent class cloning*/

	var Filter = require('kanto-patterns').filter.clone();

/*Factories requiring*/

	var UserFactory = require(__dirname + '/../factories/user');

/*Attributes definitions*/

	Filter._name = 'User';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Filter.isAdministrator = isAdministrator;

module.exports = Filter;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function isAdministrator(request, response, next) {
		UserFactory.get.byId(request.userId)
			.then((user) => user.roleId === 2 ? next() : response.status(401).json({error: 'You must be authentified as an administrator'}));
	}