var provider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
,	mongoTools = require(global.paths.server + '/database/tools/mongodb/core')
,	mysqlTools = require(global.paths.server + '/database/tools/mysql/core')
,	directory = { get : {}, post : {}, put : {}, delete : {} };
provider.init();

/********************************[  GET   ]********************************/

directory.get.all = function(request, response){
	provider.get.directory(function(error, data){
		response.send( (!error ? data : error ) );
		response.end();
	})
};

directory.get.byOwner = function(request, response){
	var params = request.params;
	provider.get.byOwner(params[0], function(error, data){
		response.send( (!error && data ? mongoTools.format(data) : error ) );
		response.end();
	})
};

directory.get.byPath = function(request, response){
	var params 	= request.params
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.path = params[1] ? params[1].slice(0, -1) : '/' ;
	parameters.arrayPath = params[1] && params[1] != '/' ? params[1].match(/[^\/\\]+/g) : []
	parameters.fullPath = parameters.ownerId + '/' + parameters.path;

	params[1] && params[1].slice(-1) == '/' && parameters.arrayPath.push('/');

	var useSharing = parameters.path.split('/')[0] == 'Shared' && parameters.path.split('/')[1] !== undefined;

	if(parameters.path.split('/')[0] != 'Shared' || useSharing) {

		if(useSharing) {
			var fullPath = parameters.path.split('/');
			fullPath.splice(0, 1);
			parameters.ownerId = fullPath.splice(0, 1)[0];
			parameters.path = fullPath.join('/');
		}

		provider.get.byPath(parameters.ownerId, (parameters.path == '/' ? parameters.path : '/' + parameters.path + '/'), function(error, data) {
			if(!error && data && data.length > 0) {
				mysqlTools.setOwnersNames(data, function(error, data) {
					response.send( (!error && data ? data : error ) );
				})
			} else {
				response.send( (!error && data ? data : error ) );
				response.end();
			}
		})
	}
	else {
		provider.get.childrenByFullPath(parameters.fullPath, function(error, data) {
			response.send( (!error && data ? data : error ) );
			response.end();
		})
	}
}

/********************************[  POST  ]********************************/

directory.post.init	= function(request, response){
	var userId = request.params[0];
	provider.create.directory(userId, function(error, data){
		response.send({'information': (!error ? 'directory created' : 'An error has occurred - ' + error) });
	})
}

directory.post.create = function(request, response){
	var params 		= request.params
	,	body 		= request.body
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.path = params[1] ? params[1] + '/' : '/' ;

	parameters.name = body.name;
	parameters.fullPath = parameters.ownerId + parameters.path + parameters.name;

	if(!parameters.name)
		response.send({'information': 'An error has occurred - folder name must be defined', 'params' : parameters });
	else
		provider.create.folder(parameters, function(error, data) {

			historicProvider.create.event({
				ownerId: request.userId,
				targetOwner: parameters.fullPath.split('/')[0],
				fullPath: parameters.fullPath,
				action: 'create',
				name: parameters.name,
				itemType: 'folder'
			});

			response.send({'information': (!error ? 'folder created' : 'An error has occurred - ' + error), 'params' : parameters });
			response.end();
		})

}

directory.post.copy = function(request, response){
	var params 		= request.params
	,	body 		= request.body
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.path = params[1] || '/' ;
	parameters.move = params.move || false;

	parameters.targetPath = body.path;

	var fullPath = parameters.ownerId + parameters.path
	,	arrayPath = fullPath.split('/');

	var name = arrayPath[arrayPath.length-1] != '/' ? arrayPath[arrayPath.length-1] : arrayPath[arrayPath.length-2]
	,	type = arrayPath[arrayPath.length-1] != '/' ? 'file' : 'folder';

	if(!parameters.path)
		response.send({'information': 'An error has occurred - target path must be defined', 'params' : parameters });
	else
		provider.copy(fullPath, null, parameters.targetPath, parameters.move,  function(error) {

			historicProvider.create.event({
				ownerId: request.userId,
				targetOwner: fullPath.split('/')[0],
				fullPath: fullPath,
				action: 'copy',
				name: name,
				itemType: type
			});

			response.send({'information': (!error ? 'copy done' : 'An error has occurred - ' + error), 'params' : parameters });
			response.end();
		})

}

directory.post.move = function(request, response) {
	request.params.move = true;
	directory.post.copy(request, response);
}

directory.post.share = function(request, response) {
	var params = request.params
	,	body = request.body
	,	parameters = {};
	parameters.ownerId 	= params[0]
	parameters.right = body.right;
	parameters.targetEmail = body.shareTo;
	parameters.fullPath = parameters.ownerId + (params[1].slice(-1)  == '/' ? params[1].slice(0,-1) : params[1]) ;

	provider.share(parameters, function(error) {
		historicProvider.create.event({
			ownerId: request.userId,
			targetOwner: parameters.fullPath.split('/')[0],
			fullPath: parameters.fullPath,
			action: 'share',
			name: parameters.targetEmail,
			itemType: parameters.right
		});
		response.send({'information': (!error ? 'folder shared' : 'An error has occurred - ' + error), 'params' : parameters });
		response.end();
	});
}

/********************************[  PUT   ]********************************/

directory.put.rename = function(request, response){

    var params 	= request.params
    ,	body 	= request.body
    ,	parameters 	= {};

    parameters.userId 	= params[0]
    parameters.path 	= params[1] && params[1] ? params[1].match(/[^\/\\]+/g) : []
    parameters.currentName = parameters.path.pop();
    parameters.newName 	= body.name;

    parameters.fullPath = parameters.userId + "/" + (parameters.path.length ? parameters.path + "/" : "") + parameters.currentName;

    if(!parameters.newName)
        response.send({'information': 'An error has occurred - folder or file name must be defined', 'params' : parameters });
    else
        provider.update.name(parameters, function(error, data) {
			historicProvider.create.event({
				ownerId: request.userId,
				targetOwner: parameters.userId,
				fullPath: parameters.fullPath,
				action: 'rename',
				name: parameters.newName,
				itemType: 'file|folder'
			});
            response.send({'information': (!error ? 'file or folder renamed' : 'An error has occurred - ' + error), 'params' : parameters });
            response.end();
        });

}

/********************************[ DELETE ]********************************/

directory.delete.byOwner 	= function(request, response){
	var userId = request.params[0];
	provider.delete.byOwner(userId, function(error, data){
		historicProvider.create.event({
			ownerId: request.userId,
			targetOwner: userId,
			fullPath: '',
			action: 'delete',
			name: '',
			itemType: ''
		});
		response.send({'information': (!error ? 'directory deleted' : 'An error has occurred - ' + error) });
		response.end();
	})
}

directory.delete.byPath		= function(request, response){
	var params 		= request.params
	,	body 		= request.body
	,	parameters 	= {};

	var fullPath = params[0] + params[1]
	,	type = fullPath.slice(-1) == '/' ? 'folder' : 'file';

	fullPath = fullPath.slice(-1) == '/' ? fullPath.slice(0,-1) : fullPath;
	var path = params[1].split('/');


	if(!params[1])
		response.send({'information': 'An error has occurred - target name must be defined', 'params' : parameters });
	else
		provider.delete.byPath(fullPath, function(error, data){
			historicProvider.create.event({
				ownerId: request.userId,
				targetOwner: fullPath.split('/')[0],
				fullPath: fullPath,
				action: 'delete',
				name: path[path.length-1],
				itemType: type
			});
			response.send({'information': (!error ? 'target deleted' : 'An error has occurred - ' + error), 'params' : parameters });
		})
}

module.exports = directory;
