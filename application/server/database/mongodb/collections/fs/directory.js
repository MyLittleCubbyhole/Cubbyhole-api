var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   fileProvider
,   userProvider
,   sharingProvider
,   historicProvider
,   storageProvider
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,   tools
,   mysqlTools = require(global.paths.server + '/database/tools/mysql/core')
,   _ = require('lodash')
,   ObjectID = MongoProvider.objectId
,   mongo = MongoProvider.db
,   provider = { get: {}, create: {}, delete: {}, update: {} };
mysqlTools.init();

provider.init = function() {
    if(!fileProvider)
        fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');
    if(!userProvider)
        userProvider = require(global.paths.server + '/database/mysql/tables/user');
    if(!sharingProvider)
        sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings');
    if(!historicProvider)
        historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic');
    if(!storageProvider)
        storageProvider = require(global.paths.server + '/database/mysql/tables/storage');
    if(!tools) {
        tools = require(global.paths.server + '/database/tools/mongodb/core');
        tools.init();
    }
}

/********************************[  GET   ]********************************/

provider.get.objectId = ObjectID;

/**
 * Get all objects in directory collection
 * @param  {Function} callback
 */
provider.get.directory = function(callback){
	mongo.collection('directories', function(error, collection) {
		collection.find().toArray(callback);
    });
}

/**
 * Get all directory objects of an user
 * @param  {int}   ownerId  user id used to find all directories
 * @param  {Function} callback
 */
provider.get.byOwner = function(ownerId, callback){
	mongo.collection('directories', function(error, collection) {
        collection.find({"ownerId":parseInt(ownerId,10)}).toArray(callback);
    });
};

/**
 * Get a directory object by it's id
 * @param  {string}   id    id of the directory to find
 * @param  {Function} callback
 */
provider.get.byId = function(id, callback) {

    mongo.collection('directories', function(error, collection) {
        collection.findOne({"_id": id}, callback);
    })
}

/**
 * Get a directory object by it's item id
 * @param  {string}   itemId   item id to get the corresponding directory object
 * @param  {Function} callback
 */
provider.get.byItemId = function(itemId, callback){
    mongo.collection('directories', function(error, collection) {
        collection.find({"itemId": ObjectID(itemId)}).toArray(callback);
    })
}

/**
 * Get a directory object by it's path and ownerId
 * @param  {int}   ownerId  user id used to find the directory
 * @param  {string}   path     path used to find the directory
 * @param  {Function} callback
 */
provider.get.byPath = function(ownerId, path, callback){
	mongo.collection('directories', function(error, collection) {
        collection.find({"ownerId": parseInt(ownerId,10), "path": path}).toArray(callback);
	})
}

/**
 * Get all children of a directory
 * @param  {string}   fullPath fullpath of the parent directory
 * @param  {Function} callback
 */
provider.get.childrenByFullPath = function(fullPath, callback) {
    var started = 0;
    fullPath = fullPath.slice(0, -1) == '/' ? fullPath.slice(0, -1) : fullPath;
    provider.get.byFullPath(fullPath, function(error, data) {
        if(!error && data) {
            var children = data.children;
            data = [];
            if(children.length > 0)
                for(var i = 0; i < children.length; i++) {
                    started++;
                    provider.get.byFullPath(children[i], function(error, dataChild) {
                        started--;
                        if(!error && data)
                            data.push(dataChild);
                        if(started <= 0 && i == children.length)
                            callback.call(this, null, data);
                    });
                }
            else
                callback.call(this, '', []);
        }
        else
            callback.call(this, error);
    })
}

/**
 * Get a directory object by it's fullPath
 * @param  {string}   fullPath  fullPath of the directory to find
 * @param  {Function} callback
 */
provider.get.byFullPath = function(fullPath, callback){
    mongo.collection('directories', function(error, collection) {
        collection.findOne({"_id":fullPath}, callback);
    })
}

/**
 * Get the size used per file type by an user
 * @param  {int}   ownerId  user id used to get the sizes
 * @param  {Function} callback
 */
provider.get.size = function(ownerId, callback) {
    mongo.collection('directories', function(error, collection) {
        collection.aggregate([{$match: {ownerId: parseInt(ownerId, 10), type: 'file'} }, {$group: {_id: '$contentType', size: {$sum: '$size'} } }], callback);
    })
}

/**
 * Get the total size used by an user
 * @param  {int}   ownerId  user id used to get the total size
 * @param  {Function} callback
 */
