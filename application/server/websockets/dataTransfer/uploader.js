var uploader = {}
,	files = {}
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,   subscribeProvider = require(global.paths.server + '/database/mysql/tables/subscribe')
,   planProvider = require(global.paths.server + '/database/mysql/tables/plan')
,   storageProvider = require(global.paths.server + '/database/mysql/tables/storage')
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
,	sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings')
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file')
,	MongoProvider = require(global.paths.server + '/database/mongodb/core').get()
,   ObjectID = MongoProvider.objectId;

uploader.init = function(socket, sockets) {

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
					var fullPath = files[id].owner + files[id].logicPath + files[id].name;

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

													if(files[id].creatorId == files[id].owner) {
														socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[id].clientSideId, 'chunkSize': files[id].currentChunkSize  });
													}
													else {
														fullPath = fullPath.slice(-1) != '/' || !request.params[1] ? fullPath :fullPath.slice(0, -1);
														sharingProvider.checkRight({fullPath: fullPath, targetId: files[id].creatorId}, function(error, data) {
															if(!error && data && data.right == 'W')
																socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[id].clientSideId, 'chunkSize': files[id].currentChunkSize  });
															else {
																socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'An error has occured - method not allowed' });
																delete files[id];
															}
														})
													}
												} else{
													socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'your cubbyhole is full' });
													delete files[id];
												}
											} else{
												socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'error getting the current used space' });
												delete files[id];
											}
										})
									else{
										socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'error getting your actual plan' });
										delete files[id];
									}
								})
							else{
								socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'error getting your actual subscription' });
								delete files[id];
							}
						})
				} else{
					socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'invalid token' });
					delete files[id];
				}
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
							else {
								historicProvider.create.event({
									ownerId: files[id].creatorId,
									targetOwner: parameters.fullPath.split('/')[0],
									fullPath: parameters.fullPath,
									action: 'create',
									name: name,
									itemType: 'file'
								});

								storageProvider.update.value(files[id].owner, files[id]['size'], function(error, updated) {
									if(error) console.log(error);
								});
							}

							if(fileMd5)
								directoryProvider.update.md5({fullPath: parameters.fullPath, md5: fileMd5}, function(error, data) {
									if(error)
										console.log(error);
								});

							files[id].fullPath = parameters.fullPath;
							if(fileMd5)
								files[id].md5 = fileMd5;

							socket.emit('upload_done', {
								'downloaded': files[id]['downloaded'],
								'size': files[id]['size'],
								'chunkSize': files[id].currentChunkSize,
								'id': files[id].clientSideId,
								'_id': files[id]._id,
								'name': files[id].uploadPhoto ? files[id].name : ''
							});

							var fileToSend = files[id];
							sharingProvider.isShared(parameters.fullPath, function(data) {
								if(data.length > 0)
									for(var i = 0; i<data.length; i++)
										sockets.in(data[i]._id).emit( 'create_file', fileToSend);
							});

							sockets.in('user_'+files[id].owner).emit('create_file', fileToSend);

							delete files[id];
						}
						else {
							var chunk = files[id]['downloaded'] / 524288;
							// var chunk = files[id]['downloaded'] / 1572864;
							var percent = files[id]['downloaded'] / files[id]['size'];
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