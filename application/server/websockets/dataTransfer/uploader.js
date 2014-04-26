var uploader = {}
,	files = {}
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');

uploader.init = function(socket) {

	socket.on('upload_init', function (data) {

		var path = data.path
		,	logicPath = typeof path != 'undefined' && path != '/' ? path : '/'
		// , logicPath = "/dossier/"
		,	name = data.name;

		files[name] = {
			owner: data.owner,
			size : data.size,
			type: data.type,
			logicPath: logicPath,
			downloaded : 0,
			clientSideId: data.id
		}
		console.log('init - ', name);

		var chunk = 0;
		socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[name].clientSideId  });
	});

	socket.on('upload', function(data) {
		console.log('upload')
		var name = data.name;
		files[name]['downloaded'] += data.data.length;
		var parameters = {
			name: name,
			type: files[name].type,
			data: data.data,
			size: files[name].size,
			path: files[name].logicPath,
			fullPath: files[name].owner + files[name].logicPath + name,
			ownerId: files[name].owner
		};

		if(files[name].id) {
			parameters.id = files[name].id;
			parameters.mode = 'w+';
			fileProvider.upload(parameters, uploadCallback);
		}
		else
			directoryProvider.create.file(parameters, uploadCallback)

		function uploadCallback(error){
			if(error) {
				console.log(error);
				files[name].id = null;
				socket.emit('upload_stoped', { id: files[name].clientSideId });
				delete files[name];
			}
			else {

				files[name].id = parameters.id;
				if(files[name]['downloaded'] >= files[name]['size']){
					console.log('file uploaded');
					files[name].id = null;
					socket.emit('upload_done', { 'downloaded': files[name]['downloaded'], id: files[name].clientSideId });
					delete files[name];
				}
				else {
					console.log('chunk uploaded');
					var chunk = files[name]['downloaded'] / 524288;
					var percent = (files[name]['downloaded'] / files[name]['size']) * 100;
					socket.emit('upload_next', { 'chunk' : chunk, 'percent' :  percent, 'downloaded': files[name]['downloaded'], 'size': files[name]['size'], 'id': files[name].clientSideId });
				}
			}
		}

	});
}

module.exports = uploader;