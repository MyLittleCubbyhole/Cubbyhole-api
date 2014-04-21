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
								"_id": params.fullPath,
								"ownerId": parseInt(params.ownerId, 10),
								"path": params.path,
								"name": params.name,
								"type": "folder",
								"size": 0,
								"lastUpdate": new Date(),
								"children": [],
								"sharing": []
							}, { safe : true }, function() {
								if(folderPath != '/')
									provider.get.byPath(folderPath, function(error, directory) {
									    directory.children.push(params.fullPath);
									    collection.save(directory, { safe : true }, callback);
									});
								else {
									console.log('bouh')
									callback.call(this);
								}
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
                            size: params.size,
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
                                    if(folderPath != "/")
                                        provider.get.byPath(folderPath, function(error, directory) {
                                            directory.children.push(params.fullPath);

                                            collection.save(directory, { safe : true }, callback);
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
	,	folderPath = '/';

	function start() {
		started++;
	};
	function stop(error) {
		if(--started <= 0)
			end();
	};
	function end() {
		provider.get.byPath(folderPath, function(error, directory) {
			var index = directory.children.indexOf(fullPath)

			if(index != -1)
				directory.children.splice(index);

			collection.save(directory, { safe : true }, callback);
		});
	};


	mongo.collection('directories', function(error, collection) {
		collection.findOne({"_id": fullPath}, function(error, data) {
			start();
			folderPath = data.path == '/' ? params.path : (data.owner + data.path).slice(0, -1);

			provider.delete.item(collection,  fullPath, start, stop);
		});
    });
}

/********************************[ UPDATE ]********************************/


/********************************[ UPDATE ]********************************/

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