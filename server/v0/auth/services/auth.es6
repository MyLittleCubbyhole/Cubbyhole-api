/*Parent class cloning*/

	var Service = require('kanto-patterns').service.clone();

/*Services requiring*/
	
	var TokenService = require(__dirname + '/token'),
		Security = require('kanto-tools-security');

/*Factories requiring*/

	var UserFactory = require(__dirname + '/../../user/factories/user');

/*Managers requiring*/

	var TokenManager = require(__dirname + '/../managers/token');

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

	function authenticate(email = '', password = '', origin = '') {

		var user;
		return UserFactory.get.byEmail(email)
			.then((users) => {
				if(users.length === 0)
					throw Error('Invalid email');

				user = users[0];
				return Security.verify(user.password, password, user.salt)
					.catch(() => Promise.reject(Error('Bad Credentials')));
			})
			.then(() => TokenService.generate())
			.then((token) => {
				TokenManager.create.authToken(user.id, token, origin);
				return token;
			});
	}