var userProvider = require(global.paths.server + '/database/mysql/tables/user')
,   subscribeProvider = require(global.paths.server + '/database/mysql/tables/subscribe')
,   paymentProvider = require(global.paths.server + '/database/mysql/tables/payment')
,   planProvider = require(global.paths.server + '/database/mysql/tables/plan')
,   dailyQuotaProvider = require(global.paths.server + '/database/mysql/tables/dailyQuota')
,   directoryProvider = require(global.paths.server + '/database/mongodb/collections/fs/directory')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
, 	tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,   mysqlTools = require(global.paths.server + '/database/tools/mysql/core')
,	httpTools = require(global.paths.server + '/routing/tools/http/core')
,   mailer = require(global.paths.server + '/mailer/mails/core')
,   moment = require('moment')
,   config = require(global.paths.server + '/config/core').get()
,	user = { get : {}, post : {}, put : {}, delete : {} };
mysqlTools.init();


/********************************[  GET   ]********************************/

user.get.all = function(request, response) {

	userProvider.get.all(function(error, data) {
        var users = [];
        if(data && (data.length > 0 || data.id)) {

            if(data && data.id)
                users.push(data);
            else
                users = data;

            for(var i = 0; i < users.length; i++) {
                delete(users[i].password);
                delete(users[i].salt);
            }
        }
		response.send( (!error ? users : error ) );
	})
}

user.get.byId = function(request, response) {
	var params 	= request.params;
	userProvider.get.byId(params.id, function(error, data){
        if(!error && data && data.id) {
            delete(data.password);
            delete(data.salt);
        }

		response.send( (!error ? data : error ) );
	})
}

user.get.byEmail = function(request, response) {
    var params  = request.params;
    userProvider.get.byEmail(params.email, function(error, data){
        if(!error && data && data.id) {
            delete (data.password);
            delete (data.salt);
            response.send(data);
        }
        else
            response.send({"information": "user does not exists"});
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

user.get.usersBySharing = function(request, response) {
    var params  = request.params
    ,   fullPath  = params[0];

    userProvider.get.usersBySharing(fullPath, function(error, data) {
        if(!error) {
            response.send(data);
        }
        else
            response.send({'information': error });
        response.end();
    });
}

user.get.historic = function(request, response) {
    var params  = request.params
    ,   query = request.query
    ,   parameters = {};
    parameters.userId = parseInt(params.id);
    parameters.offset = params.offset;
    parameters.limit = params.limit;

    if(parameters.userId != request.userId) {
        response.send({'information': 'An error has occurred - method not allowed'}, 401);
        return;
    }

    userProvider.get.historic(parameters, function(error, data) {

        if(!error) {
            response.send(data);
        }
        else
            response.send({'information': error });
        response.end();
    });
}

/********************************[  POST  ]********************************/

user.post.create = function(request, response){
	var params = request.params
    ,   query = request.query
	,	body = request.body
    ,   files = request.files
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

    if(files && files.photo && files.photo.originalFilename)
        user.photoData = files.photo;

	if(!witness)
		response.send({'information': 'An error has occurred - missing information', 'user' : user });
	else {

        var callback = function(photo) {
            user.photo = photo;
            delete(user.photoData);
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
                                                    if(query.redirectSuccess)
                                                        response.redirect(query.redirectSuccess);
                                                    else
                                                        response.send({'information': (!error ? 'user created' : 'An error has occurred - ' + error), 'user': user });

                                                    mailer.sendActivationMail(user.email, user.firstname, tokenId);
                                                } else {
                                                    if(query.redirectError)
                                                        response.redirect(query.redirectError);
                                                    else
                                                        response.send({'information': 'An error has occurred - ' + error, 'user' : user });
                                                }
                                            });
                                        });
                                    else {
                                        if(query.redirectError)
                                            response.redirect(query.redirectError);
                                        else
                                            response.send({'information': 'An error has occurred - ' + error, 'user' : user });
                                    }
                                });
                            }

                        } else {
                            if(query.redirectError)
                                response.redirect(query.redirectError);
                            else
                                response.send({'information': 'An error has occurred - ' + error, 'user' : user });
                        }

                    })
                }
                else {
                    console.log(error);
                    if(query.redirectError)
                        response.redirect(query.redirectError);
                    else
                        response.send({'information': 'An error has occurred - ' + error, 'user' : user });
                }
            })
        }

        if(user.photoData) {
            var name = new directoryProvider.get.objectId() + user.photoData.name.slice(user.photoData.name.lastIndexOf('.'));
            directoryProvider.create.file({fullPath: '1/userPhotos/' + name, path: '/userPhotos/', ownerId: 1, creatorId: 1, name: name, data: user.photoData}, function(error, data) {
                if(error)
                    console.log(error);
                else
                    callback(error ? null : name);
            })
        } else
            callback(null);
    }

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

