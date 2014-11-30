/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Services requiring*/

	var moment = require('moment');

/*Factories requiring*/

	var TokenFactory = require(__dirname + '/../factories/token');

/*Attributes definitions*/

	Manager._name = 'token';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.get.withUserById = getTokenWithUserById;
	Manager.create.authToken = createAuthToken;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getTokenWithUserById(id) {
		return TokenFactory.query('select * from `token` t join `user` u on t.`userid` = u.`id` where t.`id` = "' + id + '";');
	}

	function createAuthToken(userId, token, origin) {

		var model = {
			id: token,
			expirationDate: moment().add('days', 1).format('YYYY-MM-DD HH:mm:ss'),
			type: 'AUTHENTICATION',
			origin: origin, 
			userId: userId
		};

		return TokenFactory.create(model);
	}