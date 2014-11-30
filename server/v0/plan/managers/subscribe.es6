/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Factories requiring*/

	var UserFactory = require(__dirname + '/../factories/user');

/*Attributes definitions*/

	Manager._name = 'Subscribe';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.get.currentByUser = getcurrentByUser;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getcurrentByUser(userId) {
		return UserFactory.get.currentByUser(userId)
			.then((subscriptions) => {
				if(subscriptions.length === 1)
					return subscriptions[1];
				else
					
			});
	}