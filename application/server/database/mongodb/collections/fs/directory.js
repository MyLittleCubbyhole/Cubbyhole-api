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

provider.get.byPath = function(fullPath, callback){
	mongo.collection('directories', function(error, collection) {
        collection.findOne({"_id":fullPath}, callback);
	})
}


/********************************[ CREATE ]********************************/

provider.create.folder = function(params, callback){
	var folderPath = params.path != '/' ? params.ownerId + params.path : params.path;
	provider.checkExist(folderPath, function(error, exist) {
		try {
				if(exist)
					mongo.collection('directories', function(error, collection){
						collection.findOne({"_id": params.fullPath }, function(error, data) {
							if(!data && !error) {
								collection.insert({
									"_id": params.fullPath,
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
            if(error && !data) {

                var folderPath = (params.path == '/') ? params.path : (params.ownerId + params.path).slice(0, -1);

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
                            ownerId: params.ownerId,
                            path: params.path,
                            name: params.name,
                            type: 'file',
                            size: 0,
                            itemId: params.id
                        };

                        fileProvider.upload(params, function(error, fileLength){
                            if(error)
                                throw 'error during upload - '+error;

                            console.log('uploaded - ', params.id);

                            fileProvider.get.metadata(params.id, function(error, metadata) {
                                if(error)
                                    throw 'error retrieving file metadata - ' + error;

                                directoryFile.md5 = metadata.md5;

                                collection.save(directoryFile, { safe : true }, function(error) {
                                    if(folderPath != "/")
                                        provider.get.byPath(folderPath, function(error, directory ) {
                                            directory.children.push(params.fullPath);

                                            collection.save(directory, { safe : true }, callback);
                                        });
                                    else
                                        callback.call(this, error);

                                });
                            })
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
			if(data.type == 'folder') {
				for(var i = 0; i< data.children.length; i++) {
					start();
					provider.delete.item(collection, data.children[i], start, stop);
				}
				collection.remove({"_id":fullPath}, function(error,data) { console.log('folder deleted', error, data); stop() });
			}
			else {
				fileProvider.delete.file(data.itemId, function(error) {
					if(error)
						throw 'problem occured during deleting file '+error;
				})
				collection.remove({"_id":fullPath}, function(error,data) { console.log('file deleted', error, data); stop() });
			}
		}
		else
			stop('not found');
	})

}

provider.delete.byPath = function( fullPath, callback){

	var started = 0;

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


	mongo.collection('directories', function(error, collection) {
		collection.findOne({"_id": fullPath}, function(error, data) {
			start();
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