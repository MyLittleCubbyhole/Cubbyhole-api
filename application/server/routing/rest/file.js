var provider 	= require(global.paths.server + '/database/mongodb/collections/gridfs/file')
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
	data.path 	= params[1] && params[1] != '/' ? params[1].match(/[^\/\\]+/g) : [];
	data.range 	= partialstart && typeof query.nostream === 'undefined' ? parseInt(partialstart,10) : 0;

	provider.get.byPath(data, function(error, download){
		if(!error && download) {

			header["Content-Type"] = download.type;
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
		}
		else
			console.error('unable to download file -', error);
		response.end();
	})
	
}

file.get.zip = function(request, response) {	
	
	var params 	= request.params;
	var data = {};
	data.userId = params[0];
	data.path 	= params[1] ? params[1].match(/[^\/\\]+/g) : [];
	data.range 	= 0;
	data.path.push('/');
		
	provider.zip(data, function(data) {

		response.write(data, "binary");
		response.end();
	});
		
		
}



module.exports = file;