provider.get.totalSize = function(ownerId, callback) {
    mongo.collection('directories', function(error, collection) {
        collection.aggregate([{$match: {ownerId: parseInt(ownerId, 10), type: 'file'} }, {$group: {_id: '$type', size: {$sum: '$size'} } }], callback);
    })
}

/********************************[ CREATE ]********************************/

/**
 * Create a folder
 *
 *ex: provider.create.folder({
 *  ownerId: xx,
 *  creatorId: xx,
 *  fullPath: "x/x",
 *  path: "/xx/",
 *  name: "xx",
 *  size: 0,
 *  creatorName: "xx",
 *  undeletable: true | false
 *}, function() {...})
 *
 * provider.create.folder({ownerId: 1, creatorId: 2, fullPath: "1/folder", path: '/', name: "folder", size: 0, creatorName: "John Doe", undeletable: false}, function() {...})
 * provider.create.folder({ownerId: 1, creatorId: 2, fullPath: "1/folder1/folder2", path: '/folder1/', name: "folder2", size: 0, creatorName: "John Doe", undeletable: false}, function() {...})
 *
 * @param  {object}   params   params needed to create the folder
 * @param  {Function} callback
 */
provider.create.folder = function(params, callback){
	var folderPath = params.path != '/' ? params.ownerId + params.path.slice(0, -1) : params.path;
    if(params.ownerId + '/Shared' == folderPath)
       callback.call(this, 'unable to create in Shared folder');
    else
	provider.checkExist(folderPath, function(error, exist) {
		if(exist)
			mongo.collection('directories', function(error, collection){
				collection.findOne({"_id": params.fullPath }, function(error, data) {
					if(!data && !error) {
						collection.insert({
							_id: params.fullPath,
							ownerId: parseInt(params.ownerId, 10),
                            creatorId: params.creatorId,
							path: params.path,
							name: params.name,
							type: "folder",
							size: params.size ? parseInt(params.size, 10) : 0,
							lastUpdate: new Date(),
                            lastUpdateName: params.creatorName,
                            undeletable: typeof params.undeletable != 'undefined' && params.undeletable === true,
							children: []
						}, { safe : true }, function() {
							if(folderPath != '/')
								provider.get.byFullPath(folderPath, function(error, directory) {
								    directory.children.push(params.fullPath);
								    collection.save(directory, { safe : true }, callback);
								});
							else
								callback.call(this);

						})
					}
					else
					   callback.call(this, 'folder already exist');
				})
			})
		else {
			callback.call(this, 'parent doesnt exist');
		}
	})
}

/**
 * Create a file
 *
 *ex: provider.create.file({
 *  ownerId: xx,
 *  creatorId: xx,
 *  fullPath: "x/x",
 *  path: "/xx/",
 *  name: "xx",
 *  size: 1024,
 *  creatorName: "xx",
 *  downloads: 0,
 *  type: "xx",
 *  data: multipart
 *}, function() {...})
 *
 *  provider.create.file({ownerId: 1, creatorId: 2, fullPath: "1/file", path: "/", name: "file", size: 1024, creatorName: "John Doe", downloads: 0, type: "application/json", data: {...}}, function() {...})
 *  provider.create.file({ownerId: 1, creatorId: 2, fullPath: "1/folder/file", path: "/folder/", name: "file", size: 1024, creatorName: "John Doe", downloads: 0, type: "application/json", data: {...}}, function() {...})
 *
 * @param  {object}   params   params needed to create the file
 * @param  {Function} callback
 */
