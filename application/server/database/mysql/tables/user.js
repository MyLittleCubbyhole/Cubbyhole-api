var Mysql = require(global.paths.server + '/database/mysql/core')
,	tools = require(global.paths.server + '/database/tools/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };
tools.init();

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `user`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `user` where `id` = '+ parseInt(id, 10) +';', callback);
}

provider.get.byEmail = function(email, callback) {
	Mysql.query('select * from `user` where `email`="'+ email + '";', callback);
}

provider.get.namesByIds = function(ids, callback) {
	var query = 'select concat(firstname, " ", lastname) as creator from `user` where `id` IN (';
	for(var i = 0; i < ids.length; i++) {
		query += parseInt(ids[i], 10);
		if(i != ids.length - 1)
			query += ', ';
	}
	query += ');'

	Mysql.query(query, callback);
}

/********************************[  CREATE   ]********************************/


provider.create.user = function(user, callback) {
	provider.get.byEmail(user.email, function(error, data) {
		if(!data || data.length == 0) {
			try {
				var query = 'insert into `user` (`password`, `salt`, `firstname`, `lastname`, `inscriptiondate`, `birthdate`, `email`, `country`, `activated`, `ROLEID`) values (';
				tools.generatePassword(user.password, function(data) {
					query += '"' + data.password + '","' + data.salt + '","' + user.firstname + '","' + user.lastname + '", NOW(),"' + user.birthdate + '", "'+user.email+'", "' + user.country + '", ' + (user.activated ? 1 : 0) + ', ' + user.roleId + ')';
					Mysql.query(query, callback);
				})
			}
			catch(exception) { callback.call(this, 'user creation failed - ' + exception); }
		}
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

provider.update.informations = function(user, callback) {
	Mysql.query('update `user` set `firstname`="' + user.firstname + '", `lastname`="' + user.lastname + '", `birthdate`="' + user.birthdate + '", `country`="' + user.country + '" where `id`=' + parseInt(user.id, 10) + ';', callback);
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

provider.connectById = function(id, password, callback) {
	provider.get.byId(id, function(error, user) {
		var goodPassword = user.password ? tools.checkPassword(password, user.password, user.salt) : false;
		var userResult = (user.activated && goodPassword) ? user : null;
		callback(error, userResult);
	});
}

module.exports = provider;