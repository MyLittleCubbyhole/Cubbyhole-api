var MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file')
,	tools = require(global.paths.server + '/database/tools/mongodb/core')
,	ObjectID = MongoProvider.objectId
,	mongo = MongoProvider.db
,	provider = { get: {}, create: {}, delete: {}, update: {} };

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

provider.get.byOwner = function(userId, callback){
	mongo.collection('directories', function(error, collection) {
        collection.findOne({"ownerId":parseInt(userId,10)}, callback);
    });
};

provider.get.byPath = function(params, callback){
	provider.get.byOwner(params.userId, function(error, data){
		if(!error && data)
			data = tools.browse(params.path, data.root);
		else
			error = 'user repository not found or offline database';
		callback.call(this, error, data);
	})
}


/********************************[ CREATE ]********************************/

provider.create.directory = function(userId, callback){
	mongo.collection('directories', function(error, collection){

		provider.get.byOwner(userId, function(error, data){
			if(!data && !error)
				collection.insert({
					ownerId : parseInt(userId,10)
				,	lastUpdate : new Date()
				,	sharing : []
				,	root : []
				}, { safe : true }, callback)
			else
				callback.call(this, 'id already used or offline database');
		})
	})
}

provider.create.folder = function(params, callback){
	mongo.collection('directories', function(error, collection){
		collection.findOne({"ownerId":parseInt(params.userId,10)}, function(error, data){
			if(!error && data){
				var folder = {
					name : params.name
				,	type : 'folder'
				,	content : []
				,	sharing : []
				};
				try {
					var dir = params.path.length > 1 ? tools.browse(params.path, data.root, true) : data.root;
					for(var i in dir)
						if(dir[i].name == params.name)
							throw "folder already exist";
					dir.push(folder);
					collection.save( data, { safe : true }, callback);
				}
				catch(exception){
					callback.call(this, exception);
				}
			}
			else
				callback.call(this, 'user repository not found');
		})
	})
}

provider.create.file = function(params, callback){
	mongo.collection('directories', function(error, collection){
		collection.findOne({"ownerId":parseInt(params.owner,10)}, function(error, data){
			if(!error && data) {

				params.id = new ObjectID();
				var file = {
					name : params.name
				,	type : 'file'
				,	id 	 : params.id
				,	sharing : []
				};
				try {
					var dir = params.logicPath.length > 1 ? tools.browse(params.logicPath, data.root, true) : data.root;
					for(var i in dir)
						if(dir[i].name == params.name)
							throw "file already exist";

					fileProvider.upload(params, function(error){
						if(error)
							throw 'error during upload - '+error;
						dir.push(file);
						console.log('uploaded - ', params.id)
						collection.save( data, { safe : true }, callback);
					})
				}
				catch(exception){
					callback.call(this, exception);
				}
			}
			else
				callback.call(this, 'user repository not found');
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

provider.update.name = function(params, callback){
	mongo.collection('directories', function(error, collection){
		collection.findOne({"ownerId":parseInt(params.userId,10)}, function(error, data){
			if(!error){
				try {
                    var notOnRoot	= params.path.length > 0
                    ,	dir			= notOnRoot ? tools.browse(params.path, data.root, true) : {type:'folder', content:data.root}
                    ,	index		= -1
                    ,	target		= {};

                    if(dir.type != 'folder')
                        throw "invalid path";

                    for(var i in dir.content)
                        if(dir.content[i].name == params.currentName){
                            target = dir.content[i];
                            index = i;
                        }
                        else
							if(dir.content[i].name == params.newName)
								throw "file or folder already exist";


                    if(index == -1)
                        throw "target not found"

                    target.name = params.newName;

					if(target.type == 'file') {
                        fileProvider.update.fileName(target, function(error) {
                            collection.save(data, { safe : true }, callback);
                        });
                    }
                    else {
                        collection.save(data, { safe : true }, callback);
                    }

				}
				catch(exception){
					callback.call(this, exception);
				}
			}
		});
	});
}

module.exports = provider;