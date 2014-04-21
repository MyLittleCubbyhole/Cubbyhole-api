var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file')
,   tools = require(global.paths.server + '/database/tools/mongodb/core')
,   ObjectID = MongoProvider.objectId
,   mongo = MongoProvider.db
,   provider = { get: {}, create: {}, delete: {}, update: {} };

provider.init = function() {
    if(!fileProvider)
    fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');
}

/********************************[  GET   ]********************************/

provider.get.byOwner = function(userId, callback){
	mongo.collection('directories', function(error, collection) {
        collection.findOne({"ownerId":parseInt(userId,10)}, callback);
    });
};

provider.get.byPath = function(fullpath, callback){
	mongo.collection('directories', function(error, collection) {
        collection.findOne({"_id":fullpath}, callback);
	})
}

/********************************[ CREATE ]********************************/

provider.create.folder = function(params, callback){
	var folderPath = params.path != '/' ? params.ownerId + params.path : params.path;
	provider.checkExist(folderPath, function(error, exist) {
		try {
				if(exist)
					mongo.collection('directories', function(error, collection){
						collection.findOne({"_id": params.fullpath }, function(error, data) {
							if(!data && !error) {
								collection.insert({
									"_id": params.fullpath,
									"ownerId": params.ownerId,
									"path": params.path,
									"name": params.name,
									"type": "folder",
									"size": 0,
									"children": [],
									"sharing": []
								}, { safe : true }, callback)
							}

						})
					})
				else
					throw 'folder doesnt exist';
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

                var folderPath = (params.path == '/') ? params.path : (params.owner + params.path).slice(0, -1);

                try {

                    provider.checkExist(folderPath, function(error, exist) {
                        if(!exist)
                            throw 'folder does not exist - '+error;

                        params.id = new ObjectID();
                        var file = {
                            name : params.name
                        ,   type : 'file'
                        ,   id   : params.id
                        ,   sharing : []
                        };

                        var directoryFile = {
                            _id: params.fullPath,
                            ownerId: params.owner,
                            path: params.path,
                            name: params.name,
                            type: 'file',
                            size: parseInt(params.size, 10),
                            itemId: params.id
                        };

                        fileProvider.upload(params, function(error){
                            if(error)
                                throw 'error during upload - '+error;

                            console.log('uploaded - ', params.id);

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

provider.delete.byPath = function(params, callback){
	mongo.collection('directories', function(error, collection) {
		collection.findOne({"ownerId":parseInt(params.userId,10)}, function(error, data){
			if(!error && data){
				try {

					var notOnRoot 		= params.path.length > 0
					,	dir 			= notOnRoot ? tools.browse(params.path, data.root, true) : {type:'folder', content:data.root}
					,	index 			= -1
					,	target			= {};

					if(dir.type != 'folder')
						throw "invalid path";

					for(var i in dir.content)
						if(dir.content[i].name == params.name){
							target = dir.content[i];
							index = i;
						}

					if(index == -1)
						throw "target not found"

					if(target.type == 'file')
						fileProvider.delete.file(target.id, function(error, deletedFile){
							if(!error){
								dir.content.splice(index, 1);
								collection.save( data, { safe : true }, callback);
							}
							else
								callback.call(this, error);
						})
					else{
						var properties = [];
						tools.browseAndGetProperties(target.content, properties, ['id']);
						var counter = properties.length;
						if(counter>0)
							for(var i in properties)
								fileProvider.delete.file(properties[i].id, function(error, deletedFile){
									if(!error && --counter<=0){
										dir.content.splice(index, 1);
										collection.save( data, { safe : true }, callback);
									}
								})
						else{
							dir.content.splice(index, 1)
							collection.save( data, { safe : true }, callback);
						}
					}
				}
				catch(exception){
					callback.call(this, exception);
				}
            }
			else
				callback.call(this, 'user repository not found');

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
                    mongo.collection('directories', function(error, collection) {
                        started++;
                        collection.save(directory, { safe : true }, function(error) {
                            started--;
                            if(error)
                                throw 'error updating size - ' + error;

                            if(started <= 0 && i == nbFolders)
                                callback.call(this, null);
                        });
                    });
                }
                catch(exception){
                    callback.call(this, exception);
                }
            });
        }
    }
}


/********************************[ UPDATE ]********************************/

provider.checkExist = function(fullpath, callback) {

	if(fullpath == '/')
		callback.call(this, null, true);
	else
		mongo.collection('directories', function(error, collection){
			collection.findOne({"_id": fullpath }, function(error, data) {
				callback.call(this, error, (!error && data));
			})
		})

}

module.exports = provider;