provider.create.file = function(params, callback){
    mongo.collection('directories', function(error, collection){
        collection.findOne({"_id":params.fullPath}, function(error, data){
            if(!data) {

                var folderPath = params.path == '/' ? params.path : (params.ownerId + params.path).slice(0, -1);
                var userId = params.ownerId;


                provider.checkExist(folderPath, function(error, exist) {
                    if(!exist)
                        callback.call(this, 'folder does not exist - ' + error);

                    params.id = new ObjectID();

                    var directoryFile = {
                        _id: params.fullPath,
                        ownerId: parseInt(params.ownerId, 10),
                        creatorId: parseInt(params.creatorId, 10),
                        path: params.path,
                        name: params.name,
                        type: 'file',
                        lastUpdate: new Date(),
                        lastUpdateName: params.creatorName,
                        downloads: params.downloads ? parseInt(params.downloads, 10) : 0,
                        size: params.size ? parseInt(params.size, 10) : 0,
                        shared: false,
                        itemId: params.id,
                        contentType: params.type
                    };

                    var next = function() {
                        fileProvider.get.MD5(params.id, function(error, fileMd5) {
                            if(error)
                                throw 'error retrieving file created - ' + error;

                            directoryFile.md5 = fileMd5;

                            collection.insert(directoryFile, { safe : true }, function(error) {
                                if(error)
                                    throw 'error creating collection - ' + error;

                                if(folderPath != "/")

                                    collection.update({'_id': folderPath}, { $push: { children: params.fullPath} }, { safe : true }, function(error) {
                                        if(error) {
                                            console.error(error);
                                            throw 'error updating children - ';
                                        }
                                        provider.update.size(userId, folderPath, directoryFile.size, directoryFile.lastUpdateName, function(error) {
                                            callback.call(this, error);
                                        });

                                    });
                                else
                                    storageProvider.update.value(userId, directoryFile.size, callback);

                            });
                        });
                    }

                    if(params.data && params.data.path) {
                        fileProvider.uploadFromPath(params, function(error, data) {
                            if(error) {
                                console.error(error);
                                throw 'Error during post upload - ';
                            }
                            next();
                        });
                    }
                    else {
                        fileProvider.upload(params, function(error){
                            if(error) {
                                console.error(error);
                                throw 'error during upload - ';
                            }
                            next();
                        });
                    }
                });
            }
            else
                callback.call(this, 'file already exist');
        })
    })
}


/********************************[ DELETE ]********************************/

/**
 * Delete all directory objects of an user
 * @param  {int}   ownerId  user id used to delete directories
 * @param  {Function} callback
 */
provider.delete.byOwner = function(ownerId, callback) {
	mongo.collection('directories', function(error, collection) {
        collection.remove({"ownerId":parseInt(ownerId,10)}, {safe:true}, callback);
    });
}

/**
 * [RECURSION] Delete a directory and all it's children
 * @param  {object} collection mongodb directory collection
 * @param  {string} fullPath   fullPath of the directory to delete
 * @param  {int} start      used for recursion
 * @param  {int} stop       used for recursion
 */
provider.delete.item = function(collection, fullPath, start, stop) {
    var myPath = fullPath;
	collection.findOne({"_id":fullPath}, function(error, data) {

		if(!error && data && !data.undeletable) {
			if(data.type == 'folder')
				for(var i = 0; i< data.children.length; i++) {
					start();
					provider.delete.item(collection, data.children[i], start, stop);
				}
			else
				fileProvider.delete.file(data.itemId, function(error) {
					if(error)
						console.error('problem occured during deleting file ' + error);
				})

            provider.unshareAll(myPath, function() {
                collection.remove({"_id":fullPath}, function(error,data) {
                    if(error)
                        console.error(error);

                    stop();
                });
            });
		}
		else
			stop('not found or undeletable');
	})

}

/**
 * Delete an item and update corresponding sizes and children of the folders
 * @param  {string}     fullPath    fullPath of the item to delete
 * @param  {string}     userName    name of the user who made the update
 * @param  {Function}   callback
 */
provider.delete.byPath = function(fullPath, userName, callback){

	var started = 0
	,	size = 0
	,	folderPath = '/'
    ,   userId = parseInt(fullPath[0], 10);

	mongo.collection('directories', function(error, collection) {

		function start() {
			started++;
		};
		function stop(error) {
			if(--started <= 0)
				end();
		};
		function end() {
			if(folderPath != '/')
                // trick to avoid concurrency
                setTimeout(function() {

                    provider.update.size(userId, folderPath, size, userName, function() {
                        provider.get.byFullPath(folderPath, function(error, directory) {
                            if(!error && directory) {
                                var index = directory.children.indexOf(fullPath)

                                if(index != -1)
                                    directory.children.splice(index);
                                collection.save(directory, { safe : true }, callback);
                            }
                            else
                                callback.call(this, error);
                        });
                    })


                },Math.random() * 150);
			else
                storageProvider.update.value(userId, size, callback);
		};

		collection.findOne({"_id": fullPath}, function(error, data) {
			if(!error && data) {
				start();
				folderPath = data.path == '/' ? data.path : (data.ownerId + data.path).slice(0, -1);
				size = data.size*-1;
				provider.delete.item(collection,  fullPath, start, stop);
			}
			else
				callback.call(this, error);
		});
    });
}

