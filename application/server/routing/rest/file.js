var provider 	= require(global.paths.server + '/database/mongodb/collections/gridfs/file')
, 	tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	subscribeProvider = require(global.paths.server + '/database/mysql/tables/subscribe')
,	planProvider = require(global.paths.server + '/database/mysql/tables/plan')
,	dailyQuotaProvider = require(global.paths.server + '/database/mysql/tables/dailyQuota')
,   moment = require('moment')
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
	data.path 	= params[1];// && params[1] != '/' ? params[1].match(/[^\/\\]+/g) : [];
	data.range 	= partialstart && typeof query.nostream === 'undefined' ? parseInt(partialstart,10) : 0;
	data.fullPath = data.userId + '/' + data.path;
	provider.get.byPath(data, function(error, download) {
		if(!error && download) {

			var total 	= download.length;

			if(request.quotaAvailable == undefined || request.quotaAvailable - total >= 0) {
				header["Content-Type"] = download.type;
				header["Accept-Ranges"] = "bytes";

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

				if(request.quotaId !== undefined && request.quotaAvailable !== undefined)
					file.put.updateDailyQuota(request.quotaId, request.quotaAvailable - total, request.planQuota);

			} else {
				response.writeHead(401, header);
				response.write("Quota exceeded.");
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
							subscribeProvider.get.actualSubscription(itemFile[0].ownerId, function(error, subscription) {
								if(!error && subscription) {

									planProvider.get.byId(subscription.planid, function(error, plan) {
										if(!error && plan && plan.id) {
											dailyQuotaProvider.get.current(subscription.id, function(error, dailyQuota) {

												request.params[0] = itemFile[0].ownerId;
												request.params[1] = itemFile[0].path.substring(1) + itemFile[0].name;
												request.planQuota = plan.quota;

												if(!error && dailyQuota && dailyQuota.id) {

													var quotaAvailable = plan.quota - dailyQuota.quotaused;

													request.quotaId = dailyQuota.id;
													request.quotaAvailable = quotaAvailable;
													file.get.download(request, response);

												} else {
													var dailyQuota = {
														day: moment().format('YYYY-MM-DD'),
														quotaUsed: 0,
														subscribeId: subscription.id
													}

													dailyQuotaProvider.create.dailyQuota(dailyQuota, function(error, data) {
														if(!error && data) {
															dailyQuota.id = data.insertId;

															var quotaAvailable = plan.quota - dailyQuota.quotaUsed;
															request.quotaId = dailyQuota.id;
															request.quotaAvailable = quotaAvailable;

															file.get.download(request, response);
														}
														else {
															response.send('error creating dailyQuota');
															response.end();
														}
													})
												}
											});
										} else {
											response.send('plan not found');
											response.end();
										}
									});
								} else {
									response.send('user have no subscription');
									response.end();
								}
							});
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

file.put.updateDailyQuota = function(quotaId, quotaAvailable, planQuota) {
	dailyQuotaProvider.get.byId(quotaId, function(error, dailyQuota) {
		if(!error && dailyQuota && dailyQuota.id) {
			dailyQuota.quotaUsed = planQuota - quotaAvailable;
			dailyQuotaProvider.update.quotaUsed(dailyQuota, function(error, data) {
				if(error)
					console.log(error);
			})
		}
	})
}

module.exports = file;