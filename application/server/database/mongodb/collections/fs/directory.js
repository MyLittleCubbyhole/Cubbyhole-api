var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file')
,   tools = require(global.paths.server + '/database/tools/mongodb/core')
,   ObjectID = MongoProvider.objectId
,   mongo = MongoProvider.db
,   provider = { get: {}, create: {}, delete: {}, update: {} };


/********************************[  GET   ]********************************/


/********************************[ CREATE ]********************************/

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
                                        provider.get.byPath(folderPath, function(error, directory, ) {
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


/********************************[ UPDATE ]********************************/


module.exports = provider;