/********************************[ UPDATE ]********************************/

/**
 * Update the size of an item and all his parents
 * @param  {integer}    userId          id of the owner of items updated
 * @param  {string}     fullFolderPath  path of the item to update (ownerId + path)
 * @param  {integer}    sizeUpdate      value to add to the curent size of the item
 * @param  {string}     userName        name of the user who made the update
 * @param  {Function}   callback
 */
provider.update.size = function(userId, fullFolderPath, sizeUpdate, userName, callback) {
    if(userId && sizeUpdate)
        storageProvider.update.value(userId, sizeUpdate, function() {});
    if(fullFolderPath == '/' || fullFolderPath.length == 2)
        callback.call(this, null);
    else {
        var paths = fullFolderPath.split("/");

        var nbFolders = paths.length - 1;

        var started = 0;

        mongo.collection('directories', function(error, collection) {
            for(var i = 0; i < nbFolders; i++) {
                var path = "";
                for(var j = 0; j < paths.length; j++) {
                    path += "/" + paths[j];
                }

                path = path.substring(1);
                paths.pop();

                started++;
                collection.update({'_id': path}, {$inc: { size: parseInt(sizeUpdate, 10) }, $set: {lastUpdate: new Date(), lastUpdateName: userName} }, { safe : true }, function(error) {
                    started--;
                    if(error)
                        callback.call(this, 'error updating size - ' + error);

                    if(started <= 0 && i == nbFolders)
                        callback.call(this, null);
                });
            }
        });
    }
}

/**
 * Update name of an item
 *
 *ex: provider.update.name({
 *  fullPath: "x/xx/xx",
 *  path: "/xx/",
 *  userId: xx,
 *  creatorId: xx,
 *  userName: "xx", // creator name
 *  newName: "xx"
 *}, function() {...})
 *
 * provider.update.name({fullPath: "1/folder1/file", path: "/folder1/", userId: 1, creatorId: 2, userName: "John Doe", newName: "file2"}, function() {...})
 * provider.update.name({fullPath: "1/file", path: "/", userId: 1, creatorId: 2, userName: "John Doe", newName: "file2"}, function() {...})
 *
 * @param  {object}     params   params needed to update the name
 * @param  {Function}   callback
 */
provider.update.name = function(params, callback){
    provider.copy(params.fullPath, {name: params.newName}, params.userId + "/" + (params.path.length ? params.path + "/" : ""), true, params.creatorId, params.userName, callback);
};

/**
 * Update the md5 string of a file
 *
 * ex: provider.update.md5({
 *  fullPath: "x/xx",
 *  md5: "xxxxxx"
 * }, function() {...})
 *
 * @param  {object}   params   params needed to update the md5
 * @param  {Function} callback
 */
provider.update.md5 = function(params, callback){
    mongo.collection('directories', function(error, collection) {
        collection.update({'_id': params.fullPath}, {$set: { md5: params.md5 }}, { safe : true }, callback);
    })
};

/**
 * Update the photo of an user
 *
 * ex: provider.update.userPhoto({
 *  id: xx,
 *  photo: "xxx" // name of the photo in the directory collection
 * }, function() {..})
 *
 * provider.update.userPhoto({id: 1, photo: "5397693987f72298248e5e23.jpg"}, function() {...})
 *
 * @param  {object}   user      user to update
 * @param  {Function} callback
 */
provider.update.userPhoto = function(user, callback) {
    userProvider.get.byId(user.id, function(error, userData) {
        if(!error && userData)
            provider.delete.byPath('1/userPhotos/' + userData.photo, userData.firstname + ' ' + userData.lastname, function(error, data) {
                userProvider.update.photo(user, function(error, data) {
                    callback.call(this, error, data);
                })
            })
        else
            callback.call(this, error, null);
    })
}

/**
 * Increment download number of a file
 * @param  {string}   fullPath fullPath of the file to update
 * @param  {Function} callback
 */
provider.update.downloads = function(fullPath, callback) {
    mongo.collection('directories', function(error, collection) {
        collection.update({'_id': fullPath}, {$inc: { downloads: 1 }}, { safe : true }, callback);
    })
}


/********************************[ UPDATE ]********************************/

