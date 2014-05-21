var uploader = {}
,	files = {}
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,   subscribeProvider = require(global.paths.server + '/database/mysql/tables/subscribe')
,   planProvider = require(global.paths.server + '/database/mysql/tables/plan')
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file')
,	MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   ObjectID = MongoProvider.objectId;

uploader.init = function(socket) {

	socket.on('upload_init', function (data) {

		var path = data.path
		,	logicPath = typeof path != 'undefined' && path != '/' ? path : '/'
		,	name = data.name
		,	id = data.id;

		if(data.token && logicPath != '/Shared/') {

			files[id] = {
				owner: data.owner,
				name: name,
				size : data.size,
				type: data.type,
				logicPath: logicPath,
				downloaded : 0,
				currentChunkSize: 0,
				clientSideId: data.id
			};

			tokenProvider.isValidForAuthentication(data.token, function(error, tokenInfos) {
				if(!error && tokenInfos && tokenInfos.userid) {

					files[id].creatorId = tokenInfos.userid;
					files[id].creatorName = tokenInfos.firstname + ' ' + tokenInfos.lastname;

					if(data.uploadPhoto) {
						files[id].owner = 1;
						files[id].name = new ObjectID() + name.slice(name.lastIndexOf('.'));
						files[id].logicPath = '/userPhotos/';
						files[id].uploadPhoto = true;
						var chunk = 0;
						socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[id].clientSideId, 'chunkSize': files[id].currentChunkSize  });
					} else
						subscribeProvider.get.actualSubscription(data.owner, function(error, subscribe) {
							if(!error && subscribe && subscribe.id)
								planProvider.get.byId(subscribe.planid, function(error, plan) {
									if(!error && plan && plan.id)
										directoryProvider.get.totalSize(data.owner, function(error, totalSize) {
											if(!error && totalSize) {
												if((totalSize.length == 0 && files[id].size <= plan.storage) || (totalSize[0] && (totalSize[0].size + files[id].size) <= plan.storage)) {
													var chunk = 0;
													socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[id].clientSideId, 'chunkSize': files[id].currentChunkSize  });
												} else
													socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'your cubbyhole is full' });
											} else
												socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'error getting the current used space' });
										})
									else
										socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'error getting your actual plan' });
								})
							else
								socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'error getting your actual subscription' });
						})
				} else
					socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'invalid token' });
			});
		}
		else
			socket.emit('upload_stopped', { id: data.id, error: 'no token send' });
	});

	socket.on('upload', function(data) {
		upload();
		function upload() {
			var	id = data.id
			,	name = data.name;

			files[id].currentChunkSize = data.data.length
			files[id]['downloaded'] += files[id].currentChunkSize;
			var parameters = {
				name: files[id].name,
				type: files[id].type,
				data: data.data,
				size: files[id].size,
				path: files[id].logicPath,
				fullPath: files[id].owner + files[id].logicPath + files[id].name,
				ownerId: files[id].owner,
				creatorId: files[id].creatorId,
				creatorName: files[id].creatorName
			};

			if(files[id].id) {
				parameters.id = files[id].id;
				parameters.mode = 'w+';
				fileProvider.upload(parameters, uploadCallback);
			}
			else {
				directoryProvider.create.file(parameters, uploadCallback);
			}

			function uploadCallback(error, fileMd5){
				if(error) {
					files[id].id = null;
					socket.emit('upload_stopped', { id: files[id].clientSideId, error: error });
					delete files[id];
				}
				else
					if(id && files[id]) {
						files[id].id = parameters.id;
						files[id]._id = parameters.fullPath;
						if(files[id]['downloaded'] >= files[id]['size']){
							files[id].id = null;

							if(files[id].uploadPhoto)
								directoryProvider.update.userPhoto({id: files[id].creatorId, photo: files[id].name}, function(error, data) {
									if(error)
										console.log(error);
								});
							else
								historicProvider.create.event({
									ownerId: files[id].creatorId,
									targetOwner: parameters.fullPath.split('/')[0],
									fullPath: parameters.fullPath,
									action: 'create',
									name: name,
									itemType: 'file'
								});

							if(fileMd5)
								directoryProvider.update.md5({fullPath: parameters.fullPath, md5: fileMd5}, function(error, data) {
									if(error)
										console.log(error);
								});


							socket.emit('upload_done', {
								'downloaded': files[id]['downloaded'],
								'size': files[id]['size'],
								'chunkSize': files[id].currentChunkSize,
								'id': files[id].clientSideId,
								'_id': files[id]._id,
								'name': files[id].uploadPhoto ? files[id].name : ''
							});
							delete files[id];
						}
						else {
							// var chunk = files[id]['downloaded'] / 524288;
							var chunk = files[id]['downloaded'] / 1572864;
							var percent = (files[id]['downloaded'] / files[id]['size']) * 100;
							socket.emit('upload_next', {
								'chunk' : chunk,
								'percent' :  percent,
								'downloaded': files[id]['downloaded'],
								'size': files[id]['size'],
								'chunkSize': files[id].currentChunkSize,
								'id': files[id].clientSideId
							});
						}
					}

			}
		}
	});
}

module.exports = uploader;