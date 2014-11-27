var provider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
,   sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings')
,	mongoTools = require(global.paths.server + '/database/tools/mongodb/core')
,	mysqlTools = require(global.paths.server + '/database/tools/mysql/core')
,	socket = require(global.paths.server + '/websockets/core')
,	directory = { get : {}, post : {}, put : {}, delete : {} };
provider.init();
mysqlTools.init();

/********************************[  GET   ]********************************/

/**
 * Get all items of all users
 * @param  {object} request
 * @param  {object} response
 */
directory.get.all = function(request, response){
	provider.get.directory(function(error, data){
		response.send( (!error ? data : error ) );
		response.end();
	})
};

/**
 * Get all items of an user
 * @param  {object} request
 * @param  {object} response
 */
directory.get.byOwner = function(request, response){
	var params = request.params;
	if(!request.owner) {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}

	provider.get.byOwner(params[0], function(error, data){
		response.send( (!error && data ? mongoTools.format(data) : error ) );
		response.end();
	})
};

/**
 * Get an item by his path
 * @param  {object} request
 * @param  {object} response
 */
directory.get.byPath = function(request, response){
	var params 	= request.params
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.path = params[1] || '/' ;
	parameters.arrayPath = params[1] && params[1] != '/' ? params[1].match(/[^\/\\]+/g) : []

	var details = true;
	if(parameters.path.slice(-1) == "/") {
		details = false;
		parameters.path = parameters.path == '/' ? parameters.path : parameters.path.slice(0, -1);
	}

	parameters.fullPath = parameters.ownerId + '/' + parameters.path;

	params[1] && params[1].slice(-1) == '/' && parameters.arrayPath.push('/');

	var useSharing = parameters.path.split('/')[0] == 'Shared' && parameters.path.split('/')[1] !== undefined;


	if(request.right != 'R' && request.right != 'W' ) {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}

	if(parameters.path.split('/')[0] != 'Shared' || useSharing) {

		if(useSharing) {
			var fullPath = parameters.path.split('/');
			fullPath.splice(0, 1);
			parameters.ownerId = fullPath.splice(0, 1)[0];
			parameters.path = fullPath.join('/');
		}

		if(!details)
			provider.get.byPath(parameters.ownerId, (parameters.path == '/' ? parameters.path : '/' + parameters.path + '/'), function(error, data) {
				if(!error && data && data.length > 0) {
					mysqlTools.setCreatorsNames(data, function(error, data) {
						response.send( (!error && data ? data : error ) );
					})
				} else {
					response.send( (!error && data ? data : error ) );
					response.end();
				}
			})
		else
			provider.get.byFullPath(parameters.fullPath, function(error, data) {
				var array = [];
				if(!error && data && data._id) {
					array.push(data);
					mysqlTools.setCreatorsNames(array, function(error, data) {
						response.send( (!error && data ? data : error ) );
					})
				} else {
					response.send( (!error && array ? array : error ) );
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

/**
 * Get the size of an item
 * @param  {object} request
 * @param  {object} response
 */
directory.get.size = function(request, response) {
	var params = request.params
	,	parameters 	= {};
	parameters.ownerId = params[0];
	if(!request.owner) {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}
	provider.get.size(parameters.ownerId, function(error, data) {
		response.send( (!error && data ? data : error ) );
	})

}

/********************************[  POST  ]********************************/

/**
 * Create a folder
 *
 *  needed parameters in the body:
 *  {
 *      name: "xxx"
 *  }
 *
 * @param  {object} request
 * @param  {object} response
 */
directory.post.create = function(request, response){
	var params 		= request.params
	,	body 		= request.body
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.creatorId = request.userId;
	parameters.path = params[1] ? params[1] + '/' : '/' ;

	parameters.name = body.name;
	parameters.fullPath = parameters.ownerId + parameters.path + parameters.name;
	parameters.creatorName = request.userName;

	if(request.right != 'W') {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}

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

			if(!error) {
				sharingProvider.isShared(parameters.fullPath, function(data) {
					if(data.length > 0)
						for(var i = 0; i<data.length; i++)
							socket.send(data[i]._id, 'create_folder', parameters);
				});

				socket.send('user_'+request.ownerId, 'create_folder', parameters);
			}

			response.send({'information': (!error ? 'folder created' : 'An error has occurred - ' + error), 'params' : parameters });
			response.end();
		})

}

/**
 * Copy an item to a folder
 *
 *  needed parameters in the body:
 *  {
 *      path: "xx/xxx/"
 *  }
 *
 * @param  {object} request
 * @param  {object} response
 */
directory.post.copy = function(request, response){
	var params 		= request.params
	,	body 		= request.body
	,	parameters 	= {};
	parameters.ownerId 	= request.ownerId;
	parameters.creatorId = request.userId;
	parameters.creator = request.userName;
	parameters.path = params[1] || '/' ;
	parameters.move = params.move || false;

	parameters.targetPath = body.path;
	var targetId = parseInt(parameters.targetPath.substring(0, parameters.targetPath.indexOf('/')), 10);


    if(targetId == 1) {
        request.right = 'R';
        request.owner = false;
        next();
    }
    else {
        if(targetId == parameters.creatorId) {
            request.right = 'W';
            request.owner = true;
            next();
        }
        else {
            sharingProvider.checkRight({fullPath: parameters.targetPath.slice(0, -1), targetId: parameters.creatorId}, function(error, data) {
                if(!error && data) {
                    request.right = data.right;
                    request.owner = false;
                }
                else
                    request.right = null;

                next();
            });
        }
    }

	function next() {
		if(request.right != 'W') {
			response.send({'information': 'An error has occurred - method not allowed'});
			return;
		}

		var fullPath = parameters.ownerId + parameters.path
		,	arrayPath = fullPath.split('/');
		parameters.baseFullPath = fullPath;

		var name = arrayPath[arrayPath.length-1] != '/' ? arrayPath[arrayPath.length-1] : arrayPath[arrayPath.length-2]
		,	type = arrayPath[arrayPath.length-1] != '/' ? 'file' : 'folder';

		if(!parameters.path)
			response.send({'information': 'An error has occurred - target path must be defined', 'params' : parameters });
		else
			provider.copy(fullPath, null, parameters.targetPath, parameters.move, parameters.creatorId, request.userName, function(error, data) {
				if(!error) {
					provider.get.byId(data._id, function(error, data) {
						if(!error && data) {
							parameters.newName = data.name;
							parameters.size = data.size;
							parameters.type = data.type;
							parameters.fullPath  = data._id;

							historicProvider.create.event({
								ownerId: request.userId,
								targetOwner: fullPath.split('/')[0],
								fullPath: parameters.targetPath,
								action: 'move',
								name: fullPath.split('/').pop(),
								itemType: type
							});

							sharingProvider.isShared(parameters.baseFullPath, function(data) {
								if(data.length > 0)
									for(var i = 0; i<data.length; i++)
										socket.send(data[i]._id, 'copy', parameters);
							});

							socket.send('user_'+request.ownerId, 'copy', parameters);
						}

						response.send({'information': (!error ? 'copy done' : 'An error has occurred - ' + error), 'params' : parameters });
						response.end();
					});
				} else {
					response.send({'information': (!error ? 'copy done' : 'An error has occurred - ' + error), 'params' : parameters });
					response.end();
				}

			})
	}

}

/**
 * Move an item to a folder. Call the copy method with a move parameter
 * @param  {[type]} request  [description]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */
directory.post.move = function(request, response) {

	if(request.right != 'W') {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}
	request.params.move = true;
	directory.post.copy(request, response);
}

/**
 * Share a folder with another user
 *
 *  needed parameters in the body:
 *  {
 *      target: "xxx@xxx.xx",
 *      right: "x" (R | W)
 *  }
 *
 * @param  {object} request
 * @param  {object} response
 */
directory.post.share = function(request, response) {
	var params = request.params
	,	body = request.body
	,	parameters = {};
	parameters.ownerId 	= params[0];
	parameters.userId 	= request.userId;
	parameters.right = body.right || '';
	parameters.targetEmail = body.target;
	parameters.fullPath = parameters.ownerId + (params[1].slice(-1)  == '/' ? params[1].slice(0,-1) : params[1]) ;

	parameters.right = parameters.right.toUpperCase();

	if(request.right != 'W') {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}

	if(parameters.right != 'W' && parameters.right != 'R'){
		response.send({'information': 'An error has occurred - Bad right'});
		return;
	}



	provider.share(parameters, function(error) {
		response.send({'information': (!error ? 'folder shared' : 'An error has occurred - ' + error), 'params' : parameters });
		response.end();
	});
}

/**
 * Unshare a folder with an user
 *
 *  needed parameters in the body:
 *  {
 *      target: "xxx@xxx.xx"
 *  }
 *
 * @param  {object} request
 * @param  {object} response
 */
directory.post.unshare = function(request, response) {
	var params = request.params
	,	body = request.body
	,	parameters = {};
	parameters.ownerId 	= params[0]
	parameters.userId 	= request.userId;
	parameters.targetEmail = body.target;
	parameters.fullPath = parameters.ownerId + (params[1].slice(-1)  == '/' ? params[1].slice(0,-1) : params[1]) ;

	if(!request.owner) {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}

	provider.unshare(parameters, function(error) {
		response.send({'information': (!error ? 'folder unshared' : 'An error has occurred - ' + error), 'params' : parameters });
		response.end();
	});
}

/********************************[  PUT   ]********************************/

/**
 * Rename an item
 *
 *  needed parameters in the body:
 *  {
 *      name: "xxx"
 *  }
 *
 * @param  {object} request
 * @param  {object} response
 */
directory.put.rename = function(request, response){

    var params 	= request.params
    ,	body 	= request.body
    ,	parameters 	= {};

    parameters.userId = params[0]
    parameters.path = params[1] && params[1] ? params[1].match(/[^\/\\]+/g) : []
    parameters.currentName = parameters.path.pop();
    parameters.newName 	= body.name;
    parameters.path = parameters.path.join('/');
    parameters.userName = request.userName;
    parameters.creatorId = request.userId;

	if(request.right != 'W') {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}

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

			if(!error) {
				sharingProvider.isShared(parameters.fullPath, function(data) {
					if(data.length > 0)
						for(var i = 0; i<data.length; i++)
							socket.send(data[i]._id, 'rename', parameters);
				});

				socket.send('user_'+request.ownerId, 'rename', parameters);
			}

            response.send({'information': (!error ? 'file or folder renamed' : 'An error has occurred - ' + error), 'params' : parameters });
            response.end();
        });

}

/********************************[ DELETE ]********************************/

/**
 * Delete an item
 * @param  {object} request
 * @param  {object} response
 */
directory.delete.byOwner 	= function(request, response){
	var userId = request.params[0];

	if(request.right != 'W') {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}

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

/**
 * Delete an item by his path
 * @param  {object} request
 * @param  {object} response
 */
directory.delete.byPath		= function(request, response){
	var params 		= request.params
	,	body 		= request.body
	,	parameters 	= {};

	var fullPath = params[0] + '/' + params[1]
	,	type = fullPath.slice(-1) == '/' ? 'folder' : 'file';

	fullPath = fullPath.slice(-1) == '/' ? fullPath.slice(0,-1) : fullPath;
	var path = params[1].split('/');

	if(request.right != 'W') {
		response.send({'information': 'An error has occurred - method not allowed'});
		return;
	}
	provider.get.byId(fullPath, function(error, item) {
		sharingProvider.get.byItemFullPath(fullPath, function(error, data) {
				if((request.owner || item.creatorId == request.userId) && !error){
					if(!params[1])
						response.send({'information': 'An error has occurred - target name must be defined', 'params' : parameters });
					else
						provider.delete.byPath(fullPath, request.userName, function(error, data){
							historicProvider.create.event({
								ownerId: request.userId,
								targetOwner: fullPath.split('/')[0],
								fullPath: fullPath,
								action: 'delete',
								name: fullPath.split('/').pop(),
								itemType: type
							});


							if(!error) {
								sharingProvider.isShared(fullPath, function(data) {
									if(data.length > 0)
										for(var i = 0; i<data.length; i++)
											socket.send(data[i]._id, 'delete', {'fullPath': fullPath});
								});

								socket.send('user_'+request.ownerId, 'delete', {'fullPath': fullPath});
							}

							response.send({'information': (!error ? 'target deleted' : 'An error has occurred - ' + error), 'params' : parameters });
						})
				}
				else
					response.send({'information': 'An error has occurred - method not allowed'});
			})
	})


}

module.exports = directory;
