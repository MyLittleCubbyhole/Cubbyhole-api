var provider 	= require(global.paths.server + '/database/mongodb/collections/gridfs/file')
, 	tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	file	 	= { get : {}, post : {}, put : {}, delete : {} };
provider.init();

file.get.download = function(request, response){
	var params 	= request.params
	,	query 	= request.query
	,	range 	= request.headers.range
	,	data 	= {}
	,	header 	= {};

	if(typeof request.headers.range !== 'undefined')
	{
		var parts 			= range.replace(/bytes=/, "").split("-")
		,	partialstart 	= parts[0]
		,	partialend 		= parts[1];
	}

	data.userId = params[0];
	data.path 	= params[1];
	data.range 	= partialstart && typeof query.nostream === 'undefined' ? parseInt(partialstart,10) : 0;
	data.fullPath = data.userId + '/' + data.path;
	provider.get.byPath(data, function(error, download) {
		if(!error && download) {

			header["Content-Type"] = download.type;
			header["Accept-Ranges"] = "bytes";
			var total 	= download.length;

			if(typeof request.headers.range !== 'undefined' && typeof query.nostream === 'undefined') {
				var start 	= parseInt(partialstart, 10)
				,	end 	= partialend ? parseInt(partialend, 10) : total-1;

				header["Content-Range"] 	= "bytes " + start + "-" + end + "/" + (total);
				header["Content-Length"]	= (end-start)+1;
				header['Transfer-Encoding'] = 'chunked';
				header["Connection"] 		= "close";
				response.writeHead(206, header);
				response.write(download.data.slice(start, end), "binary");
			}
			else {
				header["Content-Disposition"] 	= ( typeof query.run !== 'undefined' ? 'inline' : 'attachment' ) + '; filename="' + download.metadata.name + '"';
				header["Content-Length"]		= total;
				response.writeHead(200, header );
				response.write(download.data, "binary");
			}
		}
		else
			console.error('unable to download file -', error);
		response.end();
	})

}

file.get.share 	= function(request, response) {
	var params 	= request.params
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.path = params[1] || '/' ;
	parameters.fullPath = parameters.ownerId + '/' + parameters.path;

	directoryProvider.shareFile(parameters.fullPath, function(error, data) {
		response.send({'information': (!error ? 'file shared' : 'An error has occurred - ' + error), 'token' : data.id });
	})
}

file.get.unshare 	= function(request, response) {
	var params 	= request.params
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.path = params[1] || '/' ;
	parameters.fullPath = parameters.ownerId + '/' + parameters.path;

	directoryProvider.unshareFile(parameters.fullPath, function(error, data) {
		response.send({'information': (!error ? 'file unshared' : 'An error has occurred - ' + error)});
	})
}

file.get.shared 	= function(request, response) {
	var params 	= request.params
	,	parameters 	= {};
	parameters.token = encodeURIComponent((params[0] || 0));

	tokenProvider.get.byId(parameters.token, function(error, token) {
		if(!error && token) {
			if(token.type == 'SHARING' && token.fileid)
				directoryProvider.get.byItemId(token.fileid, function(error, itemFile) {
					if(!error && itemFile && itemFile[0] && itemFile[0].type == 'file') {
						if(request.preview) {
							request.params[0] = itemFile[0].ownerId;
							request.params[1] = itemFile[0].path.substring(1) + itemFile[0].name;
							file.get.download(request, response);
						} else {
							delete itemFile[0]._id;
							delete itemFile[0].ownerId;
							delete itemFile[0].path;
							delete itemFile[0].itemId;
							response.send(itemFile);
							response.end();
						}
					}
					else {
						response.send('file not found');
						response.end();
					}
				})
			else {
				response.send('token not found');
				response.end();
			}
		} else {
			response.send(error);
			response.end();
		}
	});
}

file.get.sharedPreview 	= function(request, response) {
	request.preview = true;
	file.get.shared(request, response);
}

file.get.zip = function(request, response) {
	var params 	= request.params
	,	header = {}
	,	data = {};
	data.ownerId = params[0];
	data.path 	= params[1] ? params[1].match(/[^\/\\]+/g) : [];
	data.range 	= 0;
	data.path.push('/');

	data.fullPath = data.ownerId + '/' + params[1];

	var callback = function(zipFile) {
		header["Content-Disposition"] 	= 'attachment; filename="' + zipFile.name + '"';
		response.writeHead(200, header);
		response.write(zipFile.data, "binary");
		response.end();
	}

	provider.zip(data, {callback: callback});


}

file.post.zip = function(request, response) {
	var params 	= request.params
	,	body = request.body
	,	header = {}
	,	data = {};
	data.ownerId = params[0];
	data.path 	= params[1] ? params[1].match(/[^\/\\]+/g) : [];
	data.range 	= 0;
	data.path.push('/');

	data.items = [];
	for(var i in body) {
		path = body[i].slice(-1) != '/' ? body[i] : body[i].substring(0, body[i].length - 1);
		data.items.push(path);
	}

	var callback = function(error, zipFile) {
		if(!error) {
			header["Content-Disposition"] 	= 'attachment; filename="' + zipFile.name + '"';
			response.writeHead(200, header);
			response.write(zipFile.data, "binary");
		}
		response.end();
	}
	provider.zipItems(data, callback)

}

module.exports = file;