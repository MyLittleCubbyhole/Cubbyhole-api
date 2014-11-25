/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Factories requiring*/

	var ItemFactory = require(__dirname + '/../factories/item');

/*Attributes definitions*/

	Manager._name = 'Item';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.exist = exist;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function exist(id) {
		return id === '/' ? Promise.resolve(true) : ItemFactory.get.byId(id).then(() => true, () => false);
	}