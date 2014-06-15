var provider 	= require(global.paths.server + '/database/mongodb/collections/gridfs/file')
, 	tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings')
,	fileProvider = require(global.paths.server + '/database/mongodb/collections/gridfs/file')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
,	subscribeProvider = require(global.paths.server + '/database/mysql/tables/subscribe')
,	planProvider = require(global.paths.server + '/database/mysql/tables/plan')
,	storageProvider = require(global.paths.server + '/database/mysql/tables/storage')
,	dailyQuotaProvider = require(global.paths.server + '/database/mysql/tables/dailyQuota')
,	userProvider = require(global.paths.server + '/database/mysql/tables/user')
,	socket = require(global.paths.server + '/websockets/core')
,   config = require(global.paths.server + '/config/core').get()
,	fs = require('fs')
,   moment = require('moment')
,	file	 	= { get : {}, post : {}, put : {}, delete : {} };
provider.init();

/**
 * Download a file normally or stream it
 * @param  {object} request
 * @param  {object} response
 */
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

	// Write some informations in a file to manage bandwidth limitations thanks to a call to a QOS daemon
	userProvider.bandwidth(data.userId, function(error, user) {
		var row = user.id + ';' + user.upload + ';' + user.download + ';' + request.client.remotePort + ';download\n';
		if(config.limit_file && !error && user.id)
			fs.appendFile(config.limit_file, row, function (error) {
				if(error)
					throw 'an error occured';
			});
	})

	provider.get.byPath(data, function(error, download) {
		if(!error && download) {

			var total 	= download.length;

			if(request.quotaAvailable === undefined || request.quotaAvailable - total >= 0) {
				header['Content-Type'] = download.type + '; charset=ISO-8859-15';
				header['Accept-Ranges'] = "bytes";

				if(typeof request.headers.range !== 'undefined' && typeof query.nostream === 'undefined') {
					var start 	= parseInt(partialstart, 10)
					,	end 	= partialend ? parseInt(partialend, 10) : total-1;
					header['Content-Range'] 	= "bytes " + start + "-" + end + "/" + (total);
					header['Content-Length']	= (end-start)+1;
					header['Transfer-Encoding'] = 'chunked';
					header['Connection'] 		= "close";
					response.writeHead(206, header);
					response.write(download.data.slice(start, end), "binary");
				}
				else {
					header['Content-Disposition'] 	= ( typeof query.run !== 'undefined' ? 'inline' : 'attachment' ) + '; filename="' + download.metadata.name + '"';
					header['Content-Length']		= total;
					response.writeHead(200, header );
					response.write(download.data, "binary");

					if(request.quotaId !== undefined && request.quotaAvailable !== undefined)
						dailyQuotaProvider.update.dailyQuota(request.quotaId, request.quotaAvailable - total, request.planQuota);
				}

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

/**
 * Share a file publicly
 * @param  {object} request
 * @param  {object} response
 */
file.get.share 	= function(request, response) {
	var params 	= request.params
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.path = params[1] || '/' ;
	parameters.fullPath = parameters.ownerId + '/' + parameters.path;

	directoryProvider.shareFile(parameters.fullPath, function(error, data) {
		historicProvider.create.event({
			ownerId: request.userId,
			targetOwner: parameters.ownerId,
			fullPath: parameters.fullPath,
			action: 'share',
			name: 'public',
			itemType: ''
		});
		response.send({'information': (!error ? 'file shared' : 'An error has occurred - ' + error), 'token' : (data ? data.id : null) });
	})
}

/**
 * Unshare a public file
 * @param  {object} request
 * @param  {object} response
 */
file.get.unshare 	= function(request, response) {
	var params 	= request.params
	,	parameters 	= {};
	parameters.ownerId 	= params[0]
	parameters.path = params[1] || '/' ;
	parameters.fullPath = parameters.ownerId + '/' + parameters.path;

	directoryProvider.unshareFile(parameters.fullPath, function(error, data) {
		historicProvider.create.event({
			ownerId: request.userId,
			targetOwner: parameters.ownerId,
			fullPath: parameters.fullPath,
			action: 'unshare',
			name: 'public',
			itemType: ''
		});
		response.send({'information': (!error ? 'file unshared' : 'An error has occurred - ' + error)});
	})
}

/**
 * Get a file shared publicly
 * @param  {object} request
 * @param  {object} response
 */
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

												directoryProvider.update.downloads(itemFile[0]._id, function(error, data) {
								                    if(error)
								                        console.log('error updating downloads number ' - error);
								                });

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

/**
 * Preview a file shared publicly
 * @param  {object} request
 * @param  {object} response
 */
file.get.sharedPreview 	= function(request, response) {
	request.preview = true;
	file.get.shared(request, response);
}

/**
 * Get a zip of a folder
 * @param  {object} request
 * @param  {object} response
 */
file.get.zip = function(request, response) {
	var params 	= request.params
	,	header = {}
	,	data = {};
	data.ownerId = params[0];
	data.path 	= params[1] ? params[1].match(/[^\/\\]+/g) : [];
	data.range 	= 0;
	data.path.push('/');

	data.fullPath = data.ownerId + '/' + params[1];
	var callback = function(error, zipFile) {

		if(!error) {
			header["Content-Disposition"] 	= 'attachment; filename="' + zipFile.name + '"';
			response.writeHead(200, header);
			response.write(zipFile.data, "binary");
		}
		else
			response.send(error);
		response.end();
	}

	if(data.ownerId && data.path)
		provider.zip(data, callback);
	else {
		response.send('folder not found');
		response.end();
	}

}

/**
 * Upload a file from a post multipart form
 * @param  {object} request
 * @param  {object} response
 */
file.post.upload = function(request, response) {
	var params = request.params
    ,   query = request.query
	,	body = request.body
    ,   files = request.files
	,	witness = true
	,	uploadData = {
		ownerId: request.ownerId,
		creatorId: request.userId,
		path: params[1] ? params[1] + '/' : '/',
		data: files.file
	};

	for(var i in uploadData)
		witness = typeof uploadData[i] == 'undefined' ? false : witness;

	if(!witness)
		response.send({'information': 'An error has occurred - missing information', 'data' : uploadData });
	else {

		uploadData.fullPath = uploadData.ownerId + uploadData.path + uploadData.data.originalFilename;

		var path = uploadData.path
		,	logicPath = typeof path != 'undefined' && path != '/' ? path : '/'

		subscribeProvider.get.actualSubscription(uploadData.ownerId, function(error, subscribe) {
			if(!error && subscribe && subscribe.id)
				planProvider.get.byId(subscribe.planid, function(error, plan) {
					if(!error && plan && plan.id)
						directoryProvider.get.totalSize(uploadData.ownerId, function(error, totalSize) {
							if(!error && totalSize)
								if((totalSize.length == 0 && uploadData.data.size <= plan.storage) || (totalSize[0] && (totalSize[0].size + uploadData.data.size) <= plan.storage))
									if(uploadData.creatorId == uploadData.ownerId)
										uploadAuthorized();
									else {
										uploadData.fullPath = uploadData.fullPath.slice(-1) != '/' ? uploadData.fullPath : uploadData.fullPath.slice(0, -1);
										sharingProvider.checkRight({fullPath: uploadData.fullPath, targetId: uploadData.creatorId}, function(error, data) {
											if(!error && data && data.right == 'W')
												uploadAuthorized();
											else
												response.send({'information': 'An error has occured - method not allowed', 'data' : uploadData });
										})
									}
								else
									response.send({'information': 'An error has occurred - your cubbyhole is full', 'data' : uploadData });
							else
								response.send({'information': 'An error has occurred - error getting the current used space', 'data' : uploadData });
						})
					else
						response.send({'information': 'An error has occurred - error getting your actual plan', 'data' : uploadData });
				})
			else
				response.send({'information': 'An error has occurred - error getting your actual subscription', 'data' : uploadData });
		})
	}

	function uploadAuthorized() {

		userProvider.bandwidth(uploadData.creatorId, function(error, user) {
			var row = user.id + ';' + user.upload + ';' + user.download + ';' + request.client.remotePort + ';upload\n';
			if(config.limit_file && !error && user.id)
				fs.appendFile(config.limit_file, row, function (error) {
					if(error)
						throw 'an error occured';
				});
		})

        userProvider.get.byId(uploadData.creatorId, function(error, data) {
        	if(!error && data) {
        		uploadData.creatorName = data.firstname + ' ' + data.lastname;
        		uploadData.name = uploadData.data.originalFilename;
        		uploadData.size = uploadData.data.size;
        		uploadData.type = uploadData.data.type;

        		directoryProvider.create.file(uploadData, function(error, data) {
        			delete uploadData.data.ws;
		            if(!error) {
						historicProvider.create.event({
							ownerId: uploadData.creatorId,
							targetOwner: uploadData.fullPath.split('/')[0],
							fullPath: uploadData.fullPath,
							action: 'create',
							name: uploadData.name,
							itemType: 'file'
						});

						storageProvider.update.value(uploadData.ownerId, uploadData.data.size, function(error, updated) {
							if(error) console.log(error);
						});

						sharingProvider.isShared(uploadData.fullPath, function(data) {
							if(data.length > 0)
								for(var i = 0; i<data.length; i++)
									socket.send(data[i]._id, 'create_file', uploadData);
						});

						socket.send('user_'+uploadData.ownerId, 'create_file', uploadData);

						response.send({'information': 'file uploaded', 'data' : uploadData });
		            }
		            else
		                response.send({'information': 'An error has occured - error creating directory file - ' + error, 'data' : uploadData });
		        })
        	}
        	else
        		response.send({'information': 'An error has occured - error getting creator name - ' + error, 'data' : uploadData });
        })
	}
}

/**
 * Get a zip of files. You must specify an array of fullpaths without ids in the body.
 *
 * ex: ["/xxx", "/xxx/xx", .. ]
 *
 * @param  {object} request
 * @param  {object} response
 */
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
		else
			response.send(error);
		response.end();
		response.end();
	}
	if(data.ownerId && data.path)
		provider.zipItems(data, callback);
	else {
		response.send('folder not found');
		response.end();
	}

}

module.exports = file;