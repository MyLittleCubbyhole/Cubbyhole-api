/*Parent class cloning*/

	var Service = require('kanto-patterns').service.clone();

/*Services requiring*/
	
	var TokenService = require(__dirname + '/token'),
		Security = require('kanto-tools-security');

/*Factories requiring*/

	var UserFactory = require(__dirname + '/../../user/factories/user'),
		TokenFactory = require(__dirname + '/../factories/token');

/*Attributes definitions*/

	Service._name = 'Auth';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Service.authenticate = authenticate;

module.exports = Service;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function authenticate(email = '', password) {
		return UserFactory.get.byEmail(email)
			.then((users) => {
				if(users.length === 0)
					throw Error('Invalid email');

				var user = users[0];

				return Security.verify(user.password, password, user.salt)
					.then(() => user, Promise.reject(Error('Bad Credentials')));
			})
			.then(() => TokenService.generate())
			.then();
	}