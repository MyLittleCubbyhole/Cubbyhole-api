/*Parent class cloning*/

	var Controller = require('kanto-patterns').controller.clone();

/*Services requiring*/

	var AuthService = require(__dirname + '/../services/auth');

/*Attributes definitions*/

	Controller._name = 'Auth';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Controller.post.auth = authenticate;

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