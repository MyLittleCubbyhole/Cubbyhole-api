/*Parent class cloning*/

	var Controller = require('kanto-patterns').controller.clone();

/*Services requiring*/

	var AuthService = require(__dirname + '/../services/auth');

/*Factories requiring*/

	var TokenFactory = require(__dirname + '/../factories/token');

/*Attributes definitions*/

	Controller._name = 'Auth';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Controller.post.auth = authenticate;
	Controller.get.logout = logout;

module.exports = Controller;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function authenticate(request, response, next) {
		
		Controller.isDefined({email: request.body.email, password: request.body.password})
			.then((parameters) => AuthService.authenticate(parameters.email, parameters.password, request.header('User-Agent')))
			.then((token) => response.json({token: token}))
			.catch((error) => next(error));
	}

	function logout(request, response, next) {
		
		Controller.isDefined({token: request.query.token})
			.then((parameters) => TokenFactory.delete.byId(parameters.token))
			.catch((error) => next(error));
	}