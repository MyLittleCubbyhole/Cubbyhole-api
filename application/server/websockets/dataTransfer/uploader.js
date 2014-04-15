var uploader = {}
,	files = {}
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');

uploader.init = function(socket) {

	socket.on('upload_init', function (data) {

		var path = data.path
		,	logicPath = typeof path != 'undefined' && path != '/' ? path.match(/[^\/\\]+/g) : []
		,	name = data.name;
		
		logicPath.push('/');

		files[name] = {
			owner: data.owner,
			size : data.size,
			type: data.type,
			logicPath: logicPath,
			downloaded : 0,
			clientSideId: data.id
		}

		var chunk = 0;
		socket.emit('upload_next', { 'chunk' : chunk, percent : 0, 'id': files[name].clientSideId  });
	});

	socket.on('upload', function(data) {

		var name = data.name;
		files[name]['downloaded'] += data.data.length;

		var parameters = {
			name: name, 
			type: files[name].type, 
			data: data.data, 
			logicPath: files[name].logicPath, 
			owner: files[name].owner
		};

		if(files[name].id) {
			parameters.id = files[name].id;
			parameters.mode = 'w+';
			fileProvider.upload(parameters, uploadCallback);
		}
		else
			directoryProvider.create.file(parameters, uploadCallback)

		function uploadCallback(error){

			files[name].id = parameters.id;
			if(files[name]['downloaded'] == files[name]['size']){
				files[name].id = null;
				socket.emit('upload_done', { id: files[name].clientSideId });
				delete files[name];
			}
			else {
				var chunk = files[name]['downloaded'] / 524288;
				var percent = (files[name]['downloaded'] / files[name]['size']) * 100;
				socket.emit('upload_next', { 'chunk' : chunk, 'percent' :  percent, 'id': files[name].clientSideId });
			}
		}

	});
}

module.exports = uploader;