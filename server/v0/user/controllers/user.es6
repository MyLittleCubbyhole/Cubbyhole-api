/*Parent class cloning*/

	var Controller = require('kanto-patterns').controller.clone();

/*Factories requiring*/

	var UserFactory = require(__dirname + '/../factories/user');

/*Attributes definitions*/

	Controller._name = 'User';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Controller.get.all = getAll;
	Controller.get.byEmail = getByEmail;

module.exports = Controller;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getAll(request, response, next) {
		
		//todo adds check on user inputs
		var promise,
			offset = request.query.offset ? parseInt(request.query.offset, 10) : 0,
			limit = request.query.limit ? parseInt(request.query.limit, 10) : 0,
			role = request.query.role || false,
			email = request.query.email || false;

		if(!role && !email)
			promise = UserFactory.get.all(offset, limit);
		else
			if(!!role && !!email)
				promise = UserFactory.get.byEmailAndRole(email, role);
			else
				if(!!role)
					promise = UserFactory.get.byRole(role);
				else
					promise = UserFactory.get.byEmailLike(email);

		promise.then((users) => {
			
			for(var i = 0; i < users.length; i++)
				users[i] = UserFactory.reduce(users[i]);

			response.json({users: users});
		})
		.catch((error) => next(error));
	}

	function getByEmail(request, response, next) {

		Controller.isDefined({email: request.query.email})
			.then((parameters) => UserFactory.get.byEmail(parameters.email))
			.then((result) => result.length > 0 ? UserFactory.reduce(result[0]) : Promise.reject(Error('User not found')))
			.then((user) => response.json({user: user}))
			.catch((error) => next(error));
	}