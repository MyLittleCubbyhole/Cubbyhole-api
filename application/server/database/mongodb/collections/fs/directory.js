var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file')
,   tools = require(global.paths.server + '/database/tools/mongodb/core')
,   _ = require('lodash')
,   ObjectID = MongoProvider.objectId
,   mongo = MongoProvider.db
,   provider = { get: {}, create: {}, delete: {}, update: {} };

provider.init = function() {
    if(!fileProvider)
    fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');
}

/********************************[  GET   ]********************************/

provider.get.directory = function(callback){
	mongo.collection('directories', function(error, collection) {
		collection.find().toArray(callback);
    });
}

provider.get.byOwner = function(ownerId, callback){
	mongo.collection('directories', function(error, collection) {
        collection.find({"ownerId":parseInt(ownerId,10)}).toArray(callback);
    });
};

provider.get.byPath = function(fullPath, callback){
	mongo.collection('directories', function(error, collection) {
        collection.findOne({"_id":fullPath}, callback);
	})
}

/********************************[ CREATE ]********************************/

provider.create.folder = function(params, callback){
	var folderPath = params.path != '/' ? params.ownerId + params.path.slice(0, -1) : params.path;
	provider.checkExist(folderPath, function(error, exist) {
		try {
			if(exist)
				mongo.collection('directories', function(error, collection){
					collection.findOne({"_id": params.fullPath }, function(error, data) {
						if(!data && !error) {
							collection.insert({
								_id: params.fullPath,
								ownerId: parseInt(params.ownerId, 10),
								path: params.path,
								name: params.name,
								type: "folder",
								size: 0,
								lastUpdate: new Date(),
								children: [],
								sharing: []
							}, { safe : true }, function() {
								if(folderPath != '/')
									provider.get.byPath(folderPath, function(error, directory) {
									    directory.children.push(params.fullPath);
									    collection.save(directory, { safe : true }, callback);
									});
								else
									callback.call(this);
							})
						}
						else
							throw 'folder already exist'

					})
				})
			else {
				throw 'parent doesnt exist';
			}
		}
		catch(exception) {
			callback.call(this, exception)
		}
	})
}

provider.create.file = function(params, callback){
    mongo.collection('directories', function(error, collection){
        collection.findOne({"_id":params.fullPath}, function(error, data){
            if(!data) {

                var folderPath = params.path == '/' ? params.path : (params.owner + params.path).slice(0, -1);

                try {

                    provider.checkExist(folderPath, function(error, exist) {
                        if(!exist)
                            throw 'folder does not exist - '+error;

                        params.id = new ObjectID();

                        var directoryFile = {
                            _id: params.fullPath,
                            ownerId: parseInt(params.owner, 10),
                            path: params.path,
                            name: params.name,
                            type: 'file',
                            lastUpdate: new Date(),
                            size: parseInt(params.size, 10),
                            itemId: params.id
                        };

                        fileProvider.upload(params, function(error){
                            if(error)
                                throw 'error during upload - '+error;

                            fileProvider.get.MD5(params.id, function(error, fileMd5) {
                                if(error)
                                    throw 'error retrieving file created - '+error;

                                directoryFile.md5 = fileMd5;

                                collection.insert(directoryFile, { safe : true }, function(error) {
                                    if(error)
                                        throw 'error creating collection - '+error;

                                    if(folderPath != "/")
                                        provider.get.byPath(folderPath, function(error, directory) {
                                            if(error)
                                                throw 'error getting folder - '+error;

                                            directory.children.push(params.fullPath);

                                            collection.save(directory, { safe : true }, function(error) {
                                                if(error)
                                                    throw 'error updating children - '+error;

                                                provider.update.size(folderPath, directoryFile.size, function(error) {
                                                    callback.call(this, error);
                                                });
                                            });
                                        });
                                    else
                                        callback.call(this, error);

                                });
                            });
                        })
                    });
                }
                catch(exception){
                    callback.call(this, exception);
                }
            }
            else
                callback.call(this, 'file already exist');
        })
    })
}


/********************************[ DELETE ]********************************/

provider.delete.byOwner = function(ownerId, callback) {
	mongo.collection('directories', function(error, collection) {
        collection.remove({"ownerId":parseInt(ownerId,10)}, {safe:true}, callback);
    });
}

