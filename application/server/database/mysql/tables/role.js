var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `role`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `role` where `ID` = '+ parseInt(id, 10) +';', callback);
}

provider.get.byTitle = function(title, callback) {
	Mysql.query('select * from `role` where `TITLE`="'+ title + '";', callback);
}
/********************************[  CREATE   ]********************************/


provider.create.role = function(title, callback) {

	Mysql.query('insert into `role` (`TITLE`) values ("' + title + '")', callback);
}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `role` where `ID`='+ parseInt(id, 10) + ';', callback);
}

module.exports = provider;