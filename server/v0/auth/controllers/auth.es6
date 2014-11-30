/*Parent class cloning*/

	var Controller = require('kanto-patterns').controller.clone();

/*Services requiring*/

	var AuthService = require(__dirname + '/../services/auth');

/*Factories requiring*/

	var TokenFactory = require(__dirname + '/../factories/token'),
		UserFactory = require(__dirname + '/../../user/factories/user');

/*Attributes definitions*/

	Controller._name = 'Auth';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Controller.get.logout = logout;
	Controller.get.checkToken = checkToken;
	Controller.get.activateAccount = activateAccount;
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

	function logout(request, response, next) {
		
		Controller.isDefined({token: request.query.token})
			.then((parameters) => TokenFactory.delete.byId(parameters.token))
			.catch((error) => next(error));
	}

	function checkToken(request, response) {
		response.status(200).json({message: 'the token is valid'});
	}

	function activateAccount(request, response, next) {
		
		Controller.isDefined({token: request.query.token})
			.then((parameters) => TokenFactory.get.byId(parameters.token))
			.then((token) => token.type === 'ACTIVATION' ? UserFactory.get.byId(token.userId) : Promise.reject(Error('Invalid token type')) , Promise.reject(Error('Token not found')))
			.then((user) => UserFactory.update.activated(user.id, true))
			.then(() => response.status(200).json({message: 'user updated'}))
			.catch((error) => next(error));
	}