provider.delete.item = function(collection, fullPath, start, stop) {
	collection.findOne({"_id":fullPath}, function(error, data) {

		if(!error && data) {
			if(data.type == 'folder')
				for(var i = 0; i< data.children.length; i++) {
					start();
					provider.delete.item(collection, data.children[i], start, stop);
				}
			else
				fileProvider.delete.file(data.itemId, function(error) {
					if(error)
						throw 'problem occured during deleting file '+error;
				})
			collection.remove({"_id":fullPath}, function(error,data) { console.log('file deleted', error, data); stop() });
		}
		else
			stop('not found');
	})

}

provider.delete.byPath = function( fullPath, callback){

	var started = 0
	,	size = 0
	,	folderPath = '/';

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
				provider.update.size(folderPath, size, function() {
					provider.get.byPath(folderPath, function(error, directory) {
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
			else
				callback.call(this);
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

provider.update.size = function(fullFolderPath, sizeUpdate, callback) {

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

                provider.get.byPath(path, function(error, directory) {

                    directory.size += parseInt(sizeUpdate, 10);

                    try {
                        started++;
                        collection.save(directory, { safe : true }, function(error) {
                            started--;
                            if(error)
                                throw 'error updating size - ' + error;

                            if(started <= 0 && i == nbFolders)
                                callback.call(this, null);
                        });

                    }
                    catch(exception){
                        callback.call(this, exception);
                    }
                });
            }
        });
    }
}

provider.update.name = function(params, callback){
    mongo.collection('directories', function(error, collection){
        try {
            collection.findOne({"_id":params.fullPath}, function(error, itemToUpdate){
                if(error)
                    throw "invalid path";

                var newFullPath = itemToUpdate.ownerId + itemToUpdate.path + params.newName;

                collection.findOne({"_id":newFullPath}, function(error, newdata){
                    if(newdata)
                        throw "file or folder already exist";

                    itemToUpdate._id = newFullPath;
                    itemToUpdate.name = params.newName;

                    collection.remove({"_id":params.fullPath}, function(error, data) {
                        if(error)
                            throw "error removing file to update _id";

                        collection.save(itemToUpdate, { safe : true }, function(error) {
                            if(error)
                                throw "error saving directory with new name"

                            if(itemToUpdate.type == 'file')
                                fileProvider.update.fileName(itemToUpdate, callback);
                            else
                                callback.call(this, null);
                        });
                    });
                });
            });
        }
        catch(exception){
            callback.call(this, exception);
        }
    });
};


/********************************[ UPDATE ]********************************/

/**
 * [copy copy or move an item]
 * @param  {document}   item        item to copy
 * @param  {document}   updatedItem new item to create if you want to process a rename
 * @param  {string}     targetPath  estination of the item
 * @param  {boolean}    move        set to true if you want to move the item instead of a simple copy
 * @param  {Function} callback
 */
provider.copyItem = function(collection, item, updatedItem, targetPath, move, start, stop) {
    try {
        updatedItem = updatedItem || {};

        var newItem = {};
        _.extend(newItem, item, updatedItem);

        newItem.name += '_1';
        newItem.path = targetPath;
        newItem._id = newItem.ownerId + newItem.path + newItem.name;
        newItem.lastUpdate = new Date();

        collection.save(newItem, { safe : true }, function(error) {
            if(error)
                throw error;

            if(item.type == 'folder') {
                for(var i = 0; i < item.children.length; i++) {

                    var path = newItem.path + newItem.name + "/";
                    collection.findOne({'_id': item.children[i]}, function(error, data) {
                        if(error)
                            throw 'item not found';
                        start();
                        provider.copyItem(collection, data, null, path, false, start, stop);
                    });
                }
            }
            stop();
        });

    }
    catch(exception){
        stop(exception);
    }
};

provider.copy = function(fullPath, updatedItem, targetPath, move, callback) {
    var started = 0;

    mongo.collection('directories', function(error, collection) {

        function start() {
            started++;
        };
        function stop(error) {
            if(--started <= 0)
                end();
        };
        function end() {
            callback.call(this);
        };

        collection.findOne({"_id": fullPath}, function(error, item) {
            if(!error && item) {
                start();
                provider.copyItem(collection, item, null, targetPath, move, start, stop);
            }
            else
                callback.call(this, error);
        });
    });
}

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

module.exports = provider;