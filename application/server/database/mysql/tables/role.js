var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `role`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `role` where `id` = '+ parseInt(id, 10) +';', callback);
}

provider.get.byTitle = function(title, callback) {
	Mysql.query('select * from `role` where `title`="'+ title + '";', callback);
}
/********************************[  CREATE   ]********************************/


provider.create.role = function(title, callback) {

	Mysql.query('insert into `role` (`title`) values ("' + title + '")', callback);
}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `role` where `id`='+ parseInt(id, 10) + ';', callback);
}

module.exports = provider;