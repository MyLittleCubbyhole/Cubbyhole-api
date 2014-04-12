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

	var query = 'insert into `user` (`USERNAME`, `PASSWORD`, `SALT`, `FIRSTNAME`, `LASTNAME`, `INSCRIPTIONDATE`, `BIRTHDATE`, `EMAIL`, `ROLEID`) values (';
	tools.generatePassword(user.password, function(data) {

		query += '"' + user.username + '","' + data.password + '","' + data.salt + '","' + user.firstname + '","' + user.lastname + '", NOW(),"' + user.birthdate + '", "'+user.email+'", ' + user.roleId + ')';
		Mysql.query(query, callback);
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

/********************************[  OTHERS   ]********************************/

provider.connect = function(username, password) {
	provider.get.byUsername(username, function(user) {
		tools.checkPassword(password, user.PASSWORD, user.SALT);
	});
}

module.exports = provider;