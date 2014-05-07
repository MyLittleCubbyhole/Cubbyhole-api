var userProvider = require(global.paths.server + '/database/mysql/tables/user')
,   subscribeProvider = require(global.paths.server + '/database/mysql/tables/subscribe')
,   planProvider = require(global.paths.server + '/database/mysql/tables/plan')
,   dailyQuotaProvider = require(global.paths.server + '/database/mysql/tables/dailyQuota')
,	directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
, 	tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,	mysqlTools = require(global.paths.server + '/database/tools/mysql/core')
,   mailer = require(global.paths.server + '/mailer/mails/core')
,   moment = require('moment')
,	user = { get : {}, post : {}, put : {}, delete : {} };
mysqlTools.init();


/********************************[  GET   ]********************************/

user.get.all = function(request, response) {

	userProvider.get.all(function(error, data){
		response.send( (!error ? data : error ) );
	})
}

user.get.byId = function(request, response) {
	var params 	= request.params;
	userProvider.get.byId(params.id, function(error, data){
		response.send( (!error ? data : error ) );
	})
}

user.get.currentPlan = function(request, response) {
    var params  = request.params;
    userProvider.get.byId(params.id, function(error, user){
        if(!error && user && user.id) {
            subscribeProvider.get.actualSubscription(user.id, function(error, subscription) {
                if(!error && subscription && subscription.id) {
                    planProvider.get.byId(subscription.planid, function(error, plan) {
                        if(!error && plan && plan.id) {
                            plan.datestart = subscription.datestart;
                            plan.dateend = subscription.dateend;
                            response.send(plan);
                        }
                        else
                            response.send({'information': 'An error has occurred - ' + error});
                    });
                } else
                    response.send({'information': 'An error has occurred - no subscription found'});
            })
        } else
            response.send({'information': 'An error has occurred - user not found'});
    })
}

user.get.usedQuota = function(request, response) {
    var params  = request.params;
    userProvider.get.byId(params.id, function(error, user){
        if(!error && user && user.id) {
            subscribeProvider.get.actualSubscription(user.id, function(error, subscription) {
                if(!error && subscription && subscription.id) {
                    dailyQuotaProvider.get.current(subscription.id, function(error, quota) {
                        if(!error && quota) {
                            delete(quota.id);
                            delete(quota.subscribeid);
                            response.send(quota);
                        }
                        else {
                            response.send({'information': 'An error has occurred - ' + error});
                        }
                    });
                } else
                    response.send({'information': 'An error has occurred - no subscription found'});
            })
        } else
            response.send({'information': 'An error has occurred - user not found'});
    })
}


user.get.checkToken = function(request, response) {
    response.writeHead(200);
    response.end();
};

user.get.activateAccount = function(request, response) {
    var query = request.query
    ,   witness = false;

    var token = query.token || 0;
    token = encodeURIComponent(token);

    tokenProvider.get.byId(token, function(error, dataToken) {
        if(dataToken) {
            if(dataToken.type == 'ACTIVATION')  {
                userProvider.get.byId(dataToken.userid, function(error, dataUser) {
                    if(!error) {
                        dataUser.activated = true;
                        dataUser.id = dataUser.id;
                        userProvider.update.activated(dataUser, function(error, dataUserUpdated) {
                            if(!error) {
                                response.writeHead(200);
                                response.end();
                            }
                            else {
                                console.log(error);
                                response.writeHead(401);
                                response.end();
                            }
                        });
                    }
                    else {
                        console.log(error);
                        response.writeHead(401);
                        response.end();
                    }
                });

                tokenProvider.delete.byId(token, function(error, data) {
                    if(error)
                        console.log(error);
                });

            } else {
                console.log('Token sended is not an activation token');
                response.writeHead(401);
                response.end();
            }
        } else {
            console.log('Token not found ' + token);
            response.writeHead(401);
            response.end();
        }

    });
};

user.get.logout = function(request, response) {
    var query  = request.query;
    if(query.token) {
        var token = encodeURIComponent(query.token);
        tokenProvider.delete.byId(token, function(error, data) {
            if(data && data.affectedRows && data.affectedRows >= 1)
                response.writeHead(200);
            else
                response.writeHead(500);

            response.end();
        });
    }
    else {
        response.writeHead(500);
        response.end();
    }

};

/********************************[  POST  ]********************************/

