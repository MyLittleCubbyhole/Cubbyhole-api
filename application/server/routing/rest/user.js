var userProvider = require(global.paths.server + '/database/mysql/tables/user')
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
		roleId: body.roleId
	};

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

/********************************[  PUT   ]********************************/
/********************************[ DELETE ]********************************/



module.exports = user;