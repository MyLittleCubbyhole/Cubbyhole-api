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
			.then((item) => item.type === 'folder' ? Promise.all(item.children.map((childrenId) => ItemFactory._deleteItem(childrenId))) : BinaryFileFactory.delete.byId(id) )
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

	function _copyItem(arguments) {
		// body...
	}



	// provider.copyItem = function(collection, item, updatedItem, targetPath, targetItem, move, creatorId, creatorName, start, stop) {
	// 	updatedItem = updatedItem || {};

	// 	var newItem = {};
	// 	_.extend(newItem, item, updatedItem);

	// 	var oldFullPath = newItem._id;
	// 	newItem.path = targetPath.substring(targetPath.indexOf('/'));
	// 	newItem.ownerId = targetPath.substring(0, targetPath.indexOf('/'));
	// 	newItem._id = newItem.ownerId + newItem.path + newItem.name;
	// 	newItem.lastUpdate = new Date();
	// 	provider.getNewName(newItem._id, function(error, newName) {
	// 		if(!error && newName) {

	// 			newItem.name = newName;
	// 			newItem._id = newItem.ownerId + newItem.path + newItem.name;

	// 			if(!targetItem)
	// 				targetItem = newItem;

	// 			var params = {
	// 				fullPath: newItem._id,
	// 				ownerId: newItem.ownerId,
	// 				path: newItem.path,
	// 				name: newItem.name,
	// 				creatorId: creatorId,
	// 				creatorName: creatorName,
	// 				downloads: newItem.downloads || 0
	// 			};

	// 			if(item.type == 'folder')
	// 				provider.create.folder(params, function(error) {
	// 					var newPath = params.fullPath;
	// 					if(!error)
	// 						sharingProvider.get.byItemFullPath(oldFullPath, function(error, sharings) {

	// 							var callMeBaby = function() {

	// 								for(var i = 0; i < item.children.length; i++) {
	// 									start();
	// 									var path = newItem.ownerId + newItem.path + newItem.name + "/";
	// 									collection.findOne({'_id': item.children[i]}, function(error, data) {
	// 										if(error)
	// 											console.error('item not found');
	// 										provider.copyItem(collection, data, null, path, targetItem, move, creatorId, creatorName, start, stop);
	// 									});
	// 								}
	// 								stop(error, targetItem);

	// 							}

	// 							if(!error && sharings.length > 0)
	// 								sharingProvider.duplicateWithNewItemPath({fullPath: oldFullPath, newPath: newPath}, callMeBaby);
	// 							else
	// 								callMeBaby();
	// 						})
	// 					else
	// 						console.error('error saving new item - ' + error);

	// 				});
	// 			else
	// 				fileProvider.get.byPath({fullPath: oldFullPath, range: 0}, function(error, data) {
	// 					if(error)
	// 						console.error('error getting old file - ' + error);

	// 					if(move)
	// 						tokenProvider.delete.byFileId(data.fileId, function(error, data) {
	// 							if(error)
	// 								console.log(error);
	// 						});

	// 					params.type = data.type;
	// 					params.data = data.data;
	// 					params.size = data.length;

	// 					provider.create.file(params, function(error) {
	// 						if(error)
	// 							console.error(error);

	// 						stop(error, targetItem);
	// 					});

	// 				});

	// 		}
	// 	});
	// };

	// provider.copy = function(fullPath, updatedItem, targetPath, move, creatorId, creatorName, callback) {
	// 	var started = 0;

	// 	if(fullPath + '/' != targetPath) {
	// 		fullPath = fullPath.slice(-1) == '/' ? fullPath.slice(0,-1) : fullPath;
	// 		sharingProvider.get.byItemFullPath(fullPath, function(error, data) {
	// 			if(!error && data && data.length > 0)
	// 				callback.call(this, 'An error has occurred - you can\'t copy - move or rename a shared folder');
	// 			else
	// 				mongo.collection('directories', function(error, collection) {

	// 					function start() {
	// 						started++;
	// 					};
	// 					function stop(error, data) {
	// 						if(--started <= 0)
	// 							end(error, data);
	// 					};
	// 					function end(error, data) {
	// 						if(move)
	// 							provider.delete.byPath(fullPath, creatorName, function(error) {
	// 								callback.call(this, error, data);
	// 							});
	// 						else
	// 							callback.call(this, error, data);
	// 					};

	// 					collection.findOne({"_id": fullPath}, function(error, item) {
	// 						if(!error && item) {
	// 							collection.findOne({"_id": targetPath.slice(0, -1)}, function(error, data) {
	// 								var pathLength = targetPath.indexOf('/') != -1 ? targetPath.split('/').length : 0;
	// 								if((!error && data) || pathLength <= 2) {
	// 									start();
	// 									provider.copyItem(collection, item, updatedItem, targetPath, null, move, parseInt(creatorId, 10), creatorName, start, stop);
	// 								} else
	// 									callback.call(this, 'target path not found');
	// 							})

	// 						}
	// 						else
	// 							callback.call(this, 'item to copy not found');
	// 					});
	// 				});
	// 		});
	// 	}
	// 	else
	// 		callback.call(this, "cannot copy an item into himself");
	// }