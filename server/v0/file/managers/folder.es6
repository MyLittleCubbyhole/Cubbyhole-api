/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Factories requiring*/

	var FolderFactory = require(__dirname + '/../factories/folder'),
		ItemFactory = require(__dirname + '/../factories/item');

/*Services requiring*/

	var ItemService = require(__dirname + '/../services/item');

/*Attributes definitions*/

	Manager._name = 'Folder';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.get.childrenById = getChildrenById;
	Manager.create.folder = createFolder;
	Manager.delete.children = removeChildren;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getChildrenById(id) {

		return FolderFactory.get.byId(id.slice(0, -1) === '/' ? id.slice(0, -1) : id)
			.then((folder) => Promise.all(folder.children.map((childrenId) => ItemFactory.get.byId(childrenId))));
	}

	function createFolder(model) {
		
		var path = model.path !== '/' ? model.ownerId + model.path.slice(0, -1) : model.path,
			promise ;

		if(model.ownerId + '/Shared' === path)
			promise = Promise.reject(Error('Unable to create a new item in the Shared folder'));
		else
			promise = ItemService.exist(path)
				.then((exist) => exist ? FolderFactory.get.byId(model.fullPath) : Promise.reject(Error('Parent does not exist')))
				.then(() => FolderFactory.create({
					_id: model.fullPath,
					ownerId: parseInt(model.ownerId, 10),
					creatorId: model.creatorId,
					path: model.path,
					name: model.name,
					type: 'folder',
					size: model.size ? parseInt(model.size, 10) : 0,
					lastUpdate: new Date(),
					lastUpdateName: model.creatorName,
					undeletable: typeof model.undeletable !== 'undefined' && model.undeletable === true,
					children: []
				}))
				.then(() => path !== '/' ? FolderFactory.update.addChildren(path, model.fullPath) : Promise.resolve());

		return promise;
	}

	function removeChildren(id, childrenId) {

		return this.get.byId(id)
			.then((folder) => {
				var index = folder.children.indexOf(childrenId),
					children;
				if(~index)
					children = folder.children.splice(index, 1);
				return FolderFactory.update.children(id, children);
			});
	}