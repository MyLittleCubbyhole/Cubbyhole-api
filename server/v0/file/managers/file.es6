/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Managers requiring*/

	var ItemManager = require(__dirname + '/item'),
		StorageManager = require(__dirname + '..todo..');

/*Factories requiring*/

	var BinaryFileFactory = require('..todo..'),
		FileFactory = require(__dirname + '/../factories/file'),
		FolderFactory = require(__dirname + '/../factories/folder');

/*Attributes definitions*/

	Manager._name = 'File';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.create.file = createFile;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function createFile(model) {
		
		var path = model.path === '/' ? model.path : (model.ownerId + model.path).slice(0, -1),
			userId = model.ownerId;

		model.id = new ItemManager.ObjectID();

		var fileModel = FileFactory.extendModel({
			_id: model.fullPath,
			ownerId: parseInt(model.ownerId, 10),
			creatorId: parseInt(model.creatorId, 10),
			path: model.path,
			name: model.name,
			lastUpdate: new Date(),
			lastUpdateName: model.creatorName,
			downloads: model.downloads ? parseInt(model.downloads, 10) : 0,
			size: model.size ? parseInt(model.size, 10) : 0,
			shared: false,
			itemId: model.itemId,
			contentType: model.contentType
		}, true);


		return ItemManager.exist(model.fullPath)
			.then((exist) => exist ? Promise.reject(Error('File already exist')) : ItemManager.exist(path))
			.then((exist) => {
				if(!exist)
					throw 'Folder does not exist';

				return !!model.data && !!model.data.path ? BinaryFileFactory.create.fromPath(model) : BinaryFileFactory.create.file();
			})
			.then(() => BinaryFileFactory.get.md5(model.id))
			.then((md5) => {
				fileModel.md5 = md5;
				return FileFactory.create(fileModel);
			})
			.then(() => {
				var promise;
				if(path !== '/')
					promise = FolderFactory.update.addChildren(model.fullPath)
						.then(() => ItemManager.update.size(userId, path, fileModel.size, fileModel.lastUpdateName));
				else
					promise = StorageManager.update.value(userId, fileModel.size);
				return promise;
			})
			.then(() => fileModel.md5);
	}