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
	Filter.restrictUser = restrictUser;

module.exports = Filter;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function isAdministrator(request, response, next) {
		UserFactory.get.byId(request.userId)
			.then((user) => user.roleId === 2 ? next() : response.status(401).json({error: 'You must be authentified as an administrator'}));
	}

	function restrictUser(request, response, next) {
		if(parseInt(request.userId, 10) === parseInt(request.params.userId, 10))
			next();
		else
			response.status(401).json({error: 'Tou are not allowed to acces to this resource'});
	}