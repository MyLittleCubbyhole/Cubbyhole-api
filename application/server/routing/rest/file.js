var provider 	= require(global.paths.server + '/database/mongodb/collections/gridfs/file')
,	file	 	= { get : {}, post : {}, put : {}, delete : {} };

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
	data.path 	= params[1] && params[1] != '/' ? params[1].match(/[^\/\\]+/g) : [];
	data.range 	= partialstart && typeof query.nostream === 'undefined' ? parseInt(partialstart,10) : 0;

	//@TODO modifier flux streaming pour rendre fonctionnel sur tous les navigateurs
	provider.find.byPath(data, function(error, download){
		header["Content-Type"]	= download.type;
		header["Accept-Ranges"] = "bytes";
		var total 	= download.length;

		if(typeof request.headers.range !== 'undefined' && typeof query.nostream === 'undefined')
		{
			
			var start 	= parseInt(partialstart, 10)
			,	end 	= partialend ? parseInt(partialend, 10) : total-1;
 
			header["Content-Range"] 	= "bytes " + start + "-" + end + "/" + (total);
			header["Content-Length"]	= (end-start)+1;
			header['Transfer-Encoding'] = 'chunked';
			header["Connection"] 		= "close";
			response.writeHead(206, header); 
			response.write(download.data.slice(start, end), "binary");
		}
		else
		{
			header["Content-Disposition"] 	= ( typeof query.run !== 'undefined' ? 'inline' : 'attachment' ) + '; filename="' + download.metadata.name + '"';
			header["Content-Length"]		= total;
			response.writeHead(200, header );
			response.write(download.data, "binary");
		}
 
		response.end();
	})
	
}

module.exports = file;