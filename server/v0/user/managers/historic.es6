/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Services requiring*/

	var moment = require('moment');

/*Factories requiring*/

	var historicFactory = require(__dirname + '/../factories/historic');

/*Attributes definitions*/

	Manager._name = 'Historic';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.create.event = createEvent;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function createEvent(ownerId, targetOwner, path, action, name, type = '') {
		historicFactory.create({
			ownerId: parseInt(ownerId, 10),
			targetOwner: parseInt(targetOwner, 10),
			fullPath: path,
			action: action,
			name: name,
			itemType: type,
			date: moment().format('YYY-MM-DD')
		});
	}