/**
 * [RECURSION] Copy or move an item to a folder
 * @param  {document} collection  mongodb directory collection
 * @param  {object} item           item to copy or move
 * @param  {document} updatedItem new item to create if you want to process a rename
 * @param  {string} targetPath  path where to copy or move the file
 * @param  {object} targetItem  item copied or moved
 * @param  {boolean} move        true to move the file
 * @param  {integer} creatorId   id of the creator
 * @param  {string} creatorName name of the creator
 * @param  {Function} start       used for recursion
 * @param  {Function} stop        user for recursion
 */
provider.copyItem = function(collection, item, updatedItem, targetPath, targetItem, move, creatorId, creatorName, start, stop) {
    updatedItem = updatedItem || {};

    var newItem = {};
    _.extend(newItem, item, updatedItem);

    var oldFullPath = newItem._id;
    newItem.path = targetPath.substring(targetPath.indexOf('/'));
    newItem.ownerId = targetPath.substring(0, targetPath.indexOf('/'));
    newItem._id = newItem.ownerId + newItem.path + newItem.name;
    newItem.lastUpdate = new Date();
    provider.getNewName(newItem._id, function(error, newName) {
        if(!error && newName) {

            newItem.name = newName;
            newItem._id = newItem.ownerId + newItem.path + newItem.name;

            if(!targetItem)
                targetItem = newItem;

            var params = {
                fullPath: newItem._id,
                ownerId: newItem.ownerId,
                path: newItem.path,
                name: newItem.name,
                creatorId: creatorId,
                creatorName: creatorName,
                downloads: newItem.downloads || 0
            };

            if(item.type == 'folder')
                provider.create.folder(params, function(error) {
                    var newPath = params.fullPath;
                    if(!error)
                        sharingProvider.get.byItemFullPath(oldFullPath, function(error, sharings) {

                            var callMeBaby = function() {

                                for(var i = 0; i < item.children.length; i++) {
                                    start();
                                    var path = newItem.ownerId + newItem.path + newItem.name + "/";
                                    collection.findOne({'_id': item.children[i]}, function(error, data) {
                                        if(error)
                                            console.error('item not found');
                                        provider.copyItem(collection, data, null, path, targetItem, move, creatorId, creatorName, start, stop);
                                    });
                                }
                                stop(error, targetItem);

                            }

                            if(!error && sharings.length > 0)
                                sharingProvider.duplicateWithNewItemPath({fullPath: oldFullPath, newPath: newPath}, callMeBaby);
                            else
                                callMeBaby();
                        })
                    else
                        console.error('error saving new item - ' + error);

                });
            else
                fileProvider.get.byPath({fullPath: oldFullPath, range: 0}, function(error, data) {
                    if(error)
                        console.error('error getting old file - ' + error);

                    if(move)
                        tokenProvider.delete.byFileId(data.fileId, function(error, data) {
                            if(error)
                                console.log(error);
                        });

                    params.type = data.type;
                    params.data = data.data;
                    params.size = data.length;

                    provider.create.file(params, function(error) {
                        if(error)
                            console.error(error);

                        stop(error, targetItem);
                    });

                });

        }
    });
};

/**
 * Copy or move an item
 * @param  {string}     fullPath    fullPath of the item to copy
 * @param  {document}   updatedItem new item to create if you want to process a rename
 * @param  {string}     targetPath  destination of the item (ex: 15/folder/)
 * @param  {boolean}    move        set to true if you want to move the item instead of a simple copy
 * @param  {boolean}    creatorId   id of the creator
 * @param  {string}     creatorName    name of the user who made the update
 * @param  {Function}   callback
 */
provider.copy = function(fullPath, updatedItem, targetPath, move, creatorId, creatorName, callback) {
    var started = 0;

    if(fullPath + '/' != targetPath) {
        fullPath = fullPath.slice(-1) == '/' ? fullPath.slice(0,-1) : fullPath;
        sharingProvider.get.byItemFullPath(fullPath, function(error, data) {
            if(!error && data && data.length > 0)
                callback.call(this, 'An error has occurred - you can\'t copy - move or rename a shared folder');
            else
                mongo.collection('directories', function(error, collection) {

                    function start() {
                        started++;
                    };
                    function stop(error, data) {
                        if(--started <= 0)
                            end(error, data);
                    };
                    function end(error, data) {
                        if(move)
                            provider.delete.byPath(fullPath, creatorName, function(error) {
                                callback.call(this, error, data);
                            });
                        else
                            callback.call(this, error, data);
                    };

                    collection.findOne({"_id": fullPath}, function(error, item) {
                        if(!error && item) {
                            collection.findOne({"_id": targetPath.slice(0, -1)}, function(error, data) {
                                var pathLength = targetPath.indexOf('/') != -1 ? targetPath.split('/').length : 0;
                                if((!error && data) || pathLength <= 2) {
                                    start();
                                    provider.copyItem(collection, item, updatedItem, targetPath, null, move, parseInt(creatorId, 10), creatorName, start, stop);
                                } else
                                    callback.call(this, 'target path not found');
                            })

                        }
                        else
                            callback.call(this, 'item to copy not found');
                    });
                });
        });
    }
    else
        callback.call(this, "cannot copy an item into himself");
}