user.post.subscribe = function(request, response) {
    var params = request.params
    ,   body = request.body
    ,   witness = true
    ,   subscribe = {
        userId: params.userId,
        planId: params.planId,
        dateStart: moment(body.dateStart, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss'),
        dateEnd: moment(body.dateEnd, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
    };

    for(var i in subscribe)
        witness = typeof subscribe[i] == 'undefined' ? false : witness;

    if(!witness)
        response.send({'information': 'An error has occurred - missing information', 'subscribe' : subscribe });
    else
        if(subscribe.planId != 1)
            if(moment(subscribe.dateStart).isAfter() || moment(subscribe.dateStart).isSame())
                if(moment(subscribe.dateStart).isBefore(moment(subscribe.dateEnd)))
                    userProvider.get.byId(subscribe.userId, function(error, user) {
                        if(!error && user && user.id)
                            planProvider.get.byId(subscribe.planId, function(error, plan) {
                                if(!error && plan && plan.id)
                                    subscribeProvider.create.subscribe(subscribe, function(error, data) {
                                        if(!error && data) {
                                            subscribe.id = data.insertId;
                                            response.send({'information' : 'subscribe created', 'subscribe': subscribe});
                                        } else
                                            response.send({'information' : 'An error has occurred - ' + error});
                                    })
                                else
                                    response.send({'information' : 'An error has occurred - plan not found'});
                            })
                        else
                            response.send({'information' : 'An error has occurred - user not found'});
                    })
                else
                    response.send({'information' : 'An error has occurred - dateEnd must be after dateStart'});
            else
                response.send({'information' : 'An error has occurred - dateStart must be after now'});
        else
            response.send({'information' : 'An error has occurred - you can\'t subscribe to the free plan'});
}

user.post.paypalNotify = function(request, response) {

    var body = request.body;

    httpTools.processPaypalIpn(request, response, function(error) {
        if(!error) {
            var result = {
                id: body.txn_id,
                status: body.payment_status,
                amount: parseFloat(body.mc_gross),
                duration: parseInt(body.quantity, 10),
                currency: body.mc_currency,
                date: moment(new Date(body.payment_date)).format('YYYY-MM-DD HH:mm:ss'),
                email: body.payer_email,
                businessEmail: body.business,
                userId: parseInt(body.custom, 10),
                planId: parseInt(body.item_number, 10)
            }

            if(result.status == 'Completed')
                if(result.businessEmail == config['paypal_business_email'])
                    paymentProvider.get.byId(result.id, function(error, payment) {
                        if(error || !payment || !payment.id)
                            userProvider.get.byId(result.userId, function(error, user) {
                                if(!error && user)
                                    planProvider.get.byId(result.planId, function(error, plan) {
                                        if(!error && plan)
                                            if(result.amount == parseFloat(plan.price, 10) * result.duration)
                                                paymentProvider.create.payment(result, function(error, payment) {
                                                    if(error)
                                                        console.log('An error has occurred - registration of the payment has failed')

                                                    subscribeProvider.get.actualSubscription(result.userId, function(error, actualSubscription) {
                                                        if(!error && actualSubscription && actualSubscription.id) {
                                                            if(actualSubscription.id != 1) {
                                                                actualSubscription.remainingtime = moment(actualSubscription.dateend).valueOf() - moment().valueOf();
                                                                actualSubscription.paused = true;
                                                            }

                                                            subscribeProvider.update.pause(actualSubscription, function(error, data) {
                                                                if(!error && data) {
                                                                    result.dateStart = moment().format('YYYY-MM-DD HH:mm:ss');
                                                                    result.dateEnd = moment().add('months', result.duration).format('YYYY-MM-DD HH:mm:ss');
                                                                    subscribeProvider.create.subscribe(result, function(error, subscribe) {
                                                                        if(error)
                                                                            console.log('An error has occurred - registration of the subscription has failed')
                                                                        else
                                                                            console.log('Payment processed - ' + result.amount + result.currency + ' from ' + result.email);
                                                                    })
                                                                } else
                                                                    console.log('An error has occurred - error pausing actual subscription');
                                                            })
                                                        }
                                                        else
                                                            console.log('An error has occurred - error getting actual subscription - ' + error);
                                                    })
                                                })
                                            else
                                                console.log('An error has occurred - the amount paid is incorrect');
                                        else
                                            console.log('An error has occurred - plan does not exists');
                                    })
                                else
                                    console.log('An error has occurred - user does not exists');
                            })
                        else
                            console.log('An error has occurred - payment already processed');
                    })
                else
                    console.log('An error has occurred - the business email is incorrect');
            else
                console.log('An error has occurred - payment status is not Completed - ' + result.status);
        } else
            console.log(error);
    })
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

user.put.promote = function(request, response) {
    var params = request.params;

    userProvider.get.byId(params.id, function(error, user) {
        if(!error && user && user.id) {
            if(request.userId != user.id) {
                user.roleId = 2;
                userProvider.update.role(user, function(error, data) {
                    user.roleid = user.roleId;
                    delete(user.roleId);
                    delete(user.password);
                    delete(user.salt);
                    response.send({'information': (!error ? 'user role updated' : 'An error has occurred - ' + error), 'user': user });
                });
            } else
                response.send({'information' : 'An error has occurred - you can`t update your own role'});
        }
        else
            response.send({'information' : 'An error has occurred - user not found'});
    })

}

user.put.demote = function(request, response) {
    var params = request.params;

    userProvider.get.byId(params.id, function(error, user) {
        if(!error && user && user.id) {
            if(request.userId != user.id) {
                user.roleId = 1;
                userProvider.update.role(user, function(error, data) {
                    user.roleid = user.roleId;
                    delete(user.roleId);
                    delete(user.password);
                    delete(user.salt);
                    response.send({'information': (!error ? 'user role updated' : 'An error has occurred - ' + error), 'user': user });
                });
            } else
                response.send({'information' : 'An error has occurred - you can`t update your own role'});
        }
        else
            response.send({'information' : 'An error has occurred - user not found'});
    })

}

/********************************[ DELETE ]********************************/



module.exports = user;