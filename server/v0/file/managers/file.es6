/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

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

	function createFile() {}

// 	provider.create.file = function(params, callback){
// 	mongo.collection('directories', function(error, collection){
// 		collection.findOne({"_id":params.fullPath}, function(error, data){
// 			if(!data) {

// 				var folderPath = params.path == '/' ? params.path : (params.ownerId + params.path).slice(0, -1);
// 				var userId = params.ownerId;


// 				provider.checkExist(folderPath, function(error, exist) {
// 					if(!exist)
// 						callback.call(this, 'folder does not exist - ' + error);

// 					params.id = new ObjectID();

// 					var directoryFile = {
// 						_id: params.fullPath,
// 						ownerId: parseInt(params.ownerId, 10),
// 						creatorId: parseInt(params.creatorId, 10),
// 						path: params.path,
// 						name: params.name,
// 						type: 'file',
// 						lastUpdate: new Date(),
// 						lastUpdateName: params.creatorName,
// 						downloads: params.downloads ? parseInt(params.downloads, 10) : 0,
// 						size: params.size ? parseInt(params.size, 10) : 0,
// 						shared: false,
// 						itemId: params.id,
// 						contentType: params.type
// 					};

// 					var next = function() {
// 						fileProvider.get.MD5(params.id, function(error, fileMd5) {
// 							if(error)
// 								throw 'error retrieving file created - ' + error;

// 							directoryFile.md5 = fileMd5;

// 							collection.insert(directoryFile, { safe : true }, function(error) {
// 								if(error)
// 									throw 'error creating collection - ' + error;

// 								if(folderPath != "/")

// 									collection.update({'_id': folderPath}, { $push: { children: params.fullPath} }, { safe : true }, function(error) {
// 										if(error) {
// 											console.error(error);
// 											throw 'error updating children - ';
// 										}
// 										provider.update.size(userId, folderPath, directoryFile.size, directoryFile.lastUpdateName, function(error) {
// 											callback.call(this, error, fileMd5);
// 										});

// 									});
// 								else
// 									storageProvider.update.value(userId, directoryFile.size, function(error, data) {
// 										callback.call(this, error, fileMd5);
// 									});

// 							});
// 						});
// 					}

// 					if(params.data && params.data.path) {
// 						fileProvider.uploadFromPath(params, function(error, data) {
// 							if(error) {
// 								console.error(error);
// 								throw 'Error during post upload - ';
// 							}
// 							next();
// 						});
// 					}
// 					else {
// 						fileProvider.upload(params, function(error){
// 							if(error) {
// 								console.error(error);
// 								throw 'error during upload - ';
// 							}
// 							next();
// 						});
// 					}
// 				});
// 			}
// 			else
// 				callback.call(this, 'file already exist');
// 		})
// 	})
// }