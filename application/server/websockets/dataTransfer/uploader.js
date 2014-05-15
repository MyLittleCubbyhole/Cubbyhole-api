var uploader = {}
,	files = {}
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
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

		if(data.token && logicPath != '/Shared/')
			tokenProvider.isValidForAuthentication(data.token, function(error, userId) {
				if(!error && userId) {

					files[id] = {
						owner: data.owner,
						name: name,
						creatorId: userId,
						size : data.size,
						type: data.type,
						logicPath: logicPath,
						downloaded : 0,
						currentChunkSize: 0,
						clientSideId: data.id
					};

					if(data.uploadPhoto) {
						files[id].owner = 1;
						files[id].name = new ObjectID() + name.slice(name.lastIndexOf('.'));
						files[id].logicPath = '/userPhotos/'
					}

					var chunk = 0;
					socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[id].clientSideId, 'chunkSize': files[id].currentChunkSize  });
				} else
					socket.emit('upload_stopped', { id: files[id].clientSideId, error: 'invalid token' });
			});
		else
			socket.emit('upload_stopped', { id: data.id, error: 'no token send' });
	});

	socket.on('upload', function(data) {
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
			creatorId: files[id].creatorId
		};

		if(files[id].id) {
			parameters.id = files[id].id;
			parameters.mode = 'w+';
			fileProvider.upload(parameters, uploadCallback);
		}
		else {
			directoryProvider.create.file(parameters, uploadCallback)
		}

		function uploadCallback(error){
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

						historicProvider.create.event({
							ownerId: files[id].creatorId,
							targetOwner: parameters.fullPath.split('/')[0],
							fullPath: parameters.fullPath,
							action: 'create',
							name: name,
							itemType: 'file'
						});

						socket.emit('upload_done', {
							'downloaded': files[id]['downloaded'],
							'size': files[id]['size'],
							'chunkSize': files[id].currentChunkSize,
							'id': files[id].clientSideId,
							'_id': files[id]._id
						});
						delete files[id];
					}
					else {
						var chunk = files[id]['downloaded'] / 524288;
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
	});
}

module.exports = uploader;