user.post.create = function(request, response){
	var params = request.params
	,	body = request.body
	,	witness = true
	,	user = {
		password: body.password,
		firstname: body.firstname,
		lastname: body.lastname,
		email: body.email,
		birthdate: moment(body.birthdate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
		country: body.country,
        activated: false,
		roleId: 1
	};

	for(var i in user)
		witness = typeof user[i] == 'undefined' ? false : witness;

	if(!witness)
		response.send({'information': 'An error has occurred - missing information', 'user' : user });
	else
		userProvider.create.user(user, function(error, data){
			if(data) {
				user.id = data.insertId;

                var sharedFolder = {
                    name: 'Shared',
                    ownerId: user.id,
                    path: '/',
                    fullPath: user.id + '/' + 'Shared',
                    undeletable: true
                };

                directoryProvider.create.folder(sharedFolder, function(error) {
                    if(!error) {

                        if(!error) {

                            var subscribe = {
                                userId: user.id,
                                planId: 1,
                                dateStart: moment().format('YYYY-MM-DD HH:mm:ss'),
                                dateEnd: moment().add('years', 1000).format('YYYY-MM-DD HH:mm:ss')
                            };

                            subscribeProvider.create.subscribe(subscribe, function(error, data) {
                                if(!error)
                                    mysqlTools.generateRandomBytes(32, function(tokenId) {
                                        tokenId = encodeURIComponent(tokenId);
                                        var token = {
                                            id: tokenId,
                                            expirationDate: moment().format('YYYY-MM-DD HH:mm:ss'),
                                            type: 'ACTIVATION',
                                            origin: request.header("User-Agent"),
                                            userId: user.id
                                        };
                                        tokenProvider.create.token(token, function(error, dataToken) {
                                            if(!error) {
                                                response.send({'information': (!error ? 'user created' : 'An error has occurred - ' + error), 'user': user });
                                                mailer.sendActivationMail(user.email, user.firstname, tokenId);
                                            } else
                                                response.send({'information': 'An error has occurred - ' + error, 'user' : user });
                                        });
                                    });
                                else
                                    response.send({'information': 'An error has occurred - ' + error, 'user' : user });
                            });
                        }

                    } else
                        response.send({'information': 'An error has occurred - ' + error, 'user' : user });

                })
			}
			else {
				console.log(error);
				response.send({'information': 'An error has occurred - ' + error, 'user' : user });
			}

		})

}

user.post.authenticate = function(request, response) {
	var params = request.params
	,	body = request.body
	,	witness = true;

	witness = body.email && body.password ? witness : false;

	if(!witness)
		response.send({'information': 'An error has occurred - missing information', 'email' : body.email, 'password' : body.password });
	else
		userProvider.connect(body.email, body.password, function(error, dataUser) {
			if(dataUser) {
				mysqlTools.generateRandomBytes(32, function(tokenId) {
					tokenId = encodeURIComponent(tokenId);
					var token = {
						id: tokenId,
						expirationDate: moment().add('days', 1).format('YYYY-MM-DD HH:mm:ss'),
                        type: 'AUTHENTICATION',
						origin: request.header("User-Agent"),
						userId: dataUser.id
					};
					tokenProvider.create.token(token, function(error, dataToken) {
						if(!error) {
							dataUser.token = tokenId;
							delete(dataUser.password);
							delete(dataUser.salt);
							response.send({'user' : dataUser});
						} else
							response.send({'information' : 'An error has occurred - ' + error});
					});
				});
			} else {
				response.send({'information' : 'An error has occurred - bad credentials'});
			}
		});


}

/********************************[  PUT   ]********************************/

user.put.byId = function(request, response){
    var params = request.params
    ,   body = request.body
    ,   witness = true
    ,   user = {
        id: params.id,
        password: body.password,
        firstname: body.firstname,
        lastname: body.lastname,
        birthdate: moment(body.birthdate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
        country: body.country
    };

    for(var i in user)
        witness = typeof user[i] == 'undefined' ? false : witness;

    user.newPassword = body.newPassword;

    if(!witness)
        response.send({'information': 'An error has occurred - missing information', 'user' : user });
    else
        userProvider.connectById(user.id, user.password, function(error, dataUser) {
            if(!error && dataUser) {
                user.id = dataUser.id;
                userProvider.update.informations(user, function(error, data) {
                    if(!error && data) {
                        delete(dataUser.salt);
                        dataUser.password = user.newPassword;
                        dataUser.firstname = user.firstname;
                        dataUser.lastname = user.lastname;
                        dataUser.birthdate = user.birthdate;
                        dataUser.country = user.country;

                        if(dataUser.password) {
                            userProvider.update.password(dataUser, function(error, data) {
                                if(!error && data) {
                                    delete(dataUser.password);
                                    response.send({'information': (!error ? 'user updated' : 'An error has occurred - ' + error), 'user': dataUser });
                                } else
                                    response.send({'information' : 'Error updating user password - ' + error});
                            })
                        } else {
                            delete(dataUser.password);
                            response.send({'information': (!error ? 'user updated' : 'An error has occurred - ' + error), 'user': dataUser });
                        }
                    } else
                        response.send({'information' : 'Error updating user informations - ' + error});

                })
            } else
                response.send({'information' : 'An error has occurred - bad credentials'});
        })

}

/********************************[ DELETE ]********************************/



module.exports = user;