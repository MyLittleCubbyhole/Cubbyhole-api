var uploader = {}
,	files = {}
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');

uploader.init = function(socket) {

	socket.on('upload_init', function (data) {

		var name = data.name;
		files[name] = {
			owner: data.owner,
			size : data.size,
			type: data.type,
			logicPath: ['/'],
			downloaded : 0
		}
		var chunk = 0;
		socket.emit('upload_next', { 'chunk' : chunk, percent : 0 });
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
				console.log('upload_done')
				socket.emit('upload_end');
			}
			else {
				var chunk = files[name]['downloaded'] / 524288;
				var percent = (files[name]['downloaded'] / files[name]['size']) * 100;
				console.log('upload_next')
				socket.emit('upload_next', { 'chunk' : chunk, 'percent' :  percent});
			}
		}

	});
}

module.exports = uploader;