/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Factories requiring*/

	var ItemFactory = require(__dirname + '/../factories/item'),
		BinaryFileFactory = require('..todo..');

/*Managers requiring*/

	var SharingManager = require(__dirname + '..todo..'),
		StorageManager = require(__dirname + '..todo..'),
		FolderManager = require(__dirname + '/folder');

/*Attributes definitions*/

	Manager._name = 'Item';

/*Overridden methods declarations*/

/*Private methods declarations*/

	Manager._deleteItem = _deleteItem;

/*Public methods declarations*/

	Manager.exist = exist;

	Manager.update.size = updateSize;

	Manager.delete.byPath = deleteByPath;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function exist(id) {
		return id === '/' ? Promise.resolve(true) : ItemFactory.get.byId(id).then(() => true, () => false);
	}

	function _deleteItem(id) {

		return ItemFactory.get.byId(id)
			.then((item) => item.type === 'folder' ? Promise.all(item.children.map((childrenId) => ItemFactory.delete.byId(childrenId))) : BinaryFileFactory.delete.byId(id) )
			.then(() => SharingManager.unshareAll())
			.then(() => ItemFactory.delete.byId(id));
	}

	function deleteByPath(id, username) {
		var userId = parseInt(id[0], 10),
			folderPath = '/',
			size = 0;

		return ItemFactory.get.byId(id)
			.then((item) => {
				folderPath = item.path === '/' ? item.path : (item.ownerId + item.path).slice(0, -1);
				size = -item.size;

				return this.delete._deleteItem(id);
			})
			.then(() => {
				var promise;
				if(folderPath !== '/')
					promise = this.update.size(userId, folderPath, size, username)
						.then(() => FolderManager.delete.children(folderPath, id));
				else
					promise = StorageManager.update.value(userId, size);
				return promise;
			});
	}

	function updateSize(userId, folderId, size, username) {

		StorageManager.update.value(userId, size);

		var steps = folderId.split('/'),
			nbFolders = steps.length -1,
			paths = [];

		for(var i = 0; i<nbFolders.length; i++) {
			let path = '';

			for(let j = 0; j<steps.length; j++)
				path += '/' + steps[j];

			paths.push(path.substring(1));
			steps.pop();
		}

		return Promise.all(paths.map((path) => ItemFactory.update.size(path, size, username) ));
	}