var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `token`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `token` where `ID` = "'+ id +'";', callback);
}

/********************************[  CREATE   ]********************************/


provider.create.token = function(token, callback) {
	var query = 'insert into `token` (`ID`, `EXPIRATIONDATE`,`ORIGIN`,`USERID`) values (';
	query += '"' + token.id + '","' + token.expirationDate + '","' + token.origin + '",' + parseInt(token.userId, 10) + ')';
	Mysql.query(query, callback);
}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `token` where `ID`= "'+ id + '";', callback);
}

/********************************[  UPDATE   ]********************************/


module.exports = provider;