var uploader = {}
,	files = {}
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');

uploader.init = function(socket) {

	socket.on('upload_init', function (data) {

		var path = data.path
		,	logicPath = typeof path != 'undefined' && path != '/' ? path : '/'
		// , logicPath = "/dossier/"
		,	name = data.name;
		console.log(logicPath);
		files[name] = {
			owner: data.owner,
			size : data.size,
			type: data.type,
			logicPath: logicPath,
			downloaded : 0,
			currentChunkSize: 0,
			clientSideId: data.id
		}
		console.log('init - ', name);

		var chunk = 0;
		socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[name].clientSideId, 'chunkSize': files[name].currentChunkSize  });
	});

	socket.on('upload', function(data) {
		console.log('upload')
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
			ownerId: files[name].owner
		};

		console.log(parameters['name'],parameters['type'],parameters['size'],parameters['path'],parameters['fullPath'],parameters['ownerId'])
		if(files[name].id) {
			parameters.id = files[name].id;
			parameters.mode = 'w+';
			console.log('upload avancement', parameters.id)
			fileProvider.upload(parameters, uploadCallback);
		}
		else {
			console.log('create')
			directoryProvider.create.file(parameters, uploadCallback)
		}

		function uploadCallback(error){
			if(error) {
				console.log('error, stop', error)
				files[name].id = null;
				socket.emit('upload_stoped', { id: files[name].clientSideId });
				delete files[name];
			}
			else 
				if(name && files[name]) {

					console.log(parameters.id,files,  files[name], name)
					files[name].id = parameters.id;
					if(files[name]['downloaded'] >= files[name]['size']){
						console.log('file uploaded');
						files[name].id = null;


						historicProvider.create.event({
							//todo recup par token l'id
							ownerId: files[name].owner,
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
							'id': files[name].clientSideId 
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