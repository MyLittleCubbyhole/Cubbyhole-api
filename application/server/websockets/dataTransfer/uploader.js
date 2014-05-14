var uploader = {}
,	files = {}
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');

uploader.init = function(socket) {

	socket.on('upload_init', function (data) {

		var path = data.path
		,	logicPath = typeof path != 'undefined' && path != '/' ? path : '/'
		,	name = data.name;

		if(data.token && data.action == 'addResource')

		if(data.token && logicPath != '/Shared/') 
			tokenProvider.isValidForAuthentication(data.token, function(error, userId) {
				if(!error && userId) {
					files[name] = {
						owner: data.owner,
						creatorId: userId,
						size : data.size,
						type: data.type,
						logicPath: logicPath,
						downloaded : 0,
						currentChunkSize: 0,
						clientSideId: data.id
					};
					var chunk = 0;
					socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[name].clientSideId, 'chunkSize': files[name].currentChunkSize  });
				} else
					socket.emit('upload_stopped', { id: files[name].clientSideId, error: 'invalid token' });
			});
		else
			socket.emit('upload_stopped', { id: data.id, error: 'no token send' });
	});

	socket.on('upload', function(data) {
		var name = data.name;
		files[name].currentChunkSize = data.data.length
		files[name]['downloaded'] += files[name].currentChunkSize;
		var parameters = {
			name: name,
			type: files[name].type,
			data: data.data,
			size: files[name].size,
			path: files[name].logicPath,
			fullPath: files[name].owner + files[name].logicPath + name,
			ownerId: files[name].owner,
			creatorId: files[name].creatorId
		};

		if(files[name].id) {
			parameters.id = files[name].id;
			parameters.mode = 'w+';
			fileProvider.upload(parameters, uploadCallback);
		}
		else {
			directoryProvider.create.file(parameters, uploadCallback)
		}

		function uploadCallback(error){
			if(error) {
				files[name].id = null;
				socket.emit('upload_stopped', { id: files[name].clientSideId, error: error });
				delete files[name];
			}
			else
				if(name && files[name]) {
					files[name].id = parameters.id;
					files[name]._id = parameters.fullPath;
					if(files[name]['downloaded'] >= files[name]['size']){
						files[name].id = null;

						historicProvider.create.event({
							ownerId: files[name].creatorId,
							targetOwner: parameters.fullPath.split('/')[0],
							fullPath: parameters.fullPath,
							action: 'create',
							name: name,
							itemType: 'file'
						});

						socket.emit('upload_done', {
							'downloaded': files[name]['downloaded'],
							'size': files[name]['size'],
							'chunkSize': files[name].currentChunkSize,
							'id': files[name].clientSideId,
							'_id': files[name]._id
						});
						delete files[name];
					}
					else {
						var chunk = files[name]['downloaded'] / 524288;
						var percent = (files[name]['downloaded'] / files[name]['size']) * 100;
						socket.emit('upload_next', {
							'chunk' : chunk,
							'percent' :  percent,
							'downloaded': files[name]['downloaded'],
							'size': files[name]['size'],
							'chunkSize': files[name].currentChunkSize,
							'id': files[name].clientSideId
						});
					}
				}

		}
	});
}

module.exports = uploader;