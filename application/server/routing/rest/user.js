var userProvider = require(global.paths.server + '/database/mysql/tables/user')
, 	tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,	routingTools = require(global.paths.server + '/routing/tools/core')
,	mysqlTools = require(global.paths.server + '/database/tools/mysql/core')
,	user = { get : {}, post : {}, put : {}, delete : {} };


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

/********************************[  POST  ]********************************/

user.post.create = function(request, response){
	var params = request.params
	,	body = request.body
	,	witness = true
	,	user = {
		username: body.username,
		password: body.password,
		firstname: body.firstname,
		lastname: body.lastname,
		email: body.email,
		birthdate: body.birthdate,
		country: body.country,
		roleId: body.roleId
	};

	routingTools.addAccessControlHeaders(response);

	for(var i in user)
		witness = typeof user[i] == 'undefined' ? true : witness;

	if(!witness)
		response.send({'information': 'An error has occurred - missing information', 'user' : user });
	else
		userProvider.create.user(user, function(error, data){
			if(data)
				user.id = data.insertId;
			console.log(error)
			response.send({'information': (!error ? 'user created' : 'An error has occurred - ' + error), 'user' : user });
		})

}

user.post.authenticate = function(request, response) {
	var params = request.params
	,	body = request.body
	,	witness = true;

	routingTools.addAccessControlHeaders(response);

	witness = body.email && body.password ? witness : false;

	if(!witness)
		response.send({'information': 'An error has occurred - missing information', 'email' : body.email, 'password' : bodu.password });
	else
		userProvider.connect(body.email, body.password, function(error, data) {
			if(data) {
				mysqlTools.generateRandomBytes(32, function(tokenId) {
					var token = {
						id: tokenId,
						expirationDate: new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '),
						origin: request.header("User-Agent"),
						userId: data.ID
					};
					tokenProvider.create.token(token, function(error, data) {
						if(!error) {
							response.send({"token" : tokenId});
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
/********************************[ DELETE ]********************************/



module.exports = user;