/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Services requiring*/

	var TokenFactory = require(__dirname + '/../factories/token');

/*Attributes definitions*/

	Manager._name = 'token';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.get.withUserById = getTokenWithUserById;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getTokenWithUserById(id) {
		return TokenFactory.query('select * from `token` t join `user` u on t.`userid` = u.`id` where t.`id` = "' + id + '";');
	}