/**
 * Get a new name for a file that might already exists
 * @param  {string}   fullPath fullPath of the file
 * @param  {Function} callback returns the newName as data
 */
provider.getNewName = function(fullPath, callback) {
    var newName = fullPath.substring(fullPath.lastIndexOf("/") + 1);

    var name = newName.split(".");
    var extension = '';
    if(name.length !== 1 && (name[0] !== "" || name.length !== 2) )
        extension = name.pop();

    var nameOnly = name.join('.');

    provider.checkExist(fullPath, function(error, data) {
        if(!error && data) {
            newName = nameOnly + '_1';
            newName += extension !== '' ? '.' + extension : '';
            var newPath = fullPath.substring(0, fullPath.lastIndexOf("/") + 1) + newName;
            provider.getNewName(newPath, callback);
        } else {
            callback.call(this, null, newName);
        }
    });

}

/**
 * Check if an item already exists
 * @param  {string}   fullPath fullPath of the item
 * @param  {Function} callback returns false if the item does not exist or the item itself if it exists
 */
provider.checkExist = function(fullPath, callback) {

	if(fullPath == '/')
		callback.call(this, null, true);
	else
		mongo.collection('directories', function(error, collection){
			collection.findOne({"_id": fullPath }, function(error, data) {
				callback.call(this, error, (!error && data));
			})
		})

}

/**
 * share a folder with an other user
 *
 * ex: provider.share({
 *     ownerId: xx
 *     right: 'xx' { R (read) | W (write) | N (nothing) }
 *     targetEmail: "xxx@xxx.xx",
 *     fullPath: "xx/xx/xx"
 * }, function() {...})
 *
 * @param  {object}   params   params needed to share
 * @param  {Function} callback
 */
provider.share = function(params, callback) {
    userProvider.get.byEmail(params.targetEmail, function(error, user) {
        if(!error && user && user.id) {
            provider.unshare({
                targetEmail: user.email,
                ownerId: params.ownerId,
                fullPath: params.fullPath
            }, function() {
                mongo.collection('directories', function(error, collection) {

                    var sharingOptions = {
                        ownerId: params.ownerId,
                        fullPath: params.fullPath,
                        targetId: user.id,
                        right: params.right
                    }
                    sharingProvider.create.sharing(sharingOptions, function(error, data) {

                        historicProvider.create.event({
                            ownerId: params.userId,
                            targetOwner: sharingOptions.targetId,
                            fullPath: params.fullPath,
                            action: 'share',
                            name: params.targetEmail,
                            itemType: params.right
                        });
                        collection.update({'_id': user.id + '/Shared'}, {$push: { children: params.fullPath}}, { safe : true }, function(error) {
                            callback.call(this, error);
                        })

                    });

                })
            })
        }
        else
            callback.call(this, 'An error occured - user not found - ' + error);
    });
}

/**
 * Unshare a folder for all users
 * @param  {string}   fullPath fullPath of the item to unshare
 * @param  {Function} callback
 */
provider.unshareAll = function(fullPath, callback) {
    provider.get.byFullPath(fullPath, function(error, directory) {
        if(!error && directory && directory._id) {
            mongo.collection('directories', function(error, collection) {
                sharingProvider.get.byItemFullPath(fullPath, function(error, sharings) {
                    if(!error && sharings && sharings.length>0)
                        sharingProvider.delete.byItemFullPath(fullPath, function(error, data) {
                            var started = 0;
                            for(var i = 0;i < sharings.length; i++) {
                                started++
                                provider.get.byFullPath(sharings[i].sharedWith + '/Shared', function(error, directory) {
                                    if(!error && directory) {
                                        var index = directory.children.indexOf(fullPath)
                                        if(index != -1)
                                            directory.children.splice(index,1);
                                        collection.save(directory, { safe : true }, function() {
                                            if(--started <= 0)
                                                callback.call(this, error);
                                        });
                                    }

                                });
                            }
                        });
                    else
                        callback.call(this, error);
                }
            )})
        }
        else
            callback.call(this, 'directory not found');
    });
}

