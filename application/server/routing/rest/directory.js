var provider 	= require('../../database/collection/fs/directory.js')
,	directory 	= { get : {}, post : {}, put : {}, delete : {} };


/********************************[  GET   ]********************************/

directory.get.all 		= function(request, response){
	provider.find(function(error, data){
		response.send( (!error ? data : error ) );
	})
};

directory.get.byOwner 	= function(request, response){
	var params = request.params;
	provider.findByOwner(params[0], function(error, data){
		response.send( (!error ? data : error ) );
	})
};

directory.get.byPath	= function(request, response){
	var params 	= request.params;
	var userId 	= params[0]
	,	path 	= params[1] && params[1] != '/' ? params[1].match(/[^\/\\]+/g) : []
	,	url		= request.url;
	params[1] && params[1].slice(-1) == '/' && path.push('/');

	provider.findPath({ "userId" : userId, "path" : path }, function(error, data){
		response.send( (!error ? data : error ) );
	})
}

/********************************[  POST  ]********************************/

directory.post.init	= function(request, response){
	var userId = request.params[0];
	provider.createDirectory(userId, function(error, data){
		response.send({'information': (!error ? 'directory created' : 'An error has occurred - ' + error) });
	})
}

directory.post.create = function(request, response){
	var params 		= request.params
	,	body 		= request.body
	,	parameters 	= {};
	parameters.userId 	= params[0]
	parameters.path 	= params[1] && params[1] ? params[1].match(/[^\/\\]+/g) : []
	parameters.name 	= body.name;
	parameters.path.push('/');

	if(!parameters.name)
		response.send({'information': 'An error has occurred - folder name must be defined', 'params' : parameters });
	else
		provider.createFolder(parameters, function(error, data){
			parameters.path.pop();
			response.send({'information': (!error ? 'folder created' : 'An error has occurred - ' + error), 'params' : parameters });
		})

}

directory.post.upload = function(request, response){
	//request body si c'est du server to server // a modifier par la suite quand on fera de l'upload par socket
	var data 	= request.files ? request.files.file : request.body
	,	params 	= request.params;
	data.lPath 	= params[1] && params[1] != '/' ? params[1].match(/[^\/\\]+/g) : [];
	data.lPath.push('/');

	data.owner = params[0];

	provider.createFile(data, function(error){
		response.send( (!error ? 'file uploaded' : error ) );
	})


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

    if(!parameters.newName)
        response.send({'information': 'An error has occurred - folder or file name must be defined', 'params' : parameters });
    else
        provider.updateName(parameters, function(error, data) {
            response.send({'information': (!error ? 'file or folder renamed' : 'An error has occurred - ' + error), 'params' : parameters });
        });

}

/********************************[ DELETE ]********************************/

directory.delete.byOwner 	= function(request, response){
	var userId = request.params[0];
	provider.deleteByOwner(userId, function(error, data){
		response.send({'information': (!error ? 'directory deleted' : 'An error has occurred - ' + error) });
	})
}

directory.delete.byPath		= function(request, response){
	var params 		= request.params
	,	body 		= request.body
	,	parameters 	= {};
	parameters.userId 	= params[0]
	parameters.path 	= params[1] && params[1] ? params[1].match(/[^\/\\]+/g) : []
	parameters.name 	= parameters.path.pop();

	if(!parameters.name)
		response.send({'information': 'An error has occurred - target name must be defined', 'params' : parameters });
	else
		provider.deleteByPath(parameters, function(error, data){
			response.send({'information': (!error ? 'target deleted' : 'An error has occurred - ' + error), 'params' : parameters });
		})
}

module.exports = directory;
