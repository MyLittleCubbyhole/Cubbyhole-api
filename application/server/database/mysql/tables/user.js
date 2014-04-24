var Mysql = require(global.paths.server + '/database/mysql/core')
,	tools = require(global.paths.server + '/database/tools/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `user`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `user` where `ID` = '+ parseInt(id, 10) +';', callback);
}

provider.get.byUsername = function(username, callback) {
	Mysql.query('select * from `user` where `USERNAME`="'+ username + '";', callback);
}

provider.get.byEmail = function(email, callback) {
	Mysql.query('select * from `user` where `EMAIL`="'+ email + '";', callback);
}

/********************************[  CREATE   ]********************************/


provider.create.user = function(user, callback) {
	console.log('user - create - init');
	provider.get.byUsername(user.username, function(error, data) {
		console.log('user - test exist - username');

		if(!data || data.length == 0)
			provider.get.byEmail(user.email, function(error, data) {
				console.log('user - test exist - email');
				if(!data || data.length == 0) {
					try {
						var query = 'insert into `user` (`USERNAME`, `PASSWORD`, `SALT`, `FIRSTNAME`, `LASTNAME`, `INSCRIPTIONDATE`, `BIRTHDATE`, `EMAIL`, `COUNTRY`, `ACTIVATED`, `ROLEID`) values (';
						tools.generatePassword(user.password, function(data) {
							console.log('generatePassword');
							query += '"' + user.username + '","' + data.password + '","' + data.salt + '","' + user.firstname + '","' + user.lastname + '", NOW(),"' + user.birthdate + '", "'+user.email+'", "' + user.country + '", ' + (user.activated ? 1 : 0) + ', ' + user.roleId + ')';
							Mysql.query(query, callback);
						})
						console.log(query);
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
	Mysql.query('delete from `user` where `ID`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

provider.update.password = function(user, callback) {
	tools.generatePassword(user.password, function(data) {

		Mysql.query('update `user` set `PASSWORD`="' + data.password + '", `SALT`="' + data.salt + '" where `ID`=' + parseInt(user.id, 10) + ';', callback);
	})
}

provider.update.activated = function(user, callback) {
	Mysql.query('update `user` set `ACTIVATED`=' + (user.activated ? 1 : 0) + ' where `ID`=' + parseInt(user.id, 10) + ';', callback);
}

/********************************[  OTHERS   ]********************************/

provider.connect = function(email, password, callback) {
	provider.get.byEmail(email, function(error, user) {
		var goodPassword = user.PASSWORD ? tools.checkPassword(password, user.PASSWORD, user.SALT) : false;
		var userResult = (user.ACTIVATED && goodPassword) ? user : null;
		callback(error, userResult);
	});
}

module.exports = provider;