/**
 * Unshare a folder for an user
 *
 * ex: provider.unshare({
 *     targetEmail: "xxx@xxx.xx",
 *     ownerId: xx,
 *     fullPath: "xx/xx/x"
 * }, function() {...})
 *
 * @param  {object}   params   params needed to unshare
 * @param  {Function} callback
 */
provider.unshare = function(params, callback) {
    userProvider.get.byEmail(params.targetEmail, function(error, user) {
        if(!error && user) {
            mongo.collection('directories', function(error, collection) {

                var sharingOptions = {
                    ownerId: params.ownerId,
                    fullPath: params.fullPath,
                    targetId: user.id
                }
                sharingProvider.delete.byItemAndTarget(sharingOptions, function(error, data) {

                        provider.get.byFullPath(sharingOptions.targetId + '/Shared', function(error, directory) {
                            historicProvider.create.event({
                                ownerId: params.userId,
                                targetOwner: sharingOptions.targetId,
                                fullPath: params.fullPath,
                                action: 'unshare',
                                name: params.targetEmail,
                                itemType: 'N'
                            });
                            if(!error && directory) {
                                var index = directory.children.indexOf(sharingOptions.fullPath)
                                if(index != -1)
                                    directory.children.splice(index);
                                collection.save(directory, { safe : true }, callback);
                            }
                            else
                                callback.call(this, error);
                        });

                });

            })
        }
        else
            callback.call(this, error);
    });
}

/**
 * Share a file
 *
 * @param  {object}   fullPath   fullPath of the file to unshare
 * @param  {Function} callback
 */
provider.shareFile = function(fullPath, callback) {
    mongo.collection('directories', function(error, collection) {

        provider.get.byFullPath(fullPath, function(error, data) {
            if(!error && data)
                if(data.type == 'file')

                    tokenProvider.get.byFileId(data.itemId, function(error, tokenFound) {
                        if(!tokenFound || tokenFound.length == 0)
                            mysqlTools.generateRandomBytes(32, function(tokenId) {
                                tokenId = encodeURIComponent(tokenId);
                                var token = {
                                    id: tokenId,
                                    expirationDate: new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' '),
                                    type: 'SHARING',
                                    origin: 'none',
                                    fileId: data.itemId
                                };
                                tokenProvider.create.token(token, function(error, data) {
                                    if(!error && data) {
                                        collection.update({'_id': fullPath}, {$set : { shared: true }}, { safe : true }, function (error) {
                                            if(!error)
                                                callback.call(this, null, token);
                                            else
                                               callback.call(this, 'error updating item');
                                        });
                                    }
                                    else
                                        callback.call(this, 'error creating token');
                                });
                            });
                        else
                            callback.call(this, null, tokenFound);
                    });
                else
                    callback.call(this, 'you can\'t publicly share a folder');
            else
                callback.call(this, 'file not found');
        });

    })
}

/**
 * Unshare a file
 * @param  {object}   fullPath   fullPath of the file to share
 * @param  {Function} callback
 */
provider.unshareFile = function(fullPath, callback) {
    mongo.collection('directories', function(error, collection) {

        provider.get.byFullPath(fullPath, function(error, data) {
            if(!error && data)
                if(data.type == 'file')
                    tokenProvider.get.byFileId(data.itemId, function(error, tokenFound) {
                        if(tokenFound && tokenFound.id)
                            tokenProvider.delete.byId(tokenFound.id, function(error, data) {
                                if(!error && data)
                                    collection.update({'_id': fullPath}, {$set : { shared: false }}, { safe : true }, function (error) {
                                        if(!error)
                                            callback.call(this, null);
                                        else
                                           callback.call(this, 'error updating item');
                                    });
                                else
                                    callback.call(this, 'error deleting token');
                            });
                        else
                            callback.call(this, null);
                    });
                else
                    callback.call(this, 'you can\'t publicly unshare a folder');
            else
                callback.call(this, error);
        });

    })
}

module.exports = provider;


