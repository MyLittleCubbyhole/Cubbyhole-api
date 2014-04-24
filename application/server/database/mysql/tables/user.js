var Mysql = require(global.paths.server + '/database/mysql/core')
,	tools = require(global.paths.server + '/database/tools/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `user`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `user` where `id` = '+ parseInt(id, 10) +';', callback);
}

provider.get.byUsername = function(username, callback) {
	Mysql.query('select * from `user` where `username`="'+ username + '";', callback);
}

provider.get.byEmail = function(email, callback) {
	Mysql.query('select * from `user` where `email`="'+ email + '";', callback);
}

/********************************[  CREATE   ]********************************/


provider.create.user = function(user, callback) {
	provider.get.byUsername(user.username, function(error, data) {
		if(!data || data.length == 0)
			provider.get.byEmail(user.email, function(error, data) {
				if(!data || data.length == 0) {
					try {
						var query = 'insert into `user` (`username`, `password`, `salt`, `firstname`, `lastname`, `inscriptiondate`, `birthdate`, `email`, `country`, `activated`, `ROLEID`) values (';
						tools.generatePassword(user.password, function(data) {
							query += '"' + user.username + '","' + data.password + '","' + data.salt + '","' + user.firstname + '","' + user.lastname + '", NOW(),"' + user.birthdate + '", "'+user.email+'", "' + user.country + '", ' + (user.activated ? 1 : 0) + ', ' + user.roleId + ')';
							Mysql.query(query, callback);
						})
					}
					catch(exception) { callback.call(this, 'user creation failed - ' + exception); }
				}
				else
					callback.call(this, 'user already exist');
			})
		else
			callback.call(this, 'user already exist');

	})

}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `user` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

provider.update.password = function(user, callback) {
	tools.generatePassword(user.password, function(data) {

		Mysql.query('update `user` set `password`="' + data.password + '", `salt`="' + data.salt + '" where `id`=' + parseInt(user.id, 10) + ';', callback);
	})
}

provider.update.activated = function(user, callback) {
	Mysql.query('update `user` set `activated`=' + (user.activated ? 1 : 0) + ' where `id`=' + parseInt(user.id, 10) + ';', callback);
}

/********************************[  OTHERS   ]********************************/

provider.connect = function(email, password, callback) {
	provider.get.byEmail(email, function(error, user) {
		var goodPassword = user.password ? tools.checkPassword(password, user.password, user.salt) : false;
		var userResult = (user.activated && goodPassword) ? user : null;
		callback(error, userResult);
	});
}

module.exports = provider;