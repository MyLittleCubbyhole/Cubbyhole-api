/*Parent class cloning*/

	var Service = require('kanto-patterns').service.clone();

/*Factories requiring*/

	var FileFactory = require(__dirname + '/../factories/file'),
		FolderFactory = require(__dirname + '/../factories/folder'),
		ItemFactory = require(__dirname + '/../factories/item'),
		BinaryFileFactory = require('..todo..');

/*Managers requiring*/

	var SharingManager = require('..todo..'),
		FileManager = require(__dirname + '/../managers/file'),
		FolderManager = require(__dirname + '/../managers/folder'),
		TokenManager = require('..todo..');

/*Attributes definitions*/

	Service._name = 'ItemService';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Service._move = _move;
	Service.move = move;
	Service.exist = exist;

module.exports = Service;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function _move(itemToMove, path, creatorId, creatorName, copy = false) {

		var item = (itemToMove.type === 'folder' ? FolderFactory : FileFactory).extendModel(itemToMove),
			slashPathIndex = path.indexOf('/');

		item.path = path.substring(slashPathIndex);
		item.ownerId = path.substring(0, slashPathIndex);
		item.lastUpdate = new Date();

		this.getNewItemName(item._id)
			.then((name) => {
				item.name = name;
				item.fullPath = item._id = item.ownerId + item.path + item.name;

				var promise;
				if(item.type === 'folder')
					promise = FolderManager.create.folder(item)
						.then(() => SharingManager.get.byItemId(itemToMove._id))
						.then((sharings) => sharings.length > 0 ? SharingManager.duplicate(itemToMove._id, item._id) : Promise.resolve() )
						.then(() => Promise.all(itemToMove.children.map( (childId) => ItemFactory.get.byId(childId).then((child) => this._move(child, item._id + '/', creatorId, creatorName, copy)) )));
				else
					promise = BinaryFileFactory.get.byPath(path)
						.then((file) => {
							if(move) TokenManager.delete.byFileId(file.fileId);

							item.type = file.type;
							item.data = file.data;
							item.size = file.length;

							return FileManager.create.file(item);
						});

				return promise;
			});
	}

	function move(id, path, creatorId, creatorName, copy = false) {

		id = id.slice(-1) === '/' ? id.slice(0,-1) : id;
		return id + '/' === path || path.split('/').length === 1 ? Promise.reject(Error('Invalid target')) : 
			SharingManager.get.byItemId(id)
				.then(() => { throw Error('Unable to move or rename a shared folder'); }, () => ItemFactory.get.byId(path))
				.then(() => ItemFactory.get.byId(id))
				.then((item) => this._move(item, path, creatorId, creatorName, copy))
				.then(() => move ? ItemFactory.delete.byPath(path, creatorName) : Promise.resolve());
	}
	
	function exist(id) {
		return id === '/' ? Promise.resolve(true) : ItemFactory.get.byId(id).then(() => true, () => false);
	}
