/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Factories requiring*/

	var FolderFactory = require(__dirname + '/../factories/folder'),
		ItemFactory = require(__dirname + '/../factories/item');

/*Attributes definitions*/

	Manager._name = 'Folder';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.get.childrenById = getChildrenById;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getChildrenById(id) {

		return FolderFactory.get.byId(id.slice(0, -1) === '/' ? id.slice(0, -1) : id)
			.then((folder) => Promise.all(folder.children.map((childrenId) => ItemFactory.get.byId(childrenId))));
	}